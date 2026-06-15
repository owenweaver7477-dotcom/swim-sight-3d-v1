-- Swim Sight 3D V1 true AI queue and concurrency controls.
-- Adds queue metadata and Postgres-side claim helpers so multiple Vercel
-- function instances cannot dispatch more AI jobs than the configured limit.

alter table public.ai_processing_jobs
  add column if not exists queue_status text,
  add column if not exists priority integer not null default 5,
  add column if not exists queued_at timestamptz,
  add column if not exists dispatched_at timestamptz,
  add column if not exists dispatch_attempted_at timestamptz,
  add column if not exists dispatch_error text,
  add column if not exists queue_position integer,
  add column if not exists active_slot_claimed_at timestamptz,
  add column if not exists concurrency_group text not null default 'default',
  add column if not exists queued_reason text;

update public.ai_processing_jobs
set
  queue_status = coalesce(
    queue_status,
    case
      when status::text = 'queued' then 'queued'
      when status::text in (
        'accepted',
        'running',
        'downloading_video',
        'extracting_frames',
        'running_pose_detection',
        'analysing_stroke',
        'generating_outputs',
        'callback_sending'
      ) then 'processing'
      when status::text = 'completed' then 'completed'
      when status::text = 'retry_available' then 'retry_available'
      when status::text in ('manual_review', 'manual_review_recommended', 'unreliable_pose') then 'manual_review'
      when status::text = 'timed_out' then 'timed_out'
      when status::text = 'cancelled' then 'cancelled'
      when status::text = 'error' then 'failed'
      else status::text
    end
  ),
  queued_at = coalesce(queued_at, created_at, now()),
  concurrency_group = coalesce(concurrency_group, 'default');

create index if not exists ai_processing_jobs_queue_status_idx
  on public.ai_processing_jobs(queue_status);

create index if not exists ai_processing_jobs_queued_at_idx
  on public.ai_processing_jobs(queued_at);

create index if not exists ai_processing_jobs_priority_queued_at_idx
  on public.ai_processing_jobs(priority, queued_at);

create index if not exists ai_processing_jobs_queue_position_idx
  on public.ai_processing_jobs(queue_position);

create index if not exists ai_processing_jobs_concurrency_group_idx
  on public.ai_processing_jobs(concurrency_group);

create index if not exists ai_processing_jobs_active_slot_claimed_at_idx
  on public.ai_processing_jobs(active_slot_claimed_at);

create or replace function public.refresh_ai_queue_positions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ranked as (
    select
      id,
      row_number() over (
        order by priority asc nulls last, queued_at asc nulls last, created_at asc
      )::integer as position
    from public.ai_processing_jobs
    where queue_status = 'queued'
      and status::text = 'queued'
      and coalesce(retryable, true) = true
  )
  update public.ai_processing_jobs jobs
  set queue_position = ranked.position
  from ranked
  where jobs.id = ranked.id;

  update public.ai_processing_jobs
  set queue_position = null
  where queue_status is distinct from 'queued'
    and queue_position is not null;
end;
$$;

create or replace function public.claim_next_ai_job(
  p_max_active integer default 1,
  p_dispatcher text default 'vercel'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
  claimed_job_id uuid;
  max_active integer;
begin
  max_active := greatest(coalesce(p_max_active, 1), 1);

  perform pg_advisory_xact_lock(hashtext('swim_sight_ai_queue_default'));

  select count(*)
  into active_count
  from public.ai_processing_jobs
  where (
    queue_status in ('dispatching', 'dispatched', 'processing')
    or status::text in (
      'accepted',
      'running',
      'downloading_video',
      'extracting_frames',
      'running_pose_detection',
      'analysing_stroke',
      'generating_outputs',
      'callback_sending'
    )
  );

  if active_count >= max_active then
    perform public.refresh_ai_queue_positions();
    return null;
  end if;

  select id
  into claimed_job_id
  from public.ai_processing_jobs
  where queue_status = 'queued'
    and status::text = 'queued'
    and coalesce(retryable, true) = true
  order by priority asc nulls last, queued_at asc nulls last, created_at asc
  limit 1
  for update skip locked;

  if claimed_job_id is null then
    perform public.refresh_ai_queue_positions();
    return null;
  end if;

  update public.ai_processing_jobs
  set
    queue_status = 'dispatching',
    dispatch_attempted_at = now(),
    active_slot_claimed_at = now(),
    lease_owner = coalesce(p_dispatcher, 'vercel'),
    lease_expires_at = now() + interval '15 minutes',
    updated_at = now()
  where id = claimed_job_id;

  perform public.refresh_ai_queue_positions();
  return claimed_job_id;
end;
$$;

revoke all on function public.refresh_ai_queue_positions() from public, anon, authenticated;
revoke all on function public.claim_next_ai_job(integer, text) from public, anon, authenticated;

grant execute on function public.refresh_ai_queue_positions() to service_role;
grant execute on function public.claim_next_ai_job(integer, text) to service_role;

select public.refresh_ai_queue_positions();

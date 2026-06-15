-- Swim Sight 3D V1 production AI job engine reliability.
-- Backwards-compatible durability fields for retries, acceptance tracking,
-- callback diagnostics, and timed-out job recovery.
--
-- Requires 015a_v1_ai_job_status_enum_values.sql to have completed first.

alter table public.ai_processing_jobs
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists timed_out_at timestamptz,
  add column if not exists last_error text,
  add column if not exists error_code text,
  add column if not exists retryable boolean not null default true,
  add column if not exists render_acceptance_status text,
  add column if not exists callback_status text,
  add column if not exists lease_owner text,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists locked_at timestamptz;

update public.ai_processing_jobs
set
  attempt_count = greatest(
    coalesce(attempt_count, 0),
    case
      when retry_count is not null then retry_count + 1
      when created_at is not null then 1
      else 0
    end
  ),
  max_attempts = greatest(coalesce(max_attempts, 3), 1),
  last_error = coalesce(last_error, error_message),
  failed_at = coalesce(
    failed_at,
    case when status in ('error', 'timed_out') then coalesce(completed_at, updated_at, created_at) else null end
  ),
  timed_out_at = coalesce(
    timed_out_at,
    case when status = 'timed_out' then coalesce(completed_at, updated_at, created_at) else null end
  ),
  retryable = case
    when status in ('completed') then false
    when coalesce(attempt_count, 0) >= coalesce(max_attempts, 3)
      and status in ('error', 'timed_out', 'retry_available') then false
    else coalesce(retryable, true)
  end,
  callback_status = coalesce(
    callback_status,
    case
      when callback_received then 'received'
      when status in ('queued', 'accepted', 'running', 'downloading_video', 'extracting_frames', 'running_pose_detection', 'analysing_stroke', 'generating_outputs', 'callback_sending') then 'waiting'
      else null
    end
  );

create index if not exists ai_processing_jobs_attempt_count_idx
  on public.ai_processing_jobs(attempt_count);

create index if not exists ai_processing_jobs_last_attempt_at_idx
  on public.ai_processing_jobs(last_attempt_at);

create index if not exists ai_processing_jobs_retryable_idx
  on public.ai_processing_jobs(retryable);

create index if not exists ai_processing_jobs_callback_status_idx
  on public.ai_processing_jobs(callback_status);

create index if not exists ai_processing_jobs_render_acceptance_status_idx
  on public.ai_processing_jobs(render_acceptance_status);

create index if not exists ai_processing_jobs_lease_expires_at_idx
  on public.ai_processing_jobs(lease_expires_at);

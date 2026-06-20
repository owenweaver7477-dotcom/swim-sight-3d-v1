-- Swim Sight 3D safeguarding, consent, retention, and erasure foundations.
-- Additive and reversible. REQUIRE_CONSENT remains an application env flag and
-- defaults off until production is ready to enforce the consent step.

create table if not exists public.swimmer_consent_records (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  swimmer_id uuid not null references public.swimmers(id) on delete cascade,
  is_minor boolean not null default false,
  consent_status text not null default 'none',
  guardian_name text,
  guardian_email text,
  consent_granted_at timestamptz,
  consent_source text,
  consent_withdrawn_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (swimmer_id),
  constraint swimmer_consent_status_check
    check (consent_status in ('none', 'granted', 'withdrawn'))
);

create index if not exists swimmer_consent_records_club_id_idx
  on public.swimmer_consent_records(club_id);
create index if not exists swimmer_consent_records_swimmer_id_idx
  on public.swimmer_consent_records(swimmer_id);

drop trigger if exists swimmer_consent_records_set_updated_at
  on public.swimmer_consent_records;
create trigger swimmer_consent_records_set_updated_at
before update on public.swimmer_consent_records
for each row execute function public.set_updated_at();

alter table public.swimmer_consent_records enable row level security;

drop policy if exists "swimmer_consent_records_select_coaches"
  on public.swimmer_consent_records;
drop policy if exists "swimmer_consent_records_manage_coaches"
  on public.swimmer_consent_records;

-- Intentionally no browser/user RLS policy. Guardian contact is server-side
-- only and is accessed through authenticated API routes after club-role checks.
-- The service role bypasses RLS for those routes.

alter table public.video_uploads
  alter column file_path drop not null,
  add column if not exists raw_footage_deleted_at timestamptz,
  add column if not exists raw_footage_deletion_reason text,
  add column if not exists raw_footage_deleted_by uuid references auth.users(id) on delete set null;

alter table public.video_uploads
  drop constraint if exists video_uploads_upload_status_check;
alter table public.video_uploads
  add constraint video_uploads_upload_status_check
  check (
    upload_status is null
    or upload_status in (
      'preparing_upload',
      'uploading',
      'uploaded',
      'upload_failed',
      'pending_ai',
      'processing',
      'manual_review',
      'error',
      'deleted'
    )
  );

create index if not exists video_uploads_raw_footage_deleted_at_idx
  on public.video_uploads(raw_footage_deleted_at);

alter table public.reports
  add column if not exists data_erased_at timestamptz;

alter table public.swimmers
  add column if not exists data_erasure_requested_at timestamptz,
  add column if not exists data_erased_at timestamptz,
  add column if not exists data_erasure_requested_by uuid references auth.users(id) on delete set null;

create table if not exists public.data_deletion_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  swimmer_id uuid not null,
  requested_by uuid references auth.users(id) on delete set null,
  request_reason text,
  status text not null default 'requested',
  deleted_counts jsonb not null default '{}'::jsonb,
  error_code text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint data_deletion_events_status_check
    check (status in ('requested', 'completed', 'partial', 'failed'))
);

create index if not exists data_deletion_events_club_id_idx
  on public.data_deletion_events(club_id);
create index if not exists data_deletion_events_swimmer_id_idx
  on public.data_deletion_events(swimmer_id);

alter table public.data_deletion_events enable row level security;

drop policy if exists "data_deletion_events_select_admins"
  on public.data_deletion_events;
create policy "data_deletion_events_select_admins"
on public.data_deletion_events for select using (
  public.has_club_role(
    club_id,
    array['owner', 'admin']::public.club_member_role[]
  )
  or public.is_app_admin()
);

drop policy if exists "data_deletion_events_insert_coaches"
  on public.data_deletion_events;
create policy "data_deletion_events_insert_coaches"
on public.data_deletion_events for insert with check (
  public.has_club_role(
    club_id,
    array['owner', 'admin', 'coach']::public.club_member_role[]
  )
  or public.is_app_admin()
);

-- Swim Sight 3D V1 core Supabase schema.
-- Scope: auth/profile, club workspace, swimmers, private videos, AI jobs,
-- coach-reviewed reports/findings, safe public shared-report links.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.club_member_role as enum ('owner', 'admin', 'coach', 'assistant_coach', 'swimmer', 'parent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.video_processing_status as enum ('uploaded', 'queued_ai', 'processing_ai', 'completed', 'unreliable_pose', 'error', 'manual_review');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ai_job_status as enum ('queued', 'running', 'completed', 'unreliable_pose', 'error');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_status as enum ('draft', 'in_review', 'coach_approved', 'finalised', 'published', 'shared', 'error');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.finding_source as enum ('ai', 'coach', 'manual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.finding_approval_status as enum ('pending', 'approved', 'rejected', 'edited');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.shared_link_status as enum ('active', 'disabled', 'expired');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_profile_app_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = new.id and old.app_role is distinct from new.app_role then
    raise exception 'Users cannot change their own app_role';
  end if;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  app_role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.club_member_role not null default 'coach',
  linked_swimmer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create table if not exists public.club_invites (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  invite_code text not null unique,
  role public.club_member_role not null default 'coach',
  email text,
  swimmer_id uuid,
  max_uses integer,
  use_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.swimmers (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  squad_id uuid references public.squads(id) on delete set null,
  first_name text not null,
  last_name text not null default '',
  date_of_birth date,
  gender text,
  swimmer_email text,
  parent_email text,
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.club_members
  drop constraint if exists club_members_linked_swimmer_id_fkey;
alter table public.club_members
  add constraint club_members_linked_swimmer_id_fkey
  foreign key (linked_swimmer_id) references public.swimmers(id) on delete set null;

alter table public.club_invites
  drop constraint if exists club_invites_swimmer_id_fkey;
alter table public.club_invites
  add constraint club_invites_swimmer_id_fkey
  foreign key (swimmer_id) references public.swimmers(id) on delete set null;

create table if not exists public.video_uploads (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  swimmer_id uuid not null references public.swimmers(id) on delete cascade,
  squad_id uuid references public.squads(id) on delete set null,
  file_bucket text not null default 'private-videos',
  file_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size_bytes bigint,
  stroke_type text not null,
  camera_angle text not null,
  analysis_type text,
  processing_status public.video_processing_status not null default 'uploaded',
  analysis_session_id uuid,
  is_primary_angle boolean not null default true,
  sync_offset_seconds numeric,
  capture_device text,
  video_quality_rating text,
  review_context jsonb not null default '{}'::jsonb,
  ai_report_id uuid,
  ai_error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  video_upload_id uuid not null references public.video_uploads(id) on delete cascade,
  report_id uuid,
  server_job_id text,
  status public.ai_job_status not null default 'queued',
  stage text,
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  pose_reliability text,
  quality_flags jsonb not null default '[]'::jsonb,
  recommended_next_action text,
  detection_ratio numeric,
  frame_count_processed integer,
  detected_keypoints_count integer,
  stage_history jsonb not null default '[]'::jsonb,
  error_message text,
  callback_received boolean not null default false,
  callback_received_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  swimmer_id uuid not null references public.swimmers(id) on delete cascade,
  video_upload_id uuid references public.video_uploads(id) on delete set null,
  ai_processing_job_id uuid references public.ai_processing_jobs(id) on delete set null,
  status public.report_status not null default 'draft',
  stroke_type text not null,
  analysis_type text,
  analysis_mode text,
  real_pose_detected boolean not null default false,
  overall_score numeric,
  phase_breakdown jsonb not null default '{}'::jsonb,
  technical_summary text,
  coach_summary text,
  next_focus text,
  review_context jsonb not null default '{}'::jsonb,
  is_deleted boolean not null default false,
  finalised_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.video_uploads
  drop constraint if exists video_uploads_ai_report_id_fkey;
alter table public.video_uploads
  add constraint video_uploads_ai_report_id_fkey
  foreign key (ai_report_id) references public.reports(id) on delete set null;

alter table public.ai_processing_jobs
  drop constraint if exists ai_processing_jobs_report_id_fkey;
alter table public.ai_processing_jobs
  add constraint ai_processing_jobs_report_id_fkey
  foreign key (report_id) references public.reports(id) on delete set null;

create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  swimmer_id uuid references public.swimmers(id) on delete set null,
  video_upload_id uuid references public.video_uploads(id) on delete set null,
  source public.finding_source not null default 'coach',
  approval_status public.finding_approval_status not null default 'pending',
  severity text,
  stroke_phase text,
  timestamp_seconds numeric,
  observation text not null,
  why_it_matters text,
  correction_cue text,
  drill text,
  next_focus text,
  coach_notes text,
  ai_confidence numeric,
  raw_ai_payload jsonb,
  linked_standard_id uuid,
  linked_standard_title text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.key_frames (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  video_upload_id uuid not null references public.video_uploads(id) on delete cascade,
  timestamp_seconds numeric not null,
  label text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.shared_report_links (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  token text not null unique,
  status public.shared_link_status not null default 'active',
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  disabled_at timestamptz,
  disabled_by uuid references auth.users(id) on delete set null
);

create index if not exists club_members_club_id_idx on public.club_members(club_id);
create index if not exists club_members_user_id_idx on public.club_members(user_id);
create index if not exists club_invites_club_id_idx on public.club_invites(club_id);
create index if not exists club_invites_invite_code_idx on public.club_invites(invite_code);
create index if not exists squads_club_id_idx on public.squads(club_id);
create index if not exists swimmers_club_id_idx on public.swimmers(club_id);
create index if not exists video_uploads_club_id_idx on public.video_uploads(club_id);
create index if not exists video_uploads_swimmer_id_idx on public.video_uploads(swimmer_id);
create index if not exists ai_processing_jobs_club_id_idx on public.ai_processing_jobs(club_id);
create index if not exists ai_processing_jobs_video_upload_id_idx on public.ai_processing_jobs(video_upload_id);
create index if not exists ai_processing_jobs_server_job_id_idx on public.ai_processing_jobs(server_job_id);
create index if not exists reports_club_id_idx on public.reports(club_id);
create index if not exists reports_swimmer_id_idx on public.reports(swimmer_id);
create index if not exists reports_video_upload_id_idx on public.reports(video_upload_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists findings_club_id_idx on public.findings(club_id);
create index if not exists findings_report_id_idx on public.findings(report_id);
create index if not exists key_frames_club_id_idx on public.key_frames(club_id);
create index if not exists shared_report_links_club_id_idx on public.shared_report_links(club_id);
create index if not exists shared_report_links_token_idx on public.shared_report_links(token);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists profiles_prevent_app_role_self_change on public.profiles;
create trigger profiles_prevent_app_role_self_change before update on public.profiles
for each row execute function public.prevent_profile_app_role_self_change();

drop trigger if exists clubs_set_updated_at on public.clubs;
create trigger clubs_set_updated_at before update on public.clubs
for each row execute function public.set_updated_at();

drop trigger if exists club_members_set_updated_at on public.club_members;
create trigger club_members_set_updated_at before update on public.club_members
for each row execute function public.set_updated_at();

drop trigger if exists club_invites_set_updated_at on public.club_invites;
create trigger club_invites_set_updated_at before update on public.club_invites
for each row execute function public.set_updated_at();

drop trigger if exists squads_set_updated_at on public.squads;
create trigger squads_set_updated_at before update on public.squads
for each row execute function public.set_updated_at();

drop trigger if exists swimmers_set_updated_at on public.swimmers;
create trigger swimmers_set_updated_at before update on public.swimmers
for each row execute function public.set_updated_at();

drop trigger if exists video_uploads_set_updated_at on public.video_uploads;
create trigger video_uploads_set_updated_at before update on public.video_uploads
for each row execute function public.set_updated_at();

drop trigger if exists ai_processing_jobs_set_updated_at on public.ai_processing_jobs;
create trigger ai_processing_jobs_set_updated_at before update on public.ai_processing_jobs
for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at before update on public.reports
for each row execute function public.set_updated_at();

drop trigger if exists findings_set_updated_at on public.findings;
create trigger findings_set_updated_at before update on public.findings
for each row execute function public.set_updated_at();

drop trigger if exists shared_report_links_set_updated_at on public.shared_report_links;
create trigger shared_report_links_set_updated_at before update on public.shared_report_links
for each row execute function public.set_updated_at();

create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and app_role = 'admin'
  );
$$;

create or replace function public.is_club_member(target_club_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = target_club_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_club_role(target_club_id uuid, allowed_roles public.club_member_role[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = target_club_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.club_has_members(target_club_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = target_club_id
  );
$$;

create or replace function public.storage_path_club_id(object_name text)
returns uuid
language plpgsql
stable
as $$
declare
  first_folder text;
begin
  first_folder := (storage.foldername(object_name))[1];
  if first_folder is null or first_folder = '' then
    return null;
  end if;
  return first_folder::uuid;
exception when others then
  return null;
end;
$$;

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_invites enable row level security;
alter table public.squads enable row level security;
alter table public.swimmers enable row level security;
alter table public.video_uploads enable row level security;
alter table public.ai_processing_jobs enable row level security;
alter table public.reports enable row level security;
alter table public.findings enable row level security;
alter table public.key_frames enable row level security;
alter table public.shared_report_links enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (id = auth.uid() or public.is_app_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check (id = auth.uid() and app_role = 'user');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "clubs_select_members" on public.clubs;
create policy "clubs_select_members" on public.clubs
for select using (public.is_club_member(id) or public.is_app_admin());

drop policy if exists "clubs_insert_authenticated" on public.clubs;
create policy "clubs_insert_authenticated" on public.clubs
for insert with check (created_by = auth.uid());

drop policy if exists "clubs_update_owner_admin" on public.clubs;
create policy "clubs_update_owner_admin" on public.clubs
for update using (
  public.has_club_role(id, array['owner', 'admin']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "club_members_select_same_club" on public.club_members;
create policy "club_members_select_same_club" on public.club_members
for select using (public.is_club_member(club_id) or public.is_app_admin());

drop policy if exists "club_members_insert_owner_admin_or_first_owner" on public.club_members;
create policy "club_members_insert_owner_admin_or_first_owner" on public.club_members
for insert with check (
  public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
  or public.is_app_admin()
  or (
    user_id = auth.uid()
    and role = 'owner'
    and not public.club_has_members(club_id)
  )
);

drop policy if exists "club_members_update_owner_admin" on public.club_members;
create policy "club_members_update_owner_admin" on public.club_members
for update using (
  public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "club_invites_select_owner_admin" on public.club_invites;
create policy "club_invites_select_owner_admin" on public.club_invites
for select using (
  public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "club_invites_manage_owner_admin" on public.club_invites;
create policy "club_invites_manage_owner_admin" on public.club_invites
for all using (
  public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "squads_select_members" on public.squads;
create policy "squads_select_members" on public.squads
for select using (public.is_club_member(club_id) or public.is_app_admin());

drop policy if exists "squads_manage_owner_admin" on public.squads;
create policy "squads_manage_owner_admin" on public.squads
for all using (
  public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "swimmers_select_members" on public.swimmers;
create policy "swimmers_select_members" on public.swimmers
for select using (public.is_club_member(club_id) or public.is_app_admin());

drop policy if exists "swimmers_manage_coaches" on public.swimmers;
create policy "swimmers_manage_coaches" on public.swimmers
for all using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "video_uploads_select_members" on public.video_uploads;
create policy "video_uploads_select_members" on public.video_uploads
for select using (public.is_club_member(club_id) or public.is_app_admin());

drop policy if exists "video_uploads_manage_coaches" on public.video_uploads;
create policy "video_uploads_manage_coaches" on public.video_uploads
for all using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "ai_jobs_select_members" on public.ai_processing_jobs;
create policy "ai_jobs_select_members" on public.ai_processing_jobs
for select using (public.is_club_member(club_id) or public.is_app_admin());

drop policy if exists "ai_jobs_manage_coaches" on public.ai_processing_jobs;
create policy "ai_jobs_manage_coaches" on public.ai_processing_jobs
for all using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "reports_select_members" on public.reports;
create policy "reports_select_members" on public.reports
for select using (public.is_club_member(club_id) or public.is_app_admin());

drop policy if exists "reports_manage_coaches" on public.reports;
create policy "reports_manage_coaches" on public.reports
for all using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "findings_select_members" on public.findings;
create policy "findings_select_members" on public.findings
for select using (public.is_club_member(club_id) or public.is_app_admin());

drop policy if exists "findings_manage_coaches" on public.findings;
create policy "findings_manage_coaches" on public.findings
for all using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "key_frames_select_members" on public.key_frames;
create policy "key_frames_select_members" on public.key_frames
for select using (public.is_club_member(club_id) or public.is_app_admin());

drop policy if exists "key_frames_manage_coaches" on public.key_frames;
create policy "key_frames_manage_coaches" on public.key_frames
for all using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "shared_report_links_select_coaches" on public.shared_report_links;
create policy "shared_report_links_select_coaches" on public.shared_report_links
for select using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "shared_report_links_manage_coaches" on public.shared_report_links;
create policy "shared_report_links_manage_coaches" on public.shared_report_links
for all using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

insert into storage.buckets (id, name, public)
values
  ('private-videos', 'private-videos', false),
  ('ai-artifacts', 'ai-artifacts', false),
  ('club-branding', 'club-branding', true),
  ('reference-assets', 'reference-assets', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "private_videos_insert_coaches" on storage.objects;
create policy "private_videos_insert_coaches" on storage.objects
for insert with check (
  bucket_id = 'private-videos'
  and auth.role() = 'authenticated'
  and public.has_club_role(
    public.storage_path_club_id(name),
    array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[]
  )
);

drop policy if exists "private_videos_update_delete_coaches" on storage.objects;
create policy "private_videos_update_delete_coaches" on storage.objects
for all using (
  bucket_id = 'private-videos'
  and public.has_club_role(
    public.storage_path_club_id(name),
    array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[]
  )
) with check (
  bucket_id = 'private-videos'
  and public.has_club_role(
    public.storage_path_club_id(name),
    array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[]
  )
);

drop policy if exists "club_branding_public_read" on storage.objects;
create policy "club_branding_public_read" on storage.objects
for select using (bucket_id = 'club-branding');

drop policy if exists "club_branding_write_owner_admin" on storage.objects;
create policy "club_branding_write_owner_admin" on storage.objects
for all using (
  bucket_id = 'club-branding'
  and public.has_club_role(
    public.storage_path_club_id(name),
    array['owner', 'admin']::public.club_member_role[]
  )
) with check (
  bucket_id = 'club-branding'
  and public.has_club_role(
    public.storage_path_club_id(name),
    array['owner', 'admin']::public.club_member_role[]
  )
);

-- No public table policy is provided for shared reports. Public report access
-- must go through a sanitized API endpoint that uses shared_report_links.token.

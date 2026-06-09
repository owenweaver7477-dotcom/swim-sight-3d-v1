-- Swim Sight 3D V1 coach-created video annotations.
-- Idempotent Phase 22 compatibility migration. It keeps raw videos private and
-- stores only coach-created drawing metadata/previews for report workflows.

create table if not exists public.video_annotations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  video_upload_id uuid not null references public.video_uploads(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  finding_id uuid references public.findings(id) on delete set null,
  swimmer_id uuid references public.swimmers(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  annotation_type text not null default 'coach_draw',
  timestamp_seconds numeric not null default 0,
  frame_label text,
  video_frame_time_label text,
  title text,
  coach_note text,
  drawing_data jsonb not null default '{}'::jsonb,
  canvas_width integer not null default 1280,
  canvas_height integer not null default 720,
  video_width integer,
  video_height integer,
  thumbnail_data_url text,
  thumbnail_path text,
  include_in_report boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.video_annotations
  add column if not exists video_upload_id uuid references public.video_uploads(id) on delete cascade,
  add column if not exists report_id uuid references public.reports(id) on delete cascade,
  add column if not exists finding_id uuid references public.findings(id) on delete set null,
  add column if not exists swimmer_id uuid references public.swimmers(id) on delete set null,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists annotation_type text not null default 'coach_draw',
  add column if not exists timestamp_seconds numeric not null default 0,
  add column if not exists frame_label text,
  add column if not exists video_frame_time_label text,
  add column if not exists title text,
  add column if not exists coach_note text,
  add column if not exists drawing_data jsonb not null default '{}'::jsonb,
  add column if not exists canvas_width integer not null default 1280,
  add column if not exists canvas_height integer not null default 720,
  add column if not exists video_width integer,
  add column if not exists video_height integer,
  add column if not exists thumbnail_data_url text,
  add column if not exists thumbnail_path text,
  add column if not exists include_in_report boolean not null default false,
  add column if not exists is_public boolean not null default false;

update public.video_annotations
set frame_label = coalesce(frame_label, video_frame_time_label)
where frame_label is null and video_frame_time_label is not null;

update public.video_annotations
set video_frame_time_label = coalesce(video_frame_time_label, frame_label)
where video_frame_time_label is null and frame_label is not null;

create or replace function public.sync_video_annotation_labels()
returns trigger
language plpgsql
as $$
begin
  new.frame_label = coalesce(new.frame_label, new.video_frame_time_label);
  new.video_frame_time_label = coalesce(new.video_frame_time_label, new.frame_label);
  return new;
end;
$$;

alter table public.video_annotations
  drop constraint if exists video_annotations_annotation_type_check;
alter table public.video_annotations
  add constraint video_annotations_annotation_type_check
  check (annotation_type in ('coach_draw', 'key_frame', 'body_line', 'angle_marker', 'finding_reference'));

create index if not exists video_annotations_club_id_idx on public.video_annotations(club_id);
create index if not exists video_annotations_video_upload_id_idx on public.video_annotations(video_upload_id);
create index if not exists video_annotations_report_id_idx on public.video_annotations(report_id);
create index if not exists video_annotations_finding_id_idx on public.video_annotations(finding_id);
create index if not exists video_annotations_included_idx on public.video_annotations(report_id, include_in_report, is_public);

drop trigger if exists video_annotations_set_updated_at on public.video_annotations;
create trigger video_annotations_set_updated_at before update on public.video_annotations
for each row execute function public.set_updated_at();

drop trigger if exists video_annotations_sync_labels on public.video_annotations;
create trigger video_annotations_sync_labels before insert or update on public.video_annotations
for each row execute function public.sync_video_annotation_labels();

alter table public.video_uploads
  add column if not exists capture_source text;

alter table public.video_uploads
  drop constraint if exists video_uploads_capture_source_check;
alter table public.video_uploads
  add constraint video_uploads_capture_source_check
  check (
    capture_source is null
    or capture_source in ('standard_camera', 'phone_tablet', 'swimpro_export', 'phone', 'tablet', 'other')
  );

alter table public.video_annotations enable row level security;

drop policy if exists "video_annotations_select_members" on public.video_annotations;
create policy "video_annotations_select_members" on public.video_annotations
for select using (public.is_club_member(club_id) or public.is_app_admin());

drop policy if exists "video_annotations_manage_coaches" on public.video_annotations;
create policy "video_annotations_manage_coaches" on public.video_annotations
for all using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

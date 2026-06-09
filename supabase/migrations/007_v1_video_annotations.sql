-- Swim Sight 3D V1 coach-created video annotations.
-- Stores vector drawing data only. Raw video remains private in Supabase Storage.

create table if not exists public.video_annotations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  video_upload_id uuid not null references public.video_uploads(id) on delete cascade,
  swimmer_id uuid references public.swimmers(id) on delete set null,
  finding_id uuid references public.findings(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  annotation_type text not null default 'coach_draw',
  timestamp_seconds numeric not null default 0,
  video_frame_time_label text,
  canvas_width integer not null,
  canvas_height integer not null,
  video_width integer,
  video_height integer,
  drawing_data jsonb not null default '{}'::jsonb,
  thumbnail_path text,
  title text,
  coach_note text,
  include_in_report boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.video_annotations
  drop constraint if exists video_annotations_annotation_type_check;
alter table public.video_annotations
  add constraint video_annotations_annotation_type_check
  check (annotation_type in ('coach_draw', 'key_frame', 'body_line', 'angle_marker', 'finding_reference'));

create index if not exists video_annotations_club_id_idx on public.video_annotations(club_id);
create index if not exists video_annotations_report_id_idx on public.video_annotations(report_id);
create index if not exists video_annotations_video_upload_id_idx on public.video_annotations(video_upload_id);
create index if not exists video_annotations_finding_id_idx on public.video_annotations(finding_id);
create index if not exists video_annotations_included_idx on public.video_annotations(report_id, include_in_report, is_public);

drop trigger if exists video_annotations_set_updated_at on public.video_annotations;
create trigger video_annotations_set_updated_at before update on public.video_annotations
for each row execute function public.set_updated_at();

alter table public.video_uploads
  add column if not exists capture_source text;

alter table public.video_uploads
  drop constraint if exists video_uploads_capture_source_check;
alter table public.video_uploads
  add constraint video_uploads_capture_source_check
  check (
    capture_source is null
    or capture_source in ('standard_camera', 'swimpro_export', 'phone', 'tablet', 'other')
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

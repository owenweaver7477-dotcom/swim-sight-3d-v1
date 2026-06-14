-- Phase 6: coach pilot QA feedback capture.
-- Stores internal pilot notes from authenticated club coaches/admins only.

create table if not exists public.pilot_feedback (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text,
  role text,
  club_squad text,
  device_used text,
  file_size_range text,
  flow_tested text,
  what_worked text,
  what_was_confusing text,
  bug_description text,
  screenshot_or_link text,
  severity text not null default 'suggestion',
  follow_up_ok boolean not null default false,
  created_at timestamptz not null default now(),
  constraint pilot_feedback_severity_check check (
    severity in ('blocker', 'annoying', 'suggestion')
  )
);

create index if not exists pilot_feedback_club_id_idx
  on public.pilot_feedback(club_id);

create index if not exists pilot_feedback_user_id_idx
  on public.pilot_feedback(user_id);

create index if not exists pilot_feedback_severity_idx
  on public.pilot_feedback(severity);

create index if not exists pilot_feedback_created_at_idx
  on public.pilot_feedback(created_at);

alter table public.pilot_feedback enable row level security;

drop policy if exists "pilot_feedback_select_coaches" on public.pilot_feedback;
create policy "pilot_feedback_select_coaches" on public.pilot_feedback
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner', 'admin', 'coach']::public.club_member_role[])
);

drop policy if exists "pilot_feedback_insert_coaches" on public.pilot_feedback;
create policy "pilot_feedback_insert_coaches" on public.pilot_feedback
for insert with check (
  user_id = auth.uid()
  and (
    public.is_app_admin()
    or public.has_club_role(club_id, array['owner', 'admin', 'coach']::public.club_member_role[])
  )
);

drop policy if exists "pilot_feedback_update_owner_admin" on public.pilot_feedback;
create policy "pilot_feedback_update_owner_admin" on public.pilot_feedback
for update using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
) with check (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner', 'admin']::public.club_member_role[])
);

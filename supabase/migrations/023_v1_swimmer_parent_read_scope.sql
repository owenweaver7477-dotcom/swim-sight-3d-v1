-- 023_v1_swimmer_parent_read_scope.sql
-- Phase 5A — the privacy gate. Today every club member's SELECT policy is
-- `is_club_member(club_id)`, so any member (including a swimmer or parent once
-- they can log in) could read EVERY swimmer/report in the club. This tightens
-- the SELECT policies so:
--   * owner / admin / coach / assistant_coach  -> full club-wide view (unchanged)
--   * app admin                                -> unchanged
--   * swimmer                                  -> only their own record + reports
--   * parent                                   -> only their linked swimmer(s)
--
-- SAFE FOR CURRENT USERS: every current member is a coach role (swimmers and
-- parents can't reach the app yet), and coaches keep the exact same access (via
-- has_club_role, and the untouched *_manage_coaches policies). This only removes
-- blanket access from swimmer/parent — the roles the portal is about to enable.
--
-- (Hardened after an adversarial RLS review: returns ALL of a caller's linked
-- swimmers so a parent of two kids in one club sees both; and there is no
-- SECURITY DEFINER helper that returns another tenant's data for an arbitrary
-- id — key_frames scopes through an RLS-respecting subquery instead.)

-- The swimmer ids the CURRENT user is linked to in a club (as swimmer/parent).
-- Self-filtered by auth.uid(): it only ever returns the caller's OWN links, so
-- it is not a cross-tenant oracle. SECURITY DEFINER (bypasses club_members RLS,
-- like is_club_member / has_club_role) with a pinned search_path. Empty array
-- for coaches/admins/unlinked users, so `x = ANY('{}')` safely matches nothing.
create or replace function public.current_user_linked_swimmer_ids(target_club_id uuid)
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(cm.linked_swimmer_id), '{}'::uuid[])
  from public.club_members cm
  where cm.user_id = auth.uid()
    and cm.club_id = target_club_id
    and cm.role in ('swimmer', 'parent')
    and cm.linked_swimmer_id is not null
$$;
grant execute on function public.current_user_linked_swimmer_ids(uuid) to authenticated;

-- swimmers: scope by the swimmer row's own id.
drop policy if exists "swimmers_select_members" on public.swimmers;
create policy "swimmers_select_members" on public.swimmers
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or id = any(public.current_user_linked_swimmer_ids(club_id))
);

-- video_uploads / reports / findings: scope by swimmer_id.
drop policy if exists "video_uploads_select_members" on public.video_uploads;
create policy "video_uploads_select_members" on public.video_uploads
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or swimmer_id = any(public.current_user_linked_swimmer_ids(club_id))
);

drop policy if exists "reports_select_members" on public.reports;
create policy "reports_select_members" on public.reports
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or swimmer_id = any(public.current_user_linked_swimmer_ids(club_id))
);

drop policy if exists "findings_select_members" on public.findings;
create policy "findings_select_members" on public.findings
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or swimmer_id = any(public.current_user_linked_swimmer_ids(club_id))
);

-- key_frames has no swimmer_id — scope via its report. The subquery on reports
-- runs under the caller's RLS AND is explicitly restricted to the caller's own
-- linked swimmers, so there is no arbitrary-id oracle.
drop policy if exists "key_frames_select_members" on public.key_frames;
create policy "key_frames_select_members" on public.key_frames
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or exists (
    select 1 from public.reports r
    where r.id = key_frames.report_id
      and r.swimmer_id = any(public.current_user_linked_swimmer_ids(r.club_id))
  )
);

-- Rollback (restores the original blanket member-read policies):
--   -- for each of swimmers / video_uploads / reports / findings / key_frames:
--   --   drop policy if exists "<t>_select_members" on public.<t>;
--   --   create policy "<t>_select_members" on public.<t> for select
--   --     using (public.is_club_member(club_id) or public.is_app_admin());
--   drop function if exists public.current_user_linked_swimmer_ids(uuid);

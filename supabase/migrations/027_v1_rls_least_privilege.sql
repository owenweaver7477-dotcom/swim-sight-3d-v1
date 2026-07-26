-- 027_v1_rls_least_privilege.sql
-- SELECT-policy hardening. No table, column or data change. Reversible (rollback below).
--
-- WHY
-- Migration 023 scoped swimmer/parent reads on swimmers, video_uploads, reports, findings
-- and key_frames to the linked swimmer — but it missed the tables that use the ROLE-BLIND
-- predicate `is_club_member(club_id)`, which returns true for ANY club_members row
-- regardless of role. A sweep of pg_policies found eight such policies.
--
-- The consequence was demonstrated against the live database, not inferred. Acting as a
-- PARENT linked to swimmer 7ec6f2c2 (who owns none of the rows), inside a rolled-back
-- transaction:
--       other child's annotations readable ....... 3
--       other child's frame images readable ...... 3   (thumbnail_data_url)
--       soft-deleted reports readable ............ 3
--       unfinalised reports readable ............. 3
-- video_annotations stores base64 frames captured from private swim video. Any parent or
-- swimmer account would have been able to read every other family's frames in the club.
-- Nothing was exposed in practice: club_members held two owner rows and zero swimmer or
-- parent accounts, so the path was dormant — but it would have opened on first onboarding.
--
-- Also closed here (a DIFFERENT predicate, so the is_club_member sweep would have missed
-- it): findings/reports were scoped to the linked swimmer but carried no approval_status,
-- finalised_at or is_deleted condition. The only thing stopping a swimmer reading draft
-- reports and pending findings was a client-side filter (SwimmerPortal.jsx:93 and the
-- sanitizer), i.e. a UI promise, not a server boundary.
--
-- WHAT IS DELIBERATELY LEFT ALONE
-- clubs, squads and drills keep `is_club_member` — a member seeing their own club's name,
-- squad list and drill library is intended.
--
-- ROLE-AWARE, NOT A BLANKET TIGHTEN
-- Every policy below keeps FULL read for owner/admin/coach/assistant_coach. The review
-- workflow depends on coaches reading drafts and unapproved findings; restricting that
-- would break the product. Verified two-sided (see the proof note at the end).

-- 1. video_annotations — frames of children. Coaches: all. Family: only their own swimmer's,
--    and only annotations already published into a finalised report.
drop policy if exists "video_annotations_select_members" on public.video_annotations;
create policy "video_annotations_select_members" on public.video_annotations
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
  or (
    swimmer_id = any(public.current_user_linked_swimmer_ids(club_id))
    and include_in_report = true
    and is_public = true
    and exists (
      select 1 from public.reports r
       where r.id = video_annotations.report_id
         and r.is_deleted = false
         and r.finalised_at is not null
    )
  )
);

-- 2. notification_logs — recipient emails and delivery history. Internal: coach-only.
drop policy if exists "notification_logs_select_members" on public.notification_logs;
create policy "notification_logs_select_members" on public.notification_logs
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
);

-- 3. club_members — family linkage. A parent could otherwise map every family to their
--    child. Coaches: all. Everyone else: their own membership row only.
drop policy if exists "club_members_select_same_club" on public.club_members;
create policy "club_members_select_same_club" on public.club_members
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
  or user_id = auth.uid()
);

-- 4. ai_processing_jobs — internal pipeline state. Coach-only.
drop policy if exists "ai_jobs_select_members" on public.ai_processing_jobs;
create policy "ai_jobs_select_members" on public.ai_processing_jobs
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
);

-- 5. ai_credit_ledger — commercial data. Coach-only.
drop policy if exists "ai_credit_ledger_select_members" on public.ai_credit_ledger;
create policy "ai_credit_ledger_select_members" on public.ai_credit_ledger
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
);

-- 6. reports — the family sees only what the coach has finalised and not deleted.
drop policy if exists "reports_select_members" on public.reports;
create policy "reports_select_members" on public.reports
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
  or (
    swimmer_id = any(public.current_user_linked_swimmer_ids(club_id))
    and is_deleted = false
    and finalised_at is not null
  )
);

-- 7. findings — the family sees only APPROVED findings, and only on a finalised report.
drop policy if exists "findings_select_members" on public.findings;
create policy "findings_select_members" on public.findings
for select using (
  public.is_app_admin()
  or public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
  or (
    swimmer_id = any(public.current_user_linked_swimmer_ids(club_id))
    and approval_status = 'approved'
    and exists (
      select 1 from public.reports r
       where r.id = findings.report_id
         and r.is_deleted = false
         and r.finalised_at is not null
    )
  )
);

-- PROOF (run in rolled-back transactions against the live database before applying):
--   as PARENT linked to a swimmer owning none of the rows —
--     other child's annotations 0 (was 3) · frame images 0 (was 3) · notification_logs 0 ·
--     club_members 1 (own row) · deleted reports 0 (was 3) · unfinalised reports 0 (was 3) ·
--     unapproved findings 0
--   as the real COACH/OWNER, membership unchanged —
--     annotations 3 · findings 2 · reports 14 · DRAFT reports 10 · full access retained
--
-- Rollback (restores the previous, role-blind behaviour):
--   drop policy if exists "video_annotations_select_members" on public.video_annotations;
--   create policy "video_annotations_select_members" on public.video_annotations
--     for select using (public.is_club_member(club_id) or public.is_app_admin());
--   drop policy if exists "notification_logs_select_members" on public.notification_logs;
--   create policy "notification_logs_select_members" on public.notification_logs
--     for select using (public.is_club_member(club_id) or public.is_app_admin());
--   drop policy if exists "club_members_select_same_club" on public.club_members;
--   create policy "club_members_select_same_club" on public.club_members
--     for select using (public.is_club_member(club_id) or public.is_app_admin());
--   drop policy if exists "ai_jobs_select_members" on public.ai_processing_jobs;
--   create policy "ai_jobs_select_members" on public.ai_processing_jobs
--     for select using (public.is_club_member(club_id) or public.is_app_admin());
--   drop policy if exists "ai_credit_ledger_select_members" on public.ai_credit_ledger;
--   create policy "ai_credit_ledger_select_members" on public.ai_credit_ledger
--     for select using (public.is_club_member(club_id) or public.is_app_admin());
--   -- reports/findings: restore the 023 form (linked-swimmer, no status conditions)
--   -- exactly as written in 023_v1_swimmer_parent_read_scope.sql lines 60-74.

-- Align pilot_feedback insert with the app's coach-access roles: assistant_coach can
-- reach every page that shows the Feedback button, but the original policy (from the
-- unversioned migration 014) omitted it, so their inserts always failed RLS.
-- Applied to production 2026-07-08 (Batch 8C review fix).
drop policy if exists "pilot_feedback_insert_coaches" on public.pilot_feedback;
create policy "pilot_feedback_insert_coaches"
on public.pilot_feedback for insert with check (
  (user_id = auth.uid())
  and (
    public.is_app_admin()
    or public.has_club_role(club_id, array['owner','admin','coach','assistant_coach']::public.club_member_role[])
  )
);

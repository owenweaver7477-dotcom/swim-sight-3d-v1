-- 022_v1_swimmer_profiles.sql
-- Phase 4 (coach audit): swimmer profile fields + a private swimmer-photos bucket.
--
-- Fully ADDITIVE and reversible. It adds only new nullable columns and a new
-- private storage bucket with coach-scoped policies. No existing table, column,
-- policy, or RLS rule is altered, so nothing already in production changes
-- behaviour. Existing swimmers table RLS (swimmers_manage_coaches) already lets
-- club coaches write these new columns — no new table policy is needed here.
-- The swimmer-self write path + swimmer/parent read scoping come in Phase 5.
--
-- Safeguarding: swimmer photos (often minors) go in a PRIVATE bucket, never
-- public-read, mirroring private-videos. `photo_approved_by_parent` gates where
-- the photo may be shown — it stays false until the linked parent approves.

-- 1. Profile columns on swimmers (all optional / nullable).
alter table public.swimmers
  add column if not exists photo_url text,
  add column if not exists photo_approved_by_parent boolean not null default false,
  add column if not exists goal_times jsonb not null default '{}'::jsonb,
  add column if not exists goal_short_term text,
  add column if not exists goal_long_term text,
  add column if not exists strengths text,
  add column if not exists weaknesses text;

-- 2. Private storage bucket for swimmer photos (private = false public flag).
insert into storage.buckets (id, name, public)
values ('swimmer-photos', 'swimmer-photos', false)
on conflict (id) do update set public = excluded.public;

-- 3. Storage RLS — mirror the private-videos pattern exactly. Club coaches
--    manage (read/write/delete) photos only under their own club's path
--    (<club_id>/<swimmer_id>/<file>); the club id is parsed from the object
--    name and checked with the existing has_club_role helper. Reads use
--    short-lived signed URLs, which respect this policy.
drop policy if exists "swimmer_photos_rw_coaches" on storage.objects;
create policy "swimmer_photos_rw_coaches" on storage.objects
for all using (
  bucket_id = 'swimmer-photos'
  and public.has_club_role(
    public.storage_path_club_id(name),
    array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[]
  )
) with check (
  bucket_id = 'swimmer-photos'
  and public.has_club_role(
    public.storage_path_club_id(name),
    array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[]
  )
);

-- Rollback (manual, if ever needed):
--   drop policy if exists "swimmer_photos_rw_coaches" on storage.objects;
--   delete from storage.buckets where id = 'swimmer-photos';
--   alter table public.swimmers
--     drop column if exists photo_url,
--     drop column if exists photo_approved_by_parent,
--     drop column if exists goal_times,
--     drop column if exists goal_short_term,
--     drop column if exists goal_long_term,
--     drop column if exists strengths,
--     drop column if exists weaknesses;

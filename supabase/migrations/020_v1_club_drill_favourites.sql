-- Club drill favourites (additive, nullable, reversible). No RLS change.
-- Applied to production 2026-07-08 (Batch 7F). Curated by owner/admin
-- (clubs_update_owner_admin), read by all club members.
alter table public.clubs add column if not exists favourite_drills jsonb;

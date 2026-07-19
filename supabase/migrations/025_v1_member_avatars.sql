-- 025_v1_member_avatars.sql
-- Profile pictures for APP USER accounts (owners, admins, coaches, parents).
--
-- Swimmers (minors) already have photos via 022 (swimmer-photos bucket, private,
-- parent-approved, coach-scoped RLS) — that stricter path is unchanged. This
-- migration covers the adult member/coach accounts, which had no avatar at all.
--
-- Design:
--  - avatar_url lives on `profiles` (per-user, same across clubs). Self-update
--    works through the existing `profiles_update_own` RLS policy — no new RPC.
--  - Images live in a private `member-avatars` bucket under `<user_id>/…`; a user
--    can only write their own folder, any authenticated user can read (so members
--    see each other's avatars). Nothing is public/anon.
--  - Cross-member display does NOT widen `profiles` SELECT (which is own-row-only).
--    Instead a SECURITY DEFINER function returns member avatars/names ONLY for a
--    club the caller already belongs to.

-- 1. Per-user avatar pointer.
alter table public.profiles add column if not exists avatar_url text;

-- 2. Private avatars bucket.
insert into storage.buckets (id, name, public)
values ('member-avatars', 'member-avatars', false)
on conflict (id) do nothing;

-- 3. Storage RLS: read for any authenticated user; write only within your own folder.
drop policy if exists "member_avatars_read_auth" on storage.objects;
create policy "member_avatars_read_auth" on storage.objects
  for select to authenticated
  using (bucket_id = 'member-avatars');

drop policy if exists "member_avatars_insert_own" on storage.objects;
create policy "member_avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "member_avatars_update_own" on storage.objects;
create policy "member_avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "member_avatars_delete_own" on storage.objects;
create policy "member_avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Cross-member display, scoped to clubs the caller belongs to (no profiles-SELECT widening).
create or replace function public.club_member_avatars(target_club_id uuid)
returns table (user_id uuid, full_name text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.avatar_url
  from public.club_members cm
  join public.profiles p on p.id = cm.user_id
  where cm.club_id = target_club_id
    and public.is_club_member(target_club_id);
$$;
grant execute on function public.club_member_avatars(uuid) to authenticated;

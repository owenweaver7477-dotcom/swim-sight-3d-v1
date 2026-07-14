-- 024_v1_swimmer_self_service.sql
-- Phase 5B — let a swimmer edit their OWN profile, a parent approve the photo,
-- and a swimmer upload their own photo. All writes go through SECURITY DEFINER
-- RPCs / a scoped storage policy that authorise off club_members.linked_swimmer_id,
-- so the swimmer/parent roles never get a blanket table-write grant and can only
-- touch a fixed set of columns / their own storage path.

-- Safe path parser for the swimmer id (2nd folder) — mirrors storage_path_club_id.
create or replace function public.storage_path_swimmer_id(object_name text)
returns uuid
language plpgsql
stable
as $$
declare seg text;
begin
  seg := (storage.foldername(object_name))[2];
  if seg is null or seg = '' then return null; end if;
  return seg::uuid;
exception when others then
  return null;
end;
$$;

-- Swimmer edits ONLY their own goals/strengths/weaknesses (+ their own photo).
-- A new/changed photo resets parent approval to false so it must be re-approved.
create or replace function public.update_my_swimmer_profile(
  p_swimmer_id uuid,
  p_goal_times jsonb default null,
  p_goal_short_term text default null,
  p_goal_long_term text default null,
  p_strengths text default null,
  p_weaknesses text default null,
  p_photo_url text default null,
  p_clear_photo boolean default false
)
returns public.swimmers
language plpgsql
security definer
set search_path = public
as $$
declare result public.swimmers;
begin
  if not exists (
    select 1 from public.club_members cm
    where cm.user_id = auth.uid()
      and cm.role = 'swimmer'
      and cm.linked_swimmer_id = p_swimmer_id
  ) then
    raise exception 'not authorised to edit this swimmer';
  end if;

  update public.swimmers set
    goal_times      = coalesce(p_goal_times, goal_times),
    goal_short_term = coalesce(p_goal_short_term, goal_short_term),
    goal_long_term  = coalesce(p_goal_long_term, goal_long_term),
    strengths       = coalesce(p_strengths, strengths),
    weaknesses      = coalesce(p_weaknesses, weaknesses),
    photo_url = case
      when p_clear_photo then null
      when p_photo_url is not null then p_photo_url
      else photo_url end,
    photo_approved_by_parent = case
      when p_clear_photo or p_photo_url is not null then false
      else photo_approved_by_parent end,
    updated_at = now()
  where id = p_swimmer_id
  returning * into result;

  return result;
end;
$$;
grant execute on function public.update_my_swimmer_profile(uuid, jsonb, text, text, text, text, text, boolean) to authenticated;

-- Parent approves / un-approves their linked swimmer's photo.
create or replace function public.set_swimmer_photo_approval(p_swimmer_id uuid, p_approved boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.club_members cm
    where cm.user_id = auth.uid()
      and cm.role = 'parent'
      and cm.linked_swimmer_id = p_swimmer_id
  ) then
    raise exception 'not authorised to approve this photo';
  end if;

  update public.swimmers
  set photo_approved_by_parent = coalesce(p_approved, false), updated_at = now()
  where id = p_swimmer_id;
end;
$$;
grant execute on function public.set_swimmer_photo_approval(uuid, boolean) to authenticated;

-- Storage: a swimmer may read/write their OWN photo under <club_id>/<swimmer_id>/...
-- (coaches already have swimmer_photos_rw_coaches from 022). The swimmer id in the
-- path must be one of the caller's linked swimmers in that club.
drop policy if exists "swimmer_photos_rw_own_swimmer" on storage.objects;
create policy "swimmer_photos_rw_own_swimmer" on storage.objects
for all using (
  bucket_id = 'swimmer-photos'
  and public.storage_path_swimmer_id(name) = any(public.current_user_linked_swimmer_ids(public.storage_path_club_id(name)))
) with check (
  bucket_id = 'swimmer-photos'
  and public.storage_path_swimmer_id(name) = any(public.current_user_linked_swimmer_ids(public.storage_path_club_id(name)))
);

-- Rollback:
--   drop policy if exists "swimmer_photos_rw_own_swimmer" on storage.objects;
--   drop function if exists public.set_swimmer_photo_approval(uuid, boolean);
--   drop function if exists public.update_my_swimmer_profile(uuid, jsonb, text, text, text, text, text, boolean);
--   drop function if exists public.storage_path_swimmer_id(text);

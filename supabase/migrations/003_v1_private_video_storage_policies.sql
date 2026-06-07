drop policy if exists "private_videos_update_delete_coaches" on storage.objects;

create policy "private_videos_update_coaches" on storage.objects
for update using (
  bucket_id = 'private-videos'
  and public.has_club_role(
    public.storage_path_club_id(name),
    array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[]
  )
) with check (
  bucket_id = 'private-videos'
  and public.has_club_role(
    public.storage_path_club_id(name),
    array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[]
  )
);

create policy "private_videos_delete_coaches" on storage.objects
for delete using (
  bucket_id = 'private-videos'
  and public.has_club_role(
    public.storage_path_club_id(name),
    array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[]
  )
);

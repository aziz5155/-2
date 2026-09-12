-- ============================================================================
-- Public storage bucket for child profile photos. Files are uploaded under
-- <family_id>/<random>.<ext> so RLS can scope writes to that family's own
-- parent without needing a child row yet (the child is created right after
-- the upload, in the same "add child" step).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_parent_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and public.is_family_parent((storage.foldername(name))[1]::uuid)
  );

create policy "avatars_parent_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and public.is_family_parent((storage.foldername(name))[1]::uuid)
  );

create policy "avatars_parent_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and public.is_family_parent((storage.foldername(name))[1]::uuid)
  );

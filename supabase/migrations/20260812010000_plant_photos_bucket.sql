-- Storage bucket for plant photos. Public read (photos aren't sensitive
-- and this keeps <img src> simple with no signed URLs); writes are
-- restricted to the user's own folder (path = "<user_id>/...").

insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read plant photos" on storage.objects;
create policy "Public read plant photos"
  on storage.objects for select
  using (bucket_id = 'plant-photos');

drop policy if exists "Users upload their own plant photos" on storage.objects;
create policy "Users upload their own plant photos"
  on storage.objects for insert
  with check (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update their own plant photos" on storage.objects;
create policy "Users update their own plant photos"
  on storage.objects for update
  using (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their own plant photos" on storage.objects;
create policy "Users delete their own plant photos"
  on storage.objects for delete
  using (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = auth.uid()::text);

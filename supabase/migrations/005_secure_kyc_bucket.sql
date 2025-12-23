insert into storage.buckets (id, name, public) values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do update set public = false;

alter table storage.objects enable row level security;

create policy "KYC read own" on storage.objects
  for select using (bucket_id = 'kyc-documents' and split_part(name, '/', 1) = auth.uid()::text);

create policy "KYC insert own" on storage.objects
  for insert with check (bucket_id = 'kyc-documents' and split_part(name, '/', 1) = auth.uid()::text);

create policy "KYC update own" on storage.objects
  for update using (bucket_id = 'kyc-documents' and split_part(name, '/', 1) = auth.uid()::text);

create policy "KYC delete own" on storage.objects
  for delete using (bucket_id = 'kyc-documents' and split_part(name, '/', 1) = auth.uid()::text);

create policy "Super admins can read all KYC" on storage.objects
  for select using (
    bucket_id = 'kyc-documents' and exists (
      select 1 from public.user_profiles up where up.id = auth.uid() and up.role = 'superAdmin'
    )
  );
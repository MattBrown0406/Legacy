-- Legacy — participant contact details + per-case file uploads.

-- ---------- participants: phone + email ----------
alter table public.participants add column if not exists phone text;
alter table public.participants add column if not exists email text;

-- ---------- case_files (metadata for uploaded documents) ----------
create table if not exists public.case_files (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  name text not null,
  mime_type text,
  size_bytes bigint,
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index if not exists case_files_case_idx on public.case_files (case_id);

alter table public.case_files enable row level security;

drop policy if exists "case_files_all_own" on public.case_files;
create policy "case_files_all_own"
  on public.case_files for all
  using (public.owns_case(case_id))
  with check (public.owns_case(case_id));

-- ---------- private Storage bucket for case files ----------
insert into storage.buckets (id, name, public)
values ('case-files', 'case-files', false)
on conflict (id) do nothing;

-- Files are stored at "<case_id>/<filename>"; ownership is derived from the
-- first path segment via owns_case().
drop policy if exists "case_files_storage_select" on storage.objects;
create policy "case_files_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'case-files'
    and public.owns_case(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "case_files_storage_insert" on storage.objects;
create policy "case_files_storage_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'case-files'
    and public.owns_case(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "case_files_storage_delete" on storage.objects;
create policy "case_files_storage_delete"
  on storage.objects for delete
  using (
    bucket_id = 'case-files'
    and public.owns_case(((storage.foldername(name))[1])::uuid)
  );

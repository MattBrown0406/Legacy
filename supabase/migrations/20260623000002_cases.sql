-- Legacy — Phase 2 schema: cases (two pipelines). Owner-only RLS via the
-- owning practitioner row.

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  family_name text not null,
  loved_one text,
  substance text,
  pipeline text not null default 'intervention'
    check (pipeline in ('intervention', 'coaching')),
  stage text not null default 'inquiry'
    check (stage in ('inquiry', 'readiness', 'intervention', 'active_coaching', 'aftercare')),
  created_at timestamptz not null default now()
);

create index if not exists cases_practitioner_idx on public.cases (practitioner_id);

alter table public.cases enable row level security;

-- A case belongs to the signed-in user iff its practitioner row is theirs.
drop policy if exists "cases_select_own" on public.cases;
create policy "cases_select_own"
  on public.cases for select
  using (
    exists (
      select 1 from public.practitioners p
      where p.id = cases.practitioner_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "cases_insert_own" on public.cases;
create policy "cases_insert_own"
  on public.cases for insert
  with check (
    exists (
      select 1 from public.practitioners p
      where p.id = cases.practitioner_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "cases_update_own" on public.cases;
create policy "cases_update_own"
  on public.cases for update
  using (
    exists (
      select 1 from public.practitioners p
      where p.id = cases.practitioner_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.practitioners p
      where p.id = cases.practitioner_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "cases_delete_own" on public.cases;
create policy "cases_delete_own"
  on public.cases for delete
  using (
    exists (
      select 1 from public.practitioners p
      where p.id = cases.practitioner_id and p.user_id = auth.uid()
    )
  );

-- Legacy — Phase 3 schema: Family Readiness (per case).
-- readiness_steps (7-step workflow), participants, case_notes.
-- Owner-only RLS keyed through the case -> practitioner chain.

-- Helper: does the signed-in user own this case?
create or replace function public.owns_case(cid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cases c
    join public.practitioners p on p.id = c.practitioner_id
    where c.id = cid and p.user_id = auth.uid()
  );
$$;

-- ---------- readiness_steps ----------
create table if not exists public.readiness_steps (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  step_key text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  unique (case_id, step_key)
);
create index if not exists readiness_steps_case_idx on public.readiness_steps (case_id);

alter table public.readiness_steps enable row level security;

drop policy if exists "readiness_all_own" on public.readiness_steps;
create policy "readiness_all_own"
  on public.readiness_steps for all
  using (public.owns_case(case_id))
  with check (public.owns_case(case_id));

-- ---------- participants ----------
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  name text not null,
  role text,
  status text not null default 'prep' check (status in ('prep', 'ready')),
  letter_in boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists participants_case_idx on public.participants (case_id);

alter table public.participants enable row level security;

drop policy if exists "participants_all_own" on public.participants;
create policy "participants_all_own"
  on public.participants for all
  using (public.owns_case(case_id))
  with check (public.owns_case(case_id));

-- ---------- case_notes ----------
create table if not exists public.case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists case_notes_case_idx on public.case_notes (case_id);

alter table public.case_notes enable row level security;

drop policy if exists "case_notes_all_own" on public.case_notes;
create policy "case_notes_all_own"
  on public.case_notes for all
  using (public.owns_case(case_id))
  with check (public.owns_case(case_id));

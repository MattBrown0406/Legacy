-- Legacy — Phase 5 schema: invites. Owner-only RLS via the case -> practitioner
-- chain (owns_case()).

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  target text not null check (target in ('sober_helpline', 'family_bridge')),
  sent_at timestamptz not null default now()
);
create index if not exists invites_case_idx on public.invites (case_id, target, sent_at desc);

alter table public.invites enable row level security;

drop policy if exists "invites_all_own" on public.invites;
create policy "invites_all_own"
  on public.invites for all
  using (public.owns_case(case_id))
  with check (public.owns_case(case_id));

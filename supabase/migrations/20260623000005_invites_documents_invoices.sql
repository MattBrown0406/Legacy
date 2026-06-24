-- Legacy — Phase 5 schema: invites, documents, invoices. Owner-only RLS.

-- Helper: does the signed-in user own this practitioner row?
create or replace function public.owns_practitioner(pid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.practitioners p
    where p.id = pid and p.user_id = auth.uid()
  );
$$;

-- ---------- invites ----------
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

-- ---------- documents ----------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  title text not null,
  kind text not null default 'other'
    check (kind in ('letter_guidelines', 'boundaries', 'services_agreement', 'other')),
  body_md text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists documents_practitioner_idx on public.documents (practitioner_id);

alter table public.documents enable row level security;

drop policy if exists "documents_all_own" on public.documents;
create policy "documents_all_own"
  on public.documents for all
  using (public.owns_practitioner(practitioner_id))
  with check (public.owns_practitioner(practitioner_id));

-- ---------- invoices ----------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  case_id uuid references public.cases (id) on delete set null,
  item text not null,
  amount_cents integer not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  created_at timestamptz not null default now()
);
create index if not exists invoices_practitioner_idx on public.invoices (practitioner_id, status);

alter table public.invoices enable row level security;

drop policy if exists "invoices_all_own" on public.invoices;
create policy "invoices_all_own"
  on public.invoices for all
  using (public.owns_practitioner(practitioner_id))
  with check (public.owns_practitioner(practitioner_id));

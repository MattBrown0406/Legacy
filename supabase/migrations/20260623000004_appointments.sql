-- Legacy — Phase 4 schema: appointments. Legacy is the source of truth for
-- scheduling. gcal_event_id is populated later by the one-way Google sync.
-- Owner-only RLS via the owning practitioner.

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  case_id uuid references public.cases (id) on delete set null,
  title text not null,
  kind text not null default 'session'
    check (kind in ('session', 'call', 'intervention', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  reminder_minutes integer,
  gcal_event_id text,
  created_at timestamptz not null default now()
);

create index if not exists appointments_practitioner_idx
  on public.appointments (practitioner_id, starts_at);

alter table public.appointments enable row level security;

drop policy if exists "appointments_all_own" on public.appointments;
create policy "appointments_all_own"
  on public.appointments for all
  using (
    exists (
      select 1 from public.practitioners p
      where p.id = appointments.practitioner_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.practitioners p
      where p.id = appointments.practitioner_id and p.user_id = auth.uid()
    )
  );

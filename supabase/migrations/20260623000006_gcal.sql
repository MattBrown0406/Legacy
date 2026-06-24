-- Legacy — Phase 6 schema: Google Calendar one-way sync (Legacy -> Google).
-- The refresh token is stored server-side ONLY and is never selectable by the
-- client: gcal_accounts has RLS enabled with NO policies, so only the
-- service_role (used by edge functions) can touch it. The client learns the
-- connected state from practitioners.gcal_email (safe to expose).

alter table public.practitioners
  add column if not exists gcal_email text;

create table if not exists public.gcal_accounts (
  practitioner_id uuid primary key references public.practitioners (id) on delete cascade,
  google_email text,
  refresh_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS on, no policies => no anon/authenticated access. Edge functions use the
-- service_role key, which bypasses RLS.
alter table public.gcal_accounts enable row level security;
revoke all on public.gcal_accounts from anon, authenticated;

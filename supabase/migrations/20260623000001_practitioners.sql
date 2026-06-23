-- Legacy — Phase 1 schema: practitioner profile.
-- RLS is owner-only on every table. One practitioner row per auth user.

create table if not exists public.practitioners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  credential text,
  practice_name text,
  -- Google Calendar privacy toggle: true = push full detail, false = "Busy" blocks.
  gcal_detail_mode boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.practitioners enable row level security;

drop policy if exists "practitioners_select_own" on public.practitioners;
create policy "practitioners_select_own"
  on public.practitioners for select
  using (auth.uid() = user_id);

drop policy if exists "practitioners_insert_own" on public.practitioners;
create policy "practitioners_insert_own"
  on public.practitioners for insert
  with check (auth.uid() = user_id);

drop policy if exists "practitioners_update_own" on public.practitioners;
create policy "practitioners_update_own"
  on public.practitioners for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "practitioners_delete_own" on public.practitioners;
create policy "practitioners_delete_own"
  on public.practitioners for delete
  using (auth.uid() = user_id);

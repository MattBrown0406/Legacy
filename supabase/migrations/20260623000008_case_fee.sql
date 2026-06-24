-- Legacy — case-level fee + paid status. Drives the Revenue tab's monthly and
-- annual totals (aggregated from cases by created_at).

alter table public.cases add column if not exists fee_cents integer not null default 0;
alter table public.cases add column if not exists paid boolean not null default false;

-- Run this in the Supabase SQL editor before using "Send Report".
-- services/supabase.service.ts writes to this table via the service-role
-- key, which bypasses RLS — no public policies are needed or granted.

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  tester text, -- null until authentication exists; see services/supabase.service.ts
  build_number text not null,
  environment text not null,
  tested_flows jsonb not null,
  verified_tickets jsonb not null,
  created_tickets jsonb not null,
  notes text,
  slack_payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table reports enable row level security;
-- No policies are added: only the service-role key (server-side only) can
-- read or write this table until a Report History feature adds
-- authenticated, policy-scoped access.

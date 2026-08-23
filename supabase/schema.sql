-- Run this in the Supabase SQL editor. Every statement is idempotent
-- (IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS before CREATE), so
-- re-running it after a partial failure is safe.
--
-- Verified against the live project before writing this: `reports` does
-- not exist there yet (never actually applied) and auth.users has zero
-- rows, so this creates both tables fresh rather than migrating existing
-- data — that's why `reports.user_id` can be NOT NULL from the start
-- instead of nullable-then-tightened.

-- ===========================================================================
-- profiles — mirrors auth.users so the rest of the schema (and RLS
-- policies elsewhere) can reference a user without needing access to the
-- auth schema. Populated only by the trigger below; application code
-- never inserts into this table directly (no INSERT policy exists for
-- the authenticated/anon roles).
-- ===========================================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can view their own profile" on profiles;
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Auto-create (or refresh) a profile row whenever a new user signs up.
-- SECURITY DEFINER so it can write to `profiles` despite the RLS policies
-- above granting no INSERT to regular users — this function, not the app,
-- is the only path that ever creates a profile row.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- reports — one row per sent QA report.
-- ===========================================================================
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_date date not null,
  build_number text not null,
  environment text not null,
  tested_flows jsonb not null,
  verified_tickets jsonb not null,
  created_tickets jsonb not null,
  notes text,
  slack_payload jsonb not null,
  created_at timestamptz not null default now()
);

-- Safety net if this is ever re-run against a project that already had
-- the pre-auth shape of this table: add the column if missing, and drop
-- the `tester` placeholder column (text, always null) it's replacing.
alter table reports add column if not exists user_id uuid references auth.users(id);
alter table reports drop column if exists tester;

create index if not exists reports_user_id_idx on reports (user_id);

alter table reports enable row level security;

drop policy if exists "Users can view their own reports" on reports;
create policy "Users can view their own reports"
  on reports for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own reports" on reports;
create policy "Users can insert their own reports"
  on reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own reports" on reports;
create policy "Users can update their own reports"
  on reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy — reports aren't deletable through the app.

-- ===========================================================================
-- user_integrations — each user's own YouTrack + Slack connection. One
-- row per user; base_url/project/state_field/login are plain columns,
-- but the API token and webhook are never stored in this table directly.
-- They're stored as Supabase Vault secrets, and this table only holds a
-- reference (uuid) to that secret — the column value is meaningless
-- without going through vault.decrypted_secrets, which only the
-- SECURITY DEFINER functions below (and the Vault owner) can read. That
-- means the raw token/webhook is never something a normal SELECT — from
-- the app, from the SQL editor as a regular user, or from an RLS bypass
-- bug — can accidentally return in plaintext.
-- ===========================================================================
create extension if not exists supabase_vault;

create table if not exists user_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  youtrack_base_url text,
  youtrack_api_token uuid references vault.secrets(id),
  youtrack_project text,
  youtrack_state_field text,
  youtrack_login text,
  slack_webhook uuid references vault.secrets(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_integrations enable row level security;

drop policy if exists "Users can view their own integrations" on user_integrations;
create policy "Users can view their own integrations"
  on user_integrations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own integrations" on user_integrations;
create policy "Users can insert their own integrations"
  on user_integrations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own integrations" on user_integrations;
create policy "Users can update their own integrations"
  on user_integrations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own integrations" on user_integrations;
create policy "Users can delete their own integrations"
  on user_integrations for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Vault read/write access, scoped to the caller's own row.
--
-- Regular (authenticated/anon) roles have no access to vault.secrets or
-- vault.decrypted_secrets by design — only these four SECURITY DEFINER
-- functions can touch them, and every one of them re-checks auth.uid()
-- itself before doing anything, rather than trusting RLS to cover it (RLS
-- doesn't apply inside a SECURITY DEFINER function's own table owner
-- context, so this check is load-bearing, not decorative). The app calls
-- these via supabase.rpc(...) using the caller's own session — never the
-- service-role key.
-- ---------------------------------------------------------------------------
create or replace function public.set_youtrack_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_existing_id uuid;
begin
  insert into user_integrations (user_id) values (auth.uid())
  on conflict (user_id) do nothing;

  select youtrack_api_token into v_existing_id
    from user_integrations where user_id = auth.uid();

  if v_existing_id is not null then
    perform vault.update_secret(v_existing_id, p_token);
    update user_integrations set updated_at = now() where user_id = auth.uid();
  else
    update user_integrations
      set youtrack_api_token = vault.create_secret(p_token, 'youtrack_api_token:' || auth.uid()::text),
          updated_at = now()
      where user_id = auth.uid();
  end if;
end;
$$;

create or replace function public.get_youtrack_token()
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_token text;
begin
  select decrypted_secret into v_token
    from vault.decrypted_secrets ds
    join user_integrations ui on ui.youtrack_api_token = ds.id
    where ui.user_id = auth.uid();
  return v_token;
end;
$$;

create or replace function public.set_slack_webhook(p_webhook text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_existing_id uuid;
begin
  insert into user_integrations (user_id) values (auth.uid())
  on conflict (user_id) do nothing;

  select slack_webhook into v_existing_id
    from user_integrations where user_id = auth.uid();

  if v_existing_id is not null then
    perform vault.update_secret(v_existing_id, p_webhook);
    update user_integrations set updated_at = now() where user_id = auth.uid();
  else
    update user_integrations
      set slack_webhook = vault.create_secret(p_webhook, 'slack_webhook:' || auth.uid()::text),
          updated_at = now()
      where user_id = auth.uid();
  end if;
end;
$$;

create or replace function public.get_slack_webhook()
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_webhook text;
begin
  select decrypted_secret into v_webhook
    from vault.decrypted_secrets ds
    join user_integrations ui on ui.slack_webhook = ds.id
    where ui.user_id = auth.uid();
  return v_webhook;
end;
$$;

grant execute on function public.set_youtrack_token(text) to authenticated;
grant execute on function public.get_youtrack_token() to authenticated;
grant execute on function public.set_slack_webhook(text) to authenticated;
grant execute on function public.get_slack_webhook() to authenticated;

-- ===========================================================================
-- report_drafts — one row per user, holding their in-progress (not yet
-- sent) report so it survives a page refresh or a new login. Overwritten
-- in place (upsert) as the user types; unrelated to `reports`, which is
-- the durable, append-only record of reports actually sent.
-- ===========================================================================
create table if not exists report_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  build_number text not null default '',
  environment text not null default '',
  notes text not null default '',
  selected_flow_ids jsonb not null default '[]'::jsonb,
  manual_flows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table report_drafts enable row level security;

drop policy if exists "Users can view their own report draft" on report_drafts;
create policy "Users can view their own report draft"
  on report_drafts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own report draft" on report_drafts;
create policy "Users can insert their own report draft"
  on report_drafts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own report draft" on report_drafts;
create policy "Users can update their own report draft"
  on report_drafts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No delete policy — a draft is only ever overwritten, never explicitly deleted.

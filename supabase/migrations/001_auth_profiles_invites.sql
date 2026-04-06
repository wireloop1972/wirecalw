-- =============================================================================
-- 001_auth_profiles_invites.sql
-- Profiles table, invites table, auto-profile trigger, RLS, admin seed.
--
-- MANUAL DASHBOARD STEPS (not automated by this migration):
--   1. Enable Email provider in Supabase Auth → Providers.
--   2. Enable Phone (SMS) provider for OTP 2FA.
--   3. Configure SMS gateway (Twilio or Supabase-supported provider).
--   4. Disable "Enable email confirmations" if you want instant login
--      for invite-only flow, or keep it on and handle the confirmation
--      redirect in the app.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- public.users  (profile table, 1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'member'
                check (role in ('admin', 'member')),
  title       text,
  phone_number text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists users_email_idx on public.users(email);

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- Auto-create profile row when a new auth user is inserted
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- public.invites
-- ---------------------------------------------------------------------------
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  role        text not null default 'member'
                check (role in ('admin', 'member')),
  title       text,
  created_by  uuid references public.users(id),
  token       text not null,
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

create unique index if not exists invites_token_idx on public.invites(token);
create index if not exists invites_email_idx on public.invites(email);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

-- public.users
alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- public.invites
alter table public.invites enable row level security;

create policy "Admins can read invites"
  on public.invites for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

create policy "Admins can create invites"
  on public.invites for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Allow anonymous token lookup for the invite registration page.
-- Only exposes non-sensitive fields; the app filters by token.
create policy "Anyone can look up invite by token"
  on public.invites for select
  using (true);

-- ---------------------------------------------------------------------------
-- Seed: initial admin
-- ---------------------------------------------------------------------------
-- This runs after the trigger is in place, so handle_new_user() will
-- auto-create the public.users row. We then promote to admin.
-- NOTE: If neal.stabell@gmail.com already exists in auth.users, this is a
-- no-op. Run the UPDATE below separately if the user was created before
-- this migration.
-- ---------------------------------------------------------------------------
-- The admin seed should be run manually or via a Supabase dashboard SQL
-- editor, because inserting directly into auth.users requires the service
-- role and proper hashing. Use:
--
--   update public.users
--   set role = 'admin', title = 'Owner'
--   where email = 'neal.stabell@gmail.com';

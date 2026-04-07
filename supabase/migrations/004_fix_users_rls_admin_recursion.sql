-- RLS recursion fix: admin policies must not subquery public.users under RLS.
-- EXISTS (SELECT ... FROM public.users) re-applies RLS → infinite recursion
-- on SELECT/UPDATE (e.g. PostgREST .update().select()).
-- SECURITY DEFINER reads users as owner and bypasses RLS.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  );
$$;

comment on function public.is_platform_admin() is
  'True if JWT user is admin on public.users; bypasses RLS to avoid recursive policies.';

grant execute on function public.is_platform_admin() to authenticated;

drop policy if exists "Admins can read all profiles" on public.users;
create policy "Admins can read all profiles"
  on public.users for select
  using (public.is_platform_admin());

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins can read invites" on public.invites;
create policy "Admins can read invites"
  on public.invites for select
  using (public.is_platform_admin());

drop policy if exists "Admins can create invites" on public.invites;
create policy "Admins can create invites"
  on public.invites for insert
  with check (public.is_platform_admin());

update public.users
set role = 'admin'
where lower(email) = lower('neal.stabell@gmail.com');

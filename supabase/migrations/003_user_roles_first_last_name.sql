-- Expand roles; add first_name, last_name; drop invite title (title is user preference only).

update public.users set role = 'employee' where role = 'member';
update public.invites set role = 'employee' where role = 'member';

alter table public.users drop constraint users_role_check;
alter table public.invites drop constraint invites_role_check;

alter table public.users alter column role set default 'guest';
alter table public.invites alter column role set default 'employee';

alter table public.users add constraint users_role_check
  check (role in ('admin', 'manager', 'employee', 'guest'));

alter table public.invites add constraint invites_role_check
  check (role in ('admin', 'manager', 'employee', 'guest'));

alter table public.users add column if not exists first_name text;
alter table public.users add column if not exists last_name text;

alter table public.invites drop column if exists title;

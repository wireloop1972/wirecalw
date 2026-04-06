-- =============================================================================
-- 002_promote_neal_admin.sql
-- Promote neal.stabell@gmail.com to admin in public.users.
--
-- NOTE: This does NOT insert into auth.users — that happens when Neal
-- registers through the invite flow or Supabase dashboard. This migration
-- only sets the role once the public.users row exists (created automatically
-- by the on_auth_user_created trigger from 001).
--
-- If the row doesn't exist yet (Neal hasn't signed up), run this again
-- after the first login.
-- =============================================================================

update public.users
set role = 'admin',
    title = 'Owner'
where email = 'neal.stabell@gmail.com';

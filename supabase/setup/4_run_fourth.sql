-- Copy of supabase/migrations/20260308000000_admin_user_directory.sql for a one-time paste into the Supabase SQL Editor.
-- Run it after 1_run_first.sql, 2_run_second.sql and 3_run_third.sql. Safe to run more than once.

-- Lets a super admin see who the accounts are (e-mail, name, roles, last sign-in).
-- E-mail addresses live in auth.users, which the browser cannot read, so this is a
-- function that runs with elevated rights but returns nothing to anyone who is not a
-- super admin. Idempotent.

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  roles TEXT[],
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::text,
    p.full_name,
    COALESCE(array_agg(r.role::text ORDER BY r.role::text) FILTER (WHERE r.role IS NOT NULL), ARRAY[]::text[]),
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.student_profiles p ON p.user_id = u.id
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  WHERE public.has_role(auth.uid(), 'super_admin')
  GROUP BY u.id, u.email, p.full_name, u.created_at, u.last_sign_in_at
  ORDER BY u.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

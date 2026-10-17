-- Add super_admin to the app_role enum.
--
-- This must live in its own migration: Postgres does not allow a newly added
-- enum value to be used in the same transaction that created it, so everything
-- that references 'super_admin' is in 20260305000001_super_admin_policies.sql.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

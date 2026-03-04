-- Add super_admin to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Update has_role function to also work with super_admin
-- (super_admin implicitly has all admin permissions)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (role = 'super_admin' AND _role = 'admin')
      )
  )
$$;

-- Super admin can manage all user_roles (assign/revoke admin)
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admin can do everything on student_profiles
CREATE POLICY "Super admins can manage all profiles"
ON public.student_profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Table to track admin activity log (super_admin can view)
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view activity log"
ON public.admin_activity_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert activity log"
ON public.admin_activity_log FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

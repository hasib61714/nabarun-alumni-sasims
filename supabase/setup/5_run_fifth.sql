-- Copy of supabase/migrations/20260309000000_site_settings_and_verification.sql for a one-time paste into the Supabase SQL Editor.
-- Run it after 1_run_first.sql ... 4_run_fourth.sql. Safe to run more than once.

-- Editable site content, registration verification and "approved students only".
-- Idempotent: safe to run on a database that already has part of it.

-- ---------------------------------------------------------------------------
-- 1. site_settings: every piece of editable public content (contact details,
--    hero text, footer, menu labels ...) lives here as one JSON document per
--    key. Everybody may read it (the public site is built from it); only admins
--    may change it. The site falls back to built-in defaults when a key is empty.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT PRIMARY KEY CHECK (char_length(key) BETWEEN 1 AND 60),
  value      JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(value::text) <= 100000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

DROP POLICY IF EXISTS "Site settings are public" ON public.site_settings;
CREATE POLICY "Site settings are public" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_site_setting()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_site_setting ON public.site_settings;
CREATE TRIGGER touch_site_setting
  BEFORE INSERT OR UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_site_setting();

-- ---------------------------------------------------------------------------
-- 2. student_verifications: what a person tells us when registering so an admin
--    can check they are real. Kept apart from student_profiles because approved
--    profiles are public and this data (phone number, notes) must stay private.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_verifications (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone       TEXT CHECK (char_length(phone) <= 30),
  institution TEXT CHECK (char_length(institution) <= 120),
  relation    TEXT CHECK (char_length(relation) <= 60),
  note        TEXT CHECK (char_length(note) <= 1000),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT CHECK (char_length(review_note) <= 500),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.student_verifications TO authenticated;
GRANT DELETE ON public.student_verifications TO authenticated;

DROP POLICY IF EXISTS "Users can view own verification" ON public.student_verifications;
CREATE POLICY "Users can view own verification" ON public.student_verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit own verification" ON public.student_verifications;
CREATE POLICY "Users can submit own verification" ON public.student_verifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- A rejected person may correct their details and ask for a new review.
DROP POLICY IF EXISTS "Users can resubmit own verification" ON public.student_verifications;
CREATE POLICY "Users can resubmit own verification" ON public.student_verifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending', 'rejected'))
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can manage verifications" ON public.student_verifications;
CREATE POLICY "Admins can manage verifications" ON public.student_verifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- The review outcome belongs to admins; RLS cannot protect single columns.
CREATE OR REPLACE FUNCTION public.guard_student_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.review_note := NULL; NEW.reviewed_at := NULL; NEW.reviewed_by := NULL;
  ELSIF NEW.review_note IS DISTINCT FROM OLD.review_note
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by THEN
    RAISE EXCEPTION 'Only admins can record a review' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_student_verification ON public.student_verifications;
CREATE TRIGGER guard_student_verification
  BEFORE INSERT OR UPDATE ON public.student_verifications
  FOR EACH ROW EXECUTE FUNCTION public.guard_student_verification();

DROP TRIGGER IF EXISTS update_student_verifications_updated_at ON public.student_verifications;
CREATE TRIGGER update_student_verifications_updated_at
  BEFORE UPDATE ON public.student_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 3. New accounts: keep the details given at registration (batch year and roll
--    used to be dropped) and open a verification request.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.student_profiles (user_id, full_name, batch_year, roll)
  VALUES (
    NEW.id,
    left(NULLIF(btrim(meta->>'full_name'), ''), 100),
    CASE WHEN (meta->>'batch_year') ~ '^[0-9]{4}$' THEN (meta->>'batch_year')::int END,
    left(NULLIF(btrim(meta->>'roll'), ''), 30)
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  INSERT INTO public.student_verifications (user_id, phone, institution, relation, note)
  VALUES (
    NEW.id,
    left(NULLIF(btrim(meta->>'phone'), ''), 30),
    left(NULLIF(btrim(meta->>'institution'), ''), 120),
    left(NULLIF(btrim(meta->>'relation'), ''), 60),
    left(NULLIF(btrim(meta->>'note'), ''), 1000)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Accounts that existed before this migration get a verification row too.
INSERT INTO public.student_verifications (user_id, status, reviewed_at)
SELECT p.user_id,
       CASE WHEN p.is_approved THEN 'approved' ELSE 'pending' END,
       CASE WHEN p.is_approved THEN now() END
FROM public.student_profiles p
ON CONFLICT (user_id) DO NOTHING;

-- Approving (or un-approving) a profile keeps the verification status in step,
-- whichever screen the admin used.
CREATE OR REPLACE FUNCTION public.sync_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
    INSERT INTO public.student_verifications (user_id, status, reviewed_at, reviewed_by)
    VALUES (NEW.user_id,
            CASE WHEN COALESCE(NEW.is_approved, false) THEN 'approved' ELSE 'pending' END,
            now(), auth.uid())
    ON CONFLICT (user_id) DO UPDATE
      SET status      = EXCLUDED.status,
          review_note = CASE WHEN EXCLUDED.status = 'approved' THEN NULL ELSE public.student_verifications.review_note END,
          reviewed_at = EXCLUDED.reviewed_at,
          reviewed_by = EXCLUDED.reviewed_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_verification_status ON public.student_profiles;
CREATE TRIGGER sync_verification_status
  AFTER UPDATE OF is_approved ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_verification_status();

-- One call for the admin screen: approve, or reject with a reason the student sees.
CREATE OR REPLACE FUNCTION public.review_student(p_user_id UUID, p_decision TEXT, p_note TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can review registrations' USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Decision must be approve or reject' USING ERRCODE = '22023';
  END IF;

  IF p_decision = 'approve' THEN
    UPDATE public.student_profiles SET is_approved = true WHERE user_id = p_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'No such student' USING ERRCODE = 'P0002'; END IF;
    UPDATE public.student_verifications SET review_note = NULLIF(btrim(p_note), '') WHERE user_id = p_user_id;
  ELSE
    UPDATE public.student_profiles SET is_approved = false WHERE user_id = p_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'No such student' USING ERRCODE = 'P0002'; END IF;
    INSERT INTO public.student_verifications (user_id, status, review_note, reviewed_at, reviewed_by)
    VALUES (p_user_id, 'rejected', left(NULLIF(btrim(p_note), ''), 500), now(), auth.uid())
    ON CONFLICT (user_id) DO UPDATE
      SET status = 'rejected', review_note = EXCLUDED.review_note,
          reviewed_at = now(), reviewed_by = auth.uid();
  END IF;

  INSERT INTO public.admin_activity_log (admin_id, action, target_table, target_id, details)
  VALUES (auth.uid(), p_decision || '_student', 'student_profiles', p_user_id::text,
          jsonb_build_object('note', NULLIF(btrim(p_note), '')));
END;
$$;

REVOKE ALL ON FUNCTION public.review_student(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_student(UUID, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Only approved students may edit a profile or share anything. Until an
--    admin has checked the registration, an account can only log in and wait.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_approved_student(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR EXISTS (SELECT 1 FROM public.student_profiles WHERE user_id = _user_id AND is_approved);
$$;

REVOKE ALL ON FUNCTION public.is_approved_student(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_approved_student(UUID) TO authenticated;

DROP POLICY IF EXISTS "Students can update own profile" ON public.student_profiles;
CREATE POLICY "Students can update own profile" ON public.student_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND is_approved)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit own memories" ON public.memories;
CREATE POLICY "Users can submit own memories" ON public.memories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND public.is_approved_student(auth.uid()));

DROP POLICY IF EXISTS "Users can edit own memories" ON public.memories;
CREATE POLICY "Users can edit own memories" ON public.memories
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.is_approved_student(auth.uid()))
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert testimonials" ON public.testimonials;
CREATE POLICY "Authenticated users can insert testimonials" ON public.testimonials
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE(is_approved, false) = false AND public.is_approved_student(auth.uid()));

DROP POLICY IF EXISTS "Users can upload own memory media" ON storage.objects;
CREATE POLICY "Users can upload own memory media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]
              AND public.is_approved_student(auth.uid()));

-- ---------------------------------------------------------------------------
-- 5. No e-mail confirmation step. The built-in mailer is limited to a few
--    messages an hour, so sign-ups failed or never received their link and
--    could not log in. Real people are filtered by the admin review above
--    instead. (Also switch "Confirm email" off in Authentication -> Providers
--    -> Email; this trigger covers the case where it is still on.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_confirm_new_user ON auth.users;
CREATE TRIGGER auto_confirm_new_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();

-- People who already registered and are stuck on "confirm your e-mail".
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

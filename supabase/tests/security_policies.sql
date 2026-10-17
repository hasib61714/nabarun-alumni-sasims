-- Security regression tests for the RLS policies and triggers.
--
-- Run it against a database that has all migrations applied. Everything runs
-- inside one transaction that is rolled back at the end, so no data is kept.
--
--   Supabase dashboard: SQL Editor -> paste this whole file -> Run.
--       Result "ALL SECURITY CHECKS PASSED" = good. An error that says
--       "FAIL: ..." names the broken protection. After an error, run ROLLBACK;
--   psql:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security_policies.sql
--
BEGIN;

-- Fixtures: admin, student, super admin, and a second student.
-- (The on_auth_user_created trigger gives each of them a profile + 'student' role.)
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'admin@test.local',   '{"full_name":"Admin"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'student@test.local', '{"full_name":"Student"}'),
  ('00000000-0000-0000-0000-0000000000a3', 'super@test.local',   '{"full_name":"Super"}'),
  ('00000000-0000-0000-0000-0000000000a4', 'other@test.local',   '{"full_name":"Other"}');
INSERT INTO public.user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'admin'),
  ('00000000-0000-0000-0000-0000000000a3', 'super_admin');

-- Seed donations as the table owner: one approved, one pending.
INSERT INTO public.donations (donor_name, amount, status) VALUES
  ('Seed approved', 500, 'approved'),
  ('Seed pending', 100, 'pending');

-- ===========================================================================
-- 1. An ordinary admin cannot touch roles (privilege escalation)
-- ===========================================================================
SET LOCAL ROLE authenticated;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true); END $$;

DO $$
DECLARE n int;
BEGIN
  -- the admin can still pass admin checks
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'FAIL: admin lost admin role'; END IF;

  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'super_admin');
    RAISE EXCEPTION 'FAIL: admin granted themselves super_admin';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-0000000000a2', 'admin');
    RAISE EXCEPTION 'FAIL: admin granted admin role to someone else';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  DELETE FROM public.user_roles WHERE role = 'super_admin';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: admin revoked a super_admin role'; END IF;
END $$;

-- ===========================================================================
-- 2. A super admin can grant and revoke admin
-- ===========================================================================
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true); END $$;

DO $$
DECLARE n int;
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-0000000000a4', 'admin');
  IF NOT public.has_role('00000000-0000-0000-0000-0000000000a4', 'admin') THEN
    RAISE EXCEPTION 'FAIL: super admin could not grant admin';
  END IF;
  DELETE FROM public.user_roles
  WHERE user_id = '00000000-0000-0000-0000-0000000000a4' AND role = 'admin';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: super admin could not revoke admin'; END IF;
  IF public.has_role('00000000-0000-0000-0000-0000000000a3', 'admin') IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL: super admin should pass admin checks';
  END IF;
END $$;

-- ===========================================================================
-- 3. A student cannot approve their own profile, but can edit the rest
-- ===========================================================================
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true); END $$;

DO $$
DECLARE n int;
BEGIN
  UPDATE public.student_profiles SET current_profession = 'Engineer' WHERE user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: student cannot edit own profile'; END IF;

  BEGIN
    UPDATE public.student_profiles SET is_approved = true WHERE user_id = auth.uid();
    RAISE EXCEPTION 'FAIL: student self-approved via UPDATE';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    INSERT INTO public.student_profiles (user_id, is_approved)
    VALUES (auth.uid(), true)
    ON CONFLICT (user_id) DO UPDATE SET is_approved = true;
    RAISE EXCEPTION 'FAIL: student self-approved via upsert';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  -- the dashboard's own upsert (no is_approved column) must keep working
  INSERT INTO public.student_profiles (user_id, roll)
  VALUES (auth.uid(), '42')
  ON CONFLICT (user_id) DO UPDATE SET roll = EXCLUDED.roll;

  -- and a student cannot edit someone else's profile
  UPDATE public.student_profiles SET roll = 'x' WHERE user_id = '00000000-0000-0000-0000-0000000000a4';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: student edited another profile'; END IF;
END $$;

-- An admin can approve
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true); END $$;
DO $$
DECLARE n int;
BEGIN
  UPDATE public.student_profiles SET is_approved = true
  WHERE user_id = '00000000-0000-0000-0000-0000000000a2';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: admin could not approve a profile'; END IF;
END $$;

-- A student whose profile was deleted cannot re-create it as approved
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a4', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true); END $$;
RESET ROLE;
DELETE FROM public.student_profiles WHERE user_id = '00000000-0000-0000-0000-0000000000a4';
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.student_profiles (user_id, is_approved) VALUES (auth.uid(), true);
    RAISE EXCEPTION 'FAIL: student re-created profile as approved';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  INSERT INTO public.student_profiles (user_id) VALUES (auth.uid());
END $$;

-- ===========================================================================
-- 4. Testimonials: cannot be pre-approved or written as someone else
-- ===========================================================================
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true); END $$;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.testimonials (user_id, name, message, is_approved)
    VALUES (auth.uid(), 'Student', 'A perfectly fine testimonial', true);
    RAISE EXCEPTION 'FAIL: testimonial inserted pre-approved';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    INSERT INTO public.testimonials (user_id, name, message)
    VALUES ('00000000-0000-0000-0000-0000000000a4', 'Other', 'Pretending to be someone else');
    RAISE EXCEPTION 'FAIL: testimonial inserted for another user';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    INSERT INTO public.testimonials (user_id, name, message) VALUES (auth.uid(), 'Student', 'short');
    RAISE EXCEPTION 'FAIL: too-short testimonial accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  INSERT INTO public.testimonials (user_id, name, message)
  VALUES (auth.uid(), 'Student', 'A perfectly fine testimonial');
END $$;

-- ===========================================================================
-- 5. Donations (anonymous visitor)
-- ===========================================================================
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '', true), set_config('request.jwt.claims', '{"role":"anon"}', true); END $$;
DO $$
DECLARE n int; t numeric;
BEGIN
  BEGIN
    INSERT INTO public.donations (donor_name, amount, status) VALUES ('Fake', 999999, 'approved');
    RAISE EXCEPTION 'FAIL: anon inserted an approved donation';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    INSERT INTO public.donations (donor_name, amount, notes) VALUES ('Fake', 10, 'admin note');
    RAISE EXCEPTION 'FAIL: anon wrote admin notes';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    INSERT INTO public.donations (donor_name, amount) VALUES ('Negative', -5);
    RAISE EXCEPTION 'FAIL: anon inserted a negative donation';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;

  BEGIN
    INSERT INTO public.donations (donor_name, amount, status) VALUES ('Odd', 5, 'whatever');
    RAISE EXCEPTION 'FAIL: anon inserted an unknown status';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;

  INSERT INTO public.donations (donor_name, amount, status) VALUES ('Real donor', 250, 'pending');

  -- donor details stay private
  SELECT count(*) INTO n FROM public.donations;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: anon can read the donations table (% rows)', n; END IF;

  -- ...but the public totals reflect APPROVED donations only
  SELECT COALESCE(sum(total), 0) INTO t FROM public.get_donation_totals();
  IF t <> 500 THEN RAISE EXCEPTION 'FAIL: public donation total is %, expected 500', t; END IF;
END $$;

-- ===========================================================================
-- 6. Contact form (anonymous visitor)
-- ===========================================================================
DO $$
BEGIN
  BEGIN
    INSERT INTO public.contact_messages (name, email, subject, message, is_read)
    VALUES ('Spam', 'spam@test.local', 'Hi', 'Pre-read message', true);
    RAISE EXCEPTION 'FAIL: anon inserted an already-read contact message';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    INSERT INTO public.contact_messages (name, email, subject, message)
    VALUES ('Spam', 'spam@test.local', 'Hi', repeat('x', 5001));
    RAISE EXCEPTION 'FAIL: oversized contact message accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  INSERT INTO public.contact_messages (name, email, subject, message)
  VALUES ('Visitor', 'visitor@test.local', 'Hello', 'A normal message');
END $$;

-- ===========================================================================
-- 7. Public storage buckets only accept small images
-- ===========================================================================
RESET ROLE;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'avatars' AND file_size_limit = 2097152 AND allowed_mime_types @> ARRAY['image/png']
  ) THEN RAISE EXCEPTION 'FAIL: avatars bucket is not restricted'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'gallery' AND file_size_limit IS NOT NULL AND allowed_mime_types @> ARRAY['image/png']
  ) THEN RAISE EXCEPTION 'FAIL: gallery bucket is not restricted'; END IF;
END $$;

ROLLBACK;
SELECT 'ALL SECURITY CHECKS PASSED' AS result;

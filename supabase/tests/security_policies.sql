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

  BEGIN
    INSERT INTO public.contact_messages (name, email, subject, message)
    VALUES ('Spam', 'a@b.co?bcc=evil@x.com', 'Hi', 'mailto parameter injection');
    RAISE EXCEPTION 'FAIL: contact e-mail with mailto parameters accepted';
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

-- ===========================================================================
-- 8. Memories: moderation rules
-- ===========================================================================
SET LOCAL ROLE authenticated;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true); END $$;
DO $$
DECLARE n int; mid uuid;
BEGIN
  INSERT INTO public.memories (user_id, author_name, title, body, media)
  VALUES (auth.uid(), 'Student', 'My first day', 'I remember the very first day at school.',
          '[{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/a.jpg"},{"type":"video","path":"00000000-0000-0000-0000-0000000000a2/b.mp4"},{"type":"youtube","url":"https://youtu.be/abcdefghijk"}]')
  RETURNING id INTO mid;

  BEGIN
    INSERT INTO public.memories (user_id, author_name, title, body, status)
    VALUES (auth.uid(), 'Student', 'Self approved', 'Trying to publish without review.', 'approved');
    RAISE EXCEPTION 'FAIL: student inserted an approved memory';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    INSERT INTO public.memories (user_id, author_name, title, body)
    VALUES ('00000000-0000-0000-0000-0000000000a4', 'Other', 'Not mine', 'Writing as another user.');
    RAISE EXCEPTION 'FAIL: memory inserted for another user';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    INSERT INTO public.memories (user_id, author_name, title, body, media)
    VALUES (auth.uid(), 'Student', 'Foreign file', 'Media that must be refused.', '[{"type":"image","path":"00000000-0000-0000-0000-0000000000a4/their.jpg"}]');
    RAISE EXCEPTION 'FAIL: memory points at another user''s file';
  EXCEPTION WHEN check_violation THEN NULL; END;

  BEGIN
    INSERT INTO public.memories (user_id, author_name, title, body, media)
    VALUES (auth.uid(), 'Student', 'Outside host', 'Media that must be refused.', '[{"type":"image","url":"https://evil.example/a.jpg"}]');
    RAISE EXCEPTION 'FAIL: external image url accepted (no storage path)';
  EXCEPTION WHEN check_violation THEN NULL; END;

  BEGIN
    INSERT INTO public.memories (user_id, author_name, title, body, media)
    VALUES (auth.uid(), 'Student', 'Script url', 'Media that must be refused.', '[{"type":"image","url":"javascript:alert(1)"}]');
    RAISE EXCEPTION 'FAIL: javascript: media url accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  BEGIN
    INSERT INTO public.memories (user_id, author_name, title, body, media)
    VALUES (auth.uid(), 'Student', 'Path trick', 'Media that must be refused.', '[{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/../00000000-0000-0000-0000-0000000000a4/their.jpg"}]');
    RAISE EXCEPTION 'FAIL: path traversal accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  BEGIN
    INSERT INTO public.memories (user_id, author_name, title, body, media)
    VALUES (auth.uid(), 'Student', 'Odd youtube', 'Media that must be refused.', '[{"type":"youtube","url":"https://evil.example/watch?v=abcdefghijk"}]');
    RAISE EXCEPTION 'FAIL: non-YouTube video url accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  BEGIN
    INSERT INTO public.memories (user_id, author_name, title, body, media)
    VALUES (auth.uid(), 'Student', 'Too many', 'Media that must be refused.', '[{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/0.jpg"},{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/1.jpg"},{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/2.jpg"},{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/3.jpg"},{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/4.jpg"},{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/5.jpg"},{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/6.jpg"},{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/7.jpg"},{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/8.jpg"},{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/9.jpg"},{"type":"image","path":"00000000-0000-0000-0000-0000000000a2/10.jpg"}]');
    RAISE EXCEPTION 'FAIL: more than 10 media items accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  BEGIN
    INSERT INTO public.memories (user_id, author_name, title, body)
    VALUES (auth.uid(), 'Student', 'x', 'Too short a title.');
    RAISE EXCEPTION 'FAIL: too-short title accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  -- the owner sees their pending memory, cannot approve or feature it
  SELECT count(*) INTO n FROM public.memories WHERE user_id = auth.uid();
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: owner cannot see own memory (%)', n; END IF;

  BEGIN
    UPDATE public.memories SET status = 'approved' WHERE id = mid;
    RAISE EXCEPTION 'FAIL: student approved own memory';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    UPDATE public.memories SET is_featured = true WHERE id = mid;
    RAISE EXCEPTION 'FAIL: student featured own memory';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    UPDATE public.memories SET user_id = '00000000-0000-0000-0000-0000000000a4' WHERE id = mid;
    RAISE EXCEPTION 'FAIL: student reassigned own memory to another user';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

-- pending memories are not public
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '', true), set_config('request.jwt.claims', '{"role":"anon"}', true); END $$;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.memories;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: anon can read % pending memories', n; END IF;
  BEGIN
    INSERT INTO public.memories (user_id, author_name, title, body)
    VALUES ('00000000-0000-0000-0000-0000000000a2', 'Anon', 'Anonymous post', 'Anonymous visitors cannot post.');
    RAISE EXCEPTION 'FAIL: anon inserted a memory';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

-- admin approves -> public; the other student still cannot touch it
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true); END $$;
DO $$
DECLARE n int; t timestamptz;
BEGIN
  UPDATE public.memories SET status = 'approved', is_featured = true WHERE user_id = '00000000-0000-0000-0000-0000000000a2';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: admin could not approve a memory'; END IF;
  SELECT approved_at INTO t FROM public.memories WHERE user_id = '00000000-0000-0000-0000-0000000000a2';
  IF t IS NULL THEN RAISE EXCEPTION 'FAIL: approved_at not set on approval'; END IF;
END $$;

DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a4', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true); END $$;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.memories;   -- approved ones are visible to everybody
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: approved memory not visible to other users (%)', n; END IF;
  UPDATE public.memories SET title = 'Hijacked title' WHERE user_id = '00000000-0000-0000-0000-0000000000a2';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: another student edited a memory'; END IF;
  DELETE FROM public.memories WHERE user_id = '00000000-0000-0000-0000-0000000000a2';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: another student deleted a memory'; END IF;
END $$;

RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '', true), set_config('request.jwt.claims', '{"role":"anon"}', true); END $$;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.memories;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: anon should see exactly the approved memory (%)', n; END IF;
END $$;

-- the owner edits an approved memory -> it goes back to pending (re-moderation)
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true); END $$;
DO $$
DECLARE n int; st text; ft boolean;
BEGIN
  UPDATE public.memories SET body = 'I remember the very first day at school, and more.' WHERE user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: owner could not edit own memory'; END IF;
  SELECT status, is_featured INTO st, ft FROM public.memories WHERE user_id = auth.uid();
  IF st <> 'pending' THEN RAISE EXCEPTION 'FAIL: edited memory stayed % (should return to pending)', st; END IF;
END $$;

RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '', true), set_config('request.jwt.claims', '{"role":"anon"}', true); END $$;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.memories;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: an edited memory is still public (%)', n; END IF;
END $$;

-- the owner can delete their own memory; admins can edit and delete any
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true); END $$;
DO $$
DECLARE n int;
BEGIN
  UPDATE public.memories SET status = 'rejected', rejection_reason = 'Please add more detail' WHERE user_id = '00000000-0000-0000-0000-0000000000a2';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: admin could not reject a memory'; END IF;
END $$;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true); END $$;
DO $$
DECLARE n int; r text;
BEGIN
  SELECT rejection_reason INTO r FROM public.memories WHERE user_id = auth.uid();
  IF r IS DISTINCT FROM 'Please add more detail' THEN RAISE EXCEPTION 'FAIL: owner cannot see the rejection reason'; END IF;
  DELETE FROM public.memories WHERE user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: owner could not delete own memory'; END IF;
END $$;

-- ===========================================================================
-- 8b. admin_list_users: only a super admin gets any rows (e-mail addresses are private)
-- ===========================================================================
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true); END $$;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.admin_list_users();
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a student can list % accounts', n; END IF;
END $$;

DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true); END $$;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.admin_list_users();
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: a plain admin can list % accounts with e-mail addresses', n; END IF;
END $$;

DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true); END $$;
DO $$
DECLARE n int; roles text[];
BEGIN
  SELECT count(*) INTO n FROM public.admin_list_users() WHERE email LIKE '%@test.local';
  IF n < 4 THEN RAISE EXCEPTION 'FAIL: super admin sees only % of the 4 test accounts', n; END IF;
  SELECT l.roles INTO roles FROM public.admin_list_users() l WHERE l.email = 'super@test.local';
  IF NOT ('super_admin' = ANY(roles) AND 'student' = ANY(roles)) THEN RAISE EXCEPTION 'FAIL: roles missing from the account list (%)', roles; END IF;
END $$;

RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '', true), set_config('request.jwt.claims', '{"role":"anon"}', true); END $$;
DO $$
BEGIN
  BEGIN
    PERFORM * FROM public.admin_list_users();
    RAISE EXCEPTION 'FAIL: anonymous visitors can call admin_list_users';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;

-- ===========================================================================
-- 9. admin_delete_user
-- ===========================================================================
DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true); END $$;
DO $$
BEGIN
  BEGIN
    PERFORM public.admin_delete_user('00000000-0000-0000-0000-0000000000a4');
    RAISE EXCEPTION 'FAIL: a student deleted another user';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true); END $$;
DO $$
BEGIN
  BEGIN
    PERFORM public.admin_delete_user(auth.uid());
    RAISE EXCEPTION 'FAIL: an admin deleted themselves';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    PERFORM public.admin_delete_user('00000000-0000-0000-0000-0000000000a3');
    RAISE EXCEPTION 'FAIL: an admin deleted a super admin';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  PERFORM public.admin_delete_user('00000000-0000-0000-0000-0000000000a4');
END $$;

RESET ROLE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000a4') THEN
    RAISE EXCEPTION 'FAIL: admin could not delete a student account';
  END IF;
  IF EXISTS (SELECT 1 FROM public.student_profiles WHERE user_id = '00000000-0000-0000-0000-0000000000a4') THEN
    RAISE EXCEPTION 'FAIL: deleted user left a profile behind';
  END IF;
END $$;
SET LOCAL ROLE authenticated;

DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a3', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true); END $$;
DO $$
BEGIN
  BEGIN
    PERFORM public.admin_delete_user(auth.uid());
    RAISE EXCEPTION 'FAIL: a super admin deleted themselves';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  PERFORM public.admin_delete_user('00000000-0000-0000-0000-0000000000a1');
END $$;

RESET ROLE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-0000000000a1') THEN
    RAISE EXCEPTION 'FAIL: super admin could not delete an admin';
  END IF;
  IF (SELECT count(*) FROM public.admin_activity_log WHERE action = 'delete_user') <> 2 THEN
    RAISE EXCEPTION 'FAIL: user deletions were not logged';
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'memories' AND public AND file_size_limit = 52428800
      AND allowed_mime_types @> ARRAY['image/png', 'video/mp4']
  ) THEN RAISE EXCEPTION 'FAIL: memories bucket is not configured'; END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
        AND policyname IN ('Users can upload own memory media', 'Users can delete own memory media', 'Admins can delete memory media',
                           'Admins can upload memory media', 'Owners and admins can view memory media')) <> 5 THEN
    RAISE EXCEPTION 'FAIL: memory media storage policies are missing';
  END IF;
  -- nobody (anon / public) may LIST the files of the memories bucket
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND cmd IN ('SELECT', 'ALL')
      AND qual ILIKE '%memories%' AND (roles && ARRAY['public', 'anon']::name[])
  ) THEN RAISE EXCEPTION 'FAIL: the memories bucket can be listed by anonymous users'; END IF;
END $$;

ROLLBACK;
SELECT 'ALL SECURITY CHECKS PASSED' AS result;

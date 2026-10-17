-- Security hardening for public launch.
-- Idempotent: safe to run on a database that already has part of it.

-- ---------------------------------------------------------------------------
-- 1. Only super_admin may change roles.
--    The old "Admins can manage roles" policy used has_role(..., 'admin'),
--    which super_admin also satisfies, so ANY admin could grant themselves
--    (or anyone) super_admin. The super_admin policy from
--    20260305000001 already covers role management.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- ---------------------------------------------------------------------------
-- 2. Students must not be able to approve their own profile.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can update own profile" ON public.student_profiles;
CREATE POLICY "Students can update own profile" ON public.student_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can insert own profile" ON public.student_profiles;
CREATE POLICY "Students can insert own profile" ON public.student_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS cannot restrict individual columns, so approval is guarded by a trigger.
-- Only requests made as anon/authenticated by non-admins are checked; the
-- SQL editor, migrations and the service role are trusted.
CREATE OR REPLACE FUNCTION public.guard_student_profile_approval()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated')
     OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND COALESCE(NEW.is_approved, false) THEN
    RAISE EXCEPTION 'Only admins can approve a profile' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
    RAISE EXCEPTION 'Only admins can approve a profile' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_student_profile_approval ON public.student_profiles;
CREATE TRIGGER guard_student_profile_approval
  BEFORE INSERT OR UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_student_profile_approval();

-- ---------------------------------------------------------------------------
-- 3. Donations: the public may only submit PENDING donations.
--    Previously WITH CHECK (true) let anyone insert status = 'approved' and
--    inflate the public totals.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Anyone can submit a pending donation" ON public.donations;
CREATE POLICY "Anyone can submit a pending donation" ON public.donations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND notes IS NULL
    AND amount > 0
    AND char_length(btrim(donor_name)) > 0
  );

ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_valid_values;
ALTER TABLE public.donations ADD CONSTRAINT donations_valid_values CHECK (
  status IN ('pending', 'approved', 'rejected')
  AND amount > 0
  AND char_length(donor_name) <= 100
  AND char_length(donor_email) <= 255
  AND char_length(donor_phone) <= 20
  AND char_length(transaction_id) <= 100
  AND char_length(purpose) <= 500
) NOT VALID;

-- The public donation page needs per-campaign totals of APPROVED donations,
-- but anonymous users cannot read the donations table (it holds donor contact
-- details). Expose only the aggregates.
CREATE OR REPLACE FUNCTION public.get_donation_totals()
RETURNS TABLE (campaign_id UUID, total NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.campaign_id, COALESCE(SUM(d.amount), 0)
  FROM public.donations d
  WHERE d.status = 'approved'
  GROUP BY d.campaign_id
$$;

REVOKE ALL ON FUNCTION public.get_donation_totals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_donation_totals() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Testimonials: users may only submit UNAPPROVED testimonials.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can insert testimonials" ON public.testimonials;
CREATE POLICY "Authenticated users can insert testimonials" ON public.testimonials
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE(is_approved, false) = false);

ALTER TABLE public.testimonials DROP CONSTRAINT IF EXISTS testimonials_valid_values;
ALTER TABLE public.testimonials ADD CONSTRAINT testimonials_valid_values CHECK (
  char_length(message) BETWEEN 10 AND 500
  AND char_length(name) <= 100
) NOT VALID;

-- ---------------------------------------------------------------------------
-- 5. Contact form: same class of problem. Anonymous senders must not be able
--    to insert pre-"read" messages (hidden from the unread badge) or
--    arbitrarily large payloads.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (COALESCE(is_read, false) = false);

ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_valid_values;
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_valid_values CHECK (
  char_length(name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND char_length(subject) BETWEEN 1 AND 200
  AND char_length(message) BETWEEN 1 AND 5000
) NOT VALID;

-- ---------------------------------------------------------------------------
-- 6. Storage buckets are public: only allow images, with a size cap.
-- ---------------------------------------------------------------------------
UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'gallery';

-- Copy of supabase/migrations/20260307000000_memories_and_admin_tools.sql for a one-time paste into the Supabase SQL Editor.
-- Run it AFTER 1_run_first.sql and 2_run_second.sql. Safe to run more than once.

-- Memories (user-submitted stories, photos and videos with admin moderation)
-- and the admin tools that need database support.
-- Idempotent: safe to run more than once.

-- ---------------------------------------------------------------------------
-- 1. Memories
-- ---------------------------------------------------------------------------

-- media is an array of
--   { "type": "image" | "video", "path": "<owner id>/<file name>" }   (a file in the 'memories' bucket)
--   { "type": "youtube", "url": "https://youtu.be/<11 character id>" }
-- Uploaded files are pinned to the owner's own storage folder, and the page builds
-- the public address itself from that path, so a memory can never point at someone
-- else's file or at an outside web address.
CREATE OR REPLACE FUNCTION public.is_valid_memory_media(m jsonb, owner uuid)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_typeof(m) = 'array'
    AND jsonb_array_length(m) <= 10
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(m) AS e
      WHERE jsonb_typeof(e) <> 'object'
         OR (e ->> 'type') IS NULL
         OR (e ->> 'type') NOT IN ('image', 'video', 'youtube')
         OR ((e ->> 'type') = 'youtube' AND coalesce(e ->> 'url', '') !~ '^https://youtu\.be/[A-Za-z0-9_-]{11}$')
         OR ((e ->> 'type') IN ('image', 'video') AND coalesce(e ->> 'path', '') !~ ('^' || owner::text || '/[A-Za-z0-9._-]{1,100}$'))
         OR char_length(coalesce(e ->> 'url', '')) > 600
    )
$$;

CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  batch_year INTEGER,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'অন্যান্য',
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT memories_valid_values CHECK (
    status IN ('pending', 'approved', 'rejected')
    AND char_length(btrim(title)) BETWEEN 3 AND 150
    AND char_length(btrim(body)) BETWEEN 10 AND 5000
    AND char_length(btrim(author_name)) BETWEEN 1 AND 100
    AND char_length(category) <= 50
    AND (rejection_reason IS NULL OR char_length(rejection_reason) <= 500)
    AND public.is_valid_memory_media(media, user_id)
  )
);

-- (re)apply the constraint so databases created by an earlier version of this file pick up the stricter rule
ALTER TABLE public.memories DROP CONSTRAINT IF EXISTS memories_valid_values;
ALTER TABLE public.memories ADD CONSTRAINT memories_valid_values CHECK (
  status IN ('pending', 'approved', 'rejected')
  AND char_length(btrim(title)) BETWEEN 3 AND 150
  AND char_length(btrim(body)) BETWEEN 10 AND 5000
  AND char_length(btrim(author_name)) BETWEEN 1 AND 100
  AND char_length(category) <= 50
  AND (rejection_reason IS NULL OR char_length(rejection_reason) <= 500)
  AND public.is_valid_memory_media(media, user_id)
);
DROP FUNCTION IF EXISTS public.is_valid_memory_media(jsonb);

CREATE INDEX IF NOT EXISTS memories_status_created_idx ON public.memories (status, created_at DESC);
CREATE INDEX IF NOT EXISTS memories_user_idx ON public.memories (user_id);
CREATE INDEX IF NOT EXISTS memories_featured_idx ON public.memories (is_featured) WHERE is_featured;

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.memories FROM anon, authenticated;
GRANT SELECT ON public.memories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO authenticated;

DROP POLICY IF EXISTS "Approved memories are public" ON public.memories;
CREATE POLICY "Approved memories are public" ON public.memories
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS "Users can view own memories" ON public.memories;
CREATE POLICY "Users can view own memories" ON public.memories
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit own memories" ON public.memories;
CREATE POLICY "Users can submit own memories" ON public.memories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can edit own memories" ON public.memories;
CREATE POLICY "Users can edit own memories" ON public.memories
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own memories" ON public.memories;
CREATE POLICY "Users can delete own memories" ON public.memories
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage memories" ON public.memories;
CREATE POLICY "Admins can manage memories" ON public.memories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Moderation rules RLS cannot express:
--  * ordinary users can only submit pending memories and cannot touch the
--    moderation fields (status, reason, featured, approved_at, owner);
--  * any edit by the owner sends the memory back for review;
--  * a user can have at most 30 memories (basic spam guard);
--  * admins / service role are trusted, and approved_at follows the status.
CREATE OR REPLACE FUNCTION public.guard_memory_moderation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated')
     OR public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status = 'approved' AND NEW.approved_at IS NULL THEN
        NEW.approved_at := now();
      END IF;
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.approved_at := CASE WHEN NEW.status = 'approved' THEN now() ELSE NULL END;
      IF NEW.status <> 'rejected' THEN
        NEW.rejection_reason := NULL;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending'
       OR NEW.is_featured
       OR NEW.rejection_reason IS NOT NULL
       OR NEW.approved_at IS NOT NULL THEN
      RAISE EXCEPTION 'Only admins can moderate memories' USING ERRCODE = '42501';
    END IF;
    IF (SELECT count(*) FROM public.memories WHERE user_id = NEW.user_id) >= 30 THEN
      RAISE EXCEPTION 'Memory limit reached' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE by the owner
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.is_featured IS DISTINCT FROM OLD.is_featured
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending') THEN
    RAISE EXCEPTION 'Only admins can moderate memories' USING ERRCODE = '42501';
  END IF;

  NEW.status := 'pending';
  NEW.rejection_reason := NULL;
  NEW.approved_at := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_memory_moderation ON public.memories;
CREATE TRIGGER guard_memory_moderation
  BEFORE INSERT OR UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.guard_memory_moderation();

DROP TRIGGER IF EXISTS update_memories_updated_at ON public.memories;
CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 2. Storage for memory photos and videos (public bucket, 50 MB per file).
--    Files live under "<user id>/<random name>"; people can only write to
--    their own folder, admins can remove anything.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memories', 'memories', true, 52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- No public SELECT policy: files are served through the bucket's public URLs, which do not
-- need one, and a policy would let anybody LIST every uploaded file (including media of
-- memories that are still pending or were rejected).
DROP POLICY IF EXISTS "Memory media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can view memory media" ON storage.objects;
CREATE POLICY "Owners and admins can view memory media" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'memories'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );

DROP POLICY IF EXISTS "Users can upload own memory media" ON storage.objects;
CREATE POLICY "Users can upload own memory media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins edit other people's memories, so they may add files to the owner's folder too.
DROP POLICY IF EXISTS "Admins can upload memory media" ON storage.objects;
CREATE POLICY "Admins can upload memory media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'memories' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own memory media" ON storage.objects;
CREATE POLICY "Users can delete own memory media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'memories' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can delete memory media" ON storage.objects;
CREATE POLICY "Admins can delete memory media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'memories' AND public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 3. Admin tools
-- ---------------------------------------------------------------------------

-- Fully remove a user (login account + profile + roles + their memories and
-- testimonials, through ON DELETE CASCADE). The client cannot delete from
-- auth.users, so this runs with elevated rights after strict checks.
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
BEGIN
  IF caller IS NULL OR NOT public.has_role(caller, 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users' USING ERRCODE = '42501';
  END IF;
  IF target_user_id = caller THEN
    RAISE EXCEPTION 'You cannot delete your own account' USING ERRCODE = '42501';
  END IF;
  IF public.has_role(target_user_id, 'super_admin') THEN
    RAISE EXCEPTION 'A super admin account cannot be deleted here' USING ERRCODE = '42501';
  END IF;
  IF public.has_role(target_user_id, 'admin') AND NOT public.has_role(caller, 'super_admin') THEN
    RAISE EXCEPTION 'Only a super admin can delete an admin' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.admin_activity_log (admin_id, action, target_table, target_id)
  VALUES (caller, 'delete_user', 'auth.users', target_user_id::text);

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. E-mail addresses typed by the public end up in mailto: links for admins,
--    so only plain addresses are accepted (no "?bcc=..." tricks).
-- ---------------------------------------------------------------------------
ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_email_format;
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_email_format CHECK (
  email ~ '^[^@[:space:],;?&<>"'']+@[^@[:space:],;?&<>"'']+\.[^@[:space:],;?&<>"'']+$'
) NOT VALID;

ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_email_format;
ALTER TABLE public.donations ADD CONSTRAINT donations_email_format CHECK (
  donor_email IS NULL OR donor_email ~ '^[^@[:space:],;?&<>"'']+@[^@[:space:],;?&<>"'']+\.[^@[:space:],;?&<>"'']+$'
) NOT VALID;

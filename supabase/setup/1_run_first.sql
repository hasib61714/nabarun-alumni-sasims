-- Combined from supabase/migrations for a one-time paste into the Supabase SQL Editor.
-- Run this file FIRST and ALONE, then run 2_run_second.sql.

-- ===== 20260303183836_a389cec0-901d-48e7-a80d-4c0a1943ce0f.sql =====

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Student profiles table
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  roll TEXT,
  batch_year INTEGER,
  result TEXT,
  achievement TEXT,
  current_profession TEXT,
  higher_study TEXT,
  photo TEXT,
  linkedin_link TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- RLS for student_profiles
CREATE POLICY "Students can view own profile" ON public.student_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile" ON public.student_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own profile" ON public.student_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.student_profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.student_profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles" ON public.student_profiles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Approved profiles are publicly viewable
CREATE POLICY "Approved profiles are public" ON public.student_profiles
  FOR SELECT USING (is_approved = true);

-- Auto-create student profile and assign student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.student_profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ===== 20260303184956_4757283c-ed79-4713-8b58-fb22e138398f.sql =====

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to view avatars
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ===== 20260303185237_fbd5c758-b96b-4504-8d8b-515611535e6b.sql =====
ALTER TABLE public.student_profiles ADD COLUMN facebook_link TEXT;

-- ===== 20260303185712_7bf31ecc-8e7a-4479-bb12-29e3f8e3dbbb.sql =====

-- Add full_name to student_profiles for query-ability
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS full_name text;

-- Update handle_new_user to copy full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.student_profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Contact messages table
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can send a message
CREATE POLICY "Anyone can insert contact messages"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read/manage
CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contact messages"
ON public.contact_messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Notices table
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Published notices are public
CREATE POLICY "Published notices are public"
ON public.notices FOR SELECT
USING (is_published = true);

-- Admins can manage all notices
CREATE POLICY "Admins can manage notices"
ON public.notices FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notices
ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;


-- ===== 20260303195445_c5e1cfd1-b387-4795-abf8-4a433c1c55c2.sql =====

-- Create gallery_photos table
CREATE TABLE public.gallery_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT NOT NULL,
  event_name TEXT,
  batch_year INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

-- Public can view published photos
CREATE POLICY "Published photos are public"
ON public.gallery_photos FOR SELECT
USING (is_published = true);

-- Admins can do everything
CREATE POLICY "Admins can manage gallery"
ON public.gallery_photos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for gallery
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Storage policies
CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));


-- ===== 20260303195824_b509c527-bfd5-4bd2-9fbb-c3aa746f3fc1.sql =====

CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  category TEXT NOT NULL DEFAULT 'অন্যান্য',
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events are public"
ON public.events FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));


-- ===== 20260303200218_7eb2f520-89fd-4267-8019-a45257cc006b.sql =====

-- Donations table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  donor_phone TEXT,
  amount NUMERIC(12,2) NOT NULL,
  purpose TEXT,
  campaign_id UUID,
  payment_method TEXT DEFAULT 'বিকাশ',
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage donations"
ON public.donations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert donations"
ON public.donations FOR INSERT
WITH CHECK (true);

-- Donation campaigns table
CREATE TABLE public.donation_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  goal_amount NUMERIC(12,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active campaigns are public"
ON public.donation_campaigns FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage campaigns"
ON public.donation_campaigns FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add foreign key for campaign
ALTER TABLE public.donations
ADD CONSTRAINT fk_donations_campaign
FOREIGN KEY (campaign_id) REFERENCES public.donation_campaigns(id) ON DELETE SET NULL;

-- Add location to student_profiles for directory map
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS location TEXT;


-- ===== 20260304202027_ce033642-6f03-4303-ad62-efcebb45dfb7.sql =====

CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  batch_year INTEGER,
  profession TEXT,
  message TEXT NOT NULL,
  photo TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved testimonials
CREATE POLICY "Anyone can read approved testimonials"
ON public.testimonials FOR SELECT
USING (is_approved = true);

-- Authenticated users can insert their own
CREATE POLICY "Authenticated users can insert testimonials"
ON public.testimonials FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));


-- ===== 20260305000000_add_super_admin_role.sql =====
-- Add super_admin to the app_role enum.
--
-- This must live in its own migration: Postgres does not allow a newly added
-- enum value to be used in the same transaction that created it, so everything
-- that references 'super_admin' is in 20260305000001_super_admin_policies.sql.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';


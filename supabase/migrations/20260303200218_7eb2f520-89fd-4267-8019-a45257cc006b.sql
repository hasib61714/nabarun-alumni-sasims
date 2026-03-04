
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

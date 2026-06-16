-- =====================================================
-- COMPLETE DATABASE SETUP FOR NEW SUPABASE PROJECT
-- NayePankh Foundation - Volunteer Registration System
-- =====================================================
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Go to https://supabase.com/dashboard/project/ozpljocdmgaocdvhucdv
-- 3. Click "SQL Editor" in left sidebar
-- 4. Click "New Query"
-- 5. Paste this entire content
-- 6. Click "RUN" button
-- 7. Wait for "Success" message
-- =====================================================

-- =====================================================
-- PART 1: USER ROLES & AUTHENTICATION
-- =====================================================

-- Create roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Grant permissions
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Function to check if ANY admin exists (for anonymous users on auth page)
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

-- Grant execute permissions on admin_exists to everyone
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;

-- Trigger: Auto-grant admin role to the FIRST user that signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only grant admin to the FIRST user in the system
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_bootstrap
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin_bootstrap();

-- =====================================================
-- PART 2: VOLUNTEERS TABLE
-- =====================================================

-- Create volunteer status enum
CREATE TYPE public.volunteer_status AS ENUM ('Pending', 'Contacted', 'Active', 'Inactive', 'Archived');

-- Create volunteers table
CREATE TABLE public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_code TEXT NOT NULL UNIQUE DEFAULT ('NPF-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 13 AND age <= 120),
  address TEXT NOT NULL,
  areas_of_interest TEXT[] NOT NULL DEFAULT '{}',
  availability_days TEXT[] NOT NULL DEFAULT '{}',
  availability_hours TEXT NOT NULL DEFAULT '',
  prior_experience TEXT,
  heard_from TEXT,
  status public.volunteer_status NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteers TO authenticated;
GRANT INSERT ON public.volunteers TO anon;
GRANT ALL ON public.volunteers TO service_role;

-- Enable RLS
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can register" 
ON public.volunteers 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Admins can read all" 
ON public.volunteers 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins can update" 
ON public.volunteers 
FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins can delete" 
ON public.volunteers 
FOR DELETE 
TO authenticated 
USING (public.has_role(auth.uid(),'admin'));

-- Trigger function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SET search_path = public 
AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; 
$$;

-- Create trigger for volunteers table
CREATE TRIGGER volunteers_set_updated_at 
BEFORE UPDATE ON public.volunteers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create indexes for better performance
CREATE INDEX volunteers_created_at_idx ON public.volunteers (created_at DESC);
CREATE INDEX volunteers_status_idx ON public.volunteers (status);

-- =====================================================
-- PART 3: SEED DATA (12 DUMMY VOLUNTEERS)
-- =====================================================

INSERT INTO public.volunteers (full_name, email, phone, age, address, areas_of_interest, availability_days, availability_hours, prior_experience, heard_from, status, created_at) VALUES
('Rahul Sharma', 'rahul.sharma@example.com', '+91 98765 43210', 28, 'Connaught Place, New Delhi, Delhi', ARRAY['education', 'events'], ARRAY['Saturday', 'Sunday'], 'Weekends 10am-4pm', 'Taught at NGO for 2 years', 'Friend', 'Active', now() - interval '45 days'),
('Priya Patel', 'priya.patel@example.com', '+91 98765 43211', 24, 'Bodakdev, Ahmedabad, Gujarat', ARRAY['healthcare', 'fundraising'], ARRAY['Monday', 'Wednesday', 'Friday'], 'Evenings 6pm-9pm', 'Medical volunteer at camps', 'Instagram', 'Active', now() - interval '38 days'),
('Amit Kumar', 'amit.kumar@example.com', '+91 98765 43212', 32, 'Koramangala, Bangalore, Karnataka', ARRAY['education', 'social media'], ARRAY['Tuesday', 'Thursday'], 'Evenings 7pm-10pm', 'Social media manager', 'Facebook', 'Contacted', now() - interval '29 days'),
('Sneha Desai', 'sneha.desai@example.com', '+91 98765 43213', 26, 'Viman Nagar, Pune, Maharashtra', ARRAY['events', 'fundraising'], ARRAY['Saturday', 'Sunday'], 'Full day weekends', 'Event planning for corporate', 'Website', 'Pending', now() - interval '22 days'),
('Arjun Singh', 'arjun.singh@example.com', '+91 98765 43214', 30, 'Salt Lake, Kolkata, West Bengal', ARRAY['education'], ARRAY['Monday', 'Tuesday', 'Wednesday'], 'Mornings 8am-12pm', 'Teacher for 5 years', 'Friend', 'Active', now() - interval '60 days'),
('Kavya Menon', 'kavya.menon@example.com', '+91 98765 43215', 22, 'Marine Drive, Kochi, Kerala', ARRAY['social media', 'events'], ARRAY['Friday', 'Saturday', 'Sunday'], 'Flexible hours', 'Content creator', 'Twitter', 'Contacted', now() - interval '15 days'),
('Rohan Joshi', 'rohan.joshi@example.com', '+91 98765 43216', 35, 'Bandra West, Mumbai, Maharashtra', ARRAY['fundraising'], ARRAY['Thursday', 'Friday'], 'Evenings after 6pm', 'Finance professional', 'LinkedIn', 'Active', now() - interval '50 days'),
('Ananya Reddy', 'ananya.reddy@example.com', '+91 98765 43217', 27, 'Jubilee Hills, Hyderabad, Telangana', ARRAY['healthcare', 'education'], ARRAY['Monday', 'Wednesday', 'Friday'], 'Mornings 9am-1pm', 'Nurse', 'WhatsApp', 'Pending', now() - interval '8 days'),
('Vikram Iyer', 'vikram.iyer@example.com', '+91 98765 43218', 29, 'Anna Nagar, Chennai, Tamil Nadu', ARRAY['education', 'events'], ARRAY['Saturday', 'Sunday'], 'Weekends 2pm-6pm', 'Tech trainer', 'Event', 'Contacted', now() - interval '12 days'),
('Divya Nair', 'divya.nair@example.com', '+91 98765 43219', 25, 'Sector 62, Noida, Uttar Pradesh', ARRAY['social media'], ARRAY['Tuesday', 'Thursday', 'Saturday'], 'Evenings 7pm-10pm', 'Digital marketing', 'Instagram', 'Active', now() - interval '70 days'),
('Siddharth Kapoor', 'siddharth.kapoor@example.com', '+91 98765 43220', 31, 'Rajouri Garden, New Delhi, Delhi', ARRAY['fundraising', 'events'], ARRAY['Wednesday', 'Sunday'], 'Flexible', 'Corporate relations', 'Friend', 'Inactive', now() - interval '90 days'),
('Meera Gupta', 'meera.gupta@example.com', '+91 98765 43221', 23, 'Indiranagar, Bangalore, Karnataka', ARRAY['healthcare', 'social media'], ARRAY['Monday', 'Friday'], 'Mornings 10am-2pm', 'Healthcare communications', 'Website', 'Pending', now() - interval '5 days');

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. You should see "Success" message
-- 2. Visit http://localhost:5173/auth
-- 3. Create your first admin account
-- 4. Dashboard will show 12 sample volunteers
-- =====================================================

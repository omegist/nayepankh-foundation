-- =====================================================
-- COMPLETE FRESH SETUP - COPY ALL AND RUN IN SUPABASE
-- This replaces COMPLETE_MIGRATION.sql with fixed policies
-- =====================================================

-- Clean up (in case you ran the old one)
DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap ON auth.users;
DROP TRIGGER IF EXISTS volunteers_set_updated_at ON public.volunteers;
DROP POLICY IF EXISTS "Public can register" ON public.volunteers;
DROP POLICY IF EXISTS "Admins can read all" ON public.volunteers;
DROP POLICY IF EXISTS "Admins can update" ON public.volunteers;
DROP POLICY IF EXISTS "Admins can delete" ON public.volunteers;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP TABLE IF EXISTS public.volunteers CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.admin_exists() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_admin_bootstrap() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP TYPE IF EXISTS public.volunteer_status CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- =====================================================
-- PART 1: USER ROLES SETUP
-- =====================================================

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Grant permissions on user_roles
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_roles TO anon;
GRANT ALL ON public.user_roles TO service_role;

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function: Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function: Check if ANY admin exists (for auth page)
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
$$;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon;

-- Trigger function: Make first user admin
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only grant admin to first user
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_bootstrap
AFTER INSERT ON auth.users
FOR EACH ROW 
EXECUTE FUNCTION public.handle_new_user_admin_bootstrap();

-- =====================================================
-- PART 2: VOLUNTEERS TABLE SETUP
-- =====================================================

-- Create volunteer_status enum
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

-- Grant permissions on volunteers (CRITICAL FOR PUBLIC REGISTRATION)
GRANT SELECT ON public.volunteers TO authenticated;
GRANT INSERT ON public.volunteers TO authenticated;
GRANT INSERT ON public.volunteers TO anon;  -- Allow public registration
GRANT UPDATE ON public.volunteers TO authenticated;
GRANT DELETE ON public.volunteers TO authenticated;
GRANT ALL ON public.volunteers TO service_role;

-- Enable RLS on volunteers
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (PUBLIC REGISTRATION)
CREATE POLICY "Anyone can insert volunteers" 
ON public.volunteers 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Policy: Only admins can read
CREATE POLICY "Admins can read all volunteers" 
ON public.volunteers 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can update
CREATE POLICY "Admins can update volunteers" 
ON public.volunteers 
FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete
CREATE POLICY "Admins can delete volunteers" 
ON public.volunteers 
FOR DELETE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Function: Auto-update updated_at
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

-- Trigger: Update updated_at on volunteers
CREATE TRIGGER volunteers_set_updated_at 
BEFORE UPDATE ON public.volunteers
FOR EACH ROW 
EXECUTE FUNCTION public.set_updated_at();

-- Create indexes for performance
CREATE INDEX volunteers_created_at_idx ON public.volunteers (created_at DESC);
CREATE INDEX volunteers_status_idx ON public.volunteers (status);
CREATE INDEX volunteers_email_idx ON public.volunteers (email);
CREATE INDEX user_roles_user_id_idx ON public.user_roles (user_id);
CREATE INDEX user_roles_role_idx ON public.user_roles (role);

-- =====================================================
-- PART 3: SAMPLE DATA (12 VOLUNTEERS)
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
-- VERIFICATION
-- =====================================================

SELECT 
  'Setup complete! Tables created:' as status,
  (SELECT COUNT(*) FROM public.volunteers) as sample_volunteers,
  (SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_bootstrap')) as admin_trigger_exists;

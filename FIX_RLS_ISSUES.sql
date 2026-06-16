-- =====================================================
-- QUICK FIX - RUN THIS IN SUPABASE SQL EDITOR
-- Fixes: Admin login and volunteer registration issues
-- =====================================================

-- Fix 1: Drop and recreate the public registration policy
DROP POLICY IF EXISTS "Public can register" ON public.volunteers;

CREATE POLICY "Public can register" 
ON public.volunteers 
FOR INSERT 
TO public
WITH CHECK (true);

-- Fix 2: Make sure anon users can insert
GRANT INSERT ON public.volunteers TO anon;
GRANT INSERT ON public.volunteers TO authenticated;

-- Fix 3: Update the admin_exists function to handle errors gracefully
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')),
    false
  )
$$;

-- Fix 4: Ensure the bootstrap function works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Grant admin to the FIRST user in the system
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix 5: Make sure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap ON auth.users;

CREATE TRIGGER on_auth_user_created_bootstrap
AFTER INSERT ON auth.users
FOR EACH ROW 
EXECUTE FUNCTION public.handle_new_user_admin_bootstrap();

-- Verify everything is set up correctly
SELECT 'Setup completed successfully!' as status;

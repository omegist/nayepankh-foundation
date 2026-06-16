-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- This fixes the "Create admin" showing when admin already exists

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;

-- After running this:
-- 1. You'll see "Success. No rows returned"
-- 2. Refresh http://localhost:5173/auth
-- 3. You should now see "Sign in" form
-- 4. Login with your existing admin credentials

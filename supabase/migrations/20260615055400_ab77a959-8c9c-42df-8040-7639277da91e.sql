
-- Roles enum & user_roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-grant admin role to the first user that signs up (bootstrap admin)
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_bootstrap
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin_bootstrap();

-- Volunteers
CREATE TYPE public.volunteer_status AS ENUM ('Pending', 'Contacted', 'Active', 'Inactive', 'Archived');

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteers TO authenticated;
GRANT INSERT ON public.volunteers TO anon;
GRANT ALL ON public.volunteers TO service_role;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can register as a volunteer
CREATE POLICY "Public can register" ON public.volunteers FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Only admins can read/update/delete
CREATE POLICY "Admins can read all" ON public.volunteers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update" ON public.volunteers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete" ON public.volunteers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER volunteers_set_updated_at BEFORE UPDATE ON public.volunteers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX volunteers_created_at_idx ON public.volunteers (created_at DESC);
CREATE INDEX volunteers_status_idx ON public.volunteers (status);

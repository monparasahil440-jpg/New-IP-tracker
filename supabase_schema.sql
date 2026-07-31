-- =========================================================
-- LOCATION SHARE - SUPABASE DATABASE MIGRATION SCRIPT
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Shares are viewable by anyone with link" ON public.shares;
DROP POLICY IF EXISTS "Anyone can create share nodes" ON public.shares;
DROP POLICY IF EXISTS "Owners can update shares" ON public.shares;
DROP POLICY IF EXISTS "Owners can delete shares" ON public.shares;

DROP POLICY IF EXISTS "Locations viewable by share link" ON public.locations;
DROP POLICY IF EXISTS "Locations updatable by node launcher" ON public.locations;
DROP POLICY IF EXISTS "Locations updateable by node launcher" ON public.locations;

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. SHARES TABLE
CREATE TABLE IF NOT EXISTS public.shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uuid TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  title TEXT DEFAULT 'Tactical GPS Stream',
  target_url TEXT, -- Optional destination URL (e.g. google.com)
  mode TEXT NOT NULL DEFAULT 'continuous', -- 'once' | 'continuous'
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  passcode_hint TEXT
);

-- Add column if table already exists without target_url
ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS target_url TEXT;

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shares are viewable by anyone with link" ON public.shares
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create share nodes" ON public.shares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can update shares" ON public.shares
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Owners can delete shares" ON public.shares
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES public.shares(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  battery_level DOUBLE PRECISION,
  is_charging BOOLEAN,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations viewable by share link" ON public.locations
  FOR SELECT USING (true);

CREATE POLICY "Locations updatable by node launcher" ON public.locations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Locations updateable by node launcher" ON public.locations
  FOR UPDATE USING (true);

-- 4. REALTIME PUBLICATION ENABLEMENT & API REFRESH
ALTER PUBLICATION supabase_realtime ADD TABLE public.shares, public.locations;

NOTIFY pgrst, 'reload schema';

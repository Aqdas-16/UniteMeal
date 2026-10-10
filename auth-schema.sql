-- Add firebase_uid to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS firebase_uid text UNIQUE;

-- We don't need auth.users dependencies for Firebase
-- But since we can't easily drop the foreign key constraint if we don't know its exact name without querying, 
-- wait, the constraint is "profiles_id_fkey". Let's attempt to drop it.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Ensure RLS is open or updated for anonymous/service role operations
-- Since Firebase Auth handles authentication, Supabase client will be unauthenticated.
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be inserted by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles can be inserted by everyone." ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles can be updated by everyone." ON public.profiles FOR UPDATE USING (true);


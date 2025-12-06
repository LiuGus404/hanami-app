
-- Fix for "infinite recursion" and "policy already exists"
-- We need to DROP the existing policy "Users can view their own membership" before recreating it,
-- in case it is the one causing the recursion or just conflicting.

DROP POLICY IF EXISTS "Users can view their own membership" ON public.room_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.room_members;
DROP POLICY IF EXISTS "Enable read access for room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can view members of their rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;
DROP POLICY IF EXISTS "View members" ON public.room_members;
DROP POLICY IF EXISTS "Select members" ON public.room_members;

-- Create safe, non-recursive policy
CREATE POLICY "Users can view their own membership"
ON public.room_members
FOR SELECT
USING (auth.uid() = user_id);

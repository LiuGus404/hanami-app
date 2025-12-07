-- Migration: Fix RLS Deadlocks/Infinite Recursion on room_members and ai_messages
-- Timestamp: 20251207160000

-- 1. Fix room_members policies
-- Drop ALL existing policies to ensure we start fresh and remove any recursive ones
DROP POLICY IF EXISTS "Users can view their own membership" ON public.room_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.room_members;
DROP POLICY IF EXISTS "Enable read access for room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can view members of their rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;
DROP POLICY IF EXISTS "View members" ON public.room_members;
DROP POLICY IF EXISTS "Select members" ON public.room_members;
-- Drop potentially hidden policies (best effort based on what might exist)
-- Note: 'DROP POLICY IF EXISTS' won't fail if it doesn't exist, so this is safe.

-- Enable RLS just in case
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Create the PRIMARY non-recursive policy for room_members
-- A user can see a row if the user_id matches their own ID.
-- This allows: supabase.from('room_members').select('*').eq('user_id', my_id) -> SUCCESS
CREATE POLICY "Users can view their own membership"
ON public.room_members
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Fix ai_messages policies
-- Drop potential existing policies
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.ai_messages;
DROP POLICY IF EXISTS "View messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Select messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Enable read access for room members" ON public.ai_messages;

-- Enable RLS
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Create a safe policy for ai_messages
-- Logic: A user can see a message if they are a member of the room the message belongs to.
-- Implementation: Check existence in room_members using a semi-join.
-- Since "Users can view their own membership" allows selecting rows where user_id = auth.uid(),
-- the subquery (SELECT 1 FROM room_members WHERE user_id = auth.uid() ...) is SAFE and recurses only to the "own membership" policy.
CREATE POLICY "Users can view messages in their rooms"
ON public.ai_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_members.room_id = ai_messages.room_id
    AND room_members.user_id = auth.uid()
  )
);

-- 3. Optimization
-- Ensure index exists for the lookups in the policy
CREATE INDEX IF NOT EXISTS idx_room_members_user_room ON public.room_members(user_id, room_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_room_id ON public.ai_messages(room_id);

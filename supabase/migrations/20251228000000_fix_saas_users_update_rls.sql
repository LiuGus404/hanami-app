-- Migration: Fix saas_users RLS to allow UPDATE operations
-- Date: 2025-12-28
-- Issue: 用戶無法更新個人資料（全名等），因為缺少 UPDATE 政策

-- 1. Drop existing UPDATE policy if any
DROP POLICY IF EXISTS "Users can update their own profile" ON public.saas_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.saas_users;

-- 2. Create UPDATE policy that allows users to update their own profile
-- Matching by ID OR Email (consistent with SELECT policy)
CREATE POLICY "Users can update their own profile" ON public.saas_users
FOR UPDATE
USING (
  auth.uid() = id 
  OR 
  lower(email) = lower(auth.jwt() ->> 'email')
)
WITH CHECK (
  auth.uid() = id 
  OR 
  lower(email) = lower(auth.jwt() ->> 'email')
);

-- 3. Verify the policy was created
DO $$
BEGIN
  RAISE NOTICE 'UPDATE policy for saas_users created successfully';
END $$;

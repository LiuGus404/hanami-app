-- Migration: Fix Super Admin User and RLS
-- Date: 2025-12-11
-- Description: Ensures saas_users has RLS enabled, allows users to read own data, and sets tqfea12@gmail.com as super_admin.

-- 1. Enable RLS on saas_users (idempotent)
ALTER TABLE public.saas_users ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for reading own data
-- Drop first to allow re-running
DROP POLICY IF EXISTS "Users can view own profile" ON public.saas_users;

CREATE POLICY "Users can view own profile"
  ON public.saas_users
  FOR SELECT
  USING (auth.uid() = id);

-- 3. Grant super_admin to the target user (tqfea12@gmail.com)
UPDATE public.saas_users
SET user_role = 'super_admin'
WHERE email = 'tqfea12@gmail.com';

-- 4. Ensure veritas050117@gmail.com is NOT super_admin if accidentally set previously
UPDATE public.saas_users
SET user_role = 'member'
WHERE email = 'veritas050117@gmail.com' AND user_role = 'super_admin';

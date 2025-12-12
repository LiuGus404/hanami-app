-- Migration: Fix saas_users RLS to allow Email match and sync Super Admin ID
-- Date: 2025-12-12

-- 1. Drop existing policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.saas_users;

-- 2. Create new policy that allows matching by ID OR Email
-- Using auth.jwt() ->> 'email' to get the email from the token
CREATE POLICY "Users can view own profile"
  ON public.saas_users
  FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    lower(email) = lower(auth.jwt() ->> 'email')
  );

-- 3. Sync ID for tqfea12@gmail.com to the current Auth ID
-- The current Auth ID observed in logs is '4b8fcd8f-ea99-42f6-8509-88018aac7a3d'
DO $$
DECLARE
  target_email text := 'tqfea12@gmail.com';
  target_uid uuid := '4b8fcd8f-ea99-42f6-8509-88018aac7a3d';
BEGIN
  -- Check if a record exists for this email
  IF EXISTS (SELECT 1 FROM public.saas_users WHERE email = target_email) THEN
    -- Update the record to match the new UID and ensure super_admin role
    -- We use ON CONFLICT logic simulation by straight update since ID is PK
    -- But if ID is changing, we must ensure no other record has that PK (target_uid)
    
    -- First, delete any lingering record that might have target_uid but WRONG email (unlikely but safe)
    DELETE FROM public.saas_users WHERE id = target_uid AND email != target_email;
    
    -- Now update the record with the email to have the target_uid
    UPDATE public.saas_users
    SET id = target_uid, user_role = 'super_admin'
    WHERE email = target_email;
  ELSE
    -- If no record exists at all for this email, insert it
    INSERT INTO public.saas_users (id, email, full_name, user_role, subscription_status)
    VALUES (target_uid, target_email, 'Owner', 'super_admin', 'active')
    ON CONFLICT (id) DO UPDATE
    SET user_role = 'super_admin', email = target_email;
  END IF;
END $$;

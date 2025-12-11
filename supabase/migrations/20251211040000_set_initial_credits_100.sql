-- Migration: Set Initial User Credits to 100
-- Date: 2025-12-11
-- Description: Updates 'free' plan credits to 100 and updates handle_new_user trigger to grant them.

-- 1. Update Free Plan Configuration (100 credits)
UPDATE public.saas_subscription_plans
SET 
  monthly_credits = 100,
  features = '["每次 L1 查詢消耗 3 點", "每月 100 點免費額度", "基礎功能"]'::jsonb
WHERE id = 'free';

-- 2. Update handle_new_user function to grant initial credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 1. Create saas_user record
  INSERT INTO public.saas_users (
    id,
    email,
    full_name,
    avatar_url,
    subscription_status,
    usage_count,
    usage_limit,
    is_verified,
    verification_method,
    created_at,
    updated_at,
    subscription_plan_id
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'free', -- Default subscription status
    0,      -- Initial usage count
    NULL,   -- Default usage limit (NULL for unlimited L1 in new system, or controlled by plan)
    new.email_confirmed_at IS NOT NULL,
    'email', -- Verification method
    now(),
    now(),
    'free'  -- Default plan
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Initialize Food Balance (Legacy support & Display)
  -- Use ON CONFLICT to be safe, but for new users this should insert.
  INSERT INTO public.user_food_balance (
    user_id,
    current_balance,
    total_spent,
    daily_usage,
    weekly_usage,
    monthly_usage,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    100, -- Initial Balance 100
    0,
    0,
    0,
    0,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_balance = 100,
    updated_at = now();

  -- 3. Grant Initial Credits in Ledger
  INSERT INTO public.ai_credits_ledger (
    user_id,
    batch_type,
    amount_initial,
    amount_remaining,
    priority,
    expires_at,
    status,
    created_at
  )
  VALUES (
    new.id,
    'monthly_quota', -- Initial grant treated as monthly quota
    100,
    100,
    10, -- Standard priority
    now() + interval '1 month',
    'active',
    now()
  );

  RETURN new;
END;
$$;

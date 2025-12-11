-- Migration: Update Free Plan Logic & Backfill Legacy Credits
-- Date: 2025-12-11
-- Description: Switches Free plan to pay-per-use (3 credits) and backfills ledger.

-- 1. Backfill Legacy Credits to Ledger
-- This ensures users with existing 'user_food_balance' can use the new 'deduct_user_food' function.
-- usage: Insert one 'Legacy' batch for each user with >0 balance and NO existing ledger entries.
INSERT INTO public.ai_credits_ledger (
  id,
  user_id,
  batch_type,
  amount_initial,
  amount_remaining,
  priority,
  expires_at,
  status,
  created_at
)
SELECT
  gen_random_uuid(),
  user_id,
  'grant', -- Use 'grant' for migrated legacy credits
  current_balance,
  current_balance,
  10, -- Priority 10 (Monthly/Standard)
  now() + interval '5 years', -- Long expiry for legacy credits
  'active',
  now()
FROM public.user_food_balance
WHERE current_balance > 0
AND EXISTS (SELECT 1 FROM public.saas_users WHERE id = public.user_food_balance.user_id)
AND NOT EXISTS (
  SELECT 1 FROM public.ai_credits_ledger WHERE user_id = public.user_food_balance.user_id
);

-- 2. Update Free Plan Configuration
-- Remove daily limit (set to NULL)
UPDATE public.saas_subscription_plans
SET daily_l1_limit = NULL
WHERE id = 'free';

-- 3. Update Free Plan metadata (Features & Name)
UPDATE public.saas_subscription_plans
SET 
    features = '["每次 L1 查詢消耗 3 點", "每月 50 點免費額度", "基礎功能"]'::jsonb
WHERE id = 'free';

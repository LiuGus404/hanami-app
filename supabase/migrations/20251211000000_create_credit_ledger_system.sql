-- 1. Create Subscription Plans Table (Robust)
CREATE TABLE IF NOT EXISTS public.saas_subscription_plans (
  id text PRIMARY KEY
);

-- Fix ID type conflicts (UUID -> Text)
-- This requires dropping the Foreign Key and View first!
-- Fix ID type conflicts (UUID -> Text)
-- This requires dropping ANY Foreign Keys referencing the ID first!
DO $$ 
BEGIN
    -- 1. Drop dependent FK constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'saas_users_subscription_plan_id_fkey') THEN
        ALTER TABLE public.saas_users DROP CONSTRAINT saas_users_subscription_plan_id_fkey;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'saas_user_subscriptions_plan_id_fkey') THEN
        ALTER TABLE public.saas_user_subscriptions DROP CONSTRAINT saas_user_subscriptions_plan_id_fkey;
    END IF;

    -- 2. Drop dependent view
    DROP VIEW IF EXISTS public.saas_user_overview;

    -- 3. Alter Columns to TEXT
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saas_users') THEN
        ALTER TABLE public.saas_users ALTER COLUMN subscription_plan_id TYPE text;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saas_user_subscriptions') THEN
        ALTER TABLE public.saas_user_subscriptions ALTER COLUMN plan_id TYPE text;
    END IF;

    ALTER TABLE public.saas_subscription_plans ALTER COLUMN id TYPE text;

    -- 4. Restore FK Constraints
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saas_users') THEN
        ALTER TABLE public.saas_users 
        ADD CONSTRAINT saas_users_subscription_plan_id_fkey 
        FOREIGN KEY (subscription_plan_id) REFERENCES public.saas_subscription_plans(id);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saas_user_subscriptions') THEN
        ALTER TABLE public.saas_user_subscriptions 
        ADD CONSTRAINT saas_user_subscriptions_plan_id_fkey 
        FOREIGN KEY (plan_id) REFERENCES public.saas_subscription_plans(id);
    END IF;

END $$;

-- Ensure all columns exist (in case table already existed from a previous specific migration)
DO $$
BEGIN
    -- Handle legacy 'plan_name' collision (User reported NOT NULL violation)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_subscription_plans' AND column_name = 'plan_name') THEN
        ALTER TABLE public.saas_subscription_plans ALTER COLUMN plan_name DROP NOT NULL;
    END IF;

    -- Handle legacy 'plan_type' collision
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_subscription_plans' AND column_name = 'plan_type') THEN
        ALTER TABLE public.saas_subscription_plans ALTER COLUMN plan_type DROP NOT NULL;
    END IF;

    -- Handle legacy 'usage_limit' collision
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_subscription_plans' AND column_name = 'usage_limit') THEN
        ALTER TABLE public.saas_subscription_plans ALTER COLUMN usage_limit DROP NOT NULL;
    END IF;

    ALTER TABLE public.saas_subscription_plans ADD COLUMN IF NOT EXISTS name text;
    ALTER TABLE public.saas_subscription_plans ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
    ALTER TABLE public.saas_subscription_plans ADD COLUMN IF NOT EXISTS currency text DEFAULT 'HKD';
    ALTER TABLE public.saas_subscription_plans ADD COLUMN IF NOT EXISTS monthly_credits integer DEFAULT 0;
    ALTER TABLE public.saas_subscription_plans ADD COLUMN IF NOT EXISTS daily_l1_limit integer DEFAULT NULL;
    ALTER TABLE public.saas_subscription_plans ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb;
    ALTER TABLE public.saas_subscription_plans ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
    ALTER TABLE public.saas_subscription_plans ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
    ALTER TABLE public.saas_subscription_plans ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
END $$;

-- Recreate View (Standard Definition to restore functionality)
CREATE OR REPLACE VIEW public.saas_user_overview AS
 SELECT u.id,
    u.email,
    u.full_name,
    u.subscription_plan_id,
    p.name AS plan_name,
    p.monthly_credits,
    (u.subscription_end_date > now()) AS is_active
   FROM public.saas_users u
     LEFT JOIN public.saas_subscription_plans p ON u.subscription_plan_id = p.id;

-- Seed Plans
INSERT INTO public.saas_subscription_plans (id, name, price, monthly_credits, daily_l1_limit, features)
VALUES 
  ('free', 'Free 免費版', 0, 0, 5, '["每日 5 次 L1 查詢", "基礎功能"]'),
  ('starter', 'Starter 輕量版', 138, 500, NULL, '["無限 L1 查詢", "500 Credits"]'),
  ('plus', 'Plus 進階版', 288, 2000, NULL, '["無限 L1 查詢", "2000 Credits", "優先支援"]'),
  ('pro', 'Pro 專業版', 688, 6000, NULL, '["無限 L1 查詢", "6000 Credits", "VIP 支援"]')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  monthly_credits = EXCLUDED.monthly_credits,
  daily_l1_limit = EXCLUDED.daily_l1_limit;

-- 2. Create AI Credits Ledger Table (The Core Logic)
CREATE TABLE IF NOT EXISTS public.ai_credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.saas_users(id),
  batch_type text NOT NULL CHECK (batch_type IN ('monthly_quota', 'top_up', 'grant', 'refund')),
  amount_initial integer NOT NULL,
  amount_remaining integer NOT NULL,
  priority integer NOT NULL DEFAULT 20, -- Lower number = Higher priority (10=Plan, 20=Top-up)
  expires_at timestamp with time zone NOT NULL,
  activated_at timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired')),
  created_at timestamp with time zone DEFAULT now(),
  trans_ref_id text, -- Optional reference to payment ID or subscription ID
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Index for fast lookup during deduction
CREATE INDEX IF NOT EXISTS idx_ai_credits_ledger_deduction 
ON public.ai_credits_ledger (user_id, status, priority, expires_at);

-- 3. Function to Grant Top-up Credits
CREATE OR REPLACE FUNCTION public.grant_topup_credits(
  p_user_id uuid,
  p_amount integer,
  p_days_valid integer DEFAULT 30,
  p_ref_id text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ledger_id uuid;
BEGIN
  INSERT INTO public.ai_credits_ledger (
    user_id,
    batch_type,
    amount_initial,
    amount_remaining,
    priority,
    expires_at,
    trans_ref_id
  ) VALUES (
    p_user_id,
    'top_up',
    p_amount,
    p_amount,
    20, -- Top-up priority (consumed AFTER monthly quota)
    now() + (p_days_valid || ' days')::interval,
    p_ref_id
  ) RETURNING id INTO v_ledger_id;

  -- Update the cached balance in user_food_balance
  -- (Trigger approach is better, but manual update is safer for now)
  UPDATE public.user_food_balance
  SET 
    current_balance = current_balance + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN v_ledger_id;
END;
$$;

-- 4. NEW LOGIC: Deduct User Food (Credits) using Ledger
-- Replaces the old simple subtraction logic with Batch-FIFO logic.
CREATE OR REPLACE FUNCTION public.deduct_user_food(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_ai_message_id uuid DEFAULT NULL,
  p_ai_room_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch record;
  v_remaining_deduction integer := p_amount;
  v_deducted_from_batch integer;
  v_total_deducted integer := 0;
  v_updated_balance integer;
BEGIN
  -- 1. Check if user has enough TOTAL valid credits
  -- (Just a quick check to fail fast, though we strictly do ledger processing below)
  IF (SELECT COALESCE(SUM(amount_remaining), 0) 
      FROM public.ai_credits_ledger 
      WHERE user_id = p_user_id 
        AND status = 'active' 
        AND expires_at > now()) < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- 2. Iterate through stacks (Priority ASC, then Expires ASC)
  -- Priority 10 (Monthly) comes before 20 (Top-up).
  -- Within same priority, consume earliest expiring first.
  FOR v_batch IN 
    SELECT * 
    FROM public.ai_credits_ledger 
    WHERE user_id = p_user_id 
      AND status = 'active' 
      AND amount_remaining > 0
      AND expires_at > now()
    ORDER BY priority ASC, expires_at ASC
    FOR UPDATE -- Lock these rows
  LOOP
    IF v_remaining_deduction <= 0 THEN
      EXIT;
    END IF;

    -- Calculate how much to take from this batch
    IF v_batch.amount_remaining >= v_remaining_deduction THEN
      v_deducted_from_batch := v_remaining_deduction;
    ELSE
      v_deducted_from_batch := v_batch.amount_remaining;
    END IF;

    -- Update the batch
    UPDATE public.ai_credits_ledger
    SET 
      amount_remaining = amount_remaining - v_deducted_from_batch,
      status = CASE WHEN (amount_remaining - v_deducted_from_batch) = 0 THEN 'exhausted' ELSE 'active' END
    WHERE id = v_batch.id;

    -- Update counters
    v_remaining_deduction := v_remaining_deduction - v_deducted_from_batch;
    v_total_deducted := v_total_deducted + v_deducted_from_batch;
  END LOOP;

  -- 3. Final Verification
  IF v_remaining_deduction > 0 THEN
    -- Should not happen due to initial check, but safety net
    RAISE EXCEPTION 'Concurrency error: insufficient credits during deduction loop';
  END IF;

  -- 4. Update Legacy Balance Table (for simple display)
  UPDATE public.user_food_balance
  SET 
    current_balance = current_balance - v_total_deducted,
    total_spent = total_spent + v_total_deducted,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING current_balance INTO v_updated_balance;

  -- 5. Record Transaction
  INSERT INTO public.food_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    ai_message_id,
    ai_room_id
  ) VALUES (
    p_user_id,
    'usage',
    -v_total_deducted,
    v_updated_balance,
    p_reason,
    p_ai_message_id,
    p_ai_room_id
  );

  RETURN jsonb_build_object(
    'success', true, 
    'new_balance', v_updated_balance,
    'deducted', v_total_deducted
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

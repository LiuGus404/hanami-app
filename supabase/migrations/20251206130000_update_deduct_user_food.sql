-- 1. Relax check constraint on transaction_type
ALTER TABLE public.food_transactions 
DROP CONSTRAINT IF EXISTS food_transactions_transaction_type_check;

ALTER TABLE public.food_transactions 
ADD CONSTRAINT food_transactions_transaction_type_check 
CHECK (transaction_type IN ('deposit', 'withdrawal', 'usage', 'initial_grant', 'purchase', 'other', 'refund', 'adjustment')) NOT VALID;

-- 2. Re-create the function to ensure it exists and matches the signature expected by processor.ts
-- processor.ts calls with: { p_user_id, p_amount, p_reason }
-- We include p_ai_message_id and p_ai_room_id as optional for future use (renamed from message_id/thread_id to match new schema)

CREATE OR REPLACE FUNCTION public.deduct_user_food(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_ai_message_id uuid DEFAULT NULL,
  p_ai_room_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance int;
  v_new_balance int;
  v_balance_record record;
BEGIN
  -- Get current balance and lock row
  SELECT * INTO v_balance_record
  FROM public.user_food_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User balance record not found');
  END IF;

  v_current_balance := v_balance_record.current_balance;
  v_new_balance := v_current_balance - p_amount;

  -- Update balance
  UPDATE public.user_food_balance
  SET 
    current_balance = v_new_balance,
    total_spent = total_spent + p_amount,
    daily_usage = daily_usage + p_amount,
    weekly_usage = weekly_usage + p_amount,
    monthly_usage = monthly_usage + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.food_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    ai_message_id, -- Using new column names from fix_schema_fk.sql
    ai_room_id
  ) VALUES (
    p_user_id,
    'usage',
    -p_amount, -- Record as negative for usage
    v_new_balance,
    p_reason,
    p_ai_message_id,
    p_ai_room_id
  );

  RETURN jsonb_build_object(
    'success', true, 
    'new_balance', v_new_balance,
    'deducted', p_amount
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

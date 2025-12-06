-- Create function to atomically deduct food and record transaction
create or replace function deduct_user_food(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_message_id uuid default null,
  p_thread_id uuid default null
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_current_balance int;
  v_new_balance int;
  v_balance_record user_food_balance%rowtype;
begin
  -- Get current balance and lock row
  select * into v_balance_record
  from user_food_balance
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'User balance record not found');
  end if;

  v_current_balance := v_balance_record.current_balance;
  v_new_balance := v_current_balance - p_amount;

  -- Update balance
  update user_food_balance
  set 
    current_balance = v_new_balance,
    total_spent = total_spent + p_amount,
    daily_usage = daily_usage + p_amount,
    weekly_usage = weekly_usage + p_amount,
    monthly_usage = monthly_usage + p_amount,
    updated_at = now()
  where user_id = p_user_id;

  -- Record transaction
  insert into food_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    message_id,
    thread_id
  ) values (
    p_user_id,
    'usage',
    -p_amount, -- Record as negative for usage
    v_new_balance,
    p_reason,
    p_message_id,
    p_thread_id
  );

  return jsonb_build_object(
    'success', true, 
    'new_balance', v_new_balance,
    'deducted', p_amount
  );
exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;

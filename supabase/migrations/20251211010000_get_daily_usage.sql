-- Function to get daily L1 usage count for a user
-- Returns the number of user messages sent in the current UTC day.
CREATE OR REPLACE FUNCTION public.get_daily_l1_usage(
  p_user_id uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*)
  INTO v_count
  FROM public.chat_messages m
  JOIN public.chat_threads t ON m.thread_id = t.id
  WHERE t.user_id = p_user_id
    AND m.role = 'user'
    AND m.created_at >= (current_date::timestamp at time zone 'UTC');
  
  RETURN COALESCE(v_count, 0);
END;
$$;

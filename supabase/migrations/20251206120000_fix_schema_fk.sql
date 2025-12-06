-- Migration: Fix Foreign Key Mismatch for Food Transactions and Costs
-- Description: Updates tracking tables to reference ai_messages/ai_rooms instead of legacy chat_messages/chat_threads.

-- 1. Alter food_transactions
ALTER TABLE public.food_transactions
ADD COLUMN IF NOT EXISTS ai_message_id uuid REFERENCES public.ai_messages(id),
ADD COLUMN IF NOT EXISTS ai_room_id uuid REFERENCES public.ai_rooms(id);

ALTER TABLE public.food_transactions
ALTER COLUMN message_id DROP NOT NULL,
ALTER COLUMN thread_id DROP NOT NULL;

-- 2. Alter message_costs
ALTER TABLE public.message_costs
ADD COLUMN IF NOT EXISTS ai_message_id uuid REFERENCES public.ai_messages(id),
ADD COLUMN IF NOT EXISTS ai_room_id uuid REFERENCES public.ai_rooms(id);

ALTER TABLE public.message_costs
ALTER COLUMN message_id DROP NOT NULL,
ALTER COLUMN thread_id DROP NOT NULL;

-- 3. Update Policy (Optional but good practice)
-- Ensure new columns are accessible if RLS is enabled (assuming existing policies cover rows based on user_id)

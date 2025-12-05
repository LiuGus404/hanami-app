ALTER TABLE public.ai_messages DROP CONSTRAINT IF EXISTS ai_messages_status_check;

ALTER TABLE public.ai_messages 
ADD CONSTRAINT ai_messages_status_check 
CHECK (status = ANY (ARRAY['queued'::text, 'processing'::text, 'sent'::text, 'error'::text, 'cancelled'::text, 'deleted'::text]));

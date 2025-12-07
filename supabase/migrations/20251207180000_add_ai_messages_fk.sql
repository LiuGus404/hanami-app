-- Migration: Add FK to ai_messages.sender_role_instance_id
-- Description: Adds a missing foreign key constraint to enable joins between ai_messages and role_instances.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_messages_sender_role_instance_id_fkey'
    ) THEN
        ALTER TABLE public.ai_messages
        ADD CONSTRAINT ai_messages_sender_role_instance_id_fkey 
        FOREIGN KEY (sender_role_instance_id) 
        REFERENCES public.role_instances(id);
    END IF;
END $$;

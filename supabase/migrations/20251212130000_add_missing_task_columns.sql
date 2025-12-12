-- Add missing columns to hanami_task_list table
-- Created: 2025-12-12
-- Fixes 500 error due to missing visible_to_roles and other columns

ALTER TABLE public.hanami_task_list
ADD COLUMN IF NOT EXISTS visible_to_roles TEXT[], -- Array of roles, e.g. ['admin', 'teacher']
ADD COLUMN IF NOT EXISTS org_id UUID, -- Link to organization
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER, -- In minutes
ADD COLUMN IF NOT EXISTS follow_up_content TEXT,
ADD COLUMN IF NOT EXISTS time_block_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS time_block_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS project_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.hanami_task_list.visible_to_roles IS 'Roles that can see this task. NULL means visible to everyone (or default logic).';
COMMENT ON COLUMN public.hanami_task_list.org_id IS 'Organization ID this task belongs to';
COMMENT ON COLUMN public.hanami_task_list.estimated_duration IS 'Expected duration in minutes';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_hanami_task_list_org_id ON public.hanami_task_list(org_id);
CREATE INDEX IF NOT EXISTS idx_hanami_task_list_visible_to_roles ON public.hanami_task_list USING GIN(visible_to_roles);

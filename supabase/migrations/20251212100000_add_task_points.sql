-- Add points and approval fields to hanami_task_list table
-- Created: 2025-12-12

ALTER TABLE public.hanami_task_list
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN public.hanami_task_list.points IS 'Points awarded for completing this task';
COMMENT ON COLUMN public.hanami_task_list.is_approved IS 'Whether the task completion is approved by admin';
COMMENT ON COLUMN public.hanami_task_list.approved_by IS 'Who approved the task';
COMMENT ON COLUMN public.hanami_task_list.approved_at IS 'When the task was approved';

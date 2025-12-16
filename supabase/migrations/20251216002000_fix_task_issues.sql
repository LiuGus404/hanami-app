-- 1. Fix Task Status Constraint (Allow 'blocked' status)
ALTER TABLE hanami_task_list DROP CONSTRAINT IF EXISTS hanami_task_list_status_check;
ALTER TABLE hanami_task_list ADD CONSTRAINT hanami_task_list_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked'));

-- 2. Fix Duplicate Task Constraints (Allow multiple tasks of same type)
-- We drop both possible names of this constraint to be sure
ALTER TABLE hanami_task_list DROP CONSTRAINT IF EXISTS hanami_task_unique_phone_category;
ALTER TABLE hanami_task_list DROP CONSTRAINT IF EXISTS unique_task_per_user_category;

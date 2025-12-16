-- Drop the existing status check constraint
ALTER TABLE hanami_task_list DROP CONSTRAINT IF EXISTS hanami_task_list_status_check;

-- Re-add the constraint with 'blocked' included
ALTER TABLE hanami_task_list ADD CONSTRAINT hanami_task_list_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked'));

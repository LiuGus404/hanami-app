ALTER TABLE hanami_task_list ADD COLUMN IF NOT EXISTS visible_to_roles text[];
COMMENT ON COLUMN hanami_task_list.visible_to_roles IS 'Array of roles allowed to view this task. NULL means all.';

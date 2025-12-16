-- Remove the restrictive unique constraint that prevents multiple tasks of the same category
ALTER TABLE hanami_task_list DROP CONSTRAINT IF EXISTS hanami_task_unique_phone_category;

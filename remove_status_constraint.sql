-- 移除 hanami_teaching_activities 表的 status 約束
-- 允許任何狀態值

-- 刪除約束
ALTER TABLE public.hanami_teaching_activities 
DROP CONSTRAINT IF EXISTS hanami_teaching_activities_status_check;

-- 確認約束已移除
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'hanami_teaching_activities'::regclass 
AND conname = 'hanami_teaching_activities_status_check'; 
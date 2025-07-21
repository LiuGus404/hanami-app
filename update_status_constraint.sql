-- 更新 hanami_teaching_activities 表的 status 約束
-- 允許更多狀態值

-- 先刪除舊的約束
ALTER TABLE public.hanami_teaching_activities 
DROP CONSTRAINT IF EXISTS hanami_teaching_activities_status_check;

-- 添加新的約束，允許更多狀態
ALTER TABLE public.hanami_teaching_activities 
ADD CONSTRAINT hanami_teaching_activities_status_check 
CHECK (
  status = ANY (
    ARRAY[
      'draft'::text,
      'published'::text,
      'archived'::text,
      'in_progress'::text,
      'completed'::text,
      'pending'::text,
      'active'::text,
      'inactive'::text
    ]
  )
);

-- 或者如果你想允許任何非空字串，可以使用：
-- ALTER TABLE public.hanami_teaching_activities 
-- ADD CONSTRAINT hanami_teaching_activities_status_check 
-- CHECK (status IS NOT NULL AND status != '');

-- 查看約束是否成功添加
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'hanami_teaching_activities'::regclass 
AND conname = 'hanami_teaching_activities_status_check'; 
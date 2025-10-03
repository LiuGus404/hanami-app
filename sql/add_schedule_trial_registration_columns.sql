-- 為 hanami_schedule 表添加試堂開放和報名開放欄位
-- 執行日期: 2024-12-19

-- 添加試堂開放欄位
ALTER TABLE public.hanami_schedule 
ADD COLUMN IF NOT EXISTS is_trial_open BOOLEAN DEFAULT true;

-- 添加報名開放欄位  
ALTER TABLE public.hanami_schedule 
ADD COLUMN IF NOT EXISTS is_registration_open BOOLEAN DEFAULT true;

-- 添加註釋說明
COMMENT ON COLUMN public.hanami_schedule.is_trial_open IS '是否開放試堂，true=開放，false=關閉';
COMMENT ON COLUMN public.hanami_schedule.is_registration_open IS '是否開放報名，true=開放，false=關閉';

-- 創建索引以優化查詢性能
CREATE INDEX IF NOT EXISTS idx_hanami_schedule_trial_open 
ON public.hanami_schedule (is_trial_open, weekday, timeslot);

CREATE INDEX IF NOT EXISTS idx_hanami_schedule_registration_open 
ON public.hanami_schedule (is_registration_open, weekday, timeslot);

-- 更新現有記錄，預設為開放狀態
UPDATE public.hanami_schedule 
SET is_trial_open = true, is_registration_open = true 
WHERE is_trial_open IS NULL OR is_registration_open IS NULL;

-- 驗證更新結果
SELECT 
    COUNT(*) as total_schedules,
    COUNT(CASE WHEN is_trial_open = true THEN 1 END) as trial_open_count,
    COUNT(CASE WHEN is_registration_open = true THEN 1 END) as registration_open_count
FROM public.hanami_schedule;


-- 簡單修復試堂學生媒體配額問題
-- 問題：hanami_student_media_quota 表的外鍵約束只指向 Hanami_Students 表
-- 解決方案：刪除外鍵約束，讓試堂學生可以正常創建

-- 1. 刪除現有的外鍵約束
ALTER TABLE hanami_student_media_quota 
DROP CONSTRAINT IF EXISTS hanami_student_media_quota_student_id_fkey;

-- 2. 確保試堂學生表有 id 欄位
ALTER TABLE hanami_trial_students 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- 3. 為試堂學生表添加主鍵約束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'hanami_trial_students_pkey'
    ) THEN
        ALTER TABLE hanami_trial_students ADD CONSTRAINT hanami_trial_students_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- 4. 為試堂學生創建配額記錄（如果不存在）
INSERT INTO hanami_student_media_quota (
    student_id,
    plan_type, 
    video_limit, 
    photo_limit, 
    video_count, 
    photo_count, 
    total_used_space, 
    last_updated
)
SELECT 
    t.id as student_id,
    'free:create' as plan_type,
    5 as video_limit,
    10 as photo_limit,
    0 as video_count,
    0 as photo_count,
    0 as total_used_space,
    NOW() as last_updated
FROM hanami_trial_students t
LEFT JOIN hanami_student_media_quota q ON t.id = q.student_id
WHERE q.student_id IS NULL;

-- 5. 修改觸發器函數以支援試堂學生
CREATE OR REPLACE FUNCTION create_trial_student_media_quota()
RETURNS TRIGGER AS $$
BEGIN
    -- 為新試堂學生創建媒體配額記錄
    INSERT INTO hanami_student_media_quota (
        student_id,
        plan_type,
        video_limit,
        photo_limit,
        video_count,
        photo_count,
        total_used_space,
        last_updated
    ) VALUES (
        NEW.id,
        'free:create',  -- 預設為 250MB (新建)
        5,              -- 影片限制
        10,             -- 相片限制
        0,              -- 初始影片數量
        0,              -- 初始相片數量
        0,              -- 初始使用空間
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 確保觸發器存在
DROP TRIGGER IF EXISTS trigger_create_trial_student_media_quota ON hanami_trial_students;
CREATE TRIGGER trigger_create_trial_student_media_quota
    AFTER INSERT ON hanami_trial_students
    FOR EACH ROW
    EXECUTE FUNCTION create_trial_student_media_quota();

-- 7. 驗證修復結果
SELECT 
    'Regular students with quota' as check_type,
    COUNT(*) as count
FROM "Hanami_Students" s
JOIN hanami_student_media_quota q ON s.id = q.student_id

UNION ALL

SELECT 
    'Trial students with quota' as check_type,
    COUNT(*) as count
FROM hanami_trial_students t
JOIN hanami_student_media_quota q ON t.id = q.student_id; 
-- 修復試堂學生媒體配額問題
-- 問題：hanami_student_media_quota 表的外鍵約束只指向 Hanami_Students 表
-- 解決方案：為試堂學生創建獨立的配額表，避免外鍵約束衝突

-- 1. 檢查當前的外鍵約束
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='hanami_student_media_quota';

-- 2. 刪除現有的外鍵約束
ALTER TABLE hanami_student_media_quota 
DROP CONSTRAINT IF EXISTS hanami_student_media_quota_student_id_fkey;

-- 3. 確保 hanami_trial_students 表有 id 欄位
ALTER TABLE hanami_trial_students 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- 4. 為試堂學生表添加主鍵約束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'hanami_trial_students_pkey'
    ) THEN
        ALTER TABLE hanami_trial_students ADD CONSTRAINT hanami_trial_students_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- 5. 創建試堂學生媒體配額表
CREATE TABLE IF NOT EXISTS hanami_trial_student_media_quota (
    student_id UUID PRIMARY KEY REFERENCES hanami_trial_students(id) ON DELETE CASCADE,
    plan_type TEXT DEFAULT 'free:create' CHECK (plan_type IN ('free:create', 'basic', 'premium', 'professional')),
    video_limit INTEGER DEFAULT 5,
    photo_limit INTEGER DEFAULT 10,
    video_count INTEGER DEFAULT 0,
    photo_count INTEGER DEFAULT 0,
    total_used_space BIGINT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 為試堂學生創建配額記錄（如果不存在）
INSERT INTO hanami_trial_student_media_quota (
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
LEFT JOIN hanami_trial_student_media_quota q ON t.id = q.student_id
WHERE q.student_id IS NULL;

-- 7. 修改正式學生的觸發器函數
CREATE OR REPLACE FUNCTION create_student_media_quota()
RETURNS TRIGGER AS $$
BEGIN
    -- 為新正式學生創建媒體配額記錄
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

-- 8. 創建試堂學生的觸發器函數
CREATE OR REPLACE FUNCTION create_trial_student_media_quota()
RETURNS TRIGGER AS $$
BEGIN
    -- 為新試堂學生創建媒體配額記錄
    INSERT INTO hanami_trial_student_media_quota (
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

-- 9. 確保觸發器存在
DROP TRIGGER IF EXISTS trigger_create_student_media_quota ON "Hanami_Students";
CREATE TRIGGER trigger_create_student_media_quota
    AFTER INSERT ON "Hanami_Students"
    FOR EACH ROW
    EXECUTE FUNCTION create_student_media_quota();

DROP TRIGGER IF EXISTS trigger_create_trial_student_media_quota ON hanami_trial_students;
CREATE TRIGGER trigger_create_trial_student_media_quota
    AFTER INSERT ON hanami_trial_students
    FOR EACH ROW
    EXECUTE FUNCTION create_trial_student_media_quota();

-- 10. 創建聯合查詢函數（用於前端查詢）
CREATE OR REPLACE FUNCTION get_student_media_quota(p_student_id UUID)
RETURNS TABLE (
    student_id UUID,
    plan_type TEXT,
    video_limit INTEGER,
    photo_limit INTEGER,
    video_count INTEGER,
    photo_count INTEGER,
    total_used_space BIGINT,
    last_updated TIMESTAMP WITH TIME ZONE,
    student_type TEXT
) AS $$
BEGIN
    -- 先檢查是否為正式學生
    IF EXISTS (SELECT 1 FROM "Hanami_Students" WHERE id = p_student_id) THEN
        RETURN QUERY
        SELECT 
            q.student_id,
            q.plan_type,
            q.video_limit,
            q.photo_limit,
            q.video_count,
            q.photo_count,
            q.total_used_space,
            q.last_updated,
            'regular'::TEXT as student_type
        FROM hanami_student_media_quota q
        WHERE q.student_id = p_student_id;
    -- 再檢查是否為試堂學生
    ELSIF EXISTS (SELECT 1 FROM hanami_trial_students WHERE id = p_student_id) THEN
        RETURN QUERY
        SELECT 
            q.student_id,
            q.plan_type,
            q.video_limit,
            q.photo_limit,
            q.video_count,
            q.photo_count,
            q.total_used_space,
            q.last_updated,
            'trial'::TEXT as student_type
        FROM hanami_trial_student_media_quota q
        WHERE q.student_id = p_student_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 11. 驗證修復結果
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
JOIN hanami_trial_student_media_quota q ON t.id = q.student_id

UNION ALL

SELECT 
    'Total regular quota records' as check_type,
    COUNT(*) as count
FROM hanami_student_media_quota

UNION ALL

SELECT 
    'Total trial quota records' as check_type,
    COUNT(*) as count
FROM hanami_trial_student_media_quota;

-- 12. 顯示配額分佈
SELECT 
    'Regular' as student_type,
    plan_type,
    COUNT(*) as student_count
FROM hanami_student_media_quota
GROUP BY plan_type

UNION ALL

SELECT 
    'Trial' as student_type,
    plan_type,
    COUNT(*) as student_count
FROM hanami_trial_student_media_quota
GROUP BY plan_type

ORDER BY student_type, plan_type; 
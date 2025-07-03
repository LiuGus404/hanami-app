-- 試堂學生資料檢查腳本
-- 在 Supabase SQL Editor 中執行

-- 1. 檢查 hanami_trial_students 表是否存在
SELECT '=== 檢查 hanami_trial_students 表 ===' AS info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'hanami_trial_students';

-- 2. 檢查 hanami_trial_students 表的結構
SELECT '=== hanami_trial_students 表結構 ===' AS info;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'hanami_trial_students' 
ORDER BY ordinal_position;

-- 3. 檢查 hanami_trial_students 表的資料數量
SELECT '=== hanami_trial_students 資料統計 ===' AS info;

SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as records_with_name,
    COUNT(CASE WHEN lesson_date IS NOT NULL THEN 1 END) as records_with_lesson_date,
    COUNT(CASE WHEN actual_timeslot IS NOT NULL THEN 1 END) as records_with_timeslot
FROM hanami_trial_students;

-- 4. 檢查 hanami_trial_students 表的示例資料
SELECT '=== hanami_trial_students 示例資料 ===' AS info;

SELECT 
    id,
    full_name,
    lesson_date,
    actual_timeslot,
    course_type,
    gender,
    contact_number,
    created_at
FROM hanami_trial_students 
LIMIT 5;

-- 5. 檢查 RLS 策略
SELECT '=== hanami_trial_students RLS 策略 ===' AS info;

SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'hanami_trial_students';

-- 6. 檢查表權限
SELECT '=== hanami_trial_students 表權限 ===' AS info;

SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'hanami_trial_students'
ORDER BY grantee, privilege_type;

-- 7. 測試插入一條試堂學生資料（如果沒有資料的話）
SELECT '=== 測試插入試堂學生資料 ===' AS info;

-- 先檢查是否已有資料
SELECT COUNT(*) as existing_count FROM hanami_trial_students;

-- 如果沒有資料，插入一條測試資料
INSERT INTO hanami_trial_students (
    full_name,
    lesson_date,
    actual_timeslot,
    course_type,
    gender,
    contact_number,
    student_age,
    student_preference,
    health_notes
) VALUES (
    '測試試堂學生',
    '2024-12-25',
    '14:00',
    '鋼琴',
    'male',
    '12345678',
    60,
    '喜歡古典音樂',
    '無特殊需求'
) ON CONFLICT DO NOTHING;

-- 檢查插入後的資料
SELECT '=== 插入後的資料 ===' AS info;
SELECT 
    id,
    full_name,
    lesson_date,
    actual_timeslot,
    course_type,
    gender,
    contact_number,
    created_at
FROM hanami_trial_students 
ORDER BY created_at DESC
LIMIT 3; 
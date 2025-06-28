-- =====================================================
-- 資料庫檢查腳本
-- 用於診斷學生管理功能的問題
-- =====================================================

-- 1. 檢查表結構
SELECT '=== 表結構檢查 ===' AS info;

-- 檢查 Hanami_Students 表
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'Hanami_Students' 
ORDER BY ordinal_position;

-- 檢查 hanami_trial_students 表
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'hanami_trial_students' 
ORDER BY ordinal_position;

-- 檢查 inactive_student_list 表
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'inactive_student_list' 
ORDER BY ordinal_position;

-- 2. 檢查 RLS 設置
SELECT '=== RLS 設置檢查 ===' AS info;

SELECT 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '已啟用'
        ELSE '未啟用'
    END AS rls_status
FROM pg_tables 
WHERE tablename IN ('Hanami_Students', 'hanami_trial_students', 'inactive_student_list');

-- 3. 檢查 RLS 策略
SELECT '=== RLS 策略檢查 ===' AS info;

SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('Hanami_Students', 'hanami_trial_students', 'inactive_student_list')
ORDER BY tablename, policyname;

-- 4. 檢查表權限
SELECT '=== 表權限檢查 ===' AS info;

SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('Hanami_Students', 'hanami_trial_students', 'inactive_student_list')
ORDER BY table_name, grantee, privilege_type;

-- 5. 檢查外鍵約束
SELECT '=== 外鍵約束檢查 ===' AS info;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('Hanami_Students', 'hanami_trial_students', 'inactive_student_list');

-- 6. 檢查索引
SELECT '=== 索引檢查 ===' AS info;

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('Hanami_Students', 'hanami_trial_students', 'inactive_student_list')
ORDER BY tablename, indexname;

-- 7. 檢查資料統計
SELECT '=== 資料統計 ===' AS info;

SELECT 
    'Hanami_Students' AS table_name,
    COUNT(*) AS record_count
FROM "Hanami_Students"
UNION ALL
SELECT 
    'hanami_trial_students' AS table_name,
    COUNT(*) AS record_count
FROM hanami_trial_students
UNION ALL
SELECT 
    'inactive_student_list' AS table_name,
    COUNT(*) AS record_count
FROM inactive_student_list;

-- 8. 檢查示例資料
SELECT '=== 示例資料檢查 ===' AS info;

-- 常規學生示例
SELECT 'Hanami_Students 示例:' AS table_info;
SELECT id, full_name, student_type, course_type 
FROM "Hanami_Students" 
LIMIT 3;

-- 試堂學生示例
SELECT 'hanami_trial_students 示例:' AS table_info;
SELECT id, full_name, lesson_date, actual_timeslot 
FROM hanami_trial_students 
LIMIT 3;

-- 停用學生示例
SELECT 'inactive_student_list 示例:' AS table_info;
SELECT id, original_id, full_name, student_type, inactive_date 
FROM inactive_student_list 
LIMIT 3;

-- 9. 檢查可能的問題
SELECT '=== 潛在問題檢查 ===' AS info;

-- 檢查是否有重複的 ID
SELECT '檢查 Hanami_Students 重複 ID:' AS check_type;
SELECT id, COUNT(*) 
FROM "Hanami_Students" 
GROUP BY id 
HAVING COUNT(*) > 1;

SELECT '檢查 hanami_trial_students 重複 ID:' AS check_type;
SELECT id, COUNT(*) 
FROM hanami_trial_students 
GROUP BY id 
HAVING COUNT(*) > 1;

SELECT '檢查 inactive_student_list 重複 ID:' AS check_type;
SELECT id, COUNT(*) 
FROM inactive_student_list 
GROUP BY id 
HAVING COUNT(*) > 1;

-- 檢查是否有無效的 original_id 引用
SELECT '檢查無效的 original_id 引用:' AS check_type;
SELECT i.id, i.original_id, i.full_name
FROM inactive_student_list i
LEFT JOIN "Hanami_Students" h ON i.original_id = h.id
LEFT JOIN hanami_trial_students t ON i.original_id = t.id
WHERE h.id IS NULL AND t.id IS NULL;

-- 10. 測試查詢權限
SELECT '=== 權限測試 ===' AS info;

-- 測試讀取權限
SELECT '測試 Hanami_Students 讀取權限:' AS test_type;
SELECT COUNT(*) FROM "Hanami_Students" LIMIT 1;

SELECT '測試 hanami_trial_students 讀取權限:' AS test_type;
SELECT COUNT(*) FROM hanami_trial_students LIMIT 1;

SELECT '測試 inactive_student_list 讀取權限:' AS test_type;
SELECT COUNT(*) FROM inactive_student_list LIMIT 1;

-- 測試寫入權限（只檢查，不實際寫入）
SELECT '=== 寫入權限檢查 ===' AS info;
SELECT 
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('Hanami_Students', 'hanami_trial_students', 'inactive_student_list')
    AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    AND grantee = 'authenticated'
ORDER BY table_name, privilege_type; 
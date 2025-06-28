-- 資料庫外鍵約束檢查腳本
-- 用於診斷學生刪除時的外鍵約束問題

-- 1. 檢查所有與學生相關的外鍵約束
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name = 'Hanami_Students' OR ccu.table_name = 'hanami_trial_students')
ORDER BY tc.table_name, kcu.column_name;

-- 2. 檢查 hanami_student_lesson 表中的外鍵依賴
SELECT 
    'hanami_student_lesson' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN student_id IS NOT NULL THEN 1 END) as records_with_student_id,
    COUNT(CASE WHEN student_oid IS NOT NULL THEN 1 END) as records_with_student_oid
FROM hanami_student_lesson;

-- 3. 檢查 hanami_student_progress 表中的外鍵依賴
SELECT 
    'hanami_student_progress' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN student_id IS NOT NULL THEN 1 END) as records_with_student_id
FROM hanami_student_progress;

-- 4. 檢查 Hanami_Student_Package 表中的外鍵依賴
SELECT 
    'Hanami_Student_Package' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN student_id IS NOT NULL THEN 1 END) as records_with_student_id
FROM "Hanami_Student_Package";

-- 5. 檢查 hanami_trial_queue 表中的外鍵依賴
SELECT 
    'hanami_trial_queue' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN student_id IS NOT NULL THEN 1 END) as records_with_student_id
FROM hanami_trial_queue;

-- 6. 檢查 hanami_lesson_activity_log 表中的外鍵依賴
SELECT 
    'hanami_lesson_activity_log' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN lesson_id IS NOT NULL THEN 1 END) as records_with_lesson_id
FROM hanami_lesson_activity_log;

-- 7. 檢查孤立記錄（存在於子表但父表記錄已刪除）
-- 檢查 hanami_student_lesson 中的孤立記錄
SELECT 
    'hanami_student_lesson - student_id' as check_type,
    COUNT(*) as orphaned_records
FROM hanami_student_lesson hsl
LEFT JOIN "Hanami_Students" hs ON hsl.student_id = hs.id
WHERE hsl.student_id IS NOT NULL AND hs.id IS NULL;

-- 檢查 hanami_student_lesson 中的孤立記錄（student_oid）
SELECT 
    'hanami_student_lesson - student_oid' as check_type,
    COUNT(*) as orphaned_records
FROM hanami_student_lesson hsl
LEFT JOIN "Hanami_Students" hs ON hsl.student_oid = hs.student_oid
WHERE hsl.student_oid IS NOT NULL AND hs.student_oid IS NULL;

-- 檢查 hanami_student_progress 中的孤立記錄
SELECT 
    'hanami_student_progress - student_id' as check_type,
    COUNT(*) as orphaned_records
FROM hanami_student_progress hsp
LEFT JOIN "Hanami_Students" hs ON hsp.student_id = hs.id
WHERE hsp.student_id IS NOT NULL AND hs.id IS NULL;

-- 檢查 Hanami_Student_Package 中的孤立記錄
SELECT 
    'Hanami_Student_Package - student_id' as check_type,
    COUNT(*) as orphaned_records
FROM "Hanami_Student_Package" hsp
LEFT JOIN "Hanami_Students" hs ON hsp.student_id = hs.id
WHERE hsp.student_id IS NOT NULL AND hs.id IS NULL;

-- 檢查 hanami_trial_queue 中的孤立記錄
SELECT 
    'hanami_trial_queue - student_id' as check_type,
    COUNT(*) as orphaned_records
FROM hanami_trial_queue htq
LEFT JOIN "Hanami_Students" hs ON htq.student_id = hs.id
WHERE htq.student_id IS NOT NULL AND hs.id IS NULL;

-- 8. 檢查特定學生的所有相關記錄
-- 替換 'your_student_id' 為實際的學生ID
-- SELECT 
--     'hanami_student_lesson' as table_name,
--     COUNT(*) as record_count
-- FROM hanami_student_lesson 
-- WHERE student_id = 'your_student_id'
-- UNION ALL
-- SELECT 
--     'hanami_student_progress' as table_name,
--     COUNT(*) as record_count
-- FROM hanami_student_progress 
-- WHERE student_id = 'your_student_id'
-- UNION ALL
-- SELECT 
--     'Hanami_Student_Package' as table_name,
--     COUNT(*) as record_count
-- FROM "Hanami_Student_Package" 
-- WHERE student_id = 'your_student_id'
-- UNION ALL
-- SELECT 
--     'hanami_trial_queue' as table_name,
--     COUNT(*) as record_count
-- FROM hanami_trial_queue 
-- WHERE student_id = 'your_student_id';

-- 9. 檢查 RLS 策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('Hanami_Students', 'hanami_student_lesson', 'hanami_student_progress', 'Hanami_Student_Package', 'hanami_trial_queue', 'inactive_student_list');

-- 10. 檢查表權限
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('Hanami_Students', 'hanami_student_lesson', 'hanami_student_progress', 'Hanami_Student_Package', 'hanami_trial_queue', 'inactive_student_list')
ORDER BY table_name, privilege_type; 
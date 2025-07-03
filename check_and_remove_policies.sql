-- =====================================================
-- 權限政策檢查和移除腳本
-- =====================================================

-- 1. 檢查現有的 RLS 政策
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
WHERE tablename IN ('Hanami_CourseTypes', 'hanami_schedule', 'Hanami_Students', 'hanami_trial_students')
ORDER BY tablename, policyname;

-- 2. 檢查表的 RLS 狀態
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('Hanami_CourseTypes', 'hanami_schedule', 'Hanami_Students', 'hanami_trial_students')
ORDER BY tablename;

-- =====================================================
-- 如果需要移除現有政策，請執行以下 SQL
-- =====================================================

-- 移除 Hanami_CourseTypes 的所有政策
-- DROP POLICY IF EXISTS "Allow read for all course types" ON "Hanami_CourseTypes";
-- DROP POLICY IF EXISTS "Allow insert for all course types" ON "Hanami_CourseTypes";
-- DROP POLICY IF EXISTS "Allow update for all course types" ON "Hanami_CourseTypes";
-- DROP POLICY IF EXISTS "Allow delete for all course types" ON "Hanami_CourseTypes";
-- DROP POLICY IF EXISTS "Allow all for course types" ON "Hanami_CourseTypes";

-- 移除 hanami_schedule 的所有政策
-- DROP POLICY IF EXISTS "Allow read for all schedule" ON "hanami_schedule";
-- DROP POLICY IF EXISTS "Allow insert for all schedule" ON "hanami_schedule";
-- DROP POLICY IF EXISTS "Allow update for all schedule" ON "hanami_schedule";
-- DROP POLICY IF EXISTS "Allow delete for all schedule" ON "hanami_schedule";
-- DROP POLICY IF EXISTS "Allow all for schedule" ON "hanami_schedule";

-- 移除 Hanami_Students 的政策
-- DROP POLICY IF EXISTS "Allow read for all students" ON "Hanami_Students";
-- DROP POLICY IF EXISTS "Allow read for students" ON "Hanami_Students";

-- 移除 hanami_trial_students 的政策
-- DROP POLICY IF EXISTS "Allow read for all trial students" ON "hanami_trial_students";
-- DROP POLICY IF EXISTS "Allow read for trial students" ON "hanami_trial_students";

-- =====================================================
-- 如果需要完全禁用 RLS (不建議)
-- =====================================================

-- 禁用 RLS (僅在緊急情況下使用)
-- ALTER TABLE "Hanami_CourseTypes" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "hanami_schedule" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Hanami_Students" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "hanami_trial_students" DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 測試權限的 SQL 查詢
-- =====================================================

-- 測試班別表權限
-- SELECT * FROM "Hanami_CourseTypes" LIMIT 5;
-- INSERT INTO "Hanami_CourseTypes" (name, status) VALUES ('測試班別', true);
-- UPDATE "Hanami_CourseTypes" SET name = '更新測試' WHERE name = '測試班別';
-- DELETE FROM "Hanami_CourseTypes" WHERE name = '更新測試';

-- 測試時段表權限
-- SELECT * FROM "hanami_schedule" LIMIT 5;
-- INSERT INTO "hanami_schedule" (weekday, timeslot, max_students, duration, course_type) 
-- VALUES (1, '10:00', 4, '00:45', '測試班別');
-- UPDATE "hanami_schedule" SET max_students = 5 WHERE course_type = '測試班別';
-- DELETE FROM "hanami_schedule" WHERE course_type = '測試班別'; 
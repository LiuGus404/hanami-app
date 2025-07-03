-- =====================================================
-- 緊急修復腳本 - 暫時禁用 RLS 解決無限遞迴問題
-- =====================================================

-- 警告：此腳本會暫時禁用所有 RLS，僅用於緊急修復
-- 修復完成後請重新啟用適當的權限控制

-- 1. 禁用所有相關表的 RLS
ALTER TABLE "hanami_user_permissions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "hanami_admin" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Hanami_Students" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "hanami_trial_students" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Hanami_CourseTypes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "hanami_schedule" DISABLE ROW LEVEL SECURITY;

-- 2. 移除所有可能有問題的政策
-- hanami_user_permissions
DROP POLICY IF EXISTS "Allow all for user permissions" ON "hanami_user_permissions";
DROP POLICY IF EXISTS "Allow read for user permissions" ON "hanami_user_permissions";
DROP POLICY IF EXISTS "Allow insert for user permissions" ON "hanami_user_permissions";
DROP POLICY IF EXISTS "Allow update for user permissions" ON "hanami_user_permissions";
DROP POLICY IF EXISTS "Allow delete for user permissions" ON "hanami_user_permissions";
DROP POLICY IF EXISTS "Simple policy for user permissions" ON "hanami_user_permissions";

-- hanami_admin
DROP POLICY IF EXISTS "Allow all for admin" ON "hanami_admin";
DROP POLICY IF EXISTS "Allow read for admin" ON "hanami_admin";
DROP POLICY IF EXISTS "Simple policy for admin" ON "hanami_admin";

-- Hanami_Students
DROP POLICY IF EXISTS "Allow read for students" ON "Hanami_Students";
DROP POLICY IF EXISTS "Allow read for all students" ON "Hanami_Students";
DROP POLICY IF EXISTS "Simple policy for students" ON "Hanami_Students";

-- hanami_trial_students
DROP POLICY IF EXISTS "Allow read for trial students" ON "hanami_trial_students";
DROP POLICY IF EXISTS "Allow read for all trial students" ON "hanami_trial_students";
DROP POLICY IF EXISTS "Simple policy for trial students" ON "hanami_trial_students";

-- Hanami_CourseTypes
DROP POLICY IF EXISTS "Allow all for course types" ON "Hanami_CourseTypes";
DROP POLICY IF EXISTS "Allow read for all course types" ON "Hanami_CourseTypes";
DROP POLICY IF EXISTS "Allow insert for all course types" ON "Hanami_CourseTypes";
DROP POLICY IF EXISTS "Allow update for all course types" ON "Hanami_CourseTypes";
DROP POLICY IF EXISTS "Allow delete for all course types" ON "Hanami_CourseTypes";

-- hanami_schedule
DROP POLICY IF EXISTS "Allow all for schedule" ON "hanami_schedule";
DROP POLICY IF EXISTS "Allow read for all schedule" ON "hanami_schedule";
DROP POLICY IF EXISTS "Allow insert for all schedule" ON "hanami_schedule";
DROP POLICY IF EXISTS "Allow update for all schedule" ON "hanami_schedule";
DROP POLICY IF EXISTS "Allow delete for all schedule" ON "hanami_schedule";

-- =====================================================
-- 檢查修復結果
-- =====================================================

-- 檢查表的 RLS 狀態
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN (
    'hanami_user_permissions',
    'hanami_admin', 
    'Hanami_Students',
    'hanami_trial_students',
    'Hanami_CourseTypes',
    'hanami_schedule'
)
ORDER BY tablename;

-- 檢查剩餘的政策
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN (
    'hanami_user_permissions',
    'hanami_admin', 
    'Hanami_Students',
    'hanami_trial_students',
    'Hanami_CourseTypes',
    'hanami_schedule'
)
ORDER BY tablename, policyname;

-- =====================================================
-- 緊急修復完成！
-- =====================================================

-- 現在所有表都已禁用 RLS，應該可以正常運作
-- 請測試應用程式功能是否恢復正常 
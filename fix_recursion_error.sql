-- =====================================================
-- 修復無限遞迴錯誤 - hanami_user_permissions 表
-- =====================================================

-- 1. 檢查 hanami_user_permissions 表的現有政策
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
WHERE tablename = 'hanami_user_permissions'
ORDER BY policyname;

-- 2. 移除可能有問題的政策
DROP POLICY IF EXISTS "Allow all for user permissions" ON "hanami_user_permissions";
DROP POLICY IF EXISTS "Allow read for user permissions" ON "hanami_user_permissions";
DROP POLICY IF EXISTS "Allow insert for user permissions" ON "hanami_user_permissions";
DROP POLICY IF EXISTS "Allow update for user permissions" ON "hanami_user_permissions";
DROP POLICY IF EXISTS "Allow delete for user permissions" ON "hanami_user_permissions";

-- 3. 重新建立簡單的政策
CREATE POLICY "Simple policy for user permissions" ON "hanami_user_permissions"
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. 如果仍有問題，暫時禁用 RLS
-- ALTER TABLE "hanami_user_permissions" DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 修復其他可能相關的表
-- =====================================================

-- 檢查 hanami_admin 表
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
WHERE tablename = 'hanami_admin'
ORDER BY policyname;

-- 移除可能有問題的政策
DROP POLICY IF EXISTS "Allow all for admin" ON "hanami_admin";
DROP POLICY IF EXISTS "Allow read for admin" ON "hanami_admin";

-- 重新建立簡單的政策
CREATE POLICY "Simple policy for admin" ON "hanami_admin"
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- 確保基本表權限正確
-- =====================================================

-- 重新設定 Hanami_Students 表權限
DROP POLICY IF EXISTS "Allow read for students" ON "Hanami_Students";
DROP POLICY IF EXISTS "Allow read for all students" ON "Hanami_Students";

CREATE POLICY "Simple policy for students" ON "Hanami_Students"
FOR SELECT
USING (true);

-- 重新設定 hanami_trial_students 表權限
DROP POLICY IF EXISTS "Allow read for trial students" ON "hanami_trial_students";
DROP POLICY IF EXISTS "Allow read for all trial students" ON "hanami_trial_students";

CREATE POLICY "Simple policy for trial students" ON "hanami_trial_students"
FOR SELECT
USING (true);

-- =====================================================
-- 執行完成！
-- ===================================================== 
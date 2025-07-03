-- =====================================================
-- 安全重啟 RLS 腳本 - 避免無限遞迴問題
-- =====================================================

-- 此腳本在緊急修復後使用，安全地重新啟用 RLS

-- 1. 先為班別和時段表啟用 RLS（這些是我們主要需要的）
ALTER TABLE "Hanami_CourseTypes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hanami_schedule" ENABLE ROW LEVEL SECURITY;

-- 2. 建立簡單的政策（避免複雜的遞迴）
CREATE POLICY "Basic course types policy" ON "Hanami_CourseTypes"
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Basic schedule policy" ON "hanami_schedule"
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. 為學生表啟用 RLS（僅查詢權限）
ALTER TABLE "Hanami_Students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hanami_trial_students" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Basic students policy" ON "Hanami_Students"
FOR SELECT
USING (true);

CREATE POLICY "Basic trial students policy" ON "hanami_trial_students"
FOR SELECT
USING (true);

-- 4. 暫時保持其他表的 RLS 禁用狀態
-- hanami_user_permissions 和 hanami_admin 保持禁用
-- 直到確定沒有遞迴問題

-- =====================================================
-- 檢查設定結果
-- =====================================================

-- 檢查 RLS 狀態
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN (
    'Hanami_CourseTypes',
    'hanami_schedule',
    'Hanami_Students',
    'hanami_trial_students'
)
ORDER BY tablename;

-- 檢查政策
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename IN (
    'Hanami_CourseTypes',
    'hanami_schedule',
    'Hanami_Students',
    'hanami_trial_students'
)
ORDER BY tablename, policyname;

-- =====================================================
-- 安全重啟完成！
-- =====================================================

-- 現在班別和時段管理功能應該可以正常運作
-- 其他表保持禁用狀態以避免遞迴問題 
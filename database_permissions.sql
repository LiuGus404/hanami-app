-- =====================================================
-- Hanami Web 資料庫權限設定
-- 適用於班別和時段管理功能
-- =====================================================

-- 1. 啟用 RLS (Row Level Security) 於班別表
ALTER TABLE "Hanami_CourseTypes" ENABLE ROW LEVEL SECURITY;

-- 2. 啟用 RLS 於時段表
ALTER TABLE "hanami_schedule" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Hanami_CourseTypes 表權限政策
-- =====================================================

-- 允許所有人查詢班別 (SELECT)
CREATE POLICY "Allow read for all course types" ON "Hanami_CourseTypes"
FOR SELECT
USING (true);

-- 允許所有人新增班別 (INSERT)
CREATE POLICY "Allow insert for all course types" ON "Hanami_CourseTypes"
FOR INSERT
WITH CHECK (true);

-- 允許所有人更新班別 (UPDATE)
CREATE POLICY "Allow update for all course types" ON "Hanami_CourseTypes"
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 允許所有人刪除班別 (DELETE)
CREATE POLICY "Allow delete for all course types" ON "Hanami_CourseTypes"
FOR DELETE
USING (true);

-- =====================================================
-- hanami_schedule 表權限政策
-- =====================================================

-- 允許所有人查詢時段 (SELECT)
CREATE POLICY "Allow read for all schedule" ON "hanami_schedule"
FOR SELECT
USING (true);

-- 允許所有人新增時段 (INSERT)
CREATE POLICY "Allow insert for all schedule" ON "hanami_schedule"
FOR INSERT
WITH CHECK (true);

-- 允許所有人更新時段 (UPDATE)
CREATE POLICY "Allow update for all schedule" ON "hanami_schedule"
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 允許所有人刪除時段 (DELETE)
CREATE POLICY "Allow delete for all schedule" ON "hanami_schedule"
FOR DELETE
USING (true);

-- =====================================================
-- 其他相關表的權限設定 (如果需要)
-- =====================================================

-- Hanami_Students 表權限 (用於課堂空缺計算)
ALTER TABLE "Hanami_Students" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all students" ON "Hanami_Students"
FOR SELECT
USING (true);

-- hanami_trial_students 表權限 (用於試堂學生)
ALTER TABLE "hanami_trial_students" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all trial students" ON "hanami_trial_students"
FOR SELECT
USING (true);

-- =====================================================
-- 檢查現有政策的 SQL (可選)
-- =====================================================

-- 查看 Hanami_CourseTypes 的政策
-- SELECT * FROM pg_policies WHERE tablename = 'Hanami_CourseTypes';

-- 查看 hanami_schedule 的政策
-- SELECT * FROM pg_policies WHERE tablename = 'hanami_schedule';

-- =====================================================
-- 如果需要更嚴格的權限控制，可以使用以下替代方案
-- =====================================================

/*
-- 替代方案：基於認證的權限控制
-- 只允許已認證的用戶進行操作

-- 班別表認證權限
CREATE POLICY "Allow authenticated users for course types" ON "Hanami_CourseTypes"
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 時段表認證權限
CREATE POLICY "Allow authenticated users for schedule" ON "hanami_schedule"
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
*/

-- =====================================================
-- 如果需要基於角色的權限控制，可以使用以下方案
-- =====================================================

/*
-- 替代方案：基於管理員角色的權限控制
-- 假設您有管理員角色欄位

-- 班別表管理員權限
CREATE POLICY "Allow admin for course types" ON "Hanami_CourseTypes"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "hanami_admin" 
    WHERE admin_email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "hanami_admin" 
    WHERE admin_email = auth.jwt() ->> 'email'
  )
);

-- 時段表管理員權限
CREATE POLICY "Allow admin for schedule" ON "hanami_schedule"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "hanami_admin" 
    WHERE admin_email = auth.jwt() ->> 'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "hanami_admin" 
    WHERE admin_email = auth.jwt() ->> 'email'
  )
);
*/

-- =====================================================
-- 執行完成提示
-- =====================================================

-- 執行此 SQL 後，您的應用程式應該能夠：
-- 1. 新增班別和時段
-- 2. 編輯班別和時段
-- 3. 刪除班別和時段
-- 4. 查詢所有相關資料

-- 如果仍然遇到權限問題，請檢查：
-- 1. Supabase 專案設定中的 RLS 是否已啟用
-- 2. 用戶是否已正確認證
-- 3. 資料表是否存在且名稱正確 
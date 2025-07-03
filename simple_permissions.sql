-- =====================================================
-- 簡化版權限設定 - 適用於開發和測試
-- =====================================================

-- 1. 班別表權限
ALTER TABLE "Hanami_CourseTypes" ENABLE ROW LEVEL SECURITY;

-- 允許所有操作
CREATE POLICY "Allow all for course types" ON "Hanami_CourseTypes"
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. 時段表權限
ALTER TABLE "hanami_schedule" ENABLE ROW LEVEL SECURITY;

-- 允許所有操作
CREATE POLICY "Allow all for schedule" ON "hanami_schedule"
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. 學生表權限 (用於課堂空缺計算)
ALTER TABLE "Hanami_Students" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for students" ON "Hanami_Students"
FOR SELECT
USING (true);

-- 4. 試堂學生表權限
ALTER TABLE "hanami_trial_students" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for trial students" ON "hanami_trial_students"
FOR SELECT
USING (true);

-- =====================================================
-- 執行完成！
-- ===================================================== 
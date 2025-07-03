-- =====================================================
-- 修復 hanami_student_lesson 表 RLS 權限問題
-- =====================================================

-- 1. 檢查當前狀態
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'hanami_student_lesson';

-- 2. 檢查現有策略
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
WHERE schemaname = 'public' 
  AND tablename = 'hanami_student_lesson';

-- 3. 如果RLS已啟用但沒有策略，先禁用RLS
ALTER TABLE hanami_student_lesson DISABLE ROW LEVEL SECURITY;

-- 4. 重新啟用RLS
ALTER TABLE hanami_student_lesson ENABLE ROW LEVEL SECURITY;

-- 5. 創建適當的RLS策略

-- 管理員可以查看所有課程
CREATE POLICY "Admins can view all lessons" ON hanami_student_lesson
FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- 管理員可以管理所有課程
CREATE POLICY "Admins can manage all lessons" ON hanami_student_lesson
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 教師可以查看自己教授的課程
CREATE POLICY "Teachers can view own lessons" ON hanami_student_lesson
FOR SELECT USING (
  lesson_teacher = (
    SELECT teacher_nickname FROM hanami_employee WHERE id = auth.uid()
  ) OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 教師可以管理自己教授的課程
CREATE POLICY "Teachers can manage own lessons" ON hanami_student_lesson
FOR ALL USING (
  lesson_teacher = (
    SELECT teacher_nickname FROM hanami_employee WHERE id = auth.uid()
  ) OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 家長可以查看自己孩子的課程
CREATE POLICY "Parents can view own children lessons" ON hanami_student_lesson
FOR SELECT USING (
  student_id IN (
    SELECT student_id FROM hanami_parent_student_relations 
    WHERE parent_id = auth.uid()
  ) OR 
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'role' = 'teacher'
);

-- 6. 設置表權限
GRANT ALL ON hanami_student_lesson TO authenticated;
GRANT ALL ON hanami_student_lesson TO service_role;

-- 7. 驗證修復結果
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'hanami_student_lesson'
ORDER BY policyname;

-- 8. 測試查詢（可選）
-- SELECT COUNT(*) FROM hanami_student_lesson; 
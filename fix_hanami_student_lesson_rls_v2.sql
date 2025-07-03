-- =====================================================
-- 修復 hanami_student_lesson 表 RLS 權限問題 (版本2)
-- 移除對不存在表的引用，簡化權限策略
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

-- 3. 刪除現有策略
DROP POLICY IF EXISTS "Admins can view all lessons" ON hanami_student_lesson;
DROP POLICY IF EXISTS "Admins can manage all lessons" ON hanami_student_lesson;
DROP POLICY IF EXISTS "Teachers can view own lessons" ON hanami_student_lesson;
DROP POLICY IF EXISTS "Teachers can manage own lessons" ON hanami_student_lesson;
DROP POLICY IF EXISTS "Parents can view own children lessons" ON hanami_student_lesson;

-- 4. 如果RLS已啟用但沒有策略，先禁用RLS
ALTER TABLE hanami_student_lesson DISABLE ROW LEVEL SECURITY;

-- 5. 重新啟用RLS
ALTER TABLE hanami_student_lesson ENABLE ROW LEVEL SECURITY;

-- 6. 創建簡化的RLS策略

-- 管理員可以查看和管理所有課程
CREATE POLICY "Admins can view all lessons" ON hanami_student_lesson
FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all lessons" ON hanami_student_lesson
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 教師可以查看和管理課程（基於lesson_teacher欄位）
CREATE POLICY "Teachers can view own lessons" ON hanami_student_lesson
FOR SELECT USING (
  lesson_teacher = (
    SELECT teacher_nickname FROM hanami_employee WHERE id = auth.uid()
  ) OR 
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Teachers can manage own lessons" ON hanami_student_lesson
FOR ALL USING (
  lesson_teacher = (
    SELECT teacher_nickname FROM hanami_employee WHERE id = auth.uid()
  ) OR 
  auth.jwt() ->> 'role' = 'admin'
);

-- 允許已認證用戶查看課程（簡化權限）
CREATE POLICY "Authenticated users can view lessons" ON hanami_student_lesson
FOR SELECT USING (auth.role() = 'authenticated');

-- 允許已認證用戶插入課程（簡化權限）
CREATE POLICY "Authenticated users can insert lessons" ON hanami_student_lesson
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 允許已認證用戶更新課程（簡化權限）
CREATE POLICY "Authenticated users can update lessons" ON hanami_student_lesson
FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. 設置表權限
GRANT ALL ON hanami_student_lesson TO authenticated;
GRANT ALL ON hanami_student_lesson TO service_role;

-- 8. 驗證修復結果
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

-- 9. 測試查詢（可選）
-- SELECT COUNT(*) FROM hanami_student_lesson;

-- 10. 檢查表結構（可選）
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'hanami_student_lesson' 
-- ORDER BY ordinal_position; 
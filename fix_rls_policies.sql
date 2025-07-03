-- 修復試堂學生表RLS策略
-- 解決試堂學生無法顯示的問題

-- 1. 檢查當前RLS策略
SELECT '=== 當前RLS策略 ===' AS step;
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
WHERE tablename = 'hanami_trial_students';

-- 2. 刪除現有的RLS策略（如果存在）
DO $$
BEGIN
  -- 刪除所有現有的RLS策略
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON hanami_trial_students;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON hanami_trial_students;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON hanami_trial_students;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON hanami_trial_students;
  
  RAISE NOTICE '已刪除現有RLS策略';
END $$;

-- 3. 創建新的RLS策略
DO $$
BEGIN
  -- 啟用RLS
  ALTER TABLE hanami_trial_students ENABLE ROW LEVEL SECURITY;
  
  -- 創建讀取策略 - 允許所有認證用戶讀取
  CREATE POLICY "Enable read access for authenticated users" ON hanami_trial_students
  FOR SELECT USING (auth.role() = 'authenticated');
  
  -- 創建插入策略 - 允許所有認證用戶插入
  CREATE POLICY "Enable insert for authenticated users" ON hanami_trial_students
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
  -- 創建更新策略 - 允許所有認證用戶更新
  CREATE POLICY "Enable update for authenticated users" ON hanami_trial_students
  FOR UPDATE USING (auth.role() = 'authenticated');
  
  -- 創建刪除策略 - 允許所有認證用戶刪除
  CREATE POLICY "Enable delete for authenticated users" ON hanami_trial_students
  FOR DELETE USING (auth.role() = 'authenticated');
  
  RAISE NOTICE '已創建新的RLS策略';
END $$;

-- 4. 驗證RLS策略
SELECT '=== 新的RLS策略 ===' AS step;
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
WHERE tablename = 'hanami_trial_students';

-- 5. 檢查RLS啟用狀態
SELECT '=== RLS啟用狀態 ===' AS step;
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'hanami_trial_students';

-- 6. 測試讀取權限
SELECT '=== 測試讀取權限 ===' AS step;
SELECT COUNT(*) as can_read_count
FROM hanami_trial_students;

-- 7. 顯示試堂學生資料
SELECT '=== 試堂學生資料 ===' AS step;
SELECT 
  id,
  full_name,
  student_dob,
  gender,
  course_type,
  lesson_date,
  actual_timeslot,
  contact_number,
  parent_email,
  school,
  student_teacher,
  remaining_lessons,
  created_at
FROM hanami_trial_students
ORDER BY created_at DESC
LIMIT 10;

-- 8. 檢查表權限
SELECT '=== 表權限檢查 ===' AS step;
SELECT 
  grantee,
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'hanami_trial_students'
AND table_schema = 'public';

-- 9. 確保認證用戶有權限
DO $$
BEGIN
  -- 確保認證用戶有所有權限
  GRANT ALL ON hanami_trial_students TO authenticated;
  GRANT USAGE ON SCHEMA public TO authenticated;
  
  RAISE NOTICE '已授予認證用戶權限';
END $$;

-- 10. 最終檢查
SELECT '=== 最終檢查 ===' AS step;
SELECT 
  '試堂學生表狀態' AS check_item,
  COUNT(*) as record_count,
  '正常' as status
FROM hanami_trial_students
UNION ALL
SELECT 
  'RLS策略數量' AS check_item,
  COUNT(*) as record_count,
  '策略已設置' as status
FROM pg_policies 
WHERE tablename = 'hanami_trial_students'
UNION ALL
SELECT 
  'RLS啟用狀態' AS check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'hanami_trial_students' 
    AND rowsecurity = true
  ) THEN 1 ELSE 0 END as record_count,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'hanami_trial_students' 
    AND rowsecurity = true
  ) THEN '已啟用' ELSE '未啟用' END as status; 
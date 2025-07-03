-- 測試試堂學生訪問權限
-- 診斷為什麼試堂學生無法顯示

-- 1. 檢查當前用戶
SELECT '=== 當前用戶信息 ===' AS step;
SELECT 
  current_user as current_user,
  session_user as session_user,
  auth.role() as auth_role;

-- 2. 檢查試堂學生表是否存在
SELECT '=== 試堂學生表存在性 ===' AS step;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'hanami_trial_students'
) as table_exists;

-- 3. 檢查試堂學生資料數量（直接查詢）
SELECT '=== 試堂學生資料數量 ===' AS step;
SELECT COUNT(*) as total_count
FROM hanami_trial_students;

-- 4. 檢查RLS狀態
SELECT '=== RLS狀態 ===' AS step;
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'hanami_trial_students';

-- 5. 檢查RLS策略
SELECT '=== RLS策略 ===' AS step;
SELECT 
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'hanami_trial_students';

-- 6. 檢查表權限
SELECT '=== 表權限 ===' AS step;
SELECT 
  grantee,
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'hanami_trial_students'
AND table_schema = 'public';

-- 7. 測試不同角色的訪問權限
SELECT '=== 測試訪問權限 ===' AS step;

-- 測試認證用戶權限
SELECT 
  'authenticated' as role,
  COUNT(*) as can_read_count
FROM hanami_trial_students;

-- 8. 如果沒有資料，檢查是否有其他問題
SELECT '=== 檢查資料問題 ===' AS step;
SELECT 
  '資料檢查' as check_type,
  COUNT(*) as total_records,
  COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as has_name,
  COUNT(CASE WHEN lesson_date IS NOT NULL THEN 1 END) as has_date,
  COUNT(CASE WHEN course_type IS NOT NULL THEN 1 END) as has_course
FROM hanami_trial_students;

-- 9. 顯示前5條試堂學生資料
SELECT '=== 試堂學生示例資料 ===' AS step;
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
LIMIT 5;

-- 10. 檢查是否有隱藏的RLS條件
SELECT '=== 檢查RLS條件 ===' AS step;
SELECT 
  policyname,
  qual as where_condition,
  with_check as check_condition
FROM pg_policies 
WHERE tablename = 'hanami_trial_students';

-- 11. 臨時禁用RLS進行測試
DO $$
BEGIN
  -- 臨時禁用RLS
  ALTER TABLE hanami_trial_students DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE '已臨時禁用RLS進行測試';
END $$;

-- 12. 測試禁用RLS後的訪問
SELECT '=== 禁用RLS後的資料數量 ===' AS step;
SELECT COUNT(*) as count_without_rls
FROM hanami_trial_students;

-- 13. 重新啟用RLS並設置正確的策略
DO $$
BEGIN
  -- 重新啟用RLS
  ALTER TABLE hanami_trial_students ENABLE ROW LEVEL SECURITY;
  
  -- 刪除所有現有策略
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON hanami_trial_students;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON hanami_trial_students;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON hanami_trial_students;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON hanami_trial_students;
  
  -- 創建簡單的讀取策略
  CREATE POLICY "Enable read access for authenticated users" ON hanami_trial_students
  FOR SELECT USING (true);
  
  -- 創建其他策略
  CREATE POLICY "Enable insert for authenticated users" ON hanami_trial_students
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
  CREATE POLICY "Enable update for authenticated users" ON hanami_trial_students
  FOR UPDATE USING (auth.role() = 'authenticated');
  
  CREATE POLICY "Enable delete for authenticated users" ON hanami_trial_students
  FOR DELETE USING (auth.role() = 'authenticated');
  
  RAISE NOTICE '已重新設置RLS策略';
END $$;

-- 14. 最終測試
SELECT '=== 最終測試 ===' AS step;
SELECT 
  '試堂學生資料' AS test_item,
  COUNT(*) as record_count,
  '可讀取' as status
FROM hanami_trial_students; 
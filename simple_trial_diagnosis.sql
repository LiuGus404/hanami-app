-- 簡單的試堂學生診斷腳本
-- 不依賴於自定義函數，直接使用標準SQL查詢

-- 1. 檢查試堂學生表是否存在
SELECT '=== 檢查試堂學生表是否存在 ===' AS step;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'hanami_trial_students'
) as table_exists;

-- 2. 檢查表結構
SELECT '=== 試堂學生表結構 ===' AS step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'hanami_trial_students'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 檢查資料數量
SELECT '=== 試堂學生資料統計 ===' AS step;
SELECT COUNT(*) as trial_students_count
FROM hanami_trial_students;

-- 4. 查看示例資料
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

-- 5. 檢查RLS策略
SELECT '=== RLS策略檢查 ===' AS step;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'hanami_trial_students';

-- 6. 檢查RLS啟用狀態
SELECT '=== RLS啟用狀態 ===' AS step;
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'hanami_trial_students';

-- 7. 檢查表權限
SELECT '=== 表權限檢查 ===' AS step;
SELECT 
  grantee,
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'hanami_trial_students'
AND table_schema = 'public';

-- 8. 測試讀取權限
SELECT '=== 測試讀取權限 ===' AS step;
SELECT COUNT(*) as can_read
FROM hanami_trial_students
LIMIT 1;

-- 9. 如果沒有資料，插入測試資料
DO $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM hanami_trial_students;
  
  IF existing_count = 0 THEN
    INSERT INTO hanami_trial_students (
      full_name,
      student_dob,
      gender,
      course_type,
      lesson_date,
      actual_timeslot,
      student_preference,
      contact_number,
      parent_email,
      school,
      address,
      student_teacher,
      health_notes,
      student_oid,
      remaining_lessons,
      duration_months
    ) VALUES 
    (
      '測試試堂學生',
      '2020-01-01',
      '男',
      '鋼琴',
      CURRENT_DATE + INTERVAL '3 days',
      '14:00',
      '喜歡古典音樂',
      '91234567',
      'test@example.com',
      '測試學校',
      '測試地址',
      '測試老師',
      '無特殊需求',
      'TS' || EXTRACT(EPOCH FROM NOW())::INTEGER,
      1,
      1
    );
    
    RAISE NOTICE '已插入測試試堂學生資料';
  ELSE
    RAISE NOTICE '試堂學生表已有 % 條資料，跳過插入', existing_count;
  END IF;
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
  '表存在性' AS check_item,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hanami_trial_students'
  ) THEN 1 ELSE 0 END as record_count,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hanami_trial_students'
  ) THEN '存在' ELSE '不存在' END as status
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
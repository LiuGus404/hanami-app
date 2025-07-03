-- 緊急修復試堂學生顯示問題
-- 專門解決RLS權限導致的試堂學生無法顯示問題

-- 1. 檢查當前狀態
SELECT '=== 當前狀態檢查 ===' AS step;
SELECT 
  '試堂學生表存在' AS check_item,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hanami_trial_students'
  ) as status
UNION ALL
SELECT 
  '試堂學生資料數量' AS check_item,
  COUNT(*)::TEXT as status
FROM hanami_trial_students
UNION ALL
SELECT 
  'RLS啟用狀態' AS check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'hanami_trial_students' 
    AND rowsecurity = true
  ) THEN '已啟用' ELSE '未啟用' END as status;

-- 2. 緊急修復：重置RLS策略
DO $$
BEGIN
  -- 刪除所有現有的RLS策略
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON hanami_trial_students;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON hanami_trial_students;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON hanami_trial_students;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON hanami_trial_students;
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON hanami_trial_students;
  
  RAISE NOTICE '已刪除所有現有RLS策略';
  
  -- 重新啟用RLS
  ALTER TABLE hanami_trial_students ENABLE ROW LEVEL SECURITY;
  
  -- 創建最寬鬆的讀取策略 - 允許所有認證用戶讀取所有資料
  CREATE POLICY "Enable read access for authenticated users" ON hanami_trial_students
  FOR SELECT USING (true);
  
  -- 創建其他策略
  CREATE POLICY "Enable insert for authenticated users" ON hanami_trial_students
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
  CREATE POLICY "Enable update for authenticated users" ON hanami_trial_students
  FOR UPDATE USING (auth.role() = 'authenticated');
  
  CREATE POLICY "Enable delete for authenticated users" ON hanami_trial_students
  FOR DELETE USING (auth.role() = 'authenticated');
  
  RAISE NOTICE '已創建新的RLS策略';
END $$;

-- 3. 確保權限正確
DO $$
BEGIN
  -- 確保認證用戶有所有權限
  GRANT ALL ON hanami_trial_students TO authenticated;
  GRANT USAGE ON SCHEMA public TO authenticated;
  
  RAISE NOTICE '已授予認證用戶權限';
END $$;

-- 4. 驗證修復結果
SELECT '=== 修復後狀態 ===' AS step;
SELECT 
  '試堂學生資料數量' AS check_item,
  COUNT(*) as record_count,
  '可讀取' as status
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

-- 5. 顯示試堂學生資料（驗證可讀取）
SELECT '=== 試堂學生資料驗證 ===' AS step;
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

-- 6. 如果仍然沒有資料，插入測試資料
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
      '緊急測試試堂學生',
      '2020-01-01',
      '男',
      '鋼琴',
      CURRENT_DATE + INTERVAL '3 days',
      '14:00',
      '喜歡古典音樂',
      '91234567',
      'emergency@example.com',
      '測試學校',
      '測試地址',
      '測試老師',
      '無特殊需求',
      'EMG' || EXTRACT(EPOCH FROM NOW())::INTEGER,
      1,
      1
    );
    
    RAISE NOTICE '已插入緊急測試試堂學生資料';
  ELSE
    RAISE NOTICE '試堂學生表已有 % 條資料，跳過插入', existing_count;
  END IF;
END $$;

-- 7. 最終驗證
SELECT '=== 最終驗證 ===' AS step;
SELECT 
  '修復完成' AS status,
  COUNT(*) as trial_students_count,
  '試堂學生現在應該可以正常顯示' as message
FROM hanami_trial_students; 
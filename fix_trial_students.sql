-- 試堂學生表診斷和修復腳本
-- 執行此腳本來解決試堂學生顯示問題

-- 1. 檢查試堂學生表是否存在
SELECT '=== 檢查試堂學生表是否存在 ===' AS step;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'hanami_trial_students'
) as table_exists;

-- 2. 如果表不存在，創建試堂學生表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hanami_trial_students'
  ) THEN
    CREATE TABLE hanami_trial_students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      student_dob DATE,
      gender TEXT CHECK (gender IN ('男', '女')),
      course_type TEXT,
      lesson_date DATE,
      actual_timeslot TEXT,
      student_preference TEXT,
      contact_number TEXT,
      parent_email TEXT,
      school TEXT,
      address TEXT,
      student_teacher TEXT,
      health_notes TEXT,
      student_oid TEXT,
      remaining_lessons INTEGER DEFAULT 1,
      duration_months INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- 創建索引
    CREATE INDEX idx_trial_students_name ON hanami_trial_students(full_name);
    CREATE INDEX idx_trial_students_lesson_date ON hanami_trial_students(lesson_date);
    CREATE INDEX idx_trial_students_course_type ON hanami_trial_students(course_type);
    
    RAISE NOTICE '試堂學生表已創建';
  ELSE
    RAISE NOTICE '試堂學生表已存在';
  END IF;
END $$;

-- 3. 檢查表結構
SELECT '=== 試堂學生表結構 ===' AS step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'hanami_trial_students'
ORDER BY ordinal_position;

-- 4. 檢查資料數量
SELECT '=== 試堂學生資料統計 ===' AS step;
SELECT COUNT(*) as trial_students_count
FROM hanami_trial_students;

-- 5. 查看現有資料
SELECT '=== 現有試堂學生資料 ===' AS step;
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

-- 6. 如果沒有資料，插入測試資料
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
      '張小明',
      '2018-05-15',
      '男',
      '鋼琴',
      CURRENT_DATE + INTERVAL '3 days',
      '14:00',
      '喜歡古典音樂',
      '91234567',
      'zhang@example.com',
      '香港小學',
      '香港灣仔區',
      '李老師',
      '無特殊需求',
      'TS001',
      1,
      1
    ),
    (
      '李小華',
      '2019-03-20',
      '女',
      '音樂專注力',
      CURRENT_DATE + INTERVAL '5 days',
      '16:00',
      '活潑好動',
      '92345678',
      'li@example.com',
      '九龍小學',
      '九龍灣區',
      '王老師',
      '注意力需要提升',
      'TS002',
      1,
      1
    ),
    (
      '王小美',
      '2017-11-10',
      '女',
      '鋼琴',
      CURRENT_DATE + INTERVAL '1 day',
      '10:00',
      '安靜內向',
      '93456789',
      'wang@example.com',
      '新界小學',
      '沙田區',
      '陳老師',
      '無特殊需求',
      'TS003',
      1,
      1
    );
    
    RAISE NOTICE '已插入 % 條測試試堂學生資料', 3;
  ELSE
    RAISE NOTICE '試堂學生表已有 % 條資料，跳過插入測試資料', existing_count;
  END IF;
END $$;

-- 7. 檢查RLS策略
SELECT '=== RLS策略檢查 ===' AS step;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'hanami_trial_students';

-- 8. 如果沒有RLS策略，創建基本策略
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hanami_trial_students' 
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users" ON hanami_trial_students
    FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable insert for authenticated users" ON hanami_trial_students
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable update for authenticated users" ON hanami_trial_students
    FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable delete for authenticated users" ON hanami_trial_students
    FOR DELETE USING (auth.role() = 'authenticated');
    
    RAISE NOTICE '已創建RLS策略';
  ELSE
    RAISE NOTICE 'RLS策略已存在';
  END IF;
END $$;

-- 9. 啟用RLS
ALTER TABLE hanami_trial_students ENABLE ROW LEVEL SECURITY;

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
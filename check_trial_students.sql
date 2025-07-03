-- 檢查試堂學生表狀態和資料
-- 執行此腳本來診斷試堂學生顯示問題

-- 1. 檢查表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'hanami_trial_students'
) as table_exists;

-- 2. 檢查表結構
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'hanami_trial_students'
ORDER BY ordinal_position;

-- 3. 檢查資料數量
SELECT COUNT(*) as trial_students_count
FROM hanami_trial_students;

-- 4. 查看示例資料
SELECT * FROM hanami_trial_students LIMIT 5;

-- 5. 檢查RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'hanami_trial_students';

-- 6. 檢查當前用戶權限
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'hanami_trial_students';

-- 7. 如果沒有資料，插入一條測試資料
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
) 
SELECT 
  '測試試堂學生',
  '2020-01-01',
  '男',
  '鋼琴',
  CURRENT_DATE,
  '14:00',
  '喜歡音樂',
  '12345678',
  'test@example.com',
  '測試學校',
  '測試地址',
  '測試老師',
  '無特殊需求',
  'TS001',
  1,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM hanami_trial_students LIMIT 1
);

-- 8. 再次檢查資料數量
SELECT COUNT(*) as trial_students_count_after_insert
FROM hanami_trial_students; 
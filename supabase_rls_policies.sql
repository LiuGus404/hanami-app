-- =====================================================
-- Supabase RLS 策略和權限設置
-- 適用於 inactive_student_list 表
-- =====================================================

-- 1. 確保表存在並啟用 RLS
CREATE TABLE IF NOT EXISTS inactive_student_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  student_type TEXT NOT NULL CHECK (student_type IN ('regular', 'trial')),
  full_name TEXT,
  student_age INTEGER,
  student_preference TEXT,
  course_type TEXT,
  remaining_lessons INTEGER,
  regular_weekday INTEGER,
  gender TEXT,
  student_oid TEXT,
  contact_number TEXT,
  regular_timeslot TEXT,
  health_notes TEXT,
  lesson_date DATE,
  actual_timeslot TEXT,
  inactive_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  inactive_reason TEXT DEFAULT '管理員停用',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE inactive_student_list ENABLE ROW LEVEL SECURITY;

-- 2. 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_original_id ON inactive_student_list(original_id);
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_student_type ON inactive_student_list(student_type);
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_inactive_date ON inactive_student_list(inactive_date);
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_full_name ON inactive_student_list(full_name);

-- 3. 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 如果觸發器已存在，先刪除
DROP TRIGGER IF EXISTS update_inactive_student_list_updated_at ON inactive_student_list;

-- 創建觸發器
CREATE TRIGGER update_inactive_student_list_updated_at 
    BEFORE UPDATE ON inactive_student_list 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 刪除現有的 RLS 策略（如果存在）
DROP POLICY IF EXISTS "Allow admin to read inactive students" ON inactive_student_list;
DROP POLICY IF EXISTS "Allow admin to insert inactive students" ON inactive_student_list;
DROP POLICY IF EXISTS "Allow admin to update inactive students" ON inactive_student_list;
DROP POLICY IF EXISTS "Allow admin to delete inactive students" ON inactive_student_list;
DROP POLICY IF EXISTS "Allow authenticated users to read inactive students" ON inactive_student_list;
DROP POLICY IF EXISTS "Allow authenticated users to insert inactive students" ON inactive_student_list;
DROP POLICY IF EXISTS "Allow authenticated users to update inactive students" ON inactive_student_list;
DROP POLICY IF EXISTS "Allow authenticated users to delete inactive students" ON inactive_student_list;

-- 5. 創建 RLS 策略

-- 策略 1: 允許管理員讀取所有停用學生
CREATE POLICY "Allow admin to read inactive students" ON inactive_student_list
FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
);

-- 策略 2: 允許管理員插入停用學生
CREATE POLICY "Allow admin to insert inactive students" ON inactive_student_list
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
);

-- 策略 3: 允許管理員更新停用學生
CREATE POLICY "Allow admin to update inactive students" ON inactive_student_list
FOR UPDATE USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
);

-- 策略 4: 允許管理員刪除停用學生
CREATE POLICY "Allow admin to delete inactive students" ON inactive_student_list
FOR DELETE USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
);

-- 策略 5: 允許已認證用戶讀取停用學生（如果需要）
CREATE POLICY "Allow authenticated users to read inactive students" ON inactive_student_list
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- 策略 6: 允許已認證用戶插入停用學生（如果需要）
CREATE POLICY "Allow authenticated users to insert inactive students" ON inactive_student_list
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- 策略 7: 允許已認證用戶更新停用學生（如果需要）
CREATE POLICY "Allow authenticated users to update inactive students" ON inactive_student_list
FOR UPDATE USING (
  auth.role() = 'authenticated'
);

-- 策略 8: 允許已認證用戶刪除停用學生（如果需要）
CREATE POLICY "Allow authenticated users to delete inactive students" ON inactive_student_list
FOR DELETE USING (
  auth.role() = 'authenticated'
);

-- 6. 設置表權限
-- 授予所有權限給 authenticated 角色
GRANT ALL ON inactive_student_list TO authenticated;

-- 授予所有權限給 service_role 角色（用於服務端操作）
GRANT ALL ON inactive_student_list TO service_role;

-- 授予序列權限（如果使用自增ID）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 7. 創建視圖（可選，用於簡化查詢）
CREATE OR REPLACE VIEW inactive_students_view AS
SELECT 
  id,
  original_id,
  student_type,
  full_name,
  student_age,
  course_type,
  remaining_lessons,
  gender,
  student_oid,
  contact_number,
  inactive_date,
  inactive_reason,
  created_at,
  updated_at
FROM inactive_student_list
ORDER BY inactive_date DESC;

-- 為視圖設置權限
GRANT SELECT ON inactive_students_view TO authenticated;
GRANT SELECT ON inactive_students_view TO service_role;

-- 8. 創建函數（可選，用於批量操作）
CREATE OR REPLACE FUNCTION get_inactive_students_by_type(student_type_filter TEXT)
RETURNS TABLE (
  id UUID,
  original_id UUID,
  student_type TEXT,
  full_name TEXT,
  student_age INTEGER,
  course_type TEXT,
  remaining_lessons INTEGER,
  inactive_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    isl.id,
    isl.original_id,
    isl.student_type,
    isl.full_name,
    isl.student_age,
    isl.course_type,
    isl.remaining_lessons,
    isl.inactive_date
  FROM inactive_student_list isl
  WHERE isl.student_type = student_type_filter
  ORDER BY isl.inactive_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 為函數設置權限
GRANT EXECUTE ON FUNCTION get_inactive_students_by_type(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inactive_students_by_type(TEXT) TO service_role;

-- 9. 驗證設置
-- 檢查表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'inactive_student_list'
) AS table_exists;

-- 檢查 RLS 是否啟用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'inactive_student_list';

-- 檢查策略是否創建
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'inactive_student_list';

-- 10. 插入測試資料（可選）
-- 取消註釋以下代碼來插入測試資料
/*
INSERT INTO inactive_student_list (
  original_id,
  student_type,
  full_name,
  student_age,
  course_type,
  remaining_lessons,
  gender,
  student_oid,
  contact_number,
  inactive_reason
) VALUES (
  gen_random_uuid(),
  'regular',
  '測試停用學生',
  60,
  '鋼琴',
  5,
  'male',
  'TEST001',
  '12345678',
  '測試停用'
);
*/

-- =====================================================
-- 使用說明
-- =====================================================

/*
1. 在 Supabase Dashboard 中執行此腳本
2. 確保用戶角色設置正確
3. 測試權限是否正常工作

測試查詢：
-- 讀取所有停用學生
SELECT * FROM inactive_student_list;

-- 按類型讀取停用學生
SELECT * FROM get_inactive_students_by_type('regular');

-- 使用視圖讀取停用學生
SELECT * FROM inactive_students_view;

-- 插入新停用學生
INSERT INTO inactive_student_list (original_id, student_type, full_name, student_age, course_type, remaining_lessons, gender, student_oid, contact_number, inactive_reason)
VALUES (gen_random_uuid(), 'trial', '新停用學生', 48, '音樂專注力', 1, 'female', 'TEST002', '87654321', '管理員停用');

-- 更新停用學生
UPDATE inactive_student_list SET inactive_reason = '更新停用原因' WHERE id = 'your-student-id';

-- 刪除停用學生
DELETE FROM inactive_student_list WHERE id = 'your-student-id';
*/ 
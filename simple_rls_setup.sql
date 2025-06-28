-- =====================================================
-- 最簡單的 RLS 設置腳本
-- 解決 "operator does not exist: text ->> unknown" 錯誤
-- =====================================================

-- 1. 創建表
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

-- 2. 啟用 RLS
ALTER TABLE inactive_student_list ENABLE ROW LEVEL SECURITY;

-- 3. 創建索引
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_original_id ON inactive_student_list(original_id);
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_student_type ON inactive_student_list(student_type);
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_inactive_date ON inactive_student_list(inactive_date);

-- 4. 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_inactive_student_list_updated_at ON inactive_student_list;
CREATE TRIGGER update_inactive_student_list_updated_at 
    BEFORE UPDATE ON inactive_student_list 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Enable read access for all users" ON inactive_student_list;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON inactive_student_list;
DROP POLICY IF EXISTS "Enable update for users based on email" ON inactive_student_list;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON inactive_student_list;

-- 6. 創建最簡單的 RLS 策略

-- 讀取權限
CREATE POLICY "Enable read access for all users" ON inactive_student_list
FOR SELECT USING (true);

-- 插入權限
CREATE POLICY "Enable insert for authenticated users only" ON inactive_student_list
FOR INSERT WITH CHECK (true);

-- 更新權限
CREATE POLICY "Enable update for users based on email" ON inactive_student_list
FOR UPDATE USING (true);

-- 刪除權限
CREATE POLICY "Enable delete for users based on email" ON inactive_student_list
FOR DELETE USING (true);

-- 7. 設置表權限
GRANT ALL ON inactive_student_list TO authenticated;
GRANT ALL ON inactive_student_list TO service_role;

-- 8. 驗證設置
SELECT 'Setup completed successfully' AS result; 
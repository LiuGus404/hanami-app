-- 創建 inactive_student_list 表
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

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_original_id ON inactive_student_list(original_id);
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_student_type ON inactive_student_list(student_type);
CREATE INDEX IF NOT EXISTS idx_inactive_student_list_inactive_date ON inactive_student_list(inactive_date);

-- 添加 RLS 策略（如果需要）
ALTER TABLE inactive_student_list ENABLE ROW LEVEL SECURITY;

-- 創建更新時間的觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inactive_student_list_updated_at 
    BEFORE UPDATE ON inactive_student_list 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 
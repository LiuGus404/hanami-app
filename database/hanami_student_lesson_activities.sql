-- 學生課堂活動分配表
-- 用於記錄每個學生在特定課堂中被分配的活動

CREATE TABLE IF NOT EXISTS public.hanami_student_lesson_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES hanami_student_lesson(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  tree_activity_id UUID NOT NULL REFERENCES hanami_tree_activities(id) ON DELETE CASCADE,
  assigned_by TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_status TEXT DEFAULT 'not_started' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  student_notes TEXT,
  teacher_notes TEXT,
  time_spent INTEGER DEFAULT 0,
  attempts_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 唯一約束：每個學生在每個課堂中對每個活動只能有一條分配記錄
  UNIQUE(lesson_id, student_id, tree_activity_id)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_student_lesson_activities_lesson_id ON hanami_student_lesson_activities(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_lesson_activities_student_id ON hanami_student_lesson_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_student_lesson_activities_tree_activity_id ON hanami_student_lesson_activities(tree_activity_id);
CREATE INDEX IF NOT EXISTS idx_student_lesson_activities_completion_status ON hanami_student_lesson_activities(completion_status);
CREATE INDEX IF NOT EXISTS idx_student_lesson_activities_assigned_at ON hanami_student_lesson_activities(assigned_at);

-- 創建觸發器更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_lesson_activities_updated_at 
  BEFORE UPDATE ON hanami_student_lesson_activities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 啟用 RLS
ALTER TABLE hanami_student_lesson_activities ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 政策
CREATE POLICY "Allow authenticated read access" ON hanami_student_lesson_activities
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert access" ON hanami_student_lesson_activities
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update access" ON hanami_student_lesson_activities
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete access" ON hanami_student_lesson_activities
FOR DELETE USING (auth.role() = 'authenticated'); 
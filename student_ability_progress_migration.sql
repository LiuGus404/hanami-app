-- 創建學生能力進度表
CREATE TABLE IF NOT EXISTS hanami_student_ability_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES hanami_growth_trees(id) ON DELETE CASCADE,
  ability_id UUID NOT NULL REFERENCES hanami_development_abilities(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL DEFAULT 0,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  last_assessment_date DATE,
  assessment_rating INTEGER,
  assessment_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 唯一約束，確保每個學生在每個成長樹的每個能力只有一條記錄
  UNIQUE(student_id, tree_id, ability_id)
);

-- 創建能力評估歷史記錄表
CREATE TABLE IF NOT EXISTS hanami_ability_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES hanami_growth_trees(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  lesson_date DATE NOT NULL,
  teacher_id UUID REFERENCES hanami_employee(id),
  ability_assessments JSONB NOT NULL,
  overall_performance_rating INTEGER NOT NULL,
  general_notes TEXT,
  next_lesson_focus TEXT,
  selected_goals TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 為學生表添加成長樹分配欄位（如果不存在）
ALTER TABLE "Hanami_Students" 
ADD COLUMN IF NOT EXISTS assigned_tree_id UUID REFERENCES hanami_growth_trees(id);

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_student_ability_progress_student_tree 
ON hanami_student_ability_progress(student_id, tree_id);

CREATE INDEX IF NOT EXISTS idx_student_ability_progress_ability 
ON hanami_student_ability_progress(ability_id);

CREATE INDEX IF NOT EXISTS idx_ability_assessments_student 
ON hanami_ability_assessments(student_id);

CREATE INDEX IF NOT EXISTS idx_ability_assessments_date 
ON hanami_ability_assessments(assessment_date);

-- 創建更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為表添加更新時間觸發器
CREATE TRIGGER update_student_ability_progress_updated_at
  BEFORE UPDATE ON hanami_student_ability_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ability_assessments_updated_at
  BEFORE UPDATE ON hanami_ability_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 創建 RLS 策略（如果需要）
ALTER TABLE hanami_student_ability_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_ability_assessments ENABLE ROW LEVEL SECURITY;

-- 插入一些測試資料（可選）
-- INSERT INTO hanami_student_ability_progress (student_id, tree_id, ability_id, current_level, progress_percentage)
-- SELECT 
--   s.id as student_id,
--   gt.id as tree_id,
--   da.id as ability_id,
--   0 as current_level,
--   0 as progress_percentage
-- FROM "Hanami_Students" s
-- CROSS JOIN hanami_growth_trees gt
-- CROSS JOIN hanami_development_abilities da
-- WHERE s.assigned_tree_id = gt.id
-- LIMIT 10; 
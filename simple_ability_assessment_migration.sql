-- 簡化版能力評估系統遷移腳本
-- 創建基本的成長樹能力評估記錄表

-- 1. 創建能力評估記錄表（簡化版）
CREATE TABLE IF NOT EXISTS hanami_ability_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  tree_id UUID NOT NULL,
  assessment_date DATE NOT NULL,
  lesson_date DATE NOT NULL,
  teacher_id UUID,
  
  -- 能力評估記錄（JSON格式）
  ability_assessments JSONB NOT NULL DEFAULT '{}',
  
  -- 整體評估
  overall_performance_rating INTEGER,
  general_notes TEXT,
  next_lesson_focus TEXT,
  
  -- 系統欄位
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 添加基本索引
CREATE INDEX IF NOT EXISTS idx_ability_assessments_student 
ON hanami_ability_assessments(student_id);

CREATE INDEX IF NOT EXISTS idx_ability_assessments_tree 
ON hanami_ability_assessments(tree_id);

CREATE INDEX IF NOT EXISTS idx_ability_assessments_date 
ON hanami_ability_assessments(assessment_date);

-- 3. 創建簡單的觸發器函數
CREATE OR REPLACE FUNCTION update_ability_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 創建觸發器
DROP TRIGGER IF EXISTS update_ability_assessments_updated_at ON hanami_ability_assessments;
CREATE TRIGGER update_ability_assessments_updated_at
  BEFORE UPDATE ON hanami_ability_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_ability_assessment_updated_at();

-- 5. 創建簡單的查詢函數
CREATE OR REPLACE FUNCTION get_latest_ability_assessment(
  p_student_id UUID,
  p_tree_id UUID
)
RETURNS TABLE (
  assessment_id UUID,
  assessment_date DATE,
  ability_assessments JSONB,
  overall_performance_rating INTEGER,
  general_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.id,
    aa.assessment_date,
    aa.ability_assessments,
    aa.overall_performance_rating,
    aa.general_notes
  FROM hanami_ability_assessments aa
  WHERE aa.student_id = p_student_id 
    AND aa.tree_id = p_tree_id
  ORDER BY aa.assessment_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 完成訊息
SELECT '簡化版能力評估系統資料表創建完成！' as message; 
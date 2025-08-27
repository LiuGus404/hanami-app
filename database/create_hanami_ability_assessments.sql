-- 創建能力評估表
CREATE TABLE IF NOT EXISTS public.hanami_ability_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  tree_id UUID NOT NULL,
  assessment_date DATE NOT NULL,
  lesson_date DATE NOT NULL,
  teacher_id UUID,
  ability_assessments JSONB NOT NULL DEFAULT '{}',
  overall_performance_rating INTEGER NOT NULL DEFAULT 3 CHECK (overall_performance_rating >= 1 AND overall_performance_rating <= 5),
  general_notes TEXT,
  next_lesson_focus TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT hanami_ability_assessments_pkey PRIMARY KEY (id)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_hanami_ability_assessments_student_id ON public.hanami_ability_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_hanami_ability_assessments_tree_id ON public.hanami_ability_assessments(tree_id);
CREATE INDEX IF NOT EXISTS idx_hanami_ability_assessments_assessment_date ON public.hanami_ability_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_hanami_ability_assessments_lesson_date ON public.hanami_ability_assessments(lesson_date);
CREATE INDEX IF NOT EXISTS idx_hanami_ability_assessments_created_at ON public.hanami_ability_assessments(created_at);

-- 創建複合唯一索引，防止同一學生同一成長樹同一日期的重複評估
CREATE UNIQUE INDEX IF NOT EXISTS idx_hanami_ability_assessments_unique 
ON public.hanami_ability_assessments(student_id, tree_id, assessment_date);

-- 創建更新時間觸發器函數（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 創建觸發器
DROP TRIGGER IF EXISTS update_hanami_ability_assessments_updated_at ON public.hanami_ability_assessments;
CREATE TRIGGER update_hanami_ability_assessments_updated_at
    BEFORE UPDATE ON public.hanami_ability_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 設置 RLS (Row Level Security)
ALTER TABLE public.hanami_ability_assessments ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 策略
DROP POLICY IF EXISTS "Enable read access for all users" ON public.hanami_ability_assessments;
CREATE POLICY "Enable read access for all users" ON public.hanami_ability_assessments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.hanami_ability_assessments;
CREATE POLICY "Enable insert for all users" ON public.hanami_ability_assessments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public.hanami_ability_assessments;
CREATE POLICY "Enable update for all users" ON public.hanami_ability_assessments
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON public.hanami_ability_assessments;
CREATE POLICY "Enable delete for all users" ON public.hanami_ability_assessments
    FOR DELETE USING (true);

-- 給予匿名和已認證用戶權限
GRANT ALL ON public.hanami_ability_assessments TO anon;
GRANT ALL ON public.hanami_ability_assessments TO authenticated;

-- 確保 UUID 擴展存在
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 插入一些測試資料（可選）
-- 注意：需要確保 student_id 和 tree_id 在對應的表中存在

-- 查看表結構
\d public.hanami_ability_assessments;

-- 查看索引
\di public.idx_hanami_ability_assessments*;

-- 查看 RLS 策略
\dp public.hanami_ability_assessments;

COMMENT ON TABLE public.hanami_ability_assessments IS '學生能力評估記錄表';
COMMENT ON COLUMN public.hanami_ability_assessments.id IS '主鍵 UUID';
COMMENT ON COLUMN public.hanami_ability_assessments.student_id IS '學生 ID，關聯到 Hanami_Students 表';
COMMENT ON COLUMN public.hanami_ability_assessments.tree_id IS '成長樹 ID，關聯到 hanami_growth_trees 表';
COMMENT ON COLUMN public.hanami_ability_assessments.assessment_date IS '評估日期';
COMMENT ON COLUMN public.hanami_ability_assessments.lesson_date IS '課堂日期';
COMMENT ON COLUMN public.hanami_ability_assessments.teacher_id IS '教師 ID，關聯到 hanami_employee 表';
COMMENT ON COLUMN public.hanami_ability_assessments.ability_assessments IS '能力評估詳細資料，JSON 格式';
COMMENT ON COLUMN public.hanami_ability_assessments.overall_performance_rating IS '整體表現評分 (1-5)';
COMMENT ON COLUMN public.hanami_ability_assessments.general_notes IS '一般備註';
COMMENT ON COLUMN public.hanami_ability_assessments.next_lesson_focus IS '下次課程重點';
COMMENT ON COLUMN public.hanami_ability_assessments.created_at IS '創建時間';
COMMENT ON COLUMN public.hanami_ability_assessments.updated_at IS '更新時間';

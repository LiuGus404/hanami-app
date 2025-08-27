-- 創建目標評估表
CREATE TABLE IF NOT EXISTS public.hanami_goal_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL,
  goal_id UUID NOT NULL,
  assessment_mode TEXT NOT NULL CHECK (assessment_mode IN ('progress', 'multi_select')),
  progress_level INTEGER,
  selected_levels TEXT, -- JSON 字串格式儲存多選項目
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT hanami_goal_assessments_pkey PRIMARY KEY (id)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_hanami_goal_assessments_assessment_id ON public.hanami_goal_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_hanami_goal_assessments_goal_id ON public.hanami_goal_assessments(goal_id);
CREATE INDEX IF NOT EXISTS idx_hanami_goal_assessments_created_at ON public.hanami_goal_assessments(created_at);

-- 創建複合唯一索引，防止同一評估的同一目標重複記錄
CREATE UNIQUE INDEX IF NOT EXISTS idx_hanami_goal_assessments_unique 
ON public.hanami_goal_assessments(assessment_id, goal_id);

-- 創建外鍵約束（如果相關表存在）
-- 注意：如果 hanami_ability_assessments 或 hanami_growth_goals 表不存在，請先創建它們
DO $$
BEGIN
  -- 檢查 hanami_ability_assessments 表是否存在
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'hanami_ability_assessments') THEN
    -- 添加到 hanami_ability_assessments 的外鍵約束
    IF NOT EXISTS (
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'hanami_goal_assessments' 
      AND constraint_name = 'hanami_goal_assessments_assessment_id_fkey'
    ) THEN
      ALTER TABLE public.hanami_goal_assessments 
      ADD CONSTRAINT hanami_goal_assessments_assessment_id_fkey 
      FOREIGN KEY (assessment_id) REFERENCES public.hanami_ability_assessments(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- 檢查 hanami_growth_goals 表是否存在
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'hanami_growth_goals') THEN
    -- 添加到 hanami_growth_goals 的外鍵約束
    IF NOT EXISTS (
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'hanami_goal_assessments' 
      AND constraint_name = 'hanami_goal_assessments_goal_id_fkey'
    ) THEN
      ALTER TABLE public.hanami_goal_assessments 
      ADD CONSTRAINT hanami_goal_assessments_goal_id_fkey 
      FOREIGN KEY (goal_id) REFERENCES public.hanami_growth_goals(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 創建更新時間觸發器（如果函數不存在則創建）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 創建觸發器
DROP TRIGGER IF EXISTS update_hanami_goal_assessments_updated_at ON public.hanami_goal_assessments;
CREATE TRIGGER update_hanami_goal_assessments_updated_at
    BEFORE UPDATE ON public.hanami_goal_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 設置 RLS (Row Level Security)
ALTER TABLE public.hanami_goal_assessments ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 策略
DROP POLICY IF EXISTS "Enable read access for all users" ON public.hanami_goal_assessments;
CREATE POLICY "Enable read access for all users" ON public.hanami_goal_assessments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.hanami_goal_assessments;
CREATE POLICY "Enable insert for all users" ON public.hanami_goal_assessments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public.hanami_goal_assessments;
CREATE POLICY "Enable update for all users" ON public.hanami_goal_assessments
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON public.hanami_goal_assessments;
CREATE POLICY "Enable delete for all users" ON public.hanami_goal_assessments
    FOR DELETE USING (true);

-- 給予匿名和已認證用戶權限
GRANT ALL ON public.hanami_goal_assessments TO anon;
GRANT ALL ON public.hanami_goal_assessments TO authenticated;

-- 查看表結構
\d public.hanami_goal_assessments;

-- 查看索引
\di public.idx_hanami_goal_assessments*;

-- 查看 RLS 策略
\dp public.hanami_goal_assessments;

COMMENT ON TABLE public.hanami_goal_assessments IS '學習目標評估記錄表';
COMMENT ON COLUMN public.hanami_goal_assessments.id IS '主鍵 UUID';
COMMENT ON COLUMN public.hanami_goal_assessments.assessment_id IS '關聯到 hanami_ability_assessments 表的評估記錄';
COMMENT ON COLUMN public.hanami_goal_assessments.goal_id IS '關聯到 hanami_growth_goals 表的學習目標';
COMMENT ON COLUMN public.hanami_goal_assessments.assessment_mode IS '評估模式：progress（進度模式）或 multi_select（多選模式）';
COMMENT ON COLUMN public.hanami_goal_assessments.progress_level IS '進度等級（用於 progress 模式）';
COMMENT ON COLUMN public.hanami_goal_assessments.selected_levels IS '選擇的等級（用於 multi_select 模式，JSON 字串格式）';
COMMENT ON COLUMN public.hanami_goal_assessments.notes IS '評估備註';
COMMENT ON COLUMN public.hanami_goal_assessments.created_at IS '創建時間';
COMMENT ON COLUMN public.hanami_goal_assessments.updated_at IS '更新時間';

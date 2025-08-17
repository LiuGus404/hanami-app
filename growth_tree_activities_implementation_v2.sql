-- 成長樹活動欄位實作腳本 (修正版)
-- 版本: 2.0.0
-- 日期: 2024-12-19
-- 描述: 基於現有架構的成長樹活動管理功能

-- ========================================
-- 1. 檢查並創建 hanami_tree_activities 表
-- ========================================

-- 檢查表是否存在，如果不存在則創建
CREATE TABLE IF NOT EXISTS hanami_tree_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES hanami_growth_trees(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  activity_description TEXT,
  activity_type TEXT NOT NULL DEFAULT 'custom' CHECK (activity_type IN ('custom', 'teaching', 'assessment', 'practice')),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  estimated_duration INTEGER, -- 預估時長（分鐘）
  materials_needed TEXT[], -- 所需材料
  instructions TEXT, -- 活動說明
  learning_objectives TEXT[], -- 學習目標
  target_abilities TEXT[], -- 目標能力
  prerequisites TEXT[], -- 前置條件
  activity_order INTEGER DEFAULT 0, -- 活動順序
  is_required BOOLEAN DEFAULT false, -- 是否為必做活動
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 為現有表添加新欄位（如果表已存在）
DO $$
BEGIN
  -- 檢查表是否存在
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hanami_tree_activities') THEN
    -- 添加活動類型欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'activity_type') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN activity_type TEXT NOT NULL DEFAULT 'custom' CHECK (activity_type IN ('custom', 'teaching', 'assessment', 'practice'));
    END IF;
    
    -- 添加難度等級欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'difficulty_level') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5);
    END IF;
    
    -- 添加預估時長欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'estimated_duration') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN estimated_duration INTEGER;
    END IF;
    
    -- 添加所需材料欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'materials_needed') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN materials_needed TEXT[] DEFAULT '{}';
    END IF;
    
    -- 添加活動說明欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'instructions') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN instructions TEXT;
    END IF;
    
    -- 添加學習目標欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'learning_objectives') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN learning_objectives TEXT[] DEFAULT '{}';
    END IF;
    
    -- 添加目標能力欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'target_abilities') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN target_abilities TEXT[] DEFAULT '{}';
    END IF;
    
    -- 添加前置條件欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'prerequisites') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN prerequisites TEXT[] DEFAULT '{}';
    END IF;
    
    -- 添加活動順序欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'activity_order') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN activity_order INTEGER DEFAULT 0;
    END IF;
    
    -- 添加必做活動欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'is_required') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN is_required BOOLEAN DEFAULT false;
    END IF;
    
    -- 添加創建者欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'created_by') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN created_by TEXT;
    END IF;
    
    -- 添加更新者欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'updated_by') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN updated_by TEXT;
    END IF;
    
    -- 添加更新時間欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hanami_tree_activities' AND column_name = 'updated_at') THEN
      ALTER TABLE hanami_tree_activities ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- ========================================
-- 2. 創建索引以提高查詢性能
-- ========================================

-- 成長樹活動索引
CREATE INDEX IF NOT EXISTS idx_tree_activities_tree_id ON hanami_tree_activities(tree_id);
CREATE INDEX IF NOT EXISTS idx_tree_activities_activity_type ON hanami_tree_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_tree_activities_difficulty_level ON hanami_tree_activities(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_tree_activities_is_active ON hanami_tree_activities(is_active);
CREATE INDEX IF NOT EXISTS idx_tree_activities_activity_order ON hanami_tree_activities(activity_order);
CREATE INDEX IF NOT EXISTS idx_tree_activities_created_at ON hanami_tree_activities(created_at);

-- 複合索引
CREATE INDEX IF NOT EXISTS idx_tree_activities_tree_active ON hanami_tree_activities(tree_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tree_activities_tree_type ON hanami_tree_activities(tree_id, activity_type);

-- ========================================
-- 3. 創建學生活動進度表
-- ========================================

CREATE TABLE IF NOT EXISTS hanami_student_tree_activity_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  tree_activity_id UUID NOT NULL REFERENCES hanami_tree_activities(id) ON DELETE CASCADE,
  completion_status TEXT DEFAULT 'not_started' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  completion_date TIMESTAMP WITH TIME ZONE,
  performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5), -- 1-5分評分
  student_notes TEXT, -- 學生筆記
  teacher_notes TEXT, -- 教師筆記
  evidence_files TEXT[], -- 證據檔案路徑
  time_spent INTEGER, -- 實際花費時間（分鐘）
  attempts_count INTEGER DEFAULT 0, -- 嘗試次數
  is_favorite BOOLEAN DEFAULT false, -- 是否為最愛活動
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 唯一約束：每個學生對每個活動只能有一條進度記錄
  UNIQUE(student_id, tree_activity_id)
);

-- 學生活動進度索引
CREATE INDEX IF NOT EXISTS idx_student_activity_progress_student ON hanami_student_tree_activity_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_progress_activity ON hanami_student_tree_activity_progress(tree_activity_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_progress_status ON hanami_student_tree_activity_progress(completion_status);
CREATE INDEX IF NOT EXISTS idx_student_activity_progress_completion_date ON hanami_student_tree_activity_progress(completion_date);

-- ========================================
-- 4. 創建活動模板表
-- ========================================

CREATE TABLE IF NOT EXISTS hanami_tree_activity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  template_description TEXT,
  activity_type TEXT NOT NULL DEFAULT 'custom' CHECK (activity_type IN ('custom', 'teaching', 'assessment', 'practice')),
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  estimated_duration INTEGER,
  materials_needed TEXT[] DEFAULT '{}',
  instructions TEXT,
  learning_objectives TEXT[] DEFAULT '{}',
  target_abilities TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 活動模板索引
CREATE INDEX IF NOT EXISTS idx_activity_templates_type ON hanami_tree_activity_templates(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_templates_difficulty ON hanami_tree_activity_templates(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_activity_templates_active ON hanami_tree_activity_templates(is_active);

-- ========================================
-- 5. 創建實用函數
-- ========================================

-- 獲取成長樹的所有活動
CREATE OR REPLACE FUNCTION get_tree_activities(p_tree_id UUID)
RETURNS TABLE (
  id UUID,
  activity_name TEXT,
  activity_description TEXT,
  activity_type TEXT,
  difficulty_level INTEGER,
  estimated_duration INTEGER,
  materials_needed TEXT[],
  instructions TEXT,
  learning_objectives TEXT[],
  target_abilities TEXT[],
  prerequisites TEXT[],
  activity_order INTEGER,
  is_required BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.activity_name,
    ta.activity_description,
    ta.activity_type,
    ta.difficulty_level,
    ta.estimated_duration,
    ta.materials_needed,
    ta.instructions,
    ta.learning_objectives,
    ta.target_abilities,
    ta.prerequisites,
    ta.activity_order,
    ta.is_required,
    ta.is_active,
    ta.created_at
  FROM hanami_tree_activities ta
  WHERE ta.tree_id = p_tree_id
    AND ta.is_active = true
  ORDER BY ta.activity_order, ta.created_at;
END;
$$ LANGUAGE plpgsql;

-- 獲取學生在特定成長樹的活動進度
CREATE OR REPLACE FUNCTION get_student_tree_activity_progress(p_student_id UUID, p_tree_id UUID)
RETURNS TABLE (
  activity_id UUID,
  activity_name TEXT,
  activity_type TEXT,
  difficulty_level INTEGER,
  completion_status TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  performance_rating INTEGER,
  student_notes TEXT,
  teacher_notes TEXT,
  time_spent INTEGER,
  attempts_count INTEGER,
  is_favorite BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id as activity_id,
    ta.activity_name,
    ta.activity_type,
    ta.difficulty_level,
    COALESCE(stap.completion_status, 'not_started') as completion_status,
    stap.completion_date,
    stap.performance_rating,
    stap.student_notes,
    stap.teacher_notes,
    stap.time_spent,
    stap.attempts_count,
    stap.is_favorite
  FROM hanami_tree_activities ta
  LEFT JOIN hanami_student_tree_activity_progress stap 
    ON ta.id = stap.tree_activity_id 
    AND stap.student_id = p_student_id
  WHERE ta.tree_id = p_tree_id
    AND ta.is_active = true
  ORDER BY ta.activity_order, ta.created_at;
END;
$$ LANGUAGE plpgsql;

-- 更新學生活動進度
CREATE OR REPLACE FUNCTION update_student_activity_progress(
  p_student_id UUID,
  p_activity_id UUID,
  p_completion_status TEXT,
  p_performance_rating INTEGER DEFAULT NULL,
  p_student_notes TEXT DEFAULT NULL,
  p_teacher_notes TEXT DEFAULT NULL,
  p_time_spent INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_attempts_count INTEGER;
BEGIN
  -- 獲取當前嘗試次數
  SELECT COALESCE(attempts_count, 0) INTO v_attempts_count
  FROM hanami_student_tree_activity_progress
  WHERE student_id = p_student_id AND tree_activity_id = p_activity_id;
  
  -- 插入或更新進度記錄
  INSERT INTO hanami_student_tree_activity_progress (
    student_id,
    tree_activity_id,
    completion_status,
    completion_date,
    performance_rating,
    student_notes,
    teacher_notes,
    time_spent,
    attempts_count,
    updated_at
  ) VALUES (
    p_student_id,
    p_activity_id,
    p_completion_status,
    CASE WHEN p_completion_status = 'completed' THEN NOW() ELSE NULL END,
    p_performance_rating,
    p_student_notes,
    p_teacher_notes,
    p_time_spent,
    v_attempts_count + 1,
    NOW()
  )
  ON CONFLICT (student_id, tree_activity_id)
  DO UPDATE SET
    completion_status = EXCLUDED.completion_status,
    completion_date = EXCLUDED.completion_date,
    performance_rating = EXCLUDED.performance_rating,
    student_notes = EXCLUDED.student_notes,
    teacher_notes = EXCLUDED.teacher_notes,
    time_spent = EXCLUDED.time_spent,
    attempts_count = EXCLUDED.attempts_count,
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. 創建觸發器
-- ========================================

-- 自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為相關表添加觸發器
CREATE TRIGGER update_tree_activities_updated_at
  BEFORE UPDATE ON hanami_tree_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_activity_progress_updated_at
  BEFORE UPDATE ON hanami_student_tree_activity_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_templates_updated_at
  BEFORE UPDATE ON hanami_tree_activity_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. 插入預設活動模板
-- ========================================

INSERT INTO hanami_tree_activity_templates (template_name, template_description, activity_type, difficulty_level, estimated_duration, materials_needed, instructions, learning_objectives, target_abilities) VALUES
-- 基礎練習活動
('基礎節奏練習', '透過簡單的節奏練習培養音樂感知能力', 'practice', 1, 15, ARRAY['節奏棒', '音樂播放器'], '1. 播放簡單的節奏音樂\n2. 讓學生跟隨節奏拍手\n3. 逐漸增加節奏複雜度', ARRAY['培養節奏感', '提升聽覺敏銳度'], ARRAY['節奏感', '聽覺能力']),

('手指靈活度練習', '透過手指操提升小肌肉發展', 'practice', 1, 10, ARRAY['手指操音樂'], '1. 播放手指操音樂\n2. 引導學生做手指運動\n3. 重複練習直到熟練', ARRAY['提升手指靈活度', '增強小肌肉控制'], ARRAY['小肌發展', '手眼協調']),

-- 教學活動
('音樂故事時間', '透過音樂故事培養音樂興趣', 'teaching', 2, 20, ARRAY['故事書', '背景音樂'], '1. 選擇適合的音樂故事\n2. 配合背景音樂講述\n3. 引導學生參與互動', ARRAY['培養音樂興趣', '提升語言理解'], ARRAY['音樂興趣', '語言理解']),

('樂器探索', '讓學生接觸不同樂器', 'teaching', 2, 25, ARRAY['各種簡單樂器'], '1. 展示不同樂器\n2. 讓學生試玩\n3. 介紹樂器特色', ARRAY['認識不同樂器', '培養樂器興趣'], ARRAY['樂器認知', '探索精神']),

-- 評估活動
('音樂能力評估', '評估學生的音樂基礎能力', 'assessment', 3, 30, ARRAY['評估表', '音樂素材'], '1. 進行各項音樂能力測試\n2. 記錄學生表現\n3. 分析評估結果', ARRAY['評估音樂能力', '制定學習計劃'], ARRAY['音樂能力', '評估能力']),

('進度回顧', '回顧學習進度並設定新目標', 'assessment', 3, 20, ARRAY['進度記錄表'], '1. 回顧已完成的活動\n2. 評估學習效果\n3. 設定下階段目標', ARRAY['回顧學習進度', '設定新目標'], ARRAY['自我評估', '目標設定'])

ON CONFLICT (template_name) DO NOTHING;

-- ========================================
-- 8. 添加註釋
-- ========================================

COMMENT ON TABLE hanami_tree_activities IS '成長樹專屬活動表';
COMMENT ON COLUMN hanami_tree_activities.activity_type IS '活動類型：custom=自訂活動，teaching=教學活動，assessment=評估活動，practice=練習活動';
COMMENT ON COLUMN hanami_tree_activities.difficulty_level IS '難度等級：1=初級，2=中級，3=高級，4=進階，5=專家';
COMMENT ON COLUMN hanami_tree_activities.estimated_duration IS '預估時長（分鐘）';
COMMENT ON COLUMN hanami_tree_activities.materials_needed IS '所需材料列表';
COMMENT ON COLUMN hanami_tree_activities.learning_objectives IS '學習目標列表';
COMMENT ON COLUMN hanami_tree_activities.target_abilities IS '目標能力列表';
COMMENT ON COLUMN hanami_tree_activities.prerequisites IS '前置條件列表';
COMMENT ON COLUMN hanami_tree_activities.activity_order IS '活動順序，用於排序';
COMMENT ON COLUMN hanami_tree_activities.is_required IS '是否為必做活動';

COMMENT ON TABLE hanami_student_tree_activity_progress IS '學生成長樹活動進度表';
COMMENT ON COLUMN hanami_student_tree_activity_progress.completion_status IS '完成狀態：not_started=未開始，in_progress=進行中，completed=已完成，skipped=跳過';
COMMENT ON COLUMN hanami_student_tree_activity_progress.performance_rating IS '表現評分：1-5分';
COMMENT ON COLUMN hanami_student_tree_activity_progress.evidence_files IS '證據檔案路徑列表';
COMMENT ON COLUMN hanami_student_tree_activity_progress.time_spent IS '實際花費時間（分鐘）';
COMMENT ON COLUMN hanami_student_tree_activity_progress.attempts_count IS '嘗試次數';

COMMENT ON TABLE hanami_tree_activity_templates IS '成長樹活動模板表';
COMMENT ON COLUMN hanami_tree_activity_templates.template_name IS '模板名稱，必須唯一';

-- ========================================
-- 9. 啟用 RLS（如果需要）
-- ========================================

-- 注意：根據您的權限系統，可能需要調整這些政策
ALTER TABLE hanami_tree_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_student_tree_activity_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_tree_activity_templates ENABLE ROW LEVEL SECURITY;

-- 基本讀取政策（可根據實際需求調整）
CREATE POLICY "Allow authenticated read access" ON hanami_tree_activities
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON hanami_student_tree_activity_progress
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON hanami_tree_activity_templates
FOR SELECT USING (auth.role() = 'authenticated');

-- ========================================
-- 10. 完成訊息
-- ========================================

SELECT '成長樹活動欄位實作完成！' as message;
SELECT '已創建/更新以下表：' as info;
SELECT '  - hanami_tree_activities (成長樹活動表)' as table_name;
SELECT '  - hanami_student_tree_activity_progress (學生活動進度表)' as table_name;
SELECT '  - hanami_tree_activity_templates (活動模板表)' as table_name;
SELECT '已創建索引、函數、觸發器和預設資料' as info; 
-- 學習路線系統資料庫遷移腳本
-- 創建時間: 2024-12-19
-- 描述: 為 Hanami Web 系統添加學習路線管理功能

-- 1. 創建學習路線主表
CREATE TABLE IF NOT EXISTS hanami_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tree_id UUID REFERENCES hanami_growth_trees(id) ON DELETE CASCADE,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_node_id TEXT NOT NULL,
  end_node_id TEXT NOT NULL,
  total_duration INTEGER NOT NULL DEFAULT 0,
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 創建學習節點表
CREATE TABLE IF NOT EXISTS hanami_learning_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID REFERENCES hanami_learning_paths(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('activity', 'assessment', 'milestone', 'break')),
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 0, -- 分鐘
  difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  prerequisites TEXT[] DEFAULT '{}',
  rewards TEXT[] DEFAULT '{}',
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  connections TEXT[] DEFAULT '{}', -- 連接到其他節點的ID
  is_completed BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. 創建學生學習進度表
CREATE TABLE IF NOT EXISTS hanami_student_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  path_id UUID REFERENCES hanami_learning_paths(id) ON DELETE CASCADE,
  current_node_id TEXT,
  completed_nodes TEXT[] DEFAULT '{}',
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completion_date TIMESTAMP WITH TIME ZONE,
  total_time_spent INTEGER DEFAULT 0, -- 分鐘
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, path_id)
);

-- 4. 創建學習節點完成記錄表
CREATE TABLE IF NOT EXISTS hanami_node_completion_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  path_id UUID REFERENCES hanami_learning_paths(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  time_spent INTEGER DEFAULT 0, -- 分鐘
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  notes TEXT,
  evidence_files TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. 創建學習路線模板表
CREATE TABLE IF NOT EXISTS hanami_learning_path_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  template_description TEXT,
  template_category TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_duration INTEGER DEFAULT 0, -- 分鐘
  target_age_min INTEGER,
  target_age_max INTEGER,
  tags TEXT[] DEFAULT '{}',
  template_data JSONB NOT NULL, -- 包含節點和連接的完整模板資料
  is_public BOOLEAN DEFAULT false,
  created_by UUID,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. 創建索引
CREATE INDEX IF NOT EXISTS idx_learning_paths_tree_id ON hanami_learning_paths(tree_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_is_active ON hanami_learning_paths(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_nodes_path_id ON hanami_learning_nodes(path_id);
CREATE INDEX IF NOT EXISTS idx_student_learning_progress_student_id ON hanami_student_learning_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_learning_progress_path_id ON hanami_student_learning_progress(path_id);
CREATE INDEX IF NOT EXISTS idx_node_completion_records_student_path ON hanami_node_completion_records(student_id, path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_templates_category ON hanami_learning_path_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_learning_path_templates_is_public ON hanami_learning_path_templates(is_public);

-- 7. 創建更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 創建觸發器
CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON hanami_learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_nodes_updated_at
  BEFORE UPDATE ON hanami_learning_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_learning_progress_updated_at
  BEFORE UPDATE ON hanami_student_learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_path_templates_updated_at
  BEFORE UPDATE ON hanami_learning_path_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. 創建 RLS 策略
ALTER TABLE hanami_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_learning_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_student_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_node_completion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_learning_path_templates ENABLE ROW LEVEL SECURITY;

-- 學習路線 RLS 策略
CREATE POLICY "學習路線管理員可讀寫" ON hanami_learning_paths
  FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "學習路線教師可讀寫" ON hanami_learning_paths
  FOR ALL USING (auth.role() = 'teacher');

CREATE POLICY "學習路線學生可讀" ON hanami_learning_paths
  FOR SELECT USING (auth.role() = 'student' AND is_active = true);

-- 學習節點 RLS 策略
CREATE POLICY "學習節點管理員可讀寫" ON hanami_learning_nodes
  FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "學習節點教師可讀寫" ON hanami_learning_nodes
  FOR ALL USING (auth.role() = 'teacher');

CREATE POLICY "學習節點學生可讀" ON hanami_learning_nodes
  FOR SELECT USING (auth.role() = 'student');

-- 學生學習進度 RLS 策略
CREATE POLICY "學習進度管理員可讀寫" ON hanami_student_learning_progress
  FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "學習進度教師可讀寫" ON hanami_student_learning_progress
  FOR ALL USING (auth.role() = 'teacher');

CREATE POLICY "學習進度學生可讀寫自己的" ON hanami_student_learning_progress
  FOR ALL USING (auth.role() = 'student' AND student_id::text = auth.uid()::text);

-- 節點完成記錄 RLS 策略
CREATE POLICY "完成記錄管理員可讀寫" ON hanami_node_completion_records
  FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "完成記錄教師可讀寫" ON hanami_node_completion_records
  FOR ALL USING (auth.role() = 'teacher');

CREATE POLICY "完成記錄學生可讀寫自己的" ON hanami_node_completion_records
  FOR ALL USING (auth.role() = 'student' AND student_id::text = auth.uid()::text);

-- 學習路線模板 RLS 策略
CREATE POLICY "模板管理員可讀寫" ON hanami_learning_path_templates
  FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "模板教師可讀寫" ON hanami_learning_path_templates
  FOR ALL USING (auth.role() = 'teacher');

CREATE POLICY "模板學生可讀公開的" ON hanami_learning_path_templates
  FOR SELECT USING (auth.role() = 'student' AND is_public = true);

-- 10. 創建實用函數

-- 計算學習路線進度
CREATE OR REPLACE FUNCTION calculate_learning_progress(
  p_student_id UUID,
  p_path_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_nodes INTEGER;
  completed_nodes INTEGER;
  progress DECIMAL(5,2);
BEGIN
  -- 獲取總節點數
  SELECT COUNT(*) INTO total_nodes
  FROM hanami_learning_nodes
  WHERE path_id = p_path_id;
  
  -- 獲取已完成節點數
  SELECT COUNT(*) INTO completed_nodes
  FROM hanami_node_completion_records
  WHERE student_id = p_student_id AND path_id = p_path_id;
  
  -- 計算進度百分比
  IF total_nodes > 0 THEN
    progress := (completed_nodes::DECIMAL / total_nodes::DECIMAL) * 100;
  ELSE
    progress := 0;
  END IF;
  
  RETURN ROUND(progress, 2);
END;
$$ LANGUAGE plpgsql;

-- 獲取下一個可學習的節點
CREATE OR REPLACE FUNCTION get_next_available_node(
  p_student_id UUID,
  p_path_id UUID
)
RETURNS TEXT AS $$
DECLARE
  next_node_id TEXT;
BEGIN
  -- 查找第一個未完成的節點
  SELECT ln.node_id INTO next_node_id
  FROM hanami_learning_nodes ln
  LEFT JOIN hanami_node_completion_records ncr 
    ON ncr.student_id = p_student_id 
    AND ncr.path_id = p_path_id 
    AND ncr.node_id = ln.id::text
  WHERE ln.path_id = p_path_id 
    AND ncr.id IS NULL
    AND NOT ln.is_locked
  ORDER BY ln.sort_order, ln.created_at
  LIMIT 1;
  
  RETURN next_node_id;
END;
$$ LANGUAGE plpgsql;

-- 11. 插入預設模板資料
INSERT INTO hanami_learning_path_templates (
  template_name,
  template_description,
  template_category,
  difficulty_level,
  estimated_duration,
  target_age_min,
  target_age_max,
  tags,
  template_data,
  is_public
) VALUES (
  '鋼琴基礎入門路線',
  '適合初學者的鋼琴學習路線，從基本姿勢到簡單曲目',
  'piano_basic',
  1,
  120,
  4,
  8,
  ARRAY['初學者', '鋼琴', '基礎'],
  '{
    "nodes": [
      {
        "id": "start",
        "type": "milestone",
        "title": "開始學習",
        "description": "學習旅程的起點",
        "duration": 0,
        "difficulty": 1,
        "position": {"x": 100, "y": 200},
        "connections": ["node-1"]
      },
      {
        "id": "node-1",
        "type": "activity",
        "title": "基本坐姿練習",
        "description": "學習正確的鋼琴坐姿",
        "duration": 15,
        "difficulty": 1,
        "position": {"x": 300, "y": 200},
        "connections": ["node-2"]
      },
      {
        "id": "node-2",
        "type": "activity",
        "title": "手型練習",
        "description": "練習正確的手型和手指位置",
        "duration": 20,
        "difficulty": 1,
        "position": {"x": 500, "y": 200},
        "connections": ["node-3"]
      },
      {
        "id": "node-3",
        "type": "assessment",
        "title": "基本姿勢評估",
        "description": "評估基本坐姿和手型",
        "duration": 10,
        "difficulty": 1,
        "position": {"x": 700, "y": 200},
        "connections": ["end"]
      },
      {
        "id": "end",
        "type": "milestone",
        "title": "完成學習",
        "description": "恭喜完成基礎入門！",
        "duration": 0,
        "difficulty": 1,
        "position": {"x": 900, "y": 200},
        "connections": []
      }
    ]
  }'::jsonb,
  true
);

-- 12. 創建視圖
CREATE OR REPLACE VIEW learning_path_summary AS
SELECT 
  lp.id,
  lp.name,
  lp.description,
  lp.tree_id,
  gt.tree_name,
  lp.total_duration,
  lp.difficulty,
  lp.tags,
  lp.is_active,
  COUNT(ln.id) as node_count,
  COUNT(slp.id) as active_students,
  lp.created_at,
  lp.updated_at
FROM hanami_learning_paths lp
LEFT JOIN hanami_growth_trees gt ON lp.tree_id = gt.id
LEFT JOIN hanami_learning_nodes ln ON lp.id = ln.path_id
LEFT JOIN hanami_student_learning_progress slp ON lp.id = slp.path_id AND slp.is_active = true
GROUP BY lp.id, lp.name, lp.description, lp.tree_id, gt.tree_name, lp.total_duration, lp.difficulty, lp.tags, lp.is_active, lp.created_at, lp.updated_at;

-- 完成遷移
COMMENT ON TABLE hanami_learning_paths IS '學習路線主表';
COMMENT ON TABLE hanami_learning_nodes IS '學習節點表';
COMMENT ON TABLE hanami_student_learning_progress IS '學生學習進度表';
COMMENT ON TABLE hanami_node_completion_records IS '節點完成記錄表';
COMMENT ON TABLE hanami_learning_path_templates IS '學習路線模板表';

-- 輸出完成訊息
SELECT '學習路線系統資料庫遷移完成！' as message;

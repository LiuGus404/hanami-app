-- 創建 hanami_resource_templates 表
-- 這是資源庫系統的核心表

CREATE TABLE IF NOT EXISTS public.hanami_resource_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL CHECK (template_type IN ('lesson_plan', 'storybook', 'game', 'training', 'custom')),
  template_description TEXT,
  template_schema JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT hanami_resource_templates_pkey PRIMARY KEY (id)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_resource_templates_type ON public.hanami_resource_templates (template_type);
CREATE INDEX IF NOT EXISTS idx_resource_templates_active ON public.hanami_resource_templates (is_active);
CREATE INDEX IF NOT EXISTS idx_resource_templates_created_at ON public.hanami_resource_templates (created_at);

-- 創建更新時間觸發器
CREATE TRIGGER update_resource_templates_updated_at
  BEFORE UPDATE ON hanami_resource_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入預設範本資料
INSERT INTO public.hanami_resource_templates (template_name, template_type, template_description, template_schema)
VALUES
  ('標準教案範本', 'lesson_plan', '適用於一般音樂教學的標準教案格式', '{
    "fields": [
      {"id": "title", "label": "教學目標", "type": "text", "required": true, "placeholder": "請輸入本堂課的教學目標"},
      {"id": "description", "label": "教學重點", "type": "text", "required": true, "placeholder": "請輸入本堂課的教學重點"},
      {"id": "steps", "label": "教學步驟", "type": "array", "required": true, "placeholder": "請輸入教學步驟"},
      {"id": "evaluation", "label": "評估方式", "type": "text", "required": false, "placeholder": "請輸入評估方式"},
      {"id": "notes", "label": "注意事項", "type": "text", "required": false, "placeholder": "請輸入注意事項"},
      {"id": "materials", "label": "所需道具", "type": "array", "required": false, "placeholder": "請輸入所需道具"}
    ],
    "metadata": {
      "version": "1.0",
      "author": "Hanami System",
      "last_updated": "2024-12-19"
    }
  }'::jsonb),
  
  ('遊戲活動範本', 'game', '適用於音樂遊戲活動的範本', '{
    "fields": [
      {"id": "game_objective", "label": "遊戲目標", "type": "text", "required": true, "placeholder": "請輸入遊戲目標"},
      {"id": "game_rules", "label": "遊戲規則", "type": "text", "required": true, "placeholder": "請輸入遊戲規則"},
      {"id": "materials", "label": "所需道具", "type": "array", "required": false, "placeholder": "請輸入所需道具"},
      {"id": "game_flow", "label": "遊戲流程", "type": "array", "required": true, "placeholder": "請輸入遊戲流程"},
      {"id": "variations", "label": "變體玩法", "type": "text", "required": false, "placeholder": "請輸入變體玩法"},
      {"id": "age_range", "label": "適合年齡", "type": "text", "required": false, "placeholder": "請輸入適合年齡"},
      {"id": "duration", "label": "遊戲時間", "type": "text", "required": false, "placeholder": "請輸入遊戲時間"}
    ],
    "metadata": {
      "version": "1.0",
      "author": "Hanami System",
      "last_updated": "2024-12-19"
    }
  }'::jsonb),
  
  ('繪本教學範本', 'storybook', '適用於繪本音樂教學的範本', '{
    "fields": [
      {"id": "book_info", "label": "繪本資訊", "type": "text", "required": true, "placeholder": "請輸入繪本資訊"},
      {"id": "music_elements", "label": "音樂元素", "type": "array", "required": true, "placeholder": "請輸入音樂元素"},
      {"id": "teaching_focus", "label": "教學重點", "type": "text", "required": true, "placeholder": "請輸入教學重點"},
      {"id": "interactions", "label": "互動環節", "type": "array", "required": false, "placeholder": "請輸入互動環節"},
      {"id": "extensions", "label": "延伸活動", "type": "text", "required": false, "placeholder": "請輸入延伸活動"},
      {"id": "story_background", "label": "故事背景", "type": "text", "required": false, "placeholder": "請輸入故事背景"}
    ],
    "metadata": {
      "version": "1.0",
      "author": "Hanami System",
      "last_updated": "2024-12-19"
    }
  }'::jsonb),
  
  ('訓練活動範本', 'training', '適用於音樂技能訓練的範本', '{
    "fields": [
      {"id": "training_objective", "label": "訓練目標", "type": "text", "required": true, "placeholder": "請輸入訓練目標"},
      {"id": "training_content", "label": "訓練內容", "type": "text", "required": true, "placeholder": "請輸入訓練內容"},
      {"id": "training_steps", "label": "訓練步驟", "type": "array", "required": true, "placeholder": "請輸入訓練步驟"},
      {"id": "difficulty", "label": "難度等級", "type": "select", "required": true, "options": ["初級", "中級", "高級"]},
      {"id": "duration", "label": "訓練時間", "type": "text", "required": false, "placeholder": "請輸入訓練時間"},
      {"id": "notes", "label": "注意事項", "type": "text", "required": false, "placeholder": "請輸入注意事項"}
    ],
    "metadata": {
      "version": "1.0",
      "author": "Hanami System",
      "last_updated": "2024-12-19"
    }
  }'::jsonb)
ON CONFLICT (template_name) DO NOTHING;

-- 確認表創建成功
SELECT 'hanami_resource_templates table created successfully' as status; 
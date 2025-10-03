-- ============================================
-- Hanami_CourseTypes 資料表擴展
-- 添加更多課程相關欄位
-- ============================================

-- 1. 添加新欄位到現有資料表
ALTER TABLE public."Hanami_CourseTypes"
ADD COLUMN IF NOT EXISTS age_range TEXT,              -- 適合年齡範圍，例如："3-5歲"
ADD COLUMN IF NOT EXISTS description TEXT,             -- 課程描述
ADD COLUMN IF NOT EXISTS min_age INTEGER,              -- 最小年齡（月份）
ADD COLUMN IF NOT EXISTS max_age INTEGER,              -- 最大年齡（月份）
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 45,  -- 課程時長（分鐘）
ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 6,       -- 最多學生數
ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'beginner', -- 難度等級
ADD COLUMN IF NOT EXISTS color_code TEXT DEFAULT 'from-pink-400 to-rose-400', -- 顯示顏色
ADD COLUMN IF NOT EXISTS icon_type TEXT DEFAULT 'sparkles', -- 圖標類型
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,  -- 顯示順序
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false, -- 是否為精選課程
ADD COLUMN IF NOT EXISTS prerequisites TEXT,           -- 先修要求
ADD COLUMN IF NOT EXISTS learning_objectives TEXT[],   -- 學習目標（陣列）
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); -- 更新時間

-- 2. 添加註釋說明
COMMENT ON COLUMN public."Hanami_CourseTypes".age_range IS '適合年齡範圍文字描述，例如：3-5歲';
COMMENT ON COLUMN public."Hanami_CourseTypes".description IS '課程詳細描述';
COMMENT ON COLUMN public."Hanami_CourseTypes".min_age IS '最小適合年齡（以月份計算）';
COMMENT ON COLUMN public."Hanami_CourseTypes".max_age IS '最大適合年齡（以月份計算）';
COMMENT ON COLUMN public."Hanami_CourseTypes".duration_minutes IS '單堂課程時長（分鐘）';
COMMENT ON COLUMN public."Hanami_CourseTypes".max_students IS '每班最多學生人數';
COMMENT ON COLUMN public."Hanami_CourseTypes".difficulty_level IS '難度等級：beginner, intermediate, advanced';
COMMENT ON COLUMN public."Hanami_CourseTypes".color_code IS 'Tailwind CSS 漸層顏色類名';
COMMENT ON COLUMN public."Hanami_CourseTypes".icon_type IS '圖標類型：sparkles, musical-note, piano, guitar 等';
COMMENT ON COLUMN public."Hanami_CourseTypes".display_order IS '顯示順序，數字越小越靠前';
COMMENT ON COLUMN public."Hanami_CourseTypes".is_featured IS '是否為精選推薦課程';
COMMENT ON COLUMN public."Hanami_CourseTypes".prerequisites IS '先修課程或要求';
COMMENT ON COLUMN public."Hanami_CourseTypes".learning_objectives IS '學習目標清單';

-- 3. 創建更新時間的觸發器
CREATE OR REPLACE FUNCTION update_hanami_course_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_hanami_course_types_updated_at ON public."Hanami_CourseTypes";

CREATE TRIGGER trigger_update_hanami_course_types_updated_at
BEFORE UPDATE ON public."Hanami_CourseTypes"
FOR EACH ROW
EXECUTE FUNCTION update_hanami_course_types_updated_at();

-- 4. 插入範例資料
INSERT INTO public."Hanami_CourseTypes" (
  name, 
  status, 
  trial_limit, 
  price_per_lesson,
  age_range,
  description,
  min_age,
  max_age,
  duration_minutes,
  max_students,
  difficulty_level,
  color_code,
  icon_type,
  display_order,
  is_featured,
  prerequisites,
  learning_objectives
) VALUES 
(
  '音樂啟蒙課程',
  true,
  1,
  168.00,
  '15個月-3歲',
  '透過音樂遊戲、節奏訓練和樂器探索，培養孩子對音樂的興趣和基本音樂感知能力。適合剛接觸音樂的幼兒。',
  15,  -- 15個月
  36,  -- 3歲
  45,
  6,
  'beginner',
  'from-pink-400 to-rose-400',
  'sparkles',
  1,
  true,
  '無需先修課程',
  ARRAY['培養音樂興趣', '基礎節奏感', '聽覺發展', '肢體協調']
),
(
  '鋼琴基礎課程',
  true,
  1,
  200.00,
  '3-5歲',
  '學習基本鋼琴技巧，包括手型、音階和簡單曲目。採用互動教學法，讓孩子在遊戲中學習音樂。',
  36,  -- 3歲
  60,  -- 5歲
  45,
  4,
  'beginner',
  'from-purple-400 to-indigo-400',
  'musical-note',
  2,
  true,
  '完成音樂啟蒙課程或具備基本音樂概念',
  ARRAY['認識鍵盤', '基礎手型', '讀譜能力', '演奏簡單曲目']
),
(
  '鋼琴進階課程',
  true,
  1,
  250.00,
  '5歲以上',
  '深入學習鋼琴演奏技巧，包括樂理、音樂表達和考試準備。適合有一定基礎的學生。',
  60,  -- 5歲
  216, -- 18歲
  60,
  4,
  'intermediate',
  'from-blue-400 to-cyan-400',
  'musical-note',
  3,
  false,
  '完成鋼琴基礎課程或通過入學評估',
  ARRAY['進階演奏技巧', '音樂理論', '表演能力', '考試準備']
),
(
  '奧福音樂課程',
  true,
  1,
  180.00,
  '3-6歲',
  '採用奧福教學法，結合歌唱、舞蹈、樂器演奏和即興創作，全方位培養音樂素養。',
  36,  -- 3歲
  72,  -- 6歲
  45,
  8,
  'beginner',
  'from-green-400 to-emerald-400',
  'sparkles',
  4,
  true,
  '無需先修課程',
  ARRAY['節奏訓練', '音感培養', '創造力發展', '團隊合作']
),
(
  '小提琴入門課程',
  true,
  1,
  220.00,
  '4-7歲',
  '學習小提琴基本持弓和姿勢，培養音準和音色控制能力。小班教學，個別指導。',
  48,  -- 4歲
  84,  -- 7歲
  45,
  4,
  'beginner',
  'from-yellow-400 to-orange-400',
  'musical-note',
  5,
  false,
  '無需先修課程',
  ARRAY['正確持琴姿勢', '基礎運弓技巧', '音準訓練', '簡單曲目演奏']
),
(
  '音樂創作課程',
  true,
  1,
  280.00,
  '8歲以上',
  '學習音樂創作、編曲和數位音樂製作。培養創造力和音樂表達能力。',
  96,  -- 8歲
  216, -- 18歲
  60,
  6,
  'advanced',
  'from-red-400 to-pink-400',
  'sparkles',
  6,
  true,
  '具備基礎樂理知識和至少一種樂器演奏能力',
  ARRAY['作曲技巧', '和聲編排', '數位製作', '創意表達']
)
ON CONFLICT (id) DO NOTHING;

-- 5. 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_hanami_course_types_status 
ON public."Hanami_CourseTypes"(status);

CREATE INDEX IF NOT EXISTS idx_hanami_course_types_display_order 
ON public."Hanami_CourseTypes"(display_order);

CREATE INDEX IF NOT EXISTS idx_hanami_course_types_is_featured 
ON public."Hanami_CourseTypes"(is_featured);

CREATE INDEX IF NOT EXISTS idx_hanami_course_types_age_range 
ON public."Hanami_CourseTypes"(min_age, max_age);

-- 6. 創建視圖方便查詢啟用的課程
CREATE OR REPLACE VIEW public.vw_active_courses AS
SELECT 
  id,
  name,
  age_range,
  description,
  min_age,
  max_age,
  duration_minutes,
  max_students,
  difficulty_level,
  trial_limit,
  price_per_lesson,
  color_code,
  icon_type,
  display_order,
  is_featured,
  prerequisites,
  learning_objectives,
  created_at,
  updated_at
FROM public."Hanami_CourseTypes"
WHERE status = true
ORDER BY display_order ASC, created_at ASC;

-- 完成！
SELECT 'Hanami_CourseTypes 資料表更新完成！' AS message;







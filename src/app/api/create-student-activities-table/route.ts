import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 由於 Supabase 的限制，我們無法直接通過 API 創建表
    // 這裡我們提供 SQL 腳本和說明
    
    const sqlScript = `
-- 請在 Supabase SQL 編輯器中執行以下腳本

-- 1. 創建學生活動表
CREATE TABLE IF NOT EXISTS public.hanami_student_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  tree_id UUID REFERENCES hanami_growth_trees(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES hanami_teaching_activities(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'ongoing' CHECK (activity_type IN ('lesson', 'ongoing')),
  lesson_date DATE,
  timeslot TEXT,
  completion_status TEXT DEFAULT 'not_started' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER DEFAULT 0,
  teacher_notes TEXT,
  student_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 創建索引
CREATE INDEX IF NOT EXISTS idx_student_activities_student_id ON hanami_student_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_tree_id ON hanami_student_activities(tree_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_activity_id ON hanami_student_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_lesson_date ON hanami_student_activities(lesson_date);
CREATE INDEX IF NOT EXISTS idx_student_activities_completion_status ON hanami_student_activities(completion_status);

-- 3. 創建觸發器函數
CREATE OR REPLACE FUNCTION update_student_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 創建觸發器
DROP TRIGGER IF EXISTS update_student_activities_updated_at ON hanami_student_activities;
CREATE TRIGGER update_student_activities_updated_at
  BEFORE UPDATE ON hanami_student_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_student_activities_updated_at();

-- 5. 啟用 RLS
ALTER TABLE hanami_student_activities ENABLE ROW LEVEL SECURITY;

-- 6. 創建策略（允許所有操作）
DROP POLICY IF EXISTS "Allow all operations on hanami_student_activities" ON hanami_student_activities;
CREATE POLICY "Allow all operations on hanami_student_activities" ON hanami_student_activities
  FOR ALL USING (true);

-- 7. 插入一些測試數據（可選）
INSERT INTO hanami_student_activities (student_id, activity_id, activity_type, completion_status)
SELECT 
  s.id as student_id,
  ta.id as activity_id,
  'ongoing' as activity_type,
  'not_started' as completion_status
FROM "Hanami_Students" s
CROSS JOIN hanami_teaching_activities ta
WHERE s.student_type = 'regular'
  AND ta.is_active = true
LIMIT 10;
    `;

    return NextResponse.json({
      success: true,
      message: '請按照以下步驟創建表',
      instructions: [
        '1. 登入您的 Supabase 項目',
        '2. 進入 SQL 編輯器',
        '3. 複製並執行以下 SQL 腳本',
        '4. 執行完成後刷新頁面測試功能'
      ],
      sqlScript: sqlScript
    });

  } catch (error) {
    console.error('創建表失敗:', error);
    return NextResponse.json(
      { success: false, error: '創建表失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

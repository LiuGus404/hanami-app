import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 直接嘗試查詢表來檢查是否存在
    const { data: testData, error: checkError } = await supabase
      .from('hanami_student_activities' as any)
      .select('id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: '表已存在'
      });
    }

    // 如果表不存在，我們需要手動在 Supabase 中創建
    // 這裡我們返回一個提示信息
    return NextResponse.json({
      success: false,
      error: '需要手動創建表',
      message: '請在 Supabase SQL 編輯器中執行以下 SQL：',
      sql: `
-- 創建學生活動表
CREATE TABLE IF NOT EXISTS public.hanami_student_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  tree_id UUID REFERENCES hanami_growth_trees(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES hanami_teaching_activities(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('lesson', 'ongoing')),
  lesson_date DATE,
  timeslot TEXT,
  completion_status TEXT DEFAULT 'not_started' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER,
  teacher_notes TEXT,
  student_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_student_activities_student_id ON hanami_student_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_tree_id ON hanami_student_activities(tree_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_activity_id ON hanami_student_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_lesson_date ON hanami_student_activities(lesson_date);
CREATE INDEX IF NOT EXISTS idx_student_activities_completion_status ON hanami_student_activities(completion_status);

-- 創建觸發器函數
CREATE OR REPLACE FUNCTION update_student_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
CREATE TRIGGER update_student_activities_updated_at
  BEFORE UPDATE ON hanami_student_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_student_activities_updated_at();

-- 啟用 RLS
ALTER TABLE hanami_student_activities ENABLE ROW LEVEL SECURITY;

-- 創建策略
CREATE POLICY "Allow all operations on hanami_student_activities" ON hanami_student_activities
  FOR ALL USING (true);
      `
    });

  } catch (error) {
    console.error('檢查資料庫失敗:', error);
    return NextResponse.json(
      { success: false, error: '檢查資料庫失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

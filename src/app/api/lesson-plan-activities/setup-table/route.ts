import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 檢查表是否已存在
    const { data: tableCheck, error: checkError } = await supabase
      .from('hanami_lesson_plan_activities' as any)
      .select('id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: '班別活動分配表已存在',
        tableExists: true
      });
    }

    // 如果表不存在，提供手動創建的說明
    if ((checkError as any).code === '42P01') {
      return NextResponse.json({
        success: false,
        message: '資料表不存在，需要手動創建',
        instructions: `
請按照以下步驟創建資料表：

1. 前往 Supabase Dashboard
2. 點擊左側選單的 "SQL Editor"
3. 複製以下 SQL 腳本並執行：

-- 創建班別活動分配表
CREATE TABLE IF NOT EXISTS hanami_lesson_plan_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_date DATE NOT NULL,
  timeslot TEXT NOT NULL,
  course_type TEXT NOT NULL,
  activity_id UUID NOT NULL REFERENCES hanami_tree_activities(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('class_activity', 'individual_activity')),
  student_id UUID REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
  assigned_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_lesson_date ON hanami_lesson_plan_activities(lesson_date);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_timeslot ON hanami_lesson_plan_activities(timeslot);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_course_type ON hanami_lesson_plan_activities(course_type);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_activity_type ON hanami_lesson_plan_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_student_id ON hanami_lesson_plan_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_lesson_timeslot_course ON hanami_lesson_plan_activities(lesson_date, timeslot, course_type);

-- 創建唯一約束
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_class_activity ON hanami_lesson_plan_activities(lesson_date, timeslot, course_type, activity_id) 
WHERE activity_type = 'class_activity';

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_individual_activity ON hanami_lesson_plan_activities(lesson_date, timeslot, course_type, activity_id, student_id) 
WHERE activity_type = 'individual_activity';

-- 創建觸發器
CREATE OR REPLACE FUNCTION update_lesson_plan_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lesson_plan_activities_updated_at ON hanami_lesson_plan_activities;
CREATE TRIGGER trigger_update_lesson_plan_activities_updated_at
  BEFORE UPDATE ON hanami_lesson_plan_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_plan_activities_updated_at();

-- 停用 RLS
ALTER TABLE hanami_lesson_plan_activities DISABLE ROW LEVEL SECURITY;

4. 執行完成後，返回此頁面點擊 "檢查資料表狀態" 按鈕
        `,
        tableExists: false
      });
    }

    return NextResponse.json({
      success: false,
      message: '檢查資料表時發生錯誤',
      error: String(checkError),
      instructions: '請檢查 Supabase 連接狀態'
    });

  } catch (error) {
    console.error('Error in setup table API:', error);
    return NextResponse.json(
      { 
        error: '內部服務器錯誤',
        details: String(error),
        instructions: '請手動執行 database/lesson_plan_activities_table.sql 中的SQL腳本'
      },
      { status: 500 }
    );
  }
} 
 
 
 

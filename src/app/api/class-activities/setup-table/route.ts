import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 創建學生課堂活動分配表
    const { error: createTableError } = await (supabase as any)
      .rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS hanami_student_lesson_activities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            lesson_id UUID REFERENCES hanami_student_lesson(id) ON DELETE CASCADE,
            student_id UUID REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
            tree_activity_id UUID REFERENCES hanami_tree_activities(id) ON DELETE CASCADE,
            assigned_by TEXT,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completion_status TEXT DEFAULT 'not_started' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'skipped')),
            performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
            student_notes TEXT,
            teacher_notes TEXT,
            time_spent INTEGER DEFAULT 0,
            attempts_count INTEGER DEFAULT 0,
            is_favorite BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            UNIQUE(lesson_id, student_id, tree_activity_id)
          );
        `
      });

    if (createTableError) {
      console.error('創建表失敗:', createTableError);
      return NextResponse.json(
        { error: '創建表失敗', details: createTableError.message },
        { status: 500 }
      );
    }

    // 創建索引
    const { error: createIndexError } = await (supabase as any)
      .rpc('exec_sql', {
        sql_query: `
          CREATE INDEX IF NOT EXISTS idx_student_lesson_activities_lesson_id ON hanami_student_lesson_activities(lesson_id);
          CREATE INDEX IF NOT EXISTS idx_student_lesson_activities_student_id ON hanami_student_lesson_activities(student_id);
          CREATE INDEX IF NOT EXISTS idx_student_lesson_activities_tree_activity_id ON hanami_student_lesson_activities(tree_activity_id);
          CREATE INDEX IF NOT EXISTS idx_student_lesson_activities_completion_status ON hanami_student_lesson_activities(completion_status);
          CREATE INDEX IF NOT EXISTS idx_student_lesson_activities_assigned_at ON hanami_student_lesson_activities(assigned_at);
        `
      });

    if (createIndexError) {
      console.error('創建索引失敗:', createIndexError);
      return NextResponse.json(
        { error: '創建索引失敗', details: createIndexError.message },
        { status: 500 }
      );
    }

    // 添加 RLS 政策
    const { error: rlsError } = await (supabase as any)
      .rpc('exec_sql', {
        sql_query: `
          ALTER TABLE hanami_student_lesson_activities ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Allow authenticated read access" ON hanami_student_lesson_activities
          FOR SELECT USING (auth.role() = 'authenticated');
          
          CREATE POLICY "Allow authenticated insert access" ON hanami_student_lesson_activities
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
          
          CREATE POLICY "Allow authenticated update access" ON hanami_student_lesson_activities
          FOR UPDATE USING (auth.role() = 'authenticated');
          
          CREATE POLICY "Allow authenticated delete access" ON hanami_student_lesson_activities
          FOR DELETE USING (auth.role() = 'authenticated');
        `
      });

    if (rlsError) {
      console.error('設置 RLS 政策失敗:', rlsError);
      return NextResponse.json(
        { error: '設置 RLS 政策失敗', details: rlsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '學生課堂活動分配表創建成功'
    });

  } catch (error) {
    console.error('設置學生課堂活動分配表失敗:', error);
    return NextResponse.json(
      { error: '設置學生課堂活動分配表失敗' },
      { status: 500 }
    );
  }
} 
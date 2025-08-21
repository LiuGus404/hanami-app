import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 創建學生課堂活動分配表
    const { error: createTableError } = await (supabase as any)
      .from('hanami_student_lesson_activities')
      .select('id')
      .limit(1);

    if (createTableError && createTableError.message.includes('relation "hanami_student_lesson_activities" does not exist')) {
      console.log('表不存在，需要創建');
      // 由於無法直接執行 DDL，我們將返回一個提示
      return NextResponse.json({
        success: false,
        message: '需要手動創建 hanami_student_lesson_activities 表',
        sql: `
          CREATE TABLE IF NOT EXISTS hanami_student_lesson_activities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            lesson_id UUID NOT NULL REFERENCES hanami_student_lesson(id) ON DELETE CASCADE,
            student_id UUID NOT NULL REFERENCES "Hanami_Students"(id) ON DELETE CASCADE,
            tree_activity_id UUID NOT NULL REFERENCES hanami_tree_activities(id) ON DELETE CASCADE,
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
    }

    if (createTableError) {
      console.error('檢查表失敗:', createTableError);
      return NextResponse.json(
        { error: '檢查表失敗', details: createTableError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '學生活動表已存在'
    });

  } catch (error) {
    console.error('設置學生活動表失敗:', error);
    return NextResponse.json(
      { error: '設置學生活動表失敗' },
      { status: 500 }
    );
  }
} 
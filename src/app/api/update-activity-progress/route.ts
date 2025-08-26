import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { activityId, progress } = await request.json();

    if (!activityId) {
      return NextResponse.json(
        { success: false, error: '活動 ID 是必需的' },
        { status: 400 }
      );
    }

    if (progress === undefined || progress < 0 || progress > 100) {
      return NextResponse.json(
        { success: false, error: '進度必須在 0-100 之間' },
        { status: 400 }
      );
    }

    // 更新活動進度
    const { data, error } = await supabase
      .from('hanami_student_activities' as any)
      .update({
        progress: progress,
        completion_status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
        updated_at: new Date().toISOString()
      })
      .eq('id', activityId)
      .select()
      .single();

    if (error) {
      console.error('更新活動進度失敗:', error);
      return NextResponse.json(
        { success: false, error: '更新活動進度失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: '進度更新成功'
    });

  } catch (error) {
    console.error('更新活動進度錯誤:', error);
    return NextResponse.json(
      { success: false, error: '更新活動進度失敗', details: (error as Error).message },
      { status: 500 }
    );
  }
}

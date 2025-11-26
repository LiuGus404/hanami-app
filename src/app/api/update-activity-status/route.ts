import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const { activityId, status } = await request.json();

    if (!activityId || !status) {
      return NextResponse.json(
        { success: false, error: '缺少活動ID或狀態' },
        { status: 400 }
      );
    }

    console.log('嘗試更新活動狀態:', { activityId, status });

    // 驗證狀態值
    const validStatuses = ['completed', 'in_progress', 'not_started', 'skipped'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '無效的狀態值' },
        { status: 400 }
      );
    }

    // 檢查活動是否存在於 hanami_student_activities 表
    const { data: existingActivity, error: checkError } = await supabase
      .from('hanami_student_activities' as any)
      .select('id')
      .eq('id', activityId)
      .single();

    if (checkError) {
      console.error('檢查活動存在性失敗:', checkError);
      return NextResponse.json(
        { success: false, error: '活動不存在', details: checkError.message },
        { status: 404 }
      );
    }

    if (!existingActivity) {
      return NextResponse.json(
        { success: false, error: '活動不存在' },
        { status: 404 }
      );
    }

    // 更新活動狀態
    const { error } = await (supabase
      .from('hanami_student_activities') as any)
      .update({ 
        completion_status: status,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', activityId);

    if (error) {
      console.error('更新活動狀態失敗:', error);
      return NextResponse.json(
        { success: false, error: '更新活動狀態失敗', details: (error as any).message || String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '活動狀態更新成功'
    });

  } catch (error) {
    console.error('更新活動狀態失敗:', error);
    return NextResponse.json(
      { success: false, error: '更新活動狀態失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const { activityId, progress } = await request.json();

    if (!activityId || progress === undefined) {
      return NextResponse.json(
        { success: false, error: '缺少活動ID或進度值' },
        { status: 400 }
      );
    }

    console.log('嘗試更新活動進度:', { activityId, progress });

    // 驗證進度值
    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        { success: false, error: '進度值必須在 0-100 之間' },
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

    // 根據進度值自動設定完成狀態
    let completionStatus = 'not_started';
    if (progress === 100) {
      completionStatus = 'completed';
    } else if (progress > 0) {
      completionStatus = 'in_progress';
    }

    // 更新活動進度和狀態
    const { error } = await supabase
      .from('hanami_student_activities' as any)
      .update({ 
        progress: progress,
        completion_status: completionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', activityId);

    if (error) {
      console.error('更新活動進度失敗:', error);
      return NextResponse.json(
        { success: false, error: '更新活動進度失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '活動進度更新成功',
      data: {
        progress,
        completionStatus
      }
    });

  } catch (error) {
    console.error('更新活動進度失敗:', error);
    return NextResponse.json(
      { success: false, error: '更新活動進度失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

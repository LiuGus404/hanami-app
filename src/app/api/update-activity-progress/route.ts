import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 共享的更新活動進度邏輯
async function updateActivityProgress(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 API 收到請求 body:', body);
    
    const { activityId, progress } = body;

    if (!activityId) {
      console.error('❌ 缺少活動 ID');
      return NextResponse.json(
        { success: false, error: '活動 ID 是必需的' },
        { status: 400 }
      );
    }

    if (progress === undefined || progress < 0 || progress > 100) {
      console.error('❌ 進度值無效:', progress);
      return NextResponse.json(
        { success: false, error: '進度必須在 0-100 之間' },
        { status: 400 }
      );
    }

    console.log('✅ 請求驗證通過，準備更新資料庫:', { activityId, progress });

    // 更新活動進度 - 使用正確的表名
    console.log('📊 開始更新資料庫...');
    const { data, error } = await supabase
      .from('hanami_student_lesson_activities' as any)
      .update({
        performance_rating: Math.round(progress / 20), // 將 0-100 轉換為 1-5 評分
        completion_status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
        updated_at: new Date().toISOString()
      })
      .eq('id', activityId)
      .select()
      .single();

    if (error) {
      console.error('❌ 資料庫更新失敗:', error);
      return NextResponse.json(
        { success: false, error: '更新活動進度失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ 資料庫更新成功:', data);
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

export async function POST(request: NextRequest) {
  return updateActivityProgress(request);
}

export async function PUT(request: NextRequest) {
  return updateActivityProgress(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const { activityId } = await request.json();

    if (!activityId) {
      return NextResponse.json(
        { success: false, error: '缺少活動ID' },
        { status: 400 }
      );
    }

    console.log('嘗試移除活動ID:', activityId);

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

    // 移除單個學生活動
    const { error } = await supabase
      .from('hanami_student_activities' as any)
      .delete()
      .eq('id', activityId);

    if (error) {
      console.error('移除單個學生活動失敗:', error);
      return NextResponse.json(
        { success: false, error: '移除學生活動失敗', details: (error as any).message || String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '學生活動移除成功'
    });

  } catch (error) {
    console.error('移除單個學生活動失敗:', error);
    return NextResponse.json(
      { success: false, error: '移除學生活動失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

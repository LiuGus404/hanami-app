import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const { studentId, activityType, lessonDate, timeslot } = await request.json();

    if (!studentId || !activityType) {
      return NextResponse.json(
        { success: false, error: '缺少學生ID或活動類型' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('hanami_student_activities' as any)
      .delete()
      .eq('student_id', studentId);

    // 根據活動類型添加不同的條件
    if (activityType === 'current_lesson') {
      // 移除本次課堂活動
      if (lessonDate && timeslot) {
        query = query
          .eq('lesson_date', lessonDate)
          .eq('timeslot', timeslot);
      }
    } else if (activityType === 'ongoing') {
      // 移除正在學習的活動（沒有特定課堂日期的活動）
      query = query.is('lesson_date', null);
    }

    const { error } = await query;

    if (error) {
      console.error('移除學生活動失敗:', error);
      return NextResponse.json(
        { success: false, error: '移除學生活動失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '學生活動移除成功'
    });

  } catch (error) {
    console.error('移除學生活動失敗:', error);
    return NextResponse.json(
      { success: false, error: '移除學生活動失敗' },
      { status: 500 }
    );
  }
}

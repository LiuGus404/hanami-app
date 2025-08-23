import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const { studentId, treeId } = await request.json();

    if (!studentId || !treeId) {
      return NextResponse.json(
        { success: false, error: '缺少學生ID或成長樹ID' },
        { status: 400 }
      );
    }

    // 移除學生成長樹分配
    const { error: assignmentError } = await supabase
      .from('hanami_student_trees')
      .delete()
      .eq('student_id', studentId)
      .eq('tree_id', treeId);

    if (assignmentError) {
      console.error('移除學生成長樹分配失敗:', assignmentError);
      return NextResponse.json(
        { success: false, error: '移除學生成長樹分配失敗' },
        { status: 500 }
      );
    }

    // 移除相關的學生活動分配
    const { error: activityError } = await supabase
      .from('hanami_student_activities' as any)
      .delete()
      .eq('student_id', studentId)
      .eq('tree_id', treeId);

    if (activityError) {
      console.error('移除相關活動分配失敗:', activityError);
      // 不返回錯誤，因為主要操作（移除成長樹）已經成功
    }

    return NextResponse.json({
      success: true,
      message: '成長樹移除成功'
    });

  } catch (error) {
    console.error('移除學生成長樹失敗:', error);
    return NextResponse.json(
      { success: false, error: '移除學生成長樹失敗' },
      { status: 500 }
    );
  }
}

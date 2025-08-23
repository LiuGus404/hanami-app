import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: '缺少學生ID參數' },
        { status: 400 }
      );
    }

    // 查詢學生的成長樹
    const { data: studentTrees, error } = await supabase
      .from('hanami_student_trees')
      .select(`
        *,
        hanami_growth_trees (
          id,
          tree_name,
          tree_description,
          tree_level,
          course_type_id
        )
      `)
      .eq('student_id', studentId);

    if (error) {
      console.error('查詢學生成長樹失敗:', error);
      return NextResponse.json(
        { success: false, error: '查詢學生成長樹失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: studentTrees || []
    });

  } catch (error) {
    console.error('獲取學生成長樹失敗:', error);
    return NextResponse.json(
      { success: false, error: '獲取學生成長樹失敗' },
      { status: 500 }
    );
  }
}

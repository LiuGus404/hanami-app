import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 查詢所有教師
    const { data: teachers, error } = await supabase
      .from('hanami_employee')
      .select('id, teacher_fullname, teacher_nickname, teacher_role')
      .order('teacher_fullname');

    if (error) {
      console.error('查詢教師失敗:', error);
      return NextResponse.json(
        { success: false, error: '查詢教師失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: teachers || []
    });

  } catch (error) {
    console.error('獲取教師失敗:', error);
    return NextResponse.json(
      { success: false, error: '獲取教師失敗' },
      { status: 500 }
    );
  }
}

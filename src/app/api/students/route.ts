import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('開始獲取學生數據...');
    
    // 獲取所有學生數據
    const { data: students, error } = await supabase
      .from('Hanami_Students')
      .select(`
        id,
        full_name,
        nick_name,
        student_age,
        gender,
        contact_number,
        student_email,
        parent_email,
        school,
        student_type,
        course_type,
        student_teacher,
        regular_weekday,
        regular_timeslot,
        started_date,
        created_at
      `)
      .order('full_name');

    if (error) {
      console.error('獲取學生數據錯誤:', error);
      return NextResponse.json({ error: '獲取學生數據失敗' }, { status: 500 });
    }

    console.log('成功獲取學生數據:', students?.length || 0, '個學生');

    return NextResponse.json({ 
      data: students || [],
      count: students?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API錯誤:', error);
    return NextResponse.json({ error: '內部服務器錯誤' }, { status: 500 });
  }
} 
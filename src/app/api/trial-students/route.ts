import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 獲取所有試堂學生數據
    const { data: trialStudents, error } = await supabase
      .from('hanami_trial_students')
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
        weekday,
        lesson_date,
        actual_timeslot,
        trial_status,
        created_at
      `)
      .order('full_name');

    if (error) {
      console.error('獲取試聽學生數據錯誤:', error);
      return NextResponse.json({ error: '獲取試聽學生數據失敗' }, { status: 500 });
    }

    return NextResponse.json(trialStudents || []);
  } catch (error) {
    console.error('API錯誤:', error);
    return NextResponse.json({ error: '內部服務器錯誤' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonDate = searchParams.get('lessonDate');
    const timeslot = searchParams.get('timeslot');
    const courseType = searchParams.get('courseType');

    console.log('Received parameters:', { lessonDate, timeslot, courseType });

    if (!lessonDate || !timeslot || !courseType) {
      console.error('Missing required parameters:', { lessonDate, timeslot, courseType });
      return NextResponse.json(
        { error: '缺少必要參數：lessonDate, timeslot, courseType' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    console.log('Fetching students for:', { lessonDate, timeslot, courseType });

    // 從 hanami_student_lesson 表獲取學生資料
    const { data: regularStudents, error: regularError } = await supabase
      .from('hanami_student_lesson')
      .select(`
        id,
        student_id,
        full_name,
        course_type,
        lesson_date,
        regular_timeslot,
        actual_timeslot,
        Hanami_Students!hanami_student_lesson_student_id_fkey (
          full_name,
          student_age,
          nick_name
        )
      `)
      .eq('lesson_date', lessonDate)
      .or(`regular_timeslot.eq.${timeslot},actual_timeslot.eq.${timeslot}`)
      .eq('course_type', courseType);

    if (regularError) {
      console.error('Error fetching regular students:', regularError);
      return NextResponse.json(
        { error: '獲取常規學生資料失敗' },
        { status: 500 }
      );
    }

    // 從 hanami_trial_students 表獲取試堂學生資料
    const { data: trialStudents, error: trialError } = await supabase
      .from('hanami_trial_students')
      .select('*')
      .eq('lesson_date', lessonDate)
      .or(`regular_timeslot.eq.${timeslot},actual_timeslot.eq.${timeslot}`)
      .eq('course_type', courseType);

    if (trialError) {
      console.error('Error fetching trial students:', trialError);
      return NextResponse.json(
        { error: '獲取試堂學生資料失敗' },
        { status: 500 }
      );
    }

    console.log('Regular students:', regularStudents);
    console.log('Trial students:', trialStudents);

    // 處理常規學生資料
    const processedRegularStudents = (regularStudents || []).map(student => ({
      id: student.student_id || student.id,
      name: student.Hanami_Students?.full_name || student.full_name || '未知學生',
      isTrial: false,
      age: student.Hanami_Students?.student_age || null,
      nickName: student.Hanami_Students?.nick_name || null,
    }));

    // 處理試堂學生資料
    const processedTrialStudents = (trialStudents || []).map(student => ({
      id: student.id,
      name: student.full_name || '未知學生',
      isTrial: true,
      age: student.student_age || null,
      nickName: student.nick_name || null,
    }));

    // 合併並去重
    const allStudents = [...processedRegularStudents, ...processedTrialStudents];
    const uniqueStudents = allStudents.filter((student, index, self) => 
      self.findIndex(s => s.id === student.id) === index
    );

    console.log('Final students:', uniqueStudents);

    return NextResponse.json({
      success: true,
      data: uniqueStudents,
    });

  } catch (error) {
    console.error('Error in class-students API:', error);
    return NextResponse.json(
      { error: '獲取課堂學生資料失敗' },
      { status: 500 }
    );
  }
} 
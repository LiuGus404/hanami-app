import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 創建 Supabase 客戶端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pendingStudentData, newStudentData, lessonCount } = body;

    console.log('🔍 開始創建新學生:', { pendingStudentData, newStudentData, lessonCount });

    if (!pendingStudentData) {
      return NextResponse.json({
        success: false,
        error: { message: '缺少待審核學生資料' }
      }, { status: 400 });
    }

    if (!newStudentData) {
      return NextResponse.json({
        success: false,
        error: { message: '缺少新學生資料' }
      }, { status: 400 });
    }

    // 使用表單數據創建新學生
    const studentData = {
      full_name: newStudentData.full_name,
      nick_name: newStudentData.nick_name,
      student_age: newStudentData.student_age,
      student_dob: newStudentData.student_dob,
      gender: newStudentData.gender,
      contact_number: newStudentData.contact_number,
      student_email: newStudentData.student_email,
      parent_email: newStudentData.parent_email,
      address: newStudentData.address,
      school: newStudentData.school,
      student_type: newStudentData.student_type || '常規',
      course_type: newStudentData.course_type,
      student_teacher: newStudentData.student_teacher,
      student_preference: newStudentData.student_preference,
      student_remarks: newStudentData.student_remarks,
      health_notes: newStudentData.health_notes,
      regular_weekday: newStudentData.regular_weekday,
      regular_timeslot: newStudentData.regular_timeslot,
      started_date: newStudentData.started_date,
      duration_months: newStudentData.duration_months,
      ongoing_lessons: newStudentData.ongoing_lessons,
      upcoming_lessons: newStudentData.upcoming_lessons,
      student_password: newStudentData.student_password,
      access_role: newStudentData.access_role || 'student',
      // 設置新學生的堂數
      approved_lesson_nonscheduled: lessonCount || 0,
      non_approved_lesson: 0,
      care_alert: false
    };

    console.log('🔍 新學生資料:', studentData);

    // 創建新學生
    const { data: newStudent, error: createError } = await supabase
      .from('Hanami_Students')
      .insert(studentData)
      .select()
      .single();

    if (createError) {
      console.error('❌ 創建新學生失敗:', createError);
      throw createError;
    }

    console.log('✅ 成功創建新學生:', newStudent);

    // 更新待審核學生狀態
    const { error: updateError } = await supabase
      .from('hanami_pending_students')
      .update({
        review_status: 'approved',
        reviewed_at: new Date().toISOString(),
        selected_regular_student_id: newStudent.id,
        selected_regular_student_name: newStudent.full_name
      })
      .eq('id', pendingStudentData.id);

    if (updateError) {
      console.error('❌ 更新待審核學生狀態失敗:', updateError);
      throw updateError;
    }

    console.log('✅ 成功更新待審核學生狀態');

    return NextResponse.json({
      success: true,
      data: {
        newStudent,
        message: `成功創建新學生 ${newStudent.full_name} 並新增 ${lessonCount} 堂課！`
      }
    });

  } catch (error) {
    console.error('❌ 創建新學生失敗:', error);
    return NextResponse.json({
      success: false,
      error: { 
        message: '創建新學生失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      }
    }, { status: 500 });
  }
}

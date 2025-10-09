import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: 開始查詢待審核學生...');
    
    // 使用服務角色 key 繞過 RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { data, error } = await supabase
      .from('hanami_pending_students')
      .select('*')
      .order('enrollment_date', { ascending: false });

    console.log('🔍 API: 查詢結果:', { data, error });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('❌ API: 查詢失敗:', error);
    return NextResponse.json({
      success: false,
      error: error,
      data: [],
      count: 0
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, status, reviewNotes, rejectionReason, selectedRegularStudentId, lessonCount } = body;
    
    console.log('🔍 API: 開始審核學生:', { studentId, status, selectedRegularStudentId, lessonCount });
    
    // 使用服務角色 key 繞過 RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const updateData: any = {
      review_status: status,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes || null
    };

    if (status === 'rejected') {
      updateData.rejection_reason = rejectionReason || null;
    }

    const { error } = await supabase
      .from('hanami_pending_students')
      .update(updateData)
      .eq('id', studentId);

    if (error) throw error;

    // 如果審核通過，處理相關邏輯
    if (status === 'approved') {
      // 如果有選擇的正式學生，將堂數加入到該學生的 approved_lesson_nonscheduled
      if (selectedRegularStudentId && lessonCount > 0) {
        console.log('🔍 更新正式學生的待安排堂數:', { selectedRegularStudentId, lessonCount });
        
        // 先獲取當前的待安排堂數
        const { data: currentStudent } = await supabase
          .from('Hanami_Students')
          .select('approved_lesson_nonscheduled')
          .eq('id', selectedRegularStudentId)
          .single();
        
        const currentLessons = (currentStudent as any)?.approved_lesson_nonscheduled || 0;
        const newLessons = currentLessons + lessonCount;
        
        const { error: updateError } = await supabase
          .from('Hanami_Students')
          .update({
            approved_lesson_nonscheduled: newLessons
          })
          .eq('id', selectedRegularStudentId);

        if (updateError) {
          console.error('❌ 更新正式學生堂數失敗:', updateError);
          throw updateError;
        }
        
        console.log('✅ 成功更新正式學生的待安排堂數');
      }
      
      // 將學生轉移到正式學生表
      await transferToRegularStudents(studentId, supabase);
    }

    return NextResponse.json({
      success: true,
      message: `學生審核${status === 'approved' ? '通過' : status === 'rejected' ? '拒絕' : '需要補充資料'}`
    });

  } catch (error) {
    console.error('❌ API: 審核失敗:', error);
    return NextResponse.json({
      success: false,
      error: error
    }, { status: 500 });
  }
}

// 轉移到正式學生表
async function transferToRegularStudents(studentId: string, supabase: any) {
  try {
    const { data: pendingStudent, error: fetchError } = await supabase
      .from('hanami_pending_students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (fetchError) throw fetchError;

    // 準備正式學生資料
    const regularStudentData = {
      student_oid: pendingStudent.student_oid,
      full_name: pendingStudent.full_name,
      nick_name: pendingStudent.nick_name,
      student_age: pendingStudent.student_age,
      student_dob: pendingStudent.student_dob,
      gender: pendingStudent.gender,
      contact_number: pendingStudent.contact_number,
      student_email: pendingStudent.student_email,
      parent_email: pendingStudent.parent_email,
      address: pendingStudent.address,
      school: pendingStudent.school,
      student_type: pendingStudent.student_type,
      course_type: pendingStudent.course_type,
      student_teacher: pendingStudent.student_teacher,
      student_preference: pendingStudent.student_preference,
      health_notes: pendingStudent.health_notes,
      regular_weekday: pendingStudent.regular_weekday,
      regular_timeslot: pendingStudent.regular_timeslot,
      started_date: pendingStudent.started_date,
      duration_months: pendingStudent.duration_months,
      ongoing_lessons: pendingStudent.ongoing_lessons,
      upcoming_lessons: pendingStudent.upcoming_lessons,
      student_password: pendingStudent.student_password,
      access_role: pendingStudent.access_role
    };

    // 插入到正式學生表
    const { error: insertError } = await supabase
      .from('Hanami_Students')
      .insert([regularStudentData]);

    if (insertError) throw insertError;

    // 創建課程包記錄
    if (pendingStudent.selected_plan_id && pendingStudent.package_lessons) {
      const { data: regularStudent, error: studentFetchError } = await supabase
        .from('Hanami_Students')
        .select('id')
        .eq('student_oid', pendingStudent.student_oid)
        .single();

      if (studentFetchError) throw studentFetchError;

      const packageData = {
        student_id: regularStudent.id,
        course_name: pendingStudent.course_type,
        package_type: pendingStudent.selected_plan_name || 'standard',
        total_lessons: pendingStudent.package_lessons,
        remaining_lessons: pendingStudent.package_lessons,
        lesson_duration: 45, // 預設45分鐘
        lesson_time: pendingStudent.regular_timeslot || '09:00:00',
        weekday: pendingStudent.regular_weekday?.toString() || '0',
        price: pendingStudent.package_price || 0,
        start_date: pendingStudent.started_date,
        status: 'active',
        full_name: pendingStudent.full_name,
        access_role: 'admin'
      };

      const { error: packageError } = await supabase
        .from('Hanami_Student_Package')
        .insert([packageData]);

      if (packageError) throw packageError;
    }

    console.log('✅ 成功轉移學生到正式學生表');
  } catch (error) {
    console.error('轉移學生失敗:', error);
    throw error;
  }
}

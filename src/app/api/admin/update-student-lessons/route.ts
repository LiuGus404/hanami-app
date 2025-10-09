import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regularStudentId, lessonCount, pendingStudentId } = body;
    
    console.log('🔍 API: 開始更新正式學生堂數並確認狀態:', { regularStudentId, lessonCount, pendingStudentId });
    
    if (!regularStudentId || lessonCount <= 0) {
      return NextResponse.json({
        success: false,
        error: { message: '缺少必要參數或堂數無效' }
      }, { status: 400 });
    }
    
    // 使用服務角色 key 繞過 RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 先獲取當前學生的堂數
    const { data: currentStudent, error: fetchError } = await supabase
      .from('Hanami_Students')
      .select('approved_lesson_nonscheduled')
      .eq('id', regularStudentId)
      .single();

    if (fetchError) {
      console.error('❌ 獲取學生資料失敗:', fetchError);
      throw fetchError;
    }

    // 計算新的堂數
    const currentLessons = currentStudent?.approved_lesson_nonscheduled || 0;
    const newLessonCount = currentLessons + lessonCount;

    console.log('🔍 堂數計算:', { currentLessons, lessonCount, newLessonCount });

    // 更新正式學生的待安排堂數
    const { error: updateError } = await supabase
      .from('Hanami_Students')
      .update({
        approved_lesson_nonscheduled: newLessonCount
      })
      .eq('id', regularStudentId);

    if (updateError) {
      console.error('❌ 更新正式學生堂數失敗:', updateError);
      throw updateError;
    }
    
    console.log('✅ 成功更新正式學生的待安排堂數');

    // 如果有待審核學生 ID，更新其狀態為 'confirmed'
    if (pendingStudentId) {
      console.log('🔍 更新待審核學生狀態為確認:', pendingStudentId);
      
      // 先獲取正式學生的姓名
      const { data: regularStudentData, error: fetchStudentError } = await supabase
        .from('Hanami_Students')
        .select('full_name')
        .eq('id', regularStudentId)
        .single();
      
      if (fetchStudentError) {
        console.error('❌ 獲取正式學生姓名失敗:', fetchStudentError);
        throw fetchStudentError;
      }
      
      const { error: statusUpdateError } = await supabase
        .from('hanami_pending_students')
        .update({
          review_status: 'approved',
          reviewed_at: new Date().toISOString(),
          selected_regular_student_id: regularStudentId,
          selected_regular_student_name: regularStudentData?.full_name || '未知學生'
        })
        .eq('id', pendingStudentId);

      if (statusUpdateError) {
        console.error('❌ 更新待審核學生狀態失敗:', statusUpdateError);
        throw statusUpdateError;
      }
      
      console.log('✅ 成功更新待審核學生狀態為確認');
    }

    return NextResponse.json({
      success: true,
      message: `成功為學生新增 ${lessonCount} 堂課並確認`
    });

  } catch (error) {
    console.error('❌ API: 更新堂數失敗:', error);
    return NextResponse.json({
      success: false,
      error: error
    }, { status: 500 });
  }
}

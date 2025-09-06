import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: '請提供學生ID' },
        { status: 400 }
      );
    }

    console.log('🔍 調試學生活動，學生ID:', studentId);

    // 1. 檢查 hanami_student_activities 表是否存在
    const { data: tableCheck, error: tableError } = await supabase
      .from('hanami_student_activities')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ hanami_student_activities 表錯誤:', tableError);
      return NextResponse.json({
        success: false,
        error: 'hanami_student_activities 表不存在或無法訪問',
        details: tableError.message
      });
    }

    // 2. 檢查該學生的所有活動
    const { data: allStudentActivities, error: allError } = await supabase
      .from('hanami_student_activities')
      .select('*')
      .eq('student_id', studentId);

    if (allError) {
      console.error('❌ 查詢學生活動失敗:', allError);
      return NextResponse.json({
        success: false,
        error: '查詢學生活動失敗',
        details: allError.message
      });
    }

    // 3. 檢查正在學習的活動
    const { data: ongoingActivities, error: ongoingError } = await supabase
      .from('hanami_student_activities')
      .select(`
        *,
        hanami_teaching_activities (
          id,
          activity_name,
          activity_description,
          activity_type,
          difficulty_level
        )
      `)
      .eq('student_id', studentId)
      .eq('activity_type', 'ongoing');

    if (ongoingError) {
      console.error('❌ 查詢正在學習活動失敗:', ongoingError);
    }

    // 4. 檢查所有學生的活動（用於比較）
    const { data: allActivities, error: allActivitiesError } = await supabase
      .from('hanami_student_activities')
      .select('student_id, activity_type, activity_id')
      .limit(10);

    if (allActivitiesError) {
      console.error('❌ 查詢所有活動失敗:', allActivitiesError);
    }

    // 5. 檢查 hanami_teaching_activities 表
    const { data: teachingActivities, error: teachingError } = await supabase
      .from('hanami_teaching_activities')
      .select('id, activity_name, activity_type')
      .limit(10);

    if (teachingError) {
      console.error('❌ 查詢教學活動失敗:', teachingError);
    }

    return NextResponse.json({
      success: true,
      debug: {
        studentId,
        tableExists: true,
        studentActivitiesCount: allStudentActivities?.length || 0,
        ongoingActivitiesCount: ongoingActivities?.length || 0,
        allActivitiesSample: allActivities || [],
        teachingActivitiesSample: teachingActivities || [],
        studentActivities: allStudentActivities || [],
        ongoingActivities: ongoingActivities || []
      }
    });

  } catch (error) {
    console.error('調試學生活動失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '調試失敗', 
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}

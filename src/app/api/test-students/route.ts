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

    console.log('🔍 檢查數據庫中的學生數據...');

    // 1. 檢查 Hanami_Students 表
    const { data: students, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, student_type')
      .limit(5);

    if (studentsError) {
      console.error('❌ 查詢學生失敗:', studentsError);
      return NextResponse.json({
        success: false,
        error: '查詢學生失敗',
        details: studentsError.message
      });
    }

    // 2. 檢查 hanami_student_activities 表
    const { data: studentActivities, error: activitiesError } = await supabase
      .from('hanami_student_activities')
      .select('id, student_id, activity_id, activity_type')
      .limit(10);

    if (activitiesError) {
      console.error('❌ 查詢學生活動失敗:', activitiesError);
    }

    // 3. 檢查 hanami_teaching_activities 表
    const { data: teachingActivities, error: teachingError } = await supabase
      .from('hanami_teaching_activities')
      .select('id, activity_name, activity_type')
      .limit(10);

    if (teachingError) {
      console.error('❌ 查詢教學活動失敗:', teachingError);
    }

    return NextResponse.json({
      success: true,
      data: {
        students: students || [],
        studentActivities: studentActivities || [],
        teachingActivities: teachingActivities || [],
        studentsCount: students?.length || 0,
        studentActivitiesCount: studentActivities?.length || 0,
        teachingActivitiesCount: teachingActivities?.length || 0
      }
    });

  } catch (error) {
    console.error('測試失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '測試失敗', 
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}

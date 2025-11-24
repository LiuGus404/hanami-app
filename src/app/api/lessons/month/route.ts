import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { fallbackOrganization } from '@/lib/authUtils';

/**
 * GET /api/lessons/month
 * 獲取指定月份範圍內的課程列表（使用服務角色 key 繞過 RLS）
 * 
 * 查詢參數：
 * - orgId: 機構 ID（必需）
 * - monthStart: 月份開始日期 YYYY-MM-DD（必需）
 * - monthEnd: 月份結束日期 YYYY-MM-DD（必需）
 * - userEmail: 用戶 email（用於權限驗證，可選）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const monthStart = searchParams.get('monthStart');
    const monthEnd = searchParams.get('monthEnd');
    const userEmail = searchParams.get('userEmail');

    if (!orgId) {
      return NextResponse.json(
        { error: '缺少 orgId 參數' },
        { status: 400 }
      );
    }

    if (!monthStart || !monthEnd) {
      return NextResponse.json(
        { error: '缺少 monthStart 或 monthEnd 參數' },
        { status: 400 }
      );
    }

    const disableOrgData =
      !orgId ||
      orgId === 'default-org' ||
      orgId === fallbackOrganization.id;

    if (disableOrgData) {
      return NextResponse.json({
        success: true,
        data: {
          regularLessons: [],
          trialLessons: [],
        },
      });
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabase = getServerSupabaseClient();

    // 驗證用戶是否有權限訪問該機構
    if (userEmail) {
      const { data: identity, error: identityError } = await supabase
        .from('hanami_org_identities')
        .select('role_type, status')
        .eq('org_id', orgId)
        .eq('user_email', userEmail)
        .eq('status', 'active')
        .maybeSingle();

      if (identityError) {
        console.error('API: 檢查機構身份錯誤', identityError);
        return NextResponse.json(
          { error: '權限驗證失敗' },
          { status: 500 }
        );
      }

      if (!identity) {
        const { data: employee, error: employeeError } = await supabase
          .from('hanami_employee')
          .select('teacher_email, teacher_status, org_id')
          .eq('teacher_email', userEmail)
          .eq('org_id', orgId)
          .maybeSingle();

        if (employeeError || !employee) {
          return NextResponse.json(
            { error: '您沒有權限訪問該機構的課程資料' },
            { status: 403 }
          );
        }
      }
    }

    // 並行查詢正式學生和試聽學生課程記錄
    console.log('開始並行查詢課程記錄...', { monthStart, monthEnd, orgId });
    
    const [lessonsResult, trialLessonsResult] = await Promise.all([
      // 查詢正式學生課程
      supabase
        .from('hanami_student_lesson')
        .select(`
          id,
          student_id,
          lesson_date,
          regular_timeslot,
          course_type,
          org_id
        `)
        .eq('org_id', orgId)
        .gte('lesson_date', monthStart)
        .lte('lesson_date', monthEnd)
        .order('lesson_date', { ascending: true }),
      
      // 查詢試聽學生課程
      supabase
        .from('hanami_trial_students')
        .select(`
          id,
          lesson_date,
          full_name,
          student_age,
          actual_timeslot,
          course_type,
          org_id
        `)
        .eq('org_id', orgId)
        .gte('lesson_date', monthStart)
        .lte('lesson_date', monthEnd)
        .order('lesson_date', { ascending: true }),
    ]);

    let regularLessons: any[] = [];
    let trialLessons: any[] = [];

    if (lessonsResult.error) {
      console.error('獲取正式學生課程記錄失敗:', lessonsResult.error);
    } else {
      regularLessons = lessonsResult.data || [];
      console.log(`成功獲取 ${regularLessons.length} 條正式學生課程記錄`);
    }

    if (trialLessonsResult.error) {
      console.error('獲取試聽學生記錄失敗:', trialLessonsResult.error);
    } else {
      trialLessons = trialLessonsResult.data || [];
      console.log(`成功獲取 ${trialLessons.length} 條試聽學生記錄`);
    }

    // 如果需要學生資料，分別查詢並組合
    let regularLessonsWithStudents: any[] = regularLessons;
    if (regularLessons.length > 0) {
      const studentIds = [...new Set(regularLessons.map((lesson: any) => lesson.student_id).filter(Boolean))];
      
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, student_age')
          .in('id', studentIds)
          .eq('org_id', orgId);
        
        const studentMap = new Map((studentsData || []).map((s: any) => [s.id, s]));
        
        regularLessonsWithStudents = regularLessons.map((lesson: any) => ({
          ...lesson,
          Hanami_Students: studentMap.get(lesson.student_id) || null
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        regularLessons: regularLessonsWithStudents,
        trialLessons: trialLessons,
      },
      count: {
        regular: regularLessonsWithStudents.length,
        trial: trialLessons.length,
        total: regularLessonsWithStudents.length + trialLessons.length,
      },
    });
  } catch (error: any) {
    console.error('API: 查詢課程列表異常', error);
    return NextResponse.json(
      { error: error?.message || '查詢課程列表時發生錯誤' },
      { status: 500 }
    );
  }
}



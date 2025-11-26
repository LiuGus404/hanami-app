import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/lessons/list
 * 獲取課程列表（使用服務角色 key 繞過 RLS）
 * 
 * 查詢參數：
 * - orgId: 機構 ID（必需）
 * - userEmail: 用戶 email（用於權限驗證）
 * - studentId: 學生 ID（可選）
 * - lessonDate: 課程日期（可選）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const userEmail = searchParams.get('userEmail');
    const studentId = searchParams.get('studentId');
    const lessonDate = searchParams.get('lessonDate');

    if (!orgId) {
      return NextResponse.json(
        { error: '缺少 orgId 參數' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabase = getServerSupabaseClient();

    // 驗證用戶是否有權限訪問該機構
    if (userEmail) {
      const { data: identity, error: identityError } = await ((supabase as any)
        .from('hanami_org_identities'))
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
        const { data: employee, error: employeeError } = await ((supabase as any)
          .from('hanami_employee'))
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

    // 構建查詢（避免關聯查詢以繞過 RLS 遞歸）
    let query = (supabase as any)
      .from('hanami_student_lesson')
      .select('*')
      .eq('org_id', orgId);

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (lessonDate) {
      query = query.eq('lesson_date', lessonDate);
    }

    const { data, error } = await query.order('lesson_date', { ascending: false });

    if (error) {
      console.error('API: 查詢課程列表錯誤', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 如果需要學生資料，分別查詢並組合
    let lessonsWithStudents: any[] = (data || []) as any[];
    if (data && data.length > 0) {
      const lessons = data as any[];
      const studentIds = [...new Set(lessons.map((lesson: any) => lesson.student_id).filter(Boolean))];
      
      if (studentIds.length > 0) {
        const { data: studentsData } = await ((supabase as any)
          .from('Hanami_Students'))
          .select('id, full_name, student_age, contact_number, student_dob')
          .in('id', studentIds)
          .eq('org_id', orgId);
        
        const studentMap = new Map((studentsData || []).map((s: any) => [s.id, s]));
        
        lessonsWithStudents = lessons.map((lesson: any) => ({
          ...lesson,
          Hanami_Students: studentMap.get(lesson.student_id) || null
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: lessonsWithStudents,
      count: lessonsWithStudents.length,
    });
  } catch (error: any) {
    console.error('API: 查詢課程列表異常', error);
    return NextResponse.json(
      { error: error?.message || '查詢課程列表時發生錯誤' },
      { status: 500 }
    );
  }
}


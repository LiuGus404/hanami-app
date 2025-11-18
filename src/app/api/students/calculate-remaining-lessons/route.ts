import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/students/calculate-remaining-lessons
 * 計算學生剩餘課程數（使用服務角色 key 繞過 RLS）
 * 
 * 請求體：
 * {
 *   "studentIds": ["uuid1", "uuid2", ...],
 *   "todayDate": "2025-11-17",
 *   "orgId": "org-uuid",
 *   "userEmail": "user@example.com"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentIds, todayDate, orgId, userEmail } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: '缺少 studentIds 參數或為空數組' },
        { status: 400 }
      );
    }

    if (!todayDate) {
      return NextResponse.json(
        { error: '缺少 todayDate 參數' },
        { status: 400 }
      );
    }

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
            { error: '您沒有權限訪問該機構的學生資料' },
            { status: 403 }
          );
        }
      }
    }

    // 驗證所有學生都屬於該機構
    const { data: studentsData, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select('id, org_id')
      .in('id', studentIds);

    if (studentsError) {
      console.error('API: 驗證學生錯誤', studentsError);
      return NextResponse.json(
        { error: '驗證學生時發生錯誤' },
        { status: 500 }
      );
    }

    const students = studentsData as Array<{ id: string; org_id: string }> | null;

    // 檢查所有學生是否都屬於該機構
    const invalidStudents = students?.filter(s => s.org_id !== orgId);
    if (invalidStudents && invalidStudents.length > 0) {
      return NextResponse.json(
        { error: '部分學生不屬於該機構' },
        { status: 403 }
      );
    }

    // 調用 RPC 函數計算剩餘課程數
    // 先嘗試修復版函數
    let result: any[] = [];
    let error: any = null;

    try {
      // 嘗試使用修復版函數
      const { data: fixedData, error: fixedError } = await (supabase as any).rpc(
        'calculate_remaining_lessons_batch_fixed',
        {
          student_ids: studentIds,
          today_date: todayDate,
        }
      );

      if (!fixedError && fixedData) {
        result = fixedData;
        console.log('API: 修復版 RPC 函數成功，返回', result.length, '個結果');
      } else {
        console.warn('API: 修復版 RPC 函數失敗，錯誤:', fixedError);
        error = fixedError;
        
        // 如果修復版失敗，嘗試原始函數
        const { data: originalData, error: originalError } = await (supabase as any).rpc(
          'calculate_remaining_lessons_batch',
          {
            student_ids: studentIds,
            today_date: todayDate,
          }
        );

        if (!originalError && originalData) {
          result = originalData;
          console.log('API: 原始 RPC 函數成功，返回', result.length, '個結果');
          error = null; // 清除錯誤，因為原始函數成功了
        } else {
          console.warn('API: 原始 RPC 函數也失敗，錯誤:', originalError);
          error = originalError || fixedError;
        }
      }
    } catch (rpcError: any) {
      console.error('API: RPC 函數調用異常', rpcError);
      error = rpcError;
    }

    // 如果兩個 RPC 函數都失敗，使用備用方法：直接查詢資料庫
    if (error) {
      console.warn('API: 所有 RPC 函數都失敗，使用備用方法計算剩餘課程數');
      
      try {
        // 備用方法：直接查詢 hanami_student_lesson 表
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('hanami_student_lesson')
          .select('student_id, lesson_date')
          .in('student_id', studentIds)
          .gte('lesson_date', todayDate)
          .eq('org_id', orgId);

        if (lessonsError) {
          console.error('API: 備用方法查詢失敗', lessonsError);
          return NextResponse.json(
            { error: '計算剩餘課程數時發生錯誤，請稍後再試' },
            { status: 500 }
          );
        }

        // 手動計算每個學生的剩餘課程數
        const lessonCounts: Record<string, number> = {};
        studentIds.forEach(id => {
          lessonCounts[id] = 0;
        });

        if (lessonsData && Array.isArray(lessonsData)) {
          lessonsData.forEach((lesson: any) => {
            const studentId = lesson.student_id;
            if (studentId && lessonCounts.hasOwnProperty(studentId)) {
              lessonCounts[studentId] = (lessonCounts[studentId] || 0) + 1;
            }
          });
        }

        // 轉換為 API 格式
        result = Object.entries(lessonCounts).map(([student_id, remaining_lessons]) => ({
          student_id,
          remaining_lessons,
        }));

        console.log('API: 備用方法計算完成，返回', result.length, '個結果');
      } catch (fallbackError: any) {
        console.error('API: 備用方法也失敗', fallbackError);
        return NextResponse.json(
          { error: '計算剩餘課程數時發生錯誤，請稍後再試' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: result || [],
    });
  } catch (error: any) {
    console.error('API: 計算剩餘課程數異常', error);
    return NextResponse.json(
      { error: error?.message || '計算剩餘課程數時發生錯誤' },
      { status: 500 }
    );
  }
}


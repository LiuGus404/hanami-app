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
      const { data: fixedData, error: fixedError } = await (supabase as any).rpc(
        'calculate_remaining_lessons_batch_fixed',
        {
          student_ids: studentIds,
          today_date: todayDate,
        }
      );

      if (!fixedError && fixedData) {
        result = fixedData;
      } else {
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
        } else {
          error = originalError || fixedError;
        }
      }
    } catch (rpcError: any) {
      console.error('API: RPC 函數調用異常', rpcError);
      error = rpcError;
    }

    if (error) {
      console.error('API: 計算剩餘課程數錯誤', error);
      return NextResponse.json(
        { error: error.message || '計算剩餘課程數時發生錯誤' },
        { status: 500 }
      );
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


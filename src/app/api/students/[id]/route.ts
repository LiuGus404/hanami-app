import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

/**
 * GET /api/students/[id]
 * 獲取單個學生資訊（使用服務角色 key 繞過 RLS）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!studentId) {
      return NextResponse.json(
        { error: '請提供學生ID' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json(
        { error: '服務器配置錯誤' },
        { status: 500 }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 如果提供了 orgId，先檢查停用學生列表
    if (orgId) {
      const { data: inactiveData } = await supabase
        .from('inactive_student_list')
        .select('*')
        .eq('id', studentId)
        .eq('org_id', orgId)
        .maybeSingle();

      if (inactiveData) {
        const inactiveDataTyped = inactiveData as any;
        const convertedStudent = {
          ...(inactiveDataTyped as Record<string, any>),
          id: inactiveDataTyped.original_id,
          original_id: inactiveDataTyped.original_id,
          student_type: inactiveDataTyped.student_type === 'regular' ? '常規' : '試堂',
          is_inactive: true,
          inactive_date: inactiveDataTyped.inactive_date,
          inactive_reason: inactiveDataTyped.inactive_reason,
        };
        return NextResponse.json({
          success: true,
          data: convertedStudent,
          isInactive: true
        });
      }

      // 檢查試堂學生
      const { data: trialStudent } = await supabase
        .from('hanami_trial_students')
        .select('*')
        .eq('id', studentId)
        .eq('org_id', orgId)
        .maybeSingle();

      if (trialStudent) {
        return NextResponse.json({
          success: true,
          data: trialStudent,
          isTrial: true
        });
      }
    }

    // 獲取常規學生資訊
    let query = supabase
      .from('Hanami_Students')
      .select('*')
      .eq('id', studentId);

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data: student, error } = await query.single();

    if (error) {
      console.error('獲取學生資訊失敗:', error);
      // 如果提供了 orgId 但找不到，返回 404
      if (orgId) {
        return NextResponse.json(
          { error: '找不到學生資料或您沒有權限存取。' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: '獲取學生資訊失敗' },
        { status: 500 }
      );
    }

    if (!student) {
      return NextResponse.json(
        { error: orgId ? '找不到學生資料或您沒有權限存取。' : '找不到學生' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error('獲取學生資訊失敗:', error);
    return NextResponse.json(
      { error: '獲取學生資訊失敗' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/students/[id]
 * 更新學生資訊（使用服務角色 key 繞過 RLS）
 * 
 * 請求體：
 * - updates: 要更新的欄位（例如：{ care_alert: true }）
 * - orgId: 機構 ID（用於權限驗證）
 * - userEmail: 用戶 email（用於權限驗證）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    const body = await request.json();
    const { updates, orgId, userEmail } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: '請提供學生ID' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: '請提供要更新的欄位' },
        { status: 400 }
      );
    }

    if (!orgId) {
      return NextResponse.json(
        { error: '缺少機構ID' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json(
        { error: '服務器配置錯誤' },
        { status: 500 }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 驗證學生是否屬於該機構
    const { data: studentData, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('id, org_id')
      .eq('id', studentId)
      .single();

    if (studentError || !studentData) {
      console.error('找不到學生:', studentError);
      return NextResponse.json(
        { error: '找不到學生' },
        { status: 404 }
      );
    }

    const student = studentData as { id: string; org_id: string };

    if (student.org_id !== orgId) {
      return NextResponse.json(
        { error: '無權限更新該學生' },
        { status: 403 }
      );
    }

    // 更新學生資訊
    const { data: updatedStudent, error: updateError } = await (supabase as any)
      .from('Hanami_Students')
      .update(updates)
      .eq('id', studentId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (updateError) {
      console.error('更新學生資訊失敗:', updateError);
      return NextResponse.json(
        { error: updateError.message || '更新學生資訊失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedStudent
    });

  } catch (error: any) {
    console.error('更新學生資訊失敗:', error);
    return NextResponse.json(
      { error: error?.message || '更新學生資訊失敗' },
      { status: 500 }
    );
  }
} 
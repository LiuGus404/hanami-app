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

    // orgId 是可選的（向後兼容），但如果提供了，會用於驗證權限
    // 即使沒有 orgId，也允許更新（使用資料庫函數繞過 RLS）

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

    // 使用 REST API 檢查學生是否存在及是否屬於該機構（繞過 RLS）
    let isTrialStudent = false;
    let studentTable = 'Hanami_Students';
    
    // 先檢查試堂學生
    const trialCheckUrl = `${supabaseUrl}/rest/v1/hanami_trial_students?id=eq.${studentId}&select=id,org_id`;
    const trialCheckResponse = await fetch(trialCheckUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });

    if (trialCheckResponse.ok) {
      const trialData = await trialCheckResponse.json();
      if (Array.isArray(trialData) && trialData.length > 0) {
        const trialStudent = trialData[0];
        isTrialStudent = true;
        studentTable = 'hanami_trial_students';
        
        // 驗證試堂學生是否屬於該機構（如果提供了 orgId）
        if (orgId && trialStudent.org_id !== orgId) {
          return NextResponse.json(
            { error: '無權限更新該學生' },
            { status: 403 }
          );
        }
      }
    }

    // 如果不是試堂學生，檢查常規學生
    if (!isTrialStudent) {
      const studentCheckUrl = `${supabaseUrl}/rest/v1/Hanami_Students?id=eq.${studentId}&select=id,org_id`;
      const studentCheckResponse = await fetch(studentCheckUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });

      if (!studentCheckResponse.ok) {
        const errorText = await studentCheckResponse.text();
        console.error('檢查學生失敗:', studentCheckResponse.status, errorText);
        return NextResponse.json(
          { error: '找不到學生' },
          { status: 404 }
        );
      }

      const studentData = await studentCheckResponse.json();
      if (!Array.isArray(studentData) || studentData.length === 0) {
        return NextResponse.json(
          { error: '找不到學生' },
          { status: 404 }
        );
      }

      const student = studentData[0] as { id: string; org_id: string | null };

      // 如果提供了 orgId，驗證學生是否屬於該機構
      if (orgId && student.org_id !== orgId) {
        return NextResponse.json(
          { error: '無權限更新該學生' },
          { status: 403 }
        );
      }
    }

    // 確保更新數據中包含 org_id（如果需要）
    const updateData = {
      ...updates,
      // 如果 updates 中沒有 org_id 且提供了 orgId，確保添加它
      ...(orgId && !updates.org_id ? { org_id: orgId } : {}),
      updated_at: new Date().toISOString(),
    };
    
    // 優先使用資料庫函數更新學生資料（完全繞過 RLS）
    // 資料庫函數使用 SECURITY DEFINER，更可靠地繞過 RLS
    console.log('嘗試使用資料庫函數更新學生（繞過 RLS）:', studentTable, studentId);
    console.log('更新數據:', JSON.stringify(updateData, null, 2));
    
    try {
      let updatedStudent = null;
      
      // 優先嘗試使用資料庫函數
      try {
        const functionName = isTrialStudent ? 'update_trial_student' : 'update_hanami_student';
        console.log('調用資料庫函數:', functionName);
        
        const { data: result, error: rpcError } = await (supabase as any).rpc(functionName, {
          p_student_id: studentId,
          p_updates: updateData
        });
        
        if (rpcError) {
          console.error('資料庫函數失敗:', rpcError);
          throw rpcError;
        }
        
        updatedStudent = typeof result === 'object' && result !== null ? result : null;
        console.log('資料庫函數更新成功');
      } catch (rpcError: any) {
        console.error('資料庫函數調用失敗:', rpcError);
        
        // 如果資料庫函數失敗，使用 REST API 作為備用
        console.log('資料庫函數失敗，嘗試使用 REST API 作為備用...');
        
        const tableName = isTrialStudent ? 'hanami_trial_students' : 'Hanami_Students';
        const restUrl = `${supabaseUrl}/rest/v1/${tableName}?id=eq.${studentId}`;
        
        console.log('REST API URL:', restUrl.substring(0, 100) + '...');
        console.log('Service Key 長度:', supabaseServiceKey?.length || 0);
        
        const restResponse = await fetch(restUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        });

        console.log('REST API 響應狀態:', restResponse.status);

        if (!restResponse.ok) {
          const errorText = await restResponse.text();
          console.error('REST API 也失敗:', restResponse.status, errorText);
          
          return NextResponse.json(
            { 
              error: '更新學生資訊失敗',
              hint: '請執行 migrations/2025-01-23_create_update_student_function.sql 來創建更新函數。如果已執行，請檢查函數是否正確創建。',
              rpcError: rpcError?.message,
              restError: errorText
            },
            { status: 500 }
          );
        }

        const restResult = await restResponse.json();
        updatedStudent = Array.isArray(restResult) && restResult.length > 0 ? restResult[0] : restResult;
        console.log('REST API 備用更新成功');
      }
      
      // 如果沒有返回數據，嘗試查詢
      if (!updatedStudent) {
        console.log('沒有返回數據，嘗試查詢...');
        const tableName = isTrialStudent ? 'hanami_trial_students' : 'Hanami_Students';
        const { data: fetchedStudent, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', studentId)
          .single();
        
        if (fetchError) {
          console.error('查詢更新後的學生失敗:', fetchError);
          return NextResponse.json(
            { error: '更新成功但無法獲取更新後的數據' },
            { status: 500 }
          );
        }
        
        updatedStudent = fetchedStudent;
      }
      
      return NextResponse.json({
        success: true,
        data: updatedStudent
      });
    } catch (error: any) {
      console.error('更新學生異常:', error);
      
      // 檢查是否為函數不存在的錯誤
      const errorMessage = error?.message || '';
      const isFunctionNotFound = errorMessage.includes('function') && errorMessage.includes('does not exist');
      
      return NextResponse.json(
        { 
          error: errorMessage || '更新學生資訊時發生錯誤',
          hint: isFunctionNotFound 
            ? '請在 Supabase Dashboard 的 SQL Editor 中執行 migrations/2025-01-23_create_update_student_function.sql 來創建更新函數'
            : '如果問題持續，請檢查資料庫函數是否已正確創建'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('更新學生資訊失敗:', error);
    return NextResponse.json(
      { error: error?.message || '更新學生資訊失敗' },
      { status: 500 }
    );
  }
} 
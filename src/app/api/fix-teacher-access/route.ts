import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 主資料庫連接 (hanami_employee 所在)
const mainSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const mainSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({
        error: '缺少 email 參數'
      }, { status: 400 });
    }

    console.log('修復教師權限，email:', email);

    // 創建主資料庫客戶端
    const mainSupabase = createClient(mainSupabaseUrl, mainSupabaseKey);

    // 查詢 hanami_employee 表
    const { data: employeeData, error: employeeError } = await mainSupabase
      .from('hanami_employee')
      .select('id, teacher_email, teacher_fullname, teacher_nickname, teacher_role, teacher_status')
      .eq('teacher_email', email)
      .single();

    if (employeeError && employeeError.code !== 'PGRST116') {
      console.error('查詢 hanami_employee 錯誤:', employeeError);
      return NextResponse.json({
        error: '查詢教師資料時發生錯誤',
        details: employeeError.message
      }, { status: 500 });
    }

    // 檢查是否在教師表中找到該 email
    const hasTeacherAccess = !!employeeData;

    if (!hasTeacherAccess) {
      return NextResponse.json({
        success: false,
        message: '該用戶不在教師表中，無法修復權限',
        email: email,
        hasTeacherAccess: false
      });
    }

    // 創建正確的權限數據
    const fixedAccessData = {
      success: true,
      email: email,
      hasTeacherAccess: true,
      employeeData: employeeData,
      saasUserData: null,
      message: '✓ 已驗證花見老師身份',
      mode: 'fixed',
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      message: '權限修復成功',
      email: email,
      hasTeacherAccess: true,
      fixedData: fixedAccessData,
      instructions: {
        step1: '將返回的 fixedData 保存到 sessionStorage',
        step2: '使用 sessionStorage.setItem("hanami_teacher_access", JSON.stringify(fixedData))',
        step3: '重新載入頁面或重新檢查權限'
      }
    });

  } catch (error: any) {
    console.error('修復教師權限錯誤:', error);
    return NextResponse.json({
      error: error.message || '修復教師權限時發生錯誤'
    }, { status: 500 });
  }
}

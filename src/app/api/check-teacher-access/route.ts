import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 主資料庫連接 (hanami_employee 所在)
const mainSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const mainSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// SAAS 系統資料庫連接 (saas_users 所在)
const saasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
const saasSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        error: '缺少 email 參數'
      }, { status: 400 });
    }

    // 檢查環境變數配置
    if (!saasSupabaseUrl || !saasSupabaseKey) {
      console.warn('SAAS 資料庫環境變數未配置，將跳過 SAAS 用戶查詢');
      return NextResponse.json({
        success: true,
        email: email,
        hasTeacherAccess: false,
        employeeData: null,
        saasUserData: null,
        message: 'SAAS 資料庫未配置，無法驗證教師權限',
        warning: '請配置 NEXT_PUBLIC_SUPABASE_SAAS_URL 和 NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY 環境變數'
      });
    }

    // 創建兩個資料庫客戶端
    const mainSupabase = createClient(mainSupabaseUrl, mainSupabaseKey);
    const saasSupabase = createClient(saasSupabaseUrl, saasSupabaseKey);

    // 1. 查詢 hanami_employee 表 (主資料庫)
    const { data: employeeData, error: employeeError } = await mainSupabase
      .from('hanami_employee')
      .select('id, teacher_email, teacher_fullname, teacher_nickname, teacher_role, teacher_status')
      .eq('teacher_email', email)
      .single();

    if (employeeError && employeeError.code !== 'PGRST116') {
      console.error('查詢 hanami_employee 錯誤:', employeeError);
      return NextResponse.json({
        error: '查詢教師資料時發生錯誤'
      }, { status: 500 });
    }

    // 2. 查詢 saas_users 表 (SAAS 資料庫)
    const { data: saasUserData, error: saasError } = await saasSupabase
      .from('saas_users')
      .select('id, email, name, role, subscription_status')
      .eq('email', email)
      .single();

    if (saasError && saasError.code !== 'PGRST116') {
      console.error('查詢 saas_users 錯誤:', saasError);
      return NextResponse.json({
        error: '查詢 SAAS 用戶資料時發生錯誤'
      }, { status: 500 });
    }

    // 3. 檢查是否兩個表都有該 email
    const isTeacherAccess = !!(employeeData && saasUserData);

    return NextResponse.json({
      success: true,
      email: email,
      hasTeacherAccess: isTeacherAccess,
      employeeData: employeeData || null,
      saasUserData: saasUserData || null,
      message: isTeacherAccess 
        ? '已驗證花見老師身份' 
        : '您不具備花見老師專區訪問權限'
    });

  } catch (error: any) {
    console.error('檢查教師權限錯誤:', error);
    return NextResponse.json({
      error: error.message || '檢查教師權限時發生錯誤'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 主資料庫連接 (hanami_employee 所在)
const mainSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const mainSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        error: '缺少 email 參數'
      }, { status: 400 });
    }

    // 創建主資料庫客戶端
    const mainSupabase = createClient(mainSupabaseUrl, mainSupabaseKey);

    // 查詢 hanami_employee 表 (主資料庫)
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
    const isTeacherAccess = !!employeeData;

    return NextResponse.json({
      success: true,
      email: email,
      hasTeacherAccess: isTeacherAccess,
      employeeData: employeeData || null,
      saasUserData: null, // 簡化版本不檢查 SAAS 資料庫
      message: isTeacherAccess 
        ? '✓ 已驗證花見老師身份' 
        : '您不具備花見老師專區訪問權限',
      mode: 'simplified', // 標記這是簡化模式
      note: '當前使用簡化模式，只檢查 hanami_employee 表'
    });

  } catch (error: any) {
    console.error('檢查教師權限錯誤:', error);
    return NextResponse.json({
      error: error.message || '檢查教師權限時發生錯誤'
    }, { status: 500 });
  }
}

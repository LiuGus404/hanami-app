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

    console.log('強制檢查教師權限，email:', email);

    // 創建主資料庫客戶端
    const mainSupabase = createClient(mainSupabaseUrl, mainSupabaseKey);

    // 查詢 hanami_employee 表
    const { data: employeeData, error: employeeError } = await mainSupabase
      .from('hanami_employee')
      .select('id, teacher_email, teacher_fullname, teacher_nickname, teacher_role, teacher_status')
      .eq('teacher_email', email)
      .single();

    console.log('資料庫查詢結果:', { employeeData, employeeError });

    if (employeeError && employeeError.code !== 'PGRST116') {
      console.error('查詢 hanami_employee 錯誤:', employeeError);
      return NextResponse.json({
        error: '查詢教師資料時發生錯誤',
        details: employeeError.message
      }, { status: 500 });
    }

    // 檢查是否在教師表中找到該 email
    const hasTeacherAccess = !!employeeData;

    console.log('權限檢查結果:', { email, hasTeacherAccess, employeeData });

    const result = {
      success: true,
      email: email,
      hasTeacherAccess: hasTeacherAccess,
      employeeData: employeeData || null,
      saasUserData: null,
      message: hasTeacherAccess 
        ? '✓ 已驗證花見老師身份' 
        : '您不具備花見老師專區訪問權限',
      mode: 'force_check',
      note: '強制檢查模式，繞過會話存儲',
      timestamp: Date.now()
    };

    console.log('返回結果:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('強制檢查教師權限錯誤:', error);
    return NextResponse.json({
      error: error.message || '強制檢查教師權限時發生錯誤'
    }, { status: 500 });
  }
}

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

    console.log('直接查詢 hanami_employee 表，email:', email);

    // 創建主資料庫客戶端
    const mainSupabase = createClient(mainSupabaseUrl, mainSupabaseKey);

    // 首先查詢所有記錄（用於調試）
    const { data: allEmployees, error: allError } = await mainSupabase
      .from('hanami_employee')
      .select('id, teacher_email, teacher_fullname, teacher_nickname, teacher_role, teacher_status')
      .limit(10);

    console.log('所有教師記錄（前10筆）:', allEmployees);

    // 查詢特定 email 的記錄
    const { data: employeeData, error: employeeError } = await mainSupabase
      .from('hanami_employee')
      .select('id, teacher_email, teacher_fullname, teacher_nickname, teacher_role, teacher_status')
      .eq('teacher_email', email);

    console.log('查詢結果:', { employeeData, employeeError });

    // 查詢所有包含該 email 的記錄（模糊查詢）
    const { data: fuzzyResults, error: fuzzyError } = await mainSupabase
      .from('hanami_employee')
      .select('id, teacher_email, teacher_fullname, teacher_nickname, teacher_role, teacher_status')
      .ilike('teacher_email', `%${email}%`);

    console.log('模糊查詢結果:', { fuzzyResults, fuzzyError });

    // 檢查是否有任何記錄
    const hasExactMatch = employeeData && employeeData.length > 0;
    const hasFuzzyMatch = fuzzyResults && fuzzyResults.length > 0;

    return NextResponse.json({
      success: true,
      email: email,
      hasTeacherAccess: hasExactMatch,
      exactMatch: hasExactMatch,
      fuzzyMatch: hasFuzzyMatch,
      employeeData: employeeData || null,
      fuzzyResults: fuzzyResults || null,
      allEmployees: allEmployees || null,
      errors: {
        employeeError: employeeError?.message || null,
        fuzzyError: fuzzyError?.message || null,
        allError: allError?.message || null
      },
      message: hasExactMatch 
        ? '✓ 在 hanami_employee 表中找到精確匹配' 
        : hasFuzzyMatch 
          ? `在 hanami_employee 表中找到模糊匹配，但精確匹配失敗`
          : '在 hanami_employee 表中未找到該 email',
      mode: 'direct_check'
    });

  } catch (error: any) {
    console.error('直接檢查教師權限錯誤:', error);
    return NextResponse.json({
      error: error.message || '直接檢查教師權限時發生錯誤'
    }, { status: 500 });
  }
}

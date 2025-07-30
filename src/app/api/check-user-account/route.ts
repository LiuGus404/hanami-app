import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        error: '缺少郵箱參數'
      }, { status: 400 });
    }

    console.log(`檢查用戶帳號: ${email}`);

    // 檢查各個表中的用戶記錄
    let results: { [key: string]: any } = {};

    // 1. 檢查註冊申請
    const { data: registrationData, error: registrationError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('email', email)
      .single();

    results.registration_requests = registrationData
      ? { found: true, data: registrationData, error: registrationError?.message }
      : null;

    // 2. 檢查權限記錄
    const { data: permissionData, error: permissionError } = await supabase
      .from('hanami_user_permissions_v2')
      .select(`
        *,
        hanami_roles (
          role_name, display_name
        )
      `)
      .eq('user_email', email)
      .single();

    results.hanami_user_permissions_v2 = {
      found: !!permissionData,
      data: permissionData,
      error: permissionError?.message
    };

    // 3. 檢查管理員表
    const { data: adminData, error: adminError } = await supabase
      .from('hanami_admin')
      .select('*')
      .eq('admin_email', email)
      .single();

    results.hanami_admin = {
      found: !!adminData,
      data: adminData,
      error: adminError?.message
    };

    // 4. 檢查教師表
    const { data: employeeData, error: employeeError } = await supabase
      .from('hanami_employee')
      .select('*')
      .eq('teacher_email', email)
      .single();

    results.hanami_employee = {
      found: !!employeeData,
      data: employeeData,
      error: employeeError?.message
    };

    // 5. 檢查學生表（多個郵箱欄位）
    const { data: studentsData, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select('*')
      .or(`student_email.eq.${email},parent_email.eq.${email}`);

    results.Hanami_Students = {
      found: studentsData && studentsData.length > 0,
      data: studentsData,
      error: studentsError?.message
    };

    return NextResponse.json({
      success: true,
      email: email,
      results
    });

  } catch (error: any) {
    console.error('檢查用戶帳號錯誤:', error);
    return NextResponse.json({
      error: error.message || '檢查用戶帳號時發生錯誤'
    }, { status: 500 });
  }
} 
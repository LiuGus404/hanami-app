import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({
        error: '缺少 email 參數'
      }, { status: 400 });
    }

    console.log(`檢查註冊狀態: ${email}`);

    // 1. 檢查註冊申請
    const { data: registrationRequests, error: regError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    // 2. 檢查權限記錄
    const { data: permissions, error: permError } = await supabase
      .from('hanami_user_permissions_v2')
      .select('*, hanami_roles(*)')
      .eq('user_email', email);

    // 3. 檢查用戶帳號
    const { data: adminAccount } = await supabase
      .from('hanami_admin')
      .select('*')
      .eq('admin_email', email);

    const { data: teacherAccount } = await supabase
      .from('hanami_employee')
      .select('*')
      .eq('teacher_email', email);

    const { data: studentAccount } = await supabase
      .from('Hanami_Students')
      .select('*')
      .eq('parent_email', email);

    // 4. 檢查 Supabase Auth 用戶
    const { data: userList, error: authError } = await supabase.auth.admin.listUsers();
    const authUser = userList?.users?.find(u => u.email === email);

    const result = {
      email,
      timestamp: new Date().toISOString(),
      registration_requests: {
        found: registrationRequests && registrationRequests.length > 0,
        count: registrationRequests?.length || 0,
        data: registrationRequests,
        error: regError?.message
      },
      hanami_user_permissions_v2: {
        found: permissions && permissions.length > 0,
        count: permissions?.length || 0,
        data: permissions,
        error: permError?.message
      },
      hanami_admin: {
        found: !!adminAccount,
        data: adminAccount,
        error: null
      },
      hanami_employee: {
        found: !!teacherAccount,
        data: teacherAccount,
        error: null
      },
      Hanami_Students: {
        found: !!studentAccount,
        data: studentAccount,
        error: null
      },
      supabase_auth: {
        found: !!authUser,
        data: authUser,
        error: authError?.message
      },
      summary: {
        has_registration_request: registrationRequests && registrationRequests.length > 0,
        has_permissions: permissions && permissions.length > 0,
        has_user_account: !!(adminAccount || teacherAccount || studentAccount),
        has_auth_user: !!authUser,
        latest_registration_status: registrationRequests?.[0]?.status || 'none'
      }
    };

    console.log('註冊狀態檢查結果:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('檢查註冊狀態錯誤:', error);
    return NextResponse.json({
      error: error.message || '檢查註冊狀態時發生錯誤'
    }, { status: 500 });
  }
} 
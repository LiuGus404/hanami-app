import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, debug_roles } = body;

    if (!email && !debug_roles) {
      return NextResponse.json({
        error: '缺少 email 參數'
      }, { status: 400 });
    }

    // 如果是調試角色模式
    if (debug_roles) {
      console.log('調試模式：檢查 hanami_roles 表');
      
      const { data: roles, error: rolesError } = await supabase
        .from('hanami_roles')
        .select('*');

      if (rolesError) {
        console.error('查詢角色錯誤:', rolesError);
        return NextResponse.json({
          success: false,
          error: `查詢角色失敗: ${rolesError.message}`,
          details: rolesError
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        debug_roles: roles
      });
    }

    console.log(`測試檢查註冊狀態: ${email}`);

    // 1. 檢查註冊申請
    const { data: registrationRequests, error: regError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (regError) {
      console.error('註冊申請查詢錯誤:', regError);
    }

    // 2. 檢查權限記錄
    const { data: permissions, error: permError } = await supabase
      .from('hanami_user_permissions_v2')
      .select('*, hanami_roles(*)')
      .eq('user_email', email);

    if (permError) {
      console.error('權限記錄查詢錯誤:', permError);
    }

    // 3. 檢查用戶帳號
    const { data: adminAccount, error: adminError } = await supabase
      .from('hanami_admin')
      .select('*')
      .eq('admin_email', email);

    if (adminError) {
      console.error('管理員帳號查詢錯誤:', adminError);
    }

    const { data: teacherAccount, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('*')
      .eq('teacher_email', email);

    if (teacherError) {
      console.error('教師帳號查詢錯誤:', teacherError);
    }

    const { data: studentAccount, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('*')
      .eq('parent_email', email);

    if (studentError) {
      console.error('學生帳號查詢錯誤:', studentError);
    }

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
        error: adminError?.message
      },
      hanami_employee: {
        found: !!teacherAccount,
        data: teacherAccount,
        error: teacherError?.message
      },
      Hanami_Students: {
        found: !!studentAccount,
        data: studentAccount,
        error: studentError?.message
      }
    };

    console.log('測試註冊狀態檢查結果:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('測試檢查註冊狀態錯誤:', error);
    return NextResponse.json({
      error: error.message || '測試檢查註冊狀態時發生錯誤',
      stack: error.stack
    }, { status: 500 });
  }
} 
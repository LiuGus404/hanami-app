import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        error: '缺少郵箱或密碼'
      }, { status: 400 });
    }

    console.log('開始處理登入請求:', { email });

    // 1. 使用 Supabase Auth 驗證用戶
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Supabase Auth 登入失敗:', authError);
      return NextResponse.json({
        error: '帳號或密碼錯誤'
      }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json({
        error: '帳號或密碼錯誤'
      }, { status: 401 });
    }

    console.log('Supabase Auth 驗證成功:', authData.user.id);

    // 2. 檢查用戶權限記錄
    const { data: permissionData, error: permissionError } = await supabase
      .from('hanami_user_permissions_v2')
      .select(`
        *,
        hanami_roles (
          role_name, display_name
        )
      `)
      .eq('user_email', email)
      .eq('status', 'approved')
      .eq('is_active', true)
      .single();

    if (permissionError || !permissionData) {
      console.error('查詢權限記錄失敗:', permissionError);
      return NextResponse.json({
        error: '您的帳號尚未獲得批准，請聯繫管理員'
      }, { status: 403 });
    }

    console.log('找到權限記錄:', permissionData);

    // 3. 檢查用戶帳號是否存在
    const roleName = permissionData.hanami_roles?.role_name;
    let userData = null;

    if (roleName === 'admin') {
      const { data } = await supabase
        .from('hanami_admin')
        .select('*')
        .eq('admin_email', email)
        .single();
      userData = data;
    } else if (roleName === 'teacher') {
      const { data } = await supabase
        .from('hanami_employee')
        .select('*')
        .eq('teacher_email', email)
        .single();
      userData = data;
    } else if (roleName === 'parent') {
      const { data } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('parent_email', email)
        .single();
      userData = data;
    }

    if (!userData) {
      console.error('用戶帳號不存在:', { email, roleName });
      return NextResponse.json({
        error: '用戶帳號未創建，請聯繫管理員'
      }, { status: 403 });
    }

    // 4. 創建會話數據
    const sessionData = {
      id: authData.user.id,
      email: email,
      role: roleName,
      name: userData.full_name || userData.teacher_fullname || userData.admin_name || '用戶',
      timestamp: Date.now(),
      userData: userData
    };

    console.log('登入成功，會話數據:', sessionData);

    return NextResponse.json({
      success: true,
      message: '登入成功',
      user: sessionData
    });

  } catch (error: any) {
    console.error('登入處理錯誤:', error);
    return NextResponse.json({
      error: error.message || '登入時發生錯誤'
    }, { status: 500 });
  }
} 
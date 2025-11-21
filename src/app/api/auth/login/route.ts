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
      // 提供更具體的錯誤訊息
      const emailExists = await checkEmailExistsInSupabase(email);
      
      if (!emailExists) {
        return NextResponse.json({
          error: '此電子郵件地址尚未註冊。請確認您輸入的郵箱是否正確，或前往註冊頁面創建新帳號。'
        }, { status: 401 });
      } else {
        return NextResponse.json({
          error: '密碼錯誤。請確認您輸入的密碼是否正確，注意大小寫。如果忘記密碼，請使用忘記密碼功能。'
        }, { status: 401 });
      }
    }

    if (!authData.user) {
      // 提供更具體的錯誤訊息
      const emailExists = await checkEmailExistsInSupabase(email);
      
      if (!emailExists) {
        return NextResponse.json({
          error: '此電子郵件地址尚未註冊。請確認您輸入的郵箱是否正確，或前往註冊頁面創建新帳號。'
        }, { status: 401 });
      } else {
        return NextResponse.json({
          error: '密碼錯誤。請確認您輸入的密碼是否正確，注意大小寫。如果忘記密碼，請使用忘記密碼功能。'
        }, { status: 401 });
      }
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
    // 提供更具體的錯誤訊息
    let errorMessage = '登入時發生錯誤';
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = '網路連線錯誤，請檢查您的網路連線後重試';
      } else if (error.message.includes('timeout')) {
        errorMessage = '連線逾時，請稍後再試';
      } else {
        errorMessage = error.message || '登入時發生錯誤';
      }
    }
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}

// 檢查郵箱是否在 Supabase Auth 中存在的輔助函數
async function checkEmailExistsInSupabase(email: string): Promise<boolean> {
  try {
    // 檢查新權限系統
    const { data: permissionData } = await supabase
      .from('hanami_user_permissions_v2')
      .select('id')
      .eq('user_email', email)
      .limit(1);

    if (permissionData && permissionData.length > 0) {
      return true;
    }

    // 檢查管理員表
    const { data: adminData } = await supabase
      .from('hanami_admin')
      .select('id')
      .eq('admin_email', email)
      .limit(1);

    if (adminData && adminData.length > 0) {
      return true;
    }

    // 檢查教師表
    const { data: teacherData } = await supabase
      .from('hanami_employee')
      .select('id')
      .eq('teacher_email', email)
      .limit(1);

    if (teacherData && teacherData.length > 0) {
      return true;
    }

    // 檢查家長表
    const { data: parentData } = await supabase
      .from('hanami_parents')
      .select('id')
      .eq('parent_email', email)
      .limit(1);

    if (parentData && parentData.length > 0) {
      return true;
    }

    // 檢查學生表（通過student_email）
    const { data: studentData } = await supabase
      .from('Hanami_Students')
      .select('id')
      .eq('student_email', email)
      .limit(1);

    if (studentData && studentData.length > 0) {
      return true;
    }

    // 檢查學生表（通過parent_email）
    const { data: parentStudentData } = await supabase
      .from('Hanami_Students')
      .select('id')
      .eq('parent_email', email)
      .limit(1);

    if (parentStudentData && parentStudentData.length > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('檢查郵箱存在性時發生錯誤:', error);
    // 如果檢查失敗，返回 false 以顯示郵箱未註冊的錯誤
    return false;
  }
} 
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        error: '缺少 email 或 password 參數'
      }, { status: 400 });
    }

    console.log(`測試 Supabase Auth 註冊: ${email}`);

    // 1. 檢查用戶是否已存在
    const { data: userList, error: checkError } = await supabase.auth.admin.listUsers();
    const existingUser = userList?.users?.find(u => u.email === email);
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: '此 email 已被註冊',
        user_exists: true
      }, { status: 400 });
    }

    // 2. 創建新用戶
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // 自動確認 email
      user_metadata: {
        full_name: 'Test User',
        role: 'teacher'
      }
    });

    if (createError) {
      console.error('創建 Supabase Auth 用戶失敗:', createError);
      return NextResponse.json({
        success: false,
        error: createError.message,
        code: createError.status
      }, { status: 400 });
    }

    // 3. 發送確認郵件（如果需要）
    let emailResult: { sent: boolean; error: string | null } = { sent: false, error: null };
    try {
      const { error: emailError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: {
          redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback'
        }
      });
      
      if (emailError) {
        emailResult = { sent: false, error: emailError.message };
      } else {
        emailResult = { sent: true, error: null };
      }
    } catch (error) {
      emailResult = { sent: false, error: error instanceof Error ? error.message : '未知錯誤' };
    }

    // 4. 檢查用戶狀態
    const { data: userStatus, error: statusError } = await supabase.auth.admin.getUserById(newUser.user.id);

    const result = {
      success: true,
      message: 'Supabase Auth 用戶創建成功',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        email_confirmed_at: newUser.user.email_confirmed_at,
        created_at: newUser.user.created_at,
        updated_at: newUser.user.updated_at,
        user_metadata: newUser.user.user_metadata
      },
      email: emailResult,
      status: userStatus?.user,
      timestamp: new Date().toISOString()
    };

    console.log('Supabase Auth 註冊結果:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('測試 Supabase Auth 註冊錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '測試 Supabase Auth 註冊時發生錯誤'
    }, { status: 500 });
  }
} 
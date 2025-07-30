import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone, role, additional_info } = body;

    console.log('開始處理註冊請求:', { email, full_name, role });

    // 1. 驗證輸入
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({
        error: '缺少必要參數'
      }, { status: 400 });
    }

    // 2. 檢查郵箱是否已存在
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
    if (checkError) {
      console.error('檢查現有用戶錯誤:', checkError);
      return NextResponse.json({
        error: '檢查用戶失敗'
      }, { status: 500 });
    }

    const existingUser = existingUsers.users.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json({
        error: '該郵箱已被註冊'
      }, { status: 400 });
    }

    // 3. 創建 Supabase Auth 用戶
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false, // 需要郵箱驗證
      user_metadata: {
        full_name: full_name,
        phone: phone,
        role: role,
        additional_info: additional_info
      }
    });

    if (authError) {
      console.error('創建 Supabase Auth 用戶失敗:', authError);
      return NextResponse.json({
        error: '創建用戶失敗',
        details: authError.message
      }, { status: 500 });
    }

    console.log('Supabase Auth 用戶創建成功:', authData.user?.id);

    // 4. 發送郵箱驗證
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback'
      }
    });

    if (emailError) {
      console.error('發送郵箱驗證失敗:', emailError);
      // 不返回錯誤，因為用戶已創建，只是驗證郵件發送失敗
    } else {
      console.log('郵箱驗證已發送');
    }

    // 5. 創建註冊申請記錄
    const { error: registrationError } = await supabase
      .from('registration_requests')
      .insert({
        email: email,
        full_name: full_name,
        phone: phone,
        role: role,
        additional_info: additional_info,
        status: 'pending_verification', // 等待郵箱驗證
        auth_user_id: authData.user?.id
      });

    if (registrationError) {
      console.error('創建註冊申請失敗:', registrationError);
      // 不返回錯誤，因為主要功能（創建用戶）已成功
    }

    return NextResponse.json({
      success: true,
      message: '註冊成功！請檢查您的郵箱並點擊驗證連結。',
      userId: authData.user?.id,
      email: email
    });

  } catch (error: any) {
    console.error('註冊處理錯誤:', error);
    return NextResponse.json({
      error: error.message || '註冊時發生錯誤'
    }, { status: 500 });
  }
} 
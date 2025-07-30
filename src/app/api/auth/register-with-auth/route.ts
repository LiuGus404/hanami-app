import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone, role, additional_info } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({
        error: '缺少必要參數: email, password, full_name'
      }, { status: 400 });
    }

    console.log(`開始註冊流程: ${email}`);

    // 1. 檢查用戶是否已存在
    const { data: userList, error: checkError } = await supabase.auth.admin.listUsers();
    const existingUser = userList?.users?.find(u => u.email === email);
    
    if (existingUser) {
      return NextResponse.json({
        error: '該郵箱已註冊',
        code: 'EMAIL_EXISTS'
      }, { status: 400 });
    }

    // 2. 創建 Supabase Auth 用戶
    console.log('創建 Supabase Auth 用戶...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false, // 不自動確認，需要用戶點擊認證連結
      user_metadata: {
        full_name: full_name,
        role: role,
        phone: phone,
        additional_info: additional_info
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

    console.log('Supabase Auth 用戶創建成功:', newUser.user.id);

    // 3. 發送確認郵件
    console.log('發送確認郵件...');
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/auth/callback' // 或你的登入完成頁面
      }
    });

    if (emailError) {
      console.error('發送確認郵件失敗:', emailError);
      // 不返回錯誤，因為用戶已創建，只是 email 發送失敗
    } else {
      console.log('確認郵件發送成功');
    }

    // 4. 創建註冊申請記錄
    console.log('創建註冊申請記錄...');
    const { data: registrationRequest, error: regError } = await supabase
      .from('registration_requests')
      .insert({
        email: email,
        full_name: full_name,
        phone: phone,
        role: role,
        status: 'pending',
        additional_info: {
          ...additional_info,
          password: password, // 記錄密碼到 additional_info
          supabase_user_id: newUser.user.id,
          auth_created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (regError) {
      console.error('創建註冊申請失敗:', regError);
      // 不返回錯誤，因為 Auth 用戶已創建
    } else {
      console.log('註冊申請創建成功:', registrationRequest.id);
    }

    const result = {
      success: true,
      message: '註冊成功！請檢查您的 email 並點擊確認連結',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        email_confirmed_at: newUser.user.email_confirmed_at,
        created_at: newUser.user.created_at
      },
      registration_request: registrationRequest,
      email_sent: !emailError,
      next_steps: [
        '1. 檢查您的 email 並點擊確認連結',
        '2. 確認 email 後，您的帳號將出現在管理員審核列表中',
        '3. 管理員批准後，您就可以登入系統了'
      ]
    };

    console.log('註冊流程完成:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('註冊流程錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '註冊時發生錯誤'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 創建 Supabase Auth 用戶
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // 需要郵箱驗證
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('創建認證用戶失敗:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: '創建用戶失敗' },
        { status: 500 }
      );
    }

    // 創建 SAAS 用戶記錄
    const { error: saasError } = await supabase
      .from('saas_users')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        subscription_status: 'trial',
        usage_limit: 10,
        is_verified: false,
        verification_method: 'email'
      });

    if (saasError) {
      console.error('創建 SAAS 用戶失敗:', saasError);
      // 如果 SAAS 用戶創建失敗，嘗試清理認證用戶
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: '創建用戶記錄失敗' },
        { status: 500 }
      );
    }

    // 發送驗證郵件
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: password,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/aihome/auth/confirm`
      }
    });

    if (emailError) {
      console.error('發送驗證郵件失敗:', emailError);
      // 不返回錯誤，因為用戶已經創建成功
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName
        }
      }
    });

  } catch (error: any) {
    console.error('註冊 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

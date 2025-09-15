import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nickname, phone } = body;

    console.log('註冊請求參數:', { email, nickname, phone, passwordLength: password?.length });

    if (!email || !password || !nickname) {
      console.error('缺少必要參數:', { email: !!email, password: !!password, nickname: !!nickname });
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
        full_name: nickname,
        phone: phone || null
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
        full_name: nickname,
        phone: phone || null,
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
    try {
      const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aihome/auth/verification-success`,
        data: {
          full_name: nickname,
          phone: phone || null
        }
      });

      if (emailError) {
        console.error('發送驗證郵件失敗:', emailError);
        // 嘗試使用 generateLink 作為備用方案
        const { error: linkError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email: email,
          password: password,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aihome/auth/verification-success`
          }
        });
        
        if (linkError) {
          console.error('生成驗證鏈接失敗:', linkError);
        } else {
          console.log('驗證鏈接生成成功');
        }
      } else {
        console.log('驗證郵件發送成功');
      }
    } catch (emailError) {
      console.error('發送驗證郵件異常:', emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: nickname
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

import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nickname, phone } = body;

    console.log('簡化註冊請求參數:', { email, nickname, phone, passwordLength: password?.length });

    if (!email || !password || !nickname) {
      console.error('缺少必要參數:', { email: !!email, password: !!password, nickname: !!nickname });
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 檢查電話號碼是否已被使用
    if (phone) {
      const { data: existingPhone, error: phoneCheckError } = await supabase
        .from('saas_users')
        .select('id, email, full_name')
        .eq('phone', phone)
        .maybeSingle(); // 使用 maybeSingle 避免找不到記錄時的錯誤

      if (phoneCheckError) {
        console.error('檢查電話號碼失敗:', phoneCheckError);
        return NextResponse.json(
          { success: false, error: '檢查電話號碼時發生錯誤' },
          { status: 500 }
        );
      }

      if (existingPhone) {
        console.error('電話號碼已被使用:', { 
          phone, 
          existingUser: (existingPhone as any).email,
          existingName: (existingPhone as any).full_name 
        });
        return NextResponse.json(
          { success: false, error: '該電話號碼已註冊過，如需要請按忘記密碼' },
          { status: 400 }
        );
      }
    }

    // 創建 Supabase Auth 用戶（需要郵箱驗證）
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
        is_verified: false, // 需要郵箱驗證
        verification_method: 'email'
      } as any);

    if (saasError) {
      console.error('創建 SAAS 用戶失敗:', saasError);
      // 如果 SAAS 用戶創建失敗，嘗試清理認證用戶
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: '創建用戶記錄失敗' },
        { status: 500 }
      );
    }

    console.log('用戶創建成功:', authData.user.id);

    // 發送確認郵件（直接調用，不通過 HTTP）
    try {
      console.log('開始發送確認郵件:', { email, nickname });
      
      // 使用 inviteUserByEmail 發送確認郵件
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aihome/auth/verification-success`,
        data: {
          confirmation_email: true,
          nickname: nickname,
          email_type: 'confirmation'
        }
      });

      if (inviteError) {
        console.error('發送確認郵件失敗 (inviteUserByEmail):', inviteError);
        
        // 備用方案：使用 generateLink 生成鏈接
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email: email,
          password: password,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aihome/auth/verification-success`
          }
        });

        if (linkError) {
          console.error('生成確認鏈接失敗:', linkError);
        } else {
          console.log('確認鏈接生成成功 (備用方案):', linkData.properties?.action_link);
        }
      } else {
        console.log('確認郵件發送成功 (inviteUserByEmail)');
      }
    } catch (confirmationError) {
      console.error('發送確認郵件時發生錯誤:', confirmationError);
      // 不影響註冊流程，只記錄錯誤
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

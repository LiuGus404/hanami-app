import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log('測試 SMTP 郵件發送請求:', { email });

    if (!email) {
      return NextResponse.json(
        { success: false, error: '缺少郵箱地址' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 方法1: 使用 inviteUserByEmail 觸發 SMTP
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aihome/auth/verification-success`,
      data: {
        full_name: 'Test User',
        test_email: true
      }
    });

    if (inviteError) {
      console.error('邀請用戶郵件失敗:', inviteError);
      
      // 方法2: 使用 generateLink 並嘗試發送
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aihome/auth/verification-success`
        }
      });

      if (linkError) {
        console.error('生成驗證鏈接失敗:', linkError);
        return NextResponse.json(
          { success: false, error: '無法發送測試郵件' },
          { status: 500 }
        );
      }

      console.log('驗證鏈接生成成功:', linkData.properties?.action_link);
      
      return NextResponse.json({
        success: true,
        message: '驗證鏈接已生成（請手動發送）',
        verificationLink: linkData.properties?.action_link,
        method: 'generateLink'
      });
    }

    console.log('邀請郵件發送成功:', inviteData);
    return NextResponse.json({
      success: true,
      message: '測試郵件已通過 SMTP 發送',
      method: 'inviteUserByEmail',
      data: inviteData
    });

  } catch (error: any) {
    console.error('測試 SMTP API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


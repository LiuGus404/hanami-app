import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log('發送驗證郵件請求:', { email });

    if (!email) {
      return NextResponse.json(
        { success: false, error: '缺少郵箱地址' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 方法1: 使用 resend 發送驗證郵件
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aihome/auth/verification-success`
      }
    });

    if (resendError) {
      console.error('Resend 驗證郵件失敗:', resendError);
      
      // 方法2: 使用 generateLink 生成驗證鏈接
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
          { success: false, error: '無法發送驗證郵件' },
          { status: 500 }
        );
      }

      console.log('驗證鏈接生成成功:', linkData.properties?.action_link);
      
      // 這裡可以集成第三方郵件服務發送鏈接
      return NextResponse.json({
        success: true,
        message: '驗證鏈接已生成',
        verificationLink: linkData.properties?.action_link
      });
    }

    console.log('驗證郵件發送成功');
    return NextResponse.json({
      success: true,
      message: '驗證郵件已發送'
    });

  } catch (error: any) {
    console.error('發送驗證郵件 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


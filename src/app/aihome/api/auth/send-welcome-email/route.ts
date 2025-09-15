import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nickname } = body;

    console.log('發送歡迎郵件請求:', { email, nickname });

    if (!email || !nickname) {
      return NextResponse.json(
        { success: false, error: '缺少郵箱或暱稱' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 首先檢查用戶是否已存在（通過查詢 saas_users 表）
    const { data: existingUser, error: userCheckError } = await supabase
      .from('saas_users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (userCheckError && userCheckError.code !== 'PGRST116') {
      // PGRST116 表示沒有找到記錄，這是正常的
      console.error('檢查用戶存在性失敗:', userCheckError);
      return NextResponse.json(
        { success: false, error: '無法檢查用戶狀態' },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log('用戶已存在，跳過邀請郵件');
      return NextResponse.json({
        success: true,
        message: '用戶已存在，無需發送邀請郵件',
        method: 'user_exists'
      });
    }

    // 用戶不存在，嘗試發送邀請郵件
    try {
      const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aihome/dashboard`,
        data: {
          welcome_email: true,
          nickname: nickname,
          email_type: 'welcome'
        }
      });

      if (inviteError) {
        console.error('發送歡迎郵件失敗 (inviteUserByEmail):', inviteError);
        
        // 備用方案：使用 generateLink
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/aihome/dashboard`
          }
        });

        if (linkError) {
          console.error('生成歡迎鏈接失敗:', linkError);
          return NextResponse.json(
            { success: false, error: '無法發送歡迎郵件或生成鏈接' },
            { status: 500 }
          );
        }

        console.log('歡迎鏈接生成成功 (備用方案):', linkData.properties?.action_link);
        return NextResponse.json({
          success: true,
          message: '歡迎郵件發送失敗，但已生成歡迎鏈接',
          method: 'generateLink (fallback)',
          welcomeLink: linkData.properties?.action_link
        });
      }

      console.log('歡迎郵件發送成功 (inviteUserByEmail)');
      return NextResponse.json({
        success: true,
        message: '歡迎郵件已發送',
        method: 'inviteUserByEmail'
      });

    } catch (inviteError: any) {
      console.error('邀請郵件發送異常:', inviteError);
      return NextResponse.json(
        { success: false, error: `發送邀請郵件時發生錯誤: ${inviteError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('發送歡迎郵件 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: `API 錯誤: ${error.message}` },
      { status: 500 }
    );
  }
}

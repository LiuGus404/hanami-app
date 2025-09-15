import { NextRequest, NextResponse } from 'next/server';
import { createSaasClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSaasClient();

    // 獲取當前會話
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('獲取會話失敗:', sessionError);
      return NextResponse.json({
        success: false,
        error: '無法獲取會話',
        details: sessionError.message
      });
    }

    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: '用戶未登入',
        session: null
      });
    }

    // 獲取用戶資料
    const { data: userData, error: userError } = await supabase
      .from('saas_users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('獲取用戶資料失敗:', userError);
      return NextResponse.json({
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || 'Unknown'
        },
        session: session,
        warning: '無法獲取完整用戶資料'
      });
    }

    return NextResponse.json({
      success: true,
      user: userData,
      session: session,
      message: '認證狀態正常'
    });

  } catch (error: any) {
    console.error('檢查認證狀態 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 驗證用戶憑證
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('登入失敗:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: '登入失敗' },
        { status: 401 }
      );
    }

    // 獲取 SAAS 用戶信息
    const { data: saasUser, error: saasError } = await supabase
      .from('saas_users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (saasError) {
      console.error('獲取用戶信息失敗:', saasError);
      return NextResponse.json(
        { success: false, error: '獲取用戶信息失敗' },
        { status: 500 }
      );
    }

    // 更新最後登入時間
    await supabase
      .from('saas_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    return NextResponse.json({
      success: true,
      data: {
        user: saasUser,
        session: authData.session
      }
    });

  } catch (error: any) {
    console.error('登入 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

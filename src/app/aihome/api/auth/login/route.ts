import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('登入請求參數:', { email });

    if (!email || !password) {
      console.error('缺少必要參數:', { email: !!email, password: !!password });
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 使用 Supabase Auth 進行登入
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('登入失敗:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: '登入失敗' },
        { status: 500 }
      );
    }

    // 獲取用戶資料
    const { data: userData, error: userError } = await supabase
      .from('saas_users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('獲取用戶資料失敗:', userError);
      return NextResponse.json(
        { success: false, error: '獲取用戶資料失敗' },
        { status: 500 }
      );
    }

    console.log('登入成功:', authData.user.id);

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
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
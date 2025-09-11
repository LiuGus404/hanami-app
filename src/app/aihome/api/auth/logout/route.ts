import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();

    // 登出用戶
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('登出失敗:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '登出成功'
    });

  } catch (error: any) {
    console.error('登出 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

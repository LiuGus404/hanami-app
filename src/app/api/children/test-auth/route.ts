import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSaasClient } from '@/lib/supabase-saas';

// 測試認證狀態
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 開始測試認證狀態...');
    
    // 檢查環境變數
    const saasUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
    const saasServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY;
    const saasAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY;
    
    console.log('🔍 環境變數檢查:', {
      hasSaasUrl: !!saasUrl,
      hasSaasServiceKey: !!saasServiceKey,
      hasSaasAnonKey: !!saasAnonKey,
      saasUrl: saasUrl?.substring(0, 30) + '...'
    });

    // 嘗試獲取用戶認證
    const supabase = createSaasClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔍 認證結果:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });

    // 檢查 cookies
    const cookieStore = await cookies();
    const authCookies = cookieStore.getAll().filter(cookie =>
      cookie.name.includes('supabase') || cookie.name.includes('auth')
    );
    
    console.log('🔍 認證 Cookies:', authCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    })));

    return NextResponse.json({
      success: true,
      environment: {
        hasSaasUrl: !!saasUrl,
        hasSaasServiceKey: !!saasServiceKey,
        hasSaasAnonKey: !!saasAnonKey
      },
      auth: {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        authError: authError?.message
      }
    });
  } catch (error) {
    console.error('❌ 測試認證失敗:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知錯誤' 
    }, { status: 500 });
  }
}

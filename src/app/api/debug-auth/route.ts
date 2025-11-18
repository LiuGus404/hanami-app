import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSaasUserSession } from '@/lib/apiAuthUtils';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('[DEBUG AUTH] 所有 cookies:', allCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0,
      valuePreview: c.value?.substring(0, 100) || ''
    })));
    
    const session = await getSaasUserSession(request);
    
    return NextResponse.json({
      success: true,
      cookies: allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
      session: session ? {
        hasUser: !!session.user,
        userEmail: session.user?.email,
        userId: session.user?.id,
      } : null,
      message: session ? '成功獲取會話' : '無法獲取會話',
    });
  } catch (error) {
    console.error('[DEBUG AUTH] 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    }, { status: 500 });
  }
}


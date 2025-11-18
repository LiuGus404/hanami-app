import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getUserOrganizations } from '@/lib/organizationUtils';

/**
 * 獲取用戶所有機構身份的 API 端點
 * 使用服務角色 key 繞過 RLS，確保可以查詢機構身份
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: '缺少用戶識別信息：userId 或 userEmail' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const oldSupabase = getServerSupabaseClient();

    // 使用 getUserOrganizations 函數查詢機構身份
    const organizations = await getUserOrganizations(
      oldSupabase,
      userId || null,
      userEmail || null
    );

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error: any) {
    console.error('獲取用戶機構列表 API 錯誤:', error);
    return NextResponse.json(
      { error: error?.message || '獲取機構列表時發生錯誤' },
      { status: 500 }
    );
  }
}

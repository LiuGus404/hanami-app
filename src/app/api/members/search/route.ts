import { NextRequest, NextResponse } from 'next/server';
import { getSaasServerSupabaseClient } from '@/lib/supabase';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getSaasUserSession } from '@/lib/apiAuthUtils';

// 根據email搜尋用戶（從新Supabase的saas_users表）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const orgId = searchParams.get('orgId');

    if (!email) {
      return NextResponse.json({ error: '缺少 email 參數' }, { status: 400 });
    }

    if (!orgId) {
      return NextResponse.json({ error: '缺少 orgId 參數' }, { status: 400 });
    }

    // 從新 Supabase 獲取用戶會話（支持備選認證）
    let session = await getSaasUserSession(request);
    if (!session?.user?.email) {
      // 嘗試從 X-User-Email header 獲取
      const userEmailHeader = request.headers.get('X-User-Email');
      if (userEmailHeader) {
        session = {
          user: {
            email: userEmailHeader,
            id: '',
          },
        };
      } else {
        return NextResponse.json({ error: '未授權' }, { status: 401 });
      }
    }

    const saasSupabase = getSaasServerSupabaseClient();
    const oldSupabase = getServerSupabaseClient();
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json({ error: '無法獲取用戶郵箱' }, { status: 400 });
    }

    // 檢查用戶是否有權限管理該機構
    const { data: identityData } = await (oldSupabase as any)
      .from('hanami_org_identities')
      .select('role_type')
      .eq('org_id', orgId)
      .eq('user_email', userEmail)
      .eq('status', 'active')
      .single();

    const identity = identityData as { role_type: string } | null;

    const { data: admin } = await (oldSupabase as any)
      .from('hanami_admin')
      .select('role')
      .eq('org_id', orgId)
      .eq('admin_email', userEmail)
      .single();

    const isAuthorized = 
      (identity && ['owner', 'admin'].includes(identity.role_type)) ||
      (admin && (admin as any).role === 'admin');

    if (!isAuthorized) {
      return NextResponse.json({ error: '無權限管理該機構' }, { status: 403 });
    }

    // 從新Supabase搜尋用戶
    const { data: userData, error: userError } = await saasSupabase
      .from('saas_users')
      .select('id, email, full_name, phone, created_at')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ 
        success: false,
        error: '用戶不存在',
        user: null
      });
    }

    const user = userData as {
      id: string;
      email: string;
      full_name: string | null;
      phone: string | null;
      created_at: string;
    };

    // 檢查該用戶在該機構的身份
    const { data: existingIdentity } = await (oldSupabase as any)
      .from('hanami_org_identities')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_email', email)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        created_at: user.created_at,
      },
      existingIdentity: existingIdentity || null,
    });
  } catch (error) {
    console.error('搜尋用戶錯誤:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '搜尋用戶時發生錯誤' },
      { status: 500 }
    );
  }
}


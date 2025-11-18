import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getSaasUserSession } from '@/lib/apiAuthUtils';

// 更新成員身份
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { identityId, roleType, roleConfig, status, isPrimary } = body;

    if (!identityId) {
      return NextResponse.json({ error: '缺少 identityId 參數' }, { status: 400 });
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

    const oldSupabase = getServerSupabaseClient();
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json({ error: '無法獲取用戶郵箱' }, { status: 400 });
    }

    // 先獲取身份記錄以獲取org_id
    const { data: identityData } = await oldSupabase
      .from('hanami_org_identities')
      .select('org_id')
      .eq('id', identityId)
      .single();

    if (!identityData) {
      return NextResponse.json({ error: '身份記錄不存在' }, { status: 404 });
    }

    const identity = identityData as { org_id: string };

    // 檢查用戶是否有權限管理該機構
    const { data: userIdentity } = await oldSupabase
      .from('hanami_org_identities')
      .select('role_type')
      .eq('org_id', identity.org_id)
      .eq('user_email', userEmail)
      .eq('status', 'active')
      .single();

    const { data: admin } = await oldSupabase
      .from('hanami_admin')
      .select('role')
      .eq('org_id', identity.org_id)
      .eq('admin_email', userEmail)
      .single();

    const isAuthorized = 
      (userIdentity && ['owner', 'admin'].includes((userIdentity as any).role_type)) ||
      (admin && (admin as any).role === 'admin');

    if (!isAuthorized) {
      return NextResponse.json({ error: '無權限管理該機構' }, { status: 403 });
    }

    // 構建更新對象
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (roleType !== undefined) updates.role_type = roleType;
    if (roleConfig !== undefined) updates.role_config = roleConfig;
    if (status !== undefined) updates.status = status;
    if (isPrimary !== undefined) updates.is_primary = isPrimary;

    // 更新身份
    const { data, error } = await (oldSupabase as any)
      .from('hanami_org_identities')
      .update(updates)
      .eq('id', identityId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 如果設置為主要身份，將其他身份設為非主要
    if (isPrimary && (data as any).user_email) {
      await (oldSupabase as any)
        .from('hanami_org_identities')
        .update({ is_primary: false })
        .eq('org_id', identity.org_id)
        .eq('user_email', (data as any).user_email)
        .neq('id', identityId);
    }

    return NextResponse.json({
      success: true,
      identity: data,
    });
  } catch (error) {
    console.error('更新身份錯誤:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新身份時發生錯誤' },
      { status: 500 }
    );
  }
}


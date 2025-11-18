import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getSaasUserSession } from '@/lib/apiAuthUtils';

// 刪除成員身份
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identityId = searchParams.get('identityId');

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
      .select('org_id, role_type')
      .eq('id', identityId)
      .single();

    if (!identityData) {
      return NextResponse.json({ error: '身份記錄不存在' }, { status: 404 });
    }

    const identity = identityData as { org_id: string; role_type: string };

    // 不能刪除owner身份
    if (identity.role_type === 'owner') {
      return NextResponse.json({ error: '不能刪除創建者身份' }, { status: 400 });
    }

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

    // 刪除身份
    const { error } = await oldSupabase
      .from('hanami_org_identities')
      .delete()
      .eq('id', identityId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: '身份已刪除',
    });
  } catch (error) {
    console.error('刪除身份錯誤:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '刪除身份時發生錯誤' },
      { status: 500 }
    );
  }
}


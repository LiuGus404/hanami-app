import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getSaasUserSession } from '@/lib/apiAuthUtils';
import { randomBytes } from 'crypto';

// 創建邀請ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, roleType, roleConfig } = body;

    if (!orgId || !roleType) {
      return NextResponse.json(
        { error: '缺少必要參數：orgId, roleType' },
        { status: 400 }
      );
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

    // 檢查用戶是否有權限管理該機構
    const { data: identityData } = await oldSupabase
      .from('hanami_org_identities')
      .select('role_type')
      .eq('org_id', orgId)
      .eq('user_email', userEmail)
      .eq('status', 'active')
      .single();

    const identity = identityData as { role_type: string } | null;

    const { data: admin } = await oldSupabase
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

    // 生成邀請碼（16位隨機字符串）
    const invitationCode = randomBytes(8).toString('hex').toUpperCase();

    // 設置24小時後過期
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 創建邀請記錄
    const { data, error } = await (oldSupabase as any)
      .from('hanami_org_invitations')
      .insert({
        org_id: orgId,
        invitation_code: invitationCode,
        role_type: roleType,
        role_config: roleConfig || {},
        created_by: session.user.id || null,
        created_by_email: userEmail,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: data.id,
        invitation_code: data.invitation_code,
        role_type: data.role_type,
        expires_at: data.expires_at,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error('創建邀請錯誤:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '創建邀請時發生錯誤' },
      { status: 500 }
    );
  }
}


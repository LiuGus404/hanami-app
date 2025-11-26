import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getSaasServerSupabaseClient } from '@/lib/supabase';
import { getSaasUserSession } from '@/lib/apiAuthUtils';
import { randomUUID } from 'crypto';

// 驗證並使用邀請ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationCode } = body;

    if (!invitationCode) {
      return NextResponse.json({ error: '缺少 invitationCode 參數' }, { status: 400 });
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
    const saasSupabase = getSaasServerSupabaseClient();
    
    // 如果沒有 user.id，嘗試從 saas_users 表查詢
    if (!session.user.id && session.user.email) {
      const { data: saasUserData } = await saasSupabase
        .from('saas_users')
        .select('id')
        .eq('email', session.user.email)
        .single();
      
      const saasUser = saasUserData as { id: string } | null;
      if (saasUser) {
        session.user.id = saasUser.id;
      }
    }
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '無法獲取用戶 ID' }, { status: 401 });
    }

    // 查找邀請記錄
    const { data: invitationData, error: inviteError } = await ((oldSupabase as any)
      .from('hanami_org_invitations'))
      .select('*')
      .eq('invitation_code', invitationCode)
      .single();

    if (inviteError || !invitationData) {
      return NextResponse.json({ error: '邀請碼不存在' }, { status: 404 });
    }

    const invitation = invitationData as {
      id: string;
      org_id: string;
      is_used: boolean;
      expires_at: string;
      role_type: string;
      role_config: any;
      created_by: string | null;
    };

    // 檢查是否已使用
    if (invitation.is_used) {
      return NextResponse.json({ error: '邀請碼已使用' }, { status: 400 });
    }

    // 檢查是否過期
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: '邀請碼已過期' }, { status: 400 });
    }

    // 檢查用戶是否存在於新Supabase
    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: '無法獲取用戶郵箱' }, { status: 400 });
    }
    
    const { data: saasUser } = await saasSupabase
      .from('saas_users')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (!saasUser) {
      return NextResponse.json({ error: '用戶不存在於系統中' }, { status: 404 });
    }

    // 檢查是否已有身份記錄
    const { data: existingIdentity } = await ((oldSupabase as any)
      .from('hanami_org_identities'))
      .select('id')
      .eq('org_id', invitation.org_id)
      .eq('user_email', userEmail)
      .single();

    if (existingIdentity) {
      return NextResponse.json({ error: '您已擁有該機構的身份' }, { status: 400 });
    }

    // 創建身份記錄
    const { data: identity, error: identityError } = await (oldSupabase as any)
      .from('hanami_org_identities')
      .insert({
        id: randomUUID(),
        org_id: invitation.org_id,
        user_id: (saasUser as any).id,
        user_email: userEmail,
        role_type: invitation.role_type,
        role_config: invitation.role_config || {},
        status: 'active',
        is_primary: false,
        created_by: invitation.created_by,
      })
      .select()
      .single();

    if (identityError) {
      throw identityError;
    }

    // 標記邀請為已使用
    await (oldSupabase as any)
      .from('hanami_org_invitations')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        used_by: (saasUser as any).id,
        used_by_email: userEmail,
      })
      .eq('id', invitation.id);

    return NextResponse.json({
      success: true,
      identity,
      message: '成功加入機構',
    });
  } catch (error) {
    console.error('驗證邀請錯誤:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '驗證邀請時發生錯誤' },
      { status: 500 }
    );
  }
}


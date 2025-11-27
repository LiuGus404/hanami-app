import { NextRequest, NextResponse } from 'next/server';
import { getSaasServerSupabaseClient } from '@/lib/supabase';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getSaasUserSession } from '@/lib/apiAuthUtils';
import { randomUUID } from 'crypto';

// 設定用戶在機構的身份
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, userEmail, userId, roleType, roleConfig, isPrimary } = body;

    if (!orgId || !userEmail || !roleType) {
      return NextResponse.json(
        { error: '缺少必要參數：orgId, userEmail, roleType' },
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
    const currentUserEmail = session.user.email;

    if (!currentUserEmail) {
      return NextResponse.json({ error: '無法獲取用戶郵箱' }, { status: 400 });
    }

    // 檢查用戶是否有權限管理該機構（並行查詢以提高速度）
    const [identityResult, adminResult] = await Promise.all([
      (oldSupabase as any)
        .from('hanami_org_identities')
        .select('role_type')
        .eq('org_id', orgId)
        .eq('user_email', currentUserEmail)
        .eq('status', 'active')
        .maybeSingle(),
      (oldSupabase as any)
        .from('hanami_admin')
        .select('role')
        .eq('org_id', orgId)
        .eq('admin_email', currentUserEmail)
        .maybeSingle()
    ]);

    const identity = identityResult.data as { role_type: string } | null;
    const admin = adminResult.data as { role: string } | null;

    const isAuthorized = 
      (identity && ['owner', 'admin'].includes(identity.role_type)) ||
      (admin && admin.role === 'admin');

    if (!isAuthorized) {
      return NextResponse.json({ error: '無權限管理該機構' }, { status: 403 });
    }

    // 並行檢查用戶是否存在和是否已存在身份記錄
    const [userCheckResult, existingIdentityResult] = await Promise.all([
      userId ? (async () => {
        const saasSupabase = getSaasServerSupabaseClient();
        const { data: user } = await saasSupabase
          .from('saas_users')
          .select('id, email')
          .eq('id', userId)
          .eq('email', userEmail)
          .single();
        return user;
      })() : Promise.resolve(null),
      (oldSupabase as any)
        .from('hanami_org_identities')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_email', userEmail)
        .maybeSingle()
    ]);

    if (userId && !userCheckResult) {
      return NextResponse.json({ error: '用戶不存在' }, { status: 404 });
    }

    const existingIdentity = existingIdentityResult.data;

    if (existingIdentity) {
      // 更新現有身份
      const { data, error } = await (oldSupabase as any)
        .from('hanami_org_identities')
        .update({
          role_type: roleType,
          role_config: roleConfig || {},
          is_primary: isPrimary ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (existingIdentity as any).id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 如果設置為主要身份，將其他身份設為非主要（不等待完成，在后台執行）
      if (isPrimary) {
        (oldSupabase as any)
          .from('hanami_org_identities')
          .update({ is_primary: false })
          .eq('org_id', orgId)
          .eq('user_email', userEmail)
          .neq('id', (existingIdentity as any).id)
          .then(() => {
            // 后台完成，不阻塞响应
          })
          .catch((err: any) => {
            console.error('更新其他身份為非主要失敗:', err);
            // 不影響主流程，繼續返回成功
          });
      }

      return NextResponse.json({
        success: true,
        identity: data,
        action: 'updated',
      });
    } else {
      // 創建新身份
      const { data, error } = await (oldSupabase as any)
        .from('hanami_org_identities')
        .insert({
          id: randomUUID(),
          org_id: orgId,
          user_id: userId || null,
          user_email: userEmail,
          role_type: roleType,
          role_config: roleConfig || {},
          status: 'active',
          is_primary: isPrimary ?? false,
          created_by: session.user.id || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // 如果設置為主要身份，將其他身份設為非主要（不等待完成，在后台執行）
      if (isPrimary && userId) {
        (oldSupabase as any)
          .from('hanami_org_identities')
          .update({ is_primary: false })
          .eq('org_id', orgId)
          .eq('user_email', userEmail)
          .neq('id', (data as any).id)
          .then(() => {
            // 后台完成，不阻塞响应
          })
          .catch((err: any) => {
            console.error('更新其他身份為非主要失敗:', err);
            // 不影響主流程，繼續返回成功
          });
      }

      return NextResponse.json({
        success: true,
        identity: data,
        action: 'created',
      });
    }
  } catch (error) {
    console.error('設定身份錯誤:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '設定身份時發生錯誤' },
      { status: 500 }
    );
  }
}


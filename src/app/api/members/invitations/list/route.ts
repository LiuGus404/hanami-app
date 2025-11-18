import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getSaasUserSession } from '@/lib/apiAuthUtils';

// 獲取機構的邀請列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: '缺少 orgId 參數' }, { status: 400 });
    }

    // 從新 Supabase 獲取用戶會話
    console.log('[API /api/members/invitations/list] 開始獲取會話...');
    console.log('[API /api/members/invitations/list] 請求 URL:', request.url);
    console.log('[API /api/members/invitations/list] 請求 headers:', {
      authorization: request.headers.get('Authorization') ? '有' : '無',
      cookie: request.headers.get('Cookie') ? '有' : '無',
      userEmail: request.headers.get('X-User-Email') ? '有' : '無',
    });
    
    let session = await getSaasUserSession(request);
    console.log('[API /api/members/invitations/list] 會話結果:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
    });
    
    // 如果無法從會話獲取用戶，嘗試從 Authorization header 或查詢參數獲取 email
    if (!session?.user?.email) {
      console.log('[API /api/members/invitations/list] 嘗試備選認證方式...');
      
      // 方法 1: 從 X-User-Email header 獲取（如果前端傳遞了用戶 email）
      const authHeader = request.headers.get('X-User-Email');
      if (authHeader) {
        console.log('[API /api/members/invitations/list] 從 X-User-Email header 獲取 email:', authHeader);
        session = {
          user: {
            email: authHeader,
            id: '', // 暫時為空，後續可以從資料庫查詢
          },
        };
      } else {
        // 方法 2: 從查詢參數獲取（僅用於調試，生產環境應移除）
        const emailParam = searchParams.get('userEmail');
        if (emailParam) {
          console.log('[API /api/members/invitations/list] 從查詢參數獲取 email:', emailParam);
          session = {
            user: {
              email: emailParam,
              id: '',
            },
          };
        }
      }
    }
    
    if (!session?.user?.email) {
      console.error('[API /api/members/invitations/list] ❌ 未授權：無法獲取用戶會話');
      // 調試：列出所有 cookies
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      console.log('[API /api/members/invitations/list] 所有 cookies:', allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })));
      return NextResponse.json({ error: '未授權：無法獲取用戶會話' }, { status: 401 });
    }

    const oldSupabase = getServerSupabaseClient();
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json({ error: '無法獲取用戶郵箱' }, { status: 400 });
    }

    // 檢查用戶是否有權限管理該機構
    console.log('[API /api/members/invitations/list] 檢查權限，orgId:', orgId, 'userEmail:', userEmail);
    
    const { data: identityData, error: identityError } = await oldSupabase
      .from('hanami_org_identities')
      .select('role_type')
      .eq('org_id', orgId)
      .eq('user_email', userEmail)
      .eq('status', 'active')
      .maybeSingle();

    const identity = identityData as { role_type: string } | null;

    console.log('[API /api/members/invitations/list] 身份查詢結果:', {
      hasIdentity: !!identity,
      roleType: identity?.role_type,
      error: identityError?.message,
    });

    const { data: admin, error: adminError } = await oldSupabase
      .from('hanami_admin')
      .select('role')
      .eq('org_id', orgId)
      .eq('admin_email', userEmail)
      .maybeSingle();

    console.log('[API /api/members/invitations/list] 管理員查詢結果:', {
      hasAdmin: !!admin,
      role: (admin as any)?.role,
      error: adminError?.message,
    });

    const isAuthorized = 
      (identity && ['owner', 'admin'].includes(identity.role_type)) ||
      (admin && (admin as any).role === 'admin');

    console.log('[API /api/members/invitations/list] 權限檢查結果:', {
      isAuthorized,
      hasIdentity: !!identity,
      hasAdmin: !!admin,
    });

    if (!isAuthorized) {
      console.warn('[API /api/members/invitations/list] ❌ 無權限管理該機構');
      return NextResponse.json({ 
        error: '無權限管理該機構',
        details: {
          userEmail: userEmail,
          orgId,
          hasIdentity: !!identity,
          hasAdmin: !!admin,
          identityRole: identity?.role_type,
          adminRole: (admin as any)?.role,
        }
      }, { status: 403 });
    }

    // 獲取邀請列表
    const { data: invitations, error } = await oldSupabase
      .from('hanami_org_invitations')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      invitations: invitations || [],
    });
  } catch (error) {
    console.error('獲取邀請列表錯誤:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '獲取邀請列表時發生錯誤' },
      { status: 500 }
    );
  }
}


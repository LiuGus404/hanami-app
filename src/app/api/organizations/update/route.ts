import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * PUT /api/organizations/update
 * 更新機構資訊（使用服務角色 key 繞過 RLS）
 * 
 * 請求體：
 * {
 *   "orgId": "uuid",
 *   "userEmail": "user@example.com",
 *   "updates": {
 *     "org_name": "...",
 *     "contact_phone": "...",
 *     "contact_email": "...",
 *     "settings": {...}
 *   }
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, userEmail, updates } = body;

    if (!orgId) {
      return NextResponse.json(
        { error: '缺少 orgId 參數' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: '缺少 updates 參數' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabase = getServerSupabaseClient();

    // 驗證用戶是否有權限更新該機構（必須是 owner 或 admin）
    if (userEmail) {
      const { data: identityData, error: identityError } = await ((supabase as any)
        .from('hanami_org_identities')
        .select('role_type, status')
        .eq('org_id', orgId)
        .eq('user_email', userEmail)
        .eq('status', 'active')
        .maybeSingle());

      const identity = identityData as { role_type: string; status: string } | null;

      if (identityError) {
        console.error('API: 檢查機構身份錯誤', identityError);
        return NextResponse.json(
          { error: '權限驗證失敗' },
          { status: 500 }
        );
      }

      // 檢查是否為 owner 或 admin
      if (!identity || (identity.role_type !== 'owner' && identity.role_type !== 'admin')) {
        // 檢查是否為管理員
        const { data: admin, error: adminError } = await ((supabase as any)
          .from('hanami_admin')
          .select('admin_email, org_id')
          .eq('admin_email', userEmail)
          .eq('org_id', orgId)
          .maybeSingle());

        if (adminError || !admin) {
          return NextResponse.json(
            { error: '您沒有權限更新該機構' },
            { status: 403 }
          );
        }
      }
    }

    // 檢查機構名稱唯一性（排除當前機構）
    if (updates.org_name) {
      const { data: existingOrgs, error: checkError } = await supabase
        .from('hanami_organizations')
        .select('id, org_name')
        .neq('id', orgId)
        .eq('org_name', updates.org_name);

      if (checkError) {
        console.error('API: 檢查機構名稱錯誤', checkError);
        return NextResponse.json(
          { error: '檢查機構名稱時發生錯誤' },
          { status: 500 }
        );
      }

      if (existingOrgs && existingOrgs.length > 0) {
        return NextResponse.json(
          { error: '此機構名稱已被使用，請選擇其他名稱' },
          { status: 400 }
        );
      }
    }

    // 更新機構資訊
    const { data, error } = await (supabase as any)
      .from('hanami_organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .single();

    if (error) {
      console.error('API: 更新機構資訊錯誤', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('API: 更新機構資訊異常', error);
    return NextResponse.json(
      { error: error?.message || '更新機構資訊時發生錯誤' },
      { status: 500 }
    );
  }
}


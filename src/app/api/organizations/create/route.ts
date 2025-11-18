import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getServerSupabaseClient } from '@/lib/supabase';
import { getSaasServerSupabaseClient } from '@/lib/supabase';

/**
 * 創建新機構的 API 端點
 * 使用服務角色 key 繞過 RLS，確保可以創建機構
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orgName,
      orgSlug,
      contactPhone,
      contactEmail,
      settings,
      userId,
      userEmail,
      createdBy,
    } = body;

    if (!orgName || !orgSlug) {
      return NextResponse.json(
        { error: '缺少必要參數：orgName, orgSlug' },
        { status: 400 }
      );
    }

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: '缺少用戶識別信息：userId 或 userEmail' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const oldSupabase = getServerSupabaseClient();
    const newSupabase = getSaasServerSupabaseClient();

    const newOrgId = randomUUID();

    // 1. 在舊 Supabase 中創建機構
    const { data: oldOrgData, error: oldOrgError } = await (oldSupabase as any)
      .from('hanami_organizations')
      .insert({
        id: newOrgId,
        org_name: orgName.trim(),
        org_slug: orgSlug,
        status: 'active',
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        settings: settings || {},
        created_by: createdBy || userId || null,
      })
      .select('id, org_name, org_slug, status')
      .single();

    if (oldOrgError) {
      console.error('在舊 Supabase 中創建機構失敗:', oldOrgError);
      return NextResponse.json(
        { error: `創建機構失敗: ${oldOrgError.message}` },
        { status: 500 }
      );
    }

    // 2. 在新 Supabase 中創建機構（如果需要的話）
    // 注意：新 Supabase 的 hanami_organizations 表沒有 created_by 欄位
    const { data: newOrgData, error: newOrgError } = await (newSupabase as any)
      .from('hanami_organizations')
      .insert({
        id: newOrgId,
        org_name: orgName.trim(),
        org_slug: orgSlug,
        status: 'active',
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        settings: settings || {},
      })
      .select('id, org_name, org_slug, status')
      .single();

    // 如果新 Supabase 創建失敗，記錄錯誤但不阻止整個流程
    if (newOrgError) {
      console.warn('在新 Supabase 中創建機構失敗（非關鍵）:', newOrgError);
      // 繼續執行，因為舊 Supabase 的機構已經創建成功
    }

    // 3. 在舊 Supabase 的 hanami_org_identities 中創建 owner 身份
    if (userEmail) {
      const { error: identityError } = await (oldSupabase as any)
        .from('hanami_org_identities')
        .insert({
          org_id: newOrgId,
          user_id: userId || null,
          user_email: userEmail,
          role_type: 'owner',
          status: 'active',
          is_primary: true,
          created_by: createdBy || userId || null,
        });

      if (identityError) {
        console.warn('創建身份記錄失敗（非關鍵）:', identityError);
        // 繼續執行
      }
    }

    // 4. 在新 Supabase 的 hanami_user_organizations 中創建 owner 身份
    const { error: membershipError } = await (newSupabase as any)
      .from('hanami_user_organizations')
      .insert({
        user_email: userEmail || null,
        user_id: userId || null,
        org_id: newOrgId,
        role: 'owner',
        is_primary: true,
      });

    if (membershipError) {
      console.warn('創建成員記錄失敗（非關鍵）:', membershipError);
      // 繼續執行
    }

    // 5. 將其他現有成員身份標記為非主要（在新 Supabase）
    if (userEmail) {
      await (newSupabase as any)
        .from('hanami_user_organizations')
        .update({ is_primary: false })
        .eq('user_email', userEmail)
        .neq('org_id', newOrgId);
    }
    if (userId) {
      await (newSupabase as any)
        .from('hanami_user_organizations')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .neq('org_id', newOrgId);
    }

    // 6. 將舊 Supabase 中其他身份標記為非主要（如果有）
    if (userEmail) {
      await (oldSupabase as any)
        .from('hanami_org_identities')
        .update({ is_primary: false })
        .eq('user_email', userEmail)
        .neq('org_id', newOrgId);
    }

    // 返回創建的機構信息
    return NextResponse.json({
      success: true,
      data: {
        id: oldOrgData.id,
        name: oldOrgData.org_name,
        slug: oldOrgData.org_slug,
        status: oldOrgData.status ?? 'active',
      },
    });
  } catch (error: any) {
    console.error('創建機構 API 錯誤:', error);
    return NextResponse.json(
      { error: error?.message || '創建機構時發生錯誤' },
      { status: 500 }
    );
  }
}


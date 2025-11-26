import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/organizations/get
 * 獲取機構資訊（使用服務角色 key 繞過 RLS）
 * 
 * 查詢參數：
 * - orgId: 機構 ID（必需）
 * - userEmail: 用戶 email（用於權限驗證）
 * - bySlug: 是否使用 slug 查詢（可選，默認為 false）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const orgSlug = searchParams.get('orgSlug');
    const userEmail = searchParams.get('userEmail');
    const bySlug = searchParams.get('bySlug') === 'true';

    if (!orgId && !orgSlug) {
      return NextResponse.json(
        { error: '缺少 orgId 或 orgSlug 參數' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabase = getServerSupabaseClient();

    // 先查詢機構是否存在
    let orgQuery = supabase
      .from('hanami_organizations')
      .select('id')
      .limit(1);
    
    if (bySlug && orgSlug) {
      orgQuery = orgQuery.eq('org_slug', orgSlug);
    } else if (orgId) {
      orgQuery = orgQuery.eq('id', orgId);
    }

    const { data: orgCheckData, error: orgCheckError } = await orgQuery.maybeSingle();

    if (orgCheckError || !orgCheckData) {
      return NextResponse.json(
        { error: '機構不存在' },
        { status: 404 }
      );
    }

    const orgCheck = orgCheckData as { id: string };
    const actualOrgId = orgCheck.id;

    // 驗證用戶是否有權限訪問該機構（僅在提供 userEmail 時檢查）
    if (userEmail) {
      // 檢查用戶是否有權限
      const { data: identityData, error: identityError } = await ((supabase as any)
        .from('hanami_org_identities'))
        .select('role_type, status')
        .eq('org_id', actualOrgId)
        .eq('user_email', userEmail)
        .eq('status', 'active')
        .maybeSingle();

      const identity = identityData as { role_type: string; status: string } | null;

      if (identityError) {
        console.error('API: 檢查機構身份錯誤', identityError);
        // 不返回錯誤，繼續查詢（允許公開訪問）
      }

      if (!identity) {
        const { data: employee, error: employeeError } = await ((supabase as any)
          .from('hanami_employee'))
          .select('teacher_email, teacher_status, org_id')
          .eq('teacher_email', userEmail)
          .eq('org_id', actualOrgId)
          .maybeSingle();

        // 如果既不是身份成員也不是員工，仍然允許查詢（用於加入機構流程）
        // 但可以記錄日誌
        if (employeeError || !employee) {
          console.log('API: 用戶不是機構成員，但允許查詢（用於加入機構）');
        }
      }
    }

    // 查詢機構資訊（使用 actualOrgId）
    const { data, error } = await supabase
      .from('hanami_organizations')
      .select('*')
      .eq('id', actualOrgId)
      .maybeSingle();

    if (error) {
      console.error('API: 查詢機構資訊錯誤', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: '機構不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('API: 查詢機構資訊異常', error);
    return NextResponse.json(
      { error: error?.message || '查詢機構資訊時發生錯誤' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/teaching-activities/list
 * 獲取教學活動列表（使用服務角色 key 繞過 RLS）
 * 
 * 查詢參數：
 * - orgId: 機構 ID（必需）
 * - userEmail: 用戶 email（用於權限驗證）
 * - activityType: 活動類型（可選）
 * - category: 分類（可選）
 * - status: 狀態（可選，默認為 'published'）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const userEmail = searchParams.get('userEmail');
    const activityType = searchParams.get('activityType');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'published';

    if (!orgId) {
      return NextResponse.json(
        { error: '缺少 orgId 參數' },
        { status: 400 }
      );
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabase = getServerSupabaseClient();

    // 驗證用戶是否有權限訪問該機構
    if (userEmail) {
      const { data: identity, error: identityError } = await supabase
        .from('hanami_org_identities')
        .select('role_type, status')
        .eq('org_id', orgId)
        .eq('user_email', userEmail)
        .eq('status', 'active')
        .maybeSingle();

      if (identityError) {
        console.error('API: 檢查機構身份錯誤', identityError);
        return NextResponse.json(
          { error: '權限驗證失敗' },
          { status: 500 }
        );
      }

      if (!identity) {
        const { data: employee, error: employeeError } = await supabase
          .from('hanami_employee')
          .select('teacher_email, teacher_status, org_id')
          .eq('teacher_email', userEmail)
          .eq('org_id', orgId)
          .maybeSingle();

        if (employeeError || !employee) {
          return NextResponse.json(
            { error: '您沒有權限訪問該機構的教學活動' },
            { status: 403 }
          );
        }
      }
    }

    // 構建查詢
    let query = supabase
      .from('hanami_teaching_activities')
      .select('*')
      .eq('org_id', orgId);

    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // 注意：status 參數是可選的，如果沒有提供則不過濾狀態
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('API: 查詢教學活動列表錯誤', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('API: 查詢教學活動列表異常', error);
    return NextResponse.json(
      { error: error?.message || '查詢教學活動列表時發生錯誤' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/organizations/stats
 * 獲取機構統計資訊（like count, review count）（使用服務角色 key 繞過 RLS）
 * 
 * 查詢參數：
 * - orgIds: 機構 ID 列表（逗號分隔）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgIdsParam = searchParams.get('orgIds');

    if (!orgIdsParam) {
      return NextResponse.json(
        { error: '缺少 orgIds 參數' },
        { status: 400 }
      );
    }

    const orgIds = orgIdsParam.split(',').filter(id => id.trim());

    if (orgIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {},
      });
    }

    // 使用服務端客戶端（繞過 RLS）
    const supabase = getServerSupabaseClient();

    // 獲取 like counts
    const { data: likeCounts, error: likeError } = await ((supabase as any)
      .from('hanami_org_likes'))
      .select('org_id')
      .in('org_id', orgIds);

    if (likeError) {
      console.error('API: 查詢機構點讚錯誤', likeError);
    }

    const likeCountMap: Record<string, number> = {};
    if (likeCounts) {
      likeCounts.forEach((like: any) => {
        likeCountMap[like.org_id] = (likeCountMap[like.org_id] || 0) + 1;
      });
    }

    // 獲取 review counts（嘗試查詢 hanami_org_reviews）
    const { data: reviews, error: reviewError } = await ((supabase as any)
      .from('hanami_org_reviews'))
      .select('org_id, status')
      .in('org_id', orgIds)
      .eq('status', 'active');

    if (reviewError) {
      console.error('API: 查詢機構評論錯誤', reviewError);
    }

    const reviewCountMap: Record<string, number> = {};
    if (reviews) {
      reviews.forEach((review: any) => {
        reviewCountMap[review.org_id] = (reviewCountMap[review.org_id] || 0) + 1;
      });
    }

    // 構建結果
    const stats: Record<string, { likeCount: number; reviewCount: number }> = {};
    orgIds.forEach(orgId => {
      stats[orgId] = {
        likeCount: likeCountMap[orgId] || 0,
        reviewCount: reviewCountMap[orgId] || 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('API: 查詢機構統計異常', error);
    return NextResponse.json(
      { error: error?.message || '查詢機構統計時發生錯誤' },
      { status: 500 }
    );
  }
}


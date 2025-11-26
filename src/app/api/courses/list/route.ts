import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/courses/list
 * 獲取課程列表（使用服務角色 key 繞過 RLS）
 * 
 * 查詢參數：
 * - orgId: 機構 ID（可選）
 * - status: 課程狀態（可選，默認為 true）
 * - limit: 限制數量（可選）
 * - offset: 偏移量（可選）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : null;

    // 使用服務端客戶端（繞過 RLS）
    const supabase = getServerSupabaseClient();

    // 構建查詢
    let query = (supabase as any)
      .from('Hanami_CourseTypes')
      .select('id, name, description, duration_minutes, difficulty_level, max_students, price_per_lesson, images, status, org_id, discount_configs, min_age, max_age, display_order')
      .order('display_order', { ascending: true });

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    if (status !== null && status !== undefined) {
      // 如果 status 是 'true' 字符串，轉換為 boolean
      if (status === 'true') {
        query = query.eq('status', true);
      } else if (status === 'false') {
        query = query.eq('status', false);
      } else {
        query = query.eq('status', status);
      }
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('API: 查詢課程列表錯誤', error);
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
    console.error('API: 查詢課程列表異常', error);
    return NextResponse.json(
      { error: error?.message || '查詢課程列表時發生錯誤' },
      { status: 500 }
    );
  }
}


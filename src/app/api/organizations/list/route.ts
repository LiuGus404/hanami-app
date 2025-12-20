import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/organizations/list
 * 獲取機構列表（使用服務角色 key 繞過 RLS）
 * 
 * 查詢參數：
 * - status: 機構狀態（可選，默認為 'active'）
 * - isPublic: 是否只返回公開機構（可選，'true' 只返回公開機構）
 * - limit: 限制數量（可選）
 * - offset: 偏移量（可選）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const isPublic = searchParams.get('isPublic');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : null;

    // 使用服務端客戶端（繞過 RLS）
    const supabase = getServerSupabaseClient();

    // 構建查詢
    let query = supabase
      .from('hanami_organizations')
      .select('id, org_name, org_slug, status, contact_phone, contact_email, settings, created_at, is_public')
      .order('org_name', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 只返回公開機構
    if (isPublic === 'true') {
      query = query.eq('is_public', true);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('API: 查詢機構列表錯誤', error);
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
    console.error('API: 查詢機構列表異常', error);
    return NextResponse.json(
      { error: error?.message || '查詢機構列表時發生錯誤' },
      { status: 500 }
    );
  }
}


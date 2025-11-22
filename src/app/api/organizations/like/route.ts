import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('API /api/organizations/like requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const buildResponse = async (orgId: string, userId?: string | null) => {
  const { count, error: countError } = await supabase
    .from('hanami_org_likes')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  if (countError) throw countError;

  let likedByMe = false;
  if (userId) {
    const { data, error: existsError } = await supabase
      .from('hanami_org_likes')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existsError) throw existsError;
    likedByMe = !!data?.id;
  }

  return { totalLikes: count ?? 0, likedByMe };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const userId = searchParams.get('userId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    const state = await buildResponse(orgId, userId || null);
    return NextResponse.json({
      orgId,
      userId,
      ...state,
    });
  } catch (error: any) {
    console.error('API /api/organizations/like 失敗:', error);
    return NextResponse.json({
      error: error?.message || 'Like 操作失敗',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, userId } = body || {};

    if (!orgId || !userId) {
      return NextResponse.json({ error: 'orgId and userId are required' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('hanami_org_likes')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      console.error('hanami_org_likes 查詢失敗:', existingError);
      throw existingError;
    }

    if (existing?.id) {
      const { error: deleteError } = await supabase
        .from('hanami_org_likes')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('hanami_org_likes 移除失敗:', deleteError);
        throw deleteError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('hanami_org_likes')
        .insert({ org_id: orgId, user_id: userId });

      if (insertError) {
        console.error('hanami_org_likes 插入失敗:', insertError);
        throw insertError;
      }
    }

    const state = await buildResponse(orgId, userId);
    return NextResponse.json({
      orgId,
      userId,
      ...state,
    });
  } catch (error: any) {
    console.error('API /api/organizations/like 失敗:', error);
    return NextResponse.json({
      error: error?.message || 'Like 操作失敗',
    }, { status: 500 });
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('API /api/courses/like requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const buildResponse = async (courseId: string, userId?: string | null) => {
  const { count, error: countError } = await supabase
    .from('hanami_course_likes')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  if (countError) throw countError;

  let likedByMe = false;
  if (userId) {
    const { data, error: existError } = await supabase
      .from('hanami_course_likes')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existError) throw existError;
    likedByMe = !!data?.id;
  }

  return { totalLikes: count ?? 0, likedByMe };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const state = await buildResponse(courseId, userId || null);
    return NextResponse.json({
      courseId,
      userId,
      ...state
    });
  } catch (error: any) {
    console.error('API /api/courses/like 失敗:', error);
    return NextResponse.json({
      error: error?.message || 'Like 操作失敗'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, userId } = body || {};

    if (!courseId || !userId) {
      return NextResponse.json({ error: 'courseId and userId are required' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('hanami_course_likes')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      console.error('hanami_course_likes 查詢失敗:', existingError);
      throw existingError;
    }

    if (existing?.id) {
      const { error: deleteError } = await supabase
        .from('hanami_course_likes')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('hanami_course_likes 刪除失敗:', deleteError);
        throw deleteError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('hanami_course_likes')
        .insert({ course_id: courseId, user_id: userId });

      if (insertError) {
        console.error('hanami_course_likes 插入失敗:', insertError);
        throw insertError;
      }
    }

    const state = await buildResponse(courseId, userId);
    return NextResponse.json({
      courseId,
      userId,
      ...state
    });
  } catch (error: any) {
    console.error('API /api/courses/like 失敗:', error);
    return NextResponse.json({
      error: error?.message || 'Like 操作失敗'
    }, { status: 500 });
  }
}


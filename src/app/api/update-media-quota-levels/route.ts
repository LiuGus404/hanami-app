import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 service_role_key 繞過 RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 更新基礎版的配額設定
    const { error: updateError } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .update({
        video_size_limit_mb: 20,
        photo_size_limit_mb: 1,
        updated_at: new Date().toISOString()
      })
      .eq('level_name', '基礎版');

    if (updateError) {
      console.error('更新基礎版配額失敗:', updateError);
      return NextResponse.json(
        { error: '更新基礎版配額失敗', details: updateError },
        { status: 500 }
      );
    }

    // 驗證更新結果
    const { data: updatedLevel, error: selectError } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .select('*')
      .eq('level_name', '基礎版')
      .single();

    if (selectError) {
      console.error('驗證更新結果失敗:', selectError);
      return NextResponse.json(
        { error: '驗證更新結果失敗', details: selectError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '媒體配額等級更新成功',
      data: {
        level_name: updatedLevel.level_name,
        video_size_limit_mb: updatedLevel.video_size_limit_mb,
        photo_size_limit_mb: updatedLevel.photo_size_limit_mb,
        video_limit: updatedLevel.video_limit,
        photo_limit: updatedLevel.photo_limit
      }
    });

  } catch (error) {
    console.error('更新媒體配額等級錯誤:', error);
    return NextResponse.json(
      { error: '更新媒體配額等級失敗', details: error },
      { status: 500 }
    );
  }
} 
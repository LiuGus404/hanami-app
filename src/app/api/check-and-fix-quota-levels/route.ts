import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 service_role_key 繞過 RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 1. 檢查當前配額等級設定
    const { data: currentLevels, error: selectError } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .select('*')
      .order('storage_limit_mb', { ascending: true });

    if (selectError) {
      console.error('獲取配額等級失敗:', selectError);
      return NextResponse.json(
        { error: '獲取配額等級失敗', details: selectError },
        { status: 500 }
      );
    }

    console.log('當前配額等級:', currentLevels);

    // 2. 檢查基礎版設定是否正確
    const basicLevel = currentLevels?.find(level => level.level_name === '基礎版');
    let needsUpdate = false;
    let updateDetails = [];

    if (!basicLevel) {
      needsUpdate = true;
      updateDetails.push('基礎版配額等級不存在');
    } else {
      if (basicLevel.video_size_limit_mb !== 20) {
        needsUpdate = true;
        updateDetails.push(`影片大小限制不正確: ${basicLevel.video_size_limit_mb}MB (應該是 20MB)`);
      }
      if (basicLevel.photo_size_limit_mb !== 1) {
        needsUpdate = true;
        updateDetails.push(`相片大小限制不正確: ${basicLevel.photo_size_limit_mb}MB (應該是 1MB)`);
      }
      if (basicLevel.video_limit !== 5) {
        needsUpdate = true;
        updateDetails.push(`影片數量限制不正確: ${basicLevel.video_limit}個 (應該是 5個)`);
      }
      if (basicLevel.photo_limit !== 10) {
        needsUpdate = true;
        updateDetails.push(`相片數量限制不正確: ${basicLevel.photo_limit}張 (應該是 10張)`);
      }
    }

    // 3. 如果需要更新，執行更新
    if (needsUpdate) {
      console.log('需要更新配額等級設定:', updateDetails);

      // 如果基礎版不存在，創建它
      if (!basicLevel) {
        const { error: insertError } = await supabaseAdmin
          .from('hanami_media_quota_levels')
          .insert({
            level_name: '基礎版',
            video_limit: 5,
            photo_limit: 10,
            storage_limit_mb: 250,
            video_size_limit_mb: 20,
            photo_size_limit_mb: 1,
            description: '適合新學生的基礎方案，提供基本的媒體上傳功能',
            is_active: true
          });

        if (insertError) {
          console.error('創建基礎版配額等級失敗:', insertError);
          return NextResponse.json(
            { error: '創建基礎版配額等級失敗', details: insertError },
            { status: 500 }
          );
        }
      } else {
        // 更新現有的基礎版設定
        const { error: updateError } = await supabaseAdmin
          .from('hanami_media_quota_levels')
          .update({
            video_limit: 5,
            photo_limit: 10,
            video_size_limit_mb: 20,
            photo_size_limit_mb: 1,
            updated_at: new Date().toISOString()
          })
          .eq('level_name', '基礎版');

        if (updateError) {
          console.error('更新基礎版配額等級失敗:', updateError);
          return NextResponse.json(
            { error: '更新基礎版配額等級失敗', details: updateError },
            { status: 500 }
          );
        }
      }

      // 4. 重新獲取更新後的設定
      const { data: updatedLevels, error: updatedSelectError } = await supabaseAdmin
        .from('hanami_media_quota_levels')
        .select('*')
        .order('storage_limit_mb', { ascending: true });

      if (updatedSelectError) {
        console.error('獲取更新後的配額等級失敗:', updatedSelectError);
        return NextResponse.json(
          { error: '獲取更新後的配額等級失敗', details: updatedSelectError },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '配額等級設定已更新',
        updated: true,
        updateDetails,
        currentLevels: updatedLevels
      });
    } else {
      return NextResponse.json({
        success: true,
        message: '配額等級設定已正確',
        updated: false,
        currentLevels
      });
    }

  } catch (error) {
    console.error('檢查和修復配額等級錯誤:', error);
    return NextResponse.json(
      { error: '檢查和修復配額等級失敗', details: error },
      { status: 500 }
    );
  }
} 
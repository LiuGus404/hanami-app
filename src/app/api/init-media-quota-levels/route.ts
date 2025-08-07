import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 service_role_key 繞過 RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 檢查資料表是否存在
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .select('count')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      // 資料表不存在，返回錯誤提示
      return NextResponse.json({
        error: '資料表不存在',
        message: '請先在Supabase SQL編輯器中執行以下SQL腳本：',
        sql: `
-- 創建媒體配額等級表
CREATE TABLE IF NOT EXISTS public.hanami_media_quota_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_name TEXT NOT NULL UNIQUE,
  video_limit INTEGER NOT NULL DEFAULT 5,
  photo_limit INTEGER NOT NULL DEFAULT 10,
  storage_limit_mb INTEGER NOT NULL DEFAULT 250,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_media_quota_levels_active ON public.hanami_media_quota_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_media_quota_levels_storage ON public.hanami_media_quota_levels(storage_limit_mb);

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_media_quota_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_media_quota_levels_updated_at
  BEFORE UPDATE ON hanami_media_quota_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_media_quota_levels_updated_at();
        `
      }, { status: 404 });
    }

    // 插入預設配額等級
    const { error: insertError } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .upsert([
        {
          level_name: '基礎版',
          video_limit: 5,
          photo_limit: 10,
          storage_limit_mb: 250,
          description: '適合新學生的基礎方案，提供基本的媒體上傳功能',
          is_active: true,
        },
        {
          level_name: '標準版',
          video_limit: 20,
          photo_limit: 50,
          storage_limit_mb: 1500,
          description: '適合一般學習需求，提供充足的媒體配額',
          is_active: true,
        },
        {
          level_name: '進階版',
          video_limit: 50,
          photo_limit: 100,
          storage_limit_mb: 5000,
          description: '適合進階學習需求，提供大量媒體配額',
          is_active: true,
        },
        {
          level_name: '專業版',
          video_limit: 100,
          photo_limit: 200,
          storage_limit_mb: 10240,
          description: '適合專業學習需求，提供最大媒體配額',
          is_active: true,
        }
      ], {
        onConflict: 'level_name',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.error('插入預設資料失敗:', insertError);
      return NextResponse.json(
        { error: '插入預設資料失敗', details: insertError },
        { status: 500 }
      );
    }

    // 驗證資料是否創建成功
    const { data: levels, error: selectError } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .select('*')
      .order('storage_limit_mb', { ascending: true });

    if (selectError) {
      console.error('驗證資料失敗:', selectError);
      return NextResponse.json(
        { error: '驗證資料失敗', details: selectError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '媒體配額等級表初始化成功',
      data: levels,
      count: levels?.length || 0
    });

  } catch (error) {
    console.error('初始化配額等級表錯誤:', error);
    return NextResponse.json(
      { error: '初始化配額等級表失敗', details: error },
      { status: 500 }
    );
  }
} 
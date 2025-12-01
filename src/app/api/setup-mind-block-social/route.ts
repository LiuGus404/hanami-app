import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: '請在 Supabase SQL 編輯器中執行以下 SQL 以建立評價與按讚功能所需的資料表：',
    sql: `
-- 1. 建立按讚表 (Mind Block Likes)
CREATE TABLE IF NOT EXISTS public.mind_block_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mind_block_id UUID NOT NULL REFERENCES public.mind_blocks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mind_block_id)
);

-- 啟用 RLS
ALTER TABLE public.mind_block_likes ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 策略 (參考 docs/rls-hanami-saas-system.md)
-- 允許所有人查看按讚
DROP POLICY IF EXISTS "Public can view likes" ON public.mind_block_likes;
CREATE POLICY "Public can view likes" ON public.mind_block_likes
  FOR SELECT USING (true);

-- 允許認證用戶按讚
DROP POLICY IF EXISTS "Authenticated users can insert likes" ON public.mind_block_likes;
CREATE POLICY "Authenticated users can insert likes" ON public.mind_block_likes
  FOR INSERT WITH CHECK ((auth.uid() = user_id));

-- 允許用戶取消自己的讚
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.mind_block_likes;
CREATE POLICY "Users can delete their own likes" ON public.mind_block_likes
  FOR DELETE USING ((auth.uid() = user_id));


-- 2. 建立評價表 (Mind Block Reviews)
CREATE TABLE IF NOT EXISTS public.mind_block_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mind_block_id UUID NOT NULL REFERENCES public.mind_blocks(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE public.mind_block_reviews ENABLE ROW LEVEL SECURITY;

-- 建立 RLS 策略
-- 允許所有人查看評價
DROP POLICY IF EXISTS "Public can view reviews" ON public.mind_block_reviews;
CREATE POLICY "Public can view reviews" ON public.mind_block_reviews
  FOR SELECT USING (true);

-- 允許認證用戶發表評價
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.mind_block_reviews;
CREATE POLICY "Authenticated users can insert reviews" ON public.mind_block_reviews
  FOR INSERT WITH CHECK ((auth.uid() = user_id));

-- 允許用戶更新自己的評價
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.mind_block_reviews;
CREATE POLICY "Users can update their own reviews" ON public.mind_block_reviews
  FOR UPDATE USING ((auth.uid() = user_id));

-- 允許用戶刪除自己的評價
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.mind_block_reviews;
CREATE POLICY "Users can delete their own reviews" ON public.mind_block_reviews
  FOR DELETE USING ((auth.uid() = user_id));


-- 3. 建立自動更新 likes_count 的觸發器
CREATE OR REPLACE FUNCTION update_mind_block_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.mind_blocks
    SET likes_count = likes_count + 1
    WHERE id = NEW.mind_block_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.mind_blocks
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.mind_block_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mind_block_likes_count ON public.mind_block_likes;
CREATE TRIGGER trigger_update_mind_block_likes_count
AFTER INSERT OR DELETE ON public.mind_block_likes
FOR EACH ROW
EXECUTE FUNCTION update_mind_block_likes_count();


-- 4. 確保 Mind Blocks 表允許創作者更新
ALTER TABLE public.mind_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own mind blocks" ON public.mind_blocks;
CREATE POLICY "Users can update their own mind blocks" ON public.mind_blocks
  FOR UPDATE USING ((auth.uid() = user_id));
`
  });
}

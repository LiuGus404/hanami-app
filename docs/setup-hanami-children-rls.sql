-- 設置 hanami_children 表的 RLS 策略

-- 啟用 RLS
ALTER TABLE public.hanami_children ENABLE ROW LEVEL SECURITY;

-- 刪除現有的策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own children" ON public.hanami_children;
DROP POLICY IF EXISTS "Users can insert their own children" ON public.hanami_children;
DROP POLICY IF EXISTS "Users can update their own children" ON public.hanami_children;
DROP POLICY IF EXISTS "Users can delete their own children" ON public.hanami_children;

-- 創建新的 RLS 策略
CREATE POLICY "Users can view their own children" ON public.hanami_children
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Users can insert their own children" ON public.hanami_children
    FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Users can update their own children" ON public.hanami_children
    FOR UPDATE USING (parent_id = auth.uid());

CREATE POLICY "Users can delete their own children" ON public.hanami_children
    FOR DELETE USING (parent_id = auth.uid());

-- 顯示成功消息
SELECT 'hanami_children RLS 策略設置完成' as message;

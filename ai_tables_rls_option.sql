-- ========================================
-- AI 功能表 RLS 啟用選項
-- ========================================

/*
警告：這個方案將為 AI 功能表啟用 RLS
但可能會遇到以下問題：
1. 自定義認證系統與 auth.uid() 不匹配
2. 複雜的多用戶協作權限邏輯
3. 性能影響
4. 調試困難

建議：保持當前的應用層控制方案
*/

-- ========================================
-- 方案 1: 基於服務角色的寬鬆 RLS
-- ========================================

-- ai_rooms 表 RLS
ALTER TABLE public.ai_rooms ENABLE ROW LEVEL SECURITY;

-- 寬鬆政策：允許所有已認證用戶訪問
CREATE POLICY "Authenticated users can access rooms" ON public.ai_rooms
    FOR ALL USING (
        -- 服務角色完全訪問
        current_setting('role') = 'service_role' OR
        -- 或者有 Supabase Auth 會話
        auth.uid() IS NOT NULL
    );

-- ai_messages 表 RLS
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access messages" ON public.ai_messages
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL
    );

-- ai_usage 表 RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access usage data" ON public.ai_usage
    FOR SELECT USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can insert usage data" ON public.ai_usage
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL
    );

-- room_members 表 RLS
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access room members" ON public.room_members
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL
    );

-- role_instances 表 RLS
ALTER TABLE public.role_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access role instances" ON public.role_instances
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL
    );

-- memory_items 表 RLS
ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access memories" ON public.memory_items
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL
    );

SELECT 'Option 1: Loose RLS for AI tables enabled' as status;

-- ========================================
-- 方案 2: 嚴格的用戶隔離 RLS（有風險）
-- ========================================

/*
-- 這個方案嘗試嚴格的用戶隔離，但可能會破壞功能

-- ai_rooms 嚴格政策
DROP POLICY IF EXISTS "Authenticated users can access rooms" ON public.ai_rooms;

CREATE POLICY "Users can only access own rooms" ON public.ai_rooms
    FOR SELECT USING (
        current_setting('role') = 'service_role' OR
        created_by = auth.uid()
    );

CREATE POLICY "Users can only create rooms" ON public.ai_rooms
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        created_by = auth.uid()
    );

-- ai_messages 嚴格政策
DROP POLICY IF EXISTS "Authenticated users can access messages" ON public.ai_messages;

CREATE POLICY "Users can only access room messages" ON public.ai_messages
    FOR SELECT USING (
        current_setting('role') = 'service_role' OR
        room_id IN (
            SELECT id FROM public.ai_rooms WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can only send messages to own rooms" ON public.ai_messages
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        room_id IN (
            SELECT id FROM public.ai_rooms WHERE created_by = auth.uid()
        )
    );
*/

-- ========================================
-- 檢查 RLS 狀態
-- ========================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
AND tablename IN ('ai_rooms', 'ai_messages', 'ai_usage', 'role_instances', 'room_members', 'memory_items')
ORDER BY tablename;

/*
結論：

✅ 推薦方案：保持當前的應用層控制
- 功能完整且穩定
- 性能最佳
- 易於調試和維護
- 適合自定義認證系統

⚠️ 備選方案 1：寬鬆 RLS
- 提供基本的資料庫層保護
- 但實際安全性與應用層控制相當
- 增加了複雜性但收益有限

❌ 不推薦方案 2：嚴格 RLS
- 可能會破壞多用戶協作功能
- 與自定義認證系統衝突
- 調試困難，維護成本高

最佳實踐：
- 敏感資料（用戶、付款）：使用 RLS
- 功能資料（AI、協作）：使用應用層控制
- 定期審計和監控用戶訪問行為
*/

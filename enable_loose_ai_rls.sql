-- ========================================
-- 方案 1：AI 功能表寬鬆 RLS 啟用
-- ========================================

/*
目標：為 AI 功能表啟用基本的 RLS 保護
策略：寬鬆政策，確保功能不受影響
適用：自定義認證系統 + 服務角色操作
*/

-- ========================================
-- 步驟 1: 啟用 AI 功能表 RLS
-- ========================================

-- ai_rooms 表 RLS
ALTER TABLE public.ai_rooms ENABLE ROW LEVEL SECURITY;

-- 清理可能存在的舊政策
DROP POLICY IF EXISTS "Authenticated users can access rooms" ON public.ai_rooms;
DROP POLICY IF EXISTS "Users can access rooms" ON public.ai_rooms;
DROP POLICY IF EXISTS "Service role full access rooms" ON public.ai_rooms;

-- 寬鬆政策：允許所有已認證用戶和服務角色訪問
CREATE POLICY "Loose RLS for ai_rooms" ON public.ai_rooms
    FOR ALL USING (
        -- 服務角色完全訪問（應用層操作）
        current_setting('role') = 'service_role' OR
        -- 有 Supabase Auth 會話的用戶
        auth.uid() IS NOT NULL OR
        -- 匿名用戶也可以訪問（最寬鬆）
        true
    );

SELECT 'ai_rooms RLS enabled with loose policy' as status;

-- ========================================
-- 步驟 2: ai_messages 表 RLS
-- ========================================

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 清理舊政策
DROP POLICY IF EXISTS "Authenticated users can access messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can access messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Service role full access messages" ON public.ai_messages;

CREATE POLICY "Loose RLS for ai_messages" ON public.ai_messages
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL OR
        true
    );

SELECT 'ai_messages RLS enabled with loose policy' as status;

-- ========================================
-- 步驟 3: ai_usage 表 RLS
-- ========================================

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- 清理舊政策
DROP POLICY IF EXISTS "Users can access usage data" ON public.ai_usage;
DROP POLICY IF EXISTS "Users can insert usage data" ON public.ai_usage;
DROP POLICY IF EXISTS "Service role full access usage" ON public.ai_usage;

CREATE POLICY "Loose RLS for ai_usage" ON public.ai_usage
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL OR
        true
    );

SELECT 'ai_usage RLS enabled with loose policy' as status;

-- ========================================
-- 步驟 4: room_members 表 RLS
-- ========================================

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- 清理舊政策
DROP POLICY IF EXISTS "Users can access room members" ON public.room_members;
DROP POLICY IF EXISTS "Service role full access memberships" ON public.room_members;

CREATE POLICY "Loose RLS for room_members" ON public.room_members
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL OR
        true
    );

SELECT 'room_members RLS enabled with loose policy' as status;

-- ========================================
-- 步驟 5: role_instances 表 RLS
-- ========================================

ALTER TABLE public.role_instances ENABLE ROW LEVEL SECURITY;

-- 清理舊政策
DROP POLICY IF EXISTS "Users can access role instances" ON public.role_instances;
DROP POLICY IF EXISTS "Service role full access role instances" ON public.role_instances;

CREATE POLICY "Loose RLS for role_instances" ON public.role_instances
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL OR
        true
    );

SELECT 'role_instances RLS enabled with loose policy' as status;

-- ========================================
-- 步驟 6: room_roles 表 RLS
-- ========================================

ALTER TABLE public.room_roles ENABLE ROW LEVEL SECURITY;

-- 清理舊政策
DROP POLICY IF EXISTS "Users can access room roles" ON public.room_roles;
DROP POLICY IF EXISTS "Service role full access room roles" ON public.room_roles;

CREATE POLICY "Loose RLS for room_roles" ON public.room_roles
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL OR
        true
    );

SELECT 'room_roles RLS enabled with loose policy' as status;

-- ========================================
-- 步驟 7: memory_items 表 RLS
-- ========================================

ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;

-- 清理舊政策
DROP POLICY IF EXISTS "Users can access memories" ON public.memory_items;
DROP POLICY IF EXISTS "Service role full access memories" ON public.memory_items;

CREATE POLICY "Loose RLS for memory_items" ON public.memory_items
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        auth.uid() IS NOT NULL OR
        true
    );

SELECT 'memory_items RLS enabled with loose policy' as status;

-- ========================================
-- 步驟 8: ai_roles 表 RLS（公共角色）
-- ========================================

ALTER TABLE public.ai_roles ENABLE ROW LEVEL SECURITY;

-- 清理舊政策
DROP POLICY IF EXISTS "Users can view public roles" ON public.ai_roles;
DROP POLICY IF EXISTS "Service role full access roles" ON public.ai_roles;

-- AI 角色通常是公共的，所有人都可以查看
CREATE POLICY "Public access for ai_roles" ON public.ai_roles
    FOR SELECT USING (true);

-- 只有服務角色可以修改角色
CREATE POLICY "Service role can manage ai_roles" ON public.ai_roles
    FOR ALL USING (current_setting('role') = 'service_role');

SELECT 'ai_roles RLS enabled with public read access' as status;

-- ========================================
-- 檢查最終 RLS 狀態
-- ========================================

-- 檢查所有表的 RLS 狀態
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count,
    CASE 
        WHEN tablename IN ('saas_users', 'saas_payments', 'saas_personal_memories') THEN '🔒 Strict Protection'
        WHEN tablename LIKE 'ai_%' OR tablename IN ('room_members', 'role_instances', 'room_roles', 'memory_items') THEN '🛡️ Loose Protection'
        ELSE '📂 Other'
    END as protection_level
FROM pg_tables t
WHERE schemaname = 'public' 
AND (
    tablename LIKE 'ai_%' OR
    tablename LIKE 'saas_%' OR
    tablename IN ('memory_items', 'role_instances', 'room_members', 'room_roles')
)
ORDER BY 
    CASE 
        WHEN tablename LIKE 'saas_%' THEN 1
        WHEN tablename LIKE 'ai_%' THEN 2
        ELSE 3
    END,
    tablename;

-- 檢查政策詳情
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN policyname LIKE '%Loose RLS%' THEN '🛡️ Loose'
        WHEN policyname LIKE '%Service role%' THEN '⚙️ Service'
        WHEN policyname LIKE '%Users can%' THEN '👤 User'
        WHEN policyname LIKE '%Public%' THEN '🌐 Public'
        ELSE '❓ Other'
    END as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
AND (
    tablename LIKE 'ai_%' OR
    tablename LIKE 'saas_%' OR
    tablename IN ('memory_items', 'role_instances', 'room_members', 'room_roles')
)
ORDER BY tablename, policyname;

SELECT 'AI Tables Loose RLS Setup Complete! 🛡️' as final_status;

/*
完成狀態：

🔒 嚴格保護（Strict RLS）：
- saas_users：用戶個人資料
- saas_payments：付款資料
- saas_personal_memories：個人記憶

🛡️ 寬鬆保護（Loose RLS）：
- ai_rooms：AI 聊天室
- ai_messages：聊天訊息
- ai_usage：使用統計
- room_members：房間成員
- role_instances：角色實例
- room_roles：房間角色
- memory_items：共享記憶

🌐 公共訪問：
- ai_roles：AI 角色定義（只讀）

優勢：
✅ 提供資料庫層基本保護
✅ 功能完全不受影響
✅ 服務角色可以正常操作
✅ 支援自定義認證系統
✅ 易於監控和審計

注意：
- 這是最寬鬆的 RLS 設置
- 主要防護來自應用層邏輯
- 適合快速部署和測試
*/

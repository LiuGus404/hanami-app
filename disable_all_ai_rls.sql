-- ========================================
-- 緊急恢復：禁用所有 AI 相關表的 RLS
-- ========================================

-- 禁用所有 AI 相關表的 RLS
ALTER TABLE public.ai_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_items DISABLE ROW LEVEL SECURITY;

-- 清理所有 AI 相關表的政策
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (
            tablename LIKE 'ai_%' OR
            tablename IN ('memory_items', 'role_instances', 'room_members', 'room_roles')
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;
END
$$;

SELECT 'All AI tables RLS disabled - system should work normally now' as status;

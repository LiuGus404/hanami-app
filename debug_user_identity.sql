-- ========================================
-- 調試用戶身份映射問題
-- ========================================

/*
這個腳本用於調試和理解用戶身份問題：
1. 檢查當前的 auth.uid()
2. 檢查 saas_users 表中的用戶資料
3. 檢查 ai_rooms 表中的 created_by 欄位
4. 找出身份不匹配的原因
*/

-- 暫時禁用所有 RLS，確保可以查詢
ALTER TABLE public.ai_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members DISABLE ROW LEVEL SECURITY;

-- 清理所有政策
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END
$$;

-- 檢查當前認證狀態
SELECT 
    'Current auth.uid()' as info_type,
    auth.uid() as value;

-- 檢查 saas_users 表
SELECT 
    'saas_users data' as info_type,
    id,
    email,
    full_name,
    created_at
FROM public.saas_users 
ORDER BY created_at DESC
LIMIT 5;

-- 檢查 ai_rooms 表
SELECT 
    'ai_rooms data' as info_type,
    id,
    title,
    created_by,
    created_at
FROM public.ai_rooms 
ORDER BY created_at DESC
LIMIT 5;

-- 檢查 room_members 表
SELECT 
    'room_members data' as info_type,
    room_id,
    user_id,
    role,
    user_type
FROM public.room_members 
LIMIT 5;

-- 檢查身份匹配情況
SELECT 
    'Identity matching' as info_type,
    r.title,
    r.created_by as room_creator,
    u.id as saas_user_id,
    u.email,
    CASE 
        WHEN r.created_by = u.id THEN 'Match'
        ELSE 'No match'
    END as identity_match
FROM public.ai_rooms r
LEFT JOIN public.saas_users u ON r.created_by = u.id
ORDER BY r.created_at DESC;

SELECT 'Debug information collected - check results above' as status;

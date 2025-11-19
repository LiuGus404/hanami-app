-- 檢查 Hanami_Students 表的 RLS 政策
-- 這個腳本用於診斷可能導致無限遞迴的 RLS 政策問題

-- 1. 檢查 RLS 是否啟用
SELECT 
  relname as table_name,
  relforcerowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'Hanami_Students'
AND relnamespace = 'public'::regnamespace;

-- 2. 獲取所有 RLS 政策
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'Hanami_Students'
ORDER BY policyname;

-- 3. 檢查政策中是否使用了可能導致遞迴的函數
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%check_user_permission%' THEN '⚠️ 使用了 check_user_permission 函數'
    WHEN qual LIKE '%Hanami_Students%' THEN '⚠️ 在條件中引用了 Hanami_Students 表'
    WHEN qual LIKE '%hanami_org_identities%' THEN '⚠️ 使用了 hanami_org_identities 表'
    ELSE '✓ 未發現明顯問題'
  END as potential_issue,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'Hanami_Students';

-- 4. 檢查 check_user_permission 函數（如果存在）
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'check_user_permission';

-- 5. 檢查是否有其他函數在 RLS 政策中被調用
SELECT DISTINCT
  p.policyname,
  p.qual,
  regexp_matches(p.qual, '(\w+)\s*\(', 'g') as called_functions
FROM pg_policies p
WHERE p.tablename = 'Hanami_Students'
AND p.qual IS NOT NULL;


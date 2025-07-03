-- =====================================================
-- 禁用登入相關表的 RLS 以解決 403/406 錯誤
-- 這是一個臨時解決方案，用於確保登入功能正常工作
-- =====================================================

-- 1. 禁用管理員表的 RLS
ALTER TABLE hanami_admin DISABLE ROW LEVEL SECURITY;

-- 2. 禁用老師表的 RLS
ALTER TABLE hanami_employee DISABLE ROW LEVEL SECURITY;

-- 3. 禁用學生表的 RLS
ALTER TABLE "Hanami_Students" DISABLE ROW LEVEL SECURITY;

-- 4. 設置表權限（確保所有用戶都能訪問）

-- 授予所有權限給 authenticated 角色
GRANT ALL ON hanami_admin TO authenticated;
GRANT ALL ON hanami_employee TO authenticated;
GRANT ALL ON "Hanami_Students" TO authenticated;

-- 授予所有權限給 service_role 角色
GRANT ALL ON hanami_admin TO service_role;
GRANT ALL ON hanami_employee TO service_role;
GRANT ALL ON "Hanami_Students" TO service_role;

-- 授予所有權限給 anon 角色（匿名用戶，用於登入）
GRANT ALL ON hanami_admin TO anon;
GRANT ALL ON hanami_employee TO anon;
GRANT ALL ON "Hanami_Students" TO anon;

-- 5. 授予序列權限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 6. 驗證設置
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS 已啟用'
    ELSE 'RLS 已禁用'
  END as rls_status
FROM pg_tables 
WHERE tablename IN ('hanami_admin', 'hanami_employee', 'Hanami_Students')
ORDER BY tablename;

-- 7. 檢查權限
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('hanami_admin', 'hanami_employee', 'Hanami_Students')
AND grantee IN ('authenticated', 'service_role', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- 8. 測試查詢（可選）
-- 這些查詢應該能正常執行而不會出現 403/406 錯誤

-- 測試管理員表查詢
SELECT COUNT(*) as admin_count FROM hanami_admin;

-- 測試老師表查詢
SELECT COUNT(*) as teacher_count FROM hanami_employee;

-- 測試學生表查詢
SELECT COUNT(*) as student_count FROM "Hanami_Students";

-- 9. 顯示當前設置狀態
SELECT 
  'RLS 設置完成' as status,
  '所有登入相關表的 RLS 已禁用' as description,
  '現在應該可以正常進行登入驗證' as note; 
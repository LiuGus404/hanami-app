-- =====================================================
-- 登入相關表的 RLS 策略設置
-- 解決 403 和 406 錯誤問題
-- =====================================================

-- 1. 管理員表 (hanami_admin) 的 RLS 策略

-- 啟用 RLS
ALTER TABLE hanami_admin ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Allow all users to read admin accounts" ON hanami_admin;
DROP POLICY IF EXISTS "Allow all users to insert admin accounts" ON hanami_admin;
DROP POLICY IF EXISTS "Allow all users to update admin accounts" ON hanami_admin;
DROP POLICY IF EXISTS "Allow all users to delete admin accounts" ON hanami_admin;

-- 創建允許所有用戶讀取管理員帳戶的策略（用於登入驗證）
CREATE POLICY "Allow all users to read admin accounts" ON hanami_admin
FOR SELECT USING (true);

-- 創建允許已認證用戶插入管理員帳戶的策略
CREATE POLICY "Allow authenticated users to insert admin accounts" ON hanami_admin
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 創建允許已認證用戶更新管理員帳戶的策略
CREATE POLICY "Allow authenticated users to update admin accounts" ON hanami_admin
FOR UPDATE USING (auth.role() = 'authenticated');

-- 創建允許已認證用戶刪除管理員帳戶的策略
CREATE POLICY "Allow authenticated users to delete admin accounts" ON hanami_admin
FOR DELETE USING (auth.role() = 'authenticated');

-- 2. 老師表 (hanami_employee) 的 RLS 策略

-- 啟用 RLS
ALTER TABLE hanami_employee ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Allow all users to read teacher accounts" ON hanami_employee;
DROP POLICY IF EXISTS "Allow all users to insert teacher accounts" ON hanami_employee;
DROP POLICY IF EXISTS "Allow all users to update teacher accounts" ON hanami_employee;
DROP POLICY IF EXISTS "Allow all users to delete teacher accounts" ON hanami_employee;

-- 創建允許所有用戶讀取老師帳戶的策略（用於登入驗證）
CREATE POLICY "Allow all users to read teacher accounts" ON hanami_employee
FOR SELECT USING (true);

-- 創建允許已認證用戶插入老師帳戶的策略
CREATE POLICY "Allow authenticated users to insert teacher accounts" ON hanami_employee
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 創建允許已認證用戶更新老師帳戶的策略
CREATE POLICY "Allow authenticated users to update teacher accounts" ON hanami_employee
FOR UPDATE USING (auth.role() = 'authenticated');

-- 創建允許已認證用戶刪除老師帳戶的策略
CREATE POLICY "Allow authenticated users to delete teacher accounts" ON hanami_employee
FOR DELETE USING (auth.role() = 'authenticated');

-- 3. 學生表 (Hanami_Students) 的 RLS 策略

-- 啟用 RLS
ALTER TABLE "Hanami_Students" ENABLE ROW LEVEL SECURITY;

-- 刪除現有策略（如果存在）
DROP POLICY IF EXISTS "Allow all users to read student accounts" ON "Hanami_Students";
DROP POLICY IF EXISTS "Allow all users to insert student accounts" ON "Hanami_Students";
DROP POLICY IF EXISTS "Allow all users to update student accounts" ON "Hanami_Students";
DROP POLICY IF EXISTS "Allow all users to delete student accounts" ON "Hanami_Students";

-- 創建允許所有用戶讀取學生帳戶的策略（用於登入驗證）
CREATE POLICY "Allow all users to read student accounts" ON "Hanami_Students"
FOR SELECT USING (true);

-- 創建允許已認證用戶插入學生帳戶的策略
CREATE POLICY "Allow authenticated users to insert student accounts" ON "Hanami_Students"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 創建允許已認證用戶更新學生帳戶的策略
CREATE POLICY "Allow authenticated users to update student accounts" ON "Hanami_Students"
FOR UPDATE USING (auth.role() = 'authenticated');

-- 創建允許已認證用戶刪除學生帳戶的策略
CREATE POLICY "Allow authenticated users to delete student accounts" ON "Hanami_Students"
FOR DELETE USING (auth.role() = 'authenticated');

-- 4. 設置表權限

-- 授予所有權限給 authenticated 角色
GRANT ALL ON hanami_admin TO authenticated;
GRANT ALL ON hanami_employee TO authenticated;
GRANT ALL ON "Hanami_Students" TO authenticated;

-- 授予所有權限給 service_role 角色（用於服務端操作）
GRANT ALL ON hanami_admin TO service_role;
GRANT ALL ON hanami_employee TO service_role;
GRANT ALL ON "Hanami_Students" TO service_role;

-- 授予序列權限（如果使用自增ID）
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 5. 創建登入驗證函數（可選）

-- 創建管理員登入驗證函數
CREATE OR REPLACE FUNCTION verify_admin_login(email TEXT, password TEXT)
RETURNS TABLE (
  id UUID,
  admin_name TEXT,
  admin_email TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ha.id,
    ha.admin_name,
    ha.admin_email,
    ha.role
  FROM hanami_admin ha
  WHERE ha.admin_email = email AND ha.admin_password = password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建老師登入驗證函數
CREATE OR REPLACE FUNCTION verify_teacher_login(email TEXT, password TEXT)
RETURNS TABLE (
  id UUID,
  teacher_fullname TEXT,
  teacher_email TEXT,
  teacher_nickname TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    he.id,
    he.teacher_fullname,
    he.teacher_email,
    he.teacher_nickname
  FROM hanami_employee he
  WHERE he.teacher_email = email AND he.teacher_password = password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 創建學生登入驗證函數
CREATE OR REPLACE FUNCTION verify_student_login(email TEXT, password TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  student_email TEXT,
  parent_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hs.id,
    hs.full_name,
    hs.student_email,
    hs.parent_email
  FROM "Hanami_Students" hs
  WHERE hs.student_email = email AND hs.student_password = password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 為函數設置權限
GRANT EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_teacher_login(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_student_login(TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION verify_teacher_login(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION verify_student_login(TEXT, TEXT) TO service_role;

-- 6. 驗證設置

-- 檢查表是否存在並啟用 RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS 已啟用'
    ELSE 'RLS 未啟用'
  END as rls_status
FROM pg_tables 
WHERE tablename IN ('hanami_admin', 'hanami_employee', 'Hanami_Students')
ORDER BY tablename;

-- 檢查策略是否存在
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('hanami_admin', 'hanami_employee', 'Hanami_Students')
ORDER BY tablename, policyname;

-- 檢查權限
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('hanami_admin', 'hanami_employee', 'Hanami_Students')
AND grantee IN ('authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type; 
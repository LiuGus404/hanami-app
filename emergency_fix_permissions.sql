-- =====================================================
-- 緊急修復權限系統
-- 確保所有用戶都有權限記錄，管理員可以正常訪問所有資料
-- =====================================================

-- 1. 檢查現有權限記錄
SELECT '=== 檢查現有權限記錄 ===' AS status;
SELECT 
  user_type,
  COUNT(*) as count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM hanami_user_permissions 
GROUP BY user_type;

-- 2. 為所有管理員創建權限記錄
INSERT INTO hanami_user_permissions (
  user_id,
  user_type,
  user_email,
  permissions,
  accessible_pages,
  can_view_all_students,
  can_view_all_lessons,
  can_manage_teachers,
  can_manage_students,
  can_manage_lessons,
  can_view_financial_data,
  can_export_data,
  is_active
) 
SELECT 
  ha.id,
  'admin',
  ha.admin_email,
  '{"all": true}'::JSONB,
  '["dashboard", "students", "teachers", "lessons", "reports", "settings", "permissions", "financial", "export"]'::JSONB,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE
FROM hanami_admin ha
WHERE NOT EXISTS (
  SELECT 1 FROM hanami_user_permissions up 
  WHERE up.user_email = ha.admin_email
);

-- 3. 為所有老師創建權限記錄
INSERT INTO hanami_user_permissions (
  user_id,
  user_type,
  user_email,
  permissions,
  accessible_pages,
  can_view_all_students,
  can_view_all_lessons,
  can_manage_teachers,
  can_manage_students,
  can_manage_lessons,
  can_view_financial_data,
  can_export_data,
  is_active
) 
SELECT 
  he.id,
  'teacher',
  he.teacher_email,
  '{"basic": true}'::JSONB,
  '["dashboard", "students", "lessons", "progress"]'::JSONB,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  TRUE,
  FALSE,
  FALSE,
  TRUE
FROM hanami_employee he
WHERE he.teacher_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM hanami_user_permissions up 
    WHERE up.user_email = he.teacher_email
  );

-- 4. 為所有學生/家長創建權限記錄
INSERT INTO hanami_user_permissions (
  user_id,
  user_type,
  user_email,
  permissions,
  accessible_pages,
  can_view_all_students,
  can_view_all_lessons,
  can_manage_teachers,
  can_manage_students,
  can_manage_lessons,
  can_view_financial_data,
  can_export_data,
  is_active
) 
SELECT 
  hs.id,
  'parent',
  hs.parent_email,
  '{"basic": true}'::JSONB,
  '["dashboard", "progress"]'::JSONB,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  TRUE
FROM "Hanami_Students" hs
WHERE hs.parent_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM hanami_user_permissions up 
    WHERE up.user_email = hs.parent_email
  );

-- 5. 確保所有表都有適當的權限
GRANT ALL ON hanami_user_permissions TO authenticated;
GRANT ALL ON hanami_teacher_student_relations TO authenticated;
GRANT ALL ON hanami_parent_student_relations TO authenticated;
GRANT ALL ON "Hanami_Students" TO authenticated;
GRANT ALL ON hanami_student_lesson TO authenticated;
GRANT ALL ON hanami_employee TO authenticated;
GRANT ALL ON hanami_admin TO authenticated;

GRANT ALL ON hanami_user_permissions TO service_role;
GRANT ALL ON hanami_teacher_student_relations TO service_role;
GRANT ALL ON hanami_parent_student_relations TO service_role;
GRANT ALL ON "Hanami_Students" TO service_role;
GRANT ALL ON hanami_student_lesson TO service_role;
GRANT ALL ON hanami_employee TO service_role;
GRANT ALL ON hanami_admin TO service_role;

-- 6. 暫時禁用 RLS 以確保管理員可以訪問所有資料
ALTER TABLE "Hanami_Students" DISABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_student_lesson DISABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_employee DISABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_admin DISABLE ROW LEVEL SECURITY;

-- 7. 創建簡單的權限檢查函數
CREATE OR REPLACE FUNCTION check_user_permission(user_email_param TEXT, permission_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_perms RECORD;
BEGIN
  SELECT * INTO user_perms
  FROM hanami_user_permissions
  WHERE user_email = user_email_param AND is_active = TRUE;
  
  IF user_perms IS NULL THEN
    RETURN FALSE;
  END IF;
  
  CASE permission_type
    WHEN 'view_all_students' THEN
      RETURN user_perms.can_view_all_students OR user_perms.user_type = 'admin';
    WHEN 'view_all_lessons' THEN
      RETURN user_perms.can_view_all_lessons OR user_perms.user_type = 'admin';
    WHEN 'manage_teachers' THEN
      RETURN user_perms.can_manage_teachers OR user_perms.user_type = 'admin';
    WHEN 'manage_students' THEN
      RETURN user_perms.can_manage_students OR user_perms.user_type = 'admin';
    WHEN 'manage_lessons' THEN
      RETURN user_perms.can_manage_lessons OR user_perms.user_type = 'admin';
    WHEN 'view_financial' THEN
      RETURN user_perms.can_view_financial_data OR user_perms.user_type = 'admin';
    WHEN 'export_data' THEN
      RETURN user_perms.can_export_data OR user_perms.user_type = 'admin';
    WHEN 'is_admin' THEN
      RETURN user_perms.user_type = 'admin';
    WHEN 'is_teacher' THEN
      RETURN user_perms.user_type = 'teacher';
    WHEN 'is_parent' THEN
      RETURN user_perms.user_type = 'parent';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 為函數設置權限
GRANT EXECUTE ON FUNCTION check_user_permission(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission(TEXT, TEXT) TO service_role;

-- 9. 驗證修復結果
SELECT '=== 修復後權限記錄統計 ===' AS status;
SELECT 
  user_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM hanami_user_permissions 
GROUP BY user_type
ORDER BY user_type;

-- 10. 檢查表權限
SELECT '=== 表權限檢查 ===' AS status;
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN (
  'hanami_user_permissions',
  'hanami_teacher_student_relations', 
  'hanami_parent_student_relations',
  'Hanami_Students',
  'hanami_student_lesson',
  'hanami_employee',
  'hanami_admin'
)
AND grantee IN ('authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- 11. 測試權限檢查函數
SELECT '=== 測試權限檢查函數 ===' AS status;
SELECT 
  user_email,
  user_type,
  check_user_permission(user_email, 'is_admin') as is_admin,
  check_user_permission(user_email, 'view_all_students') as can_view_students
FROM hanami_user_permissions 
WHERE is_active = true
LIMIT 5;

-- 12. 顯示修復完成訊息
SELECT '=== 緊急修復完成 ===' AS status;
SELECT '權限系統已修復，管理員現在可以正常訪問所有資料' AS message;
SELECT '注意：RLS 已暫時禁用，請在確認系統正常後重新啟用' AS warning; 
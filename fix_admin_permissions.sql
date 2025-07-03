-- =====================================================
-- 修復管理員權限問題
-- 確保管理員可以正常訪問所有資料
-- =====================================================

-- 1. 檢查現有管理員
SELECT '=== 現有管理員 ===' AS status;
SELECT id, admin_email, admin_name FROM hanami_admin;

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
  '["dashboard", "students", "teachers", "lessons", "reports", "settings", "permissions"]'::JSONB,
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
  '["dashboard", "students", "lessons"]'::JSONB,
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
  COALESCE(hs.student_email, hs.parent_email),
  '{"basic": true}'::JSONB,
  '["dashboard", "lessons", "progress"]'::JSONB,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  TRUE
FROM "Hanami_Students" hs
WHERE (hs.student_email IS NOT NULL OR hs.parent_email IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM hanami_user_permissions up 
    WHERE up.user_email = COALESCE(hs.student_email, hs.parent_email)
  );

-- 5. 創建老師-學生關聯（基於現有的 student_teacher 欄位）
INSERT INTO hanami_teacher_student_relations (
  teacher_id,
  student_id,
  can_view_student_data,
  can_edit_student_data,
  can_view_lessons,
  can_edit_lessons,
  can_view_progress,
  can_edit_progress
)
SELECT 
  he.id,
  hs.id,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE
FROM "Hanami_Students" hs
JOIN hanami_employee he ON he.teacher_nickname = hs.student_teacher
WHERE hs.student_teacher IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM hanami_teacher_student_relations tsr
    WHERE tsr.teacher_id = he.id AND tsr.student_id = hs.id
  );

-- 6. 創建家長-學生關聯
INSERT INTO hanami_parent_student_relations (
  parent_id,
  student_id,
  can_view_student_data,
  can_view_lessons,
  can_view_progress,
  can_view_financial_data
)
SELECT 
  hs.id,
  hs.id,
  TRUE,
  TRUE,
  TRUE,
  FALSE
FROM "Hanami_Students" hs
WHERE NOT EXISTS (
  SELECT 1 FROM hanami_parent_student_relations psr
  WHERE psr.parent_id = hs.id AND psr.student_id = hs.id
);

-- 7. 暫時禁用 RLS 以確保基本功能正常
-- 如果仍有問題，可以執行以下命令：
/*
ALTER TABLE "Hanami_Students" DISABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_student_lesson DISABLE ROW LEVEL SECURITY;
ALTER TABLE hanami_employee DISABLE ROW LEVEL SECURITY;
*/

-- 8. 驗證設置
SELECT '=== 權限記錄統計 ===' AS status;
SELECT 
  user_type,
  COUNT(*) as count
FROM hanami_user_permissions
GROUP BY user_type;

SELECT '=== 老師-學生關聯統計 ===' AS status;
SELECT COUNT(*) as total_relations FROM hanami_teacher_student_relations;

SELECT '=== 家長-學生關聯統計 ===' AS status;
SELECT COUNT(*) as total_relations FROM hanami_parent_student_relations;

-- 9. 檢查管理員權限
SELECT '=== 管理員權限檢查 ===' AS status;
SELECT 
  up.user_email,
  up.user_type,
  up.can_view_all_students,
  up.can_view_all_lessons,
  up.is_active
FROM hanami_user_permissions up
WHERE up.user_type = 'admin'; 
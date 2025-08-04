-- 清空 hanami_trial_students 表中的 student_email 和 student_password
-- 並清除相關的權限記錄

BEGIN;

-- 1. 先找出所有有 student_email 的試堂學生記錄
SELECT '找到以下試堂學生記錄需要清理:' as info;
SELECT id, full_name, student_email, student_password 
FROM hanami_trial_students 
WHERE student_email IS NOT NULL OR student_password IS NOT NULL;

-- 2. 清除 hanami_trial_students 表中的 student_email 和 student_password
UPDATE hanami_trial_students 
SET 
  student_email = NULL,
  student_password = NULL,
  updated_at = NOW()
WHERE student_email IS NOT NULL OR student_password IS NOT NULL;

-- 3. 找出並清除 hanami_user_permissions_v2 中與這些試堂學生相關的權限記錄
-- 先查看要刪除的權限記錄
SELECT '找到以下權限記錄需要刪除:' as info;
SELECT p.id, p.user_email, p.user_phone, p.role_id, p.status, r.role_name
FROM hanami_user_permissions_v2 p
LEFT JOIN hanami_roles r ON p.role_id = r.id
WHERE p.user_email IN (
  SELECT DISTINCT student_email 
  FROM hanami_trial_students 
  WHERE student_email IS NOT NULL
);

-- 4. 刪除 hanami_user_permissions_v2 中的相關權限記錄
DELETE FROM hanami_user_permissions_v2 
WHERE user_email IN (
  SELECT DISTINCT student_email 
  FROM hanami_trial_students 
  WHERE student_email IS NOT NULL
);

-- 5. 驗證清理結果
SELECT '清理完成，驗證結果:' as info;

SELECT 'hanami_trial_students 表中還有 student_email 的記錄:' as check_type;
SELECT COUNT(*) as count 
FROM hanami_trial_students 
WHERE student_email IS NOT NULL;

SELECT 'hanami_trial_students 表中還有 student_password 的記錄:' as check_type;
SELECT COUNT(*) as count 
FROM hanami_trial_students 
WHERE student_password IS NOT NULL;

SELECT 'hanami_user_permissions_v2 中剩餘的記錄數:' as check_type;
SELECT COUNT(*) as total_permissions FROM hanami_user_permissions_v2;

-- 6. 顯示清理統計
SELECT '清理統計:' as summary;
SELECT 
  (SELECT COUNT(*) FROM hanami_trial_students WHERE student_email IS NOT NULL OR student_password IS NOT NULL) as remaining_trial_student_data,
  (SELECT COUNT(*) FROM hanami_user_permissions_v2) as remaining_permissions;

COMMIT;

-- 注意：這個腳本會永久刪除相關的 student_email、student_password 和權限記錄
-- 請在執行前確保已經備份重要資料 
-- ==========================================
-- Hanami Demo Data Cleanup Script
-- 清除範例數據
-- ==========================================
-- 使用說明:
-- 1. 在 Supabase SQL Editor 中執行此腳本
-- 2. 這會刪除所有 DEMO 開頭的學生和 TRIAL 開頭的試堂學生
-- ==========================================

-- 刪除課堂記錄 (與 demo 學生相關)
DELETE FROM "hanami_student_lesson"
WHERE student_id IN (
    SELECT id FROM "Hanami_Students" WHERE student_oid LIKE 'DEMO%'
);

-- 刪除常規 demo 學生
DELETE FROM "Hanami_Students"
WHERE student_oid LIKE 'DEMO%';

-- 刪除試堂 demo 學生
DELETE FROM "hanami_trial_students"
WHERE student_oid LIKE 'TRIAL%';

-- 選擇性：刪除 demo 課程類型
-- 如果你也想刪除課程類型，取消下面的註解
-- DELETE FROM "Hanami_CourseTypes"
-- WHERE name IN ('數學', '英文', '中文', '科學');

-- 驗證刪除結果
SELECT '已刪除的常規學生' as action, COUNT(*) as count 
FROM "Hanami_Students" WHERE student_oid LIKE 'DEMO%'
UNION ALL
SELECT '已刪除的試堂學生' as action, COUNT(*) as count 
FROM "hanami_trial_students" WHERE student_oid LIKE 'TRIAL%';

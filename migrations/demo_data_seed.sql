-- ==========================================
-- Hanami Demo Data Seed Script
-- 補習中心範例數據
-- ==========================================
-- 使用說明:
-- 1. 請先替換 'YOUR_ORG_ID_HERE' 為你的實際機構 ID
-- 2. 在 Supabase SQL Editor 中執行此腳本
-- 3. 執行前請確保已備份現有數據
-- ==========================================

-- ⚠️ 設定你的機構 ID (必須修改！)
-- 你可以在 Supabase 的 saas_organizations 表中找到你的機構 ID
DO $$
DECLARE
    demo_org_id UUID := 'fdacb696-cbc9-4122-b76a-f8cec940eedc'::UUID;  -- ← 請替換為實際的機構 ID
    current_date_val DATE := CURRENT_DATE;
    now_timestamp TIMESTAMPTZ := NOW();
BEGIN
    -- ==========================================
    -- 1️⃣ 課程類型 (如果不存在則插入)
    -- ==========================================
    -- 使用 NOT EXISTS 檢查，避免 ON CONFLICT 問題
    INSERT INTO "Hanami_CourseTypes" (id, name, status, org_id, description, price_per_lesson)
    SELECT gen_random_uuid(), '數學', true, demo_org_id, '小學至初中數學補習', 200
    WHERE NOT EXISTS (SELECT 1 FROM "Hanami_CourseTypes" WHERE name = '數學' AND org_id = demo_org_id);
    
    INSERT INTO "Hanami_CourseTypes" (id, name, status, org_id, description, price_per_lesson)
    SELECT gen_random_uuid(), '英文', true, demo_org_id, '英語會話與文法', 200
    WHERE NOT EXISTS (SELECT 1 FROM "Hanami_CourseTypes" WHERE name = '英文' AND org_id = demo_org_id);
    
    INSERT INTO "Hanami_CourseTypes" (id, name, status, org_id, description, price_per_lesson)
    SELECT gen_random_uuid(), '中文', true, demo_org_id, '中文閱讀與寫作', 200
    WHERE NOT EXISTS (SELECT 1 FROM "Hanami_CourseTypes" WHERE name = '中文' AND org_id = demo_org_id);
    
    INSERT INTO "Hanami_CourseTypes" (id, name, status, org_id, description, price_per_lesson)
    SELECT gen_random_uuid(), '科學', true, demo_org_id, '自然科學探索', 220
    WHERE NOT EXISTS (SELECT 1 FROM "Hanami_CourseTypes" WHERE name = '科學' AND org_id = demo_org_id);

    -- ==========================================
    -- 2️⃣ 常規學生 (Regular Students)
    -- ==========================================
    -- 先刪除已存在的 demo 學生，避免重複
    DELETE FROM "Hanami_Students" WHERE student_oid LIKE 'DEMO%' AND org_id = demo_org_id;
    
    INSERT INTO "Hanami_Students" (
        id, student_oid, full_name, nick_name, gender, 
        contact_number, student_dob, student_age, parent_email,
        health_notes, student_preference, address, school,
        course_type, regular_weekday, regular_timeslot,
        student_type, student_teacher, created_at, updated_at,
        access_role, student_email, student_password, org_id
    ) VALUES 
    -- 學生 1: 陳小明 - 正常學生
    (
        gen_random_uuid(), 'DEMO0001', '陳小明', '小明', '男',
        '91234567', '2015-03-15', 10, 'parent1@example.com',
        '沒有', '喜歡互動式學習', '九龍塘', '聖公會小學',
        '數學', 6, '10:00', -- 星期六 10:00
        '常規', NULL, now_timestamp, now_timestamp,
        'student', 'demo0001@hanami.com', 'demo1234', demo_org_id
    ),
    -- 學生 2: 李芳芳 - 低餘額學生
    (
        gen_random_uuid(), 'DEMO0002', '李芳芳', '芳芳', '女',
        '92345678', '2013-07-22', 12, 'parent2@example.com',
        '沒有', '需要安靜的環境', '沙田', '沙田官立小學',
        '英文', 0, '14:00', -- 星期日 14:00
        '常規', NULL, now_timestamp, now_timestamp,
        'student', 'demo0002@hanami.com', 'demo1234', demo_org_id
    ),
    -- 學生 3: 王子軒 - 高餘額學生
    (
        gen_random_uuid(), 'DEMO0003', '王子軒', '子軒', '男',
        '93456789', '2017-11-08', 8, 'parent3@example.com',
        '對花生過敏', '喜歡動手做實驗', '將軍澳', '保良局小學',
        '科學', 3, '16:00', -- 星期三 16:00
        '常規', NULL, now_timestamp, now_timestamp,
        'student', 'demo0003@hanami.com', 'demo1234', demo_org_id
    ),
    -- 學生 4: 張美玲 - 需續費學生
    (
        gen_random_uuid(), 'DEMO0004', '張美玲', '美玲', '女',
        '94567890', '2011-05-30', 14, 'parent4@example.com',
        '沒有', '準備升中考試', '荃灣', '荃灣聖芳濟中學',
        '數學', 6, '11:00', -- 星期六 11:00
        '常規', NULL, now_timestamp, now_timestamp,
        'student', 'demo0004@hanami.com', 'demo1234', demo_org_id
    ),
    -- 學生 5: 林志偉 - 有請假記錄學生
    (
        gen_random_uuid(), 'DEMO0005', '林志偉', '志偉', '男',
        '95678901', '2014-09-12', 11, 'parent5@example.com',
        '輕微哮喘', '喜歡閱讀', '屯門', '屯門官立小學',
        '中文', 1, '18:00', -- 星期一 18:00
        '常規', NULL, now_timestamp, now_timestamp,
        'student', 'demo0005@hanami.com', 'demo1234', demo_org_id
    ),
    -- 學生 6: 何小雨 - 正常學生
    (
        gen_random_uuid(), 'DEMO0006', '何小雨', '小雨', '女',
        '96789012', '2016-02-28', 9, 'parent6@example.com',
        '沒有', '需要多鼓勵', '元朗', '元朗商會小學',
        '英文', 4, '17:00', -- 星期四 17:00
        '常規', NULL, now_timestamp, now_timestamp,
        'student', 'demo0006@hanami.com', 'demo1234', demo_org_id
    );

    -- ==========================================
    -- 3️⃣ 試堂學生 (Trial Students)
    -- ==========================================
    -- 先刪除已存在的 demo 試堂學生，避免重複
    DELETE FROM "hanami_trial_students" WHERE student_oid LIKE 'TRIAL%' AND org_id = demo_org_id;
    
    INSERT INTO "hanami_trial_students" (
        id, student_oid, full_name, nick_name, gender,
        contact_number, student_dob, student_age, parent_email,
        health_notes, student_preference, course_type,
        lesson_date, actual_timeslot, weekday, regular_weekday,
        student_type, trial_status, trial_remarks, confirmed_payment,
        created_at, updated_at, access_role, org_id,
        remaining_lessons, ongoing_lessons, upcoming_lessons
    ) VALUES 
    -- 試堂學生 1: 周俊傑 - 待試堂
    (
        gen_random_uuid(), 'TRIAL001', '周俊傑', '俊傑', '男',
        '97890123', '2015-06-10', 10, 'trial1@example.com',
        '沒有', '對數學感興趣', '數學',
        current_date_val + INTERVAL '7 days', '10:00', '6', '6', -- 下週六 10:00
        '試堂', 'pending', '家長希望先試一堂看看效果', true,
        now_timestamp, now_timestamp, 'trial_student', demo_org_id,
        1, 0, 1
    ),
    -- 試堂學生 2: 吳曉晴 - 已完成試堂
    (
        gen_random_uuid(), 'TRIAL002', '吳曉晴', '曉晴', '女',
        '98901234', '2012-12-05', 13, 'trial2@example.com',
        '沒有', '想提升英語會話', '英文',
        current_date_val - INTERVAL '3 days', '14:00', '0', '0', -- 3天前的週日
        '試堂', 'completed', '試堂表現良好，家長考慮報名', true,
        now_timestamp, now_timestamp, 'trial_student', demo_org_id,
        0, 0, 0
    ),
    -- 試堂學生 3: 鄭嘉欣 - 待試堂
    (
        gen_random_uuid(), 'TRIAL003', '鄭嘉欣', '嘉欣', '女',
        '99012345', '2018-04-18', 7, 'trial3@example.com',
        '沒有', '剛開始學中文', '中文',
        current_date_val + INTERVAL '5 days', '16:00', '4', '4', -- 5天後的週四
        '試堂', 'pending', '需要基礎中文啟蒙', true,
        now_timestamp, now_timestamp, 'trial_student', demo_org_id,
        1, 0, 1
    );

    RAISE NOTICE '✅ Demo data inserted successfully!';
    RAISE NOTICE '📊 Inserted: 4 course types, 6 regular students, 3 trial students';
    
END $$;

-- ==========================================
-- 🔍 驗證插入的數據
-- ==========================================

-- 檢查課程類型
SELECT '課程類型' as table_name, COUNT(*) as count FROM "Hanami_CourseTypes"
WHERE name IN ('數學', '英文', '中文', '科學');

-- 檢查常規學生
SELECT '常規學生' as table_name, COUNT(*) as count FROM "Hanami_Students"
WHERE student_oid LIKE 'DEMO%';

-- 檢查試堂學生
SELECT '試堂學生' as table_name, COUNT(*) as count FROM "hanami_trial_students"
WHERE student_oid LIKE 'TRIAL%';

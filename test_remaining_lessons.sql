-- 測試剩餘堂數計算函數
-- 請在 Supabase SQL Editor 中執行以下查詢來測試

-- 1. 測試批量計算函數
SELECT * FROM calculate_remaining_lessons_batch(
  ARRAY['your-student-id-here']::UUID[],
  CURRENT_DATE
);

-- 2. 測試詳細查詢函數
SELECT * FROM calculate_remaining_lessons_detailed(
  ARRAY['your-student-id-here']::UUID[],
  CURRENT_DATE
);

-- 3. 手動查詢來驗證結果
SELECT 
  student_id,
  COUNT(*) AS remaining_lessons,
  MIN(lesson_date) AS next_lesson_date,
  MIN(actual_timeslot) AS next_lesson_time,
  MIN(course_type) AS course_type
FROM hanami_student_lesson
WHERE lesson_date >= CURRENT_DATE
GROUP BY student_id
ORDER BY next_lesson_date, next_lesson_time;

-- 4. 檢查特定學生的剩餘堂數
-- 請將 'your-student-id-here' 替換為實際的學生ID
SELECT 
  hsl.student_id,
  hs.full_name,
  COUNT(*) AS remaining_lessons,
  MIN(hsl.lesson_date) AS next_lesson_date,
  MIN(hsl.actual_timeslot) AS next_lesson_time,
  MIN(hsl.course_type) AS course_type
FROM hanami_student_lesson hsl
LEFT JOIN "Hanami_Students" hs ON hsl.student_id = hs.id
WHERE hsl.student_id = 'your-student-id-here'::UUID
  AND hsl.lesson_date >= CURRENT_DATE
GROUP BY hsl.student_id, hs.full_name; 
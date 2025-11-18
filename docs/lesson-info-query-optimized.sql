-- ============================================
-- 優化版查詢（可直接使用）
-- 改進：添加 org_id 過濾、優化 JOIN、改進時區處理
-- 租戶 ID: f8d269ec-b682-45d1-a796-3b74c2bf3eec
-- ============================================

WITH org_filter AS (
  -- 租戶 ID 常量
  SELECT 'f8d269ec-b682-45d1-a796-3b74c2bf3eec'::uuid AS org_id
),
p AS (
  -- 今天（香港時間）
  SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Hong_Kong')::date AS today
),
lessons_today AS (
  -- 今天有課且「progress_notes 為空」的學生
  SELECT
    l.id  AS lesson_id,
    l.student_id,
    l.student_oid,
    l.full_name,
    l.lesson_teacher,
    l.course_type,
    l.lesson_date,
    COALESCE(l.actual_timeslot, l.regular_timeslot) AS lesson_time,
    l.progress_notes,
    l.org_id
  FROM public.hanami_student_lesson l
  CROSS JOIN org_filter of
  JOIN p ON l.lesson_date = p.today
  WHERE NULLIF(BTRIM(l.progress_notes), '') IS NULL
    AND l.org_id = of.org_id
),
prev_map AS (
  -- 對於今天每位學生，找出「上一堂」的日期
  SELECT
    lt.student_id,
    lt.org_id,
    MAX(l2.lesson_date) AS prev_lesson_date
  FROM lessons_today lt
  CROSS JOIN org_filter of
  JOIN public.hanami_student_lesson l2
    ON l2.student_id = lt.student_id
   AND l2.lesson_date < lt.lesson_date
   AND l2.org_id = of.org_id
  GROUP BY lt.student_id, lt.org_id
),
lessons_prev AS (
  -- 上一堂課的詳細資料
  SELECT
    l2.id  AS lesson_id,
    l2.student_id,
    l2.student_oid,
    l2.full_name,
    l2.lesson_teacher,
    l2.course_type,
    l2.lesson_date,
    COALESCE(l2.actual_timeslot, l2.regular_timeslot) AS lesson_time,
    l2.org_id
  FROM public.hanami_student_lesson l2
  CROSS JOIN org_filter of
  JOIN prev_map pm
    ON pm.student_id = l2.student_id
   AND pm.prev_lesson_date = l2.lesson_date
   AND l2.org_id = of.org_id
)

SELECT *
FROM (
  /* A) 今天該堂的 lesson 活動 */
  SELECT
    'current'        AS period,
    'lesson_today'   AS source,
    lt.lesson_time   AS anchor_time,
    lt.lesson_id,
    lt.student_id,
    lt.student_oid,
    lt.full_name,
    lt.lesson_teacher,
    lt.course_type,
    lt.lesson_date,
    lt.lesson_time,
    lt.progress_notes,
    lt.org_id,
    sa.id            AS student_activity_id,
    sa.activity_type AS assigned_type,
    sa.completion_status,
    sa.progress,
    sa.assigned_at,
    sa.completed_at,
    sa.time_spent,
    sa.teacher_notes,
    sa.student_feedback,
    ta.id            AS activity_id,
    ta.activity_name,
    ta.activity_type AS teaching_activity_type,
    ta.activity_description,
    ta.duration_minutes,
    ta.target_abilities,
    ta.materials_needed,
    ta.tags,
    ta.category,
    ta.difficulty_level
  FROM lessons_today lt
  CROSS JOIN org_filter of
  JOIN public.hanami_student_activities sa
    ON sa.student_id    = lt.student_id
   AND sa.activity_type = 'lesson'
   AND sa.lesson_date   = lt.lesson_date
   AND (sa.timeslot IS NULL OR sa.timeslot::time = lt.lesson_time)
   AND sa.org_id = of.org_id
  LEFT JOIN public.hanami_teaching_activities ta
    ON ta.id = sa.activity_id
   AND ta.org_id = of.org_id

  UNION ALL

  /* B) 今天這批學生的 ongoing */
  SELECT
    'current'        AS period,
    'ongoing'        AS source,
    lt.lesson_time   AS anchor_time,
    lt.lesson_id,
    lt.student_id,
    lt.student_oid,
    lt.full_name,
    lt.lesson_teacher,
    lt.course_type,
    lt.lesson_date,
    lt.lesson_time,
    lt.progress_notes,
    lt.org_id,
    sa.id            AS student_activity_id,
    sa.activity_type AS assigned_type,
    sa.completion_status,
    sa.progress,
    sa.assigned_at,
    sa.completed_at,
    sa.time_spent,
    sa.teacher_notes,
    sa.student_feedback,
    ta.id            AS activity_id,
    ta.activity_name,
    ta.activity_type AS teaching_activity_type,
    ta.activity_description,
    ta.duration_minutes,
    ta.target_abilities,
    ta.materials_needed,
    ta.tags,
    ta.category,
    ta.difficulty_level
  FROM lessons_today lt
  CROSS JOIN org_filter of
  JOIN public.hanami_student_activities sa
    ON sa.student_id    = lt.student_id
   AND sa.activity_type = 'ongoing'
   AND sa.org_id = of.org_id
  LEFT JOIN public.hanami_teaching_activities ta
    ON ta.id = sa.activity_id
   AND ta.org_id = of.org_id

  UNION ALL

  /* C) 上一堂課的 lesson 活動 */
  SELECT
    'previous'       AS period,
    'lesson_prev'    AS source,
    lt.lesson_time   AS anchor_time,
    lp.lesson_id,
    lp.student_id,
    lp.student_oid,
    lp.full_name,
    lp.lesson_teacher,
    lp.course_type,
    lp.lesson_date,
    lp.lesson_time,
    lt.progress_notes,
    COALESCE(lt.org_id, lp.org_id) AS org_id,
    sa.id            AS student_activity_id,
    sa.activity_type AS assigned_type,
    sa.completion_status,
    sa.progress,
    sa.assigned_at,
    sa.completed_at,
    sa.time_spent,
    sa.teacher_notes,
    sa.student_feedback,
    ta.id            AS activity_id,
    ta.activity_name,
    ta.activity_type AS teaching_activity_type,
    ta.activity_description,
    ta.duration_minutes,
    ta.target_abilities,
    ta.materials_needed,
    ta.tags,
    ta.category,
    ta.difficulty_level
  FROM lessons_prev lp
  JOIN lessons_today lt
    ON lt.student_id = lp.student_id
  CROSS JOIN org_filter of
  JOIN public.hanami_student_activities sa
    ON sa.student_id    = lp.student_id
   AND sa.activity_type = 'lesson'
   AND sa.lesson_date   = lp.lesson_date
   AND (sa.timeslot IS NULL OR sa.timeslot::time = lp.lesson_time)
   AND sa.org_id = of.org_id
  LEFT JOIN public.hanami_teaching_activities ta
    ON ta.id = sa.activity_id
   AND ta.org_id = of.org_id
) x
WHERE NULLIF(BTRIM(x.progress_notes), '') IS NULL
ORDER BY
  x.anchor_time NULLS LAST,
  x.full_name,
  CASE WHEN x.period = 'previous' THEN 0 ELSE 1 END,
  x.source,
  x.assigned_at NULLS LAST,
  x.activity_name NULLS LAST;


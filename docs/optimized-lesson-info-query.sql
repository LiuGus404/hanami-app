-- ============================================
-- 優化版：獲取今天需要填寫進度的課程活動資訊
-- 改進點：
-- 1. 添加 org_id 過濾（多租戶支援）
-- 2. 優化時區處理
-- 3. 改進 JOIN 條件和性能
-- 4. 添加註釋說明
-- ============================================

WITH p AS (
  -- 今天（香港時間）- 使用 CURRENT_DATE 更可靠
  SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Hong_Kong')::date AS today
),
lessons_today AS (
  -- 今天有課且「progress_notes 為空」的學生（取實際時段，否則固定時段）
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
    l.org_id  -- 保留 org_id 用於後續過濾
  FROM public.hanami_student_lesson l
  JOIN p ON l.lesson_date = p.today
  WHERE NULLIF(BTRIM(l.progress_notes), '') IS NULL     -- ★ 只保留「未填」或空白
    -- 如果需要特定 org_id，取消下面這行的註釋並提供參數
    -- AND ($1::uuid IS NULL OR l.org_id = $1::uuid)
),
prev_map AS (
  -- 對於今天每位學生，找出「上一堂」的日期
  SELECT
    lt.student_id,
    lt.org_id,  -- 保留 org_id
    MAX(l2.lesson_date) AS prev_lesson_date
  FROM lessons_today lt
  JOIN public.hanami_student_lesson l2
    ON l2.student_id = lt.student_id
   AND l2.lesson_date < lt.lesson_date
   AND (lt.org_id IS NULL OR l2.org_id = lt.org_id)  -- 確保同一組織
  GROUP BY lt.student_id, lt.org_id
),
lessons_prev AS (
  -- 上一堂課的詳細資料（含時間）
  SELECT
    l2.id  AS lesson_id,
    l2.student_id,
    l2.student_oid,
    l2.full_name,
    l2.lesson_teacher,
    l2.course_type,
    l2.lesson_date,
    COALESCE(l2.actual_timeslot, l2.regular_timeslot) AS lesson_time,
    l2.org_id  -- 保留 org_id
  FROM public.hanami_student_lesson l2
  JOIN prev_map pm
    ON pm.student_id = l2.student_id
   AND pm.prev_lesson_date = l2.lesson_date
   AND (pm.org_id IS NULL OR l2.org_id = pm.org_id)  -- 確保同一組織
)

SELECT *
FROM (
  /* A) 今天該堂的 lesson 活動（依日期＋時段對應） */
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
    lt.progress_notes,                                -- 今日進度（此處必為空）
    lt.org_id,                                        -- 添加 org_id

    sa.id            AS student_activity_id,
    sa.activity_type AS assigned_type,        -- 'lesson'
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
  JOIN public.hanami_student_activities sa
    ON sa.student_id    = lt.student_id
   AND sa.activity_type = 'lesson'
   AND sa.lesson_date   = lt.lesson_date
   AND (sa.timeslot IS NULL OR sa.timeslot::time = lt.lesson_time)
   AND (lt.org_id IS NULL OR sa.org_id = lt.org_id)  -- 確保同一組織
  LEFT JOIN public.hanami_teaching_activities ta
    ON ta.id = sa.activity_id
   AND (lt.org_id IS NULL OR ta.org_id = lt.org_id)  -- 確保同一組織

  UNION ALL

  /* B) 今天這批學生的 ongoing（不限定日期） */
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
    lt.progress_notes,                                -- 仍帶出今日進度（為空）
    lt.org_id,                                        -- 添加 org_id

    sa.id            AS student_activity_id,
    sa.activity_type AS assigned_type,        -- 'ongoing'
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
  JOIN public.hanami_student_activities sa
    ON sa.student_id    = lt.student_id
   AND sa.activity_type = 'ongoing'
   AND (lt.org_id IS NULL OR sa.org_id = lt.org_id)  -- 確保同一組織
  LEFT JOIN public.hanami_teaching_activities ta
    ON ta.id = sa.activity_id
   AND (lt.org_id IS NULL OR ta.org_id = lt.org_id)  -- 確保同一組織

  UNION ALL

  /* C) 上一堂課的 lesson 活動（對應上一堂的日期＋時段） */
  SELECT
    'previous'       AS period,
    'lesson_prev'    AS source,
    lt.lesson_time   AS anchor_time,          -- 用今天時間排序（依舊學生）

    lp.lesson_id,
    lp.student_id,
    lp.student_oid,
    lp.full_name,
    lp.lesson_teacher,
    lp.course_type,
    lp.lesson_date,
    lp.lesson_time,
    lt.progress_notes,                                -- 仍帶出今日進度（為空）
    COALESCE(lt.org_id, lp.org_id) AS org_id,         -- 合併 org_id

    sa.id            AS student_activity_id,
    sa.activity_type AS assigned_type,        -- 'lesson'
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
  JOIN public.hanami_student_activities sa
    ON sa.student_id    = lp.student_id
   AND sa.activity_type = 'lesson'
   AND sa.lesson_date   = lp.lesson_date
   AND (sa.timeslot IS NULL OR sa.timeslot::time = lp.lesson_time)
   AND (lp.org_id IS NULL OR sa.org_id = lp.org_id)  -- 確保同一組織
  LEFT JOIN public.hanami_teaching_activities ta
    ON ta.id = sa.activity_id
   AND (lp.org_id IS NULL OR ta.org_id = lp.org_id)  -- 確保同一組織

  /* （選用）上一堂當時 ongoing 清單：同理可保留 */
) x
-- ★ 最外層再加一道保險：只輸出「今日 progress_notes 為空」者
WHERE NULLIF(BTRIM(x.progress_notes), '') IS NULL
ORDER BY
  x.anchor_time NULLS LAST,
  x.full_name,
  CASE WHEN x.period = 'previous' THEN 0 ELSE 1 END,  -- 先顯示上一堂，再顯示今天
  x.source,
  x.assigned_at NULLS LAST,
  x.activity_name NULLS LAST;

-- ============================================
-- 使用說明：
-- 1. 如果需要過濾特定組織，取消 lessons_today CTE 中的註釋行
-- 2. 並在執行時提供 $1 參數（org_id）
-- 3. 如果使用 RLS，可以移除所有 org_id 過濾條件
-- ============================================


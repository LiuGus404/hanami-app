-- 更新目標的 progress_max 值
-- 根據目標的複雜度設定不同的最大值

-- 1. 檢查當前設定
SELECT 
  goal_name,
  progress_max,
  goal_order
FROM hanami_growth_goals
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40'
ORDER BY goal_order;

-- 2. 更新目標的 progress_max 值
-- 基礎目標設為較小的值，進階目標設為較大的值
UPDATE hanami_growth_goals 
SET progress_max = CASE 
  WHEN goal_name LIKE '%基礎%' OR goal_name LIKE '%初級%' OR goal_name LIKE '%入門%' THEN 2
  WHEN goal_name LIKE '%進階%' OR goal_name LIKE '%中級%' THEN 5
  WHEN goal_name LIKE '%高級%' OR goal_name LIKE '%熟練%' THEN 10
  WHEN goal_name LIKE '%精通%' OR goal_name LIKE '%專家%' THEN 20
  ELSE 5
END
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40'
  AND (progress_max IS NULL OR progress_max = 20);

-- 3. 為特定目標設定自定義值
-- 例如：第一個目標設為2，第二個目標設為5
UPDATE hanami_growth_goals 
SET progress_max = 2
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40' 
  AND goal_order = 1;

UPDATE hanami_growth_goals 
SET progress_max = 5
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40' 
  AND goal_order = 2;

-- 4. 檢查更新結果
SELECT 
  goal_name,
  progress_max,
  goal_order,
  CASE 
    WHEN progress_max <= 3 THEN '基礎'
    WHEN progress_max <= 7 THEN '進階'
    WHEN progress_max <= 15 THEN '高級'
    ELSE '專家'
  END as difficulty_level
FROM hanami_growth_goals
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40'
ORDER BY goal_order; 
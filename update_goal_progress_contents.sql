-- 更新目標的 progress_contents
-- 為每個等級設定對應的內容描述

-- 1. 檢查當前的 progress_contents
SELECT 
  goal_name,
  progress_max,
  progress_contents,
  array_length(progress_contents, 1) as content_count
FROM hanami_growth_goals
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40'
ORDER BY goal_order;

-- 2. 更新目標的 progress_contents
-- 為不同類型的目標設定不同的內容

-- 基礎目標 (progress_max = 2)
UPDATE hanami_growth_goals 
SET progress_contents = ARRAY[
  '基礎概念理解',
  '基本技能掌握'
]
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40' 
  AND progress_max = 2;

-- 進階目標 (progress_max = 5)
UPDATE hanami_growth_goals 
SET progress_contents = ARRAY[
  '概念理解',
  '基礎應用',
  '技能熟練',
  '進階應用',
  '綜合掌握'
]
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40' 
  AND progress_max = 5;

-- 高級目標 (progress_max = 10)
UPDATE hanami_growth_goals 
SET progress_contents = ARRAY[
  '入門理解',
  '基礎認識',
  '初步掌握',
  '基本應用',
  '技能發展',
  '熟練運用',
  '進階技巧',
  '深度理解',
  '創新應用',
  '專家水平'
]
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40' 
  AND progress_max = 10;

-- 專家目標 (progress_max = 20)
UPDATE hanami_growth_goals 
SET progress_contents = ARRAY[
  '初識階段',
  '基礎認知',
  '概念理解',
  '技能入門',
  '基本掌握',
  '初步應用',
  '技能發展',
  '熟練運用',
  '進階技巧',
  '深度理解',
  '創新思維',
  '專業應用',
  '高級技能',
  '專家技巧',
  '大師水平',
  '創新突破',
  '領導能力',
  '教學指導',
  '領域專家',
  '頂尖水平'
]
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40' 
  AND progress_max = 20;

-- 3. 檢查更新結果
SELECT 
  goal_name,
  progress_max,
  progress_contents,
  array_length(progress_contents, 1) as content_count
FROM hanami_growth_goals
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40'
ORDER BY goal_order; 
-- 為每個等級設定對應的內容描述

-- 1. 檢查當前的 progress_contents
SELECT 
  goal_name,
  progress_max,
  progress_contents,
  array_length(progress_contents, 1) as content_count
FROM hanami_growth_goals
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40'
ORDER BY goal_order;

-- 2. 更新目標的 progress_contents
-- 為不同類型的目標設定不同的內容

-- 基礎目標 (progress_max = 2)
UPDATE hanami_growth_goals 
SET progress_contents = ARRAY[
  '基礎概念理解',
  '基本技能掌握'
]
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40' 
  AND progress_max = 2;

-- 進階目標 (progress_max = 5)
UPDATE hanami_growth_goals 
SET progress_contents = ARRAY[
  '概念理解',
  '基礎應用',
  '技能熟練',
  '進階應用',
  '綜合掌握'
]
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40' 
  AND progress_max = 5;

-- 高級目標 (progress_max = 10)
UPDATE hanami_growth_goals 
SET progress_contents = ARRAY[
  '入門理解',
  '基礎認識',
  '初步掌握',
  '基本應用',
  '技能發展',
  '熟練運用',
  '進階技巧',
  '深度理解',
  '創新應用',
  '專家水平'
]
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40' 
  AND progress_max = 10;

-- 專家目標 (progress_max = 20)
UPDATE hanami_growth_goals 
SET progress_contents = ARRAY[
  '初識階段',
  '基礎認知',
  '概念理解',
  '技能入門',
  '基本掌握',
  '初步應用',
  '技能發展',
  '熟練運用',
  '進階技巧',
  '深度理解',
  '創新思維',
  '專業應用',
  '高級技能',
  '專家技巧',
  '大師水平',
  '創新突破',
  '領導能力',
  '教學指導',
  '領域專家',
  '頂尖水平'
]
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40' 
  AND progress_max = 20;

-- 3. 檢查更新結果
SELECT 
  goal_name,
  progress_max,
  progress_contents,
  array_length(progress_contents, 1) as content_count
FROM hanami_growth_goals
WHERE tree_id = 'eed6594d-79e8-4fc4-acde-12a48518dc40'
ORDER BY goal_order; 
 
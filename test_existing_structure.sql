-- 測試現有資料庫結構
-- 1. 檢查所有相關表是否存在
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('Hanami_Students', 'hanami_student_abilities', 'hanami_ability_assessments', 'hanami_growth_trees', 'hanami_growth_goals', 'hanami_development_abilities') 
    THEN '✅ 存在' 
    ELSE '❌ 不存在' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Hanami_Students', 'hanami_student_abilities', 'hanami_ability_assessments', 'hanami_growth_trees', 'hanami_growth_goals', 'hanami_development_abilities')
ORDER BY table_name;

-- 2. 檢查學生表結構
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Hanami_Students'
  AND column_name IN ('id', 'full_name', 'assigned_tree_id')
ORDER BY ordinal_position;

-- 3. 檢查學生能力表結構
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'hanami_student_abilities'
ORDER BY ordinal_position;

-- 4. 檢查能力評估表結構
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'hanami_ability_assessments'
ORDER BY ordinal_position;

-- 5. 檢查成長樹表結構
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'hanami_growth_trees'
ORDER BY ordinal_position;

-- 6. 檢查成長目標表結構
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'hanami_growth_goals'
ORDER BY ordinal_position;

-- 7. 檢查發展能力表結構
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'hanami_development_abilities'
ORDER BY ordinal_position;

-- 8. 顯示各表的記錄數量
SELECT 
  'Hanami_Students' as table_name,
  COUNT(*) as record_count
FROM "Hanami_Students"
UNION ALL
SELECT 
  'hanami_student_abilities' as table_name,
  COUNT(*) as record_count
FROM hanami_student_abilities
UNION ALL
SELECT 
  'hanami_ability_assessments' as table_name,
  COUNT(*) as record_count
FROM hanami_ability_assessments
UNION ALL
SELECT 
  'hanami_growth_trees' as table_name,
  COUNT(*) as record_count
FROM hanami_growth_trees
UNION ALL
SELECT 
  'hanami_growth_goals' as table_name,
  COUNT(*) as record_count
FROM hanami_growth_goals
UNION ALL
SELECT 
  'hanami_development_abilities' as table_name,
  COUNT(*) as record_count
FROM hanami_development_abilities
ORDER BY table_name;

-- 9. 檢查是否有學生已分配成長樹
SELECT 
  COUNT(*) as total_students,
  COUNT(assigned_tree_id) as students_with_tree,
  ROUND(COUNT(assigned_tree_id) * 100.0 / COUNT(*), 2) as percentage_with_tree
FROM "Hanami_Students";

-- 10. 顯示一些示例資料
SELECT '學生示例' as info, id, full_name, assigned_tree_id FROM "Hanami_Students" LIMIT 3;
SELECT '成長樹示例' as info, id, tree_name, course_type_id FROM hanami_growth_trees LIMIT 3;
SELECT '發展能力示例' as info, id, ability_name, max_level FROM hanami_development_abilities LIMIT 3; 
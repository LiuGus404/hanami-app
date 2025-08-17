-- 修正 hanami_tree_activities 表的 activity_type 約束
-- 添加 'game' 類型支援

-- 1. 先刪除現有的約束
DO $$
BEGIN
  -- 檢查約束是否存在
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%hanami_tree_activities_activity_type_check%'
  ) THEN
    -- 獲取約束名稱
    EXECUTE (
      'ALTER TABLE hanami_tree_activities DROP CONSTRAINT ' || 
      (SELECT constraint_name FROM information_schema.check_constraints 
       WHERE constraint_name LIKE '%hanami_tree_activities_activity_type_check%' LIMIT 1)
    );
  END IF;
END $$;

-- 2. 添加新的約束（包含 'game' 類型）
ALTER TABLE hanami_tree_activities 
ADD CONSTRAINT hanami_tree_activities_activity_type_check 
CHECK (activity_type IN ('custom', 'teaching', 'assessment', 'practice', 'game'));

-- 3. 確認修正成功
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'hanami_tree_activities' 
AND column_name = 'activity_type';

-- 4. 顯示約束信息
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%hanami_tree_activities_activity_type_check%'; 
-- 修復版本控制函數
-- 重新創建有問題的函數

-- 1. 刪除現有函數
DROP FUNCTION IF EXISTS get_assessment_version_info(UUID);
DROP FUNCTION IF EXISTS compare_growth_tree_versions(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS record_growth_tree_version(UUID, TEXT, TEXT, TEXT, TEXT, UUID);

-- 2. 重新創建 get_assessment_version_info 函數
CREATE OR REPLACE FUNCTION get_assessment_version_info(p_assessment_id UUID)
RETURNS TABLE (
  assessment_version TEXT,
  tree_version TEXT,
  current_tree_version TEXT,
  version_compatibility JSONB,
  goals_snapshot_data JSONB
) AS $$
DECLARE
  v_assessment_record RECORD;
  v_tree_id UUID;
  v_current_version TEXT;
  v_assessment_version TEXT;
  v_tree_version TEXT;
  v_goals_snapshot JSONB;
BEGIN
  -- 獲取評估記錄
  SELECT * INTO v_assessment_record
  FROM hanami_ability_assessments
  WHERE id = p_assessment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment record not found: %', p_assessment_id;
  END IF;
  
  v_tree_id := v_assessment_record.tree_id;
  v_assessment_version := COALESCE((v_assessment_record.version_info->>'version'), '1.0');
  v_tree_version := COALESCE(v_assessment_record.tree_version, '1.0');
  
  -- 獲取當前樹版本
  SELECT version INTO v_current_version
  FROM hanami_growth_tree_versions
  WHERE tree_id = v_tree_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- 如果沒有找到當前版本，使用預設值
  IF v_current_version IS NULL THEN
    v_current_version := '1.0';
  END IF;
  
  -- 獲取評估時的目標快照
  SELECT goals_snapshot INTO v_goals_snapshot
  FROM hanami_growth_tree_versions
  WHERE tree_id = v_tree_id AND version = v_tree_version;
  
  -- 如果沒有找到快照，使用空陣列
  IF v_goals_snapshot IS NULL THEN
    v_goals_snapshot := '[]'::jsonb;
  END IF;
  
  RETURN QUERY
  SELECT 
    v_assessment_version::TEXT as assessment_version,
    v_tree_version::TEXT as tree_version,
    v_current_version::TEXT as current_tree_version,
    jsonb_build_object(
      'is_current_version', v_tree_version = v_current_version,
      'version_difference', CASE 
        WHEN v_tree_version = v_current_version THEN 'none'
        ELSE 'different'
      END,
      'compatibility_status', CASE 
        WHEN v_tree_version = v_current_version THEN 'compatible'
        ELSE 'needs_migration'
      END
    ) as version_compatibility,
    v_goals_snapshot as goals_snapshot_data;
END;
$$ LANGUAGE plpgsql;

-- 3. 重新創建 compare_growth_tree_versions 函數
CREATE OR REPLACE FUNCTION compare_growth_tree_versions(
  p_tree_id UUID,
  p_from_version TEXT,
  p_to_version TEXT
)
RETURNS TABLE (
  change_type TEXT,
  goal_id UUID,
  goal_name TEXT,
  change_details JSONB
) AS $$
DECLARE
  v_from_goals JSONB;
  v_to_goals JSONB;
BEGIN
  -- 獲取兩個版本的目標快照
  SELECT goals_snapshot INTO v_from_goals
  FROM hanami_growth_tree_versions
  WHERE tree_id = p_tree_id AND version = p_from_version;
  
  SELECT goals_snapshot INTO v_to_goals
  FROM hanami_growth_tree_versions
  WHERE tree_id = p_tree_id AND version = p_to_version;
  
  -- 如果沒有找到版本，返回基本比較資訊
  IF v_from_goals IS NULL OR v_to_goals IS NULL THEN
    RETURN QUERY
    SELECT 
      'version_comparison'::TEXT as change_type,
      NULL::UUID as goal_id,
      '版本比較'::TEXT as goal_name,
      jsonb_build_object(
        'from_version', p_from_version,
        'to_version', p_to_version,
        'from_goals_count', CASE WHEN v_from_goals IS NULL THEN 0 ELSE jsonb_array_length(v_from_goals) END,
        'to_goals_count', CASE WHEN v_to_goals IS NULL THEN 0 ELSE jsonb_array_length(v_to_goals) END,
        'error', 'One or both versions not found'
      ) as change_details;
    RETURN;
  END IF;
  
  -- 比較目標變化
  RETURN QUERY
  SELECT 
    'version_comparison'::TEXT as change_type,
    NULL::UUID as goal_id,
    '版本比較'::TEXT as goal_name,
    jsonb_build_object(
      'from_version', p_from_version,
      'to_version', p_to_version,
      'from_goals_count', jsonb_array_length(v_from_goals),
      'to_goals_count', jsonb_array_length(v_to_goals),
      'changes_detected', true
    ) as change_details;
END;
$$ LANGUAGE plpgsql;

-- 4. 重新創建 record_growth_tree_version 函數
CREATE OR REPLACE FUNCTION record_growth_tree_version(
  p_tree_id UUID,
  p_version TEXT,
  p_version_name TEXT DEFAULT NULL,
  p_version_description TEXT DEFAULT NULL,
  p_changes_summary TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_goals_snapshot JSONB;
BEGIN
  -- 檢查版本是否已存在
  IF EXISTS (SELECT 1 FROM hanami_growth_tree_versions WHERE tree_id = p_tree_id AND version = p_version) THEN
    RAISE EXCEPTION 'Version % already exists for tree %', p_version, p_tree_id;
  END IF;
  
  -- 獲取當前成長樹目標的快照
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'goal_name', goal_name,
      'goal_description', goal_description,
      'assessment_mode', assessment_mode,
      'goal_order', goal_order,
      'progress_max', progress_max,
      'multi_select_levels', multi_select_levels,
      'version', COALESCE(version, '1.0')
    ) ORDER BY goal_order
  ) INTO v_goals_snapshot
  FROM hanami_growth_goals
  WHERE tree_id = p_tree_id AND deprecated_at IS NULL;
  
  -- 插入版本記錄
  INSERT INTO hanami_growth_tree_versions (
    tree_id, version, version_name, version_description, 
    goals_snapshot, changes_summary, created_by
  ) VALUES (
    p_tree_id, p_version, p_version_name, p_version_description,
    COALESCE(v_goals_snapshot, '[]'::jsonb), p_changes_summary, p_created_by
  ) RETURNING id INTO v_version_id;
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- 5. 確保現有評估記錄有版本資訊
UPDATE hanami_ability_assessments 
SET 
  version_info = jsonb_build_object(
    'version', '1.0',
    'created_at', created_at,
    'updated_at', updated_at
  ),
  tree_version = '1.0'
WHERE version_info IS NULL OR tree_version IS NULL;

-- 6. 確保有初始版本記錄
INSERT INTO hanami_growth_tree_versions (
  tree_id, version, version_name, version_description, goals_snapshot
)
SELECT 
  t.id,
  '1.0',
  '初始版本',
  '系統初始版本',
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'goal_name', g.goal_name,
        'goal_description', g.goal_description,
        'assessment_mode', g.assessment_mode,
        'goal_order', g.goal_order,
        'progress_max', g.progress_max,
        'multi_select_levels', g.multi_select_levels,
        'version', COALESCE(g.version, '1.0')
      ) ORDER BY g.goal_order
    ) FROM hanami_growth_goals g WHERE g.tree_id = t.id),
    '[]'::jsonb
  )
FROM hanami_growth_trees t
WHERE NOT EXISTS (
  SELECT 1 FROM hanami_growth_tree_versions v WHERE v.tree_id = t.id
);

-- 自動版本記錄系統
-- 當成長樹目標發生變更時自動記錄版本

-- 1. 創建版本記錄函數
CREATE OR REPLACE FUNCTION auto_record_tree_version_on_change()
RETURNS TRIGGER AS $$
DECLARE
  v_current_version TEXT;
  v_new_version TEXT;
  v_version_id UUID;
  v_changes_summary TEXT;
  v_change_count INTEGER := 0;
BEGIN
  -- 獲取當前版本
  SELECT version INTO v_current_version
  FROM hanami_growth_tree_versions
  WHERE tree_id = COALESCE(NEW.tree_id, OLD.tree_id)
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- 如果沒有版本記錄，使用預設版本
  IF v_current_version IS NULL THEN
    v_current_version := '1.0';
  END IF;
  
  -- 計算新版本號（簡單的版本號遞增）
  v_new_version := CASE 
    WHEN v_current_version ~ '^\d+\.\d+$' THEN
      -- 如果是 x.y 格式，增加 y
      SPLIT_PART(v_current_version, '.', 1) || '.' || (SPLIT_PART(v_current_version, '.', 2)::INTEGER + 1)::TEXT
    ELSE
      -- 其他格式，使用時間戳
      'v' || EXTRACT(EPOCH FROM NOW())::TEXT
  END;
  
  -- 生成變更摘要
  IF TG_OP = 'INSERT' THEN
    v_changes_summary := '新增學習目標: ' || NEW.goal_name;
    v_change_count := 1;
  ELSIF TG_OP = 'UPDATE' THEN
    v_changes_summary := '修改學習目標: ' || COALESCE(NEW.goal_name, OLD.goal_name);
    v_change_count := 1;
  ELSIF TG_OP = 'DELETE' THEN
    v_changes_summary := '刪除學習目標: ' || OLD.goal_name;
    v_change_count := 1;
  END IF;
  
  -- 記錄新版本
  INSERT INTO hanami_growth_tree_versions (
    tree_id, 
    version, 
    version_name, 
    version_description, 
    goals_snapshot, 
    changes_summary, 
    created_by
  ) VALUES (
    COALESCE(NEW.tree_id, OLD.tree_id),
    v_new_version,
    '自動版本 ' || v_new_version,
    '系統自動記錄的版本變更',
    (SELECT jsonb_agg(
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
    ) FROM hanami_growth_goals 
    WHERE tree_id = COALESCE(NEW.tree_id, OLD.tree_id) 
    AND deprecated_at IS NULL),
    v_changes_summary,
    NULL
  ) RETURNING id INTO v_version_id;
  
  -- 記錄變更日誌
  INSERT INTO hanami_version_change_logs (
    tree_id,
    change_type,
    goal_id,
    goal_name,
    change_details,
    version_id
  ) VALUES (
    COALESCE(NEW.tree_id, OLD.tree_id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'add'
      WHEN TG_OP = 'UPDATE' THEN 'modify'
      WHEN TG_OP = 'DELETE' THEN 'remove'
    END,
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.goal_name, OLD.goal_name),
    jsonb_build_object(
      'operation', TG_OP,
      'old_data', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
      'timestamp', NOW()
    ),
    v_version_id
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 2. 創建觸發器
DROP TRIGGER IF EXISTS trigger_auto_version_on_goal_change ON hanami_growth_goals;

CREATE TRIGGER trigger_auto_version_on_goal_change
  AFTER INSERT OR UPDATE OR DELETE ON hanami_growth_goals
  FOR EACH ROW
  EXECUTE FUNCTION auto_record_tree_version_on_change();

-- 3. 創建手動版本記錄函數
CREATE OR REPLACE FUNCTION manual_record_tree_version(
  p_tree_id UUID,
  p_version_name TEXT DEFAULT NULL,
  p_version_description TEXT DEFAULT NULL,
  p_changes_summary TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_current_version TEXT;
  v_new_version TEXT;
  v_version_id UUID;
BEGIN
  -- 獲取當前版本
  SELECT version INTO v_current_version
  FROM hanami_growth_tree_versions
  WHERE tree_id = p_tree_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- 如果沒有版本記錄，使用預設版本
  IF v_current_version IS NULL THEN
    v_current_version := '1.0';
  END IF;
  
  -- 計算新版本號
  v_new_version := CASE 
    WHEN v_current_version ~ '^\d+\.\d+$' THEN
      SPLIT_PART(v_current_version, '.', 1) || '.' || (SPLIT_PART(v_current_version, '.', 2)::INTEGER + 1)::TEXT
    ELSE
      'v' || EXTRACT(EPOCH FROM NOW())::TEXT
  END;
  
  -- 記錄新版本
  INSERT INTO hanami_growth_tree_versions (
    tree_id, 
    version, 
    version_name, 
    version_description, 
    goals_snapshot, 
    changes_summary, 
    created_by
  ) VALUES (
    p_tree_id,
    v_new_version,
    COALESCE(p_version_name, '手動版本 ' || v_new_version),
    COALESCE(p_version_description, '手動記錄的版本'),
    (SELECT jsonb_agg(
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
    ) FROM hanami_growth_goals 
    WHERE tree_id = p_tree_id 
    AND deprecated_at IS NULL),
    COALESCE(p_changes_summary, '手動版本記錄'),
    NULL
  ) RETURNING id INTO v_version_id;
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- 4. 創建版本比較函數（增強版）
CREATE OR REPLACE FUNCTION compare_growth_tree_versions_detailed(
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
  v_from_goal JSONB;
  v_to_goal JSONB;
  v_goal_id TEXT;
BEGIN
  -- 獲取兩個版本的目標快照
  SELECT goals_snapshot INTO v_from_goals
  FROM hanami_growth_tree_versions
  WHERE tree_id = p_tree_id AND version = p_from_version;
  
  SELECT goals_snapshot INTO v_to_goals
  FROM hanami_growth_tree_versions
  WHERE tree_id = p_tree_id AND version = p_to_version;
  
  -- 如果沒有找到版本，返回錯誤資訊
  IF v_from_goals IS NULL OR v_to_goals IS NULL THEN
    RETURN QUERY
    SELECT 
      'error'::TEXT as change_type,
      NULL::UUID as goal_id,
      '版本比較錯誤'::TEXT as goal_name,
      jsonb_build_object(
        'error', 'One or both versions not found',
        'from_version', p_from_version,
        'to_version', p_to_version
      ) as change_details;
    RETURN;
  END IF;
  
  -- 比較目標變化
  -- 檢查新增的目標
  FOR v_to_goal IN SELECT * FROM jsonb_array_elements(v_to_goals)
  LOOP
    v_goal_id := v_to_goal->>'id';
    
    -- 檢查是否在 from_version 中存在
    SELECT * INTO v_from_goal 
    FROM jsonb_array_elements(v_from_goals) 
    WHERE value->>'id' = v_goal_id;
    
    IF v_from_goal IS NULL THEN
      -- 新增的目標
      RETURN QUERY
      SELECT 
        'added'::TEXT as change_type,
        (v_to_goal->>'id')::UUID as goal_id,
        (v_to_goal->>'goal_name')::TEXT as goal_name,
        jsonb_build_object(
          'new_goal', v_to_goal,
          'change_type', 'added'
        ) as change_details;
    ELSE
      -- 檢查是否有變更
      IF v_from_goal != v_to_goal THEN
        RETURN QUERY
        SELECT 
          'modified'::TEXT as change_type,
          (v_to_goal->>'id')::UUID as goal_id,
          (v_to_goal->>'goal_name')::TEXT as goal_name,
          jsonb_build_object(
            'old_goal', v_from_goal,
            'new_goal', v_to_goal,
            'change_type', 'modified'
          ) as change_details;
      END IF;
    END IF;
  END LOOP;
  
  -- 檢查刪除的目標
  FOR v_from_goal IN SELECT * FROM jsonb_array_elements(v_from_goals)
  LOOP
    v_goal_id := v_from_goal->>'id';
    
    -- 檢查是否在 to_version 中存在
    SELECT * INTO v_to_goal 
    FROM jsonb_array_elements(v_to_goals) 
    WHERE value->>'id' = v_goal_id;
    
    IF v_to_goal IS NULL THEN
      -- 刪除的目標
      RETURN QUERY
      SELECT 
        'removed'::TEXT as change_type,
        (v_from_goal->>'id')::UUID as goal_id,
        (v_from_goal->>'goal_name')::TEXT as goal_name,
        jsonb_build_object(
          'old_goal', v_from_goal,
          'change_type', 'removed'
        ) as change_details;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

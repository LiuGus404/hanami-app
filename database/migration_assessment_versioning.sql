-- 版本控制系統遷移腳本
-- 為評估記錄添加版本控制功能

-- 1. 為 hanami_ability_assessments 表添加版本控制欄位
ALTER TABLE hanami_ability_assessments 
ADD COLUMN IF NOT EXISTS version_info JSONB DEFAULT '{"version": "1.0", "created_at": null, "updated_at": null}'::jsonb,
ADD COLUMN IF NOT EXISTS tree_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS goals_snapshot JSONB;

-- 2. 為 hanami_growth_goals 表添加版本控制欄位
ALTER TABLE hanami_growth_goals 
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deprecated_reason TEXT;

-- 3. 創建版本歷史表
CREATE TABLE IF NOT EXISTS hanami_growth_tree_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES hanami_growth_trees(id),
  version TEXT NOT NULL,
  version_name TEXT,
  version_description TEXT,
  goals_snapshot JSONB NOT NULL,
  changes_summary TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(tree_id, version)
);

-- 4. 創建版本變更日誌表
CREATE TABLE IF NOT EXISTS hanami_version_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES hanami_growth_trees(id),
  from_version TEXT NOT NULL,
  to_version TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('goal_added', 'goal_removed', 'goal_modified', 'goal_reordered')),
  goal_id UUID,
  goal_name TEXT,
  change_details JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 創建函數：記錄成長樹版本
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
      'version', version
    )
  ) INTO v_goals_snapshot
  FROM hanami_growth_goals
  WHERE tree_id = p_tree_id AND deprecated_at IS NULL
  ORDER BY goal_order;
  
  -- 插入版本記錄
  INSERT INTO hanami_growth_tree_versions (
    tree_id, version, version_name, version_description, 
    goals_snapshot, changes_summary, created_by
  ) VALUES (
    p_tree_id, p_version, p_version_name, p_version_description,
    v_goals_snapshot, p_changes_summary, p_created_by
  ) RETURNING id INTO v_version_id;
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- 6. 創建函數：比較兩個版本
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
  v_from_goal JSONB;
  v_to_goal JSONB;
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
  -- 這裡可以實現詳細的比較邏輯
  -- 暫時返回基本結構
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

-- 7. 創建觸發器：自動記錄版本變更
CREATE OR REPLACE FUNCTION trigger_version_change_log()
RETURNS TRIGGER AS $$
BEGIN
  -- 當成長樹目標發生變更時，記錄變更日誌
  IF TG_OP = 'INSERT' THEN
    INSERT INTO hanami_version_change_logs (
      tree_id, from_version, to_version, change_type, 
      goal_id, goal_name, change_details
    ) VALUES (
      NEW.tree_id, 'previous', NEW.version, 'goal_added',
      NEW.id, NEW.goal_name, jsonb_build_object('new_goal', to_jsonb(NEW))
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO hanami_version_change_logs (
      tree_id, from_version, to_version, change_type,
      goal_id, goal_name, change_details
    ) VALUES (
      NEW.tree_id, OLD.version, NEW.version, 'goal_modified',
      NEW.id, NEW.goal_name, jsonb_build_object(
        'old_data', to_jsonb(OLD),
        'new_data', to_jsonb(NEW)
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO hanami_version_change_logs (
      tree_id, from_version, to_version, change_type,
      goal_id, goal_name, change_details
    ) VALUES (
      OLD.tree_id, OLD.version, 'current', 'goal_removed',
      OLD.id, OLD.goal_name, jsonb_build_object('removed_goal', to_jsonb(OLD))
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
DROP TRIGGER IF EXISTS trigger_growth_goals_version_change ON hanami_growth_goals;
CREATE TRIGGER trigger_growth_goals_version_change
  AFTER INSERT OR UPDATE OR DELETE ON hanami_growth_goals
  FOR EACH ROW EXECUTE FUNCTION trigger_version_change_log();

-- 8. 創建函數：獲取評估記錄的版本資訊
CREATE OR REPLACE FUNCTION get_assessment_version_info(p_assessment_id UUID)
RETURNS TABLE (
  assessment_version TEXT,
  tree_version TEXT,
  current_tree_version TEXT,
  version_compatibility JSONB,
  goals_snapshot JSONB
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
    v_goals_snapshot as goals_snapshot;
END;
$$ LANGUAGE plpgsql;

-- 9. 初始化當前版本
-- 為現有的成長樹創建初始版本記錄
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

-- 10. 更新現有評估記錄的版本資訊
UPDATE hanami_ability_assessments 
SET 
  version_info = jsonb_build_object(
    'version', '1.0',
    'created_at', created_at,
    'updated_at', updated_at
  ),
  tree_version = '1.0'
WHERE version_info IS NULL;

COMMENT ON TABLE hanami_growth_tree_versions IS '成長樹版本歷史表';
COMMENT ON TABLE hanami_version_change_logs IS '版本變更日誌表';
COMMENT ON FUNCTION record_growth_tree_version IS '記錄成長樹版本';
COMMENT ON FUNCTION compare_growth_tree_versions IS '比較兩個版本';
COMMENT ON FUNCTION get_assessment_version_info IS '獲取評估記錄的版本資訊';

-- 評估記錄版本兼容性遷移腳本
-- 此腳本用於處理成長樹結構變更後的評估記錄兼容性問題

-- 1. 創建版本兼容性記錄表
CREATE TABLE IF NOT EXISTS hanami_assessment_compatibility_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES hanami_ability_assessments(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES hanami_growth_trees(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('deleted_goal', 'level_count_changed', 'max_level_changed', 'assessment_mode_changed')),
  goal_id UUID,
  goal_name TEXT,
  original_data JSONB,
  current_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT
);

-- 2. 創建索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_assessment_compatibility_assessment_id ON hanami_assessment_compatibility_logs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_compatibility_tree_id ON hanami_assessment_compatibility_logs(tree_id);
CREATE INDEX IF NOT EXISTS idx_assessment_compatibility_issue_type ON hanami_assessment_compatibility_logs(issue_type);
CREATE INDEX IF NOT EXISTS idx_assessment_compatibility_resolved ON hanami_assessment_compatibility_logs(resolved);

-- 3. 創建函數來檢測和記錄兼容性問題
CREATE OR REPLACE FUNCTION detect_assessment_compatibility_issues()
RETURNS TABLE (
  assessment_id UUID,
  tree_id UUID,
  issue_type TEXT,
  goal_id UUID,
  goal_name TEXT,
  original_data JSONB,
  current_data JSONB
) AS $$
DECLARE
  assessment_record RECORD;
  goal_record RECORD;
  current_goal RECORD;
  issue_count INTEGER := 0;
BEGIN
  -- 遍歷所有評估記錄
  FOR assessment_record IN 
    SELECT id, tree_id, selected_goals, ability_assessments 
    FROM hanami_ability_assessments 
    WHERE selected_goals IS NOT NULL AND jsonb_array_length(selected_goals) > 0
  LOOP
    -- 檢查 selected_goals 中的每個目標
    FOR goal_record IN 
      SELECT * FROM jsonb_array_elements(assessment_record.selected_goals)
    LOOP
      -- 檢查目標是否仍然存在
      SELECT * INTO current_goal 
      FROM hanami_growth_goals 
      WHERE id = (goal_record.value->>'goal_id')::UUID;
      
      IF current_goal IS NULL THEN
        -- 目標已刪除
        RETURN QUERY SELECT 
          assessment_record.id,
          assessment_record.tree_id,
          'deleted_goal'::TEXT,
          (goal_record.value->>'goal_id')::UUID,
          COALESCE(goal_record.value->>'goal_name', '未知目標'),
          goal_record.value,
          NULL::JSONB;
        issue_count := issue_count + 1;
      ELSE
        -- 檢查評估模式是否匹配
        IF (current_goal.assessment_mode != (goal_record.value->>'assessment_mode')) THEN
          RETURN QUERY SELECT 
            assessment_record.id,
            assessment_record.tree_id,
            'assessment_mode_changed'::TEXT,
            current_goal.id,
            current_goal.goal_name,
            jsonb_build_object('mode', goal_record.value->>'assessment_mode'),
            jsonb_build_object('mode', current_goal.assessment_mode);
          issue_count := issue_count + 1;
        END IF;
        
        -- 檢查多選模式的等級數量
        IF current_goal.assessment_mode = 'multi_select' THEN
          IF jsonb_array_length(current_goal.multi_select_levels) != 
             jsonb_array_length(COALESCE(goal_record.value->'selected_levels', '[]'::jsonb)) THEN
            RETURN QUERY SELECT 
              assessment_record.id,
              assessment_record.tree_id,
              'level_count_changed'::TEXT,
              current_goal.id,
              current_goal.goal_name,
              jsonb_build_object('levels', goal_record.value->'selected_levels'),
              jsonb_build_object('levels', current_goal.multi_select_levels);
            issue_count := issue_count + 1;
          END IF;
        END IF;
        
        -- 檢查進度模式的最大等級
        IF current_goal.assessment_mode = 'progress' THEN
          IF current_goal.progress_max != (goal_record.value->>'progress_level')::INTEGER THEN
            RETURN QUERY SELECT 
              assessment_record.id,
              assessment_record.tree_id,
              'max_level_changed'::TEXT,
              current_goal.id,
              current_goal.goal_name,
              jsonb_build_object('maxLevel', goal_record.value->>'progress_level'),
              jsonb_build_object('maxLevel', current_goal.progress_max);
            issue_count := issue_count + 1;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '檢測到 % 個兼容性問題', issue_count;
END;
$$ LANGUAGE plpgsql;

-- 4. 創建函數來自動修復兼容性問題
CREATE OR REPLACE FUNCTION auto_fix_assessment_compatibility()
RETURNS INTEGER AS $$
DECLARE
  assessment_record RECORD;
  goal_record RECORD;
  current_goal RECORD;
  fixed_count INTEGER := 0;
  updated_goals JSONB;
  goal_array JSONB;
BEGIN
  -- 遍歷所有評估記錄
  FOR assessment_record IN 
    SELECT id, tree_id, selected_goals, ability_assessments 
    FROM hanami_ability_assessments 
    WHERE selected_goals IS NOT NULL AND jsonb_array_length(selected_goals) > 0
  LOOP
    updated_goals := '[]'::JSONB;
    
    -- 處理 selected_goals 中的每個目標
    FOR goal_record IN 
      SELECT * FROM jsonb_array_elements(assessment_record.selected_goals)
    LOOP
      -- 檢查目標是否仍然存在
      SELECT * INTO current_goal 
      FROM hanami_growth_goals 
      WHERE id = (goal_record.value->>'goal_id')::UUID;
      
      IF current_goal IS NOT NULL THEN
        -- 目標存在，進行兼容性修復
        goal_array := goal_record.value;
        
        -- 更新評估模式
        goal_array := jsonb_set(goal_array, '{assessment_mode}', to_jsonb(current_goal.assessment_mode));
        
        -- 處理多選模式
        IF current_goal.assessment_mode = 'multi_select' THEN
          -- 過濾掉不存在的等級
          WITH valid_levels AS (
            SELECT level FROM jsonb_array_elements_text(current_goal.multi_select_levels) AS level
            WHERE level = ANY(
              SELECT jsonb_array_elements_text(COALESCE(goal_record.value->'selected_levels', '[]'::jsonb))
            )
          )
          SELECT jsonb_agg(level) INTO goal_array
          FROM valid_levels;
          
          goal_array := jsonb_set(goal_record.value, '{selected_levels}', goal_array);
        END IF;
        
        -- 處理進度模式
        IF current_goal.assessment_mode = 'progress' THEN
          -- 調整等級以適應新的最大值
          goal_array := jsonb_set(
            goal_array, 
            '{progress_level}', 
            to_jsonb(LEAST((goal_record.value->>'progress_level')::INTEGER, current_goal.progress_max))
          );
        END IF;
        
        -- 添加到更新後的目標列表
        updated_goals := updated_goals || goal_array;
        fixed_count := fixed_count + 1;
      END IF;
    END LOOP;
    
    -- 更新評估記錄
    IF jsonb_array_length(updated_goals) > 0 THEN
      UPDATE hanami_ability_assessments 
      SET 
        selected_goals = updated_goals,
        updated_at = NOW()
      WHERE id = assessment_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE '自動修復了 % 個評估記錄', fixed_count;
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql;

-- 5. 創建觸發器來自動記錄兼容性問題
CREATE OR REPLACE FUNCTION log_assessment_compatibility_issue()
RETURNS TRIGGER AS $$
BEGIN
  -- 當成長樹目標發生變更時，記錄相關的兼容性問題
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    -- 查找受影響的評估記錄
    INSERT INTO hanami_assessment_compatibility_logs (
      assessment_id, tree_id, issue_type, goal_id, goal_name, original_data, current_data
    )
    SELECT 
      a.id,
      a.tree_id,
      CASE 
        WHEN TG_OP = 'DELETE' THEN 'deleted_goal'
        WHEN OLD.assessment_mode != NEW.assessment_mode THEN 'assessment_mode_changed'
        WHEN OLD.progress_max != NEW.progress_max THEN 'max_level_changed'
        WHEN jsonb_array_length(OLD.multi_select_levels) != jsonb_array_length(NEW.multi_select_levels) THEN 'level_count_changed'
        ELSE 'assessment_mode_changed'
      END,
      OLD.id,
      OLD.goal_name,
      to_jsonb(OLD),
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    FROM hanami_ability_assessments a
    WHERE a.tree_id = OLD.tree_id
    AND a.selected_goals @> jsonb_build_array(jsonb_build_object('goal_id', OLD.id));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;
CREATE TRIGGER trigger_log_assessment_compatibility
  AFTER UPDATE OR DELETE ON hanami_growth_goals
  FOR EACH ROW
  EXECUTE FUNCTION log_assessment_compatibility_issue();

-- 6. 創建視圖來查看兼容性問題摘要
CREATE OR REPLACE VIEW assessment_compatibility_summary AS
SELECT 
  t.tree_name,
  COUNT(DISTINCT acl.assessment_id) as affected_assessments,
  COUNT(acl.id) as total_issues,
  COUNT(CASE WHEN acl.issue_type = 'deleted_goal' THEN 1 END) as deleted_goals,
  COUNT(CASE WHEN acl.issue_type = 'level_count_changed' THEN 1 END) as level_count_changes,
  COUNT(CASE WHEN acl.issue_type = 'max_level_changed' THEN 1 END) as max_level_changes,
  COUNT(CASE WHEN acl.issue_type = 'assessment_mode_changed' THEN 1 END) as mode_changes,
  COUNT(CASE WHEN acl.resolved THEN 1 END) as resolved_issues,
  MAX(acl.processed_at) as last_processed
FROM hanami_assessment_compatibility_logs acl
JOIN hanami_growth_trees t ON acl.tree_id = t.id
GROUP BY t.id, t.tree_name
ORDER BY affected_assessments DESC, total_issues DESC;

-- 7. 執行初始兼容性檢測
-- 注意：這會產生大量日誌記錄，建議在維護時間執行
-- SELECT detect_assessment_compatibility_issues();

-- 8. 創建清理舊日誌的函數
CREATE OR REPLACE FUNCTION cleanup_old_compatibility_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM hanami_assessment_compatibility_logs 
  WHERE processed_at < NOW() - INTERVAL '1 day' * days_to_keep
  AND resolved = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '清理了 % 條舊的兼容性日誌記錄', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 9. 創建定期清理的排程（需要 pg_cron 擴展）
-- SELECT cron.schedule('cleanup-compatibility-logs', '0 2 * * 0', 'SELECT cleanup_old_compatibility_logs(30);');

-- 使用說明：
-- 1. 執行此腳本創建必要的表和函數
-- 2. 手動執行 detect_assessment_compatibility_issues() 來檢測問題
-- 3. 執行 auto_fix_assessment_compatibility() 來自動修復問題
-- 4. 查看 assessment_compatibility_summary 視圖來監控問題狀態
-- 5. 定期執行 cleanup_old_compatibility_logs() 來清理舊日誌

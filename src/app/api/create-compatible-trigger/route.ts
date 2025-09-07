import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // 創建兼容的觸發器方案
    const compatibleTriggerSQL = `
      -- 1. 刪除所有有問題的觸發器
      DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;
      DROP TRIGGER IF EXISTS trigger_log_version_change ON hanami_growth_goals;
      DROP TRIGGER IF EXISTS trigger_version_log ON hanami_growth_goals;
      DROP TRIGGER IF EXISTS trigger_log_growth_goal_changes ON hanami_growth_goals;
      
      -- 2. 刪除舊的觸發器函數
      DROP FUNCTION IF EXISTS log_growth_goal_changes();
      DROP FUNCTION IF EXISTS log_assessment_compatibility();
      DROP FUNCTION IF EXISTS log_version_change();
      
      -- 3. 創建兼容的觸發器函數
      CREATE OR REPLACE FUNCTION log_growth_goal_version_changes()
      RETURNS TRIGGER AS $$
      DECLARE
        current_version TEXT;
        new_version TEXT;
        tree_id_val UUID;
        goal_id_val UUID;
        goal_name_val TEXT;
        change_type_val TEXT;
        change_details_val JSONB;
      BEGIN
        -- 獲取基本資訊
        tree_id_val := COALESCE(NEW.tree_id, OLD.tree_id);
        goal_id_val := COALESCE(NEW.id, OLD.id);
        goal_name_val := COALESCE(NEW.goal_name, OLD.goal_name);
        
        -- 確定版本資訊
        current_version := COALESCE(OLD.version, '1.0');
        new_version := COALESCE(NEW.version, '1.0');
        
        -- 確定變更類型
        CASE TG_OP
          WHEN 'INSERT' THEN
            change_type_val := 'goal_added';
            change_details_val := to_jsonb(NEW);
          WHEN 'UPDATE' THEN
            change_type_val := 'goal_modified';
            change_details_val := jsonb_build_object(
              'old', to_jsonb(OLD),
              'new', to_jsonb(NEW),
              'changes', jsonb_build_object(
                'goal_name_changed', OLD.goal_name IS DISTINCT FROM NEW.goal_name,
                'goal_description_changed', OLD.goal_description IS DISTINCT FROM NEW.goal_description,
                'progress_max_changed', OLD.progress_max IS DISTINCT FROM NEW.progress_max,
                'required_abilities_changed', OLD.required_abilities IS DISTINCT FROM NEW.required_abilities,
                'related_activities_changed', OLD.related_activities IS DISTINCT FROM NEW.related_activities,
                'progress_contents_changed', OLD.progress_contents IS DISTINCT FROM NEW.progress_contents
              )
            );
          WHEN 'DELETE' THEN
            change_type_val := 'goal_removed';
            change_details_val := to_jsonb(OLD);
        END CASE;
        
        -- 插入版本變更日誌（使用實際存在的欄位）
        INSERT INTO hanami_version_change_logs (
          tree_id,
          from_version,
          to_version,
          change_type,
          goal_id,
          goal_name,
          change_details,
          created_by
        ) VALUES (
          tree_id_val,
          current_version,
          new_version,
          change_type_val,
          goal_id_val,
          goal_name_val,
          change_details_val,
          NULL -- 可以根據需要設置 created_by
        );
        
        -- 返回適當的值
        RETURN CASE TG_OP
          WHEN 'DELETE' THEN OLD
          ELSE NEW
        END;
      END;
      $$ LANGUAGE plpgsql;
      
      -- 4. 創建新的觸發器
      CREATE TRIGGER trigger_log_growth_goal_version_changes
        AFTER INSERT OR UPDATE OR DELETE ON hanami_growth_goals
        FOR EACH ROW EXECUTE FUNCTION log_growth_goal_version_changes();
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: compatibleTriggerSQL
    });

    if (createError) {
      return NextResponse.json({
        success: false,
        error: '需要手動執行 SQL 語句',
        sql: compatibleTriggerSQL,
        message: '請在 Supabase SQL 編輯器中執行上述 SQL 語句來創建兼容的觸發器'
      });
    }

    return NextResponse.json({
      success: true,
      message: '兼容的觸發器已成功創建'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '創建觸發器時發生錯誤',
      details: error,
      manualSQL: `
        -- 1. 刪除所有有問題的觸發器
        DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;
        DROP TRIGGER IF EXISTS trigger_log_version_change ON hanami_growth_goals;
        DROP TRIGGER IF EXISTS trigger_version_log ON hanami_growth_goals;
        DROP TRIGGER IF EXISTS trigger_log_growth_goal_changes ON hanami_growth_goals;
        
        -- 2. 刪除舊的觸發器函數
        DROP FUNCTION IF EXISTS log_growth_goal_changes();
        DROP FUNCTION IF EXISTS log_assessment_compatibility();
        DROP FUNCTION IF EXISTS log_version_change();
        
        -- 3. 創建兼容的觸發器函數
        CREATE OR REPLACE FUNCTION log_growth_goal_version_changes()
        RETURNS TRIGGER AS $$
        DECLARE
          current_version TEXT;
          new_version TEXT;
          tree_id_val UUID;
          goal_id_val UUID;
          goal_name_val TEXT;
          change_type_val TEXT;
          change_details_val JSONB;
        BEGIN
          tree_id_val := COALESCE(NEW.tree_id, OLD.tree_id);
          goal_id_val := COALESCE(NEW.id, OLD.id);
          goal_name_val := COALESCE(NEW.goal_name, OLD.goal_name);
          current_version := COALESCE(OLD.version, '1.0');
          new_version := COALESCE(NEW.version, '1.0');
          
          CASE TG_OP
            WHEN 'INSERT' THEN
              change_type_val := 'goal_added';
              change_details_val := to_jsonb(NEW);
            WHEN 'UPDATE' THEN
              change_type_val := 'goal_modified';
              change_details_val := jsonb_build_object(
                'old', to_jsonb(OLD),
                'new', to_jsonb(NEW)
              );
            WHEN 'DELETE' THEN
              change_type_val := 'goal_removed';
              change_details_val := to_jsonb(OLD);
          END CASE;
          
          INSERT INTO hanami_version_change_logs (
            tree_id, from_version, to_version, change_type,
            goal_id, goal_name, change_details, created_by
          ) VALUES (
            tree_id_val, current_version, new_version, change_type_val,
            goal_id_val, goal_name_val, change_details_val, NULL
          );
          
          RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
        END;
        $$ LANGUAGE plpgsql;
        
        -- 4. 創建新的觸發器
        CREATE TRIGGER trigger_log_growth_goal_version_changes
          AFTER INSERT OR UPDATE OR DELETE ON hanami_growth_goals
          FOR EACH ROW EXECUTE FUNCTION log_growth_goal_version_changes();
      `
    });
  }
}


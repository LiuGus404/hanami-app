import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // 修復觸發器的 SQL 語句
    const fixTriggerSQL = `
      -- 刪除有問題的觸發器
      DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;
      DROP TRIGGER IF EXISTS trigger_log_version_change ON hanami_growth_goals;
      DROP TRIGGER IF EXISTS trigger_version_log ON hanami_growth_goals;
      
      -- 創建正確的觸發器函數
      CREATE OR REPLACE FUNCTION log_growth_goal_changes()
      RETURNS TRIGGER AS $$
      BEGIN
        -- 插入版本變更日誌
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
          COALESCE(NEW.tree_id, OLD.tree_id),
          COALESCE(OLD.version, '1.0'),
          COALESCE(NEW.version, '1.0'),
          CASE 
            WHEN TG_OP = 'INSERT' THEN 'goal_added'
            WHEN TG_OP = 'UPDATE' THEN 'goal_modified'
            WHEN TG_OP = 'DELETE' THEN 'goal_removed'
          END,
          COALESCE(NEW.id, OLD.id),
          COALESCE(NEW.goal_name, OLD.goal_name),
          CASE 
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
              'old', to_jsonb(OLD),
              'new', to_jsonb(NEW)
            )
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
          END,
          NULL -- created_by 可以根據需要設置
        );
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
      
      -- 創建觸發器
      CREATE TRIGGER trigger_log_growth_goal_changes
        AFTER INSERT OR UPDATE OR DELETE ON hanami_growth_goals
        FOR EACH ROW EXECUTE FUNCTION log_growth_goal_changes();
    `;

    const { error: fixError } = await supabase.rpc('exec_sql', {
      sql: fixTriggerSQL
    });

    if (fixError) {
      return NextResponse.json({
        success: false,
        error: '需要手動執行 SQL 語句',
        sql: fixTriggerSQL,
        message: '請在 Supabase SQL 編輯器中執行上述 SQL 語句來修復觸發器'
      });
    }

    return NextResponse.json({
      success: true,
      message: '觸發器修復完成'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '修復過程中發生錯誤',
      details: error,
      manualSQL: `
        -- 刪除有問題的觸發器
        DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;
        DROP TRIGGER IF EXISTS trigger_log_version_change ON hanami_growth_goals;
        DROP TRIGGER IF EXISTS trigger_version_log ON hanami_growth_goals;
        
        -- 創建正確的觸發器函數
        CREATE OR REPLACE FUNCTION log_growth_goal_changes()
        RETURNS TRIGGER AS $$
        BEGIN
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
            COALESCE(NEW.tree_id, OLD.tree_id),
            COALESCE(OLD.version, '1.0'),
            COALESCE(NEW.version, '1.0'),
            CASE 
              WHEN TG_OP = 'INSERT' THEN 'goal_added'
              WHEN TG_OP = 'UPDATE' THEN 'goal_modified'
              WHEN TG_OP = 'DELETE' THEN 'goal_removed'
            END,
            COALESCE(NEW.id, OLD.id),
            COALESCE(NEW.goal_name, OLD.goal_name),
            CASE 
              WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
              WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
              WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            END,
            NULL
          );
          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
        
        -- 創建觸發器
        CREATE TRIGGER trigger_log_growth_goal_changes
          AFTER INSERT OR UPDATE OR DELETE ON hanami_growth_goals
          FOR EACH ROW EXECUTE FUNCTION log_growth_goal_changes();
      `
    });
  }
}


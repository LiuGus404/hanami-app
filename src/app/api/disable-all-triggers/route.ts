import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // 完全禁用所有觸發器的 SQL 語句
    const disableTriggersSQL = `
      -- 刪除所有可能有問題的觸發器
      DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;
      DROP TRIGGER IF EXISTS trigger_log_version_change ON hanami_growth_goals;
      DROP TRIGGER IF EXISTS trigger_version_log ON hanami_growth_goals;
      DROP TRIGGER IF EXISTS trigger_log_growth_goal_changes ON hanami_growth_goals;
      
      -- 刪除所有相關的觸發器函數
      DROP FUNCTION IF EXISTS log_growth_goal_changes();
      DROP FUNCTION IF EXISTS log_assessment_compatibility();
      DROP FUNCTION IF EXISTS log_version_change();
    `;

    const { error: disableError } = await (supabase.rpc as any)('exec_sql', {
      sql: disableTriggersSQL
    });

    if (disableError) {
      return NextResponse.json({
        success: false,
        error: '需要手動執行 SQL 語句',
        sql: disableTriggersSQL,
        message: '請在 Supabase SQL 編輯器中執行上述 SQL 語句來完全禁用所有觸發器'
      });
    }

    return NextResponse.json({
      success: true,
      message: '所有觸發器已成功禁用'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '禁用觸發器時發生錯誤',
      details: error,
      manualSQL: `
        -- 刪除所有可能有問題的觸發器
        DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;
        DROP TRIGGER IF EXISTS trigger_log_version_change ON hanami_growth_goals;
        DROP TRIGGER IF EXISTS trigger_version_log ON hanami_growth_goals;
        DROP TRIGGER IF EXISTS trigger_log_growth_goal_changes ON hanami_growth_goals;
        
        -- 刪除所有相關的觸發器函數
        DROP FUNCTION IF EXISTS log_growth_goal_changes();
        DROP FUNCTION IF EXISTS log_assessment_compatibility();
        DROP FUNCTION IF EXISTS log_version_change();
      `
    });
  }
}

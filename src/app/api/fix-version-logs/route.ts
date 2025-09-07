import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // 1. 首先嘗試創建缺失的 hanami_version_change_logs 表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS hanami_version_change_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_name TEXT NOT NULL,
        record_id UUID NOT NULL,
        version_id UUID DEFAULT gen_random_uuid(),
        change_type TEXT NOT NULL,
        old_data JSONB,
        new_data JSONB,
        changed_by UUID,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (createError) {
      console.log('無法使用 RPC 創建表，嘗試其他方法');
      
      // 如果 RPC 不存在，返回 SQL 語句供手動執行
      return NextResponse.json({
        success: false,
        error: '需要手動執行 SQL 語句',
        sql: createTableSQL,
        message: '請在 Supabase SQL 編輯器中執行上述 SQL 語句來創建缺失的表'
      });
    }

    // 2. 嘗試刪除所有可能有問題的觸發器
    const dropTriggersSQL = `
      DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;
      DROP TRIGGER IF EXISTS trigger_log_version_change ON hanami_growth_goals;
      DROP TRIGGER IF EXISTS trigger_version_log ON hanami_growth_goals;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: dropTriggersSQL
    });

    if (dropError) {
      console.log('無法使用 RPC 刪除觸發器');
    }

    return NextResponse.json({
      success: true,
      message: '版本日誌表和觸發器修復完成',
      createTableSQL,
      dropTriggersSQL
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '修復過程中發生錯誤',
      details: error,
      manualSQL: `
        -- 創建缺失的表
        CREATE TABLE IF NOT EXISTS hanami_version_change_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          table_name TEXT NOT NULL,
          record_id UUID NOT NULL,
          version_id UUID DEFAULT gen_random_uuid(),
          change_type TEXT NOT NULL,
          old_data JSONB,
          new_data JSONB,
          changed_by UUID,
          changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 刪除有問題的觸發器
        DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;
        DROP TRIGGER IF EXISTS trigger_log_version_change ON hanami_growth_goals;
        DROP TRIGGER IF EXISTS trigger_version_log ON hanami_growth_goals;
      `
    });
  }
}


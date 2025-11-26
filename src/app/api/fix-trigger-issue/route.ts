import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // 嘗試刪除有問題的觸發器
    const { error: dropError } = await (supabase.rpc as any)('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;'
    });

    if (dropError) {
      console.log('RPC 函數不存在，嘗試其他方法');
      
      // 如果 RPC 不存在，返回 SQL 語句供手動執行
      return NextResponse.json({
        success: false,
        error: '需要手動執行 SQL 語句',
        sql: 'DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;',
        message: '請在 Supabase SQL 編輯器中執行上述 SQL 語句'
      });
    }

    return NextResponse.json({
      success: true,
      message: '觸發器已成功刪除'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '修復觸發器時發生錯誤',
      details: error,
      sql: 'DROP TRIGGER IF EXISTS trigger_log_assessment_compatibility ON hanami_growth_goals;'
    });
  }
}


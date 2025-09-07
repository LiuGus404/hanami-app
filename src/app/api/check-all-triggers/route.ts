import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 檢查 hanami_growth_goals 表上的所有觸發器
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'hanami_growth_goals');

    if (triggerError) {
      return NextResponse.json({
        success: false,
        error: '無法查詢觸發器',
        details: triggerError
      });
    }

    // 檢查 hanami_version_change_logs 表是否存在
    const { data: versionLogs, error: versionError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'hanami_version_change_logs');

    // 如果表存在，檢查其結構
    let versionLogsStructure = null;
    if (versionLogs && versionLogs.length > 0) {
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', 'hanami_version_change_logs');
      
      versionLogsStructure = columns;
    }

    return NextResponse.json({
      success: true,
      triggers: triggers || [],
      versionLogsTable: versionLogs || [],
      versionLogsStructure: versionLogsStructure || [],
      message: '觸發器檢查完成'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '檢查觸發器時發生錯誤',
      details: error
    });
  }
}

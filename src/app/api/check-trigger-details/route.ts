import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 檢查 hanami_version_change_logs 表的實際結構
    const { data: versionLogs, error: versionError } = await supabase
      .from('hanami_version_change_logs')
      .select('*')
      .limit(1);

    if (versionError) {
      return NextResponse.json({
        success: false,
        error: '無法訪問 hanami_version_change_logs 表',
        details: versionError
      });
    }

    // 嘗試插入測試數據到 hanami_growth_goals
    const testData = {
      tree_id: '108763d0-b2ff-48e7-82cd-3001cdad0055',
      goal_name: '觸發器測試',
      goal_order: 996,
      progress_max: 1,
      is_achievable: true,
      is_completed: false,
      required_abilities: [],
      related_activities: [],
      progress_contents: []
    };

    const { data: insertData, error: insertError } = await (supabase
      .from('hanami_growth_goals') as any)
      .insert([testData] as any)
      .select();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: '插入測試失敗',
        details: insertError,
        testData,
        versionLogsStructure: versionLogs?.[0] || null
      });
    }

    // 清理測試數據
    if (insertData && insertData.length > 0) {
      await supabase
        .from('hanami_growth_goals')
        .delete()
        .eq('id', insertData[0].id);
    }

    return NextResponse.json({
      success: true,
      message: '插入測試成功',
      versionLogsStructure: versionLogs?.[0] || null
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '檢查過程中發生錯誤',
      details: error
    });
  }
}


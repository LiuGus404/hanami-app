import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. 檢查 hanami_growth_goals 表的基本信息
    const { data: tableInfo, error: tableError } = await supabase
      .from('hanami_growth_goals')
      .select('*')
      .limit(1);

    if (tableError) {
      return NextResponse.json({
        success: false,
        error: '無法訪問 hanami_growth_goals 表',
        details: tableError
      });
    }

    // 2. 嘗試最簡單的插入測試
    const minimalData = {
      tree_id: '108763d0-b2ff-48e7-82cd-3001cdad0055',
      goal_name: '最小測試',
      goal_order: 997,
      progress_max: 1
    };

    const { data: insertData, error: insertError } = await supabase
      .from('hanami_growth_goals')
      .insert([minimalData])
      .select();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: '最小插入測試失敗',
        details: insertError,
        minimalData,
        tableInfo: tableInfo?.[0] || null
      });
    }

    // 3. 清理測試數據
    if (insertData && insertData.length > 0) {
      await supabase
        .from('hanami_growth_goals')
        .delete()
        .eq('id', insertData[0].id);
    }

    return NextResponse.json({
      success: true,
      message: '最小插入測試成功',
      insertedData: insertData
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '診斷過程中發生錯誤',
      details: error
    });
  }
}

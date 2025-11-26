import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 使用最簡單的插入測試，只包含必要欄位
    const simpleTestData = {
      tree_id: '108763d0-b2ff-48e7-82cd-3001cdad0055',
      goal_name: '簡單測試目標',
      goal_description: '簡單測試描述',
      goal_order: 998,
      is_achievable: true,
      is_completed: false,
      progress_max: 5,
      required_abilities: [],
      related_activities: [],
      progress_contents: []
    };

    const { data: insertData, error: insertError } = await (supabase
      .from('hanami_growth_goals') as any)
      .insert([simpleTestData] as any)
      .select();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: '簡單插入測試失敗',
        details: insertError,
        testData: simpleTestData
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
      message: '簡單插入測試成功',
      insertedData: insertData
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '測試過程中發生錯誤',
      details: error
    });
  }
}

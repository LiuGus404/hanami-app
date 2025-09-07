import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. 檢查表是否存在
    const { data: tableCheck, error: tableError } = await supabase
      .from('hanami_growth_goals')
      .select('*')
      .limit(1);

    if (tableError) {
      return NextResponse.json({
        success: false,
        error: '表不存在或無法訪問',
        details: tableError
      });
    }

    // 2. 檢查表結構
    const { data: sampleData, error: sampleError } = await supabase
      .from('hanami_growth_goals')
      .select('*')
      .limit(1);

    if (sampleError) {
      return NextResponse.json({
        success: false,
        error: '無法獲取樣本數據',
        details: sampleError
      });
    }

    // 3. 嘗試插入測試數據
    const testData = {
      tree_id: '108763d0-b2ff-48e7-82cd-3001cdad0055', // 使用現有的有效 UUID
      goal_name: '測試目標',
      goal_description: '測試描述',
      goal_icon: '🧪',
      goal_order: 999, // 使用高序號避免衝突
      is_achievable: true,
      is_completed: false,
      progress_max: 5,
      required_abilities: ['ability1'],
      related_activities: ['activity1'],
      progress_contents: ['步驟1'],
      // 添加所有必要的欄位
      review_teachers: [],
      notes: null,
      difficulty_level: 1,
      course_type: null,
      tree_color: null,
      tree_icon: null,
      tree_level: 1,
      tree_description: null,
      tree_name: null,
      course_type_id: null,
      is_active: true,
      assessment_mode: 'progress',
      multi_select_levels: [],
      multi_select_descriptions: [],
      version: '1.0',
      deprecated_at: null,
      deprecated_reason: null
    };

    const { data: insertData, error: insertError } = await supabase
      .from('hanami_growth_goals')
      .insert([testData])
      .select();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: '插入測試數據失敗',
        details: insertError,
        testData,
        sampleData
      });
    }

    // 4. 清理測試數據
    if (insertData && insertData.length > 0) {
      await supabase
        .from('hanami_growth_goals')
        .delete()
        .eq('id', insertData[0].id);
    }

    return NextResponse.json({
      success: true,
      message: '表結構正常',
      sampleData,
      testData
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '調試過程中發生錯誤',
      details: error
    });
  }
}

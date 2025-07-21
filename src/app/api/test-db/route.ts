import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 嘗試獲取 hanami_growth_trees 資料表的所有資料
    const { data: treesData, error: treesError } = await supabase
      .from('hanami_growth_trees')
      .select('*')
      .limit(1);

    if (treesError) {
      return NextResponse.json({ 
        success: false, 
        error: '無法獲取成長樹資料',
        details: treesError,
      });
    }

    // 嘗試插入一個簡單的測試記錄
    const testTreeData = {
      tree_name: '測試成長樹',
      tree_description: '這是一個測試成長樹',
      tree_icon: '🌳',
      course_type: 'test-course-id',
      tree_level: 1,
      difficulty_level: 1,
      is_active: true,
    };

    const { data: insertData, error: insertError } = await supabase
      .from('hanami_growth_trees')
      .insert([testTreeData])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ 
        success: false, 
        error: '插入測試資料失敗',
        details: insertError,
        testData: testTreeData,
        existingData: treesData,
      });
    }

    // 刪除測試資料
    await supabase
      .from('hanami_growth_trees')
      .delete()
      .eq('id', insertData.id);

    return NextResponse.json({ 
      success: true, 
      message: '測試成功',
      insertedData: insertData,
      existingData: treesData,
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: '測試失敗',
      details: error,
    });
  }
} 
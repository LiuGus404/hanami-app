import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { treeId, courseType } = body;
    
    console.log('🔍 創建測試學習路徑:', { treeId, courseType });
    
    // 如果沒有提供 treeId，嘗試根據 courseType 找到成長樹
    let targetTreeId = treeId;
    
    if (!targetTreeId && courseType) {
      // 根據課程類型獲取成長樹
      const { data: courseTypeData, error: courseTypeError } = await supabase
        .from('Hanami_CourseTypes')
        .select('id')
        .eq('name', courseType)
        .single();
      
      if (courseTypeError || !courseTypeData) {
        return NextResponse.json({
          success: false,
          error: '找不到指定的課程類型',
          details: courseTypeError?.message
        }, { status: 404 });
      }
      
      const typedCourseTypeData = courseTypeData as { id: string; [key: string]: any };
      const { data: growthTrees, error: treesError } = await (supabase as any)
        .from('hanami_growth_trees')
        .select('id, tree_name')
        .eq('course_type_id', typedCourseTypeData.id)
        .eq('is_active', true)
        .order('tree_level', { ascending: true })
        .limit(1);
      
      if (treesError || !growthTrees || growthTrees.length === 0) {
        return NextResponse.json({
          success: false,
          error: '找不到對應的成長樹',
          details: treesError?.message
        }, { status: 404 });
      }
      
      targetTreeId = growthTrees[0].id;
      console.log('✅ 找到成長樹ID:', targetTreeId);
    }
    
    if (!targetTreeId) {
      return NextResponse.json({
        success: false,
        error: '請提供成長樹ID或課程類型'
      }, { status: 400 });
    }
    
    // 創建測試學習路徑
    const testLearningPath = {
      name: '測試學習路徑',
      description: '這是一個測試用的學習路徑，包含基本的學習節點',
      tree_id: targetTreeId,
      nodes: JSON.stringify([
        {
          id: 'start',
          type: 'start',
          title: '開始學習',
          position: { x: 100, y: 100 }
        },
        {
          id: 'activity_1',
          type: 'activity',
          title: '基礎練習',
          activity_id: 'test-activity-1',
          duration: 30,
          position: { x: 300, y: 100 }
        },
        {
          id: 'activity_2',
          type: 'activity',
          title: '進階練習',
          activity_id: 'test-activity-2',
          duration: 45,
          position: { x: 500, y: 100 }
        },
        {
          id: 'end',
          type: 'end',
          title: '完成學習',
          position: { x: 700, y: 100 }
        }
      ]),
      start_node_id: 'start',
      end_node_id: 'end',
      total_duration: 75,
      difficulty: 1,
      tags: ['測試', '基礎'],
      is_active: true,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 準備插入的學習路徑資料:', testLearningPath);
    
    const { data: insertResult, error: insertError } = await (supabase
      .from('hanami_learning_paths') as any)
      .insert(testLearningPath as any)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ 插入學習路徑失敗:', insertError);
      return NextResponse.json({
        success: false,
        error: '插入學習路徑失敗',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      }, { status: 500 });
    }
    
    console.log('✅ 學習路徑創建成功:', insertResult);
    
    return NextResponse.json({
      success: true,
      message: '測試學習路徑創建成功',
      data: insertResult
    });
    
  } catch (error) {
    console.error('❌ 創建測試學習路徑時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '創建失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 開始調試學習路徑資料...');
    
    // 1. 檢查 hanami_learning_paths 表是否存在
    const { data: pathsData, error: pathsError } = await supabase
      .from('hanami_learning_paths')
      .select('*')
      .limit(5);
    
    console.log('📊 學習路徑表查詢結果:', { pathsData, pathsError });
    
    // 2. 檢查成長樹資料
    const { data: treesData, error: treesError } = await supabase
      .from('hanami_growth_trees')
      .select('id, tree_name, course_type_id, is_active')
      .eq('is_active', true)
      .limit(5);
    
    console.log('🌳 成長樹查詢結果:', { treesData, treesError });
    
    // 3. 檢查課程類型資料
    const { data: courseTypesData, error: courseTypesError } = await supabase
      .from('Hanami_CourseTypes')
      .select('id, name')
      .limit(5);
    
    console.log('📚 課程類型查詢結果:', { courseTypesData, courseTypesError });
    
    return NextResponse.json({
      success: true,
      debug: {
        learningPaths: {
          data: pathsData,
          error: pathsError,
          count: pathsData?.length || 0
        },
        growthTrees: {
          data: treesData,
          error: treesError,
          count: treesData?.length || 0
        },
        courseTypes: {
          data: courseTypesData,
          error: courseTypesError,
          count: courseTypesData?.length || 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 調試學習路徑時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '調試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseType } = body;
    
    console.log('🔍 調試特定課程類型的學習路徑:', courseType);
    
    if (!courseType) {
      return NextResponse.json({
        success: false,
        error: '請提供課程類型'
      }, { status: 400 });
    }
    
    // 1. 根據課程類型獲取課程類型ID
    const { data: courseTypeData, error: courseTypeError } = await supabase
      .from('Hanami_CourseTypes')
      .select('id, name')
      .eq('name', courseType)
      .single();
    
    console.log('📚 課程類型查詢結果:', { courseTypeData, courseTypeError });
    
    if (courseTypeError || !courseTypeData) {
      return NextResponse.json({
        success: false,
        error: '找不到指定的課程類型',
        details: courseTypeError?.message
      }, { status: 404 });
    }
    
    const typedCourseTypeData = courseTypeData as { id: string; name: string; [key: string]: any };
    
    // 2. 根據課程類型ID獲取成長樹
    const { data: growthTrees, error: treesError } = await (supabase as any)
      .from('hanami_growth_trees')
      .select('id, tree_name, course_type_id, is_active')
      .eq('course_type_id', typedCourseTypeData.id)
      .eq('is_active', true);
    
    console.log('🌳 成長樹查詢結果:', { growthTrees, treesError });
    
    if (treesError || !growthTrees || growthTrees.length === 0) {
      return NextResponse.json({
        success: false,
        error: '找不到對應的成長樹',
        details: treesError?.message
      }, { status: 404 });
    }
    
    // 3. 獲取每個成長樹的學習路徑
    const learningPathsResults = [];
    for (const tree of growthTrees) {
      const { data: paths, error: pathsError } = await supabase
        .from('hanami_learning_paths')
        .select('*')
        .eq('tree_id', tree.id)
        .eq('is_active', true);
      
      learningPathsResults.push({
        treeId: tree.id,
        treeName: tree.tree_name,
        paths: paths || [],
        error: pathsError
      });
    }
    
    console.log('📊 學習路徑查詢結果:', learningPathsResults);
    
    return NextResponse.json({
      success: true,
      debug: {
        courseType: typedCourseTypeData,
        growthTrees,
        learningPaths: learningPathsResults
      }
    });
    
  } catch (error) {
    console.error('❌ 調試特定課程類型學習路徑時發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '調試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

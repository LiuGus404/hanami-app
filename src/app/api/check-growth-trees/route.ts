import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('開始檢查成長樹表...');
    
    // 1. 檢查成長樹表
    const { data: treesData, error: treesError } = await supabase
      .from('hanami_growth_trees')
      .select('*')
      .limit(10);
    
    if (treesError) {
      console.error('成長樹查詢失敗:', treesError);
      return NextResponse.json({
        success: false,
        error: '成長樹查詢失敗',
        details: treesError.message,
        code: treesError.code
      });
    }
    
    console.log('找到成長樹數量:', treesData?.length || 0);
    
    // 2. 檢查活動表
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('hanami_tree_activities')
      .select('tree_id, count')
      .limit(10);
    
    if (activitiesError) {
      console.error('活動查詢失敗:', activitiesError);
    }
    
    // 3. 統計 tree_id 分佈
    const treeIdCounts: Record<string, number> = {};
    if (activitiesData) {
      activitiesData.forEach(activity => {
        const treeId = activity.tree_id;
        treeIdCounts[treeId] = (treeIdCounts[treeId] || 0) + 1;
      });
    }
    
    return NextResponse.json({
      success: true,
      message: '成長樹檢查完成',
      growthTrees: {
        count: treesData?.length || 0,
        sample: treesData?.slice(0, 3) || []
      },
      activities: {
        count: activitiesData?.length || 0,
        treeIdDistribution: treeIdCounts
      },
      recommendations: [
        '如果成長樹數量為 0，需要先創建成長樹',
        '如果活動的 tree_id 與成長樹的 id 不匹配，會導致外鍵約束失敗',
        '建議先確保成長樹數據存在，再創建學習路徑'
      ]
    });
    
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '內部服務器錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}


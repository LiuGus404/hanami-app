import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('=== 檢查資料庫結構 ===');

    // 檢查成長樹表
    console.log('步驟1: 檢查成長樹表...');
    const { data: trees, error: treesError } = await supabase
      .from('hanami_growth_trees')
      .select('id, tree_name')
      .limit(5);

    if (treesError) {
      console.error('查詢成長樹表失敗:', treesError);
    } else {
      console.log('成長樹表資料:', trees);
    }

    // 檢查成長樹目標表
    console.log('步驟2: 檢查成長樹目標表...');
    const { data: goals, error: goalsError } = await supabase
      .from('hanami_growth_goals')
      .select('id, tree_id, goal_name')
      .limit(5);

    if (goalsError) {
      console.error('查詢成長樹目標表失敗:', goalsError);
    } else {
      console.log('成長樹目標表資料:', goals);
    }

    // 檢查評估記錄表
    console.log('步驟3: 檢查評估記錄表...');
    const { data: assessments, error: assessmentsError } = await supabase
      .from('hanami_ability_assessments')
      .select('id, tree_id, student_id')
      .limit(5);

    if (assessmentsError) {
      console.error('查詢評估記錄表失敗:', assessmentsError);
    } else {
      console.log('評估記錄表資料:', assessments);
    }

    return NextResponse.json({
      trees: trees || [],
      goals: goals || [],
      assessments: assessments || [],
      errors: {
        trees: treesError?.message,
        goals: goalsError?.message,
        assessments: assessmentsError?.message
      }
    });

  } catch (error) {
    console.error('API錯誤:', error);
    return NextResponse.json({ 
      error: '內部服務器錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const treeId = searchParams.get('treeId');
    
    if (!treeId) {
      return NextResponse.json({ error: '請提供成長樹ID' }, { status: 400 });
    }

    console.log('查找成長樹目標，樹ID:', treeId);

    // 先檢查成長樹是否存在
    console.log('步驟1: 檢查成長樹是否存在...');
    const { data: tree, error: treeError } = await supabase
      .from('hanami_growth_trees')
      .select('*')
      .eq('id', treeId)
      .single();

    if (treeError) {
      console.error('查找成長樹失敗:', treeError);
      return NextResponse.json({ 
        error: '查找成長樹失敗', 
        details: treeError.message,
        code: treeError.code 
      }, { status: 500 });
    }

    if (!tree) {
      console.log('未找到成長樹');
      return NextResponse.json({ error: '未找到該成長樹' }, { status: 404 });
    }

    console.log('找到成長樹:', tree);

    // 查找成長樹目標
    console.log('步驟2: 查找成長樹目標...');
    const { data: goals, error: goalsError } = await supabase
      .from('hanami_growth_goals')
      .select('*')
      .eq('tree_id', treeId);

    if (goalsError) {
      console.error('載入成長樹目標失敗:', goalsError);
      return NextResponse.json({ 
        error: '載入成長樹目標失敗', 
        details: goalsError.message,
        code: goalsError.code 
      }, { status: 500 });
    }

    console.log('載入的成長樹目標數量:', goals?.length || 0);
    console.log('載入的成長樹目標:', goals);

    return NextResponse.json({
      tree: tree,
      goals: goals || []
    });

  } catch (error) {
    console.error('API錯誤:', error);
    return NextResponse.json({ 
      error: '內部服務器錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

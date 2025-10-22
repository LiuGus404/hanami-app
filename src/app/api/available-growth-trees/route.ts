import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 獲取可用的成長樹列表（排除學生已有的）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    console.log('獲取可用成長樹列表:', { studentId });

    // 獲取所有活躍的成長樹
    const { data: allTrees, error: treesError } = await supabase
      .from('hanami_growth_trees')
      .select('*')
      .eq('is_active', true)
      .order('tree_name', { ascending: true });

    if (treesError) {
      console.error('獲取成長樹列表失敗:', treesError);
      return NextResponse.json(
        { success: false, error: '獲取成長樹列表失敗', details: treesError.message },
        { status: 500 }
      );
    }

    // 如果沒有提供學生ID，返回所有成長樹
    if (!studentId) {
      return NextResponse.json({
        success: true,
        data: allTrees || [],
        count: allTrees?.length || 0
      });
    }

    // 獲取學生已有的成長樹ID
    const { data: studentTrees, error: studentTreesError } = await supabase
      .from('hanami_student_trees')
      .select('tree_id')
      .eq('student_id', studentId)
      .or('status.eq.active,tree_status.eq.active');

    if (studentTreesError) {
      console.error('獲取學生成長樹失敗:', studentTreesError);
      return NextResponse.json(
        { success: false, error: '獲取學生成長樹失敗', details: studentTreesError.message },
        { status: 500 }
      );
    }

    // 過濾掉學生已有的成長樹
    const studentTreeIds = (studentTrees || []).map(st => st.tree_id);
    const availableTrees = (allTrees || []).filter(tree => !studentTreeIds.includes(tree.id));

    console.log('可用成長樹:', {
      total: allTrees?.length || 0,
      studentHas: studentTreeIds.length,
      available: availableTrees.length
    });

    return NextResponse.json({
      success: true,
      data: availableTrees,
      count: availableTrees.length,
      metadata: {
        totalTrees: allTrees?.length || 0,
        studentTreeCount: studentTreeIds.length,
        availableCount: availableTrees.length
      }
    });

  } catch (error) {
    console.error('獲取可用成長樹失敗:', error);
    return NextResponse.json(
      { success: false, error: '獲取可用成長樹失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

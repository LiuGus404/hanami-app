import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 獲取可用的成長樹列表（排除學生已有的）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const orgId = searchParams.get('orgId'); // 新增：從查詢參數獲取 orgId

    console.log('獲取可用成長樹列表:', { studentId, orgId });

    // 獲取所有活躍的成長樹（根據 org_id 過濾）
    let treesQuery = supabase
      .from('hanami_growth_trees')
      .select('*')
      .eq('is_active', true);
    
    // 如果有 orgId，根據 org_id 過濾
    if (orgId) {
      treesQuery = treesQuery.eq('org_id', orgId);
    } else {
      // 如果沒有 orgId，查詢一個不存在的 UUID 以確保不返回任何結果
      treesQuery = treesQuery.eq('org_id', '00000000-0000-0000-0000-000000000000');
    }
    
    const { data: allTrees, error: treesError } = await treesQuery.order('tree_name', { ascending: true });

    if (treesError) {
      console.error('獲取成長樹列表失敗:', treesError);
      return NextResponse.json(
        { success: false, error: '獲取成長樹列表失敗', details: treesError.message },
        { status: 500 }
      );
    }

    // 如果沒有提供學生ID，返回所有成長樹
    if (!studentId) {
      const typedAllTreesNoFilter = (allTrees || []) as Array<any>;
      return NextResponse.json({
        success: true,
        data: typedAllTreesNoFilter,
        count: typedAllTreesNoFilter.length || 0
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
    const typedStudentTrees = (studentTrees || []) as Array<{ tree_id: string; [key: string]: any }>;
    const typedAllTrees = (allTrees || []) as Array<{ id: string; [key: string]: any }>;
    const studentTreeIds = typedStudentTrees.map(st => st.tree_id);
    const availableTrees = typedAllTrees.filter(tree => !studentTreeIds.includes(tree.id));

    console.log('可用成長樹:', {
      total: typedAllTrees.length || 0,
      studentHas: studentTreeIds.length,
      available: availableTrees.length
    });

    return NextResponse.json({
      success: true,
      data: availableTrees,
      count: availableTrees.length,
      metadata: {
        totalTrees: typedAllTrees.length || 0,
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
















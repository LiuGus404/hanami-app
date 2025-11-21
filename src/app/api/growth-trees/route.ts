import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 獲取成長樹列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id'); // 可選：學生ID參數
    const orgId = searchParams.get('orgId'); // 可選：機構ID參數

    let query = supabase
      .from('hanami_growth_trees')
      .select('*')
      .eq('is_active', true)
      .order('tree_name', { ascending: true });

    // 如果提供了機構ID，過濾該機構的成長樹
    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    // 如果提供了學生ID，只獲取學生所在的成長樹
    if (studentId) {
      // 首先嘗試從 Hanami_Students 表的 assigned_tree_id 獲取
      const { data: studentData, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('assigned_tree_id')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('獲取學生資料失敗:', studentError);
        return NextResponse.json(
          { error: '獲取學生資料失敗', details: studentError.message },
          { status: 500 }
        );
      }

      if (studentData && studentData.assigned_tree_id) {
        // 如果學生有直接分配的成長樹，使用它
        query = query.eq('id', studentData.assigned_tree_id);
      } else {
        // 如果沒有直接分配的成長樹，嘗試從 hanami_student_trees 表獲取
        const { data: studentTrees, error: studentTreeError } = await supabase
          .from('hanami_student_trees')
          .select('tree_id')
          .eq('student_id', studentId)
          .or('status.eq.active,tree_status.eq.active');

        if (studentTreeError) {
          console.error('獲取學生成長樹失敗:', studentTreeError);
          return NextResponse.json(
            { error: '獲取學生成長樹失敗', details: studentTreeError.message },
            { status: 500 }
          );
        }

        if (studentTrees && studentTrees.length > 0) {
          const treeIds = studentTrees.map(st => st.tree_id);
          query = query.in('id', treeIds);
        } else {
          // 如果學生沒有成長樹，返回空結果
          return NextResponse.json({
            success: true,
            data: [],
            count: 0
          });
        }
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('獲取成長樹失敗:', error);
      return NextResponse.json(
        { error: '獲取成長樹失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('獲取成長樹時發生錯誤:', error);
    return NextResponse.json(
      { error: '獲取成長樹時發生錯誤' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentName = searchParams.get('studentName');
    
    if (!studentName) {
      return NextResponse.json({ error: '請提供學生姓名' }, { status: 400 });
    }

    console.log('查找學生:', studentName);

    // 先查找學生ID
    const { data: students, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name')
      .eq('full_name', studentName);

    if (studentError) {
      console.error('查找學生失敗:', studentError);
      return NextResponse.json({ error: '查找學生失敗' }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ error: '未找到該學生' }, { status: 404 });
    }

    const studentId = students[0].id;
    console.log('學生ID:', studentId);

    // 查找評估記錄
    const { data: assessments, error: assessmentError } = await supabase
      .from('hanami_ability_assessments')
      .select(`
        *,
        student:Hanami_Students(full_name),
        tree:hanami_growth_trees(tree_name)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (assessmentError) {
      console.error('查找評估記錄失敗:', assessmentError);
      return NextResponse.json({ error: '查找評估記錄失敗' }, { status: 500 });
    }

    console.log('找到評估記錄:', assessments);

    // 如果有評估記錄，獲取對應的成長樹目標
    let treeGoals: any[] = [];
    if (assessments && assessments.length > 0) {
      const treeId = assessments[0].tree_id;
      console.log('成長樹ID:', treeId);
      
      const { data: goals, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', treeId);

      if (goalsError) {
        console.error('載入成長樹目標失敗:', goalsError);
      } else {
        treeGoals = goals || [];
        console.log('載入的成長樹目標:', treeGoals);
      }
    }

    return NextResponse.json({
      student: students[0],
      assessments: assessments || [],
      treeGoals: treeGoals
    });

  } catch (error) {
    console.error('API錯誤:', error);
    return NextResponse.json({ error: '內部服務器錯誤' }, { status: 500 });
  }
}

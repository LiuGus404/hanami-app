import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id');
  
  if (!studentId) {
    return NextResponse.json({ error: 'Missing student_id' }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 獲取該學生的所有評估記錄，按時間排序（assessment_date 降序，然後 created_at 降序作為次要排序）
    const { data: assessments, error } = await supabase
      .from('hanami_ability_assessments')
      .select(`
        id,
        tree_id,
        assessment_date,
        lesson_date,
        selected_goals,
        ability_assessments,
        overall_performance_rating,
        general_notes,
        next_lesson_focus,
        created_at,
        updated_at,
        tree:hanami_growth_trees(tree_name, tree_description)
      `)
      .eq('student_id', studentId)
      .order('assessment_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('查詢評估記錄錯誤:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 分析每個記錄的評估資料
    const analysedAssessments = (assessments || []).map(assessment => {
      const selectedGoals = assessment.selected_goals || [];
      const abilityAssessments = assessment.ability_assessments || {};
      
      return {
        ...assessment,
        analysis: {
          has_goal_data: selectedGoals.length > 0,
          goal_count: selectedGoals.length,
          has_ability_data: Object.keys(abilityAssessments).length > 0,
          ability_count: Object.keys(abilityAssessments).length,
          goals_summary: selectedGoals.map((goal: any) => ({
            goal_id: goal.goal_id,
            assessment_mode: goal.assessment_mode,
            progress_level: goal.progress_level,
            selected_levels: goal.selected_levels
          }))
        }
      };
    });

    // 找到有評估資料的記錄（已經按 assessment_date 降序排列）
    const recordsWithData = analysedAssessments.filter(a => 
      a.analysis.has_goal_data || a.analysis.has_ability_data
    );

    // 推薦記錄：使用最新時間的記錄（按 assessment_date 和 created_at 排序）
    // analysedAssessments 已經按 assessment_date 降序排列，然後按 created_at 降序排列，所以第一個就是最新的
    const recommendedRecord = analysedAssessments.length > 0 
      ? analysedAssessments[0]  // 最新時間的記錄（無論是否有資料）
      : null;

    // 顯示所有評估記錄的時間信息，用於調試
    console.log('📊 所有評估記錄時間排序:', analysedAssessments.slice(0, 5).map((a, idx) => {
      const tree = Array.isArray(a.tree) ? a.tree[0] : a.tree;
      return {
        index: idx,
        id: a.id,
        assessment_date: a.assessment_date,
        created_at: a.created_at,
        tree_id: a.tree_id,
        tree_name: tree?.tree_name
      };
    }));

    const recommendedTree = recommendedRecord 
      ? (Array.isArray(recommendedRecord.tree) ? recommendedRecord.tree[0] : recommendedRecord.tree)
      : null;
    
    console.log('📊 推薦記錄選擇:', {
      total_records: analysedAssessments.length,
      records_with_data: recordsWithData.length,
      recommended_record_id: recommendedRecord?.id,
      recommended_record_date: recommendedRecord?.assessment_date,
      recommended_record_created_at: recommendedRecord?.created_at,
      recommended_tree_id: recommendedRecord?.tree_id,
      recommended_tree_name: recommendedTree?.tree_name,
      has_data: recommendedRecord ? (recommendedRecord.analysis.has_goal_data || recommendedRecord.analysis.has_ability_data) : false
    });

    return NextResponse.json({
      success: true,
      total_records: analysedAssessments.length,
      records_with_data: recordsWithData.length,
      assessments: analysedAssessments,
      recommended_record: recommendedRecord // 最新日期的記錄（無論是否有資料）
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

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

    // 獲取該學生的所有評估記錄
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
      .order('assessment_date', { ascending: false });

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

    // 找到有評估資料的記錄
    const recordsWithData = analysedAssessments.filter(a => 
      a.analysis.has_goal_data || a.analysis.has_ability_data
    );

    return NextResponse.json({
      success: true,
      total_records: analysedAssessments.length,
      records_with_data: recordsWithData.length,
      assessments: analysedAssessments,
      recommended_record: recordsWithData[0] || analysedAssessments[0] // 推薦有資料的最新記錄
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

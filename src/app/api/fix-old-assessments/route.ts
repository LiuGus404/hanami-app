import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId, dryRun = false } = body;

    console.log('開始修復舊版評估記錄:', { assessmentId, dryRun });

    // 獲取評估記錄
    const { data: assessment, error: fetchError } = await supabase
      .from('hanami_ability_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (fetchError) {
      console.error('獲取評估記錄失敗:', fetchError);
      return NextResponse.json({
        success: false,
        error: '獲取評估記錄失敗: ' + fetchError.message
      }, { status: 500 });
    }

    console.log('原始評估記錄:', assessment);

    if (!assessment) {
      return NextResponse.json({
        success: false,
        error: '找不到評估記錄'
      }, { status: 404 });
    }

    const typedAssessment = assessment as {
      id: string;
      tree_id: string;
      selected_goals?: any[];
      ability_assessments?: Record<string, any>;
      [key: string]: any;
    };

    // 檢查是否為舊版格式
    const selectedGoalsCount = Array.isArray(typedAssessment.selected_goals) ? typedAssessment.selected_goals.length : 0;
    const abilityAssessmentsCount = typedAssessment.ability_assessments ? Object.keys(typedAssessment.ability_assessments).length : 0;

    if (selectedGoalsCount > 0) {
      return NextResponse.json({
        success: true,
        message: '此評估記錄已經是新版格式，無需修復',
        data: typedAssessment
      });
    }

    if (abilityAssessmentsCount === 0) {
      return NextResponse.json({
        success: true,
        message: '此評估記錄沒有評估資料',
        data: typedAssessment
      });
    }

    // 獲取成長樹目標
    const { data: goals, error: goalsError } = await supabase
      .from('hanami_growth_goals')
      .select('*')
      .eq('tree_id', typedAssessment.tree_id)
      .order('goal_order');

    if (goalsError) {
      console.error('獲取成長樹目標失敗:', goalsError);
      return NextResponse.json({
        success: false,
        error: '獲取成長樹目標失敗: ' + goalsError.message
      }, { status: 500 });
    }

    const typedGoals = (goals || []) as Array<{ id: string; goal_name: string; goal_order?: number; [key: string]: any }>;
    console.log('成長樹目標:', typedGoals);

    // 轉換舊版資料為新版格式
    const convertedGoals: any[] = [];
    const processedAbilityAssessments = { ...(typedAssessment.ability_assessments || {}) };

    Object.entries(typedAssessment.ability_assessments || {}).forEach(([goalId, data]: [string, any]) => {
      // 查找對應的目標資訊
      const goal = typedGoals.find(g => g.id === goalId);
      if (goal) {
        console.log(`處理目標 ${goal.goal_name}:`, data);
        
        const assessmentMode = 'progress'; // 使用默認值，因為 goal 沒有 assessment_mode 屬性
        let convertedGoal: any = {
          goal_id: goalId,
          goal_name: goal.goal_name,
          assessment_mode: assessmentMode
        };

        if (assessmentMode === 'progress') {
          convertedGoal.progress_level = data.level || 0;
        } else if (assessmentMode === 'multi_select') {
          convertedGoal.selected_levels = data.selected_levels || [];
        }

        convertedGoals.push(convertedGoal);
        
        // 從 ability_assessments 中移除已轉換的資料
        delete processedAbilityAssessments[goalId];
      } else {
        console.log(`目標 ${goalId} 不存在於當前成長樹中`);
      }
    });

    console.log('轉換結果:', {
      convertedGoals,
      remainingAbilityAssessments: processedAbilityAssessments
    });

    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: '模擬修復完成',
        data: {
          original: typedAssessment,
          converted: {
            selected_goals: convertedGoals,
            ability_assessments: processedAbilityAssessments
          },
          goalsFound: convertedGoals.length,
          goalsTotal: typedGoals.length
        }
      });
    }

    // 實際更新資料庫
    const { data: updatedAssessment, error: updateError } = await (supabase
      .from('hanami_ability_assessments') as any)
      .update({
        selected_goals: convertedGoals,
        ability_assessments: processedAbilityAssessments,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', assessmentId)
      .select()
      .single();

    if (updateError) {
      console.error('更新評估記錄失敗:', updateError);
      return NextResponse.json({
        success: false,
        error: '更新評估記錄失敗: ' + updateError.message
      }, { status: 500 });
    }

    console.log('修復完成:', updatedAssessment);

    return NextResponse.json({
      success: true,
      message: `成功修復評估記錄，轉換了 ${convertedGoals.length} 個目標`,
      data: updatedAssessment
    });

  } catch (error) {
    console.error('修復舊版評估記錄失敗:', error);
    return NextResponse.json({
      success: false,
      error: '伺服器內部錯誤: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('獲取舊版評估記錄列表，限制:', limit);

    // 獲取所有評估記錄
    const { data: assessments, error } = await supabase
      .from('hanami_ability_assessments')
      .select(`
        id,
        student_id,
        tree_id,
        assessment_date,
        selected_goals,
        ability_assessments,
        created_at,
        student:Hanami_Students(full_name),
        tree:hanami_growth_trees(tree_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('獲取評估記錄失敗:', error);
      return NextResponse.json({
        success: false,
        error: '獲取評估記錄失敗: ' + error.message
      }, { status: 500 });
    }

    // 分析每個評估記錄
    const analysis = (assessments || []).map((assessment: any) => {
      const selectedGoalsCount = Array.isArray(assessment.selected_goals) ? assessment.selected_goals.length : 0;
      const abilityAssessmentsCount = assessment.ability_assessments ? Object.keys(assessment.ability_assessments).length : 0;
      
      return {
        id: assessment.id,
        student_name: assessment.student?.full_name,
        tree_name: assessment.tree?.tree_name,
        assessment_date: assessment.assessment_date,
        created_at: assessment.created_at,
        selected_goals_count: selectedGoalsCount,
        ability_assessments_count: abilityAssessmentsCount,
        is_old_format: selectedGoalsCount === 0 && abilityAssessmentsCount > 0,
        needs_fix: selectedGoalsCount === 0 && abilityAssessmentsCount > 0
      };
    });

    const oldFormatCount = analysis.filter(a => a.is_old_format).length;
    const totalCount = analysis.length;

    return NextResponse.json({
      success: true,
      data: {
        assessments: analysis,
        summary: {
          total: totalCount,
          old_format: oldFormatCount,
          new_format: totalCount - oldFormatCount
        }
      }
    });

  } catch (error) {
    console.error('獲取評估記錄列表失敗:', error);
    return NextResponse.json({
      success: false,
      error: '伺服器內部錯誤: ' + (error as Error).message
    }, { status: 500 });
  }
}

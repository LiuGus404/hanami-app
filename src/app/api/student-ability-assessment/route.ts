import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('收到 API 請求:', body);

    const {
      assessment_id, // 新增：現有評估記錄的 ID
      student_id,
      tree_id,
      assessment_date,
      notes,
      goals,
      overall_performance_rating // 新增：整體表現評分
    } = body;

    // 驗證必要欄位
    if (!student_id || !tree_id || !assessment_date) {
      return NextResponse.json({
        success: false,
        error: '缺少必要欄位: student_id, tree_id, assessment_date'
      }, { status: 400 });
    }

    // 處理學習目標評估資料，轉換為 ability_assessments 格式
    const abilityAssessments: any = {};
    const selectedGoals: any[] = [];
    
    if (goals && Array.isArray(goals)) {
      goals.forEach((goal: any) => {
        const { goal_id, assessment_mode, selected_levels, progress_level } = goal;
        
        if (goal_id) {
          // 準備 selected_goals 格式的資料
          const selectedGoalData = {
            goal_id,
            assessment_mode,
            selected_levels: selected_levels || [],
            progress_level: progress_level || 0
          };
          selectedGoals.push(selectedGoalData);
          
          // 準備 ability_assessments 格式的資料
          if (assessment_mode === 'multi_select') {
            abilityAssessments[goal_id] = {
              level: 0, // 多選模式不需要等級
              notes: '',
              rating: 0,
              assessment_mode: 'multi_select',
              selected_levels: selected_levels || []
            };
          } else if (assessment_mode === 'progress') {
            abilityAssessments[goal_id] = {
              level: progress_level || 0,
              notes: '',
              rating: progress_level || 0,
              assessment_mode: 'progress'
            };
          }
        }
      });
    }

    let assessmentId: string;
    let updateData: any = {
      student_id,
      tree_id,
      assessment_date,
      lesson_date: assessment_date, // 使用 assessment_date 作為 lesson_date
      ability_assessments: abilityAssessments, // 使用處理後的學習目標資料
      selected_goals: selectedGoals, // 同時更新 selected_goals 欄位
      overall_performance_rating: overall_performance_rating || 1, // 使用前端傳遞的評分值
      general_notes: notes || null,
      updated_at: new Date().toISOString()
    };

    // 如果有提供 assessment_id，直接更新該記錄
    if (assessment_id) {
      console.log('更新現有評估記錄:', assessment_id);
      
      const { data: updatedAssessment, error: updateError } = await supabase
        .from('hanami_ability_assessments')
        .update(updateData)
        .eq('id', assessment_id)
        .select()
        .single();

      if (updateError) {
        console.error('更新評估記錄時出錯:', updateError);
        return NextResponse.json({
          success: false,
          error: '更新評估記錄時出錯: ' + updateError.message
        }, { status: 500 });
      }

      assessmentId = assessment_id;
    } else {
      // 新增模式：直接創建新記錄，不檢查是否存在
      console.log('創建新評估記錄');
      
      const { data: newAssessment, error: insertError } = await supabase
        .from('hanami_ability_assessments')
        .insert({
          ...updateData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('創建評估記錄時出錯:', insertError);
        return NextResponse.json({
          success: false,
          error: '創建評估記錄時出錯: ' + insertError.message
        }, { status: 500 });
      }

      assessmentId = newAssessment.id;
    }

    // 獲取更新後的完整評估記錄
    const { data: finalAssessment, error: fetchError } = await supabase
      .from('hanami_ability_assessments')
      .select(`
        *,
        student:Hanami_Students(full_name, nick_name, course_type),
        tree:hanami_growth_trees(tree_name, tree_description)
      `)
      .eq('id', assessmentId)
      .single();

    if (fetchError) {
      console.error('獲取最終評估記錄時出錯:', fetchError);
      return NextResponse.json({
        success: false,
        error: '獲取最終評估記錄時出錯: ' + fetchError.message
      }, { status: 500 });
    }

    console.log('✅ 評估記錄處理成功:', finalAssessment);

    return NextResponse.json({
      success: true,
      data: finalAssessment,
      message: assessment_id ? '評估記錄已更新' : '評估記錄已創建'
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '伺服器內部錯誤: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const treeId = searchParams.get('tree_id');
    const date = searchParams.get('date');

    if (!studentId || !treeId || !date) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數: student_id, tree_id, date'
      }, { status: 400 });
    }

    const { data: assessment, error } = await supabase
      .from('hanami_ability_assessments')
      .select(`
        *,
        student:Hanami_Students(full_name, nick_name, course_type),
        tree:hanami_growth_trees(tree_name, tree_description)
      `)
      .eq('student_id', studentId)
      .eq('tree_id', treeId)
      .eq('assessment_date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: null,
          message: '未找到評估記錄'
        });
      }
      
      console.error('獲取評估記錄時出錯:', error);
      return NextResponse.json({
        success: false,
        error: '獲取評估記錄時出錯: ' + error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: assessment
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '伺服器內部錯誤: ' + (error as Error).message
    }, { status: 500 });
  }
}

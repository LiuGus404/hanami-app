
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('收到 API 請求:', body);

    const {
      student_id,
      tree_id,
      assessment_date,
      lesson_date,
      teacher_id,
      ability_assessments,
      overall_performance_rating,
      general_notes,
      next_lesson_focus,
      notes,
      goals
    } = body;

    // 驗證必要欄位
    if (!student_id || !tree_id || !assessment_date || !lesson_date) {
      return NextResponse.json({
        success: false,
        error: '缺少必要欄位: student_id, tree_id, assessment_date, lesson_date'
      }, { status: 400 });
    }

    // 檢查是否已存在該日期的評估記錄
    const { data: existingAssessment, error: checkError } = await supabase
      .from('hanami_ability_assessments')
      .select('id')
      .eq('student_id', student_id)
      .eq('tree_id', tree_id)
      .eq('assessment_date', assessment_date)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('檢查現有評估記錄時出錯:', checkError);
      return NextResponse.json({
        success: false,
        error: '檢查現有評估記錄時出錯: ' + checkError.message
      }, { status: 500 });
    }

    let assessmentId: string;
    let updateData: any = {
      student_id,
      tree_id,
      assessment_date,
      lesson_date,
      teacher_id: teacher_id || null,
      ability_assessments: ability_assessments || {},
      overall_performance_rating: overall_performance_rating || 3,
      general_notes: general_notes || notes || null,
      next_lesson_focus: next_lesson_focus || null,
      selected_goals: goals || [],
      updated_at: new Date().toISOString()
    };

    if (existingAssessment) {
      // 更新現有記錄
      console.log('更新現有評估記錄:', existingAssessment.id);
      
      const { data: updatedAssessment, error: updateError } = await supabase
        .from('hanami_ability_assessments')
        .update(updateData)
        .eq('id', existingAssessment.id)
        .select()
        .single();

      if (updateError) {
        console.error('更新評估記錄時出錯:', updateError);
        return NextResponse.json({
          success: false,
          error: '更新評估記錄時出錯: ' + updateError.message
        }, { status: 500 });
      }

      assessmentId = existingAssessment.id;
    } else {
      // 創建新記錄
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

    // 學習目標評估已經包含在 selected_goals 欄位中
    console.log('📋 學習目標評估已儲存在 selected_goals 欄位:', {
      goalCount: goals?.length || 0,
      goals: goals || []
    });

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
      message: existingAssessment ? '評估記錄已更新' : '評估記錄已創建'
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

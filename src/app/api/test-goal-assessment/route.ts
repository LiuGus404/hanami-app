import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 開始測試目標評估儲存...');

    // 測試資料
    const testData = {
      student_id: 'adfc1c2a-124e-4f8e-8b1d-e049b6bd9684', // Abi 的 ID
      tree_id: 'a0bf2e68-1582-4414-a238-ae44a6883134', // 幼兒鋼琴學習評估表的 ID
      assessment_date: new Date().toISOString().split('T')[0],
      lesson_date: new Date().toISOString().split('T')[0],
      teacher_id: null,
      ability_assessments: {},
      overall_performance_rating: 4,
      general_notes: '測試目標評估儲存',
      next_lesson_focus: null,
      selected_goals: [
        {
          goal_id: 'a5f52175-be13-44b8-a3bf-52c353061fed', // 實際的目標 ID
          assessment_mode: 'progress',
          progress_level: 3
        },
        {
          goal_id: 'f9927c72-5e34-48ea-92c1-b366166e0988', // 實際的目標 ID
          assessment_mode: 'progress',
          progress_level: 4
        }
      ]
    };

    console.log('測試資料:', testData);

    // 先刪除現有的測試記錄
    await supabase
      .from('hanami_ability_assessments')
      .delete()
      .eq('general_notes', '測試目標評估儲存');

    // 創建新記錄
    const { data: newAssessment, error: insertError } = await supabase
      .from('hanami_ability_assessments')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ 創建測試記錄失敗:', insertError);
      return NextResponse.json({
        success: false,
        error: '創建測試記錄失敗: ' + insertError.message
      }, { status: 500 });
    }

    console.log('✅ 測試記錄創建成功:', newAssessment);

    // 讀取記錄並驗證 selected_goals
    const { data: savedAssessment, error: fetchError } = await supabase
      .from('hanami_ability_assessments')
      .select('*')
      .eq('id', newAssessment.id)
      .single();

    if (fetchError) {
      console.error('❌ 讀取測試記錄失敗:', fetchError);
      return NextResponse.json({
        success: false,
        error: '讀取測試記錄失敗: ' + fetchError.message
      }, { status: 500 });
    }

    console.log('📖 讀取的記錄:', savedAssessment);
    console.log('🎯 selected_goals 內容:', savedAssessment.selected_goals);

    // 驗證 selected_goals 是否正確儲存
    const selectedGoals = savedAssessment.selected_goals;
    const isGoalsCorrect = Array.isArray(selectedGoals) && selectedGoals.length === 2;

    return NextResponse.json({
      success: true,
      data: {
        assessment: savedAssessment,
        selectedGoals: selectedGoals,
        isGoalsCorrect: isGoalsCorrect,
        goalsCount: Array.isArray(selectedGoals) ? selectedGoals.length : 0
      },
      message: `測試完成 - selected_goals ${isGoalsCorrect ? '正確' : '不正確'}儲存`
    });

  } catch (error) {
    console.error('💥 測試過程中發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '測試過程中發生錯誤: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // 查詢所有包含 selected_goals 的記錄
    const { data: assessments, error } = await supabase
      .from('hanami_ability_assessments')
      .select('id, student_id, tree_id, assessment_date, selected_goals, general_notes')
      .not('selected_goals', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({
        success: false,
        error: '查詢失敗: ' + error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: assessments,
      message: `找到 ${assessments?.length || 0} 個包含目標評估的記錄`
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '查詢過程中發生錯誤: ' + (error as Error).message
    }, { status: 500 });
  }
}

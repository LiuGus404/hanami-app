import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const assessmentId = searchParams.get('id');
  
  if (!assessmentId) {
    return NextResponse.json({ error: 'Missing assessment ID' }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 檢查具體的評估記錄
    const { data: assessment, error } = await supabase
      .from('hanami_ability_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (error) {
      console.error('查詢評估記錄錯誤:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 詳細分析資料結構
    const analysis = {
      assessment_exists: !!assessment,
      assessment_id: assessment?.id,
      student_id: assessment?.student_id,
      tree_id: assessment?.tree_id,
      assessment_date: assessment?.assessment_date,
      selected_goals: {
        value: assessment?.selected_goals,
        type: typeof assessment?.selected_goals,
        is_array: Array.isArray(assessment?.selected_goals),
        length: assessment?.selected_goals?.length || 0,
        content: assessment?.selected_goals
      },
      ability_assessments: {
        value: assessment?.ability_assessments,
        type: typeof assessment?.ability_assessments,
        is_object: typeof assessment?.ability_assessments === 'object',
        keys: assessment?.ability_assessments ? Object.keys(assessment?.ability_assessments) : [],
        content: assessment?.ability_assessments
      },
      all_fields: Object.keys(assessment || {}),
      raw_record: assessment
    };

    return NextResponse.json({
      success: true,
      analysis,
      message: '評估記錄分析完成'
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

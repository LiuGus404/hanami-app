import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const abilityId = searchParams.get('ability_id');
    const days = parseInt(searchParams.get('days') || '30');

    if (!studentId || !abilityId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數: student_id 和 ability_id'
      });
    }

    // 獲取該學生的所有評估記錄
    const { data: assessments, error: assessmentsError } = await supabase
      .from('hanami_ability_assessments')
      .select('*')
      .eq('student_id', studentId)
      .order('assessment_date', { ascending: true });

    if (assessmentsError) {
      console.error('載入評估記錄失敗:', assessmentsError);
      return NextResponse.json({
        success: false,
        error: '載入評估記錄失敗'
      });
    }

    if (!assessments || assessments.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // 獲取目標資料
    const { data: goals, error: goalsError } = await supabase
      .from('hanami_growth_goals')
      .select('*')
      .eq('id', abilityId)
      .single();

    if (goalsError) {
      console.error('載入目標資料失敗:', goalsError);
      return NextResponse.json({
        success: false,
        error: '載入目標資料失敗'
      });
    }

    // 處理趨勢資料
    const trendData = [];
    const maxLevel = goals?.progress_max || 4;

    for (const assessment of assessments) {
      const selectedGoals = assessment.selected_goals || [];
      const goalAssessment = selectedGoals.find((g: any) => g.goal_id === abilityId);
      
      if (goalAssessment) {
        const level = goalAssessment.progress_level || goalAssessment.current_level || 0;
        const progress = maxLevel > 0 ? Math.round((level / maxLevel) * 100) : 0;
        
        trendData.push({
          date: assessment.assessment_date,
          progress: progress,
          level: level,
          assessment_id: assessment.id,
          lesson_date: assessment.lesson_date,
          overall_rating: assessment.overall_performance_rating
        });
      }
    }

    // 如果資料不足，生成一些基礎資料點
    if (trendData.length === 0) {
      // 獲取最早的評估日期
      const earliestDate = new Date(assessments[0]?.assessment_date || new Date());
      const currentDate = new Date();
      
      // 生成基礎資料點
      trendData.push({
        date: earliestDate.toISOString().split('T')[0],
        progress: 0,
        level: 0,
        assessment_id: null,
        lesson_date: earliestDate.toISOString().split('T')[0],
        overall_rating: 1
      });

      // 如果有多個評估記錄，使用最新的評估資料
      if (assessments.length > 0) {
        const latestAssessment = assessments[assessments.length - 1];
        const selectedGoals = latestAssessment.selected_goals || [];
        const goalAssessment = selectedGoals.find((g: any) => g.goal_id === abilityId);
        
        if (goalAssessment) {
          const level = goalAssessment.progress_level || goalAssessment.current_level || 0;
          const progress = maxLevel > 0 ? Math.round((level / maxLevel) * 100) : 0;
          
          trendData.push({
            date: latestAssessment.assessment_date,
            progress: progress,
            level: level,
            assessment_id: latestAssessment.id,
            lesson_date: latestAssessment.lesson_date,
            overall_rating: latestAssessment.overall_performance_rating
          });
        }
      }
    }

    // 按日期排序
    trendData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 限制資料點數量
    const limitedTrendData = trendData.slice(-days);

    return NextResponse.json({
      success: true,
      data: limitedTrendData,
      goal_info: {
        id: goals?.id,
        name: goals?.goal_name,
        description: goals?.goal_description,
        max_level: maxLevel,
        progress_contents: goals?.progress_contents || []
      }
    });

  } catch (error) {
    console.error('獲取趨勢資料失敗:', error);
    return NextResponse.json({
      success: false,
      error: '獲取趨勢資料失敗'
    });
  }
}


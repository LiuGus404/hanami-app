import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

type AssessmentRow = Database['public']['Tables']['hanami_ability_assessments']['Row'] & {
  student?: {
    full_name?: string | null;
    nick_name?: string | null;
  };
  tree?: {
    tree_name?: string | null;
    tree_description?: string | null;
  };
};

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const assessmentDate = searchParams.get('assessment_date');

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數: student_id'
      }, { status: 400 });
    }

    console.log('載入學生評估進度:', { studentId, assessmentDate });

    // 獲取學生的最新評估記錄
    let query = supabaseAdmin
      .from('hanami_ability_assessments')
      .select(`
        *,
        student:Hanami_Students(full_name, nick_name, course_type),
        tree:hanami_growth_trees(tree_name, tree_description)
      `)
      .eq('student_id', studentId)
      .order('assessment_date', { ascending: false });

    // 如果指定了日期，則獲取該日期的評估
    if (assessmentDate) {
      query = query.eq('assessment_date', assessmentDate);
    }

    const { data: assessments, error: assessmentsError } = await query;

    const typedAssessments =
      (assessments as AssessmentRow[] | null) ?? null;

    if (assessmentsError) {
      console.error('載入評估記錄失敗:', assessmentsError);
      return NextResponse.json({
        success: false,
        error: '載入評估記錄失敗: ' + assessmentsError.message
      }, { status: 500 });
    }

    // 如果沒有評估記錄，返回空資料
    if (!typedAssessments || typedAssessments.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalProgress: 0,
          currentLevel: 1,
          abilities: [],
          availableDates: [],
          latestAssessment: null
        }
      });
    }

    // 獲取所有可用的評估日期
    const { data: allDates, error: datesError } = await supabaseAdmin
      .from('hanami_ability_assessments')
      .select('assessment_date')
      .eq('student_id', studentId)
      .order('assessment_date', { ascending: false });

    const availableDates =
      (allDates as { assessment_date: string }[] | null | undefined)
        ?.map((d) => d.assessment_date) || [];

    // 使用最新的評估記錄
    const latestAssessment = typedAssessments[0];
    const abilityAssessments = latestAssessment.ability_assessments || {};

    // 載入成長目標資料
    const { data: goals, error: goalsError } = await supabaseAdmin
      .from('hanami_growth_goals')
      .select('*')
      .eq('tree_id', latestAssessment.tree_id)
      .order('goal_order');

    type GrowthGoalRow = Database['public']['Tables']['hanami_growth_goals']['Row'] & {
      tree_color?: string;
      assessment_mode?: string;
    };

    const typedGoals =
      (goals as GrowthGoalRow[] | null) ?? [];

    if (goalsError) {
      console.error('載入成長目標失敗:', goalsError);
    }

    // 計算總進度和當前等級
    let totalProgress = 0;
    let currentLevel = 1;
    const abilityProgress: any[] = [];

    if (typedGoals.length > 0) {
      let totalAbilityProgress = 0;
      let abilityCount = 0;

      // 處理 selected_goals 資料
      const selectedGoals = latestAssessment.selected_goals || [];
      
      typedGoals.forEach(goal => {
        // 從 selected_goals 中找到對應的評估資料
        const goalAssessment = selectedGoals.find((g: any) => g.goal_id === goal.id);
        
        if (goalAssessment) {
          // 修正：使用 progress_level 而不是 current_level
          const level = goalAssessment.progress_level || goalAssessment.current_level || 0;
          const maxLevel = goal.progress_max || 4;
          const progress = maxLevel > 0 ? Math.round((level / maxLevel) * 100) : 0;
          
          // 獲取進度內容
          const progressContents = goal.progress_contents || [];
          const completedContents = progressContents.slice(0, level).map((content: string, index: number) => ({
            content: content,
            completed: true,
            level: index + 1
          }));
          const remainingContents = progressContents.slice(level).map((content: string, index: number) => ({
            content: content,
            completed: false,
            level: level + index + 1
          }));
          
          abilityProgress.push({
            id: goal.id,
            name: goal.goal_name || '未知目標',
            level: level,
            maxLevel: maxLevel,
            progress: progress,
            status: level >= maxLevel ? 'completed' : level > 0 ? 'in_progress' : 'locked',
            color: goal.tree_color || '#FFB6C1',
            description: goal.goal_description,
            progressMode: goal.assessment_mode || 'progress',
            progressContents: [...completedContents, ...remainingContents],
            assessmentMode: goal.assessment_mode || 'progress'
          });

          totalAbilityProgress += progress;
          abilityCount++;
        } else {
          // 如果沒有評估資料，也要顯示目標（但標記為未評估）
          abilityProgress.push({
            id: goal.id,
            name: goal.goal_name || '未知目標',
            level: 0,
            maxLevel: goal.progress_max || 4,
            progress: 0,
            status: 'locked',
            color: goal.tree_color || '#FFB6C1',
            description: goal.goal_description,
            progressMode: goal.assessment_mode || 'progress',
            progressContents: (goal.progress_contents || []).map((content: string, index: number) => ({
              content: content,
              completed: false,
              level: index + 1
            })),
            assessmentMode: goal.assessment_mode || 'progress'
          });
        }
      });

      totalProgress = abilityCount > 0 ? Math.round(totalAbilityProgress / abilityCount) : 0;
      currentLevel = Math.max(1, Math.floor(totalProgress / 20));
    }

    // 生成進度趨勢資料（最近5天）
    const trendData: any[] = [];
    const recentAssessments = typedAssessments.slice(0, 5);
    
    recentAssessments.forEach((assessment, index) => {
      const assessmentProgress = assessment.overall_performance_rating 
        ? Math.round(assessment.overall_performance_rating * 20) 
        : totalProgress;
      
      trendData.push({
        date: assessment.assessment_date,
        progress: assessmentProgress,
        level: Math.max(1, Math.floor(assessmentProgress / 20))
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        totalProgress,
        currentLevel,
        abilities: abilityProgress,
        availableDates,
        latestAssessment: {
          id: latestAssessment.id,
          assessment_date: latestAssessment.assessment_date,
          lesson_date: latestAssessment.lesson_date,
          overall_performance_rating: latestAssessment.overall_performance_rating,
          general_notes: latestAssessment.general_notes,
          next_lesson_focus: latestAssessment.next_lesson_focus,
          tree_name: latestAssessment.tree?.tree_name || '未知課程',
          student_name: latestAssessment.student?.full_name || '未知學生'
        },
        trendData
      }
    });

  } catch (error) {
    console.error('API 處理錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '伺服器內部錯誤: ' + (error as Error).message
    }, { status: 500 });
  }
}

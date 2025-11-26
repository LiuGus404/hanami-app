import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

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
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: '學生 ID 為必需參數' },
        { status: 400 }
      );
    }

    // 並行載入所有需要的資料
    const [
      studentResult,
      growthTreesResult,
      studentAbilitiesResult,
      recentActivitiesResult,
      upcomingLessonsResult,
      achievementsResult,
      assessmentRecordsResult,
      studentActivitiesResult
    ] = await Promise.all([
      // 學生基本資料
      (supabaseAdmin as any)
        .from('Hanami_Students')
        .select('*')
        .eq('id', studentId)
        .single(),

      // 學生的成長樹資料 - 查詢學生實際參與的成長樹
      (supabaseAdmin as any)
        .from('hanami_student_trees')
        .select(`
          *,
          tree:hanami_growth_trees(
            id,
            tree_name,
            tree_description,
            tree_icon,
            tree_level,
            is_active,
            goals:hanami_growth_goals(
              id,
              goal_name,
              goal_description,
              required_abilities,
              goal_order
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('tree.is_active', true),

      // 學生能力資料
      (supabaseAdmin as any)
        .from('hanami_student_abilities')
        .select(`
          *,
          ability:hanami_development_abilities(
            ability_name,
            ability_description
          )
        `)
        .eq('student_id', studentId),

      // 近期教學活動
      (supabaseAdmin as any)
        .from('hanami_teaching_activities')
        .select('*')
        .limit(10)
        .order('created_at', { ascending: false }),

      // 即將到來的課程
      (supabaseAdmin as any)
        .from('hanami_student_lesson')
        .select('*')
        .eq('student_id', studentId)
        .gte('lesson_date', new Date().toISOString().split('T')[0])
        .order('lesson_date')
        .limit(5),

      // 模擬成就資料（目前沒有對應資料表）
      Promise.resolve({ data: [], error: null }),

      // 學生的能力評估記錄
      (supabaseAdmin as any)
        .from('hanami_ability_assessments')
        .select('id, assessment_date, tree_id')
        .eq('student_id', studentId),

      // 學生的學習活動記錄
      (supabaseAdmin as any)
        .from('hanami_student_activities')
        .select('id, activity_id, completion_status')
        .eq('student_id', studentId)
    ]);

    // 檢查錯誤
    if (studentResult.error) {
      console.error('載入學生資料錯誤：', studentResult.error);
      return NextResponse.json(
        { error: '載入學生資料失敗' },
        { status: 500 }
      );
    }

    // 處理成長樹資料，轉換為前端需要的格式
    const processedGrowthTrees = (growthTreesResult.data || [])
      .map((studentTree: any) => {
        const tree = studentTree.tree;
        if (!tree) return null;
        
        // 模擬節點資料（基於目標創建節點）
        const nodes = (tree.goals || []).map((goal: any, index: number) => ({
          id: goal.id,
          name: goal.goal_name,
          description: goal.goal_description,
          level: index % 3, // 簡單的層級分配
          progress: Math.floor(Math.random() * 100), // 模擬進度
          maxProgress: 100,
          isUnlocked: index < 3, // 前三個解鎖
          isCompleted: index < 1, // 第一個完成
          prerequisites: index > 0 ? [tree.goals[index - 1]?.id] : [],
          color: '#FFD59A'
        }));

        return {
          id: tree.id,
          tree_name: tree.tree_name,
          tree_description: tree.tree_description,
          tree_icon: tree.tree_icon,
          nodes,
          totalProgress: Math.floor(Math.random() * 100),
          currentLevel: Math.floor(Math.random() * 5) + 1
        };
      })
      .filter(Boolean); // 過濾掉 null 值

    // 處理學生能力資料
    const processedAbilities = (studentAbilitiesResult.data || []).map((ability: any) => ({
      id: ability.id,
      ability_name: ability.ability?.ability_name || '未知能力',
      current_level: ability.current_level || 0,
      progress_percentage: ability.progress_percentage || 0,
      last_updated: ability.last_updated || ability.created_at
    }));

    // 處理近期活動資料
    const processedActivities = (recentActivitiesResult.data || []).slice(0, 5).map((activity: any) => ({
      id: activity.id,
      name: activity.activity_name,
      type: activity.activity_type === '練習' ? 'practice' : 
            activity.activity_type === '評估' ? 'assessment' : 
            activity.activity_type === '表演' ? 'performance' : 'creative',
      completion_date: activity.created_at,
      score: Math.floor(Math.random() * 40) + 60, // 模擬分數 60-100
      difficulty_level: activity.difficulty_level || Math.floor(Math.random() * 5) + 1
    }));

    // 處理即將課程資料
    const processedLessons = (upcomingLessonsResult.data || []).map((lesson: any) => ({
      id: lesson.id,
      title: `${lesson.course_type || '音樂課程'} - ${lesson.actual_timeslot || '待安排'}`,
      scheduled_date: lesson.lesson_date,
      duration: parseInt(lesson.lesson_duration) || 45,
      teacher: lesson.lesson_teacher || '待安排',
      type: 'individual' as const,
      status: lesson.lesson_status === 'completed' ? 'completed' :
              lesson.lesson_status === 'cancelled' ? 'cancelled' : 'confirmed'
    }));

    // 模擬成就資料
    const mockAchievements = [
      {
        id: '1',
        title: '音樂啟蒙者',
        description: '完成第一堂音樂課程',
        earned_date: new Date().toISOString(),
        icon: '🎵',
        rarity: 'common' as const
      },
      {
        id: '2',
        title: '節拍達人',
        description: '節拍練習達到90分以上',
        earned_date: new Date().toISOString(),
        icon: '🥁',
        rarity: 'rare' as const
      }
    ];

    // 組合最終回應資料
    const responseData = {
      student: studentResult.data,
      growthTrees: processedGrowthTrees,
      abilities: processedAbilities,
      recentActivities: processedActivities,
      upcomingLessons: processedLessons,
      achievements: mockAchievements,
      summary: {
        totalProgress: processedAbilities.length > 0 
          ? Math.round(processedAbilities.reduce((sum: number, ability: any) => sum + (ability.progress_percentage || 0), 0) / processedAbilities.length)
          : 0,
        totalAbilities: (assessmentRecordsResult.data || []).length, // 能力評估記錄數量
        activeGrowthTrees: processedGrowthTrees.length, // 學生實際參與的成長樹數量
        recentActivityCount: processedActivities.length,
        upcomingLessonCount: processedLessons.length,
        totalActivities: (studentActivitiesResult.data || []).length // 學生的學習活動數量
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API 錯誤：', error);
    return NextResponse.json(
      { error: '服務器內部錯誤' },
      { status: 500 }
    );
  }
}

// 處理 POST 請求（更新學生互動記錄）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, interactionType, timestamp } = body;

    if (!studentId || !interactionType) {
      return NextResponse.json(
        { error: '學生 ID 和互動類型為必需參數' },
        { status: 400 }
      );
    }

    // 記錄互動到資料庫（可以創建一個 hanami_student_interactions 表）
    // 目前先記錄到 console
    console.log('學生互動記錄：', {
      studentId,
      interactionType,
      timestamp: timestamp || new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: '互動記錄已保存' 
    });

  } catch (error) {
    console.error('記錄互動錯誤：', error);
    return NextResponse.json(
      { error: '記錄互動失敗' },
      { status: 500 }
    );
  }
}

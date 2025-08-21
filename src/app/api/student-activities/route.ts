import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 獲取學生的活動資訊
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const lessonDate = searchParams.get('lessonDate');
    const timeslot = searchParams.get('timeslot');

    if (!studentId) {
      return NextResponse.json(
        { error: '請提供學生ID' },
        { status: 400 }
      );
    }

    // 獲取本次課堂的活動
    let currentLessonActivities: any[] = [];
    if (lessonDate && timeslot) {
      const { data: currentLesson, error: currentLessonError } = await supabase
        .from('hanami_student_lesson')
        .select('id')
        .eq('student_id', studentId)
        .eq('lesson_date', lessonDate)
        .eq('actual_timeslot', timeslot)
        .single();

      if (currentLesson && !currentLessonError) {
        const { data: activities, error: activitiesError } = await supabase
          .from('hanami_student_lesson_activities')
          .select(`
            id,
            completion_status,
            performance_rating,
            student_notes,
            teacher_notes,
            time_spent,
            attempts_count,
            is_favorite,
            assigned_at,
            tree_activity_id,
            hanami_tree_activities (
              id,
              custom_activity_name,
              custom_activity_description,
              activity_type,
              difficulty_level,
              estimated_duration,
              materials_needed,
              instructions,
              learning_objectives,
              target_abilities,
              activity_source,
              activity_id,
              hanami_teaching_activities (
                id,
                activity_name,
                activity_description,
                activity_type,
                difficulty_level,
                duration_minutes,
                materials_needed,
                instructions
              )
            )
          `)
          .eq('lesson_id', currentLesson.id);

        if (!activitiesError) {
          currentLessonActivities = activities || [];
        }
      }
    }

    // 獲取上次課堂的活動
    const { data: previousLesson, error: previousLessonError } = await supabase
      .from('hanami_student_lesson')
      .select('id, lesson_date, actual_timeslot')
      .eq('student_id', studentId)
      .lt('lesson_date', lessonDate || new Date().toISOString().split('T')[0])
      .order('lesson_date', { ascending: false })
      .limit(1)
      .single();

    let previousLessonActivities: any[] = [];
    if (previousLesson && !previousLessonError) {
      const { data: activities, error: activitiesError } = await supabase
        .from('hanami_student_lesson_activities')
        .select(`
          id,
          completion_status,
          performance_rating,
          student_notes,
          teacher_notes,
          time_spent,
          attempts_count,
          is_favorite,
          assigned_at,
          tree_activity_id,
          hanami_tree_activities (
            id,
            custom_activity_name,
            custom_activity_description,
            activity_type,
            difficulty_level,
            estimated_duration,
            materials_needed,
            instructions,
            learning_objectives,
            target_abilities,
            activity_source,
            activity_id,
            hanami_teaching_activities (
              id,
              activity_name,
              activity_description,
              activity_type,
              difficulty_level,
              duration_minutes,
              materials_needed,
              instructions
            )
          )
        `)
        .eq('lesson_id', previousLesson.id);

      if (!activitiesError) {
        previousLessonActivities = activities || [];
      }
    }

    // 獲取正在學習的活動（跨多個課堂的活動）
    console.log('查詢正在學習的活動，學生ID:', studentId);
    const { data: ongoingActivities, error: ongoingError } = await supabase
      .from('hanami_student_tree_activity_progress')
      .select(`
        id,
        completion_status,
        performance_rating,
        student_notes,
        teacher_notes,
        time_spent,
        attempts_count,
        is_favorite,
        completion_date,
        created_at,
        tree_activity_id,
        hanami_tree_activities (
          id,
          custom_activity_name,
          custom_activity_description,
          activity_type,
          difficulty_level,
          estimated_duration,
          materials_needed,
          instructions,
          learning_objectives,
          target_abilities,
          activity_source,
          activity_id,
          hanami_teaching_activities (
            id,
            activity_name,
            activity_description,
            activity_type,
            difficulty_level,
            duration_minutes,
            materials_needed,
            instructions
          )
        )
      `)
      .eq('student_id', studentId)
      .in('completion_status', ['in_progress', 'not_started'])
      .order('created_at', { ascending: false });

    console.log('正在學習的活動查詢結果:', ongoingActivities, '錯誤:', ongoingError);

    if (ongoingError) {
      console.error('獲取正在學習的活動失敗:', ongoingError);
    }

    // 處理活動資料，統一格式
    const processActivity = (activity: any) => {
      const treeActivity = activity.hanami_tree_activities;
      if (!treeActivity) return null;

      let activityName = '';
      let activityDescription = '';
      let activityType = '';
      let difficultyLevel = 1;
      let estimatedDuration = 0;
      let materialsNeeded: string[] = [];
      let instructions = '';
      let learningObjectives: string[] = [];

      if (treeActivity.activity_source === 'teaching' && treeActivity.hanami_teaching_activities) {
        const teachingActivity = treeActivity.hanami_teaching_activities;
        activityName = teachingActivity.activity_name;
        activityDescription = teachingActivity.activity_description;
        activityType = teachingActivity.activity_type;
        difficultyLevel = teachingActivity.difficulty_level || 1;
        estimatedDuration = teachingActivity.duration_minutes || 0;
        materialsNeeded = teachingActivity.materials_needed || [];
        instructions = teachingActivity.instructions || '';
      } else {
        activityName = treeActivity.custom_activity_name;
        activityDescription = treeActivity.custom_activity_description;
        activityType = treeActivity.activity_type;
        difficultyLevel = treeActivity.difficulty_level || 1;
        estimatedDuration = treeActivity.estimated_duration || 0;
        materialsNeeded = treeActivity.materials_needed || [];
        instructions = treeActivity.instructions || '';
        learningObjectives = treeActivity.learning_objectives || [];
      }

      return {
        id: activity.id,
        treeActivityId: treeActivity.id,
        activityName,
        activityDescription,
        activityType,
        difficultyLevel,
        estimatedDuration,
        materialsNeeded,
        instructions,
        learningObjectives,
        completionStatus: activity.completion_status,
        performanceRating: activity.performance_rating,
        studentNotes: activity.student_notes,
        teacherNotes: activity.teacher_notes,
        timeSpent: activity.time_spent,
        attemptsCount: activity.attempts_count,
        isFavorite: activity.is_favorite,
        assignedAt: activity.assigned_at,
        createdAt: activity.created_at
      };
    };

    return NextResponse.json({
      success: true,
      data: {
        currentLessonActivities: currentLessonActivities.map(processActivity).filter(Boolean),
        previousLessonActivities: previousLessonActivities.map(processActivity).filter(Boolean),
        ongoingActivities: (ongoingActivities || []).map(processActivity).filter(Boolean)
      }
    });

  } catch (error) {
    console.error('獲取學生活動資訊失敗:', error);
    return NextResponse.json(
      { error: '獲取學生活動資訊失敗' },
      { status: 500 }
    );
  }
} 
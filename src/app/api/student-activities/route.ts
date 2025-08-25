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

    // 並行查詢所有活動類型
    console.log('開始並行查詢學生活動，學生ID:', studentId);
    
    const queries = [];
    
    // 本次課堂活動查詢
    if (lessonDate) {
      let query = supabase
        .from('hanami_student_activities')
        .select(`
          id,
          completion_status,
          assigned_at,
          time_spent,
          teacher_notes,
          student_feedback,
          progress,
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
        `)
        .eq('student_id', studentId)
        .eq('activity_type', 'lesson')
        .eq('lesson_date', lessonDate);
      
      // 如果有 timeslot，則添加 timeslot 條件
      if (timeslot) {
        query = query.eq('timeslot', timeslot);
      }
      
      queries.push(query);
    } else {
      queries.push(Promise.resolve({ data: [], error: null }));
    }
    
    // 上次課堂活動查詢
    if (lessonDate) {
      queries.push(
        supabase
          .from('hanami_student_activities')
          .select(`
            id,
            completion_status,
            assigned_at,
            time_spent,
            teacher_notes,
            student_feedback,
            progress,
            lesson_date,
            timeslot,
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
          `)
          .eq('student_id', studentId)
          .eq('activity_type', 'lesson')
          .lt('lesson_date', lessonDate)
          .order('lesson_date', { ascending: false })
          .limit(5)
      );
    } else {
      queries.push(Promise.resolve({ data: [], error: null }));
    }
    
    // 正在學習的活動查詢
    queries.push(
      supabase
        .from('hanami_student_activities')
        .select(`
          id,
          completion_status,
          assigned_at,
          time_spent,
          teacher_notes,
          student_feedback,
          progress,
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
        `)
        .eq('student_id', studentId)
        .eq('activity_type', 'ongoing')
        .in('completion_status', ['in_progress', 'not_started'])
        .order('assigned_at', { ascending: false })
    );
    
    // 執行並行查詢
    const [currentResult, previousResult, ongoingResult] = await Promise.all(queries);
    
    const currentLessonActivities = currentResult.data || [];
    const previousLessonActivities = previousResult.data || [];
    const ongoingActivities = ongoingResult.data || [];
    
    console.log('並行查詢完成:', {
      current: currentLessonActivities.length,
      previous: previousLessonActivities.length,
      ongoing: ongoingActivities.length
    });

    // 處理活動資料，統一格式
    const processActivity = (activity: any) => {
      const teachingActivity = activity.hanami_teaching_activities;
      if (!teachingActivity) return null;

      return {
        id: activity.id,
        activityName: teachingActivity.activity_name,
        activityDescription: teachingActivity.activity_description,
        activityType: teachingActivity.activity_type,
        difficultyLevel: teachingActivity.difficulty_level || 1,
        estimatedDuration: teachingActivity.duration_minutes || 0,
        materialsNeeded: teachingActivity.materials_needed || [],
        instructions: teachingActivity.instructions || '',
        completionStatus: activity.completion_status,
        teacherNotes: activity.teacher_notes,
        studentFeedback: activity.student_feedback,
        timeSpent: activity.time_spent || 0,
        progress: activity.progress || 0,
        assignedAt: activity.assigned_at,
        lessonDate: activity.lesson_date,
        timeslot: activity.timeslot
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
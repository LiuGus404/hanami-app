import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: '缺少學生 ID'
      }, { status: 400 });
    }

    console.log('📚 獲取學生正在學習的活動:', studentId);

    // 直接查詢資料庫，避免內部 API 調用問題
    const today = new Date().toISOString().split('T')[0];
    
    // 並行查詢所有活動類型
    const queries = [];
    
    // 本次課堂活動查詢
    queries.push(
      (supabase as any)
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
        .eq('lesson_date', today)
    );
    
    // 上次課堂活動查詢
    queries.push(
      (supabase as any)
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
        .lt('lesson_date', today)
        .order('lesson_date', { ascending: false })
        .limit(5)
    );
    
    // 正在學習的活動查詢
    queries.push(
      (supabase as any)
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
    
    // 調試：檢查正在學習的活動詳情
    if (ongoingActivities.length > 0) {
      console.log('🔍 正在學習的活動詳情:', ongoingActivities.map((activity: any) => ({
        id: activity.id,
        activity_id: activity.activity_id,
        completion_status: activity.completion_status,
        activity_type: activity.activity_type,
        hasTeachingActivity: !!activity.hanami_teaching_activities,
        teachingActivityName: activity.hanami_teaching_activities?.activity_name
      })));
    }

    // 處理活動資料，統一格式
    const processActivity = (activity: any) => {
      const teachingActivity = activity.hanami_teaching_activities;
      if (!teachingActivity) {
        console.log('⚠️ 活動缺少 hanami_teaching_activities 關聯:', {
          activityId: activity.activity_id,
          completionStatus: activity.completion_status,
          activityType: activity.activity_type
        });
        return null;
      }

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

    // 合併所有類型的活動並過濾出未完成的活動
    const allActivities = [
      ...currentLessonActivities.map(processActivity).filter(Boolean),
      ...previousLessonActivities.map(processActivity).filter(Boolean),
      ...ongoingActivities.map(processActivity).filter(Boolean)
    ];
    
    // 過濾出未完成的活動 (與課堂活動管理中 getStudentAssignedActivities 相同的邏輯)
    const ongoingActivitiesFiltered = allActivities.filter(activity => activity.completionStatus !== 'completed');

    console.log(`✅ 為學生 ${studentId} 獲取正在學習活動:`, ongoingActivitiesFiltered.length);

    return NextResponse.json({
      success: true,
      data: ongoingActivitiesFiltered
    });

  } catch (error) {
    console.error('獲取學生正在學習活動失敗:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '獲取學生活動失敗'
    }, { status: 500 });
  }
}

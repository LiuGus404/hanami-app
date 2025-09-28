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
          performance_rating,
          activity_id,
          lesson_date,
          timeslot,
          hanami_teaching_activities!left (
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
            performance_rating,
            lesson_date,
            timeslot,
            activity_id,
            hanami_teaching_activities!left (
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
    
    // 正在學習的活動查詢（包含 ongoing 和成長樹相關的 lesson 類型活動）
    // 修改：查詢所有 ongoing 類型 + 成長樹相關的 lesson 類型活動，不區分完成狀態
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
          performance_rating,
          activity_id,
          activity_type,
          tree_id,
          lesson_date,
          timeslot,
          hanami_teaching_activities!left (
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
        .or('activity_type.eq.ongoing,and(activity_type.eq.lesson,tree_id.not.is.null)') // 查詢 ongoing 或 有 tree_id 的 lesson 類型
        .order('assigned_at', { ascending: false })
    );
    
    // 為了向後兼容，保留一個空的查詢結果
    queries.push(Promise.resolve({ data: [], error: null }));
    
    // 執行並行查詢
    const [currentResult, previousResult, ongoingResult, completedOngoingResult] = await Promise.all(queries);
    
    const currentLessonActivities = currentResult.data || [];
    const previousLessonActivities = previousResult.data || [];
    const allOngoingActivities = ongoingResult.data || [];
    const completedOngoingActivities = completedOngoingResult.data || [];
    
    // 將所有正在學習的活動分為未完成和已完成兩類
    const ongoingActivities = allOngoingActivities.filter((activity: any) => (activity.performance_rating || 0) < 5);
    const completedActivities = allOngoingActivities.filter((activity: any) => (activity.performance_rating || 0) >= 5);
    
    console.log('並行查詢完成:', {
      current: currentLessonActivities.length,
      previous: previousLessonActivities.length,
      allOngoing: allOngoingActivities.length,
      ongoing: ongoingActivities.length,
      completed: completedActivities.length,
      completedOngoing: completedOngoingActivities.length
    });

    // 調試：檢查正在學習活動的詳細信息
    console.log('🔍 正在學習活動詳細信息:', ongoingActivities.map((activity: any) => ({
      id: activity.id,
      activity_id: activity.activity_id,
      activity_type: activity.activity_type,
      tree_id: activity.tree_id,
      progress: (activity.performance_rating || 0) * 20, // 將 1-5 分轉換為 0-100%
      completion_status: activity.completion_status,
      has_teaching_activity: !!activity.hanami_teaching_activities,
      teaching_activity_name: activity.hanami_teaching_activities?.activity_name || 'N/A'
    })));
    
    console.log('🔍 修復後的查詢結果:', {
      totalOngoingActivities: ongoingActivities.length,
      ongoingTypeCount: ongoingActivities.filter((a: any) => a.activity_type === 'ongoing').length,
      lessonTypeCount: ongoingActivities.filter((a: any) => a.activity_type === 'lesson').length,
      withTreeIdCount: ongoingActivities.filter((a: any) => a.tree_id).length
    });

    // 處理活動資料，統一格式
    const processActivity = (activity: any) => {
      const teachingActivity = activity.hanami_teaching_activities;
      // 即使教學活動關聯缺失，也要帶回 student_activity 的基本資訊以利前端偵錯
      if (!teachingActivity) {
        return {
          id: activity.id,
          // 關鍵：保留原始 student_activities.activity_id，方便檢查是否為空
          activityId: activity.activity_id || null,
          teachingActivityId: null,
          activityName: null,
          activityDescription: null,
          activityType: null,
          difficultyLevel: null,
          estimatedDuration: null,
          materialsNeeded: [],
          instructions: null,
          completionStatus: activity.completion_status,
          teacherNotes: activity.teacher_notes,
          studentFeedback: activity.student_feedback,
          timeSpent: activity.time_spent || 0,
          progress: (activity.performance_rating || 0) * 20, // 將 1-5 分轉換為 0-100%
          assignedAt: activity.assigned_at,
          lessonDate: activity.lesson_date,
          timeslot: activity.timeslot,
          _raw: activity
        };
      }

      return {
        id: activity.id,
        // 關鍵：對外提供可用於比對教學活動的 ID
        activityId: teachingActivity.id, // 對應 hanami_teaching_activities.id
        teachingActivityId: teachingActivity.id,
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
        timeslot: activity.timeslot,
        _raw: activity
      };
    };

    return NextResponse.json({
      success: true,
      data: {
        currentLessonActivities: (currentLessonActivities || []).map(processActivity),
        previousLessonActivities: (previousLessonActivities || []).map(processActivity),
        ongoingActivities: (ongoingActivities || []).map(processActivity),
        completedOngoingActivities: (completedActivities || []).map(processActivity)
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
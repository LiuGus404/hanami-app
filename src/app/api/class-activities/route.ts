import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { fallbackOrganization } from '@/lib/authUtils';

// 將時間字符串（HH:MM）轉換為分鐘數，便於計算
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// 將分鐘數轉換回時間字符串（HH:MM）
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// 檢查課程是否在教師排程時間內（準確匹配 hanami_schedule 時間）
function isLessonInTeacherSchedule(lesson: any, teacherSchedule: any[]): boolean {
  // 如果沒有排程記錄，表示教師沒有被安排工作，不顯示任何課程
  if (teacherSchedule.length === 0) {
    console.log('教師沒有排程記錄，過濾掉所有課程');
    return false;
  }

  const lessonDate = lesson.lesson_date;
  const lessonTime = lesson.actual_timeslot;

  if (!lessonDate || !lessonTime) {
    console.log('課程缺少日期或時間信息，過濾掉:', { lessonDate, lessonTime });
    return false;
  }

  // 找到對應日期的排程
  const daySchedule = teacherSchedule.filter(schedule => schedule.scheduled_date === lessonDate);
  
  if (daySchedule.length === 0) {
    console.log(`教師在 ${lessonDate} 沒有排程，過濾掉課程`);
    return false;
  }

  // 檢查課程時間是否在任何一個排程時間段內（準確匹配，不擴展）
  const isInSchedule = daySchedule.some(schedule => {
    const startTime = schedule.start_time;
    const endTime = schedule.end_time;
    
    // 將時間轉換為分鐘數
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const lessonMinutes = timeToMinutes(lessonTime.toString().padStart(5, '0'));
    
    // 準確匹配時間範圍（不擴展）
    const isInTimeRange = lessonMinutes >= startMinutes && lessonMinutes <= endMinutes;
    
    if (isInTimeRange) {
      console.log(`課程時間 ${lessonTime} 在排程時間內 ${startTime}-${endTime}`);
    }
    
    return isInTimeRange;
  });

  if (!isInSchedule) {
    console.log(`課程時間 ${lessonTime} 不在任何排程時間段內`);
  }

  return isInSchedule;
}

// 獲取本週課堂和學生列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart'); // YYYY-MM-DD 格式
    const weekEnd = searchParams.get('weekEnd'); // YYYY-MM-DD 格式
    const teacherId = searchParams.get('teacherId'); // 教師ID
    const orgId = searchParams.get('orgId');
    const disableOrgData =
      !orgId ||
      orgId === 'default-org' ||
      orgId === fallbackOrganization.id;

    if (!weekStart || !weekEnd) {
      return NextResponse.json(
        { error: '請提供週開始和結束日期' },
        { status: 400 }
      );
    }

    if (disableOrgData) {
      return NextResponse.json({
        success: true,
        data: {
          lessons: [],
          trialLessons: [],
          treeActivities: [],
          assignedActivities: [],
        },
      });
    }

    const organizationId = orgId as string;

    console.log('Fetching lessons between:', { weekStart, weekEnd, teacherId, orgId: organizationId });

    // 使用服務角色客戶端以繞過 RLS
    const supabase = getServerSupabaseClient();

    // 如果提供了教師ID，先查詢教師排程
    let teacherSchedule: any[] = [];
    if (teacherId) {
      console.log('查詢教師排程，教師ID:', teacherId);
      let teacherScheduleQuery = supabase
        .from('teacher_schedule')
        .select('scheduled_date, start_time, end_time, note')
        .eq('teacher_id', teacherId)
        .gte('scheduled_date', weekStart)
        .lte('scheduled_date', weekEnd)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      teacherScheduleQuery = teacherScheduleQuery.eq('org_id', organizationId);

      const { data: scheduleData, error: scheduleError } = await teacherScheduleQuery;

      if (scheduleError) {
        console.error('查詢教師排程失敗:', scheduleError);
        return NextResponse.json(
          { error: '查詢教師排程失敗', details: scheduleError.message },
          { status: 500 }
        );
      }

      teacherSchedule = scheduleData || [];
      console.log(`教師排程數據: ${teacherSchedule.length} 條記錄`, teacherSchedule);
    }

    // 並行查詢正式學生和試聽學生課程記錄
    console.log('開始並行查詢課程記錄...');
    
    const [lessonsResult, trialLessonsResult] = await Promise.all([
      // 查詢正式學生課程
      supabase
        .from('hanami_student_lesson')
        .select(`
          id,
          student_id,
          lesson_date,
          actual_timeslot,
          lesson_duration,
          lesson_status,
          lesson_teacher,
          full_name,
          course_type,
          Hanami_Students!hanami_student_lesson_student_id_fkey (
            id,
            full_name,
            nick_name,
            student_age,
            gender,
            course_type,
            student_teacher
          )
        `)
        .gte('lesson_date', weekStart)
        .lte('lesson_date', weekEnd)
        .eq('org_id', organizationId)
        .order('lesson_date', { ascending: true })
        .order('actual_timeslot', { ascending: true }),
      
      // 查詢試聽學生課程
      supabase
        .from('hanami_trial_students')
        .select(`
          id,
          full_name,
          nick_name,
          student_age,
          gender,
          course_type,
          lesson_date,
          actual_timeslot,
          lesson_duration,
          trial_status
        `)
        .not('lesson_date', 'is', null)
        .gte('lesson_date', weekStart)
        .lte('lesson_date', weekEnd)
        .eq('org_id', organizationId)
        .order('lesson_date', { ascending: true })
        .order('actual_timeslot', { ascending: true })
    ]);

    let lessons: any[] = [];
    let trialLessons: any[] = [];
    let lessonsError: any = null;
    let trialLessonsError: any = null;

    if (lessonsResult.error) {
      console.error('獲取課程記錄失敗:', lessonsResult.error);
      lessonsError = lessonsResult.error;
    } else {
      lessons = lessonsResult.data || [];
      console.log(`成功獲取 ${lessons.length} 條正式學生課程記錄`);
      
      // 如果提供了教師ID，根據排程過濾課程
      if (teacherId) {
        const originalCount = lessons.length;
        lessons = lessons.filter(lesson => isLessonInTeacherSchedule(lesson, teacherSchedule));
        console.log(`根據教師排程過濾正式學生課程: ${originalCount} -> ${lessons.length}`);
        if (teacherSchedule.length === 0) {
          console.log('教師沒有排程記錄，過濾掉所有正式學生課程');
        }
      }
    }

    if (trialLessonsResult.error) {
      console.error('獲取試聽學生記錄失敗:', trialLessonsResult.error);
      trialLessonsError = trialLessonsResult.error;
    } else {
      trialLessons = trialLessonsResult.data || [];
      console.log(`成功獲取 ${trialLessons.length} 條試聽學生記錄`);
      
      // 如果提供了教師ID，根據排程過濾試聽課程
      if (teacherId) {
        const originalCount = trialLessons.length;
        trialLessons = trialLessons.filter(trial => isLessonInTeacherSchedule(trial, teacherSchedule));
        console.log(`根據教師排程過濾試聽學生課程: ${originalCount} -> ${trialLessons.length}`);
        if (teacherSchedule.length === 0) {
          console.log('教師沒有排程記錄，過濾掉所有試聽學生課程');
        }
      }
    }

    if (lessonsError) {
      console.error('獲取課程記錄失敗:', lessonsError);
      return NextResponse.json(
        { error: '獲取課程記錄失敗', details: lessonsError.message },
        { status: 500 }
      );
    }

    // 暫時跳過成長樹活動查詢，改為延遲載入
    let treeActivities: any[] = [];
    console.log('跳過成長樹活動查詢，將在需要時延遲載入');

    // 暫時返回空的已分配活動列表
    const assignedActivities: any[] = [];

    console.log('API 響應準備完成:', {
      lessonsCount: lessons.length,
      trialLessonsCount: trialLessons.length,
      treeActivitiesCount: treeActivities.length,
      assignedActivitiesCount: assignedActivities.length
    });

    // 檢查是否有試聽學生資料
    if (trialLessons.length === 0) {
      console.log('警告：沒有找到試聽學生資料');
    }

    return NextResponse.json({
      success: true,
      data: {
        lessons: lessons || [],
        trialLessons: trialLessons || [],
        treeActivities: treeActivities || [],
        assignedActivities
      }
    });

  } catch (error) {
    console.error('獲取課堂活動資料失敗:', error);
    return NextResponse.json(
      { error: '獲取課堂活動資料失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

// 為學生分配活動
export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabaseClient();
    const body = await request.json();
    const { lesson_id, student_id, tree_activity_id, assigned_by } = body;

    if (!lesson_id || !student_id || !tree_activity_id) {
      return NextResponse.json(
        { error: '缺少必填欄位', required: ['lesson_id', 'student_id', 'tree_activity_id'] },
        { status: 400 }
      );
    }

    // 檢查是否已經分配過相同的活動
    const { data: existingAssignment, error: checkError } = await (supabase as any)
      .from('hanami_student_lesson_activities')
      .select('id')
      .eq('lesson_id', lesson_id)
      .eq('student_id', student_id)
      .eq('tree_activity_id', tree_activity_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('檢查現有分配失敗:', checkError);
      return NextResponse.json(
        { error: '檢查現有分配失敗', details: checkError.message },
        { status: 500 }
      );
    }

    if (existingAssignment) {
      return NextResponse.json(
        { error: '該學生在此課堂中已經分配了此活動' },
        { status: 409 }
      );
    }

    // 創建新的活動分配
    const { data, error } = await (supabase as any)
      .from('hanami_student_lesson_activities')
      .insert({
        lesson_id,
        student_id,
        tree_activity_id,
        assigned_by,
        completion_status: 'not_started',
        performance_rating: null,
        student_notes: null,
        teacher_notes: null,
        time_spent: 0,
        attempts_count: 0,
        is_favorite: false
      })
      .select()
      .single();

    if (error) {
      console.error('分配活動失敗:', error);
      return NextResponse.json(
        { error: '分配活動失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '活動分配成功'
    }, { status: 201 });

  } catch (error) {
    console.error('分配活動時發生錯誤:', error);
    return NextResponse.json(
      { error: '分配活動時發生錯誤' },
      { status: 500 }
    );
  }
}

// 更新活動分配狀態
export async function PUT(request: NextRequest) {
  try {
    const supabase = getServerSupabaseClient();
    const body = await request.json();
    const { id, completion_status, performance_rating, student_notes, teacher_notes, time_spent, attempts_count, is_favorite } = body;

    if (!id) {
      return NextResponse.json(
        { error: '缺少必填欄位', required: ['id'] },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (completion_status !== undefined) updateData.completion_status = completion_status;
    if (performance_rating !== undefined) updateData.performance_rating = performance_rating;
    if (student_notes !== undefined) updateData.student_notes = student_notes;
    if (teacher_notes !== undefined) updateData.teacher_notes = teacher_notes;
    if (time_spent !== undefined) updateData.time_spent = time_spent;
    if (attempts_count !== undefined) updateData.attempts_count = attempts_count;
    if (is_favorite !== undefined) updateData.is_favorite = is_favorite;

    const { data, error } = await (supabase as any)
      .from('hanami_student_lesson_activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新活動分配失敗:', error);
      return NextResponse.json(
        { error: '更新活動分配失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '活動分配更新成功'
    });

  } catch (error) {
    console.error('更新活動分配時發生錯誤:', error);
    return NextResponse.json(
      { error: '更新活動分配時發生錯誤' },
      { status: 500 }
    );
  }
}

// 移除活動分配
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '請提供分配ID' },
        { status: 400 }
      );
    }

    const { error } = await (supabase as any)
      .from('hanami_student_lesson_activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('移除活動分配失敗:', error);
      return NextResponse.json(
        { error: '移除活動分配失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '活動分配已移除'
    });

  } catch (error) {
    console.error('移除活動分配時發生錯誤:', error);
    return NextResponse.json(
      { error: '移除活動分配時發生錯誤' },
      { status: 500 }
    );
  }
} 
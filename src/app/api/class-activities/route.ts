
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 獲取本週課堂和學生列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart'); // YYYY-MM-DD 格式
    const weekEnd = searchParams.get('weekEnd'); // YYYY-MM-DD 格式

    if (!weekStart || !weekEnd) {
      return NextResponse.json(
        { error: '請提供週開始和結束日期' },
        { status: 400 }
      );
    }

    console.log('Fetching lessons between:', { weekStart, weekEnd });

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
    }

    if (trialLessonsResult.error) {
      console.error('獲取試聽學生記錄失敗:', trialLessonsResult.error);
      trialLessonsError = trialLessonsResult.error;
    } else {
      trialLessons = trialLessonsResult.data || [];
      console.log(`成功獲取 ${trialLessons.length} 條試聽學生記錄`);
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

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

    // 獲取本週的課程記錄
    const { data: lessons, error: lessonsError } = await supabase
      .from('hanami_student_lesson')
      .select(`
        id,
        student_id,
        lesson_date,
        actual_timeslot,
        lesson_duration,
        lesson_status,
        lesson_teacher,
        lesson_activities,
        progress_notes,
        next_target,
        notes,
        remarks,
        full_name,
        Hanami_Students (
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
      .order('actual_timeslot', { ascending: true });

    if (lessonsError) {
      console.error('獲取課程記錄失敗:', lessonsError);
      return NextResponse.json(
        { error: '獲取課程記錄失敗', details: lessonsError.message },
        { status: 500 }
      );
    }

    console.log('Fetched lessons:', lessons);

    // 獲取所有成長樹活動
    const { data: treeActivities, error: activitiesError } = await (supabase as any)
      .from('hanami_tree_activities')
      .select(`
        id,
        tree_id,
        activity_id,
        activity_source,
        custom_activity_name,
        custom_activity_description,
        activity_type,
        difficulty_level,
        estimated_duration,
        materials_needed,
        instructions,
        learning_objectives,
        target_abilities,
        prerequisites,
        priority_order,
        activity_order,
        is_required,
        is_active,
        hanami_teaching_activities (
          id,
          activity_name,
          activity_description,
          activity_type,
          difficulty_level,
          duration_minutes,
          materials_needed,
          instructions,
          custom_fields,
          template_id,
          status,
          tags,
          category,
          created_at
        ),
        hanami_growth_trees (
          id,
          tree_name,
          tree_description,
          tree_icon,
          course_type_id,
          tree_level
        )
      `)
      .eq('is_active', true)
      .order('priority_order', { ascending: true })
      .order('activity_order', { ascending: true });

    if (activitiesError) {
      console.error('獲取成長樹活動失敗:', activitiesError);
      return NextResponse.json(
        { error: '獲取成長樹活動失敗', details: activitiesError.message },
        { status: 500 }
      );
    }

    console.log('Fetched tree activities:', treeActivities);

    // 暫時返回空的已分配活動列表，直到表創建完成
    const assignedActivities: any[] = [];

    return NextResponse.json({
      success: true,
      data: {
        lessons: lessons || [],
        treeActivities: treeActivities || [],
        assignedActivities
      }
    });

  } catch (error) {
    console.error('獲取課堂活動資料失敗:', error);
    return NextResponse.json(
      { error: '獲取課堂活動資料失敗' },
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
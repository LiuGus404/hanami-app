import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// 獲取特定時段的班別活動
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonDate = searchParams.get('lessonDate');
    const timeslot = searchParams.get('timeslot');
    const courseType = searchParams.get('courseType');

    console.log('GET request parameters:', { lessonDate, timeslot, courseType });

    if (!lessonDate || !timeslot || !courseType) {
      return NextResponse.json(
        { error: '缺少必要參數：lessonDate, timeslot, courseType' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 從 hanami_lesson_plan_activities 表獲取該時段的班別活動
    const { data: assignedActivities, error: assignedError } = await supabase
      .from('hanami_lesson_plan_activities' as any)
      .select(`
        id,
        lesson_date,
        timeslot,
        course_type,
        activity_id,
        activity_type,
        created_at,
        hanami_tree_activities (
          id,
          tree_id,
          activity_id,
          activity_source,
          custom_activity_name,
          custom_activity_description,
          activity_type,
          difficulty_level,
          estimated_duration,
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
            category
          )
        )
      `)
      .eq('lesson_date', lessonDate)
      .eq('timeslot', timeslot)
      .eq('course_type', courseType)
      .eq('activity_type', 'class_activity');

    if (assignedError) {
      // 若資料表不存在（42P01），回傳空列表以避免 500
      if ((assignedError as any).code === '42P01' || /relation .* does not exist/i.test((assignedError as any).message || '')) {
        console.warn('hanami_lesson_plan_activities 不存在，返回空列表');
        return NextResponse.json({ 
          success: true, 
          data: [], 
          message: '資料表不存在，請先創建資料表',
          tableMissing: true,
          setupUrl: '/admin/setup-lesson-plan-activities'
        });
      }
      console.error('Error fetching assigned activities:', assignedError);
      return NextResponse.json(
        { error: '獲取班別活動失敗', details: (assignedError as any).message || String(assignedError) },
        { status: 500 }
      );
    }

    // 處理活動資料
    const processedActivities = (assignedActivities || []).map((assignment: any) => {
      const treeActivity = assignment.hanami_tree_activities;
      const teachingActivity = treeActivity?.hanami_teaching_activities;
      
      return {
        id: assignment.id,
        activityId: treeActivity?.id,
        name: treeActivity?.custom_activity_name || teachingActivity?.activity_name || '未知活動',
        description: treeActivity?.custom_activity_description || teachingActivity?.activity_description,
        type: treeActivity?.activity_type || teachingActivity?.activity_type,
        difficulty: treeActivity?.difficulty_level || teachingActivity?.difficulty_level,
        duration: treeActivity?.estimated_duration || teachingActivity?.duration_minutes,
        materials: treeActivity?.materials_needed || teachingActivity?.materials_needed,
        instructions: treeActivity?.instructions || teachingActivity?.instructions,
        customFields: teachingActivity?.custom_fields,
        tags: teachingActivity?.tags,
        category: teachingActivity?.category,
        createdAt: assignment.created_at
      };
    });

    return NextResponse.json({
      success: true,
      data: processedActivities
    });

  } catch (error) {
    console.error('Error in lesson plan activities API:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
}

// 分配班別活動到特定時段
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonDate, timeslot, courseType, activityIds } = body;

    console.log('POST request body:', { lessonDate, timeslot, courseType, activityIds });

    if (!lessonDate || !timeslot || !courseType || !activityIds || !Array.isArray(activityIds)) {
      return NextResponse.json(
        { error: '缺少必要參數或格式錯誤' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 先刪除該時段現有的班別活動
    const { error: deleteError } = await supabase
      .from('hanami_lesson_plan_activities' as any)
      .delete()
      .eq('lesson_date', lessonDate)
      .eq('timeslot', timeslot)
      .eq('course_type', courseType)
      .eq('activity_type', 'class_activity');

    if (deleteError) {
      // 若資料表不存在（42P01），回報明確訊息，避免 500
      if ((deleteError as any).code === '42P01' || /relation .* does not exist/i.test((deleteError as any).message || '')) {
        return NextResponse.json(
          { error: '資料表尚未建立，請先前往 /admin/setup-lesson-plan-activities 建立資料表' },
          { status: 400 }
        );
      }
      console.error('Error deleting existing activities:', deleteError);
      return NextResponse.json(
        { error: '刪除現有活動失敗', details: (deleteError as any).message || String(deleteError) },
        { status: 500 }
      );
    }

    // 插入新的班別活動
    const activitiesToInsert = activityIds.map(activityId => ({
      lesson_date: lessonDate,
      timeslot: timeslot,
      course_type: courseType,
      activity_id: activityId,
      activity_type: 'class_activity',
      created_at: new Date().toISOString()
    }));

    const { data: insertedActivities, error: insertError } = await supabase
      .from('hanami_lesson_plan_activities' as any)
      .insert(activitiesToInsert)
      .select();

    if (insertError) {
      // 若資料表不存在（42P01），回報明確訊息
      if ((insertError as any).code === '42P01' || /relation .* does not exist/i.test((insertError as any).message || '')) {
        return NextResponse.json(
          { error: '資料表尚未建立，請先前往 /admin/setup-lesson-plan-activities 建立資料表' },
          { status: 400 }
        );
      }
      console.error('Error inserting activities:', insertError);
      return NextResponse.json(
        { error: '分配活動失敗', details: (insertError as any).message || String(insertError) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: insertedActivities,
      message: `成功分配 ${insertedActivities.length} 個班別活動`
    });

  } catch (error) {
    console.error('Error in lesson plan activities POST API:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
}

// 刪除特定時段的班別活動
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonDate = searchParams.get('lessonDate');
    const timeslot = searchParams.get('timeslot');
    const courseType = searchParams.get('courseType');

    if (!lessonDate || !timeslot || !courseType) {
      return NextResponse.json(
        { error: '缺少必要參數：lessonDate, timeslot, courseType' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { error: deleteError } = await supabase
      .from('hanami_lesson_plan_activities' as any)
      .delete()
      .eq('lesson_date', lessonDate)
      .eq('timeslot', timeslot)
      .eq('course_type', courseType)
      .eq('activity_type', 'class_activity');

    if (deleteError) {
      console.error('Error deleting activities:', deleteError);
      return NextResponse.json(
        { error: '刪除活動失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '成功刪除班別活動'
    });

  } catch (error) {
    console.error('Error in lesson plan activities DELETE API:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
}
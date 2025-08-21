import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 測試基本連接
    const { data: testData, error: testError } = await supabase
      .from('hanami_student_lesson')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('資料庫連接測試失敗:', testError);
      return NextResponse.json(
        { error: '資料庫連接測試失敗', details: testError.message },
        { status: 500 }
      );
    }

    // 測試獲取課程記錄
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
      .limit(5);

    if (lessonsError) {
      console.error('獲取課程記錄測試失敗:', lessonsError);
      return NextResponse.json(
        { error: '獲取課程記錄測試失敗', details: lessonsError.message },
        { status: 500 }
      );
    }

    // 測試獲取成長樹活動
    const { data: treeActivities, error: activitiesError } = await (supabase as any)
      .from('hanami_tree_activities')
      .select(`
        id,
        tree_id,
        activity_id,
        activity_source,
        custom_activity_name,
        activity_type,
        difficulty_level,
        is_active
      `)
      .eq('is_active', true)
      .limit(5);

    if (activitiesError) {
      console.error('獲取成長樹活動測試失敗:', activitiesError);
      return NextResponse.json(
        { error: '獲取成長樹活動測試失敗', details: activitiesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '所有測試通過',
      data: {
        lessonsCount: lessons?.length || 0,
        treeActivitiesCount: treeActivities?.length || 0,
        sampleLessons: lessons?.slice(0, 2) || [],
        sampleActivities: treeActivities?.slice(0, 2) || []
      }
    });

  } catch (error) {
    console.error('測試失敗:', error);
    return NextResponse.json(
      { error: '測試失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
} 
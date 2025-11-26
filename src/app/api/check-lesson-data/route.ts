import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 開始檢查課程記錄...');

    // 檢查課程記錄
    const { data: lessons, error: lessonError } = await supabase
      .from('hanami_student_lesson')
      .select('lesson_date, lesson_teacher')
      .not('lesson_teacher', 'is', null)
      .order('lesson_date', { ascending: false });

    if (lessonError) {
      console.error('❌ 查詢課程記錄失敗:', lessonError);
      return NextResponse.json({ 
        error: '查詢課程記錄失敗', 
        details: lessonError.message 
      }, { status: 500 });
    }

    // 統計教師工作日期
    const typedLessons = (lessons || []) as Array<{
      lesson_teacher?: string | null;
      lesson_date?: string | null;
      [key: string]: any;
    }>;
    const teacherWorkDates = new Map<string, Set<string>>();
    typedLessons.forEach(lesson => {
      if (lesson.lesson_teacher && lesson.lesson_date) {
        if (!teacherWorkDates.has(lesson.lesson_teacher)) {
          teacherWorkDates.set(lesson.lesson_teacher, new Set());
        }
        teacherWorkDates.get(lesson.lesson_teacher)?.add(lesson.lesson_date);
      }
    });

    // 轉換為可用的排班資料
    const potentialSchedules = [];
    for (const [teacherName, dates] of teacherWorkDates) {
      for (const date of dates) {
        potentialSchedules.push({
          teacher_name: teacherName,
          scheduled_date: date,
          start_time: '09:00',
          end_time: '18:00',
        });
      }
    }

    console.log('✅ 課程記錄檢查完成');

    return NextResponse.json({
      success: true,
      totalLessons: typedLessons.length || 0,
      uniqueTeachers: teacherWorkDates.size,
      potentialSchedules: potentialSchedules.length,
      teacherWorkDates: Object.fromEntries(
        Array.from(teacherWorkDates.entries()).map(([teacher, dates]) => [
          teacher, 
          Array.from(dates).sort()
        ])
      ),
      recentLessons: typedLessons.slice(0, 10) || [],
      checkTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 檢查課程記錄時發生錯誤:', error);
    return NextResponse.json({ 
      error: '檢查課程記錄時發生未預期的錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: 開始查詢正式學生列表...');
    
    // 使用服務角色 key 繞過 RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 查詢正式學生列表
    const { data: students, error: studentsError } = await supabase
      .from('Hanami_Students')
      .select(`
        id,
        student_oid,
        full_name,
        nick_name,
        course_type,
        regular_weekday,
        regular_timeslot,
        ongoing_lessons,
        upcoming_lessons
      `)
      .order('full_name', { ascending: true });

    if (studentsError) throw studentsError;

    // 為每個學生查詢課程包資料
    const studentsWithPackages = await Promise.all(
      students.map(async (student) => {
        const { data: packages, error: packagesError } = await supabase
          .from('Hanami_Student_Package')
          .select(`
            id,
            course_name,
            total_lessons,
            remaining_lessons,
            lesson_duration,
            lesson_time,
            weekday,
            price,
            start_date,
            status
          `)
          .eq('student_id', student.id)
          .eq('status', 'active');

        if (packagesError) {
          console.error(`查詢學生 ${student.full_name} 的課程包失敗:`, packagesError);
        }

        // 查詢所有課程記錄（包括已完成和未完成）
        const { data: allLessons, error: lessonsError } = await supabase
          .from('hanami_student_lesson')
          .select('id, status, lesson_date')
          .eq('student_id', student.id)
          .order('lesson_date', { ascending: false }); // 按日期降序排列

        if (lessonsError) {
          console.error(`查詢學生 ${student.full_name} 的課程記錄失敗:`, lessonsError);
        }

        // 查詢已完成的課程數量
        const completedCount = allLessons?.filter(lesson => 
          lesson.status === 'attended'
        ).length || 0;

        // 計算總堂數（所有課程記錄）
        const totalLessons = allLessons?.length || 0;
        
        // 計算剩餘堂數（未來的課程）
        const today = new Date().toISOString().slice(0, 10);
        const remainingLessons = allLessons?.filter(lesson => 
          lesson.lesson_date >= today
        ).length || 0;

        // 獲取最後一堂課的日期
        const lastLessonDate = allLessons && allLessons.length > 0 ? allLessons[0].lesson_date : null;

        return {
          ...student,
          packages: packages || [],
          completed_lessons: completedCount,
          total_lessons: totalLessons,
          remaining_lessons: remainingLessons,
          net_remaining_lessons: Math.max(0, totalLessons - completedCount),
          lastLessonDate: lastLessonDate
        };
      })
    );

    console.log('🔍 API: 查詢結果:', { 
      studentsCount: studentsWithPackages.length,
      students: studentsWithPackages.map(s => ({
        name: s.full_name,
        totalLessons: s.total_lessons,
        completedLessons: s.completed_lessons,
        netRemaining: s.net_remaining_lessons
      }))
    });

    return NextResponse.json({
      success: true,
      data: studentsWithPackages,
      count: studentsWithPackages.length
    });

  } catch (error) {
    console.error('❌ API: 查詢失敗:', error);
    return NextResponse.json({
      success: false,
      error: error,
      data: [],
      count: 0
    }, { status: 500 });
  }
}

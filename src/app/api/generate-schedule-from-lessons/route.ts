import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🔍 開始從課程記錄生成排班...');

    // 1. 獲取課程記錄
    const { data: lessons, error: lessonError } = await supabase
      .from('hanami_student_lesson')
      .select('lesson_date, lesson_teacher')
      .not('lesson_teacher', 'is', null);

    if (lessonError) {
      console.error('❌ 查詢課程記錄失敗:', lessonError);
      return NextResponse.json({ 
        error: '查詢課程記錄失敗', 
        details: lessonError.message 
      }, { status: 500 });
    }

    // 2. 獲取教師資料以匹配ID
    const { data: teachers, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_nickname, teacher_fullname');

    if (teacherError) {
      console.error('❌ 查詢教師資料失敗:', teacherError);
      return NextResponse.json({ 
        error: '查詢教師資料失敗', 
        details: teacherError.message 
      }, { status: 500 });
    }

    // 3. 統計教師工作日期
    const teacherWorkDates = new Map<string, Set<string>>();
    lessons?.forEach(lesson => {
      if (lesson.lesson_teacher && lesson.lesson_date) {
        if (!teacherWorkDates.has(lesson.lesson_teacher)) {
          teacherWorkDates.set(lesson.lesson_teacher, new Set());
        }
        teacherWorkDates.get(lesson.lesson_teacher)?.add(lesson.lesson_date);
      }
    });

    // 4. 生成排班記錄
    const schedules = [];
    for (const [teacherName, dates] of teacherWorkDates) {
      // 找到對應的教師ID
      const teacher = teachers?.find(t => 
        t.teacher_nickname === teacherName || 
        t.teacher_fullname === teacherName
      );

      if (teacher) {
        for (const date of dates) {
          schedules.push({
            teacher_id: teacher.id,
            scheduled_date: date,
            start_time: '09:00',
            end_time: '18:00',
          });
        }
      } else {
        console.warn(`⚠️ 找不到教師 "${teacherName}" 的ID，跳過此教師的排班生成`);
      }
    }

    if (schedules.length === 0) {
      return NextResponse.json({ 
        error: '沒有找到可用的課程記錄來生成排班',
        details: '請確認課程記錄中有教師資訊'
      }, { status: 400 });
    }

    // 5. 檢查是否已有重複的排班記錄
    const existingSchedules = new Set();
    const { data: existingData } = await supabase
      .from('teacher_schedule')
      .select('teacher_id, scheduled_date');

    existingData?.forEach(schedule => {
      existingSchedules.add(`${schedule.teacher_id}-${schedule.scheduled_date}`);
    });

    // 過濾掉已存在的排班記錄
    const newSchedules = schedules.filter(schedule => 
      !existingSchedules.has(`${schedule.teacher_id}-${schedule.scheduled_date}`)
    );

    if (newSchedules.length === 0) {
      return NextResponse.json({ 
        error: '所有從課程記錄推斷的排班記錄都已存在',
        details: '沒有新的排班記錄需要生成'
      }, { status: 400 });
    }

    // 6. 插入新的排班記錄
    const { error: insertError } = await supabase
      .from('teacher_schedule')
      .insert(newSchedules);

    if (insertError) {
      console.error('❌ 插入排班記錄失敗:', insertError);
      return NextResponse.json({ 
        error: '插入排班記錄失敗', 
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('✅ 成功從課程記錄生成排班');

    return NextResponse.json({
      success: true,
      message: `成功從課程記錄生成 ${newSchedules.length} 筆排班記錄`,
      generatedCount: newSchedules.length,
      totalPotential: schedules.length,
      skippedCount: schedules.length - newSchedules.length,
      teacherWorkDates: Object.fromEntries(
        Array.from(teacherWorkDates.entries()).map(([teacher, dates]) => [
          teacher, 
          Array.from(dates).sort()
        ])
      ),
      generatedTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 從課程記錄生成排班時發生錯誤:', error);
    return NextResponse.json({ 
      error: '從課程記錄生成排班時發生未預期的錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
} 
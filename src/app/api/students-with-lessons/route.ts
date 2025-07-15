import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { selectedDates, selectedCourses, selectedWeekdays, searchTerm } = await request.json();

    console.log('收到篩選條件:', { selectedDates, selectedCourses, selectedWeekdays, searchTerm });

    // 查詢常規學生
    let regularStudentQuery = supabase
      .from('Hanami_Students')
      .select('*')
      .eq('student_type', '常規');

    // 查詢試堂學生
    let trialStudentQuery = supabase
      .from('hanami_trial_students')
      .select('*');

    // 查詢停用學生
    let inactiveStudentQuery = supabase
      .from('inactive_student_list')
      .select('*');

    // 決定要查詢哪些學生類型
    let shouldQueryRegular = false;
    let shouldQueryTrial = false;
    let shouldQueryInactive = false;

    if (selectedCourses && selectedCourses.length > 0) {
      // 分離特殊類型和具體課程類型
      const specialTypes = selectedCourses.filter((course: string) => ['常規', '試堂', '停用學生'].includes(course));
      const specificCourses = selectedCourses.filter((course: string) => !['常規', '試堂', '停用學生'].includes(course));
      
      console.log('篩選分析:', {
        allSelectedCourses: selectedCourses,
        specialTypes,
        specificCourses
      });
      
      // 如果有特殊類型篩選，只在明確選擇時才查詢對應的學生類型
      if (specialTypes.length > 0) {
        shouldQueryRegular = specialTypes.includes('常規');
        shouldQueryTrial = specialTypes.includes('試堂');
        shouldQueryInactive = specialTypes.includes('停用學生');
      } else {
        // 如果只選擇了具體課程類型（如鋼琴、音樂專注力），查詢常規和試堂學生（不包括停用學生）
        shouldQueryRegular = true;
        shouldQueryTrial = true;
        shouldQueryInactive = false;
      }
      
      console.log('查詢決定:', {
        shouldQueryRegular,
        shouldQueryTrial,
        shouldQueryInactive
      });
      
      // 如果有具體課程類型篩選，應用 course_type 篩選
      if (specificCourses.length > 0) {
        if (shouldQueryRegular) {
          regularStudentQuery = regularStudentQuery.in('course_type', specificCourses);
        }
        if (shouldQueryTrial) {
          trialStudentQuery = trialStudentQuery.in('course_type', specificCourses);
        }
        if (shouldQueryInactive) {
          inactiveStudentQuery = inactiveStudentQuery.in('course_type', specificCourses);
        }
      }
    } else {
      // 如果沒有選擇任何課程類型，預設查詢常規和試堂學生（不包括停用學生）
      shouldQueryRegular = true;
      shouldQueryTrial = true;
      shouldQueryInactive = false;
      
      console.log('預設查詢設定:', {
        shouldQueryRegular,
        shouldQueryTrial,
        shouldQueryInactive
      });
    }

    // 應用星期篩選
    if (selectedWeekdays && selectedWeekdays.length > 0) {
      if (shouldQueryRegular) {
        regularStudentQuery = regularStudentQuery.in('regular_weekday', selectedWeekdays);
      }
      if (shouldQueryTrial) {
        // 試堂學生可能使用 weekday 而不是 regular_weekday
        trialStudentQuery = trialStudentQuery.in('weekday', selectedWeekdays);
      }
      if (shouldQueryInactive) {
        inactiveStudentQuery = inactiveStudentQuery.in('weekday', selectedWeekdays);
      }
    }

    // 應用搜尋篩選
    if (searchTerm && searchTerm.trim()) {
      console.log('應用搜尋篩選，搜尋詞:', searchTerm);
      
      if (shouldQueryRegular) {
        regularStudentQuery = regularStudentQuery.or(`full_name.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,student_oid.ilike.%${searchTerm}%`);
        console.log('常規學生搜尋條件: full_name, contact_number, student_oid');
      }
      if (shouldQueryTrial) {
        trialStudentQuery = trialStudentQuery.or(`full_name.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%`);
        console.log('試堂學生搜尋條件: full_name, contact_number');
      }
      if (shouldQueryInactive) {
        inactiveStudentQuery = inactiveStudentQuery.or(`full_name.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%`);
        console.log('停用學生搜尋條件: full_name, contact_number');
      }
    }

    // 準備查詢陣列
    const queries = [];
    const queryNames = [];
    
    if (shouldQueryRegular) {
      queries.push(regularStudentQuery);
      queryNames.push('regular');
    }
    
    if (shouldQueryTrial) {
      queries.push(trialStudentQuery);
      queryNames.push('trial');
    }
    
    if (shouldQueryInactive) {
      queries.push(inactiveStudentQuery);
      queryNames.push('inactive');
    }

    console.log('準備執行的查詢:', {
      queryCount: queries.length,
      queryNames
    });

    // 並行查詢
    const results = await Promise.all(queries);

    // 檢查錯誤
    for (let i = 0; i < results.length; i++) {
      if (results[i].error) {
        console.error(`獲取${queryNames[i]}學生資料失敗:`, results[i].error);
        return NextResponse.json({ error: results[i].error?.message || '未知錯誤' }, { status: 500 });
      }
    }

    // 處理學生資料
    let allStudents: any[] = [];
    let regularStudents: any[] = [];
    let trialStudents: any[] = [];
    let inactiveStudents: any[] = [];

    let resultIndex = 0;
    
    if (shouldQueryRegular) {
      regularStudents = results[resultIndex].data || [];
      allStudents.push(...regularStudents);
      resultIndex++;
    }
    
    if (shouldQueryTrial) {
      trialStudents = results[resultIndex].data || [];
      // 處理試堂學生資料，統一欄位名稱
      const normalizedTrialStudents = trialStudents.map(student => ({
        ...student,
        student_type: '試堂', // 確保有 student_type 欄位
        regular_weekday: student.weekday || student.regular_weekday, // 統一欄位名稱
        regular_timeslot: student.actual_timeslot || student.regular_timeslot, // 統一欄位名稱
      }));
      allStudents.push(...normalizedTrialStudents);
      resultIndex++;
    }
    
    if (shouldQueryInactive) {
      inactiveStudents = results[resultIndex].data || [];
      // 處理停用學生資料，統一欄位名稱
      const normalizedInactiveStudents = inactiveStudents.map(student => ({
        ...student,
        student_type: '停用學生', // 確保有 student_type 欄位
        regular_weekday: student.weekday || student.regular_weekday, // 統一欄位名稱
        regular_timeslot: student.actual_timeslot || student.regular_timeslot, // 統一欄位名稱
      }));
      allStudents.push(...normalizedInactiveStudents);
    }

    console.log('獲取到的學生數量:', allStudents.length);
    console.log('常規學生:', regularStudents.length);
    console.log('試堂學生:', trialStudents.length);
    console.log('停用學生:', inactiveStudents.length);

    // 如果有日期篩選，獲取課堂記錄
    if (selectedDates && selectedDates.length > 0) {
      const regularStudentIds = regularStudents.map(s => s.id);
      const trialStudentIds = trialStudents.map(s => s.id);
      const inactiveStudentIds = inactiveStudents.map(s => s.id);
      const allStudentIds = [...regularStudentIds, ...trialStudentIds, ...inactiveStudentIds];
      
      if (allStudentIds.length > 0) {
        // 查詢常規學生的課堂記錄
        let regularLessons: any[] = [];
        if (regularStudentIds.length > 0) {
          const { data, error } = await supabase
            .from('hanami_student_lesson')
            .select('student_id, lesson_date')
            .in('student_id', regularStudentIds)
            .in('lesson_date', selectedDates);

          if (error) {
            console.error('獲取常規學生課堂記錄失敗:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
          regularLessons = data || [];
        }

        // 查詢試堂學生的課堂記錄（試堂學生可能直接有 lesson_date 欄位）
        let trialLessons: any[] = [];
        if (trialStudentIds.length > 0) {
          const { data, error } = await supabase
            .from('hanami_trial_students')
            .select('id, lesson_date')
            .in('id', trialStudentIds)
            .in('lesson_date', selectedDates);

          if (error) {
            console.error('獲取試堂學生課堂記錄失敗:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
          trialLessons = data || [];
        }

        // 查詢停用學生的課堂記錄
        let inactiveLessons: any[] = [];
        if (inactiveStudentIds.length > 0) {
          const { data, error } = await supabase
            .from('inactive_student_list')
            .select('id, lesson_date')
            .in('id', inactiveStudentIds)
            .in('lesson_date', selectedDates);

          if (error) {
            console.error('獲取停用學生課堂記錄失敗:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
          inactiveLessons = data || [];
        }

        // 建立學生ID到課堂日期的映射
        const studentLessonMap = new Map<string, string[]>();
        
        // 處理常規學生課堂記錄
        regularLessons.forEach(lesson => {
          const existing = studentLessonMap.get(lesson.student_id) || [];
          if (!existing.includes(lesson.lesson_date)) {
            existing.push(lesson.lesson_date);
          }
          studentLessonMap.set(lesson.student_id, existing);
        });

        // 處理試堂學生課堂記錄
        trialLessons.forEach(lesson => {
          const existing = studentLessonMap.get(lesson.id) || [];
          if (!existing.includes(lesson.lesson_date)) {
            existing.push(lesson.lesson_date);
          }
          studentLessonMap.set(lesson.id, existing);
        });

        // 處理停用學生課堂記錄
        inactiveLessons.forEach(lesson => {
          const existing = studentLessonMap.get(lesson.id) || [];
          if (!existing.includes(lesson.lesson_date)) {
            existing.push(lesson.lesson_date);
          }
          studentLessonMap.set(lesson.id, existing);
        });

        // 篩選有符合日期課堂的學生
        const filteredStudents = allStudents.filter(student => {
          const studentLessons = studentLessonMap.get(student.id) || [];
          return selectedDates.some((date: string) => studentLessons.includes(date));
        });

        console.log('日期篩選後的學生數量:', filteredStudents.length);

        // 為學生添加課堂日期
        const studentsWithLessons = filteredStudents.map(student => ({
          ...student,
          lesson_dates: studentLessonMap.get(student.id) || []
        }));

        return NextResponse.json({
          success: true,
          students: studentsWithLessons,
          totalCount: studentsWithLessons.length
        });
      }
    }

    // 如果沒有日期篩選，直接返回學生資料
    return NextResponse.json({
      success: true,
      students: allStudents,
      totalCount: allStudents.length
    });

  } catch (error) {
    console.error('API錯誤:', error);
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
  }
} 
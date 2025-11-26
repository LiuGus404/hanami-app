import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { courseType, isTrial, startDate, endDate } = await request.json();

    if (!courseType) {
      return NextResponse.json({ 
        error: '缺少課程類型參數' 
      }, { status: 400 });
    }

    console.log('📅 日曆資料查詢:', { courseType, isTrial, startDate, endDate });
    console.log('🔍 查詢類型:', isTrial ? '試堂課程' : '常規課程');

    // 先查詢所有課程類型來調試
    const { data: allCourseTypes, error: allCourseTypesError } = await supabase
      .from('Hanami_CourseTypes')
      .select('id, name, trial_limit, max_students')
      .eq('status', true);
    
    console.log('🔍 資料庫中的所有課程類型:', allCourseTypes);
    console.log('🔍 查詢的課程類型:', courseType);

    // 獲取課程類型資訊
    const { data: courseTypeData, error: courseTypeError } = await supabase
      .from('Hanami_CourseTypes')
      .select('id, name, trial_limit, max_students')
      .eq('name', courseType)
      .single();

    if (courseTypeError || !courseTypeData) {
      const typedAllCourseTypes = (allCourseTypes || []) as Array<{ name: string; [key: string]: any }>;
      console.error('❌ 找不到課程類型:', courseTypeError);
      console.error('🔍 查詢的課程名稱:', courseType);
      console.error('🔍 資料庫中的課程名稱:', typedAllCourseTypes.map(c => c.name));
      return NextResponse.json({ 
        error: '找不到指定的課程類型' 
      }, { status: 404 });
    }

    const typedCourseTypeData = courseTypeData as {
      trial_limit?: number;
      max_students?: number;
      [key: string]: any;
    };
    const trialLimit = typedCourseTypeData.trial_limit || 1;
    const maxStudents = typedCourseTypeData.max_students || 6;

    console.log('📚 課程類型資訊:', { trialLimit, maxStudents });

    // 先檢查 hanami_schedule 表的所有資料
    const { data: allSchedules, error: allSchedulesError } = await supabase
      .from('hanami_schedule')
      .select('*')
      .limit(10);
    
    console.log('🔍 hanami_schedule 表的前10筆資料:', allSchedules);
    console.log('🔍 查詢的課程類型:', courseType);
    console.log('🔍 課程類型資料:', courseTypeData);
    
    // 檢查試堂相關的排程
    if (isTrial) {
      console.log('🔍 檢查所有試堂排程:');
      const { data: allTrialSchedules, error: allTrialError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('is_trial_open', true);
      console.log('🔍 所有試堂排程:', allTrialSchedules);
      
      // 檢查課程類型匹配的試堂排程
      const { data: courseTrialSchedules, error: courseTrialError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('course_type', courseType)
        .eq('is_trial_open', true);
      console.log('🔍 課程類型匹配的試堂排程:', courseTrialSchedules);
    } else {
      // 檢查常規課程相關的排程
      console.log('🔍 檢查所有常規課程排程:');
      const { data: allRegularSchedules, error: allRegularError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('is_registration_open', true);
      console.log('🔍 所有常規課程排程:', allRegularSchedules?.length || 0);
      
      // 檢查課程類型匹配的常規課程排程
      const { data: courseRegularSchedules, error: courseRegularError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('course_type', courseType)
        .eq('is_registration_open', true);
      console.log('🔍 課程類型匹配的常規課程排程:', courseRegularSchedules?.length || 0);
      if (courseRegularSchedules && courseRegularSchedules.length > 0) {
        console.log('🔍 常規課程排程範例:', courseRegularSchedules.slice(0, 3));
      }
    }

    // 簡化的排程資料查詢邏輯
    let scheduleData: any[] = [];
    let scheduleError: any = null;

    if (!isTrial) {
      // 常規課程：直接從 hanami_schedule 載入
      console.log('🔍 載入常規課程排程資料...');
      console.log('🔍 查詢條件:', {
        course_type: courseType,
        is_primary_schedule: true
      });
      
      const { data: regularScheduleData, error: regularScheduleError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('course_type', courseType)
        .eq('is_primary_schedule', true)
        .order('weekday', { ascending: true })
        .order('timeslot', { ascending: true });
      
      if (regularScheduleError) {
        console.error('❌ 載入常規課程排程失敗:', regularScheduleError);
        scheduleError = regularScheduleError;
      } else {
        scheduleData = regularScheduleData || [];
        console.log('✅ 常規課程排程載入成功:', scheduleData.length, '筆資料');
        if (scheduleData.length > 0) {
          console.log('🔍 常規課程排程範例:', scheduleData.slice(0, 3));
          console.log('🔍 常規課程 weekday 分佈:', scheduleData.map(s => s.weekday).sort());
          console.log('🔍 星期六排程數量:', scheduleData.filter(s => s.weekday === 6).length);
        }
      }
    } else {
      // 試堂課程：保持原有邏輯
      console.log('🔍 載入試堂課程排程資料...');
      
      const { data: trialScheduleData, error: trialScheduleError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('course_type', courseType)
        .eq('is_primary_schedule', true)
        .eq('is_trial_open', true)
        .order('weekday', { ascending: true })
        .order('timeslot', { ascending: true });
      
      if (trialScheduleError) {
        console.error('❌ 載入試堂課程排程失敗:', trialScheduleError);
        scheduleError = trialScheduleError;
      } else {
        scheduleData = trialScheduleData || [];
        console.log('✅ 試堂課程排程載入成功:', scheduleData.length, '筆資料');
        if (scheduleData.length > 0) {
          console.log('🔍 試堂課程排程範例:', scheduleData.slice(0, 3));
        }
      }
    }

    if (scheduleError) {
      console.error('❌ 獲取排程資料失敗:', scheduleError);
      return NextResponse.json({ 
        error: '獲取排程資料失敗' 
      }, { status: 500 });
    }

    console.log('📋 排程資料數量:', scheduleData?.length || 0);
    console.log('📋 排程資料詳情:', scheduleData);
    
    // 檢查是否有試堂相關的排程
    if (isTrial) {
      console.log('🔍 試堂模式 - 檢查 is_trial_open 排程:');
      const { data: trialSchedules, error: trialError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('is_trial_open', true)
        .limit(5);
      console.log('🔍 試堂排程:', trialSchedules);
    }

    // 簡化：常規課程不需要複雜的預約計算
    let bookedLessons: any[] = [];
    let trialBookings: any[] = [];
    
    if (isTrial) {
      // 試堂課程：獲取正式課程預約和試堂預約
      const { data: bookedLessonsData, error: bookedLessonsError } = await supabase
        .from('hanami_student_lesson')
        .select('lesson_date, actual_timeslot, regular_timeslot, course_type')
        .eq('course_type', courseType)
        .gte('lesson_date', startDate)
        .lte('lesson_date', endDate);

      if (bookedLessonsError) {
        console.error('❌ 獲取正式課程預約失敗:', bookedLessonsError);
        return NextResponse.json({ 
          error: '獲取正式課程預約失敗' 
        }, { status: 500 });
      }

      const { data: trialBookingsData, error: trialBookingsError } = await supabase
        .from('hanami_trial_students')
        .select('lesson_date, actual_timeslot, regular_timeslot, course_type')
        .eq('course_type', courseType)
        .gte('lesson_date', startDate)
        .lte('lesson_date', endDate);

      if (trialBookingsError) {
        console.error('❌ 獲取試堂預約失敗:', trialBookingsError);
        return NextResponse.json({ 
          error: '獲取試堂預約失敗' 
        }, { status: 500 });
      }

      bookedLessons = bookedLessonsData || [];
      trialBookings = trialBookingsData || [];
      
      console.log('📊 試堂預約統計:', {
        bookedLessons: bookedLessons.length,
        trialBookings: trialBookings.length
      });
    } else {
      // 常規課程：不需要預約資料，直接使用 hanami_schedule 的 assigned_student_ids
      console.log('📊 常規課程：使用 hanami_schedule 的 assigned_student_ids 計算位置');
    }

    // 處理日曆資料
    const calendarData = processCalendarData({
      scheduleData: scheduleData || [],
      bookedLessons: bookedLessons || [],
      trialBookings: trialBookings || [],
      trialLimit,
      maxStudents,
      isTrial,
      startDate,
      endDate
    });

    return NextResponse.json({
      success: true,
      data: calendarData,
      courseType: courseTypeData,
      stats: {
        totalSchedules: scheduleData?.length || 0,
        bookedLessons: bookedLessons?.length || 0,
        trialBookings: trialBookings?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ 日曆資料查詢錯誤:', error);
    return NextResponse.json({
      error: error.message || '日曆資料查詢時發生錯誤'
    }, { status: 500 });
  }
}

function processCalendarData({
  scheduleData,
  bookedLessons,
  trialBookings,
  trialLimit,
  maxStudents,
  isTrial,
  startDate,
  endDate
}: {
  scheduleData: any[];
  bookedLessons: any[];
  trialBookings: any[];
  trialLimit: number;
  maxStudents: number;
  isTrial: boolean;
  startDate: string;
  endDate: string;
}) {
  // 使用香港時區獲取今天的日期
  const now = new Date();
  const hkDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(now);
  const today = new Date(hkDateStr);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  console.log('🕐 API 中的今天日期 (香港時區):', hkDateStr);
  console.log('📅 今天是星期:', today.getDay(), '(0=日, 1=一, ..., 6=六)');
  
  const calendarDays = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const weekday = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
    const daysFromToday = Math.floor((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // 獲取該日期的排程
    // 注意：hanami_schedule 表中的 weekday 是字串格式，需要轉換為數字比較
    const daySchedules = scheduleData.filter(schedule => parseInt(schedule.weekday) === weekday);
    
    // 特別調試星期六的排程
    if (weekday === 6) {
      console.log(`🔍 星期六 (${dateStr}) 排程查詢:`, {
        totalSchedules: scheduleData.length,
        saturdaySchedules: daySchedules.length,
        allWeekdays: scheduleData.map(s => s.weekday).sort(),
        saturdayData: daySchedules
      });
    }
    
    if (daySchedules.length === 0) {
      // 沒有排程的日期
      calendarDays.push({
        date: dateStr,
        weekday,
        hasSchedule: false,
        isPast: isTrial ? daysFromToday < 0 : false, // 常規課程沒有過期概念
        isToday: daysFromToday === 0,
        isWithin30Days: daysFromToday >= 0 && daysFromToday <= 30,
        isWithin60Days: daysFromToday >= 0 && daysFromToday <= 60,
        isBeyond60Days: isTrial ? daysFromToday > 60 : false, // 常規課程沒有太遠概念
        timeSlots: []
      });
    } else {
      // 有排程的日期，計算可用性
      // console.log(`🕐 處理日期 ${dateStr} 的 ${daySchedules.length} 個排程`);
      const timeSlots = daySchedules.map(schedule => {
        const timeslot = schedule.timeslot;
        
        // 常規課程不需要複雜的預約計算
        let dayBookedLessons = [];
        let dayTrialBookings = [];
        
        if (isTrial) {
          // 試堂課程：獲取該時段的預約
          dayBookedLessons = bookedLessons.filter(lesson => 
            lesson.lesson_date === dateStr && 
            (lesson.actual_timeslot === timeslot || lesson.regular_timeslot === timeslot)
          );
          
          dayTrialBookings = trialBookings.filter(trial => 
            trial.lesson_date === dateStr && 
            (trial.actual_timeslot === timeslot || trial.regular_timeslot === timeslot)
          );
        }
        
        let remainingSpots = 0;
        let isAvailable = false;
        let status = 'unavailable';
        
        if (isTrial) {
          // 試堂邏輯
          if (daysFromToday > 60) {
            status = 'not_open';
          } else if (schedule.is_trial_open === false) {
            status = 'full';
            remainingSpots = 0;
          } else {
            if (daysFromToday <= 30) {
              // 30天內：使用實際預約計算
              const formalBookings = dayBookedLessons.length;
              const trialBookingsCount = dayTrialBookings.length;
              const availableTrialSpots = Math.max(0, trialLimit - trialBookingsCount);
              remainingSpots = maxStudents - formalBookings - availableTrialSpots;
            } else {
              // 30天後：使用 assigned_student_ids
              const assignedStudents = schedule.assigned_student_ids?.length || 0;
              const trialBookingsCount = dayTrialBookings.length;
              const availableTrialSpots = Math.max(0, trialLimit - trialBookingsCount);
              remainingSpots = maxStudents - assignedStudents - availableTrialSpots;
            }
            
            isAvailable = remainingSpots > 0;
            status = isAvailable ? 'available' : 'full';
          }
        } else {
          // 常規課程邏輯 - 簡化版本，直接使用 hanami_schedule 的資料
          if (schedule.is_registration_open === false) {
            status = 'full';
            remainingSpots = 0;
            isAvailable = false;
          } else {
            // 計算已分配的學生數量（從 assigned_student_ids）
            const assignedStudents = schedule.assigned_student_ids?.length || 0;
            const scheduleMaxStudents = schedule.max_students || maxStudents;
            // 剩餘位置 = 最大學生數 - 已分配學生數
            remainingSpots = Math.max(0, scheduleMaxStudents - assignedStudents);
            isAvailable = remainingSpots > 0;
            status = isAvailable ? 'available' : 'full';
          }
        }
        
        return {
          id: schedule.id,
          time: formatTimeSlot(timeslot, schedule.duration),
          timeslot,
          duration: schedule.duration,
          maxStudents: schedule.max_students || maxStudents,
          remainingSpots,
          isAvailable,
          status,
          assignedTeachers: schedule.assigned_teachers,
          isTrialOpen: schedule.is_trial_open,
          isRegistrationOpen: schedule.is_registration_open
        };
      });
      
      const availableSlots = timeSlots.filter(slot => slot.isAvailable).length;
      const totalSlots = timeSlots.length;
      
      // console.log(`✅ 日期 ${dateStr} 處理完成: ${totalSlots} 個時段, ${availableSlots} 個可用`);
      
      calendarDays.push({
        date: dateStr,
        weekday,
        hasSchedule: true,
        isPast: isTrial ? daysFromToday < 0 : false, // 常規課程沒有過期概念
        isToday: daysFromToday === 0,
        isWithin30Days: daysFromToday >= 0 && daysFromToday <= 30,
        isWithin60Days: daysFromToday >= 0 && daysFromToday <= 60,
        isBeyond60Days: isTrial ? daysFromToday > 60 : false, // 常規課程沒有太遠概念
        availableSlots,
        totalSlots,
        isFullyBooked: availableSlots === 0 && totalSlots > 0,
        timeSlots
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return calendarDays;
}

function formatTimeSlot(timeSlot: string, duration?: string) {
  if (!timeSlot) return '';
  
  const timeParts = timeSlot.split(':');
  const startHour = parseInt(timeParts[0]);
  const startMin = parseInt(timeParts[1]);
  
  let durationMinutes = 45; // 預設45分鐘
  if (duration) {
    const durationParts = duration.split(':');
    const durationHours = parseInt(durationParts[0]) || 0;
    const durationMins = parseInt(durationParts[1]) || 0;
    durationMinutes = durationHours * 60 + durationMins;
  }
  
  let endHour = startHour;
  let endMin = startMin + durationMinutes;
  
  if (endMin >= 60) {
    endHour += Math.floor(endMin / 60);
    endMin = endMin % 60;
  }
  
  const formatTime = (h: number, m: number) => {
    const displayHour = h.toString().padStart(2, '0');
    const displayMin = m.toString().padStart(2, '0');
    return `${displayHour}:${displayMin}`;
  };
  
  return `${formatTime(startHour, startMin)}-${formatTime(endHour, endMin)}`;
}

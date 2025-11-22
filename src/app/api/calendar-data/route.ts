import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { courseType, isTrial, startDate, endDate, orgId } = await request.json();

    if (!courseType) {
      return NextResponse.json({ 
        error: '缺少課程類型參數' 
      }, { status: 400 });
    }

    console.log('📅 日曆資料查詢:', { courseType, isTrial, startDate, endDate });

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
      console.error('❌ 找不到課程類型:', courseTypeError);
      console.error('🔍 查詢的課程名稱:', courseType);
      console.error('🔍 資料庫中的課程名稱:', allCourseTypes?.map(c => c.name));
      return NextResponse.json({ 
        error: '找不到指定的課程類型' 
      }, { status: 404 });
    }

    const trialLimit = courseTypeData.trial_limit || 1;
    const maxStudents = courseTypeData.max_students || 6;

    console.log('📚 課程類型資訊:', { trialLimit, maxStudents });

    // 獲取排程資料
    let scheduleQuery = supabase
      .from('hanami_schedule')
      .select('*')
      .eq('course_type', courseType)
      .eq('is_primary_schedule', true);
    
    // 如果有 org_id，根據 org_id 過濾
    if (orgId) {
      scheduleQuery = scheduleQuery.eq('org_id', orgId);
    }
    
    const { data: scheduleData, error: scheduleError } = await scheduleQuery
      .order('weekday', { ascending: true })
      .order('timeslot', { ascending: true });

    if (scheduleError) {
      console.error('❌ 獲取排程資料失敗:', scheduleError);
      return NextResponse.json({ 
        error: '獲取排程資料失敗' 
      }, { status: 500 });
    }

    console.log('📋 排程資料數量:', scheduleData?.length || 0);

    // 獲取已預約的正式課程
    const { data: bookedLessons, error: bookedLessonsError } = await supabase
      .from('hanami_student_lesson')
      .select('lesson_date, actual_timeslot, regular_timeslot, course_type')
      .eq('course_type', courseType)
      .gte('lesson_date', startDate)
      .lte('lesson_date', endDate);

    if (bookedLessonsError) {
      console.error('❌ 獲取已預約課程失敗:', bookedLessonsError);
      return NextResponse.json({ 
        error: '獲取已預約課程失敗' 
      }, { status: 500 });
    }

    // 獲取試堂預約
    const { data: trialBookings, error: trialBookingsError } = await supabase
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

    console.log('📊 預約統計:', {
      bookedLessons: bookedLessons?.length || 0,
      trialBookings: trialBookings?.length || 0
    });

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
  
  const calendarDays = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const weekday = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
    const daysFromToday = Math.floor((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // 獲取該日期的排程
    const daySchedules = scheduleData.filter(schedule => schedule.weekday === weekday);
    
    if (daySchedules.length === 0) {
      // 沒有排程的日期
      calendarDays.push({
        date: dateStr,
        weekday,
        hasSchedule: false,
        isPast: daysFromToday < 0,
        isToday: daysFromToday === 0,
        isWithin30Days: daysFromToday >= 0 && daysFromToday <= 30,
        isWithin60Days: daysFromToday >= 0 && daysFromToday <= 60,
        isBeyond60Days: daysFromToday > 60,
        timeSlots: []
      });
    } else {
      // 有排程的日期，計算可用性
      const timeSlots = daySchedules.map(schedule => {
        const timeslot = schedule.timeslot;
        
        // 獲取該時段的預約
        const dayBookedLessons = bookedLessons.filter(lesson => 
          lesson.lesson_date === dateStr && 
          (lesson.actual_timeslot === timeslot || lesson.regular_timeslot === timeslot)
        );
        
        const dayTrialBookings = trialBookings.filter(trial => 
          trial.lesson_date === dateStr && 
          (trial.actual_timeslot === timeslot || trial.regular_timeslot === timeslot)
        );
        
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
          // 常規課程邏輯
          if (schedule.is_registration_open === false) {
            status = 'full';
            remainingSpots = 0;
          } else {
            const assignedStudents = schedule.assigned_student_ids?.length || 0;
            remainingSpots = maxStudents - assignedStudents;
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
      
      calendarDays.push({
        date: dateStr,
        weekday,
        hasSchedule: true,
        isPast: daysFromToday < 0,
        isToday: daysFromToday === 0,
        isWithin30Days: daysFromToday >= 0 && daysFromToday <= 30,
        isWithin60Days: daysFromToday >= 0 && daysFromToday <= 60,
        isBeyond60Days: daysFromToday > 60,
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
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { courseType, startDate, endDate } = await request.json();

    if (!courseType) {
      return NextResponse.json({ 
        error: '缺少課程類型參數' 
      }, { status: 400 });
    }

    console.log('🚀 常規課程日曆 API 被調用:', { courseType, startDate, endDate });

    // 獲取課程類型資訊
    const { data: courseTypeData, error: courseTypeError } = await supabase
      .from('Hanami_CourseTypes')
      .select('id, name, trial_limit, max_students')
      .eq('name', courseType)
      .single();

    if (courseTypeError || !courseTypeData) {
      console.error('❌ 找不到課程類型:', courseTypeError);
      return NextResponse.json({ 
        error: '找不到指定的課程類型' 
      }, { status: 404 });
    }

    const maxStudents = courseTypeData.max_students || 6;
    console.log('📚 課程類型資訊:', { maxStudents });

    // 獲取常規課程排程資料
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('hanami_schedule')
      .select('*')
      .eq('course_type', courseType)
      .eq('is_primary_schedule', true)
      // 移除 is_registration_open 的篩選，因為我們需要在 API 中檢查這個狀態
      .neq('weekday', 1) // 排除星期一（休息日）
      .order('weekday', { ascending: true })
      .order('timeslot', { ascending: true });

    if (scheduleError) {
      console.error('❌ 獲取排程資料失敗:', scheduleError);
      return NextResponse.json({ 
        error: '獲取排程資料失敗' 
      }, { status: 500 });
    }

    console.log('📋 常規課程排程資料數量:', scheduleData?.length || 0);
    if (scheduleData && scheduleData.length > 0) {
      console.log('📋 排程資料範例:', scheduleData.slice(0, 3));
      console.log('📋 weekday 分佈:', scheduleData.map(s => s.weekday).sort());
      
      // 特別檢查星期日的排程
      const sundaySchedules = scheduleData.filter(s => s.weekday === 0);
      console.log('📋 星期日排程數量:', sundaySchedules.length);
      if (sundaySchedules.length > 0) {
        console.log('📋 星期日排程詳情:', sundaySchedules);
        // 特別檢查 12:45 時段
        const slot1245 = sundaySchedules.find(s => s.timeslot === '12:45:00');
        if (slot1245) {
          console.log('🔍 找到星期日 12:45 時段:', slot1245);
        } else {
          console.log('❌ 沒有找到星期日 12:45 時段');
        }
        console.log('📋 星期日排程詳情:', sundaySchedules.map(s => ({
          id: s.id,
          timeslot: s.timeslot,
          max_students: s.max_students,
          assigned_count: s.assigned_student_ids?.length || 0,
          is_registration_open: s.is_registration_open,
          course_type: s.course_type
        })));
      }
    }

    // 處理周曆資料 - 直接返回星期幾的排程，不依賴具體日期
    const weekCalendarData = processWeekCalendarData({
      scheduleData: scheduleData || [],
      maxStudents
    });

    return NextResponse.json({
      success: true,
      data: weekCalendarData,
      courseType: courseTypeData,
      stats: {
        totalSchedules: scheduleData?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ 常規課程日曆查詢錯誤:', error);
    return NextResponse.json({
      error: error.message || '常規課程日曆查詢時發生錯誤'
    }, { status: 500 });
  }
}

function processWeekCalendarData({
  scheduleData,
  maxStudents
}: {
  scheduleData: any[];
  maxStudents: number;
}) {
  console.log('📅 處理常規課程周曆資料 - 星期幾排程模式');
  
  const weekDays = [];
  
  // 為每個星期幾（0-6）生成資料
  for (let weekday = 0; weekday <= 6; weekday++) {
    const daySchedules = scheduleData.filter(schedule => {
      const scheduleWeekday = typeof schedule.weekday === 'string' ? parseInt(schedule.weekday) : schedule.weekday;
      return scheduleWeekday === weekday;
    });
    
    console.log(`📅 星期${weekday} 排程數量:`, daySchedules.length);
    
    if (daySchedules.length === 0) {
      // 沒有排程的星期幾
      weekDays.push({
        weekday,
        hasSchedule: false,
        availableSlots: 0,
        totalSlots: 0,
        isFullyBooked: false,
        timeSlots: [],
        // 添加星期幾的中文名稱
        weekdayName: getWeekdayName(weekday)
      });
    } else {
      // 有排程的星期幾，計算可用性
      const timeSlots = daySchedules.map(schedule => {
        const timeslot = schedule.timeslot;
        
        // 常規課程邏輯 - 基於 hanami_schedule 計算位置
        let remainingSpots = 0;
        let isAvailable = false;
        let status = 'unavailable';
        
        // 檢查 is_registration_open
        if (schedule.is_registration_open === false) {
          status = 'full';
          remainingSpots = 0;
          isAvailable = false;
          console.log(`❌ 星期${weekday} 時段 ${timeslot} 註冊已關閉`);
        } else {
          // 使用 hanami_schedule 的資料計算位置
          // 處理 assigned_student_ids 可能是字符串或陣列的情況
          let assignedStudents = 0;
          if (schedule.assigned_student_ids) {
            if (Array.isArray(schedule.assigned_student_ids)) {
              assignedStudents = schedule.assigned_student_ids.length;
            } else if (typeof schedule.assigned_student_ids === 'string') {
              try {
                const parsed = JSON.parse(schedule.assigned_student_ids);
                assignedStudents = Array.isArray(parsed) ? parsed.length : 0;
              } catch (e) {
                console.error('解析 assigned_student_ids 失敗:', e);
                assignedStudents = 0;
              }
            }
          }
          const scheduleMaxStudents = schedule.max_students || maxStudents;
          
          // 計算剩餘位置：max_students - assigned_student_ids.length
          remainingSpots = Math.max(0, scheduleMaxStudents - assignedStudents);
          isAvailable = remainingSpots > 0;
          
          // 特別檢查 12:45 時段
          if (timeslot === '12:45:00' && weekday === 0) {
            console.log('🔍 星期日 12:45 時段詳細資訊:', {
              scheduleId: schedule.id,
              courseType: schedule.course_type,
              timeslot: schedule.timeslot,
              maxStudents: schedule.max_students,
              assignedStudentIds: schedule.assigned_student_ids,
              assignedCount: assignedStudents,
              remainingSpots,
              isAvailable,
              status,
              isRegistrationOpen: schedule.is_registration_open,
              isPrimarySchedule: schedule.is_primary_schedule
            });
          }
          status = isAvailable ? 'available' : 'full';
          
          console.log(`✅ 星期${weekday} 時段 ${timeslot} 位置計算:`, {
            scheduleId: schedule.id,
            courseType: schedule.course_type,
            maxStudents: scheduleMaxStudents,
            assignedStudentIds: schedule.assigned_student_ids,
            assignedStudents,
            remainingSpots,
            isAvailable,
            status,
            isRegistrationOpen: schedule.is_registration_open
          });
        }
        
        const timeSlotData = {
          id: schedule.id,
          time: formatTimeSlot(timeslot, schedule.duration),
          timeslot,
          duration: schedule.duration,
          maxStudents: schedule.max_students || maxStudents,
          remainingSpots,
          isAvailable,
          status,
          assignedTeachers: schedule.assigned_teachers,
          isRegistrationOpen: schedule.is_registration_open,
          assignedStudentIds: schedule.assigned_student_ids
        };
        
        // 特別檢查 12:45 時段
        if (timeslot === '12:45:00' && weekday === 0) {
          console.log('🔍 星期日 12:45 時段詳細資訊:', {
            scheduleId: schedule.id,
            courseType: schedule.course_type,
            timeslot: schedule.timeslot,
            maxStudents: schedule.max_students,
            assignedStudentIds: schedule.assigned_student_ids,
            assignedCount: schedule.assigned_student_ids?.length || 0,
            remainingSpots,
            isAvailable,
            status,
            isRegistrationOpen: schedule.is_registration_open,
            isPrimarySchedule: schedule.is_primary_schedule,
            timeSlotData
          });
        }
        
        return timeSlotData;
      });
      
      const availableSlots = timeSlots.filter(slot => slot.isAvailable).length;
      const totalSlots = timeSlots.length;
      
      console.log(`✅ 星期${weekday} 處理完成: ${totalSlots} 個時段, ${availableSlots} 個可用`);
      
      weekDays.push({
        weekday,
        hasSchedule: true,
        availableSlots,
        totalSlots,
        isFullyBooked: availableSlots === 0 && totalSlots > 0,
        timeSlots,
        // 添加星期幾的中文名稱
        weekdayName: getWeekdayName(weekday)
      });
    }
  }
  
  return weekDays;
}

// 獲取星期幾的中文名稱
function getWeekdayName(weekday: number): string {
  const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
  return weekdayNames[weekday] || '';
}

function formatTimeSlot(timeSlot: string, duration?: string) {
  if (!timeSlot) return '';
  
  // 處理 time without time zone 格式 (HH:MM:SS)
  const timeParts = timeSlot.split(':');
  const startHour = parseInt(timeParts[0]);
  const startMin = parseInt(timeParts[1]);
  
  // 根據課程時長計算結束時間
  let durationMinutes = 45; // 預設45分鐘
  if (duration) {
    const durationParts = duration.split(':');
    const durationHours = parseInt(durationParts[0]) || 0;
    const durationMins = parseInt(durationParts[1]) || 0;
    durationMinutes = durationHours * 60 + durationMins;
  }
  
  // 計算結束時間
  const endTime = new Date();
  endTime.setHours(startHour, startMin + durationMinutes, 0, 0);
  const endHour = endTime.getHours();
  const endMin = endTime.getMinutes();
  
  const formatTime = (hour: number, min: number) => {
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };
  
  return `${formatTime(startHour, startMin)}-${formatTime(endHour, endMin)}`;
}

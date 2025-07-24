'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';

interface AvailableTimeSlot {
  weekday: number
  weekdayName: string
  timeslot: string
  course_type: string | null
  course_name: string | null
  max_students: number
  current_students: number
  available_slots: number
}

interface CourseType {
  id: string
  name: string | null
  status: boolean | null
}

interface CopyAvailableTimesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CopyAvailableTimesModal({ isOpen, onClose }: CopyAvailableTimesModalProps) {
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTimes, setShowTimes] = useState(false);
  const [showTrialDates, setShowTrialDates] = useState(false);

  const weekdays = [
    { value: 0, name: '星期日', icon: '/icons/bear-face.PNG' },
    { value: 1, name: '星期一', icon: '/icons/elephant.PNG' },
    { value: 2, name: '星期二', icon: '/icons/penguin-face.PNG' },
    { value: 3, name: '星期三', icon: '/icons/book-elephant.PNG' },
    { value: 4, name: '星期四', icon: '/icons/music.PNG' },
    { value: 5, name: '星期五', icon: '/icons/owlui.png' },
    { value: 6, name: '星期六', icon: '/icons/bunnysmall-v2.PNG' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCourseTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && courseTypes.length > 0) {
      fetchAvailableSlots();
    }
  }, [isOpen, courseTypes]);

  const fetchCourseTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .select('*')
        .eq('status', true)
        .order('name');

      if (error) {
        console.error('載入課程類型失敗:', error);
        return;
      }

      setCourseTypes(data || []);
    } catch (err) {
      console.error('載入課程類型時發生錯誤:', err);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. 獲取所有課程時段設定
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .order('weekday', { ascending: true })
        .order('timeslot', { ascending: true });

      if (scheduleError) {
        setError(`無法載入課程時段設定：${scheduleError.message}`);
        return;
      }

      // 2. 獲取所有常規學生
      const { data: regularData, error: regularError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_age, regular_weekday, regular_timeslot, student_type, course_type')
        .in('student_type', ['常規', '試堂'])
        .not('regular_weekday', 'is', null)
        .not('regular_timeslot', 'is', null);

      if (regularError) {
        setError(`無法載入常規學生：${regularError.message}`);
        return;
      }

      // 3. 計算每個時段的學生數量
      const studentCountMap: { [key: string]: number } = {};
      
      // 調試信息：檢查學生資料
      console.log('模態框學生資料總數：', regularData?.length || 0);
      
      for (const student of regularData || []) {
        if (!student.regular_timeslot || student.regular_weekday === null || student.regular_weekday === undefined) continue;
        
        let weekdayNum: number;
        if (typeof student.regular_weekday === 'string') {
          weekdayNum = parseInt(student.regular_weekday);
          if (isNaN(weekdayNum)) continue;
        } else {
          weekdayNum = student.regular_weekday;
        }
        
        const studentCourseName = student.course_type || '';
        
        // 為每個課程類型建立key，支援課程名稱和課程ID兩種格式
        const courseKeys = [];
        
        // 方法1：使用課程名稱建立key
        courseKeys.push(`${weekdayNum}_${student.regular_timeslot}_${studentCourseName}`);
        
        // 方法2：使用課程ID建立key（如果courseTypes中有對應的ID）
        for (const courseType of courseTypes) {
          if (courseType.name === studentCourseName) {
            courseKeys.push(`${weekdayNum}_${student.regular_timeslot}_${courseType.id}`);
            break;
          }
        }
        
        // 為每個可能的key增加學生數量
        for (const key of courseKeys) {
          if (!studentCountMap[key]) {
            studentCountMap[key] = 0;
          }
          studentCountMap[key]++;
        }
        
        // 調試信息：檢查學生分配
        console.log(`模態框學生分配 - 學生: ${student.full_name}, 時段: ${student.regular_timeslot}, 星期: ${weekdayNum}, 課程: ${studentCourseName}`);
        console.log(`  建立的keys: ${courseKeys.join(', ')}`);
      }
      
      // 調試信息：檢查學生數量映射表
      console.log('模態框學生數量映射表：', studentCountMap);

      // 4. 生成有位時間列表
      const availableSlotsList: AvailableTimeSlot[] = [];
      
      // 調試信息：檢查課程類型資料
      console.log('模態框課程類型資料：', courseTypes);
      
      for (const schedule of scheduleData || []) {
        const courseType = schedule.course_type || '';
        const key = `${schedule.weekday}_${schedule.timeslot}_${courseType}`;
        const currentStudents = studentCountMap[key] || 0;
        const availableSlots = Math.max(0, schedule.max_students - currentStudents);
        
        // 調試信息：檢查每個時段的學生數量
        console.log(`模態框時段檢查 - 時段: ${schedule.timeslot}, 星期: ${schedule.weekday}, 課程: ${courseType}`);
        console.log(`  Key: ${key}`);
        console.log(`  最大人數: ${schedule.max_students}`);
        console.log(`  目前人數: ${currentStudents}`);
        console.log(`  剩餘名額: ${availableSlots}`);
        
        if (availableSlots > 0) {
          // 獲取課程名稱 - 使用 courseTypes 狀態中的資料
          const courseName = courseTypes.find(c => c.id === courseType)?.name || courseType;
          
          // 調試信息：檢查課程名稱映射
          console.log(`模態框課程ID: ${courseType}, 課程名稱: ${courseName}`);
          console.log('模態框課程類型資料:', courseTypes);
          console.log(`模態框課程ID類型: ${typeof courseType}, 值: ${courseType}`);
          console.log(`模態框映射結果: ${courseName}`);
          
          availableSlotsList.push({
            weekday: schedule.weekday,
            weekdayName: weekdays.find(w => w.value === schedule.weekday)?.name || '',
            timeslot: schedule.timeslot,
            course_type: schedule.course_type,
            course_name: courseName,
            max_students: schedule.max_students,
            current_students: currentStudents,
            available_slots: availableSlots,
          });
        }
      }

      setAvailableSlots(availableSlotsList);
    } catch (err) {
      setError(`載入資料時發生錯誤：${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWeekdayToggle = (weekday: number) => {
    setSelectedWeekdays(prev => {
      const newSelectedWeekdays = prev.includes(weekday) 
        ? prev.filter(w => w !== weekday)
        : [...prev, weekday];
      
      // 根據選中的星期自動選擇對應的有位時間
      const newSelectedSlots: string[] = [];
      
      availableSlots.forEach(slot => {
        const slotKey = `${slot.weekday}_${slot.timeslot}_${slot.course_type || 'default'}`;
        
        // 如果該時段屬於選中的星期，則自動選中
        if (newSelectedWeekdays.includes(slot.weekday)) {
          newSelectedSlots.push(slotKey);
        }
      });
      
      setSelectedSlots(newSelectedSlots);
      return newSelectedWeekdays;
    });
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => {
      const newSelectedCourses = prev.includes(courseId) 
        ? prev.filter(c => c !== courseId)
        : [...prev, courseId];
      
      // 根據選中的課程和星期自動選擇對應的有位時間
      const newSelectedSlots: string[] = [];
      
      availableSlots.forEach(slot => {
        const slotKey = `${slot.weekday}_${slot.timeslot}_${slot.course_type || 'default'}`;
        
        // 如果該時段屬於選中的課程，則自動選中
        if (newSelectedCourses.includes(slot.course_type || '')) {
          // 如果同時選中了星期，必須也符合星期條件
          if (selectedWeekdays.length === 0 || selectedWeekdays.includes(slot.weekday)) {
            newSelectedSlots.push(slotKey);
          }
        }
      });
      
      setSelectedSlots(newSelectedSlots);
      return newSelectedCourses;
    });
  };

  const handleTimeSlotToggle = (timeSlot: string) => {
    setSelectedTimeSlots(prev => 
      prev.includes(timeSlot) 
        ? prev.filter(t => t !== timeSlot)
        : [...prev, timeSlot],
    );
  };

  const handleSlotToggle = (slot: AvailableTimeSlot) => {
    // 創建一個唯一的識別符，包含星期、時間和課程類型
    const slotKey = `${slot.weekday}_${slot.timeslot}_${slot.course_type || 'default'}`;
    
    // 切換這個特定組合的選中狀態
    setSelectedSlots(prev => 
      prev.includes(slotKey) 
        ? prev.filter(key => key !== slotKey)
        : [...prev, slotKey],
    );
  };

  const isSlotSelected = (slot: AvailableTimeSlot) => {
    const slotKey = `${slot.weekday}_${slot.timeslot}_${slot.course_type || 'default'}`;
    return selectedSlots.includes(slotKey);
  };

  const handleSelectAll = () => {
    // 根據當前顯示的時段進行全選
    const visibleSlots = availableSlots.filter(slot => {
      // 如果沒有選中任何星期或課程，顯示全部
      if (selectedWeekdays.length === 0 && selectedCourses.length === 0) {
        return true;
      }
      
      // 如果有選中星期，必須匹配星期
      const matchesWeekday = selectedWeekdays.length === 0 || selectedWeekdays.includes(slot.weekday);
      
      // 如果有選中課程，必須匹配課程
      const matchesCourse = selectedCourses.length === 0 || selectedCourses.includes(slot.course_type || '');
      
      return matchesWeekday && matchesCourse;
    });
    
    const allSlotKeys = visibleSlots.map(slot => 
      `${slot.weekday}_${slot.timeslot}_${slot.course_type || 'default'}`,
    );
    setSelectedSlots(allSlotKeys);
  };

  const handleClearAll = () => {
    setSelectedSlots([]);
    setSelectedWeekdays([]);
    setSelectedCourses([]);
    setShowTrialDates(false);
  };

  // 固定香港時區的 Date 產生器
  const getHongKongDate = (date = new Date()) => {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (8 * 3600000)); // 香港是 UTC+8
  };

  // 計算未來2個最快可試堂的日期
  const getNextTrialDates = (weekday: number, count = 2): string[] => {
    const today = getHongKongDate();
    const currentWeekday = today.getDay();
    const dates: string[] = [];
    
    // 計算到下一個該星期的天數
    let daysToAdd = weekday - currentWeekday;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // 如果今天就是該星期或已經過了，加7天到下週
    }
    
    // 生成未來2個該星期的日期
    for (let i = 0; i < count; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysToAdd + (i * 7));
      
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextDate.getDate()).padStart(2, '0');
      
      dates.push(`${year}-${month}-${day}`);
    }
    
    return dates;
  };

  const getVisibleSelectedSlots = () => {
    // 只取目前顯示（符合星期和課程條件）的已選時段
    return availableSlots.filter(slot => {
      // 過濾條件
      if (selectedWeekdays.length > 0 && !selectedWeekdays.includes(slot.weekday)) return false;
      if (selectedCourses.length > 0 && !selectedCourses.includes(slot.course_type || '')) return false;
      // 必須已選中
      const slotKey = `${slot.weekday}_${slot.timeslot}_${slot.course_type || 'default'}`;
      return selectedSlots.includes(slotKey);
    });
  };

  const copyToClipboard = () => {
    const selectedSlotData = getVisibleSelectedSlots();
    if (selectedSlotData.length === 0) {
      alert('請選擇要複製的項目');
      return;
    }

    // 按課程分組
    const groupedByCourse: { [courseName: string]: { [weekday: string]: Array<{ timeslot: string, available_slots: number, weekday: number }> } } = {};
    
    selectedSlotData.forEach(slot => {
      const courseName = slot.course_name || '未指定課程';
      const weekdayName = slot.weekdayName;
      
      if (!groupedByCourse[courseName]) {
        groupedByCourse[courseName] = {};
      }
      
      if (!groupedByCourse[courseName][weekdayName]) {
        groupedByCourse[courseName][weekdayName] = [];
      }
      
      groupedByCourse[courseName][weekdayName].push({
        timeslot: slot.timeslot,
        available_slots: slot.available_slots,
        weekday: slot.weekday,
      });
    });

    // 生成美觀的文本格式
    let textContent = '📚 有位時間列表\n\n';
    
    // 添加開頭文字
    const courseNames = Object.keys(groupedByCourse);
    if (courseNames.length > 0) {
      textContent += `暫時${courseNames.join('、')}班時間都比較full，暫時以下時間仲有少量位🥰：\n\n`;
    }
    
    Object.entries(groupedByCourse).forEach(([courseName, weekdays], courseIndex) => {
      textContent += `🥳 課程：${courseName}\n`;
      
      Object.entries(weekdays).forEach(([weekdayName, timeSlots], weekdayIndex) => {
        textContent += `  📅 星期：${weekdayName}\n`;
        
        timeSlots.forEach((timeSlot, timeIndex) => {
          textContent += `    ⏰ 時間：${timeSlot.timeslot} (剩餘 ${timeSlot.available_slots} 位)`;
          
          // 如果啟用試堂日期顯示，添加試堂日期
          if (showTrialDates) {
            const trialDates = getNextTrialDates(timeSlot.weekday);
            textContent += `\n      🗓️ 試堂日期：${trialDates.join('、')}`;
          }
          
          textContent += '\n';
        });
        
        if (weekdayIndex < Object.keys(weekdays).length - 1) {
          textContent += '\n';
        }
      });
      
      if (courseIndex < Object.keys(groupedByCourse).length - 1) {
        textContent += '\n';
      }
    });
    
    // 添加結尾文字
    textContent += '\n可以睇下邊段時間方便試堂🤤';

    navigator.clipboard.writeText(textContent).then(() => {
      alert('已複製到剪貼簿');
    }).catch(() => {
      alert('複製失敗，請手動複製');
    });
  };

  const exportToCSV = () => {
    const selectedSlotData = getVisibleSelectedSlots();
    if (selectedSlotData.length === 0) {
      alert('請選擇要匯出的項目');
      return;
    }

    // 按課程分組
    const groupedByCourse: { [courseName: string]: { [weekday: string]: Array<{ timeslot: string, available_slots: number, max_students: number, current_students: number, weekday: number }> } } = {};
    
    selectedSlotData.forEach(slot => {
      const courseName = slot.course_name || '未指定課程';
      const weekdayName = slot.weekdayName;
      
      if (!groupedByCourse[courseName]) {
        groupedByCourse[courseName] = {};
      }
      
      if (!groupedByCourse[courseName][weekdayName]) {
        groupedByCourse[courseName][weekdayName] = [];
      }
      
      groupedByCourse[courseName][weekdayName].push({
        timeslot: slot.timeslot,
        available_slots: slot.available_slots,
        max_students: slot.max_students,
        current_students: slot.current_students,
        weekday: slot.weekday,
      });
    });

    // 生成CSV內容
    const csvRows = [
      showTrialDates 
        ? ['課程', '星期', '時間', '最大人數', '目前人數', '剩餘名額', '試堂日期']
        : ['課程', '星期', '時間', '最大人數', '目前人數', '剩餘名額'],
    ];
    
    Object.entries(groupedByCourse).forEach(([courseName, weekdays]) => {
      Object.entries(weekdays).forEach(([weekdayName, timeSlots]) => {
        timeSlots.forEach(timeSlot => {
          const row = [
            courseName,
            weekdayName,
            timeSlot.timeslot,
            timeSlot.max_students.toString(),
            timeSlot.current_students.toString(),
            timeSlot.available_slots.toString(),
          ];
          
          // 如果啟用試堂日期顯示，添加試堂日期
          if (showTrialDates) {
            const trialDates = getNextTrialDates(timeSlot.weekday);
            row.push(trialDates.join('、'));
          }
          
          csvRows.push(row);
        });
      });
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
          const today = getHongKongDate();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      link.setAttribute('download', `有位時間_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 禁止背景滾動
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 透明背景覆蓋層 */}
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />
      {/* 模態框內容可滾動 */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#EADBC8]">
        {/* 標題欄 */}
        <div className="bg-gradient-to-r from-[#FFF9F2] to-[#F3EFE3] px-6 py-4 border-b border-[#EADBC8]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                alt="時間"
                className="animate-pulse"
                height={24}
                src="/icons/clock.PNG"
                width={24}
              />
              <h2 className="text-lg font-semibold text-[#4B4036]">複製有位時間</h2>
            </div>
            <button
              className="p-2 hover:bg-[#EADBC8] rounded-full transition-all duration-200 hover:scale-110"
              onClick={onClose}
            >
              <Image
                alt="關閉"
                height={20}
                src="/close.png"
                width={20}
              />
            </button>
          </div>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 animate-pulse">
              {error}
            </div>
          )}

          {/* 全選/清除按鈕 */}
          <div className="flex gap-2">
            <button
              className="flex-1 hanami-btn-cute text-sm py-2 flex items-center justify-center gap-2"
              onClick={handleSelectAll}
            >
              <Image alt="全選" height={16} src="/icons/leaf-sprout.png" width={16} />
              全選
            </button>
            <button
              className="flex-1 hanami-btn-soft text-sm py-2 flex items-center justify-center gap-2"
              onClick={handleClearAll}
            >
              <Image alt="清除" height={16} src="/icons/close.png" width={16} />
              清除
            </button>
          </div>

          {/* 顯示試堂日期切換 */}
          <div>
            <h4 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center gap-2">
              <Image alt="試堂日期" height={20} src="/icons/calendar.png" width={20} />
              試堂日期設定
            </h4>
            <div className="flex items-center justify-center">
              <button
                className={`group relative flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-98 overflow-hidden ${
                  showTrialDates
                    ? 'bg-gradient-to-r from-[#E0F2E0] to-[#D4F2D4] border-[#C8EAC8] shadow-md'
                    : 'bg-white border-[#EADBC8] hover:border-[#C8EAC8] hover:shadow-sm'
                }`}
                onClick={() => setShowTrialDates(v => !v)}
              >
                {/* 懸停波紋效果 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-pulse transition-opacity duration-300" />
                
                <Image 
                  alt="試堂日期" 
                  className={`transition-all duration-300 ${showTrialDates ? 'animate-pulse' : 'group-hover:scale-110 group-hover:rotate-12'}`} 
                  height={20} 
                  src="/icons/calendar.png"
                  width={20}
                />
                <span className="font-medium text-[#4B4036] relative z-10">
                  {showTrialDates ? '已啟用試堂日期' : '顯示試堂日期'}
                </span>
                {showTrialDates && (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse relative z-10">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                {/* 動態邊框效果 */}
                {showTrialDates && (
                  <div className="absolute inset-0 rounded-xl border-2 border-green-400 animate-ping opacity-20" />
                )}
              </button>
            </div>
            {/* 狀態說明 */}
            <div className="text-center mt-2">
              <p className="text-sm text-[#87704e]">
                {showTrialDates 
                  ? '複製時將包含每個時段未來2個最快可試堂的日期' 
                  : '點擊啟用後，複製內容將包含試堂日期'
                }
              </p>
            </div>
          </div>

          {/* 星期選擇 */}
          <div>
            <h4 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center gap-2">
              <Image alt="星期" height={20} src="/calendar.png" width={20} />
              選擇星期
            </h4>
            <div className="grid grid-cols-7 gap-2">
              {weekdays.map(weekday => (
                <button
                  key={weekday.value}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    selectedWeekdays.includes(weekday.value)
                      ? 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] border-[#EAC29D] shadow-lg animate-bounce-subtle'
                      : 'bg-white border-[#EADBC8] hover:border-[#EAC29D] hover:shadow-md'
                  }`}
                  onClick={() => handleWeekdayToggle(weekday.value)}
                >
                  <Image 
                    alt={weekday.name} 
                    className={`transition-all duration-300 ${
                      selectedWeekdays.includes(weekday.value) ? 'animate-pulse' : ''
                    }`} 
                    height={24} 
                    src={weekday.icon}
                    width={24}
                  />
                  <div className="text-xs mt-1 font-medium text-[#4B4036]">
                    {weekday.name.slice(-1)}
                  </div>
                  {selectedWeekdays.includes(weekday.value) && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 課程選擇 */}
          {courseTypes.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center gap-2">
                <Image alt="課程" height={20} src="/icons/music.PNG" width={20} />
                選擇課程
              </h4>
              <div className="space-y-2">
                {courseTypes.map(course => (
                  <button
                    key={course.id}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-98 ${
                      selectedCourses.includes(course.id)
                        ? 'bg-gradient-to-r from-[#E0F2E0] to-[#D4F2D4] border-[#C8EAC8] shadow-md'
                        : 'bg-white border-[#EADBC8] hover:border-[#C8EAC8]'
                    }`}
                    onClick={() => handleCourseToggle(course.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#4B4036]">{course.name}</span>
                      {selectedCourses.includes(course.id) && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 時間選擇展開/收起按鈕 */}
          <div className="px-6 pt-4">
            <button
              aria-expanded={showTimes}
              className="flex items-center gap-2 text-[#4B4036] font-semibold py-2 px-4 rounded-full border border-[#EADBC8] bg-[#FFFDF8] shadow-sm transition-all duration-200 hover:bg-[#F3EFE3] focus:outline-none focus:ring-2 focus:ring-[#EADBC8] w-full justify-between"
              onClick={() => setShowTimes(v => !v)}
            >
              <span>選擇時間</span>
              <div className={`w-4 h-4 border-r-2 border-b-2 border-[#4B4036] transform transition-transform duration-300 ${showTimes ? 'rotate-45' : '-rotate-45'}`} />
            </button>
            <div
              className={`transition-all duration-300 overflow-hidden ${showTimes ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              {/* 這裡放原本的時間選擇區塊內容 */}
              <div>
                <h4 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center gap-2">
                  <Image alt="時間" height={20} src="/icons/clock.PNG" width={20} />
                  選擇時間
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[...new Set(availableSlots.map(s => s.timeslot))].map(timeSlot => (
                    <button
                      key={timeSlot}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-98 ${
                        selectedTimeSlots.includes(timeSlot)
                          ? 'bg-gradient-to-r from-[#BFE3FF] to-[#ABD7FB] border-[#8BC4F7] shadow-md'
                          : 'bg-white border-[#EADBC8] hover:border-[#8BC4F7]'
                      }`}
                      onClick={() => handleTimeSlotToggle(timeSlot)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#4B4036]">{timeSlot}</span>
                        {selectedTimeSlots.includes(timeSlot) && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 有位時間列表 */}
          <div>
            <h4 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center gap-2">
              <Image alt="有位時間" height={20} src="/icons/teacher.png" width={20} />
              {selectedWeekdays.length === 0 && selectedCourses.length === 0 ? (
                '所有有位時間'
              ) : (
                <>
                  有位時間 
                  {selectedWeekdays.length > 0 && (
                    <span className="text-sm font-normal text-[#87704e]">
                      ({selectedWeekdays.map(w => weekdays.find(day => day.value === w)?.name).join('、')})
                    </span>
                  )}
                  {selectedCourses.length > 0 && (
                    <span className="text-sm font-normal text-[#87704e]">
                      {selectedWeekdays.length > 0 ? ' · ' : ''}
                      ({selectedCourses.map(c => courseTypes.find(ct => ct.id === c)?.name).join('、')})
                    </span>
                  )}
                </>
              )}
              ({selectedSlots.length} 個已選中)
            </h4>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B4036]" />
                <p className="mt-2 text-[#4B4036]">載入中...</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableSlots
                  .filter(slot => {
                    // 如果沒有選中任何星期或課程，顯示全部
                    if (selectedWeekdays.length === 0 && selectedCourses.length === 0) {
                      return true;
                    }
                    
                    // 如果有選中星期，必須匹配星期
                    const matchesWeekday = selectedWeekdays.length === 0 || selectedWeekdays.includes(slot.weekday);
                    
                    // 如果有選中課程，必須匹配課程
                    const matchesCourse = selectedCourses.length === 0 || selectedCourses.includes(slot.course_type || '');
                    
                    return matchesWeekday && matchesCourse;
                  })
                  .map((slot, index) => (
                    <button
                      key={index}
                      className={`w-full text-left border border-[#EADBC8] p-3 rounded-xl transition-all duration-200 transform hover:scale-[1.01] active:scale-98 ${
                        isSlotSelected(slot)
                          ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] border-[#EAC29D] shadow-md'
                          : 'bg-[#FFF9F2] hover:bg-[#F3EFE3]'
                      }`}
                      onClick={() => handleSlotToggle(slot)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-[#4B4036]">
                          {slot.weekdayName} {slot.timeslot}
                        </div>
                        {isSlotSelected(slot) && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        )}
                      </div>
                      <div className="text-sm text-[#87704e] mb-2">
                        課程：{slot.course_name || '未指定'}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#4B4036]">
                          {slot.current_students}/{slot.max_students}
                        </span>
                        <span className="font-semibold text-green-600">
                          剩餘 {slot.available_slots} 位
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* 固定底部按鈕 */}
        <div className="p-6 border-t border-[#EADBC8] bg-[#FFFDF8] space-y-3">
          <div className="flex gap-3">
            <button
              className="flex-1 hanami-btn-cute py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedSlots.length === 0}
              onClick={copyToClipboard}
            >
              <Image alt="複製" height={16} src="/icons/edit-pencil.png" width={16} />
              複製
            </button>
            <button
              className="flex-1 hanami-btn-success py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedSlots.length === 0}
              onClick={exportToCSV}
            >
              <Image alt="匯出" height={16} src="/icons/file.svg" width={16} />
              匯出 CSV
            </button>
          </div>
          <button
            className="w-full hanami-btn-soft py-3 flex items-center justify-center gap-2"
            onClick={onClose}
          >
            <Image alt="返回" height={16} src="/icons/close.png" width={16} />
            返回
          </button>
        </div>
      </div>
    </div>
  );
} 
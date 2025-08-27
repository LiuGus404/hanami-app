'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import StudentOngoingActivities from './StudentOngoingActivities';

interface TodayLesson {
  id: string;
  lesson_date: string;
  lesson_status: string | null;
  full_name: string | null;
  course_type: string | null;
  actual_timeslot: string | null;
  student_id: string;
  student_age: number | null;
  lesson_activities: string | null;
  progress_notes: string | null;
  video_url: string | null;
  lesson_teacher?: string | null;
  student_teacher?: string | null;
}

interface TodayLessonsPanelProps {
  lessons: TodayLesson[];
  loading?: boolean;
}

interface GroupedLessons {
  [timeSlot: string]: {
    [courseType: string]: TodayLesson[];
  };
}

export default function TodayLessonsPanel({ lessons, loading = false }: TodayLessonsPanelProps) {
  const [expandedTimeSlots, setExpandedTimeSlots] = useState<Set<string>>(new Set());

  // 切換時間槽展開狀態
  const toggleTimeSlot = (timeSlot: string) => {
    const newExpanded = new Set(expandedTimeSlots);
    if (newExpanded.has(timeSlot)) {
      newExpanded.delete(timeSlot);
    } else {
      newExpanded.add(timeSlot);
    }
    setExpandedTimeSlots(newExpanded);
  };

  // 按時間和班別分組課程
  const groupedLessons = useMemo(() => {
    const grouped: GroupedLessons = {};
    
    if (!lessons || !Array.isArray(lessons)) {
      return grouped;
    }
    
    console.log('🔍 TodayLessonsPanel 接收到的課程資料:', lessons);
    
    lessons.forEach(lesson => {
      if (!lesson) return;
      
      const timeSlot = lesson.actual_timeslot || '未設定時間';
      const courseType = lesson.course_type || '未設定課程';
      
      console.log('🔍 處理課程:', {
        id: lesson.id,
        full_name: lesson.full_name,
        course_type: lesson.course_type,
        actual_timeslot: lesson.actual_timeslot,
        student_age: lesson.student_age
      });
      
      if (!grouped[timeSlot]) {
        grouped[timeSlot] = {};
      }
      
      if (!grouped[timeSlot][courseType]) {
        grouped[timeSlot][courseType] = [];
      }
      
      grouped[timeSlot][courseType].push(lesson);
    });
    
    console.log('🔍 分組後的課程資料:', grouped);
    return grouped;
  }, [lessons]);

  // 獲取時間槽列表並排序
  const timeSlots = useMemo(() => {
    if (!groupedLessons || typeof groupedLessons !== 'object') {
      return [];
    }
    
    return Object.keys(groupedLessons).sort((a, b) => {
      if (a === '未設定時間') return 1;
      if (b === '未設定時間') return -1;
      return a.localeCompare(b);
    });
  }, [groupedLessons]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      case 'scheduled':
        return ''; // 移除已排程顯示
      default:
        return '';
    }
  };

  // 將月齡轉換為歲數
  const convertMonthsToAge = (months: number | null): string => {
    if (!months) return '未知';
    if (months < 12) {
      return `${months}個月`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years}歲`;
      } else {
        return `${years}歲${remainingMonths}個月`;
      }
    }
  };

  // 檢查是否為試堂課程
  const isTrialClass = (courseType: string) => {
    return courseType.toLowerCase().includes('試堂') || 
           courseType.toLowerCase().includes('試聽') || 
           courseType.toLowerCase().includes('trial');
  };

  // 檢查是否為試堂學生
  const isTrialStudent = (lesson: TodayLesson) => {
    return lesson.id.startsWith('trial-') || 
           lesson.course_type?.toLowerCase().includes('試堂') ||
           lesson.course_type?.toLowerCase().includes('試聽') ||
           lesson.course_type?.toLowerCase().includes('trial');
  };

  // 檢查是否為剩1堂的學生（這裡需要根據實際邏輯判斷）
  const isLastLessonStudent = (lesson: TodayLesson) => {
    // 這裡可以根據實際的課程包邏輯來判斷
    // 暫時使用一個示例邏輯，您可能需要根據實際資料調整
    return lesson.lesson_status === 'last_lesson' || 
           lesson.id.includes('last') ||
           false; // 暫時設為 false，需要根據實際邏輯調整
  };

  const getCourseTypeIcon = (courseType: string) => {
    // 如果是試堂課程，使用試堂圖標
    if (isTrialClass(courseType)) {
      return '/trial.png';
    }
    
    switch (courseType.toLowerCase()) {
      case '鋼琴':
        return '/icons/music.PNG';
      case '小提琴':
        return '/icons/music.PNG';
      case '吉他':
        return '/icons/music.PNG';
      case '鼓':
        return '/icons/music.PNG';
      case '聲樂':
        return '/icons/music.PNG';
      default:
        return '/icons/book-elephant.PNG';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B4036]"></div>
          <span className="ml-2 text-[#4B4036]">載入中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6" style={{ background: 'linear-gradient(135deg, #FFF9F2 0%, #FFFDF8 100%)' }}>
      {/* 標題區域 - 參考圖片中的標題設計 */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[#4B4036] mb-2">今日課程安排</h3>
        <div className="flex items-center gap-4 text-sm text-[#87704e]">
          <div className="flex items-center gap-2">
            <Image 
              src="/calendar.png" 
              alt="日曆" 
              width={16} 
              height={16} 
              className="rounded"
            />
            <span suppressHydrationWarning={true}>
              {new Date().toLocaleDateString('zh-HK', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long',
                timeZone: 'Asia/Hong_Kong'
              })}
            </span>
          </div>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <Image
            src="/icons/clock.PNG"
            alt="時鐘"
            width={64}
            height={64}
            className="mx-auto mb-4 opacity-50"
          />
          <p className="text-[#8B7355] text-lg mb-2">今天沒有課程安排</p>
          <p className="text-[#87704e] text-sm">請檢查學生排程設定</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 課程內容 - 參考圖片中的卡片設計 */}
          <div className="space-y-4">
            {timeSlots.map((timeSlot) => {
              const timeSlotLessons = groupedLessons[timeSlot];
              
              return (
                <div key={timeSlot} className="bg-white rounded-2xl border border-[#EADBC8] overflow-hidden shadow-sm">
                  {/* 時間槽標題 - 參考圖片中的標題設計 */}
                  <div 
                    className={`p-4 cursor-pointer transition-all ${
                      // 檢查是否包含試堂學生
                      Object.values(timeSlotLessons).flat().some(lesson => isTrialStudent(lesson))
                        ? 'bg-gradient-to-r from-[#FFF8DC] via-[#FFFACD] to-[#F0E68C] hover:from-[#F0E68C] hover:via-[#FFFACD] hover:to-[#FFF8DC]'
                        : 'bg-gradient-to-r from-[#FFE4B5] to-[#FFF2D9] hover:from-[#FFF2D9] hover:to-[#FFE4B5]'
                    }`}
                    onClick={() => toggleTimeSlot(timeSlot)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image
                          src="/icons/clock.PNG"
                          alt="時間"
                          width={24}
                          height={24}
                          className="rounded"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#4B4036] text-lg">{timeSlot}</h4>
                            {/* 如果有試堂學生，顯示試堂圖標 */}
                            {Object.values(timeSlotLessons).flat().some(lesson => isTrialStudent(lesson)) && (
                              <Image
                                src="/trial.png"
                                alt="試堂"
                                width={20}
                                height={20}
                                className="rounded"
                              />
                            )}
                          </div>
                          <p className="text-sm text-[#87704e]">
                            {timeSlotLessons ? Object.values(timeSlotLessons).flat().length : 0} 位學生
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* 如果有試堂學生，顯示試堂學生數量 */}
                        {timeSlotLessons && Object.entries(timeSlotLessons).some(([courseType, lessons]) => 
                          isTrialClass(courseType) && lessons.length > 0
                        ) && (
                          <div className="text-xs text-[#DAA520] font-medium">
                            試堂: {Object.entries(timeSlotLessons).reduce((total, [courseType, lessons]) => 
                              isTrialClass(courseType) ? total + lessons.length : total, 0
                            )} 人
                          </div>
                        )}
                        <div className={`transform transition-transform duration-200 ${expandedTimeSlots.has(timeSlot) ? 'rotate-180' : ''}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 9L12 15L18 9" stroke="#4B4036" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 班別課程列表 - 參考圖片中的內容卡片 */}
                  {expandedTimeSlots.has(timeSlot) && (
                    <div className="p-4 space-y-4">
                      {Object.entries(timeSlotLessons).map(([courseType, courseLessons]) => (
                        <div 
                          key={courseType} 
                          className={`rounded-xl p-4 border border-[#EADBC8] ${
                            isTrialClass(courseType)
                              ? 'bg-gradient-to-br from-[#FFF8DC] to-[#FFFACD]'
                              : 'bg-[#FFF9F2]'
                          }`}
                        >
                          {/* 班別標題 */}
                          <div className="flex items-center gap-3 mb-4">
                            <Image
                              src={getCourseTypeIcon(courseType)}
                              alt="課程"
                              width={24}
                              height={24}
                              className="rounded"
                            />
                            <h5 className="font-semibold text-[#4B4036] text-lg">{courseType}</h5>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isTrialClass(courseType)
                                ? 'bg-gradient-to-r from-[#F0E68C] to-[#FFFACD] text-[#4B4036]'
                                : 'bg-[#FFD59A] text-[#4B4036]'
                            }`}>
                              {courseLessons.length} 人
                            </span>
                          </div>

                          {/* 學生列表 - 參考圖片中的列表設計 */}
                          <div className="grid gap-3">
                            {courseLessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className={`flex items-center justify-between p-3 rounded-xl border hover:shadow-sm transition-shadow ${
                                  isTrialStudent(lesson)
                                    ? 'bg-gradient-to-r from-[#FFF8DC] to-[#FFFACD] border-[#F0E68C]'
                                    : isLastLessonStudent(lesson)
                                    ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] border-[#FF4757]'
                                    : 'bg-white border-[#EADBC8]'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isTrialStudent(lesson)
                                      ? 'bg-gradient-to-br from-[#F0E68C] to-[#FFFACD]'
                                      : isLastLessonStudent(lesson)
                                      ? 'bg-gradient-to-br from-[#FF4757] to-[#FF6B6B]'
                                      : 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4]'
                                  }`}>
                                    <span className="text-[#4B4036] font-bold text-sm">
                                      {lesson.full_name?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <div className="font-semibold text-[#4B4036] text-base">
                                        {lesson.full_name || '未命名學生'}
                                      </div>
                                      {isTrialStudent(lesson) && (
                                        <div className="flex items-center gap-1 bg-gradient-to-r from-[#F0E68C] to-[#FFFACD] text-[#4B4036] px-2 py-1 rounded-full text-xs font-medium">
                                          <Image
                                            src="/trial.png"
                                            alt="試堂"
                                            width={12}
                                            height={12}
                                            className="rounded"
                                          />
                                          <span>試堂</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-sm text-[#87704e]">
                                      年齡: {convertMonthsToAge(lesson.student_age)}
                                    </div>
                                    <div className="text-sm text-[#87704e] mt-1">
                                      負責老師: {lesson.lesson_teacher || lesson.student_teacher || '未安排'}
                                    </div>
                                    
                                    {/* 學習中活動顯示 */}
                                    <div className="mt-3">
                                      <StudentOngoingActivities studentId={lesson.student_id} />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {lesson.lesson_status && lesson.lesson_status !== 'scheduled' && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lesson.lesson_status)}`}>
                                      {getStatusText(lesson.lesson_status)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CakeIcon,
  MusicalNoteIcon,
  ClipboardDocumentCheckIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  GiftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { MusicalNoteIcon as PianoIcon } from '@heroicons/react/24/solid';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import AppSidebar from '@/components/AppSidebar';
import { supabase } from '@/lib/supabase';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';

export default function HanamiMusicRegisterPage() {
  const router = useRouter();
  const { user, loading, logout } = useSaasAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 當前步驟
  const [currentMonth, setCurrentMonth] = useState(new Date()); // 當前顯示的月份
  const [selectedDate, setSelectedDate] = useState<string>(''); // 選中的日期
  const [calendarData, setCalendarData] = useState<any[]>([]); // 日曆資料
  const [courseTypeInfo, setCourseTypeInfo] = useState<any>(null); // 課程類型資訊
  const [loadingSchedule, setLoadingSchedule] = useState(false); // 排程載入狀態
  const [showSmartFiltering, setShowSmartFiltering] = useState(false); // 顯示智能篩選界面
  const [waitingListType, setWaitingListType] = useState<'none' | 'new' | 'existing'>('none'); // 等候區類型

  // 表單資料
  const [formData, setFormData] = useState({
    courseType: '',
    courseNature: 'trial',
    selectedDate: '',
    selectedTimeSlot: '',
    selectedPlan: '',
    promotionCode: '',
    childFullName: '',
    childNickname: '',
    childBirthDate: '',
    childAge: 0,
    childPreferences: '', // 喜好物
    childHealthNotes: '', // 健康/過敏情況
    parentName: user?.full_name || '',
    parentPhone: user?.phone || '',
    parentEmail: user?.email || '',
    parentTitle: '', // 您的稱呼
    availableTimes: [] as string[], // 有空時間
    paymentMethod: '', // 支付方法
    remarks: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [courseTypes, setCourseTypes] = useState<any[]>([]); // 從資料庫讀取的課程類型
  const [loadingCourses, setLoadingCourses] = useState(true); // 課程載入狀態
  const [isWaitingList, setIsWaitingList] = useState(false); // 等候區模式

  // 步驟配置
  const steps = [
    { id: 0, title: '課程性質', icon: MusicalNoteIcon, shortTitle: '性質' },
    { id: 1, title: '選擇課程', icon: SparklesIcon, shortTitle: '課程' },
    { id: 2, title: '小朋友資料', icon: UserIcon, shortTitle: '資料' },
    { id: 3, title: '日期時間', icon: CalendarDaysIcon, shortTitle: '時間' },
    { id: 4, title: '聯絡方式', icon: PhoneIcon, shortTitle: '聯絡' },
    { id: 5, title: '支付方法', icon: GiftIcon, shortTitle: '支付' },
    { id: 6, title: '確認提交', icon: CheckCircleIcon, shortTitle: '確認' }
  ];

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/aihome/auth/login');
    }
  }, [user, loading, router]);

  // 計算年齡範圍顯示文字
  const getAgeRangeText = (minAge?: number, maxAge?: number, ageRange?: string) => {
    console.log('🎯 getAgeRangeText 輸入參數:', { minAge, maxAge, ageRange });
    
    // 優先使用資料庫的 age_range 文字
    if (ageRange) {
      console.log('✅ 使用 age_range:', ageRange);
      return ageRange;
    }
    
    // 如果有 min_age 和 max_age，計算年齡範圍
    if (minAge !== undefined && minAge !== null) {
      const minYears = Math.floor(minAge / 12);
      const minMonths = minAge % 12;
      
      if (maxAge !== undefined && maxAge !== null) {
        const maxYears = Math.floor(maxAge / 12);
        const maxMonths = maxAge % 12;
        
        // 格式化最小年齡
        let minAgeText = '';
        if (minYears > 0) {
          minAgeText = `${minYears}歲`;
          if (minMonths > 0) {
            minAgeText += `${minMonths}個月`;
          }
        } else {
          minAgeText = `${minMonths}個月`;
        }
        
        // 格式化最大年齡
        let maxAgeText = '';
        if (maxYears > 0) {
          maxAgeText = `${maxYears}歲`;
          if (maxMonths > 0) {
            maxAgeText += `${maxMonths}個月`;
          }
        } else {
          maxAgeText = `${maxMonths}個月`;
        }
        
        const result = `${minAgeText} - ${maxAgeText}`;
        console.log('✅ 計算結果（有最大年齡）:', result);
        return result;
      } else {
        // 只有最小年齡 - 顯示詳細的年齡資訊
        let result = '';
        if (minYears > 0) {
          const ageText = `${minYears}歲`;
          // 如果有月份，加上月份資訊
          result = minMonths > 0 ? `${ageText}${minMonths}個月起` : `${ageText}起`;
        } else {
          // 如果不足1歲，顯示月份
          result = `${minMonths}個月起`;
        }
        console.log('✅ 計算結果（只有最小年齡）:', result);
        return result;
      }
    }
    
    console.log('⚠️ 沒有年齡資料，使用預設值');
    return '適合所有年齡';
  };

  // 從資料庫讀取課程類型 - 使用 useCallback 避免重複創建
  const fetchCourseTypes = useCallback(async () => {
      try {
        setLoadingCourses(true);
        const { data, error } = await supabase
          .from('Hanami_CourseTypes')
          .select('*')
          .eq('status', true)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('讀取課程類型錯誤:', error);
          return;
        }

        console.log('📊 從資料庫讀取的原始課程資料:', data);

        // 為每個課程添加顯示屬性
        const coursesWithDisplay = (data || []).map((course, index) => {
          console.log(`🔍 處理課程 ${index + 1}:`, {
            name: course.name,
            min_age: course.min_age,
            max_age: course.max_age,
            age_range: course.age_range
          });
          // 圖標對應表
          const iconMap: Record<string, any> = {
            'sparkles': SparklesIcon,
            'musical-note': MusicalNoteIcon,
            'piano': PianoIcon,  // 使用實心圖標作為鋼琴
            'guitar': MusicalNoteIcon,
            'default': SparklesIcon
          };

          // 預設顏色（如果資料庫沒有設定）
          const defaultColors = [
            'from-pink-400 to-rose-400',
            'from-purple-400 to-indigo-400',
            'from-blue-400 to-cyan-400',
            'from-green-400 to-emerald-400',
            'from-yellow-400 to-orange-400',
            'from-red-400 to-pink-400'
          ];
          
          const calculatedAge = getAgeRangeText(course.min_age, course.max_age, course.age_range);
          console.log(`📝 課程 "${course.name}" 最終年齡範圍:`, calculatedAge);
          
          return {
            ...course,
            // 使用資料庫的顏色，如果沒有則使用預設
            color: course.color_code || defaultColors[index % defaultColors.length],
            // 使用資料庫的圖標類型，如果沒有則使用預設
            icon: iconMap[course.icon_type || 'default'] || SparklesIcon,
            // 使用計算後的年齡範圍
            age: calculatedAge,
          };
        });

        setCourseTypes(coursesWithDisplay);
        console.log('✅ 成功載入課程（完整資料）:', coursesWithDisplay);
        
        // 自動選擇第一個課程類型 - 只在沒有選擇時才設置
        if (coursesWithDisplay.length > 0) {
          setFormData(prev => {
            if (!prev.courseType) {
              console.log('🎯 自動選擇第一個課程類型:', coursesWithDisplay[0].id);
              return { ...prev, courseType: coursesWithDisplay[0].id };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('❌ 獲取課程類型失敗:', err);
      } finally {
        setLoadingCourses(false);
      }
    }, []);

  // 從資料庫讀取課程類型
  useEffect(() => {
    fetchCourseTypes();
  }, [fetchCourseTypes]);

  // 當課程類型改變時，重新載入日曆資料
  useEffect(() => {
    if (formData.courseType) {
      console.log('🔄 課程類型改變，重新載入日曆資料:', formData.courseType);
      fetchCalendarData();
    }
  }, [formData.courseType]);

  // 使用 useMemo 緩存課程計劃
  const coursePlans = useMemo(() => [
    { id: 'plan-8', name: '8堂課程', lessons: 8, price: 3600, promo_price: 2880, duration: '2個月' },
    { id: 'plan-12', name: '12堂課程', lessons: 12, price: 5400, promo_price: 4320, duration: '3個月', badge: '最受歡迎' },
    { id: 'plan-24', name: '24堂課程', lessons: 24, price: 10800, promo_price: 8640, duration: '6個月', badge: '最優惠' }
  ], []);

  // 使用 useMemo 緩存促銷代碼
  const promotionCodes = useMemo(() => [
    { code: 'FIRST100', discount: 100, description: '新生優惠 -$100' },
    { code: 'FRIEND200', discount: 200, description: '好友推薦 -$200' },
    { code: 'EARLY300', discount: 300, description: '早鳥優惠 -$300' }
  ], []);

  // 使用 useMemo 緩存可用日期 - 使用香港時區
  const getAvailableDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    const hkDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(now);
    const today = new Date(hkDateStr);
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // 使用新的 API 獲取日曆資料 - 使用 useCallback 避免重複創建
  const fetchCalendarData = useCallback(async () => {
    console.log('🔄 fetchCalendarData 被調用，formData.courseType:', formData.courseType);
    
    if (!formData.courseType) {
      console.log('❌ 沒有選擇課程類型，跳過日曆資料獲取');
      return;
    }
    
    try {
      setLoadingSchedule(true);
      
      // 計算查詢日期範圍（未來60天）- 使用香港時區
      const now = new Date();
      const hkDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(now);
      const today = new Date(hkDateStr);
      const startDate = hkDateStr;
      const endDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // 獲取課程名稱
      const selectedCourse = courseTypes.find(course => course.id === formData.courseType);
      if (!selectedCourse) {
        console.error('❌ 找不到選中的課程類型');
        console.error('🔍 當前課程類型 ID:', formData.courseType);
        console.error('🔍 可用課程類型:', courseTypes.map(c => ({ id: c.id, name: c.name })));
        return;
      }
      
      console.log('📅 準備調用 API，參數:', {
        courseType: selectedCourse.name,
        isTrial: true,
        startDate,
        endDate
      });
      console.log('🔍 選中的課程詳情:', selectedCourse);
      
      const response = await fetch('/api/calendar-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseType: selectedCourse.name, // 傳遞課程名稱而不是 ID
          isTrial: true, // 試堂報名
          startDate,
          endDate
        }),
      });

      console.log('📡 API 響應狀態:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 響應錯誤:', errorText);
        throw new Error(`獲取日曆資料失敗: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📡 API 響應結果:', result);
      
      if (result.success) {
        console.log('📅 日曆資料獲取成功:', result.data.length, '天');
        console.log('📊 統計資訊:', result.stats);
        setCalendarData(result.data);
        setCourseTypeInfo(result.courseType);
      } else {
        throw new Error(result.error || '獲取日曆資料失敗');
      }
    } catch (err) {
      console.error('❌ 獲取日曆資料失敗:', err);
    } finally {
      setLoadingSchedule(false);
    }
  }, [formData.courseType, courseTypes]);


  // 獲取指定日期的日曆資料 - 使用 useCallback 避免重複創建
  const getCalendarDay = useCallback((dateStr: string) => {
    return calendarData.find(day => day.date === dateStr);
  }, [calendarData]);


  // 將時間格式轉換為顯示格式 - 使用 useCallback 避免重複創建
  const formatTimeSlot = useCallback((timeSlot: string, duration?: string) => {
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
    
    let endHour = startHour;
    let endMin = startMin + durationMinutes;
    
    // 處理分鐘進位
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
  }, []);

  // 生成月份日曆的函數 - 使用 useMemo 避免無限循環
  const generateCalendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // 計算該月第一天是星期幾，然後往前推到星期日
    const firstDayOfWeek = firstDay.getDay(); // 0=Sunday, 1=Monday, etc.
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    
    console.log(`📅 生成日曆: 月份 ${month + 1}, 第一天是星期 ${firstDayOfWeek}, 開始日期: ${startDate.toDateString()}`);
    
    const days = [];
    // 使用香港時區獲取今天的日期
    const now = new Date();
    const hkDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(now);
    const today = new Date(hkDateStr);
    
    console.log('🕐 當前香港時間:', now.toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' }));
    console.log('📅 當前日期 (YYYY-MM-DD):', hkDateStr);
    console.log('🔍 今天日期物件:', today);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const weekday = currentDate.getDay();
      const isMonday = weekday === 1;
      
      // 從 API 資料中獲取該日期的資訊
      const dayData = getCalendarDay(dateStr);
      
      const isPast = currentDate < today;
      const isToday = currentDate.getTime() === today.getTime();
      const isCurrentMonth = currentDate.getMonth() === month;
      const daysFromToday = Math.floor((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isBeyondTwoMonths = daysFromToday > 60;
      
      if (dayData) {
        // 有 API 資料的日期
        days.push({
          date: currentDate,
          isPast: dayData.isPast,
          isToday: dayData.isToday,
          isCurrentMonth,
          isBeyondTwoMonths: dayData.isBeyond60Days,
          hasSchedule: dayData.hasSchedule,
          availableSlots: dayData.availableSlots || 0,
          totalSlots: dayData.totalSlots || 0,
          isFullyBooked: dayData.isFullyBooked || false,
          weekday: dayData.weekday
        });
      } else {
        // 沒有 API 資料的日期（可能是過去日期或超出查詢範圍）
        days.push({
          date: currentDate,
          isPast,
          isToday,
          isCurrentMonth,
          isBeyondTwoMonths,
          hasSchedule: false,
          availableSlots: 0,
          totalSlots: 0,
          isFullyBooked: false,
          weekday
        });
      }
    }
    
    return days;
  }, [currentMonth, getCalendarDay]);

  // 獲取選中日期的時段資訊 - 使用 useCallback 避免重複計算
  const getTimeSlotsForDate = useCallback((dateStr: string) => {
    if (!dateStr) return [];
    
    // 從 API 資料中獲取該日期的時段資訊
    const dayData = getCalendarDay(dateStr);
    
    if (!dayData || !dayData.timeSlots) {
      console.log(`📅 選中日期 ${dateStr}: 沒有時段資料`);
      return [];
    }
    
    console.log(`📅 選中日期 ${dateStr}: 找到 ${dayData.timeSlots.length} 個時段`);
    
    // 轉換為前端需要的格式
    const timeSlots = dayData.timeSlots.map((slot: any) => ({
      id: slot.id,
      time: slot.time,
      timeslot: slot.timeslot,
      duration: slot.duration,
      maxCapacity: slot.maxStudents,
      remainingSpots: slot.remainingSpots,
      isBooked: !slot.isAvailable,
      available: slot.isAvailable,
      assignedTeachers: slot.assignedTeachers,
      status: slot.status
    }));
    
    console.log(`🎯 最終返回的時段:`, timeSlots);
    return timeSlots;
  }, [getCalendarDay]);

  // 計算年齡 - 使用香港時區
  useEffect(() => {
    if (formData.childBirthDate) {
      const birthDate = new Date(formData.childBirthDate);
      const now = new Date();
      const hkDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(now);
      const today = new Date(hkDateStr);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({ ...prev, childAge: age }));
    }
  }, [formData.childBirthDate]);

  // 驗證當前步驟
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.courseNature) newErrors.courseNature = '請選擇課程性質';
        break;
      case 1:
        if (!formData.courseType) newErrors.courseType = '請選擇課程類型';
        if (formData.courseNature === 'regular' && !formData.selectedPlan) {
          newErrors.selectedPlan = '請選擇課程計劃';
        }
        break;
      case 2:
        if (!formData.childFullName) newErrors.childFullName = '請輸入小朋友全名';
        if (!formData.childBirthDate) newErrors.childBirthDate = '請選擇出生日期';
        if (!formData.childPreferences) newErrors.childPreferences = '請輸入小朋友喜好物';
        break;
      case 3:
        // 等候區學生不需要選擇日期和時段
        if (!isWaitingList) {
        if (!formData.selectedDate) newErrors.selectedDate = '請選擇上課日期';
        if (!formData.selectedTimeSlot) newErrors.selectedTimeSlot = '請選擇上課時段';
        }
        break;
      case 4:
        if (!formData.parentPhone) newErrors.parentPhone = '請輸入聯絡電話';
        if (!formData.parentEmail) newErrors.parentEmail = '請輸入電郵地址';
        if (!formData.parentTitle) newErrors.parentTitle = '請輸入您的稱呼';
        break;
      case 5:
        if (!formData.paymentMethod) newErrors.paymentMethod = '請選擇支付方法';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 下一步
  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextStep = Math.min(currentStep + 1, steps.length - 1);
      
      // 如果下一步是日期時間步驟（步驟3），先顯示智能篩選界面
      if (nextStep === 3) {
        setShowSmartFiltering(true);
        // 1秒後隱藏篩選界面並進入日期時間步驟
        setTimeout(() => {
          setShowSmartFiltering(false);
          setCurrentStep(nextStep);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000);
      } else {
        setCurrentStep(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // 處理支付成功後的跳轉
  const handlePaymentSuccess = (data: any) => {
    console.log('支付成功:', data);
    
    // 如果是 Airwallex 支付成功，直接跳轉到確認頁面
    if (formData.paymentMethod === 'airwallex') {
      setCurrentStep(6); // 跳轉到確認提交步驟
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // 如果是截圖上傳，保持在當前步驟，顯示上傳成功狀態
  };

  // 上一步
  const handlePrev = () => {
    const prevStep = Math.max(currentStep - 1, 0);
    
    // 如果回到日期時間步驟（步驟3），重置等候區狀態
    if (prevStep === 3) {
      setIsWaitingList(false);
      setWaitingListType('none');
    }
    
    setCurrentStep(prevStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 提交表單
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    console.log('提交表單:', formData);
    setShowSuccessModal(true);
    
    setTimeout(() => {
      router.push('/aihome/course-activities/hanami-music');
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex flex-col">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <motion.button
                onClick={() => router.back()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4B4036]" />
              </motion.button>

              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="開啟選單"
              >
                <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4B4036]" />
              </motion.button>
              
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative">
                <img 
                  src="/@hanami.png" 
                  alt="Hanami Music Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-[#4B4036]">課程報名</h1>
                <p className="text-xs sm:text-sm text-[#2B3A3B]">Hanami Music 花見音樂</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block text-sm text-[#2B3A3B]">
                {currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                <span className="text-xs sm:text-sm font-medium text-[#4B4036]">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200"
                title="登出"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">登出</span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* 進度指示器 */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-[#EADBC8] sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          {/* 桌面版進度條 */}
          <div className="hidden md:flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${index <= currentStep 
                      ? 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-md' 
                      : 'bg-gray-200 text-gray-400'
                    }
                  `}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${index <= currentStep ? 'text-[#4B4036]' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                    index < currentStep ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* 手機版進度條 */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center">
                  {React.createElement(steps[currentStep].icon, { className: "w-4 h-4 text-[#4B4036]" })}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#4B4036]">{steps[currentStep].title}</p>
                  <p className="text-xs text-[#2B3A3B]">步驟 {currentStep + 1} / {steps.length}</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div 
                  key={index} 
                  className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                    index <= currentStep 
                      ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4]' 
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 主內容區域 */}
      <div className="flex-1 flex pb-20 sm:pb-24">
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPath="/aihome/course-activities/hanami-music/register"
        />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <AnimatePresence mode="wait">
              {/* 智能篩選界面 */}
              {showSmartFiltering && (
                <motion.div
                  key="smart-filtering"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036] mb-2">選擇日期與時段</h2>
                    <p className="text-sm sm:text-base text-[#2B3A3B]">根據孩子的需要和歲數，正在篩選最合適的時間</p>
                  </div>

                  {/* 智能篩選動畫 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-6 shadow-sm border border-[#EADBC8] mb-6"
                  >
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <SparklesIcon className="w-6 h-6 text-[#4B4036]" />
                        </motion.div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#4B4036] text-lg">智能篩選中</h4>
                        <p className="text-sm text-[#2B3A3B]/70">正在為 {formData.childFullName || '小朋友'} 尋找最適合的課程時間</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 p-3 bg-white/50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#4B4036]">年齡分析</p>
                          <p className="text-xs text-[#2B3A3B]/70">
                            {formData.childAge > 0 ? `${formData.childAge}歲` : '分析中...'} - 尋找適合的課程類型
                          </p>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2 h-2 bg-green-500 rounded-full"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-3 p-3 bg-white/50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <CalendarDaysIcon className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#4B4036]">時間偏好</p>
                          <p className="text-xs text-[#2B3A3B]/70">
                            根據課程性質和年齡需求篩選最佳時段
                          </p>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                          className="w-2 h-2 bg-purple-500 rounded-full"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-3 p-3 bg-white/50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#4B4036]">課程匹配</p>
                          <p className="text-xs text-[#2B3A3B]/70">
                            匹配最適合的課程內容和教學方式
                          </p>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                          className="w-2 h-2 bg-green-500 rounded-full"
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* 正常步驟內容 */}
              {!showSmartFiltering && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                {/* 步驟 0: 課程性質 */}
                {currentStep === 0 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036] mb-2">選擇課程性質</h2>
                      <p className="text-sm sm:text-base text-[#2B3A3B]">請選擇試堂或常規課程</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData(prev => ({ ...prev, courseNature: 'trial' }))}
                        className={`p-6 sm:p-8 rounded-2xl border-2 transition-all duration-200 ${
                          formData.courseNature === 'trial'
                            ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 shadow-lg'
                            : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                        }`}
                      >
                        <SparklesIcon className="w-12 h-12 sm:w-16 sm:h-16 text-[#4B4036] mx-auto mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-[#4B4036] mb-2">試堂</h3>
                        <p className="text-sm sm:text-base text-[#2B3A3B] mb-2">以"最優惠"價格體驗課堂</p>
                        <p className="text-lg sm:text-xl font-bold text-green-600">試堂$168</p>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData(prev => ({ ...prev, courseNature: 'regular' }))}
                        className={`p-6 sm:p-8 rounded-2xl border-2 transition-all duration-200 ${
                          formData.courseNature === 'regular'
                            ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 shadow-lg'
                            : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                        }`}
                      >
                        <CheckCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-[#4B4036] mx-auto mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-[#4B4036] mb-2">常規課程</h3>
                        <p className="text-sm sm:text-base text-[#2B3A3B] mb-2">以優惠價惠價格，展開孩子的學習之旅</p>
                        <p className="text-lg sm:text-xl font-bold text-[#F89090]">立即開始</p>
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* 步驟 1: 選擇課程 */}
                {currentStep === 1 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036] mb-2">選擇課程類型</h2>
                      <p className="text-sm sm:text-base text-[#2B3A3B]">請選擇適合的課程</p>
                    </div>

                    {/* 載入中狀態 */}
                    {loadingCourses ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
                        <p className="text-[#2B3A3B]">載入課程中...</p>
                      </div>
                    ) : courseTypes.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border-2 border-[#EADBC8]">
                        <MusicalNoteIcon className="w-16 h-16 text-[#2B3A3B]/30 mx-auto mb-4" />
                        <p className="text-[#2B3A3B]">目前沒有可用的課程</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {courseTypes.map((course) => (
                        <motion.button
                          key={course.id}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFormData(prev => ({ ...prev, courseType: course.id }))}
                          className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 text-left relative ${
                            formData.courseType === course.id
                              ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 shadow-lg'
                              : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                          }`}
                        >
                          {/* 精選標籤 */}
                          {course.is_featured && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center space-x-1">
                              <StarIcon className="w-3 h-3" />
                              <span>精選</span>
                            </div>
                          )}
                          
                          <div className="flex items-start space-x-3 mb-3">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br ${course.color} flex items-center justify-center flex-shrink-0`}>
                              <course.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-[#4B4036] mb-2 text-base sm:text-lg">{course.name}班</h3>
                              <div className="space-y-1.5">
                                {/* 年齡範圍 */}
                                <div className="flex items-center space-x-2">
                                  <UserGroupIcon className="w-4 h-4 text-[#4B4036] flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-[#2B3A3B]">
                                    {course.age}
                                  </span>
                                </div>
                                {/* 課程時長 */}
                                {course.duration_minutes && (
                                  <div className="flex items-center space-x-2">
                                    <ClockIcon className="w-4 h-4 text-[#4B4036] flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-[#2B3A3B]">
                                      {course.duration_minutes} 分鐘
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* 課程描述 */}
                          {course.description && (
                            <p className="text-xs sm:text-sm text-[#2B3A3B]/80 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </motion.button>
                      ))}
                      </div>
                    )}

                    {!loadingCourses && formData.courseNature === 'regular' && (
                      <div className="mt-6 sm:mt-8">
                        <h3 className="text-lg sm:text-xl font-bold text-[#4B4036] mb-4">選擇課程計劃</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {coursePlans.map((plan) => (
                            <motion.button
                              key={plan.id}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setFormData(prev => ({ ...prev, selectedPlan: plan.id }))}
                              className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 relative ${
                                formData.selectedPlan === plan.id
                                  ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 shadow-lg'
                                  : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                              }`}
                            >
                              {plan.badge && (
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                  {plan.badge}
                                </div>
                              )}
                              <h4 className="text-base sm:text-lg font-bold text-[#4B4036] mb-2">{plan.name}</h4>
                              <p className="text-xs sm:text-sm text-[#2B3A3B] mb-3">{plan.duration}</p>
                              <div className="mb-2">
                                <span className="text-xl sm:text-2xl font-bold text-[#4B4036]">HK${plan.promo_price}</span>
                                <span className="text-sm text-gray-400 line-through ml-2">HK${plan.price}</span>
                              </div>
                              <p className="text-xs text-[#2B3A3B]">{plan.lessons} 堂課程</p>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {errors.courseType && (
                      <p className="text-sm text-red-600 flex items-center justify-center mt-2">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        {errors.courseType}
                      </p>
                    )}
                  </div>
                )}

                {/* 步驟 2: 小朋友資料 */}
                {currentStep === 2 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036] mb-2">小朋友資料</h2>
                      <p className="text-sm sm:text-base text-[#2B3A3B]">請填寫小朋友的基本資料</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">
                          全名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.childFullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, childFullName: e.target.value }))}
                          className={`w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 transition-all duration-200 ${
                            errors.childFullName
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-[#EADBC8] focus:border-[#FFD59A]'
                          } focus:outline-none`}
                          placeholder="請輸入小朋友全名"
                        />
                        {errors.childFullName && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            {errors.childFullName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">暱稱</label>
                        <input
                          type="text"
                          value={formData.childNickname}
                          onChange={(e) => setFormData(prev => ({ ...prev, childNickname: e.target.value }))}
                          className="w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 border-[#EADBC8] focus:border-[#FFD59A] focus:outline-none transition-all duration-200"
                          placeholder="請輸入暱稱（選填）"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">
                          出生日期 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={formData.childBirthDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, childBirthDate: e.target.value }))}
                            className={`w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 transition-all duration-200 ${
                              errors.childBirthDate
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-[#EADBC8] focus:border-[#FFD59A]'
                            } focus:outline-none`}
                          />
                          <CakeIcon className="absolute right-3 top-3.5 sm:top-4 w-5 h-5 text-[#4B4036] pointer-events-none" />
                        </div>
                        {errors.childBirthDate && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            {errors.childBirthDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">年齡</label>
                        <div className="px-4 py-3 sm:py-4 rounded-xl border-2 border-[#EADBC8] bg-gray-50">
                          <span className="text-[#4B4036] font-medium">
                            {formData.childAge > 0 ? `${formData.childAge} 歲` : '請先選擇出生日期'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">
                          喜好物 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.childPreferences}
                          onChange={(e) => setFormData(prev => ({ ...prev, childPreferences: e.target.value }))}
                          className={`w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 transition-all duration-200 resize-none ${
                            errors.childPreferences
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-[#EADBC8] focus:border-[#FFD59A]'
                          } focus:outline-none`}
                          placeholder="例如：喜歡音樂、玩具、顏色等"
                          rows={3}
                        />
                        {errors.childPreferences && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            {errors.childPreferences}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">
                          健康/過敏情況 <span className="text-gray-500 text-xs">(選填)</span>
                        </label>
                        <textarea
                          value={formData.childHealthNotes}
                          onChange={(e) => setFormData(prev => ({ ...prev, childHealthNotes: e.target.value }))}
                          className="w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 border-[#EADBC8] focus:border-[#FFD59A] focus:outline-none transition-all duration-200 resize-none"
                          placeholder="例如：食物過敏、特殊健康狀況、需要特別注意的事項等"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 步驟 3: 日期時間 */}
                {currentStep === 3 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036] mb-2">選擇日期與時段</h2>
                      <p className="text-sm sm:text-base text-[#2B3A3B]">請選擇上課日期和時間</p>
                    </div>

                    {/* 等候區選項 */}
                    <div className="space-y-4 mb-6">
                      {/* 已收到通知的等候區學生 */}
                      <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-4 shadow-sm border border-[#EADBC8]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-[#4B4036]" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#4B4036]">等候區學生</h4>
                              <p className="text-sm text-[#2B3A3B]/70">已收到通知有位，請點此選項</p>
                            </div>
                          </div>
                          <motion.button
                            onClick={() => {
                              setIsWaitingList(true);
                              setWaitingListType('existing');
                              // 跳過日期選擇，直接到聯絡方式步驟
                              setCurrentStep(4);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 font-medium shadow-sm"
                          >
                            選擇此選項
                          </motion.button>
                        </div>
                      </div>

                      {/* 沒有合適時間的等候區選項 */}
                      <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFB6C1]/20 rounded-xl p-4 shadow-sm border border-[#EADBC8]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                              <ClockIcon className="w-5 h-5 text-[#4B4036]" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#4B4036]">沒有合適時間？</h4>
                              <p className="text-sm text-[#2B3A3B]/70">加入等候區，有位置時會優先通知您</p>
                            </div>
                          </div>
                          <motion.button
                            onClick={() => {
                              setIsWaitingList(true);
                              setWaitingListType('new');
                              // 跳過日期選擇，直接到聯絡方式步驟
                              setCurrentStep(4);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-[#4B4036] rounded-lg hover:from-[#FFD59A] hover:to-[#FFB6C1] transition-all duration-200 font-medium shadow-sm"
                          >
                            加入等候區
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* 月份導航 */}
                    <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-sm border border-[#EADBC8]">
                      <motion.button
                        onClick={() => setCurrentMonth(prev => {
                          const newMonth = new Date(prev);
                          newMonth.setMonth(prev.getMonth() - 1);
                          return newMonth;
                        })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] text-[#2B3A3B] rounded-lg hover:bg-[#EBC9A4] transition-colors font-medium"
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">上個月</span>
                      </motion.button>
                      
                      <div className="text-center">
                        <h3 className="text-xl sm:text-2xl font-bold text-[#4B4036]">
                          {currentMonth.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
                        </h3>
                        <p className="text-sm text-[#2B3A3B]/70 mt-1">選擇上課日期</p>
                      </div>
                      
                      <motion.button
                        onClick={() => setCurrentMonth(prev => {
                          const newMonth = new Date(prev);
                          newMonth.setMonth(prev.getMonth() + 1);
                          return newMonth;
                        })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] text-[#2B3A3B] rounded-lg hover:bg-[#EBC9A4] transition-colors font-medium"
                      >
                        <span className="hidden sm:inline">下個月</span>
                        <ChevronRightIcon className="w-5 h-5" />
                      </motion.button>
                    </div>

                    {/* 日曆 */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
                      {loadingSchedule ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
                          <p className="text-[#2B3A3B]">載入排程中...</p>
                        </div>
                      ) : (
                      <>
                      {/* 星期標題 */}
                      <div className="grid grid-cols-7 gap-2 mb-6">
                        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                          <div key={day} className="text-center text-sm font-bold text-[#4B4036] py-3 bg-[#FFF9F2] rounded-lg">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* 日期格子 */}
                      <div className="grid grid-cols-7 gap-2">
                        {generateCalendarDays.map((day, index) => {
                          const dateStr = day.date.toLocaleDateString('en-CA'); // 使用本地日期格式
                          const isSelected = selectedDate === dateStr;
                          
                          return (
                            <motion.button
                              key={index}
                              type="button"
                              disabled={day.isPast || !day.isCurrentMonth || day.isBeyondTwoMonths || (day.isToday && formData.courseNature === 'trial')}
                              whileHover={!day.isPast && day.isCurrentMonth && !day.isBeyondTwoMonths && !(day.isToday && formData.courseNature === 'trial') ? { scale: 1.02 } : {}}
                              whileTap={!day.isPast && day.isCurrentMonth && !day.isBeyondTwoMonths && !(day.isToday && formData.courseNature === 'trial') ? { scale: 0.98 } : {}}
                              onClick={() => {
                                if (!day.isPast && day.isCurrentMonth && !day.isBeyondTwoMonths && !(day.isToday && formData.courseNature === 'trial')) {
                                  setSelectedDate(dateStr);
                                  setFormData(prev => ({ ...prev, selectedDate: dateStr }));
                                }
                              }}
                              className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 min-h-[80px] flex flex-col justify-center items-center ${
                                isSelected
                                  ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-lg'
                                  : day.isPast || !day.isCurrentMonth || day.isBeyondTwoMonths || (day.isToday && formData.courseNature === 'trial')
                                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                  : day.isFullyBooked
                                  ? 'border-red-200 bg-red-50 text-red-600 hover:border-red-300'
                                  : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50 hover:bg-[#FFF9F2]'
                              }`}
                            >
                              <div className="text-center w-full">
                                <p className={`text-sm sm:text-base font-bold mb-1 ${
                                  day.isToday ? 'text-[#FFD59A]' : ''
                                }`}>
                                  {day.date.getDate()}
                                </p>
                                
                                {/* 位置狀態指示 */}
                                {day.isCurrentMonth && !day.isPast && (
                                  <div className="mt-2">
                                    {day.isBeyondTwoMonths ? (
                                      <div className="flex items-center justify-center">
                                        <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-full">
                                          暫不開放
                                        </span>
                                      </div>
                                    ) : !day.hasSchedule ? (
                                      <div className="flex items-center justify-center">
                                        <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-full">
                                          {day.weekday === 1 ? '休息' : '無課程'}
                                        </span>
                                      </div>
                                    ) : day.isFullyBooked ? (
                                      <div className="flex items-center justify-center">
                                        <span className="text-xs text-red-500 font-bold bg-red-100 px-2 py-1 rounded-full">
                                          FULL
                                        </span>
                                      </div>
                                    ) : day.availableSlots > 0 ? (
                                      <div className="flex items-center justify-center">
                                        {/* 即日試堂顯示 FULL */}
                                        {day.isToday && formData.courseNature === 'trial' ? (
                                          <span className="text-xs text-red-500 font-bold bg-red-100 px-2 py-1 rounded-full">
                                            FULL
                                          </span>
                                        ) : (
                                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            day.availableSlots <= 3 
                                              ? 'text-orange-600 bg-orange-100' 
                                              : day.availableSlots <= 5 
                                              ? 'text-yellow-600 bg-yellow-100' 
                                              : 'text-green-600 bg-green-100'
                                          }`}>
                                            {day.availableSlots}/{day.totalSlots}
                                          </span>
                                        )}
                                      </div>
                                    ) : day.hasSchedule && (day as any).totalBookings === 0 ? (
                                      <div className="flex items-center justify-center">
                                        <span className="text-xs text-purple-600 font-bold bg-purple-100 px-2 py-1 rounded-full">
                                          加開
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center">
                                        <span className="text-xs text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded-full">
                                          可預約
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* 今天標記 */}
                                {day.isToday && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFD59A] rounded-full border-2 border-white"></div>
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                      </>
                      )}
                    </div>

                    {/* 選中日期的時段選擇 */}
                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-xl flex items-center justify-center">
                            <CalendarDaysIcon className="w-6 h-6 text-[#4B4036]" />
                          </div>
                    <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-[#4B4036]">
                              {new Date(selectedDate).toLocaleDateString('zh-TW', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                weekday: 'long'
                              })}
                            </h3>
                            <p className="text-sm text-[#2B3A3B]/70">選擇上課時段</p>
                          </div>
                        </div>
                        
                        {getTimeSlotsForDate(selectedDate).length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CalendarDaysIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-lg font-medium">當日無可用時段</p>
                            <p className="text-gray-400 text-sm mt-2">請選擇其他日期</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {getTimeSlotsForDate(selectedDate).map((slot: any, index: number) => {
                          const isSelected = formData.selectedTimeSlot === slot.time;
                              
                          return (
                            <motion.button
                                  key={slot.id || index}
                              type="button"
                              disabled={!slot.available}
                                  whileHover={slot.available ? { scale: 1.02 } : {}}
                                  whileTap={slot.available ? { scale: 0.98 } : {}}
                              onClick={() => slot.available && setFormData(prev => ({ ...prev, selectedTimeSlot: slot.time }))}
                                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                isSelected
                                      ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-lg'
                                  : slot.available
                                      ? 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50 hover:bg-[#FFF9F2]'
                                  : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                              }`}
                            >
                                  <div className="flex flex-col items-center text-center">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                                      isSelected 
                                        ? 'bg-white/20' 
                                        : slot.available 
                                          ? 'bg-[#FFF9F2]' 
                                          : 'bg-gray-100'
                                    }`}>
                                      <ClockIcon className={`w-5 h-5 ${
                                        isSelected ? 'text-[#4B4036]' : 'text-[#2B3A3B]'
                                      }`} />
                                    </div>
                                    <span className="font-bold text-sm mb-2">{slot.time}</span>
                                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${
                                      slot.available 
                                        ? slot.remainingSpots <= 3 
                                          ? 'text-orange-600 bg-orange-100' 
                                          : slot.remainingSpots <= 5 
                                          ? 'text-yellow-600 bg-yellow-100' 
                                          : 'text-green-600 bg-green-100'
                                        : 'text-red-500 bg-red-100'
                                    }`}>
                                      {slot.available ? 
                                        `${slot.remainingSpots}/${slot.maxCapacity}` 
                                        : '已滿'}
                                    </div>
                                    {slot.assignedTeachers && (
                                      <div className="text-xs text-[#2B3A3B]/70 mt-1 truncate max-w-full">
                                        {slot.assignedTeachers}
                                      </div>
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                        )}
                      </motion.div>
                    )}

                    {errors.selectedDate && (
                      <p className="text-sm text-red-600 flex items-center justify-center">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        {errors.selectedDate}
                      </p>
                    )}
                    
                      {errors.selectedTimeSlot && (
                      <p className="text-sm text-red-600 flex items-center justify-center">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          {errors.selectedTimeSlot}
                        </p>
                      )}
                  </div>
                )}

                {/* 步驟 4: 聯絡方式 */}
                {currentStep === 4 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036] mb-2">聯絡方式</h2>
                      <p className="text-sm sm:text-base text-[#2B3A3B]">請填寫聯絡資料</p>
                      
                      {/* 等候區狀態顯示 - 只在已收到通知的等候區學生時顯示 */}
                      {isWaitingList && waitingListType === 'existing' && (
                        <div className="mt-4 bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-4 border border-[#EADBC8]">
                          <div className="flex items-center justify-center gap-2 text-[#4B4036] mb-2">
                            <UserIcon className="w-5 h-5" />
                            <span className="font-medium">等候區學生</span>
                          </div>
                          <p className="text-sm text-[#2B3A3B] mb-3">
                            您已在等候名單中，我們會優先為您安排課程
                          </p>
                          <motion.button
                            onClick={() => {
                              setIsWaitingList(false);
                              setWaitingListType('none');
                              setSelectedDate(''); // 重置選中的日期
                              setFormData(prev => ({ ...prev, selectedDate: '', selectedTimeSlot: '' })); // 重置表單中的日期和時段
                              setCurrentStep(3);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 bg-white text-[#4B4036] border border-[#EADBC8] rounded-lg hover:bg-[#FFF9F2] transition-all duration-200 font-medium text-sm"
                          >
                            改為選擇日期時段
                          </motion.button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* 您的稱呼 - 必填 */}
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">
                          您的稱呼 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.parentTitle}
                          onChange={(e) => setFormData(prev => ({ ...prev, parentTitle: e.target.value }))}
                          className={`w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 transition-all duration-200 ${
                            errors.parentTitle
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-[#EADBC8] focus:border-[#FFD59A]'
                          } focus:outline-none`}
                          placeholder="例如：陳媽媽、李爸爸、王小姐等"
                        />
                        {errors.parentTitle && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            {errors.parentTitle}
                          </p>
                        )}
                      </div>

                      {/* 聯絡電話 - 必填，建議填Whatsapp電話 */}
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">
                          聯絡電話 <span className="text-red-500">*</span>
                          <span className="text-gray-500 text-xs ml-2">(建議填Whatsapp電話)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={formData.parentPhone}
                            onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                            className={`w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 transition-all duration-200 ${
                              errors.parentPhone
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-[#EADBC8] focus:border-[#FFD59A]'
                            } focus:outline-none`}
                            placeholder="請輸入聯絡電話"
                          />
                          <PhoneIcon className="absolute right-3 top-3.5 sm:top-4 w-5 h-5 text-[#4B4036] pointer-events-none" />
                        </div>
                        {errors.parentPhone && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            {errors.parentPhone}
                          </p>
                        )}
                      </div>

                      {/* 電郵地址 - 必填 */}
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">
                          電郵地址 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={formData.parentEmail}
                            onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                            className={`w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 transition-all duration-200 ${
                              errors.parentEmail
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-[#EADBC8] focus:border-[#FFD59A]'
                            } focus:outline-none`}
                            placeholder="請輸入電郵地址"
                          />
                          <EnvelopeIcon className="absolute right-3 top-3.5 sm:top-4 w-5 h-5 text-[#4B4036] pointer-events-none" />
                        </div>
                        {errors.parentEmail && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            {errors.parentEmail}
                          </p>
                        )}
                      </div>

                      {/* 有空時間 - 只在加入等候區時顯示 */}
                      {isWaitingList && waitingListType === 'new' && (
                        <div>
                          <label className="block text-sm font-medium text-[#4B4036] mb-2">
                            有空時間 <span className="text-gray-500 text-xs">(選填)</span>
                          </label>
                          <p className="text-sm text-[#2B3A3B]/70 mb-3">請選擇您方便的時間，我們會優先安排</p>
                          <div className="grid grid-cols-2 gap-3">
                            {['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'].map((day) => (
                              <div key={day} className="space-y-2">
                                <h4 className="text-sm font-medium text-[#4B4036]">{day}</h4>
                                <div className="space-y-1">
                                  {['上午', '下午'].map((period) => {
                                    const timeKey = `${day}-${period}`;
                                    const isSelected = formData.availableTimes.includes(timeKey);
                                    return (
                                      <motion.button
                                        key={timeKey}
                                        type="button"
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            availableTimes: isSelected
                                              ? prev.availableTimes.filter(t => t !== timeKey)
                                              : [...prev.availableTimes, timeKey]
                                          }));
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full px-3 py-2 text-xs rounded-lg border-2 transition-all duration-200 ${
                                          isSelected
                                            ? 'border-[#FFD59A] bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036]'
                                            : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                                        }`}
                                      >
                                        {period}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 備註 */}
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">備註</label>
                        <textarea
                          value={formData.remarks}
                          onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                          rows={4}
                          className="w-full px-4 py-3 text-base rounded-xl border-2 border-[#EADBC8] focus:border-[#FFD59A] focus:outline-none transition-all duration-200 resize-none"
                          placeholder="如有特別要求或備註，請在此填寫..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 步驟 5: 支付方法 */}
                {currentStep === 5 && (
                  <PaymentMethodSelector
                    selectedMethod={formData.paymentMethod}
                    onMethodChange={(methodId) => setFormData(prev => ({ ...prev, paymentMethod: methodId }))}
                    amount={formData.courseNature === 'trial' ? 168 : (() => {
                      const selectedPlan = coursePlans.find(p => p.id === formData.selectedPlan);
                      return selectedPlan ? selectedPlan.promo_price : 0;
                    })()}
                    currency="HKD"
                    description={formData.courseNature === 'trial' 
                      ? `試堂報名 - ${courseTypes.find(c => c.id === formData.courseType)?.name}班`
                      : `常規課程報名 - ${courseTypes.find(c => c.id === formData.courseType)?.name}班 - ${coursePlans.find(p => p.id === formData.selectedPlan)?.name}`
                    }
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={(error) => {
                      console.error('支付錯誤:', error);
                      setErrors(prev => ({ ...prev, paymentMethod: error }));
                    }}
                    showPaymentActions={true}
                    user={user}
                  />
                )}

                {/* 步驟 6: 確認提交 */}
                {currentStep === 6 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center mb-6 sm:mb-8">
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036] mb-2">確認報名資料</h2>
                      <p className="text-sm sm:text-base text-[#2B3A3B]">請確認以下資料是否正確</p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#EADBC8] space-y-4">
                      <div className="pb-4 border-b border-[#EADBC8]">
                        <h3 className="text-base sm:text-lg font-bold text-[#4B4036] mb-3">課程資訊</h3>
                        <div className="space-y-2 text-sm sm:text-base">
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">課程性質：</span>
                            <span className="font-medium text-[#4B4036]">
                              {formData.courseNature === 'trial' ? '試堂' : '常規課程'}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">課程類型：</span>
                            <span className="font-medium text-[#4B4036]">
                              {courseTypes.find(c => c.id === formData.courseType)?.name}班
                            </span>
                          </p>
                          {formData.selectedPlan && (
                            <p className="flex justify-between">
                              <span className="text-[#2B3A3B]">課程計劃：</span>
                              <span className="font-medium text-[#4B4036]">
                                {coursePlans.find(p => p.id === formData.selectedPlan)?.name}
                              </span>
                            </p>
                          )}
                          {!isWaitingList && (
                            <>
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">上課日期：</span>
                            <span className="font-medium text-[#4B4036]">
                              {new Date(formData.selectedDate).toLocaleDateString('zh-TW')}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">上課時段：</span>
                            <span className="font-medium text-[#4B4036]">{formData.selectedTimeSlot}</span>
                          </p>
                            </>
                          )}
                          {isWaitingList && (
                            <p className="flex justify-between">
                              <span className="text-[#2B3A3B]">報名狀態：</span>
                              <span className="font-medium text-[#4B4036] bg-[#FFF9F2] px-2 py-1 rounded-lg">
                                等候區學生
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pb-4 border-b border-[#EADBC8]">
                        <h3 className="text-base sm:text-lg font-bold text-[#4B4036] mb-3">小朋友資料</h3>
                        <div className="space-y-2 text-sm sm:text-base">
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">全名：</span>
                            <span className="font-medium text-[#4B4036]">{formData.childFullName}</span>
                          </p>
                          {formData.childNickname && (
                            <p className="flex justify-between">
                              <span className="text-[#2B3A3B]">暱稱：</span>
                              <span className="font-medium text-[#4B4036]">{formData.childNickname}</span>
                            </p>
                          )}
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">出生日期：</span>
                            <span className="font-medium text-[#4B4036]">
                              {new Date(formData.childBirthDate).toLocaleDateString('zh-TW')}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">年齡：</span>
                            <span className="font-medium text-[#4B4036]">{formData.childAge} 歲</span>
                          </p>
                          {formData.childPreferences && (
                            <div className="mt-2">
                              <p className="text-[#2B3A3B] mb-1">喜好物：</p>
                              <p className="text-sm text-[#4B4036] bg-[#FFF9F2] p-2 rounded-lg">
                                {formData.childPreferences}
                              </p>
                            </div>
                          )}
                          {formData.childHealthNotes && (
                            <div className="mt-2">
                              <p className="text-[#2B3A3B] mb-1">健康/過敏情況：</p>
                              <p className="text-sm text-[#4B4036] bg-[#FFF9F2] p-2 rounded-lg">
                                {formData.childHealthNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#4B4036] mb-3">聯絡資料</h3>
                        <div className="space-y-2 text-sm sm:text-base">
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">家長姓名：</span>
                            <span className="font-medium text-[#4B4036]">{formData.parentName}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">聯絡電話：</span>
                            <span className="font-medium text-[#4B4036]">{formData.parentPhone}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">電郵地址：</span>
                            <span className="font-medium text-[#4B4036]">{formData.parentEmail}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">支付方法：</span>
                            <span className="font-medium text-[#4B4036]">
                              {formData.paymentMethod === 'screenshot' ? '上傳付款截圖' : 
                               formData.paymentMethod === 'airwallex' ? 'Airwallex 線上支付' : 
                               '未選擇'}
                            </span>
                          </p>
                          {formData.promotionCode && (
                            <p className="flex justify-between">
                              <span className="text-[#2B3A3B]">優惠代碼：</span>
                              <span className="font-medium text-green-600">{formData.promotionCode}</span>
                            </p>
                          )}
                          {formData.remarks && (
                            <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                              <p className="text-[#2B3A3B] mb-1">備註：</p>
                              <p className="text-[#4B4036]">{formData.remarks}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 底部固定導航按鈕 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-[#EADBC8] z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            {currentStep > 0 && (
              <motion.button
                onClick={handlePrev}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-white text-[#4B4036] rounded-xl font-bold border-2 border-[#EADBC8] hover:border-[#FFD59A] transition-all duration-200 flex-1 sm:flex-initial"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">上一步</span>
              </motion.button>
            )}
            
            {/* 只有不是支付步驟，或者是支付步驟但選擇了截圖上傳時，才顯示下一步按鈕 */}
            {!(currentStep === 5) || (currentStep === 5 && formData.paymentMethod === 'screenshot') ? (
              <motion.button
                onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex-1"
              >
                <span className="text-sm sm:text-base">
                  {currentStep === steps.length - 1 ? '提交報名' : '下一步'}
                </span>
                {currentStep < steps.length - 1 && (
                  <ChevronRightIcon className="w-5 h-5 ml-1 sm:ml-2" />
                )}
              </motion.button>
            ) : (
              <div className="flex-1 text-center">
                <p className="text-sm text-[#2B3A3B]/70">
                  請完成 Airwallex 支付後，系統將自動跳轉
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 成功訊息彈窗 */}
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#4B4036] mb-4">
                報名成功！
              </h3>
              <p className="text-sm sm:text-base text-[#2B3A3B] mb-6">
                我們已收到您的報名申請，客服團隊會盡快與您聯絡確認課程安排
              </p>
              <div className="animate-pulse text-sm text-[#2B3A3B]">
                3秒後自動返回...
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

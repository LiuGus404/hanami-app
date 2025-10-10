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
  StarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { MusicalNoteIcon as PianoIcon } from '@heroicons/react/24/solid';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import AppSidebar from '@/components/AppSidebar';
import { supabase } from '@/lib/supabase';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import PhoneInput from '@/components/ui/PhoneInput';
import EmailInput from '@/components/ui/EmailInput';
import { validatePhoneNumber, validateEmail } from '@/lib/validationUtils';
import { 
  hanamiAiPricingApi, 
  type CoursePricingPlan, 
  type CourseType,
  type PriceCalculationResult,
  type CouponValidationResult 
} from '@/lib/hanami-ai-pricing-api';
import ChildSelectionModal from '@/components/children/ChildSelectionModal';

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
  const [isTestMode, setIsTestMode] = useState(true); // 測試模式 - 跳過某些驗證
  
  // 測試模式下的預設資料
  const testData = {
    childFullName: '測試您孩子',
    childBirthDate: '2020-01-01',
    childGender: '男',
    childPreferences: '喜歡音樂和遊戲',
    parentPhone: '+85212345678',
    parentEmail: 'test@example.com',
    parentTitle: '爸爸',
    parentCountryCode: '+852'
  };
  
  // 新的價格系統狀態
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]); // 課程類型列表
  const [pricingPlans, setPricingPlans] = useState<CoursePricingPlan[]>([]); // 價格計劃列表
  const [loadingPricing, setLoadingPricing] = useState(false); // 價格載入狀態
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculationResult | null>(null); // 價格計算結果
  const [couponValidation, setCouponValidation] = useState<CouponValidationResult | null>(null); // 優惠券驗證結果
  const [waitingListType, setWaitingListType] = useState<'none' | 'new' | 'existing'>('none'); // 等候區類型
  
  // 您孩子資料載入相關狀態
  const [showChildSelection, setShowChildSelection] = useState(false);
  const [availableChildren, setAvailableChildren] = useState<any[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

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
    childGender: '', // 性別（必填）
    childPreferences: '', // 喜好物
    childHealthNotes: '', // 健康/過敏情況
    parentName: user?.full_name || '',
    parentPhone: user?.phone || '',
    parentCountryCode: '+852', // 預設香港區碼
    parentEmail: user?.email || '',
    parentTitle: '', // 您的稱呼
    availableTimes: [] as string[], // 有空時間
    paymentMethod: '', // 支付方法
    remarks: '',
    screenshotUploaded: false // 追蹤截圖是否已上傳
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCourses, setLoadingCourses] = useState(true); // 課程載入狀態
  const [isWaitingList, setIsWaitingList] = useState(false); // 等候區模式

  // 步驟配置
  const steps = [
    { id: 0, title: '課程性質', icon: MusicalNoteIcon, shortTitle: '性質' },
    { id: 1, title: '選擇課程', icon: SparklesIcon, shortTitle: '課程' },
    { id: 2, title: '您孩子資料', icon: UserIcon, shortTitle: '資料' },
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

  // 初始化用戶資料，處理已包含國碼的電話號碼
  useEffect(() => {
    if (user?.phone) {
      // 檢查用戶電話是否已包含國碼
      const countryCodes = ['+852', '+86', '+886', '+65', '+60', '+66', '+84', '+63', '+62', '+1', '+44', '+81', '+82', '+61', '+64'];
      const foundCountry = countryCodes.find(code => user.phone!.startsWith(code));
      
      if (foundCountry) {
        // 如果包含國碼，分離國碼和電話號碼
        const phoneOnly = user.phone!.replace(foundCountry, '').trim();
        setFormData(prev => ({
          ...prev,
          parentPhone: phoneOnly,
          parentCountryCode: foundCountry
        }));
      } else {
        // 如果沒有國碼，保持原樣
        setFormData(prev => ({
          ...prev,
          parentPhone: user.phone!
        }));
      }
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 載入現有您孩子資料
  const loadExistingChildren = async () => {
    setLoadingChildren(true);
    try {
      // 獲取用戶信息
      const userResponse = await fetch('/api/children/get-user-by-email?email=tqfea12@gmail.com');
      const userResult = await userResponse.json();
      
      if (!userResult.success || !userResult.user) {
        alert('無法獲取用戶信息');
        return;
      }
      
      const userId = userResult.user.id;
      
      // 獲取您孩子資料
      const response = await fetch(`/api/children?userId=${userId}`);
      const data = await response.json();
      
      if (response.ok && data.children) {
        if (data.children.length === 0) {
          alert('還沒有添加任何您孩子資料，請先在設定頁面添加');
        } else if (data.children.length === 1) {
          // 只有一個您孩子，直接載入
          const child = data.children[0];
          loadChildData(child);
        } else {
          // 多個您孩子，顯示選擇模態框
          setAvailableChildren(data.children);
          setShowChildSelection(true);
        }
      } else {
        alert('載入您孩子資料失敗');
      }
    } catch (error) {
      console.error('載入您孩子資料失敗:', error);
      alert('載入失敗，請稍後再試');
    } finally {
      setLoadingChildren(false);
    }
  };

  // 載入選中的您孩子資料到表單
  const loadChildData = (child: any) => {
    const birthDate = child.birth_date || child.date_of_birth;
    const age = child.age_in_months ? Math.floor(child.age_in_months / 12) : 0;
    
    setFormData(prev => ({
      ...prev,
      childFullName: child.full_name || '',
      childNickname: child.nick_name || '',
      childBirthDate: birthDate || '',
      childGender: child.gender === '男孩' ? '男' : child.gender === '女孩' ? '女' : child.gender || '',
      childPreferences: child.preferences || '',
      childHealthNotes: child.health_notes || ''
    }));
    
    setShowChildSelection(false);
  };

  // 處理您孩子選擇
  const handleChildSelection = (child: any) => {
    loadChildData(child);
  };

  // 載入當前用戶資料
  const loadCurrentUserData = async () => {
    if (!user) {
      alert('您尚未登入，請先登入以載入您的聯絡資料');
      return;
    }

    try {
      // 直接使用當前用戶的資料
      setFormData(prev => ({
        ...prev,
        parentName: user.full_name || '',
        parentPhone: user.phone || '',
        parentEmail: user.email || '',
        parentTitle: user.full_name || '' // 載入用戶的暱稱作為稱呼
      }));
      
      alert('已載入您的聯絡資料');
    } catch (error) {
      console.error('載入用戶資料失敗:', error);
      alert('載入失敗，請稍後再試');
    }
  };

  // 移除認證保護 - 允許未登入用戶以訪客身份訪問
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/aihome/auth/login');
  //   }
  // }, [user, loading, router]);

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


  // 初始化載入課程類型
  useEffect(() => {
    loadCourseTypes();
  }, []); // 移除依賴項，只在組件掛載時執行一次

  // 當課程類型改變時，重新載入日曆資料和價格計劃
  useEffect(() => {
    if (formData.courseType) {
      console.log('🔄 課程類型改變，重新載入日曆資料和價格計劃:', formData.courseType);
      fetchCalendarData();
      loadPricingPlans(formData.courseType);
      // 重置選擇的計劃和價格計算
      setFormData(prev => ({ ...prev, selectedPlan: '' }));
      setPriceCalculation(null);
      setCouponValidation(null);
    }
  }, [formData.courseType]); // 移除函數依賴項，避免循環依賴

  // 當課程性質改變時，重新載入日曆資料
  useEffect(() => {
    if (formData.courseType) {
      console.log('🔄 課程性質改變，重新載入日曆資料:', formData.courseNature);
      fetchCalendarData();
    }
  }, [formData.courseNature]); // 監聽課程性質變化

  // 當選擇價格計劃時，計算價格
  useEffect(() => {
    if (formData.selectedPlan && formData.courseType) {
      calculatePrice(formData.courseType, formData.selectedPlan, formData.promotionCode);
    }
  }, [formData.selectedPlan, formData.courseType, formData.promotionCode]); // 移除函數依賴項

  // 載入課程類型
  const loadCourseTypes = useCallback(async () => {
    try {
      setLoadingPricing(true);
      setLoadingCourses(true);
      const types = await hanamiAiPricingApi.courseTypeApi.getCourseTypes();
      
      // 為每個課程添加顯示屬性
      const coursesWithDisplay = types.map((course, index) => {
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
          'piano': PianoIcon,
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
      console.log('✅ 載入課程類型成功:', coursesWithDisplay);
      
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
    } catch (error) {
      console.error('❌ 載入課程類型失敗:', error);
    } finally {
      setLoadingPricing(false);
      setLoadingCourses(false);
    }
  }, []);

  // 載入價格計劃
  const loadPricingPlans = useCallback(async (courseTypeId: string) => {
    if (!courseTypeId) return;
    
    try {
      setLoadingPricing(true);
      const plans = await hanamiAiPricingApi.coursePricingApi.getCoursePackagePlans(courseTypeId);
      setPricingPlans(plans);
      console.log('✅ 載入價格計劃成功:', plans);
    } catch (error) {
      console.error('❌ 載入價格計劃失敗:', error);
      setPricingPlans([]);
    } finally {
      setLoadingPricing(false);
    }
  }, []);

  // 計算價格
  const calculatePrice = useCallback(async (courseTypeId: string, pricingPlanId: string, couponCode?: string) => {
    if (!courseTypeId || !pricingPlanId) return;
    
    try {
      const result = await hanamiAiPricingApi.pricingCalculationApi.calculateFinalPrice(
        courseTypeId,
        pricingPlanId,
        couponCode
      );
      setPriceCalculation(result);
      console.log('✅ 價格計算成功:', result);
    } catch (error) {
      console.error('❌ 價格計算失敗:', error);
      setPriceCalculation(null);
    }
  }, []);

  // 驗證優惠券
  const validateCoupon = useCallback(async (couponCode: string) => {
    if (!couponCode.trim()) {
      setCouponValidation(null);
      return;
    }
    
    try {
      const result = await hanamiAiPricingApi.couponApi.validateCoupon(couponCode);
      setCouponValidation(result);
      console.log('✅ 優惠券驗證結果:', result);
      
      // 如果優惠券有效且已選擇價格計劃，重新計算價格
      if (result.isValid && formData.selectedPlan && formData.courseType) {
        await calculatePrice(formData.courseType, formData.selectedPlan, couponCode);
      }
    } catch (error) {
      console.error('❌ 優惠券驗證失敗:', error);
      setCouponValidation({ isValid: false, message: '優惠券驗證失敗' });
    }
  }, [formData.selectedPlan, formData.courseType, calculatePrice]);

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
        isTrial: formData.courseNature === 'trial',
        startDate,
        endDate
      });
      console.log('🔍 選中的課程詳情:', selectedCourse);
      console.log('🔍 課程性質:', formData.courseNature);
      console.log('🔍 當前 formData:', formData);
      
      // 根據課程性質選擇不同的 API
      const apiEndpoint = formData.courseNature === 'trial' 
        ? '/api/calendar-data' 
        : '/api/regular-course-calendar';
      
      const requestBody = formData.courseNature === 'trial' 
        ? {
            courseType: selectedCourse.name,
            isTrial: true,
            startDate,
            endDate
          }
        : {
            courseType: selectedCourse.name,
            startDate,
            endDate
          };
      
      console.log('📡 使用 API:', apiEndpoint);
      console.log('📡 請求參數:', requestBody);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
        // console.log('📅 前3筆日曆資料:', result.data.slice(0, 3));
        setCalendarData(result.data);
        setCourseTypeInfo(result.courseType);
        
        // 如果是常規課程且沒有選中日期，自動選擇第一個有排程的日期
        if (formData.courseNature === 'regular' && !selectedDate && result.data.length > 0) {
          const firstAvailableDay = result.data.find((day: any) => day.hasSchedule && day.timeSlots && day.timeSlots.length > 0);
          if (firstAvailableDay) {
            console.log('🎯 自動選擇第一個有排程的日期:', firstAvailableDay.date);
            setSelectedDate(firstAvailableDay.date);
            setFormData(prev => ({ ...prev, selectedDate: firstAvailableDay.date }));
          }
        }
      } else {
        throw new Error(result.error || '獲取日曆資料失敗');
      }
    } catch (err) {
      console.error('❌ 獲取日曆資料失敗:', err);
    } finally {
      setLoadingSchedule(false);
    }
  }, [formData.courseType, formData.courseNature, courseTypes, selectedDate]);


  // 獲取指定日期的日曆資料 - 使用 useCallback 避免重複創建
  const getCalendarDay = useCallback((dateStr: string) => {
    const result = calendarData.find(day => day.date === dateStr);
    return result;
  }, [calendarData]);


  // 獲取星期幾的中文名稱
  const getWeekdayName = useCallback((weekday: number): string => {
    const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
    return weekdayNames[weekday] || '';
  }, []);

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

  // 生成周曆的函數 - 使用 useMemo 避免無限循環
  const generateWeekCalendar = useMemo(() => {
    console.log('🔍 generateWeekCalendar 執行，formData.courseNature:', formData.courseNature);
    
    // 如果是常規課程，直接使用 API 返回的星期幾排程資料
    if (formData.courseNature === 'regular') {
      console.log('📅 常規課程：使用星期幾排程模式');
      
      const days = [];
      
      // 為每個星期幾（0-6）生成資料
      for (let weekday = 0; weekday <= 6; weekday++) {
        // 星期一顯示為休息日
        if (weekday === 1) {
          days.push({
            date: null,
            isPast: false,
            isToday: false,
            isCurrentMonth: true,
            isBeyondTwoMonths: false,
            hasSchedule: false,
            availableSlots: 0,
            totalSlots: 0,
            isFullyBooked: true, // 休息日設為已滿
            weekday,
            weekdayName: '休息',
            timeSlots: [],
            isRestDay: true // 標記為休息日
          });
          continue;
        }
        
        // 從 API 資料中獲取該星期幾的排程資訊
        const weekdayData = calendarData.find(day => day.weekday === weekday);
        
        if (weekdayData) {
          // 有排程資料的星期幾
          days.push({
            date: null, // 常規課程不需要具體日期
            isPast: false, // 常規課程沒有過期概念
            isToday: false, // 常規課程不顯示今天
            isCurrentMonth: true,
            isBeyondTwoMonths: false, // 常規課程沒有太遠概念
            hasSchedule: weekdayData.hasSchedule,
            availableSlots: weekdayData.availableSlots || 0,
            totalSlots: weekdayData.totalSlots || 0,
            isFullyBooked: weekdayData.isFullyBooked || false,
            weekday: weekdayData.weekday,
            weekdayName: weekdayData.weekdayName || getWeekdayName(weekday),
            timeSlots: weekdayData.timeSlots || [],
            isRestDay: false
          });
        } else {
          // 沒有排程資料的星期幾
          days.push({
            date: null,
            isPast: false,
            isToday: false,
            isCurrentMonth: true,
            isBeyondTwoMonths: false,
            hasSchedule: false,
            availableSlots: 0,
            totalSlots: 0,
            isFullyBooked: false,
            weekday,
            weekdayName: getWeekdayName(weekday),
            timeSlots: [],
            isRestDay: false
          });
        }
      }
      
      return days;
    }
    
    // 試堂課程：使用原有的日期範圍邏輯
    console.log('📅 試堂課程：使用日期範圍邏輯');
    
    // 使用香港時區獲取當前時間
    const now = new Date();
    const hkDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(now);
    const today = new Date(hkDateStr);
    
    // 計算當前週的開始日期（星期日，因為0是日）
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const daysToSunday = dayOfWeek === 0 ? 0 : -dayOfWeek; // 如果是星期日，不調整；否則往前推到星期日
    currentWeekStart.setDate(today.getDate() + daysToSunday);
    
    console.log('📅 生成周曆 (香港時間): 當前週開始日期:', currentWeekStart.toDateString());
    console.log('📅 今天是星期:', dayOfWeek, '(0=日, 1=一, ..., 6=六)');
    
    const days = [];
    
    // 只生成一週的資料（7天，從星期日開始）
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(currentWeekStart);
      currentDate.setDate(currentWeekStart.getDate() + day);
      
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const weekday = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      
      // 從 API 資料中獲取該日期的資訊
      const dayData = getCalendarDay(dateStr);
      
      const isToday = currentDate.getTime() === today.getTime();
      
      if (dayData) {
        // 有 API 資料的日期
        days.push({
          date: currentDate,
          isPast: false, // 常規課程沒有過期概念
          isToday: dayData.isToday,
          isCurrentMonth: true, // 周曆中所有日期都是有效的
          isBeyondTwoMonths: false, // 常規課程沒有太遠概念
          hasSchedule: dayData.hasSchedule,
          availableSlots: dayData.availableSlots || 0,
          totalSlots: dayData.totalSlots || 0,
          isFullyBooked: dayData.isFullyBooked || false,
          weekday: dayData.weekday
        });
      } else {
        // 沒有 API 資料的日期
        days.push({
          date: currentDate,
          isPast: false, // 常規課程沒有過期概念
          isToday,
          isCurrentMonth: true,
          isBeyondTwoMonths: false, // 常規課程沒有太遠概念
          hasSchedule: false,
          availableSlots: 0,
          totalSlots: 0,
          isFullyBooked: false,
          weekday
        });
      }
    }
    
    return days;
  }, [getCalendarDay, formData.courseNature, calendarData]);

  // 生成月份日曆的函數 - 使用 useMemo 避免無限循環（保留給試堂使用）
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
  }, [currentMonth, getCalendarDay, formData.courseNature, calendarData]);

  // 獲取選中日期的時段資訊 - 使用 useCallback 避免重複計算
  const getTimeSlotsForDate = useCallback((dateStr: string) => {
    if (!dateStr) return [];
    
    // 常規課程：處理星期幾選擇
    if (formData.courseNature === 'regular' && dateStr.startsWith('weekday-')) {
      const weekday = parseInt(dateStr.replace('weekday-', ''));
      const weekdayData = calendarData.find(day => day.weekday === weekday);
      
      if (!weekdayData || !weekdayData.timeSlots) {
        console.log(`📅 選中星期${weekday}: 沒有時段資料`);
        return [];
      }
      
      // 轉換為前端需要的格式
      const timeSlots = weekdayData.timeSlots.map((slot: any) => ({
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
      
      return timeSlots;
    }
    
    // 試堂課程：處理具體日期選擇
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
  }, [getCalendarDay, formData.courseNature]);

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

    // 測試模式下跳過大部分驗證
    if (isTestMode) {
      console.log('🧪 測試模式：跳過步驟', step, '的驗證');
      return newErrors;
    }

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
        if (!formData.childFullName) newErrors.childFullName = '請輸入您孩子全名';
        if (!formData.childBirthDate) newErrors.childBirthDate = '請選擇出生日期';
        if (!formData.childGender) newErrors.childGender = '請選擇您孩子性別';
        if (!formData.childPreferences) newErrors.childPreferences = '請輸入您孩子喜好物';
        break;
      case 3:
        // 等候區學生不需要選擇日期和時段
        if (!isWaitingList) {
        if (!formData.selectedDate) newErrors.selectedDate = '請選擇上課日期';
        if (!formData.selectedTimeSlot) newErrors.selectedTimeSlot = '請選擇上課時段';
        }
        break;
      case 4:
        // 驗證聯絡電話
        if (!formData.parentPhone) {
          newErrors.parentPhone = '請輸入聯絡電話';
        } else {
          const phoneValidation = validatePhoneNumber(formData.parentPhone, formData.parentCountryCode);
          if (!phoneValidation.isValid) {
            newErrors.parentPhone = phoneValidation.error || '電話號碼格式不正確';
          }
        }
        
        // 驗證電郵地址
        if (!formData.parentEmail) {
          newErrors.parentEmail = '請輸入電郵地址';
        } else {
          const emailValidation = validateEmail(formData.parentEmail);
          if (!emailValidation.isValid) {
            newErrors.parentEmail = emailValidation.error || '電郵地址格式不正確';
          }
        }
        
        if (!formData.parentTitle) newErrors.parentTitle = '請輸入您的稱呼';
        break;
      case 5:
        if (!formData.paymentMethod) newErrors.paymentMethod = '請選擇支付方法';
        // 如果選擇了上傳相片支付方式，需要檢查是否已上傳
        if (formData.paymentMethod === 'screenshot' && !formData.screenshotUploaded) {
          newErrors.screenshotUpload = '請先上傳付款截圖';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 自動保存孩子資料到 hanami_children 表
  const autoSaveChildData = async () => {
    try {
      // 獲取用戶信息
      const userResponse = await fetch('/api/children/get-user-by-email?email=tqfea12@gmail.com');
      const userResult = await userResponse.json();
      
      if (!userResult.success || !userResult.user) {
        console.log('無法獲取用戶信息，跳過自動保存');
        return;
      }
      
      const userId = userResult.user.id;
      
      // 檢查用戶是否已有孩子資料
      const checkResponse = await fetch(`/api/children?userId=${userId}`);
      const checkData = await checkResponse.json();
      
      if (checkResponse.ok && checkData.children && checkData.children.length > 0) {
        console.log('用戶已有孩子資料，跳過自動保存');
        return;
      }
      
      // 準備孩子資料
      const childData = {
        parent_id: userId,
        full_name: formData.childFullName,
        nick_name: formData.childNickname || null,
        birth_date: formData.childBirthDate,
        gender: formData.childGender === '男' ? '男孩' : '女孩',
        preferences: formData.childPreferences || null,
        health_notes: formData.childHealthNotes || null,
        allergies: null // 目前表單沒有過敏欄位
      };
      
      // 保存到 hanami_children 表
      const saveResponse = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData),
      });
      
      if (saveResponse.ok) {
        console.log('✅ 孩子資料已自動保存到個人資料');
      } else {
        console.log('⚠️ 自動保存孩子資料失敗，但不影響報名流程');
      }
    } catch (error) {
      console.log('⚠️ 自動保存孩子資料時發生錯誤，但不影響報名流程:', error);
    }
  };

  // 下一步
  const handleNext = async () => {
    if (isTestMode || validateStep(currentStep)) {
      // 如果當前是步驟2（孩子資料），自動保存孩子資料
      if (currentStep === 2) {
        await autoSaveChildData();
      }
      
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
  const handlePaymentSuccess = async (data: any) => {
    console.log('支付成功:', data);
    
    // 如果是 Airwallex 支付成功，直接自動提交並跳轉到確認頁面
    if (formData.paymentMethod === 'airwallex') {
      console.log('🚀 Airwallex 支付成功，開始自動提交資料...');
      
      try {
        // 自動執行提交邏輯
        await handleSubmit();
        
        // 跳轉到確認提交步驟
        setCurrentStep(6);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('✅ Airwallex 支付成功，資料已自動提交');
      } catch (error) {
        console.error('❌ Airwallex 支付成功但自動提交失敗:', error);
        // 如果自動提交失敗，仍然跳轉到確認頁面讓用戶手動提交
        setCurrentStep(6);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
    
    try {
      // 生成 student_oid (B840FAF 格式)
      const generateStudentOid = () => {
        const chars = '0123456789ABCDEF';
        let result = '';
        for (let i = 0; i < 7; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      // 計算年齡（以月為單位）
      let ageInMonths = null;
      if (formData.childBirthDate) {
        const birth = new Date(formData.childBirthDate);
        const now = new Date();
        const nowYear = now.getFullYear();
        const nowMonth = now.getMonth();
        let years = nowYear - birth.getFullYear();
        let months = nowMonth - birth.getMonth();
        if (now.getDate() < birth.getDate()) {
          months -= 1;
        }
        if (months < 0) {
          years -= 1;
          months += 12;
        }
        ageInMonths = years * 12 + months;
      }

      // 時間格式處理函數
      const formatTimeForDatabase = (timeSlot: string) => {
        if (!timeSlot) return null;
        
        // 取開始時間部分
        const startTime = timeSlot.split('-')[0].trim();
        console.log('🔍 處理時間:', { timeSlot, startTime });
        
        // 如果已經是 HH:MM:SS 格式，直接返回
        if (/^\d{2}:\d{2}:\d{2}$/.test(startTime)) {
          console.log('🔍 時間已經是正確格式:', startTime);
          return startTime;
        }
        
        // 如果是 HH:MM 格式，添加秒數
        if (/^\d{2}:\d{2}$/.test(startTime)) {
          const result = startTime + ':00';
          console.log('🔍 時間格式轉換:', { from: startTime, to: result });
          return result;
        }
        
        // 如果是 HH 格式，添加分秒
        if (/^\d{2}$/.test(startTime)) {
          const result = startTime + ':00:00';
          console.log('🔍 時間格式轉換:', { from: startTime, to: result });
          return result;
        }
        
        console.log('🔍 無法識別的時間格式:', startTime);
        return null;
      };

      // 根據課程性質決定插入到哪個表格
      if (formData.courseNature === 'trial') {
        // 試堂課程 - 插入到 hanami_trial_students
        const trialStudentData = {
          student_oid: generateStudentOid(),
          full_name: formData.childFullName || null,
          nick_name: formData.childNickname || null,
          student_dob: formData.childBirthDate || null,
          student_age: ageInMonths || null,
          contact_number: formData.parentCountryCode + formData.parentPhone || null,
          parent_email: formData.parentEmail || null,
          student_email: null,
          student_password: null,
          gender: formData.childGender || null,
          address: null,
          school: null,
          course_type: formData.courseType ? courseTypes.find(c => c.id === formData.courseType)?.name || null : null,
          student_type: '試堂',
          student_teacher: null,
          student_preference: formData.childPreferences || null,
          health_notes: formData.childHealthNotes || '沒有',
          weekday: formData.selectedDate ? new Date(formData.selectedDate).getDay().toString() : null,
          regular_weekday: formData.selectedDate ? new Date(formData.selectedDate).getDay().toString() : null,
          regular_timeslot: formatTimeForDatabase(formData.selectedTimeSlot),
          lesson_date: formData.selectedDate || null,
          lesson_duration: null,
          trial_status: 'pending',
          trial_remarks: formData.remarks || null,
          access_role: 'admin',
          duration_months: null,
          remaining_lessons: null,
          ongoing_lessons: null,
          upcoming_lessons: null,
          actual_timeslot: formatTimeForDatabase(formData.selectedTimeSlot)
        };

        console.log('🔍 準備插入到 hanami_trial_students 的資料:', trialStudentData);

        const { error: trialStudentError } = await supabase
          .from('hanami_trial_students')
          .insert([trialStudentData]);

        if (trialStudentError) {
          console.error('❌ 插入 hanami_trial_students 錯誤:', trialStudentError);
          alert('報名提交失敗，請稍後再試');
          return;
        } else {
          console.log('✅ 成功插入到 hanami_trial_students');
        }
      } else {
        // 常規課程 - 插入到 hanami_pending_students 待審核
        const selectedPlan = pricingPlans.find(p => p.id === formData.selectedPlan);
        const courseTypeName = courseTypes.find(c => c.id === formData.courseType)?.name || null;
        
        // 處理星期幾選擇（常規課程）
        let weekday = null;
        if (formData.selectedDate && formData.selectedDate.startsWith('weekday-')) {
          weekday = parseInt(formData.selectedDate.replace('weekday-', ''));
        }

        const pendingStudentData = {
          student_oid: generateStudentOid(),
          full_name: formData.childFullName || null,
          nick_name: formData.childNickname || null,
          student_dob: formData.childBirthDate || null,
          student_age: ageInMonths || null,
          contact_number: formData.parentCountryCode + formData.parentPhone || null,
          parent_email: formData.parentEmail || null,
          student_email: null,
          student_password: null,
          gender: formData.childGender || null,
          address: null,
          school: null,
          course_type: courseTypeName,
          student_type: '常規',
          student_teacher: null,
          student_preference: formData.childPreferences || null,
          student_remarks: formData.remarks || null,
          health_notes: formData.childHealthNotes || '沒有',
          regular_weekday: weekday,
          regular_timeslot: formatTimeForDatabase(formData.selectedTimeSlot),
          started_date: new Date().toISOString().split('T')[0],
          duration_months: selectedPlan?.package_lessons || null,
          ongoing_lessons: 0,
          upcoming_lessons: selectedPlan?.package_lessons || 0,
          access_role: 'admin',
          
          // 付款資訊
          payment_status: 'paid',
          payment_method: formData.paymentMethod || 'unknown',
          payment_amount: priceCalculation?.final_price || selectedPlan?.package_price || 0,
          payment_currency: 'HKD',
          payment_reference: `PAY_${Date.now()}`,
          
          // 課程計劃資訊
          selected_plan_id: formData.selectedPlan || null,
          selected_plan_name: selectedPlan?.plan_name || null,
          package_lessons: selectedPlan?.package_lessons || null,
          package_price: selectedPlan?.package_price || null,
          
          // 審核狀態
          review_status: 'pending'
        };

        console.log('🔍 準備插入到 hanami_pending_students 的資料:', pendingStudentData);

        const { error: pendingStudentError } = await supabase
          .from('hanami_pending_students')
          .insert([pendingStudentData]);

        if (pendingStudentError) {
          console.error('❌ 插入 hanami_pending_students 錯誤:', pendingStudentError);
          alert('報名提交失敗，請稍後再試');
          return;
        } else {
          console.log('✅ 成功插入到 hanami_pending_students');
        }
      }

      // 顯示成功訊息
      setShowSuccessModal(true);
      
      setTimeout(() => {
        router.push('/aihome/course-activities/hanami-music');
      }, 3000);
      
    } catch (error) {
      console.error('❌ 提交表單異常:', error);
      alert('提交時發生錯誤，請稍後再試');
    }
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

  // 移除未認證檢查 - 允許未登入用戶以訪客身份訪問
  // if (!user) return null;

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

              {/* 選單按鈕 - 只在登入時顯示 */}
              {user && (
                <motion.button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                  title="開啟選單"
                >
                  <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4B4036]" />
                </motion.button>
              )}
              
              {/* 測試模式切換按鈕 */}
              <motion.button
                onClick={() => setIsTestMode(!isTestMode)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  isTestMode 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
                title={isTestMode ? '測試模式：已啟用' : '測試模式：已停用'}
              >
                🧪 {isTestMode ? '測試模式' : '正常模式'}
              </motion.button>
              
              {/* 快速填入測試資料按鈕 */}
              {isTestMode && (
                <motion.button
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      ...testData
                    }));
                    console.log('🧪 已填入測試資料');
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border border-blue-300 transition-colors"
                  title="快速填入測試資料"
                >
                  📝 填入測試資料
                </motion.button>
              )}
              
              {/* 測試模式步驟跳轉 */}
              {isTestMode && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">步驟:</span>
                  {[0, 1, 2, 3, 4, 5].map((step) => (
                    <motion.button
                      key={step}
                      onClick={() => setCurrentStep(step)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                        currentStep === step
                          ? 'bg-[#FFD59A] text-[#4B4036]'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={`跳轉到步驟 ${step + 1}`}
                    >
                      {step + 1}
                    </motion.button>
                  ))}
                </div>
              )}
              
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
              {user ? (
                <>
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
                </>
              ) : (
                <>
                  <motion.button
                    onClick={() => router.push('/aihome/auth/login')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-2 text-sm text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                  >
                    登入
                  </motion.button>
                  <motion.button
                    onClick={() => router.push('/aihome/auth/register')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-2 text-sm bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium transition-all duration-200"
                  >
                    註冊
                  </motion.button>
                </>
              )}
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
        {/* 側邊欄選單 - 只在登入時顯示 */}
        {user && (
          <AppSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            currentPath="/aihome/course-activities/hanami-music/register"
          />
        )}

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
                    <p className="text-sm sm:text-base text-[#2B3A3B]">根據您孩子的需要和歲數，正在篩選最合適的時間</p>
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
                        <p className="text-sm text-[#2B3A3B]/70">正在為 {formData.childFullName || '您孩子'} 尋找最適合的課程時間</p>
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
                        onClick={() => {
                          console.log('🎯 用戶選擇常規課程');
                          setFormData(prev => ({ ...prev, courseNature: 'regular' }));
                        }}
                        className={`p-6 sm:p-8 rounded-2xl border-2 transition-all duration-200 ${
                          formData.courseNature === 'regular'
                            ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 shadow-lg'
                            : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                        }`}
                      >
                        <CheckCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-[#4B4036] mx-auto mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-[#4B4036] mb-2">常規課程</h3>
                        <p className="text-sm sm:text-base text-[#2B3A3B] mb-2">以優惠價惠價格，展開您孩子的學習之旅</p>
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
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br ${(course as any).color || 'from-blue-500 to-purple-600'} flex items-center justify-center flex-shrink-0`}>
                              {(course as any).icon && React.createElement((course as any).icon, { className: "w-6 h-6 sm:w-7 sm:h-7 text-white" })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-[#4B4036] mb-2 text-base sm:text-lg">{course.name}班</h3>
                              <div className="space-y-1.5">
                                {/* 年齡範圍 */}
                                <div className="flex items-center space-x-2">
                                  <UserGroupIcon className="w-4 h-4 text-[#4B4036] flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-[#2B3A3B]">
                                    {(course as any).age || '適合所有年齡'}
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
                        
                        {loadingPricing ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
                            <p className="text-[#2B3A3B]">載入課程計劃中...</p>
                          </div>
                        ) : pricingPlans.length === 0 ? (
                          <div className="text-center py-8 bg-white rounded-2xl border-2 border-[#EADBC8]">
                            <MusicalNoteIcon className="w-12 h-12 text-[#2B3A3B]/30 mx-auto mb-4" />
                            <p className="text-[#2B3A3B]">此課程暫無可用的課程計劃</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pricingPlans.map((plan) => {
                              const averagePricePerLesson = plan.package_lessons && plan.package_price 
                                ? hanamiAiPricingApi.pricingCalculationApi.calculateAveragePricePerLesson(
                                    plan.package_price, 
                                    plan.package_lessons
                                  )
                                : 0;
                              
                              return (
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
                                  {plan.is_featured && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                      最多人選擇
                                    </div>
                                  )}
                                  <h4 className="text-base sm:text-lg font-bold text-[#4B4036] mb-2">{plan.plan_name}</h4>
                                  {plan.plan_description && (
                                    <p className="text-xs sm:text-sm text-[#2B3A3B] mb-3">{plan.plan_description}</p>
                                  )}
                                  <div className="mb-2 text-center">
                                    {plan.price_per_lesson && plan.package_lessons && (
                                      <div className="text-sm text-gray-400 line-through mb-1">
                                        {hanamiAiPricingApi.formatPrice(plan.price_per_lesson * plan.package_lessons, plan.currency)}
                                      </div>
                                    )}
                                    <div className="text-xl sm:text-2xl font-bold text-[#4B4036]">
                                      {hanamiAiPricingApi.formatPrice(plan.package_price || 0, plan.currency)}
                                    </div>
                                  </div>
                                  <p className="text-xs text-[#2B3A3B]">
                                    {plan.package_lessons} 堂課程
                                    {averagePricePerLesson > 0 && (
                                      <span className="block mt-1 text-green-600">
                                        平均每堂 {hanamiAiPricingApi.formatPrice(averagePricePerLesson, plan.currency)}
                                      </span>
                                    )}
                                  </p>
                                </motion.button>
                              );
                            })}
                          </div>
                        )}


                        {/* 價格計算結果 */}
                        {priceCalculation && formData.selectedPlan && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                            <h4 className="text-sm font-semibold text-green-800 mb-3">價格明細</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-green-700">課程包原價：</span>
                                <span className="font-medium">{hanamiAiPricingApi.formatPrice(priceCalculation.base_price, priceCalculation.currency)}</span>
                              </div>
                              {priceCalculation.discount_amount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>優惠折扣：</span>
                                  <span className="font-medium">-{hanamiAiPricingApi.formatPrice(priceCalculation.discount_amount, priceCalculation.currency)}</span>
                                </div>
                              )}
                              <div className="border-t border-green-300 pt-2">
                                <div className="flex justify-between">
                                  <span className="font-semibold text-green-800">最終價格：</span>
                                  <span className="text-lg font-bold text-green-800">
                                    {hanamiAiPricingApi.formatPrice(priceCalculation.final_price, priceCalculation.currency)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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

                {/* 步驟 2: 您孩子資料 */}
                {currentStep === 2 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center mb-6 sm:mb-8">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036]">您孩子資料</h2>
                        <button
                          onClick={loadExistingChildren}
                          disabled={loadingChildren}
                          className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-xl hover:bg-[#EBC9A4] transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingChildren ? (
                            <>
                              <div className="w-4 h-4 border-2 border-[#4B4036] border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm font-medium">載入中...</span>
                            </>
                          ) : (
                            <>
                              <ArrowPathIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">載入現有資料</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-sm sm:text-base text-[#2B3A3B]">請填寫您孩子的基本資料</p>
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
                          placeholder="請輸入您孩子全名"
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
                          性別 <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFormData(prev => ({ ...prev, childGender: '男' }))}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              formData.childGender === '男'
                                ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20'
                                : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                            }`}
                          >
                            <div className="text-center">
                              <div className="mb-2 flex justify-center">
                                <img 
                                  src="/boy.png" 
                                  alt="男孩" 
                                  className="w-12 h-12 object-contain"
                                />
                              </div>
                              <span className="font-medium text-[#4B4036]">男孩</span>
                            </div>
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFormData(prev => ({ ...prev, childGender: '女' }))}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              formData.childGender === '女'
                                ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20'
                                : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                            }`}
                          >
                            <div className="text-center">
                              <div className="mb-2 flex justify-center">
                                <img 
                                  src="/girl.png" 
                                  alt="女孩" 
                                  className="w-12 h-12 object-contain"
                                />
                              </div>
                              <span className="font-medium text-[#4B4036]">女孩</span>
                            </div>
                          </motion.button>
                        </div>
                        {errors.childGender && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            {errors.childGender}
                          </p>
                        )}
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
                          placeholder="例如：過敏、特殊健康狀況、需要特別注意的事項等"
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
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036] mb-2">
                        {formData.courseNature === 'regular' ? '常規課程日曆（周曆顯示）' : '選擇日期與時段'}
                      </h2>
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
                              // 跳轉到等候區註冊頁面
                              router.push('/aihome/registration');
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

                    {/* 月份導航（僅試堂顯示） */}
                    {formData.courseNature === 'trial' && (
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
                    )}

                    {/* 日曆 */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
                      {loadingSchedule ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
                          <p className="text-[#2B3A3B]">載入排程中...</p>
                        </div>
                      ) : (
                        <>
                        {formData.courseNature === 'regular' ? (
                          /* 周曆顯示 - 只顯示一週 */
                          <div className="space-y-4">
                            {/* 週標題 */}
                            <div className="text-center">
                              <h3 className="text-lg font-bold text-[#4B4036]">
                                {formData.courseNature === 'regular' ? '星期課程安排' : '本週課程安排'}
                              </h3>
                            </div>
                            
                            {/* 星期標題 */}
                            <div className="grid grid-cols-7 gap-2">
                              {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                                <div key={day} className="text-center text-sm font-bold text-[#4B4036] py-2 bg-[#FFF9F2] rounded-lg">
                                  {day}
                                </div>
                              ))}
                            </div>
                            
                            {/* 日期格子 */}
                            <div className="grid grid-cols-7 gap-2">
                              {generateWeekCalendar.map((day, dayIndex) => {
                                const dateStr = day.date ? day.date.toLocaleDateString('en-CA') : `weekday-${day.weekday}`;
                                const isSelected = selectedDate === dateStr;
                                
                                return (
                                  <motion.button
                                    key={dayIndex}
                                    type="button"
                                    disabled={day.isFullyBooked}
                                    whileHover={!day.isFullyBooked ? { scale: 1.02 } : {}}
                                    whileTap={!day.isFullyBooked ? { scale: 0.98 } : {}}
                                    onClick={() => {
                                      if (!day.isFullyBooked) {
                                        setSelectedDate(dateStr);
                                        setFormData(prev => ({ ...prev, selectedDate: dateStr }));
                                      }
                                    }}
                                    className={`relative p-2 rounded-xl border-2 transition-all duration-200 min-h-[60px] flex flex-col justify-center items-center ${
                                      isSelected
                                        ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-lg'
                                        : day.isFullyBooked
                                        ? 'border-red-200 bg-red-50 text-red-600 cursor-not-allowed'
                                        : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50 hover:bg-[#FFF9F2]'
                                    }`}
                                  >
                                    <div className="text-center w-full">
                                      <p className={`text-sm font-bold mb-1 ${
                                        day.isToday ? 'text-[#FFD59A]' : ''
                                      }`}>
                                        {formData.courseNature === 'regular' 
                                          ? (day as any).weekdayName || getWeekdayName((day as any).weekday)
                                          : day.date?.getDate() || ''
                                        }
                                      </p>
                                      
                                      {/* 位置狀態指示 */}
                                      <div className="mt-1">
                                        {(day as any).isRestDay ? (
                                          <div className="flex items-center justify-center">
                                            <span className="text-xs text-gray-500 font-bold bg-gray-100 px-1 py-0.5 rounded-full">
                                              休息
                                            </span>
                                          </div>
                                        ) : day.isFullyBooked ? (
                                          <div className="flex items-center justify-center">
                                            <span className="text-xs text-red-600 font-bold bg-red-100 px-1 py-0.5 rounded-full">
                                              已滿
                                            </span>
                                          </div>
                                        ) : day.hasSchedule ? (
                                          <div className="flex items-center justify-center">
                                            {(() => {
                                              const availableSlots = day.availableSlots || 0;
                                              let colorClass = '';
                                              if (availableSlots <= 3) {
                                                colorClass = 'text-red-600 bg-red-100'; // 1-3個位置：紅色
                                              } else if (availableSlots <= 5) {
                                                colorClass = 'text-orange-600 bg-orange-100'; // 4-5個位置：橙色
                                              } else {
                                                colorClass = 'text-green-600 bg-green-100'; // 5個以上：綠色
                                              }
                                              return (
                                                <span className={`text-xs font-bold px-1 py-0.5 rounded-full ${colorClass}`}>
                                                  {availableSlots}/{day.totalSlots}
                                                </span>
                                              );
                                            })()}
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-center">
                                            <span className="text-xs text-gray-500 font-bold bg-gray-100 px-1 py-0.5 rounded-full">
                                              無課
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* 月曆顯示（試堂） */
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
                                const dateStr = day.date ? day.date.toLocaleDateString('en-CA') : `weekday-${day.weekday}`; // 使用本地日期格式
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
                                        {formData.courseNature === 'regular' 
                                          ? (day as any).weekdayName || getWeekdayName((day as any).weekday)
                                          : day.date?.getDate() || ''
                                        }
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
                                                    ? 'text-red-500 bg-red-100' 
                                                    : day.availableSlots <= 5 
                                                    ? 'text-orange-500 bg-orange-100' 
                                                    : 'text-green-500 bg-green-100'
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
                              {formData.courseNature === 'regular' && selectedDate.startsWith('weekday-') 
                                ? `星期${getWeekdayName(parseInt(selectedDate.replace('weekday-', '')))}`
                                : new Date(selectedDate).toLocaleDateString('zh-TW', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    weekday: 'long'
                                  })
                              }
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
                              disabled={!slot.available} // 已滿員的時段無法點擊
                              whileHover={{ scale: slot.available ? 1.02 : 1 }}
                              whileTap={{ scale: slot.available ? 0.98 : 1 }}
                              onClick={() => {
                                if (slot.available) {
                                  setFormData(prev => ({ ...prev, selectedTimeSlot: slot.time }));
                                }
                              }}
                                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                isSelected
                                      ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-lg'
                                  : slot.available
                                      ? 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50 hover:bg-[#FFF9F2]'
                                      : 'border-red-200 bg-red-50 text-red-600 hover:border-red-300'
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
                                          ? 'text-red-600 bg-red-100' 
                                          : slot.remainingSpots <= 5 
                                          ? 'text-orange-600 bg-orange-100' 
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
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036]">聯絡方式</h2>
                        <button
                          onClick={loadCurrentUserData}
                          className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-xl hover:bg-[#EBC9A4] transition-colors shadow-lg hover:shadow-xl"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">載入我的資料</span>
                        </button>
                      </div>
                      <p className="text-sm sm:text-base text-[#2B3A3B]">請填寫聯絡資料</p>
                      
                      {/* 等候區狀態顯示 */}
                      {isWaitingList && (
                        <div className="mt-4 bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-4 border border-[#EADBC8]">
                          <div className="flex items-center justify-center gap-2 text-[#4B4036] mb-2">
                            <UserIcon className="w-5 h-5" />
                            <span className="font-medium">
                              {waitingListType === 'existing' ? '等候區學生' : '新加入等候區'}
                            </span>
                          </div>
                          <p className="text-sm text-[#2B3A3B] mb-3">
                            {waitingListType === 'existing' 
                              ? '您已在等候名單中，已為您優先安排課程'
                              : '您已加入等候區，有合適時間時我們會優先通知您'
                            }
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
                        <PhoneInput
                          value={formData.parentPhone}
                          countryCode={formData.parentCountryCode}
                          onChange={(phone, countryCode) => {
                            setFormData(prev => ({ 
                              ...prev, 
                              parentPhone: phone,
                              parentCountryCode: countryCode
                            }));
                            // 清除錯誤
                            if (errors.parentPhone) {
                              setErrors(prev => ({ ...prev, parentPhone: '' }));
                            }
                          }}
                          placeholder="請輸入電話號碼"
                          error={errors.parentPhone}
                          required
                        />
                      </div>

                      {/* 電郵地址 - 必填 */}
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-2">
                          電郵地址 <span className="text-red-500">*</span>
                        </label>
                        <EmailInput
                          value={formData.parentEmail}
                          onChange={(email) => {
                            setFormData(prev => ({ ...prev, parentEmail: email }));
                            // 清除錯誤
                            if (errors.parentEmail) {
                              setErrors(prev => ({ ...prev, parentEmail: '' }));
                            }
                          }}
                          placeholder="請輸入電郵地址"
                          error={errors.parentEmail}
                          required
                          showValidation
                        />
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
                    onMethodChange={(methodId) => setFormData(prev => ({ ...prev, paymentMethod: methodId, screenshotUploaded: false }))}
                    amount={formData.courseNature === 'trial' ? 168 : (() => {
                      if (priceCalculation) {
                        return priceCalculation.final_price;
                      }
                      const selectedPlan = pricingPlans.find(p => p.id === formData.selectedPlan);
                      return selectedPlan ? selectedPlan.package_price || 0 : 0;
                    })()}
                    currency="HKD"
                    description={formData.courseNature === 'trial' 
                      ? `試堂報名 - ${courseTypes.find(c => c.id === formData.courseType)?.name}班`
                      : `常規課程報名 - ${courseTypes.find(c => c.id === formData.courseType)?.name}班 - ${pricingPlans.find(p => p.id === formData.selectedPlan)?.plan_name}`
                    }
                    onPaymentSuccess={(data) => {
                      // 檢查是否為圖片刪除事件
                      if (data.screenshotDeleted) {
                        // 圖片被刪除，重置上傳狀態
                        setFormData(prev => ({ ...prev, screenshotUploaded: false }));
                        console.log('🔄 圖片已刪除，重置上傳狀態');
                      } else if (formData.paymentMethod === 'screenshot') {
                        // 當支付成功時，標記截圖已上傳
                        setFormData(prev => ({ ...prev, screenshotUploaded: true }));
                        console.log('✅ 截圖上傳成功，允許繼續');
                      }
                      handlePaymentSuccess(data);
                    }}
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
                                {pricingPlans.find(p => p.id === formData.selectedPlan)?.plan_name}
                              </span>
                            </p>
                          )}
                          {!isWaitingList && (
                            <>
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">上課日期：</span>
                            <span className="font-medium text-[#4B4036]">
                              {formData.courseNature === 'regular' && formData.selectedDate.startsWith('weekday-') 
                                ? `星期${getWeekdayName(parseInt(formData.selectedDate.replace('weekday-', '')))}`
                                : new Date(formData.selectedDate).toLocaleDateString('zh-TW')
                              }
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
                        <h3 className="text-base sm:text-lg font-bold text-[#4B4036] mb-3">您孩子資料</h3>
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
                          <p className="flex justify-between">
                            <span className="text-[#2B3A3B]">性別：</span>
                            <span className="font-medium text-[#4B4036]">{formData.childGender}</span>
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
                            <span className="font-medium text-[#4B4036]">{formData.parentCountryCode} {formData.parentPhone}</span>
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

      {/* 底部導航按鈕 - 改為相對定位 */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-[#EADBC8] mt-8 mb-15"> 
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
                disabled={currentStep === 5 && formData.paymentMethod === 'screenshot' && !formData.screenshotUploaded}
                whileHover={!(currentStep === 5 && formData.paymentMethod === 'screenshot' && !formData.screenshotUploaded) ? { scale: 1.02 } : {}}
                whileTap={!(currentStep === 5 && formData.paymentMethod === 'screenshot' && !formData.screenshotUploaded) ? { scale: 0.98 } : {}}
                className={`flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold shadow-lg transition-all duration-200 flex-1 ${
                  currentStep === 5 && formData.paymentMethod === 'screenshot' && !formData.screenshotUploaded
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:shadow-xl'
                }`}
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

      {/* 您孩子選擇模態框 */}
      <ChildSelectionModal
        isOpen={showChildSelection}
        onClose={() => setShowChildSelection(false)}
        children={availableChildren}
        onSelectChild={handleChildSelection}
        loading={loadingChildren}
      />
    </div>
  );
}

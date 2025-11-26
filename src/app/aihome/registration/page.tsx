'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SunIcon,
  MoonIcon,
  AcademicCapIcon,
  SparklesIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { MusicalNoteIcon as PianoIcon } from '@heroicons/react/24/solid';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import PhoneInput from '@/components/ui/PhoneInput';
import EmailInput from '@/components/ui/EmailInput';
import { validatePhoneNumber, validateEmail } from '@/lib/validationUtils';
import { getSupabaseClient } from '@/lib/supabase';

export default function WaitingListRegistrationPage() {
  const router = useRouter();
  const { user, loading } = useSaasAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 表單資料
  const [formData, setFormData] = useState({
    parentName: '',
    parentPhone: '',
    parentCountryCode: '+852',
    parentEmail: '',
    parentTitle: '',
    childName: '',
    childBirthDate: '',
    childAgeInMonths: null as number | null,
    childSchool: '',
    childSchoolSchedule: '',
    selectedInstitution: '',
    selectedCourse: '',
    availableTimes: [] as string[],
    remarks: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [childAge, setChildAge] = useState<number | null>(null);

  // 更新時間
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 計算孩子年齡（以月為單位）
  useEffect(() => {
    if (formData.childBirthDate) {
      const birthDate = new Date(formData.childBirthDate);
      const today = new Date();

      // 計算年歲（用於顯示）
      let ageInYears = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        ageInYears--;
      }

      // 計算月齡（用於資料庫存儲）
      let ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
      if (today.getDate() < birthDate.getDate()) {
        ageInMonths--;
      }

      setChildAge(ageInYears);

      // 更新表單資料中的月齡
      setFormData(prev => ({ ...prev, childAgeInMonths: ageInMonths }));
    } else {
      setChildAge(null);
      setFormData(prev => ({ ...prev, childAgeInMonths: null }));
    }
  }, [formData.childBirthDate]);

  // 計算年齡範圍顯示文字 - 參考 page.tsx 中的邏輯
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

  // 圖片圖標對應表 - 移到組件頂層
  const imageIconMap: Record<string, string> = {
    'piano': '/HanamiMusic/piano.png',  // 鋼琴課程使用鋼琴圖片
    'focus': '/HanamiMusic/musicclass.png',  // 專注力班使用音樂課堂圖片
    'musical-note': '/HanamiMusic/musicclass.png',  // 音樂專注力也使用音樂課堂圖片
    '鋼琴': '/HanamiMusic/piano.png',  // 鋼琴課程使用鋼琴圖片
    '音樂專注力': '/HanamiMusic/musicclass.png',  // 音樂專注力班使用音樂課堂圖片
    '音樂專注力班': '/HanamiMusic/musicclass.png'  // 音樂專注力班使用音樂課堂圖片
  };

  // 載入機構和課程資料
  useEffect(() => {
    const loadInstitutionsAndCourses = async () => {
      try {
        setLoadingInstitutions(true);

        // 載入課程類型
        const { data: courseData, error: courseError } = await (getSupabaseClient()
          .from('Hanami_CourseTypes') as any)
          .select('*')
          .eq('status', true)
          .order('display_order', { ascending: true });

        if (courseError) {
          console.error('載入課程類型失敗:', courseError);
          return;
        }

        console.log('📊 從資料庫讀取的原始課程資料:', courseData);

        // 為每個課程添加顯示屬性 - 參考 page.tsx 中的邏輯
        const coursesWithDisplay = (courseData || []).map((course: any, index: number) => {
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

        // 模擬機構資料（可以從資料庫載入）
        const institutionData = [
          {
            id: 'hanami-music',
            name: 'Hanami Music 花見音樂',
            logo: '/@hanami.png',
            description: '專業音樂教育機構，提供創新的音樂教學方法',
            location: '香港'
          }
        ];

        setInstitutions(institutionData);
        setCourses(coursesWithDisplay);
        console.log('✅ 成功載入課程（完整資料）:', coursesWithDisplay);

        // 自動選擇第一個機構和課程
        if (institutionData.length > 0) {
          setFormData(prev => ({ ...prev, selectedInstitution: institutionData[0].id }));
        }
        if (coursesWithDisplay.length > 0) {
          setFormData(prev => ({ ...prev, selectedCourse: coursesWithDisplay[0].id }));
        }

      } catch (error) {
        console.error('載入機構和課程失敗:', error);
      } finally {
        setLoadingInstitutions(false);
      }
    };

    loadInstitutionsAndCourses();
  }, []);

  // 初始化用戶資料，處理已包含國碼的電話號碼（如果有登入用戶）
  useEffect(() => {
    if (user) {
      // 如果有用戶資料，預填表單
      setFormData(prev => ({
        ...prev,
        parentName: user.full_name || '',
        parentEmail: user.email || ''
      }));

      // 處理電話號碼
      if (user.phone) {
        const countryCodes = ['+852', '+86', '+886', '+65', '+60', '+66', '+84', '+63', '+62', '+1', '+44', '+81', '+82', '+61', '+64'];
        const foundCountry = countryCodes.find(code => user.phone!.startsWith(code));

        if (foundCountry) {
          const phoneOnly = user.phone!.replace(foundCountry, '').trim();
          setFormData(prev => ({
            ...prev,
            parentPhone: phoneOnly,
            parentCountryCode: foundCountry
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            parentPhone: user.phone!
          }));
        }
      }
    }
  }, [user]);

  // 移除認證保護 - 允許未登入用戶訪問等候區註冊頁面

  // 表單驗證
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

    if (!formData.parentTitle) {
      newErrors.parentTitle = '請輸入您的稱呼';
    }

    if (!formData.childName) {
      newErrors.childName = '請輸入孩子姓名';
    }

    if (!formData.childBirthDate) {
      newErrors.childBirthDate = '請選擇孩子出生日期';
    }

    if (!formData.childSchool) {
      newErrors.childSchool = '請輸入孩子就讀的學校';
    }

    if (!formData.childSchoolSchedule) {
      newErrors.childSchoolSchedule = '請選擇孩子的上課時段';
    }

    if (!formData.selectedInstitution) {
      newErrors.selectedInstitution = '請選擇機構';
    }

    if (!formData.selectedCourse) {
      newErrors.selectedCourse = '請選擇課程';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表單
  const handleSubmit = async () => {
    if (!validateForm()) {
      console.log('表單驗證失敗');
      return;
    }

    setIsSubmitting(true);

    try {
      // 將有空時間轉換為資料庫格式
      const convertAvailableTimesToDatabaseFormat = (availableTimes: string[]) => {
        const dayMap: Record<string, number> = {
          '星期日': 0,
          '星期一': 1,
          '星期二': 2,
          '星期三': 3,
          '星期四': 4,
          '星期五': 5,
          '星期六': 6
        };

        const weekNumbers: number[] = [];

        availableTimes.forEach(timeKey => {
          const [day] = timeKey.split('-');
          if (dayMap[day] !== undefined) {
            weekNumbers.push(dayMap[day]);
          }
        });

        // 去重並排序
        const uniqueWeekNumbers = [...new Set(weekNumbers)].sort((a, b) => a - b);

        // 根據 CSV 數據格式，返回包含 week 和 range 的對象
        return {
          week: uniqueWeekNumbers,
          range: null
        };
      };

      const preferTimeData = convertAvailableTimesToDatabaseFormat(formData.availableTimes);

      // 獲取選中的機構和課程信息
      const selectedInstitution = institutions.find(inst => inst.id === formData.selectedInstitution);
      const selectedCourse = courses.find(course => course.id === formData.selectedCourse);

      // 準備提交資料 - 只使用基本欄位避免 schema 問題
      const submitData: any = {
        full_name: formData.parentName,
        phone_no: formData.parentCountryCode + formData.parentPhone,
        status: '未試堂'
      };

      // 添加孩子資訊 - 根據資料庫表結構調整欄位名稱
      if (formData.childBirthDate) {
        submitData.student_dob = formData.childBirthDate;
      }

      if (formData.childAgeInMonths !== null) {
        submitData.student_age = formData.childAgeInMonths;
      }

      // 只添加確實存在的欄位
      if (formData.childSchool) {
        submitData.school = formData.childSchool;
      }

      if (formData.childSchoolSchedule) {
        submitData.school_schedule = formData.childSchoolSchedule;
      }

      if (selectedCourse) {
        submitData.course_types = [selectedCourse.name];
      }

      if (formData.availableTimes.length > 0) {
        submitData.prefer_time = preferTimeData;
      }

      // 準備備註內容，包含孩子姓名
      let notesContent = '';
      if (formData.childName) {
        notesContent += `孩子姓名：${formData.childName}`;
      }
      if (formData.remarks && formData.remarks.trim()) {
        if (notesContent) notesContent += '\n';
        notesContent += formData.remarks.trim();
      }

      if (notesContent) {
        submitData.notes = notesContent;
      }

      console.log('準備提交的資料:', submitData);
      console.log('年齡計算結果:', {
        childAgeInYears: childAge,
        childAgeInMonths: formData.childAgeInMonths,
        childBirthDate: formData.childBirthDate
      });
      console.log('資料類型檢查:', {
        full_name: typeof submitData.full_name,
        phone_no: typeof submitData.phone_no,
        student_dob: typeof submitData.student_dob,
        student_age: typeof submitData.student_age,
        school: typeof submitData.school,
        school_schedule: typeof submitData.school_schedule,
        course_types: typeof submitData.course_types,
        prefer_time: typeof submitData.prefer_time,
        notes: typeof submitData.notes,
        status: typeof submitData.status
      });

      // 提交到等候區 - 使用基本的插入操作
      const supabaseClient = getSupabaseClient();

      // 先嘗試完整的插入操作
      let { data, error } = await (supabaseClient
        .from('hanami_trial_queue') as any)
        .insert(submitData)
        .select();

      console.log('Supabase 回應:', { data, error });

      // 如果失敗，嘗試只插入基本欄位
      if (error && error.code === 'PGRST204') {
        console.log('嘗試使用基本欄位插入...');
        const basicData = {
          full_name: formData.parentName,
          phone_no: formData.parentCountryCode + formData.parentPhone,
          status: '未試堂'
        };

        const basicResult = await (supabaseClient
          .from('hanami_trial_queue') as any)
          .insert(basicData)
          .select();

        data = basicResult.data;
        error = basicResult.error;

        console.log('基本插入結果:', { data, error });
      }

      if (error) {
        console.error('提交等候區失敗:', error);
        console.error('錯誤詳情:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`提交失敗: ${error.message}`);
        return;
      }

      console.log('提交成功:', data);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('提交等候區錯誤:', error);
      alert(`提交失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 返回課程報名頁面
  const handleBack = () => {
    router.push('/aihome/course-activities/register');
  };

  // 顯示載入狀態
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 返回按鈕 */}
          <motion.button
            onClick={handleBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center text-[#4B4036] hover:text-[#2B3A3B] transition-colors duration-200 mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            返回課程報名
          </motion.button>

          {/* 主要內容 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
          >
            {/* 標題 */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#4B4036] mb-2">等候區註冊</h1>
              <p className="text-sm sm:text-base text-[#2B3A3B]"><span className="text-[#FF6B6B] font-bold text-base sm:text-lg">請填寫</span>聯絡資料，我們將會在<span className="text-[#FF6B6B] font-bold text-base sm:text-lg">有位時第一時間通知您</span></p>
            </div>

            {/* 表單 */}
            <div className="space-y-4 sm:space-y-6">
              {/* 您的稱呼 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  您的稱呼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.parentTitle}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, parentTitle: e.target.value }));
                    if (errors.parentTitle) {
                      setErrors(prev => ({ ...prev, parentTitle: '' }));
                    }
                  }}
                  className={`w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 transition-all duration-200 ${errors.parentTitle
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#EADBC8] focus:border-[#FFD59A]'
                    } focus:outline-none`}
                  placeholder="請輸入您的稱呼"
                />
                {errors.parentTitle && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.parentTitle}
                  </p>
                )}
              </div>

              {/* 聯絡電話 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  聯絡電話 <span className="text-red-500">*</span>
                  <span className="text-gray-500 text-xs ml-2">(建議填<span className="text-[#FF6B6B] font-bold text-base sm:text-lg">Whatsapp電話</span>)</span>
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
                    if (errors.parentPhone) {
                      setErrors(prev => ({ ...prev, parentPhone: '' }));
                    }
                  }}
                  placeholder="請輸入電話號碼"
                  error={errors.parentPhone}
                  required
                />
              </div>

              {/* 電郵地址 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  電郵地址 <span className="text-red-500">*</span>
                </label>
                <EmailInput
                  value={formData.parentEmail}
                  onChange={(email) => {
                    setFormData(prev => ({ ...prev, parentEmail: email }));
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

              {/* 孩子姓名 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  孩子姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.childName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, childName: e.target.value }));
                    if (errors.childName) {
                      setErrors(prev => ({ ...prev, childName: '' }));
                    }
                  }}
                  className={`w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 transition-all duration-200 ${errors.childName
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#EADBC8] focus:border-[#FFD59A]'
                    } focus:outline-none`}
                  placeholder="請輸入孩子姓名"
                />
                {errors.childName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.childName}
                  </p>
                )}
              </div>

              {/* 孩子出生日期 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  孩子出生日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.childBirthDate}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, childBirthDate: e.target.value }));
                    if (errors.childBirthDate) {
                      setErrors(prev => ({ ...prev, childBirthDate: '' }));
                    }
                  }}
                  className={`w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 transition-all duration-200 ${errors.childBirthDate
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#EADBC8] focus:border-[#FFD59A]'
                    } focus:outline-none`}
                />
                {errors.childBirthDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.childBirthDate}
                  </p>
                )}
                {childAge !== null && formData.childAgeInMonths !== null && (
                  <p className="mt-1 text-sm text-[#2B3A3B]">
                    年齡：{childAge} 歲 ({formData.childAgeInMonths} 個月)
                  </p>
                )}
              </div>

              {/* 機構選擇 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  選擇機構 <span className="text-red-500">*</span>
                </label>
                {loadingInstitutions ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFD59A]"></div>
                    <span className="ml-2 text-[#2B3A3B]">載入機構中...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {institutions.map((institution) => (
                      <motion.button
                        key={institution.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, selectedInstitution: institution.id }));
                          if (errors.selectedInstitution) {
                            setErrors(prev => ({ ...prev, selectedInstitution: '' }));
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${formData.selectedInstitution === institution.id
                            ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#4B4036]'
                            : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50 text-[#4B4036]'
                          }`}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 mr-4">
                            <img
                              src={institution.logo}
                              alt={institution.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{institution.name}</h3>
                            <p className="text-sm opacity-75">{institution.description}</p>
                            <p className="text-xs opacity-60">{institution.location}</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
                {errors.selectedInstitution && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.selectedInstitution}
                  </p>
                )}
              </div>

              {/* 課程選擇 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  選擇課程 <span className="text-red-500">*</span>
                </label>
                {loadingInstitutions ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFD59A]"></div>
                    <span className="ml-2 text-[#2B3A3B]">載入課程中...</span>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border-2 border-[#EADBC8]">
                    <MusicalNoteIcon className="w-16 h-16 text-[#2B3A3B]/30 mx-auto mb-4" />
                    <p className="text-[#2B3A3B]">目前沒有可用的課程</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courses.map((course) => (
                      <motion.button
                        key={course.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, selectedCourse: course.id }));
                          if (errors.selectedCourse) {
                            setErrors(prev => ({ ...prev, selectedCourse: '' }));
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 text-left relative ${formData.selectedCourse === course.id
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
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br ${course.color} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                            {imageIconMap[course.name] || imageIconMap[course.icon_type] ? (
                              <img
                                src={imageIconMap[course.name] || imageIconMap[course.icon_type]}
                                alt={course.name}
                                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                              />
                            ) : (
                              <course.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            )}
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
                {errors.selectedCourse && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.selectedCourse}
                  </p>
                )}
              </div>

              {/* 孩子學校信息 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  孩子就讀學校 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.childSchool}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, childSchool: e.target.value }));
                    if (errors.childSchool) {
                      setErrors(prev => ({ ...prev, childSchool: '' }));
                    }
                  }}
                  className={`w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 transition-all duration-200 ${errors.childSchool
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#EADBC8] focus:border-[#FFD59A]'
                    } focus:outline-none`}
                  placeholder="請輸入孩子就讀的學校名稱"
                />
                {errors.childSchool && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.childSchool}
                  </p>
                )}
              </div>

              {/* 學校上課時段 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  學校上課時段 <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-[#2B3A3B]/70 mb-3">請選擇孩子目前在學校的上課時段</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'morning', label: '上午班', icon: SunIcon, description: '上午時段上課', color: 'text-yellow-500' },
                    { value: 'afternoon', label: '下午班', icon: MoonIcon, description: '下午時段上課', color: 'text-orange-500' },
                    { value: 'fulltime', label: '全日制', icon: AcademicCapIcon, description: '全天課程', color: 'text-blue-500' }
                  ].map((schedule) => (
                    <motion.button
                      key={schedule.value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, childSchoolSchedule: schedule.value }));
                        if (errors.childSchoolSchedule) {
                          setErrors(prev => ({ ...prev, childSchoolSchedule: '' }));
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${formData.childSchoolSchedule === schedule.value
                          ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-[#4B4036]'
                          : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50 text-[#4B4036]'
                        }`}
                    >
                      <div className="flex items-center mb-2">
                        <schedule.icon className={`w-6 h-6 mr-3 ${schedule.color}`} />
                        <span className="font-semibold">{schedule.label}</span>
                      </div>
                      <p className="text-sm opacity-75">{schedule.description}</p>
                    </motion.button>
                  ))}
                </div>
                {errors.childSchoolSchedule && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.childSchoolSchedule}
                  </p>
                )}
              </div>

              {/* 有空時間 */}
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
                              className={`w-full px-3 py-2 text-xs rounded-lg border-2 transition-all duration-200 ${isSelected
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

              {/* 備註 */}
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  備註 <span className="text-gray-500 text-xs">(選填)</span>
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-4 py-3 sm:py-4 text-base rounded-xl border-2 border-[#EADBC8] focus:border-[#FFD59A] focus:outline-none transition-all duration-200 resize-none"
                  rows={4}
                  placeholder="請輸入任何特殊需求或備註"
                />
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="mt-8">
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting}
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${isSubmitting
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:shadow-lg'
                  }`}
              >
                {isSubmitting ? '提交中...' : '提交等候區申請'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 成功模態框 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-[#4B4036] mb-2">申請成功！</h3>
            <p className="text-[#2B3A3B] mb-4">
              您已成功加入等候區，我們會根據孩子的學校時段安排，有合適時間時優先通知您。
            </p>
            <div className="bg-[#FFF9F2] rounded-lg p-3 mb-6 text-sm">
              <p className="text-[#4B4036] font-medium">申請信息：</p>
              <p className="text-[#2B3A3B]">
                機構：{institutions.find(inst => inst.id === formData.selectedInstitution)?.name || 'Hanami Music 花見音樂'}
              </p>
              <p className="text-[#2B3A3B]">
                課程：{courses.find(course => course.id === formData.selectedCourse)?.name || '未選擇'}
              </p>
              <p className="text-[#2B3A3B]">孩子姓名：{formData.childName}</p>
              <p className="text-[#2B3A3B]">
                出生日期：{formData.childBirthDate ? new Date(formData.childBirthDate).toLocaleDateString('zh-TW') : '未填寫'}
              </p>
              {childAge !== null && formData.childAgeInMonths !== null && (
                <p className="text-[#2B3A3B]">年齡：{childAge} 歲 ({formData.childAgeInMonths} 個月)</p>
              )}
              <p className="text-[#2B3A3B]">學校：{formData.childSchool}</p>
              <p className="text-[#2B3A3B]">
                時段：{formData.childSchoolSchedule === 'morning' ? '上午班' :
                  formData.childSchoolSchedule === 'afternoon' ? '下午班' :
                    formData.childSchoolSchedule === 'fulltime' ? '全日制' : '未選擇'}
              </p>
              {formData.availableTimes.length > 0 && (
                <p className="text-[#2B3A3B]">
                  有空時間：{formData.availableTimes.join(', ')}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <motion.button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/aihome/course-activities');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-6 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-bold hover:shadow-lg transition-all duration-200"
              >
                返回課程頁面
              </motion.button>
              <motion.button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/aihome/dashboard');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-6 bg-white text-[#4B4036] border-2 border-[#EADBC8] rounded-xl font-bold hover:border-[#FFD59A] transition-all duration-200"
              >
                返回儀表板
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


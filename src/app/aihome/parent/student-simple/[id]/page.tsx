// app/aihome/parent/student-simple/[id]/page.tsx
'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';

import BackButton from '@/components/ui/BackButton';
import LessonEditorModal from '@/components/ui/LessonEditorModal';
import { PopupSelect } from '@/components/ui/PopupSelect';
import StudentBasicInfo from '@/components/ui/StudentBasicInfo';
import StudentLessonPanel from '@/components/ui/StudentLessonPanel';
import EnhancedStudentAvatarTab from '@/components/ui/EnhancedStudentAvatarTab';
import StudentMediaTimeline from '@/components/ui/StudentMediaTimeline';
import { BindingStatusIndicator } from '@/components/ui/StudentBindingButton';
import { getSupabaseClient } from '@/lib/supabase';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useParentId } from '@/hooks/useParentId';
import { Lesson } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { User, BookOpen, UserCircle, Sparkles, Camera, Menu, X, Home, User as UserIcon, Settings, Calendar, LogOut, Building } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';

export default function SimpleStudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const institution = searchParams.get('institution') || 'Hanami Music';
  const { user, loading, logout } = useSaasAuth();
  const parentId = useParentId();
  const [student, setStudent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [statusPopupOpen, setStatusPopupOpen] = useState<string | null>(null);
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string[]>(['all']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [tempCategoryFilter, setTempCategoryFilter] = useState<string[]>(['all']);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const [isInactiveStudent, setIsInactiveStudent] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [courseUpdateTrigger, setCourseUpdateTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'basic' | 'lessons' | 'avatar' | 'media'>('basic');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isStudentBound, setIsStudentBound] = useState(false);
  
  // 添加防抖機制
  const dataFetchedRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  
  // 課程更新回調函數
  const handleCourseUpdate = useCallback(() => {
    // 觸發課程更新
    setCourseUpdateTrigger(prev => prev + 1);
  }, []);

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 登出處理
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 側邊欄選單項目
  const sidebarMenuItems = [
    { icon: Home, label: '首頁', href: '/aihome', description: '返回主頁' },
    { icon: Calendar, label: '課程活動', href: '/aihome/course-activities', description: '查看所有報讀的機構和課程活動' },
    { icon: UserIcon, label: '個人資料', href: '/aihome/profile', description: '查看和編輯個人資料' },
    { icon: Settings, label: '設置', href: '/aihome/settings', description: '系統設置和偏好' }
  ];

  // 處理返回按鈕
  const handleBack = () => {
    router.push('/aihome/parent/bound-students');
  };

  useEffect(() => {
    // 如果正在載入或沒有用戶，不執行
    if (loading || !user) return;
    
    // 如果 ID 沒有變化且已經載入過，不重複載入
    if (currentIdRef.current === id && dataFetchedRef.current) return;
    
    // 防止重複載入
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    // 更新當前 ID
    currentIdRef.current = id as string;
    
    setPageLoading(true);
    setStudent(null);
    setError(null);
    setIsInactiveStudent(false);

    const checkAuth = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // 先檢查是否為停用學生
        const { data: inactiveData, error: inactiveError } = await supabase
          .from('inactive_student_list')
          .select('*')
          .eq('id', id as string)
          .single();

        if (inactiveData) {
          console.log('找到停用學生:', inactiveData);

          // 將停用學生資料轉換為標準格式
          const convertedStudent = {
            ...inactiveData,
            id: inactiveData.original_id,
            original_id: inactiveData.original_id,
            student_type: inactiveData.student_type === 'regular' ? '常規' : '試堂',
            is_inactive: true,
            inactive_date: inactiveData.inactive_date,
            inactive_reason: inactiveData.inactive_reason,
            institution: inactiveData.institution
          };
          setStudent(convertedStudent);
          setIsInactiveStudent(true);
          setPageLoading(false);
          dataFetchedRef.current = true;
          loadingRef.current = false;
          
          // 記錄訪問日誌
          await logAccess(convertedStudent.id, institution, 'view');
          
          // 檢查課堂資料
          await checkLessonData(convertedStudent.id);
          return;
        }

        // 檢查是否為試堂學生
        const { data: trialData, error: trialError } = await supabase
          .from('hanami_trial_students')
          .select('*')
          .eq('id', id as string)
          .single();

        if (trialData) {
          console.log('找到試堂學生:', trialData);

          setStudent(trialData);
          setPageLoading(false);
          dataFetchedRef.current = true;
          loadingRef.current = false;
          
          // 記錄訪問日誌
          await logAccess(trialData.id, institution, 'view');
          
          // 檢查課堂資料
          await checkLessonData(trialData.id);
          return;
        }

        // 如果不是試堂學生，則從常規學生表中獲取數據
        const { data: studentData, error: studentError } = await supabase
          .from('Hanami_Students')
          .select('*')
          .eq('id', id as string)
          .single();

        if (studentError) {
          console.error('Error fetching student:', studentError);
          setError('無法獲取學生資料，請檢查學生 ID 或聯繫機構獲取正確 ID');
          setPageLoading(false);
          loadingRef.current = false;
          return;
        }

        if (!studentData) {
          setError('找不到學生資料，請檢查學生 ID 或聯繫機構獲取正確 ID');
          setPageLoading(false);
          loadingRef.current = false;
          return;
        }

        setStudent(studentData);
        setPageLoading(false);
        dataFetchedRef.current = true;
        loadingRef.current = false;
        
        // 記錄訪問日誌
        await logAccess(studentData.id, institution, 'view');
        
        // 檢查綁定狀態
        await checkBindingStatus(studentData.id);
        
        // 檢查課堂資料
        await checkLessonData(studentData.id);
      } catch (err) {
        console.error('Error:', err);
        setError('發生錯誤，請稍後再試');
        setPageLoading(false);
        loadingRef.current = false;
      }
    };

    // 檢查課堂資料的輔助函數
    const checkLessonData = async (studentId: string) => {
      try {
        console.log('🔍 檢查課堂資料表...');
        
        const supabase = getSupabaseClient();
        
        // 檢查表是否存在資料
        const { data: allLessons, error: allError } = await supabase
          .from('hanami_student_lesson')
          .select('*')
          .limit(5);
        
        console.log('📊 課堂資料表檢查:', { 
          hasData: allLessons && allLessons.length > 0,
          totalRecords: allLessons?.length || 0,
          sampleData: allLessons?.slice(0, 2).map(l => ({ id: l.id, student_id: l.student_id, lesson_date: l.lesson_date })),
          error: allError?.message || '無錯誤',
        });
        
        // 檢查特定學生的課堂資料
        const { data: studentLessons, error: studentError } = await supabase
          .from('hanami_student_lesson')
          .select('id, lesson_date, course_type, student_id')
          .eq('student_id', studentId)
          .limit(5);
        
        console.log('📋 學生課堂資料檢查:', {
          studentId,
          lessonCount: studentLessons?.length || 0,
          lessons: studentLessons?.map(l => ({ id: l.id, date: l.lesson_date, type: l.course_type, student_id: l.student_id })),
          error: studentError?.message || '無錯誤',
        });
        
      } catch (err) {
        console.error('❌ 檢查課堂資料失敗:', err);
      }
    };

    checkAuth();
  }, [user, loading, id, institution]);

  // 當 ID 變化時重置防抖狀態
  useEffect(() => {
    if (currentIdRef.current !== id) {
      dataFetchedRef.current = false;
      loadingRef.current = false;
    }
  }, [id]);

  // 記錄訪問日誌
  const logAccess = async (studentId: string, institution: string, action: string) => {
    try {
      console.log('訪問日誌:', {
        timestamp: new Date().toISOString(),
        userId: user?.id,
        studentId,
        institution,
        action,
        userAgent: navigator.userAgent,
        ip: 'client-side'
      });
    } catch (err) {
      console.error('記錄訪問日誌失敗:', err);
    }
  };

  // 檢查孩子綁定狀態
  const checkBindingStatus = async (studentId: string) => {
    if (!parentId) return;
    
    try {
      const response = await fetch(`/api/parent/bind-student?parentId=${parentId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.bindings) {
        const isBound = data.bindings.some((binding: any) => binding.student_id === studentId);
        setIsStudentBound(isBound);
      }
    } catch (error) {
      console.error('檢查綁定狀態錯誤:', error);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#EADBC8] text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#4B4036] mb-4">無法載入學生資料</h2>
            <p className="text-[#2B3A3B] mb-6">{error}</p>
            <div className="space-y-3">
              <motion.button
                onClick={handleBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                返回家長連結
              </motion.button>
              <motion.button
                onClick={() => router.push('/aihome')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-white border border-[#EADBC8] text-[#4B4036] rounded-xl font-semibold hover:bg-[#FFD59A]/10 transition-all duration-200"
              >
                返回首頁
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#4B4036]">找不到學生資料</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="flex">
        {/* 側邊欄選單 */}
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPath="/aihome/parent/student-simple/[id]"
        />

        {/* 主內容區域 */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] min-h-full">
          {/* 頂部導航欄 */}
          <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* 選單按鈕 */}
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="開啟選單"
              >
                <Menu className="w-6 h-6 text-[#4B4036]" />
              </motion.button>
              
              <div className="w-10 h-10 relative">
                <img 
                  src="/@hanami.png" 
                  alt="HanamiEcho Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4B4036]">HanamiEcho</h1>
                <p className="text-sm text-[#2B3A3B]">家長查看</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-[#2B3A3B]">
                {currentTime.toLocaleTimeString('zh-TW', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-[#4B4036]">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200"
                title="登出"
              >
                <LogOut className="w-4 h-4" />
                <span>登出</span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>


      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按鈕和機構信息 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] text-[#2B3A3B] rounded-lg hover:bg-[#EBC9A4] transition-colors"
            >
              <span>←</span>
              <span>返回家長連結</span>
            </motion.button>
            
            <div className="flex items-center space-x-4">
              {/* 綁定狀態指示器 */}
              <BindingStatusIndicator isBound={isStudentBound} />
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-[#EADBC8]">
                <Building className="w-4 h-4 text-[#4B4036]" />
                <span className="text-sm font-medium text-[#4B4036]">{institution}</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* 停用學生警告 */}
        {isInactiveStudent && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  此學生已停用
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>停用日期：{new Date(student.inactive_date).toLocaleDateString('zh-HK')}</p>
                  <p>停用原因：{student.inactive_reason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 分頁導航 */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-[#EADBC8]/30 rounded-xl p-1">
            {[
              { key: 'basic', label: '基本資料', icon: UserCircle, description: '學生基本資訊管理' },
              { key: 'lessons', label: '課程記錄', icon: BookOpen, description: '課程與學習記錄' },
              { key: 'avatar', label: '互動角色', icon: Sparkles, description: '3D角色與學習進度' },
              { key: 'media', label: '媒體庫', icon: Camera, description: '課堂影片與相片' }
            ].map(({ key, label, icon: Icon, description }) => (
              <motion.button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`
                  flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === key
                    ? 'bg-[#FFD59A] text-[#2B3A3B] shadow-sm'
                    : 'text-[#2B3A3B]/70 hover:text-[#2B3A3B] hover:bg-white/50'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={description}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 分頁內容 */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* 基本資料分頁 */}
          {activeTab === 'basic' && (
            <StudentBasicInfo 
              isInactive={isInactiveStudent} 
              student={student}
              onUpdate={(newData) => {
                setStudent(newData);
                // 如果是試堂學生且課程有更新，觸發課堂資料重新載入
                if (newData.student_type === '試堂' && newData.course_type !== student.course_type) {
                  setCourseUpdateTrigger(prev => prev + 1);
                }
              }}
            />
          )}

          {/* 課程記錄分頁 */}
          {activeTab === 'lessons' && student && (
            <div className="mt-4">
              {(() => {
                const lessonStudentId = isInactiveStudent ? student.original_id || student.id : student.id;
                console.log('🎯 準備載入課堂資料:', {
                  lessonStudentId,
                  isInactiveStudent,
                  studentOriginalId: student.original_id,
                  currentStudentId: student.id,
                  studentType: student.student_type,
                });
                return (
                  <StudentLessonPanel 
                    contactNumber={student.contact_number} 
                    studentId={lessonStudentId}
                    studentName={student.full_name}
                    studentType={student.student_type}
                    onCourseUpdate={handleCourseUpdate}
                    studentData={student}
                  />
                );
              })()}
            </div>
          )}

          {/* 互動角色分頁 */}
          {activeTab === 'avatar' && student && (
            <EnhancedStudentAvatarTab 
              student={student}
              className="mt-4"
            />
          )}

          {/* 媒體庫分頁 */}
          {activeTab === 'media' && student && (
            <>
              {console.log('🎯 傳遞給 StudentMediaTimeline 的參數:', { 
                studentId: student.id, 
                studentName: student.full_name,
                studentObject: student 
              })}
              <StudentMediaTimeline 
                studentId={student.id}
                studentName={student.full_name}
                className="mt-4"
              />
            </>
          )}
        </motion.div>
        <LessonEditorModal
          lesson={editingLesson}
          mode={editingLesson ? 'edit' : 'add'}
          open={isModalOpen}
          studentId={student.id}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLesson(null);
          }}
          onSaved={() => {
            setIsModalOpen(false);
            setEditingLesson(null);
          }}
        />
          </div>
        </div>
      </div>
    </div>
  );
}
// app/aihome/parent/student-simple/[id]/page.tsx
'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';

import LessonEditorModal from '@/components/ui/LessonEditorModal';
import StudentBasicInfo from '@/components/ui/StudentBasicInfo';
import StudentLessonPanel from '@/components/ui/StudentLessonPanel';
import EnhancedStudentAvatarTab from '@/components/ui/EnhancedStudentAvatarTab';
import StudentMediaTimeline from '@/components/ui/StudentMediaTimeline';
import { BindingStatusIndicator } from '@/components/ui/StudentBindingButton';
import { getSupabaseClient } from '@/lib/supabase';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useParentId } from '@/hooks/useParentId';
import { motion } from 'framer-motion';
import { BookOpen, UserCircle, Sparkles, Camera, Building } from 'lucide-react';
import ParentShell from '@/components/ParentShell';
import { toast } from 'react-hot-toast';

const PREMIUM_AI_ORG_ID = 'f8d269ec-b682-45d1-a796-3b74c2bf3eec';

const fetchStudentDetail = async (studentId: string) => {
  if (!studentId) {
    throw new Error('缺少學生 ID');
  }

  const response = await fetch(`/api/students/${encodeURIComponent(studentId)}`, {
    cache: 'no-store',
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload?.error || '無法獲取學生資料');
  }

  return payload;
};

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [isInactiveStudent, setIsInactiveStudent] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'lessons' | 'avatar' | 'media'>('basic');
  const [isStudentBound, setIsStudentBound] = useState(false);

  const handleTabChange = (tabKey: 'basic' | 'lessons' | 'avatar' | 'media') => {
    // 檢查是否為需要 premium 的功能
    const studentOrgId = student?.org_id ?? null;
    if (tabKey === 'media' && studentOrgId !== PREMIUM_AI_ORG_ID) {
      toast('功能未開放，企業用戶請聯繫 BuildThink@lingumiai.com');
      return;
    }
    setActiveTab(tabKey);
  };

  // 如果當前在受限制的分頁但 orgId 不是 premium，自動切換回基本資料
  useEffect(() => {
    if (student) {
      const studentOrgId = student.org_id ?? null;
      if (activeTab === 'media' && studentOrgId !== PREMIUM_AI_ORG_ID) {
        setActiveTab('basic');
      }
    }
  }, [student, activeTab]);

  // 添加防抖機制
  const dataFetchedRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  // 登出處理
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };


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

    const fetchStudent = async () => {
      try {
        const payload = await fetchStudentDetail(id as string);

        if (!payload.data) {
          setError('找不到學生資料，請檢查學生 ID 或聯繫機構獲取正確 ID');
          setPageLoading(false);
          loadingRef.current = false;
          return;
        }

        setStudent(payload.data);
        setIsInactiveStudent(Boolean(payload.isInactive));
        setPageLoading(false);
        dataFetchedRef.current = true;
        loadingRef.current = false;

        await logAccess(payload.data.id, institution, 'view');
        await checkBindingStatus(payload.data.id);
        await checkLessonData(payload.data.id);
      } catch (err: any) {
        console.error('Error fetching student:', err);
        setError(err?.message || '發生錯誤，請稍後再試');
        setPageLoading(false);
        loadingRef.current = false;
      }
    };

    const checkLessonData = async (studentId: string) => {
      try {
        console.log('🔍 檢查課堂資料表...');
        const supabase = getSupabaseClient();
        const { data: allLessons, error: allError } = await (supabase
          .from('hanami_student_lesson') as any)
          .select('*')
          .limit(5);

        console.log('📊 課堂資料表檢查:', {
          hasData: allLessons && allLessons.length > 0,
          totalRecords: allLessons?.length || 0,
          sampleData: allLessons?.slice(0, 2).map((l: any) => ({
            id: l.id,
            student_id: l.student_id,
            lesson_date: l.lesson_date,
          })),
          error: allError?.message || '無錯誤',
        });

        const { data: studentLessons, error: studentError } = await (supabase
          .from('hanami_student_lesson') as any)
          .select('id, lesson_date, course_type, student_id')
          .eq('student_id', studentId)
          .limit(5);

        console.log('📋 學生課堂資料檢查:', {
          studentId,
          lessonCount: studentLessons?.length || 0,
          lessons: studentLessons?.map((l: any) => ({
            id: l.id,
            date: l.lesson_date,
            type: l.course_type,
            student_id: l.student_id,
          })),
          error: studentError?.message || '無錯誤',
        });
      } catch (err) {
        console.error('❌ 檢查課堂資料失敗:', err);
      }
    };

    fetchStudent();
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

  const detailContent = (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <motion.button
            onClick={handleBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-[#FFD59A] text-[#2B3A3B] rounded-lg hover:bg-[#EBC9A4] transition-colors text-sm sm:text-base"
          >
            <span>←</span>
            <span className="hidden sm:inline">返回家長連結</span>
            <span className="sm:hidden">返回</span>
          </motion.button>

          <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
            <BindingStatusIndicator isBound={isStudentBound} />
            <div className="flex items-center space-x-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-[#EADBC8]">
              <Building className="w-3 h-3 sm:w-4 sm:h-4 text-[#4B4036]" />
              <span className="text-xs sm:text-sm font-medium text-[#4B4036]">{institution}</span>
            </div>
          </div>
        </div>
      </div>

      {isInactiveStudent && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">此學生已停用</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>停用日期：{new Date(student.inactive_date).toLocaleDateString('zh-HK')}</p>
                <p>停用原因：{student.inactive_reason}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <div className="flex space-x-1 bg-[#EADBC8]/30 rounded-xl p-1 overflow-x-auto">
          {[
            { key: 'basic', label: '基本資料', icon: UserCircle, description: '學生基本資訊管理', shortLabel: '基本' },
            { key: 'lessons', label: '課程記錄', icon: BookOpen, description: '課程與學習記錄', shortLabel: '課程' },
            { key: 'avatar', label: '學生狀態', icon: Sparkles, description: '3D角色與學習進度', shortLabel: '狀態' },
            { key: 'media', label: '媒體庫', icon: Camera, description: '課堂影片與相片', shortLabel: '媒體' }
          ].map(({ key, label, icon: Icon, description, shortLabel }) => {
            const studentOrgId = student?.org_id ?? null;
            const isPremiumOrg = studentOrgId === PREMIUM_AI_ORG_ID;
            const isDisabled = key === 'media' && !isPremiumOrg;

            return (
              <motion.button
                key={key}
                onClick={() => handleTabChange(key as any)}
                className={`
                  flex items-center px-2 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0
                  ${isDisabled
                    ? 'opacity-50 cursor-pointer text-gray-400'
                    : activeTab === key
                      ? 'bg-[#FFD59A] text-[#2B3A3B] shadow-sm'
                      : 'text-[#2B3A3B]/70 hover:text-[#4B4036] hover:bg-white/50'
                  }
                `}
                whileHover={isDisabled ? {} : { scale: 1.02 }}
                whileTap={isDisabled ? {} : { scale: 0.98 }}
                title={description}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'basic' && (
          <StudentBasicInfo
            isInactive={isInactiveStudent}
            student={student}
            hideTeacherInfo
            hideSensitiveInfo
            hideContactDays
            readonlyFields={['course_type', 'regular_weekday', 'regular_timeslot', 'started_date', 'contact_number']}
            visibleFields={['full_name', 'nick_name', 'student_age', 'gender', 'course_type', 'regular_weekday', 'regular_timeslot', 'started_date', 'duration_months', 'school', 'address', 'health_notes', 'student_remarks']}
            onUpdate={(newData) => {
              setStudent(newData);
            }}
          />
        )}

        {activeTab === 'lessons' && student && (
          <div className="mt-2 sm:mt-4">
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
                  studentData={student}
                  hideActionButtons
                  hideTeacherColumn
                  hideCareAlert
                  disableSelection
                  orgId={student.org_id ?? null}
                  organizationName={
                    (student as any)?.organization_name ??
                    (student as any)?.organizationName ??
                    null
                  }
                />
              );
            })()}
          </div>
        )}

        {activeTab === 'avatar' && student && (
          <EnhancedStudentAvatarTab
            student={student}
            className="mt-2 sm:mt-4"
          />
        )}

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
              className="mt-2 sm:mt-4"
            />
          </>
        )}
      </motion.div>
      <LessonEditorModal
        lesson={editingLesson}
        mode={editingLesson ? 'edit' : 'add'}
        open={isModalOpen}
        studentId={student.id}
        orgId={student.org_id ?? null}
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
  );

  return (
    <ParentShell
      currentPath={`/aihome/parent/student-simple/${id}`}
      pageTitle={student.full_name}
      pageSubtitle="查看孩子的完整資料與課程記錄"
      user={user}
      onLogout={handleLogout}
      onLogin={() => router.push('/aihome/auth/login')}
      onRegister={() => router.push('/aihome/auth/register')}
    >
      {detailContent}
    </ParentShell>
  );
}
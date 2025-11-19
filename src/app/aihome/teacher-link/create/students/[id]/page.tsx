'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, UserCircle, Sparkles, Camera, Wand2 } from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import StudentBasicInfo from '@/components/ui/StudentBasicInfo';
import StudentLessonPanel from '@/components/ui/StudentLessonPanel';
import EnhancedStudentAvatarTab from '@/components/ui/EnhancedStudentAvatarTab';
import StudentMediaTimeline from '@/components/ui/StudentMediaTimeline';
import StudentPhoneProfile from '@/components/ui/StudentPhoneProfile';
import { supabase } from '@/lib/supabase';
import { useTeacherLinkOrganization, TeacherLinkShell } from '../../TeacherLinkShell';
import { toast } from 'react-hot-toast';

const PREMIUM_AI_ORG_ID = 'f8d269ec-b682-45d1-a796-3b74c2bf3eec';

function TeacherStudentDetailContent({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { organization, orgId, orgDataDisabled, organizationResolved } = useTeacherLinkOrganization();

  const organizationSettings =
    organization && 'settings' in organization
      ? ((organization as unknown as { settings?: Record<string, any> }).settings ?? undefined)
      : undefined;
  const organizationEnglishName = typeof organizationSettings?.englishName === 'string'
    ? organizationSettings.englishName
    : undefined;
  const organizationNameForLessons: string | undefined =
    organization && typeof organization.name === 'string' ? organization.name : undefined;

  const [student, setStudent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isInactiveStudent, setIsInactiveStudent] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [courseUpdateTrigger, setCourseUpdateTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'basic' | 'lessons' | 'avatar' | 'media' | 'phone'>('basic');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handleTabChange = (tabKey: 'basic' | 'lessons' | 'avatar' | 'media' | 'phone') => {
    // 檢查是否為需要 premium 的功能
    if ((tabKey === 'media' || tabKey === 'phone') && orgId !== PREMIUM_AI_ORG_ID) {
      toast('功能未開放，企業用戶請聯繫 BuildThink@lingumiai.com');
      return;
    }
    setActiveTab(tabKey);
  };

  // 如果當前在受限制的分頁但 orgId 不是 premium，自動切換回基本資料
  useEffect(() => {
    if ((activeTab === 'media' || activeTab === 'phone') && orgId !== PREMIUM_AI_ORG_ID) {
      setActiveTab('basic');
    }
  }, [orgId, activeTab]);

  const dataFetchedRef = useRef(false);
  const loadingRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (orgDataDisabled) {
      setError('當前環境未啟用多機構資料存取，無法查看學生資訊。');
      setStudent(null);
      setPageLoading(false);
      return;
    }

    // 如果機構還在解析中，保持載入狀態，不顯示錯誤
    if (!organizationResolved) {
      setPageLoading(true);
      setError(null);
      return;
    }

    // 只有在機構解析完成且確實沒有 orgId 時，才顯示錯誤
    if (!orgId) {
      setError('請先建立您的機構後再管理學生資料。');
      setStudent(null);
      setPageLoading(false);
      return;
    }

    if (!studentId) {
      setError('無法取得學生識別碼');
      setStudent(null);
      setPageLoading(false);
      return;
    }

    if (currentIdRef.current === studentId && dataFetchedRef.current) return;
    if (loadingRef.current) return;

    loadingRef.current = true;
    currentIdRef.current = studentId;

    setPageLoading(true);
    setError(null);
    setStudent(null);
    setIsInactiveStudent(false);

    const checkLessonData = async (idToCheck: string) => {
      if (!idToCheck) return;
      try {
        await supabase
          .from('hanami_student_lesson')
          .select('id')
          .eq('org_id', orgId)
          .eq('student_id', idToCheck)
          .limit(1);
      } catch (err) {
        console.warn('Teacher Link: 檢查課堂資料失敗', err);
      }
    };

    const fetchStudent = async () => {
      try {
        // 使用 API 端點獲取學生資料（繞過 RLS）
        const response = await fetch(
          `/api/students/${studentId}?orgId=${encodeURIComponent(orgId || '')}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || '找不到學生資料或您沒有權限存取。';
          setError(errorMessage);
          setStudent(null);
          setPageLoading(false);
          loadingRef.current = false;
          return;
        }

        const result = await response.json();
        
        if (!result.success || !result.data) {
          setError('找不到學生資料或您沒有權限存取。');
          setStudent(null);
          setPageLoading(false);
          loadingRef.current = false;
          return;
        }

        const studentData = result.data;
        
        // 檢查是否為停用學生
        if (result.isInactive) {
          setIsInactiveStudent(true);
          await checkLessonData(studentData.original_id || studentData.id);
        } else {
          setIsInactiveStudent(false);
          await checkLessonData(studentData.id);
        }

        setStudent(studentData);
        setPageLoading(false);
        dataFetchedRef.current = true;
        loadingRef.current = false;
      } catch (err) {
        console.error('Teacher Link: 載入學生資料時發生錯誤', err);
        setError('載入學生資料時發生錯誤，請稍後再試。');
        setStudent(null);
        setPageLoading(false);
        loadingRef.current = false;
      }
    };

    fetchStudent();
  }, [studentId, orgId, orgDataDisabled, organizationResolved]);

  const handleRestoreStudent = async () => {
    if (!student || !isInactiveStudent || !orgId) return;
    if (!confirm('確定要回復此學生嗎？')) return;

    setIsRestoring(true);
    try {
      const studentData = {
        id: student.original_id,
        org_id: orgId,
        full_name: student.full_name,
        student_age: student.student_age,
        student_preference: student.student_preference,
        course_type: student.course_type,
        regular_weekday: student.regular_weekday,
        gender: student.gender,
        student_oid: student.student_oid,
        contact_number: student.contact_number,
        regular_timeslot: student.regular_timeslot,
        health_notes: student.health_notes,
        student_dob: student.student_dob,
        parent_email: student.parent_email,
        address: student.address,
        school: student.school,
        started_date: student.started_date,
        duration_months: student.duration_months,
        access_role: student.access_role,
        student_email: student.student_email,
        student_password: student.student_password,
        ongoing_lessons: student.ongoing_lessons,
        upcoming_lessons: student.upcoming_lessons,
        student_teacher: student.student_teacher,
        nick_name: student.nick_name,
        student_remarks: student.student_remarks,
      };

      const { error: restoreError } = await supabase
        .from('Hanami_Students')
        .upsert(studentData, { onConflict: 'id' });

      if (restoreError) {
        alert(`回復學生時發生錯誤: ${restoreError.message}`);
        setIsRestoring(false);
        return;
      }

      await supabase
        .from('inactive_student_list')
        .delete()
        .eq('id', studentId)
        .eq('org_id', orgId);

      alert('成功回復學生');
      router.push('/aihome/teacher-link/create/students');
    } catch (error) {
      console.error('Teacher Link: 回復學生錯誤', error);
      alert(`回復學生時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <div className="relative mx-auto w-20 h-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-4 border-[#FFD59A] border-t-transparent"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/owlui.png"
                  alt="載入中"
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#2B3A3B] font-medium"
          >
            載入學生資料中...
          </motion.p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl border border-[#FECACA] bg-[#FFF5F5] px-6 py-4 text-[#B91C1C]">
          {error}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl border border-[#EADBC8] bg-[#FFF9F2] px-6 py-4 text-[#4B4036]">
          找不到學生資料
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <BackButton
            href="/aihome/teacher-link/create/students"
            label="返回學生管理"
          />
          <div className="rounded-2xl bg-white/70 px-4 py-2 text-sm text-[#8A7C70] shadow-sm">
            機構：{organization.name}（ID：{orgId}）
          </div>
        </div>

        {isInactiveStudent && (
          <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-yellow-800">此學生已停用</h3>
                <p className="text-xs text-yellow-700">
                  停用日期：
                  {student.inactive_date
                    ? new Date(student.inactive_date).toLocaleDateString('zh-HK')
                    : '未知'}
                </p>
              </div>
              <button
                className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow hover:bg-green-700 transition-colors disabled:opacity-50"
                onClick={handleRestoreStudent}
                disabled={isRestoring}
              >
                {isRestoring ? '回復中…' : '回復學生'}
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex space-x-1 rounded-xl bg-[#EADBC8]/30 p-1">
            {[
              { key: 'basic', label: '基本資料', icon: UserCircle, description: '學生基本資訊管理' },
              { key: 'lessons', label: '課程記錄', icon: BookOpen, description: '課程與學習記錄' },
              { key: 'avatar', label: '學生狀態', icon: Sparkles, description: '3D 角色與學習進度' },
              { key: 'media', label: '媒體庫', icon: Camera, description: '課堂影片與相片' },
              { key: 'phone', label: 'AI 分析', icon: Wand2, description: 'AI 智能分析與個人化洞察' },
            ].map(({ key, label, icon: Icon, description }) => {
              const isPremiumOrg = orgId === PREMIUM_AI_ORG_ID;
              const isDisabled = (key === 'media' || key === 'phone') && !isPremiumOrg;
              
              return (
              <div key={key} className="relative">
                <motion.button
                  onClick={() => handleTabChange(key as any)}
                  onMouseEnter={() => setShowTooltip(key)}
                  onMouseLeave={() => setShowTooltip(null)}
                  className={`
                    flex items-center rounded-lg px-2 py-3 text-sm font-medium transition-colors sm:px-4
                    ${
                      isDisabled
                        ? 'opacity-50 cursor-pointer text-gray-400'
                        : activeTab === key
                          ? 'bg-[#FFD59A] text-[#2B3A3B] shadow-sm'
                          : 'text-[#2B3A3B]/70 hover:bg-white/60 hover:text-[#2B3A3B]'
                    }
                  `}
                  whileHover={isDisabled ? {} : { scale: 1.02 }}
                  whileTap={isDisabled ? {} : { scale: 0.98 }}
                >
                  <Icon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{label}</span>
                </motion.button>
                {showTooltip === key && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-1/2 z-50 mb-2 w-40 -translate-x-1/2 rounded-lg bg-[#2B3A3B] px-3 py-2 text-center text-xs text-white shadow-lg sm:hidden"
                  >
                    <div className="font-medium">{label}</div>
                    <div className="mt-1 text-[#EADBC8]">{description}</div>
                    <div className="absolute top-full left-1/2 -ml-1 h-2 w-2 rotate-45 bg-[#2B3A3B]" />
                  </motion.div>
                )}
              </div>
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
              onUpdate={(next) => {
                setStudent(next);
                setCourseUpdateTrigger((prev) => prev + 1);
              }}
              hideSensitiveInfo
              organizationName={organizationNameForLessons}
              organizationEnglishName={organizationEnglishName}
            />
          )}

          {activeTab === 'lessons' && student && (
            <StudentLessonPanel
              key={`${student.id}-${courseUpdateTrigger}`}
              contactNumber={student.contact_number}
              studentId={isInactiveStudent ? student.original_id || student.id : student.id}
              studentName={student.full_name}
              studentType={student.student_type}
              onCourseUpdate={() => setCourseUpdateTrigger((prev) => prev + 1)}
              studentData={student}
              showAIMessageButton={true}
              orgId={orgId}
              organizationName={organizationNameForLessons}
            />
          )}

          {activeTab === 'avatar' && student && (
            <EnhancedStudentAvatarTab student={student} className="mt-4" />
          )}

          {activeTab === 'media' && student && (
            <StudentMediaTimeline
              studentId={student.id}
              studentName={student.full_name}
              className="mt-4"
            />
          )}

          {activeTab === 'phone' && student && (
            <StudentPhoneProfile
              studentId={student.id}
              studentPhone={student.contact_number}
              studentName={student.full_name}
              className="mt-4"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function TeacherStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id ?? '';

  return (
    <TeacherLinkShell currentPath={`/aihome/teacher-link/create/students/${studentId}`}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {studentId ? (
          <TeacherStudentDetailContent studentId={studentId} />
        ) : (
          <div className="rounded-2xl border border-[#EADBC8] bg-[#FFF9F2] p-6 text-center text-[#4B4036]">
            無法取得學生識別碼。
          </div>
        )}
      </div>
    </TeacherLinkShell>
  );
}

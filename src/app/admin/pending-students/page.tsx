'use client';

import React, { useState, useEffect } from 'react';
// 移除直接使用 Supabase 客戶端，改用 API 調用
import { useUser } from '@/hooks/useUser';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  TrashIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import BackButton from '@/components/ui/BackButton';
import { HanamiCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface PendingStudent {
  id: string;
  student_oid: string;
  full_name: string;
  nick_name?: string;
  student_age?: number;
  student_dob?: string;
  gender?: string;
  contact_number: string;
  parent_email?: string;
  course_type: string;
  student_type: string;
  regular_weekday?: number;
  regular_timeslot?: string;
  selected_plan_name?: string;
  package_lessons?: number;
  package_price?: number;
  payment_amount?: number;
  payment_method?: string;
  review_status: 'pending' | 'approved';
  enrollment_date: string;
  review_notes?: string;
  rejection_reason?: string;
  selected_regular_student_id?: string;
  selected_regular_student_name?: string;
}

interface RegularStudent {
  id: string;
  student_oid: string;
  full_name: string;
  nick_name?: string;
  course_type: string;
  regular_weekday?: number;
  regular_timeslot?: string;
  ongoing_lessons?: number;
  upcoming_lessons?: number;
  packages: StudentPackage[];
  completed_lessons: number;
  total_lessons: number;
  remaining_lessons: number;
  net_remaining_lessons: number;
}

interface StudentPackage {
  id: string;
  course_name: string;
  total_lessons: number;
  remaining_lessons: number;
  lesson_duration: number;
  lesson_time: string;
  weekday: string;
  price: number;
  start_date: string;
  status: string;
}

interface PendingStudentsPageProps {
  orgId?: string | null;
}

export default function PendingStudentsPage(props: PendingStudentsPageProps = {}) {
  const { orgId = null } = props;
  const { user } = useUser();
  const router = useRouter();
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<PendingStudent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  // 試堂學生相關狀態
  const [showTrialStudents, setShowTrialStudents] = useState(false);
  const [trialStudents, setTrialStudents] = useState<any[]>([]);
  const [loadingTrialStudents, setLoadingTrialStudents] = useState(false);

  // 新增狀態
  const [regularStudents, setRegularStudents] = useState<RegularStudent[]>([]);
  const [selectedRegularStudent, setSelectedRegularStudent] = useState<RegularStudent | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [loadingRegularStudents, setLoadingRegularStudents] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [editedLessons, setEditedLessons] = useState<any[]>([]);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState<any>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTrialStudentIds, setSelectedTrialStudentIds] = useState<string[]>([]);
  const [isDeletingTrial, setIsDeletingTrial] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [registrationLinks, setRegistrationLinks] = useState<any[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showLinkFormModal, setShowLinkFormModal] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    organizationId: orgId || '',
    courseNature: 'trial' as 'trial' | 'regular',
    courseType: '',
    selectedPlan: '',
    childFullName: '',
    childNickname: '',
    childBirthDate: '',
    childAge: 0,
    childGender: '',
    childPreferences: '',
    childHealthNotes: '',
    parentName: '',
    parentPhone: '',
    parentCountryCode: '+852',
    parentEmail: '',
    parentTitle: '',
    selectedDate: '',
    selectedTimeSlot: '',
    availableTimes: [] as string[],
    promotionCode: '',
    remarks: '',
    linkExpiryHours: 24 // 預設24小時
  });
  const [linkFormErrors, setLinkFormErrors] = useState<Record<string, string>>({});
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [courseTypes, setCourseTypes] = useState<any[]>([]);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [loadingCourseTypes, setLoadingCourseTypes] = useState(false);
  // 用於根據課程類型載入既有排程（星期 / 時段），再轉成具體日期
  const [weekSchedule, setWeekSchedule] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<
    { date: string; weekday: number; weekdayName: string; timeSlots: any[] }[]
  >([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Leave Requests State
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loadingLeaveRequests, setLoadingLeaveRequests] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'leave'>('students');
  const [reviewLeaveNotes, setReviewLeaveNotes] = useState('');
  const [leaveRejectionReason, setLeaveRejectionReason] = useState('');
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<any>(null);
  const [showLeaveReviewModal, setShowLeaveReviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const getWeekdayName = (weekday: number) => {
    const names = ['日', '一', '二', '三', '四', '五', '六'];
    return names[weekday] || '';
  };

  // 載入待審核學生
  const loadPendingStudents = async () => {
    try {
      setLoading(true);
      console.log('🔍 開始載入待審核學生...', { orgId });

      const url = orgId
        ? `/api/admin/pending-students?orgId=${encodeURIComponent(orgId)}`
        : '/api/admin/pending-students';

      const response = await fetch(url);
      const result = await response.json();

      console.log('🔍 API 響應:', result);

      if (!result.success) {
        throw new Error(result.error?.message || '載入失敗');
      }

      setPendingStudents(result.data || []);
      setSelectedStudentIds([]); // 重新載入時清空選中
      console.log('✅ 成功載入待審核學生:', result.count || 0, '個');
    } catch (error) {
      console.error('❌ 載入待審核學生失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load Leave Requests
  const loadLeaveRequests = async () => {
    try {
      console.log('🚀 Starting loadLeaveRequests... OrgId:', orgId);
      setLoadingLeaveRequests(true);
      const url = orgId
        ? `/api/admin/leave-requests?orgId=${encodeURIComponent(orgId)}`
        : '/api/admin/leave-requests';

      console.log('Fetching URL:', url);
      const response = await fetch(url);
      const result = await response.json();
      console.log('📥 Leave requests result:', result);

      if (result.success) {
        setLeaveRequests(result.data || []);
      }
    } catch (error) {
      console.error('Error loading leave requests:', error);
    } finally {
      setLoadingLeaveRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'leave') {
      loadLeaveRequests();
    }
  }, [activeTab, orgId]);

  const handleReviewLeave = async (status: 'approved' | 'rejected') => {
    if (!selectedLeaveRequest) return;

    try {
      const response = await fetch('/api/admin/leave-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedLeaveRequest.id,
          status,
          reviewNotes: reviewLeaveNotes,
          rejectionReason: leaveRejectionReason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`申請已${status === 'approved' ? '批准' : '拒絕'}`);
        setShowLeaveReviewModal(false);
        setSelectedLeaveRequest(null);
        setReviewLeaveNotes('');
        setLeaveRejectionReason('');
        loadLeaveRequests();
      } else {
        alert('操作失敗: ' + result.error);
      }
    } catch (error) {
      console.error('Error reviewing leave request:', error);
      alert('操作失敗');
    }
  };

  // 載入試堂學生（confirmed_payment = false）
  const loadTrialStudents = async () => {
    try {
      setLoadingTrialStudents(true);
      console.log('🔍 開始載入試堂學生（未確認支付）...', { orgId });

      const url = orgId
        ? `/api/admin/trial-students?orgId=${encodeURIComponent(orgId)}`
        : '/api/admin/trial-students';

      const response = await fetch(url);
      const result = await response.json();

      console.log('🔍 試堂學生 API 響應:', result);

      if (!result.success) {
        throw new Error(result.error?.message || '載入失敗');
      }

      setTrialStudents(result.data || []);
      setSelectedTrialStudentIds([]); // 重新載入時清空選中
      console.log('✅ 成功載入試堂學生:', result.count || 0, '個');
    } catch (error) {
      console.error('❌ 載入試堂學生失敗:', error);
    } finally {
      setLoadingTrialStudents(false);
    }
  };

  // 更新試堂學生的支付確認狀態
  const updateTrialStudentPayment = async (studentId: string) => {
    try {
      console.log('🔍 更新試堂學生支付確認狀態:', studentId);

      const response = await fetch('/api/admin/trial-students/update-payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          orgId
        })
      });

      const result = await response.json();
      console.log('🔍 更新支付確認狀態 API 響應:', result);

      if (!result.success) {
        throw new Error(result.error?.message || '更新失敗');
      }

      console.log('✅ 成功更新支付確認狀態');

      // 重新載入試堂學生列表
      await loadTrialStudents();

      alert('支付確認狀態已更新為已確認');
    } catch (error) {
      console.error('❌ 更新支付確認狀態失敗:', error);
      alert('更新失敗，請稍後再試');
    }
  };

  // 初始化新學生表單
  const initializeNewStudentForm = (pendingStudent: any) => {
    const formData = {
      full_name: pendingStudent.full_name || '',
      nick_name: pendingStudent.nick_name || '',
      student_age: pendingStudent.student_age || null,
      student_dob: pendingStudent.student_dob || null,
      gender: pendingStudent.gender || '',
      contact_number: pendingStudent.contact_number || '',
      student_email: null,
      parent_email: pendingStudent.parent_email || '',
      address: pendingStudent.address || '',
      school: pendingStudent.school || '',
      student_type: '常規',
      course_type: pendingStudent.course_type || '',
      student_teacher: null,
      student_preference: pendingStudent.student_preference || '',
      student_remarks: pendingStudent.student_remarks || '',
      health_notes: pendingStudent.health_notes || '',
      regular_weekday: pendingStudent.regular_weekday || null,
      regular_timeslot: pendingStudent.regular_timeslot || '',
      started_date: pendingStudent.started_date || null,
      duration_months: null,
      ongoing_lessons: pendingStudent.ongoing_lessons || 0,
      upcoming_lessons: pendingStudent.upcoming_lessons || 0,
      student_password: pendingStudent.student_password || '',
      access_role: pendingStudent.access_role || 'student',
      approved_lesson_nonscheduled: pendingStudent.package_lessons || 0,
      non_approved_lesson: 0,
      care_alert: false
    };
    setNewStudentForm(formData);
  };

  // 顯示確認視窗
  const showConfirmationModal = () => {
    if (!selectedRegularStudent || !selectedStudent) {
      alert('請選擇要新增時間表的正式學生');
      return;
    }

    // 如果是新學生，先初始化表單
    if (selectedRegularStudent.id === 'new_student') {
      initializeNewStudentForm(selectedStudent);
    }

    setShowConfirmModal(true);
  };

  // 正式更新正式學生堂數並確認狀態
  const updateRegularStudentLessons = async () => {
    if (!selectedRegularStudent || !selectedStudent) {
      alert('請選擇要新增時間表的正式學生');
      return;
    }

    try {
      // 檢查是否為新學生創建
      if (selectedRegularStudent.id === 'new_student') {
        console.log('🔍 開始創建新學生:', {
          pendingStudentData: selectedStudent,
          lessonCount: selectedStudent.package_lessons
        });

        const response = await fetch('/api/admin/create-new-student', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pendingStudentData: selectedStudent,
            newStudentData: newStudentForm,
            lessonCount: selectedStudent.package_lessons || 0
          })
        });

        const result = await response.json();
        console.log('🔍 創建新學生 API 響應:', result);

        if (!result.success) {
          throw new Error(result.error?.message || '創建新學生失敗');
        }

        alert(result.data.message);
      } else {
        // 現有學生更新堂數
        console.log('🔍 開始更新正式學生堂數並確認狀態:', {
          regularStudentId: selectedRegularStudent.id,
          lessonCount: selectedStudent.package_lessons,
          studentId: selectedStudent.id
        });

        const response = await fetch('/api/admin/update-student-lessons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            regularStudentId: selectedRegularStudent.id,
            lessonCount: selectedStudent.package_lessons || 0,
            pendingStudentId: selectedStudent.id
          })
        });

        const result = await response.json();
        console.log('🔍 更新堂數 API 響應:', result);

        if (!result.success) {
          throw new Error(result.error?.message || '更新堂數失敗');
        }

        alert(`成功為 ${selectedRegularStudent.full_name} 新增 ${selectedStudent.package_lessons} 堂課並確認！`);
      }

      // 重新載入資料
      await loadPendingStudents();
      setShowModal(false);
      setShowConfirmModal(false);
      setSelectedStudent(null);
      setSelectedRegularStudent(null);
    } catch (error) {
      console.error('操作失敗:', error);
      alert('操作失敗，請稍後再試');
    }
  };

  // 審核學生
  const reviewStudent = async (studentId: string, status: 'approved' | 'rejected' | 'needs_info') => {
    try {
      console.log('🔍 開始審核學生:', { studentId, status });

      const response = await fetch('/api/admin/pending-students', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          status,
          reviewNotes,
          rejectionReason
        })
      });

      const result = await response.json();
      console.log('🔍 審核 API 響應:', result);

      if (!result.success) {
        throw new Error(result.error?.message || '審核失敗');
      }

      // 重新載入資料
      await loadPendingStudents();
      setShowModal(false);
      setReviewNotes('');
      setRejectionReason('');
      setSelectedStudent(null);

      alert(result.message || `學生審核${status === 'approved' ? '通過' : status === 'rejected' ? '拒絕' : '需要補充資料'}`);
    } catch (error) {
      console.error('審核學生失敗:', error);
      alert('審核失敗，請稍後再試');
    }
  };

  // 刪除選中的學生
  const deleteSelectedStudents = async () => {
    if (selectedStudentIds.length === 0) {
      alert('請先選擇要刪除的學生');
      return;
    }

    if (!confirm(`確認要刪除選中的 ${selectedStudentIds.length} 個學生嗎？此操作無法撤銷。`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/pending-students?ids=${selectedStudentIds.join(',')}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '刪除失敗');
      }

      // 重新載入資料
      await loadPendingStudents();
      setSelectedStudentIds([]);
      alert(`成功刪除 ${result.deletedCount || selectedStudentIds.length} 個學生`);
    } catch (error: any) {
      console.error('刪除學生失敗:', error);
      alert(error.message || '刪除失敗，請稍後再試');
    } finally {
      setIsDeleting(false);
    }
  };

  // 切換單個學生的選中狀態
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  // 刪除選中的試堂學生
  const deleteSelectedTrialStudents = async () => {
    if (selectedTrialStudentIds.length === 0) {
      alert('請先選擇要刪除的試堂學生');
      return;
    }

    if (!confirm(`確認要刪除選中的 ${selectedTrialStudentIds.length} 個試堂學生嗎？此操作無法撤銷。`)) {
      return;
    }

    try {
      setIsDeletingTrial(true);
      const response = await fetch(`/api/admin/trial-students?ids=${selectedTrialStudentIds.join(',')}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '刪除失敗');
      }

      // 重新載入試堂學生列表
      await loadTrialStudents();
      setSelectedTrialStudentIds([]);
      alert(`成功刪除 ${result.deletedCount || selectedTrialStudentIds.length} 個試堂學生`);
    } catch (error: any) {
      console.error('刪除試堂學生失敗:', error);
      alert(error.message || '刪除失敗，請稍後再試');
    } finally {
      setIsDeletingTrial(false);
    }
  };

  // 切換單個試堂學生的選中狀態
  const toggleTrialStudentSelection = (studentId: string) => {
    setSelectedTrialStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // 試堂學生全選/取消全選
  const toggleSelectAllTrial = () => {
    if (selectedTrialStudentIds.length === trialStudents.length) {
      setSelectedTrialStudentIds([]);
    } else {
      setSelectedTrialStudentIds(trialStudents.map(s => s.id));
    }
  };

  // 載入報名連結列表
  const loadRegistrationLinks = async (forceRefresh = false) => {
    // 如果正在加載中，跳過重複請求
    if (loadingLinks && !forceRefresh) {
      return;
    }

    try {
      setLoadingLinks(true);
      const url = orgId
        ? `/api/registrations/links?orgId=${encodeURIComponent(orgId)}`
        : '/api/registrations/links';

      const response = await fetch(url, {
        credentials: 'include',
        cache: forceRefresh ? 'no-cache' : 'default',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '載入失敗');
      }

      setRegistrationLinks(result.data || []);
    } catch (error) {
      console.error('❌ 載入報名連結失敗:', error);
      // 只在非強制刷新時顯示錯誤提示，避免打擾用戶
      if (forceRefresh) {
        alert('載入報名連結失敗，請稍後再試');
      }
    } finally {
      setLoadingLinks(false);
    }
  };

  // 載入機構列表
  const loadOrganizations = async () => {
    try {
      setLoadingOrganizations(true);
      // 如果存在当前机构，只加载当前机构
      if (orgId) {
        const response = await fetch(`/api/organizations/get?orgId=${encodeURIComponent(orgId)}`);
        const result = await response.json();
        if (result.success && result.data) {
          setOrganizations([result.data]);
        } else {
          console.error('載入當前機構失敗:', result.error);
          setOrganizations([]);
        }
      } else {
        // 如果没有当前机构，加载所有机构
        const response = await fetch('/api/organizations/list?status=active');
        const result = await response.json();
        if (result.success && result.data) {
          setOrganizations(Array.isArray(result.data) ? result.data : [result.data]);
        } else {
          console.error('載入機構列表失敗:', result.error);
          setOrganizations([]);
        }
      }
    } catch (error) {
      console.error('載入機構列表失敗:', error);
      setOrganizations([]);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  // 載入課程類型
  const loadCourseTypes = async (selectedOrgId?: string) => {
    try {
      setLoadingCourseTypes(true);
      const targetOrgId = selectedOrgId || linkFormData.organizationId || orgId;
      const url = targetOrgId
        ? `/api/course-types?orgId=${encodeURIComponent(targetOrgId)}`
        : '/api/course-types';

      const response = await fetch(url);
      const result = await response.json();
      if (result.success && result.data) {
        setCourseTypes(result.data || []);
      }
    } catch (error) {
      console.error('載入課程類型失敗:', error);
    } finally {
      setLoadingCourseTypes(false);
    }
  };

  // 根據課程類型和機構，載入現有排程（星期 / 時段）
  const loadCourseSchedule = async (courseTypeId: string) => {
    try {
      if (!courseTypeId || !orgId) {
        setWeekSchedule([]);
        return;
      }

      const course = courseTypes.find((c: any) => c.id === courseTypeId);
      if (!course || !course.name) {
        setWeekSchedule([]);
        return;
      }

      setLoadingSchedule(true);

      const today = new Date();
      const startDate = today.toISOString().slice(0, 10);
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      const endDate = end.toISOString().slice(0, 10);

      const response = await fetch('/api/regular-course-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseType: course.name,
          startDate,
          endDate,
          orgId
        })
      });

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const weekData = result.data;
        setWeekSchedule(weekData);

        const dates: { date: string; weekday: number; weekdayName: string; timeSlots: any[] }[] = [];
        const today = new Date();

        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const weekday = d.getDay();

          const day = weekData.find((wd: any) => {
            const w = typeof wd.weekday === 'string' ? parseInt(wd.weekday, 10) : wd.weekday;
            return w === weekday;
          });

          if (!day || !day.hasSchedule || !Array.isArray(day.timeSlots)) continue;

          const availableSlots = day.timeSlots.filter((slot: any) => slot.isAvailable);
          if (availableSlots.length === 0) continue;

          dates.push({
            date: d.toISOString().slice(0, 10),
            weekday,
            weekdayName: day.weekdayName || `星期${getWeekdayName(weekday)}`,
            timeSlots: availableSlots
          });
        }

        setAvailableDates(dates);
      } else {
        console.error('載入課程排程失敗:', result.error);
        setWeekSchedule([]);
        setAvailableDates([]);
      }
    } catch (error) {
      console.error('載入課程排程錯誤:', error);
      setWeekSchedule([]);
      setAvailableDates([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // 載入價格計劃
  const loadPricingPlans = async (courseTypeId: string) => {
    try {
      if (!courseTypeId) {
        setPricingPlans([]);
        return;
      }
      const response = await fetch(`/api/pricing-plans?courseTypeId=${encodeURIComponent(courseTypeId)}`);
      const result = await response.json();
      if (result.success && result.data) {
        setPricingPlans(result.data || []);
      }
    } catch (error) {
      console.error('載入價格計劃失敗:', error);
    }
  };

  // 打開連結表單彈窗
  const openLinkFormModal = () => {
    const currentOrgId = orgId || '';
    setLinkFormData({
      organizationId: currentOrgId,
      courseNature: 'trial',
      courseType: '',
      selectedPlan: '',
      childFullName: '',
      childNickname: '',
      childBirthDate: '',
      childAge: 0,
      childGender: '',
      childPreferences: '',
      childHealthNotes: '',
      parentName: '',
      parentPhone: '',
      parentCountryCode: '+852',
      parentEmail: '',
      parentTitle: '',
      selectedDate: '',
      selectedTimeSlot: '',
      availableTimes: [],
      promotionCode: '',
      remarks: '',
      linkExpiryHours: 24 // 預設24小時
    });
    setLinkFormErrors({});
    loadOrganizations();
    if (orgId) {
      loadCourseTypes(orgId);
    }
    setShowLinkFormModal(true);
  };

  // 驗證表單
  const validateLinkForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!linkFormData.organizationId) {
      errors.organizationId = '請選擇機構';
    }
    if (!linkFormData.courseNature) {
      errors.courseNature = '請選擇課程性質';
    }
    if (!linkFormData.courseType) {
      errors.courseType = '請選擇課程類型';
    }
    if (!linkFormData.childFullName) {
      errors.childFullName = '請輸入孩子姓名';
    }
    if (!linkFormData.childGender) {
      errors.childGender = '請選擇性別';
    }

    setLinkFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 生成報名連結（從表單）
  const generateLinkFromForm = async () => {
    if (!validateLinkForm()) {
      alert('請填寫所有必填欄位');
      return;
    }

    try {
      setGeneratingLink(true);

      const response = await fetch('/api/registrations/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkType: linkFormData.courseNature,
          orgId: linkFormData.organizationId || null,
          formData: linkFormData,
          createdBy: user?.id || null,
          expiresInHours: linkFormData.linkExpiryHours || 24,
          notes: `為 ${linkFormData.childFullName || '學生'} 生成的${linkFormData.courseNature === 'trial' ? '試堂' : '常規'}報名連結`
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '生成失敗');
      }

      // 重新載入連結列表
      await loadRegistrationLinks(true);
      setShowLinkFormModal(false);
      alert('報名連結生成成功！');
    } catch (error: any) {
      console.error('生成報名連結失敗:', error);
      alert(error.message || '生成失敗，請稍後再試');
    } finally {
      setGeneratingLink(false);
    }
  };

  // 生成報名連結（舊方法，保留以備用）
  const generateRegistrationLink = async (student: PendingStudent | any, linkType: 'trial' | 'regular') => {
    try {
      setGeneratingLink(true);

      // 準備表單資料（基於學生資料）
      const formData = {
        organizationId: orgId || student.org_id || null,
        courseType: student.course_type || '',
        courseNature: linkType === 'trial' ? 'trial' : 'regular',
        selectedPlan: student.selected_plan_name || '',
        childFullName: student.full_name || '',
        childNickname: student.nick_name || '',
        childBirthDate: student.student_dob || '',
        childAge: student.student_age || 0,
        childGender: student.gender || '',
        childPreferences: student.student_preference || '',
        childHealthNotes: student.health_notes || '',
        parentName: '', // 客戶需要填寫
        parentPhone: student.contact_number || '',
        parentCountryCode: '+852',
        parentEmail: student.parent_email || '',
        parentTitle: '',
        selectedDate: student.selected_date || '',
        selectedTimeSlot: student.regular_timeslot || '',
        availableTimes: [],
        promotionCode: '',
        remarks: student.student_remarks || ''
      };

      const response = await fetch('/api/registrations/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkType,
          orgId: orgId || student.org_id || null,
          formData,
          createdBy: user?.id || null,
          notes: `為 ${student.full_name || '學生'} 生成的${linkType === 'trial' ? '試堂' : '常規'}報名連結`
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '生成失敗');
      }

      // 重新載入連結列表
      await loadRegistrationLinks(true);
      alert('報名連結生成成功！');
    } catch (error: any) {
      console.error('生成報名連結失敗:', error);
      alert(error.message || '生成失敗，請稍後再試');
    } finally {
      setGeneratingLink(false);
    }
  };

  // 刪除報名連結
  const deleteRegistrationLink = async (linkId: string) => {
    if (!confirm('確認要刪除此報名連結嗎？')) {
      return;
    }

    try {
      const response = await fetch(`/api/registrations/links?id=${linkId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '刪除失敗');
      }

      await loadRegistrationLinks(true);
      alert('報名連結已刪除');
    } catch (error: any) {
      console.error('刪除報名連結失敗:', error);
      alert(error.message || '刪除失敗，請稍後再試');
    }
  };

  // 複製連結到剪貼板
  const copyLinkToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('連結已複製到剪貼板');
    } catch (error) {
      console.error('複製失敗:', error);
      alert('複製失敗，請手動複製');
    }
  };

  // 載入正式學生列表
  const loadRegularStudents = async () => {
    try {
      setLoadingRegularStudents(true);
      console.log('🔍 開始載入正式學生列表...');

      const response = await fetch('/api/admin/regular-students');
      const result = await response.json();

      console.log('🔍 正式學生 API 響應:', result);

      if (!result.success) {
        throw new Error(result.error?.message || '載入失敗');
      }

      setRegularStudents(result.data || []);
      console.log('✅ 成功載入正式學生:', result.count || 0, '個');
    } catch (error) {
      console.error('❌ 載入正式學生失敗:', error);
    } finally {
      setLoadingRegularStudents(false);
    }
  };

  // 轉移功能已移至 API 路由處理

  // 生成課程時間表
  const generateLessonSchedule = (student: any, regularStudent: any = null) => {
    if (!student || !student.package_lessons || !student.regular_weekday || !student.regular_timeslot || !student.started_date) {
      return [];
    }

    const lessons = [];
    let startDate;

    // 如果有選擇正式學生，使用該學生的最後一堂課日期加一星期
    if (regularStudent && regularStudent.lastLessonDate) {
      const lastLessonDate = new Date(regularStudent.lastLessonDate);
      startDate = new Date(lastLessonDate);
      startDate.setDate(lastLessonDate.getDate() + 7); // 加一星期
    } else {
      // 否則使用待審核學生的開始日期
      startDate = new Date(student.started_date);
    }

    const weekday = student.regular_weekday;
    const time = student.regular_timeslot;
    const totalLessons = student.package_lessons;

    // 找到第一個符合weekday的日期
    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== weekday) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 生成課程時間表
    for (let i = 0; i < totalLessons; i++) {
      const lessonDate = new Date(currentDate);
      lessonDate.setDate(currentDate.getDate() + (i * 7)); // 每週一次

      lessons.push({
        id: `lesson_${i + 1}`,
        date: lessonDate.toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          weekday: 'long'
        }),
        rawDate: lessonDate.toISOString().slice(0, 10), // 用於編輯
        time: time,
        weekday: `星期${getWeekdayName(weekday)}`,
        courseType: student.course_type,
        lessonNumber: i + 1
      });
    }

    return lessons;
  };

  // 編輯課程時間和日期
  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
  };

  const handleSaveLessonEdit = (lessonId: string, newDate: string, newTime: string) => {
    const updatedLessons = editedLessons.map(lesson =>
      lesson.id === lessonId
        ? {
          ...lesson,
          rawDate: newDate,
          time: newTime,
          date: new Date(newDate).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
          })
        }
        : lesson
    );

    // 如果課程不在編輯列表中，添加它
    if (!editedLessons.find(lesson => lesson.id === lessonId)) {
      const originalLesson = generateLessonSchedule(selectedStudent).find(l => l.id === lessonId);
      if (originalLesson) {
        updatedLessons.push({
          ...originalLesson,
          rawDate: newDate,
          time: newTime,
          date: new Date(newDate).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
          })
        });
      }
    }

    setEditedLessons(updatedLessons);
    setEditingLesson(null);
  };

  const handleCancelEdit = () => {
    setEditingLesson(null);
  };

  // 獲取付款截圖 URL
  const getPaymentScreenshotUrl = async (studentId: string) => {
    try {
      // 使用 hanami-saas-system 的 Supabase 客戶端（Service Role Key）
      const saasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
      const saasSupabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY;

      if (!saasSupabaseUrl || !saasSupabaseServiceKey) {
        console.error('SaaS Supabase 環境變數未設定（需要 Service Role Key）');
        return { url: null, error: '環境變數未設定' };
      }

      const saasSupabase = createClient(saasSupabaseUrl, saasSupabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // 方法1: 從 payment_records 表查找截圖記錄
      console.log('🔍 方法1: 從 payment_records 表查找截圖記錄');
      const { data: paymentRecords, error: recordsError } = await saasSupabase
        .from('payment_records')
        .select('screenshot_url, file_name, created_at')
        .eq('user_id', studentId)
        .eq('payment_method', 'screenshot')
        .order('created_at', { ascending: false })
        .limit(1);

      if (recordsError) {
        console.error('查詢 payment_records 失敗:', recordsError);
      } else if (paymentRecords && paymentRecords.length > 0) {
        const record = paymentRecords[0];
        console.log('✅ 找到付款記錄:', record);

        // 如果有 screenshot_url，直接使用
        if (record.screenshot_url) {
          return { url: record.screenshot_url, error: null };
        }

        // 如果有 file_name，嘗試從 storage 獲取
        if (record.file_name) {
          const { data, error } = await saasSupabase.storage
            .from('hanami-saas-system')
            .createSignedUrl(record.file_name, 3600);

          if (!error && data) {
            return { url: data.signedUrl, error: null };
          }
        }
      }

      // 方法2: 直接從 storage 的 payment-screenshots 資料夾查找
      console.log('🔍 方法2: 從 storage 的 payment-screenshots 資料夾查找');

      // 獲取所有日期資料夾
      const { data: dateFolders, error: foldersError } = await saasSupabase.storage
        .from('hanami-saas-system')
        .list('payment-screenshots');

      if (foldersError) {
        console.error('獲取日期資料夾失敗:', foldersError);
        return { url: null, error: '無法訪問截圖資料夾' };
      }

      // 按日期倒序查找（最新的在前）
      const sortedFolders = dateFolders?.sort((a, b) => b.name.localeCompare(a.name)) || [];

      for (const folder of sortedFolders) {
        if (folder.name && folder.name.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log(`🔍 檢查日期資料夾: ${folder.name}`);

          const { data: files, error: filesError } = await saasSupabase.storage
            .from('hanami-saas-system')
            .list(`payment-screenshots/${folder.name}`);

          if (filesError) {
            console.error(`獲取 ${folder.name} 資料夾檔案失敗:`, filesError);
            continue;
          }

          // 尋找可能的截圖檔案（更靈活的匹配）
          const screenshotFile = files?.find(file => {
            if (!file.name) return false;

            const fileName = file.name.toLowerCase();
            const studentIdLower = studentId.toLowerCase();
            const studentIdShort = studentId.substring(0, 8).toLowerCase();

            // 檢查多種匹配方式
            return (
              fileName.includes(studentIdLower) ||
              fileName.includes(studentIdShort) ||
              fileName.includes('payment') ||
              fileName.includes('screenshot') ||
              fileName.includes('截圖') ||
              fileName.includes('png') || // 如果是 PNG 檔案，可能是截圖
              fileName.includes('jpg') || // 如果是 JPG 檔案，可能是截圖
              fileName.includes('jpeg')   // 如果是 JPEG 檔案，可能是截圖
            );
          });

          if (screenshotFile) {
            console.log(`✅ 找到截圖檔案: ${screenshotFile.name}`);
            const { data, error } = await saasSupabase.storage
              .from('hanami-saas-system')
              .createSignedUrl(`payment-screenshots/${folder.name}/${screenshotFile.name}`, 3600);

            if (!error && data) {
              return { url: data.signedUrl, error: null };
            }
          } else {
            // 如果找不到特定學生的檔案，嘗試載入第一個可用的截圖檔案
            const firstImageFile = files?.find(file => {
              if (!file.name) return false;
              const fileName = file.name.toLowerCase();
              return fileName.includes('png') || fileName.includes('jpg') || fileName.includes('jpeg');
            });

            if (firstImageFile) {
              console.log(`📸 載入第一個可用的截圖檔案: ${firstImageFile.name}`);
              const { data, error } = await saasSupabase.storage
                .from('hanami-saas-system')
                .createSignedUrl(`payment-screenshots/${folder.name}/${firstImageFile.name}`, 3600);

              if (!error && data) {
                return { url: data.signedUrl, error: null };
              }
            }
          }
        }
      }

      // 方法3: 嘗試列出所有檔案進行調試
      console.log('🔍 方法3: 列出所有檔案進行調試');

      // 列出最近幾天的所有檔案
      const recentDays = 7; // 檢查最近7天
      const today = new Date();

      for (let i = 0; i < recentDays; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD

        try {
          const { data: files, error: filesError } = await saasSupabase.storage
            .from('hanami-saas-system')
            .list(`payment-screenshots/${dateStr}`);

          if (!filesError && files && files.length > 0) {
            console.log(`📁 ${dateStr} 資料夾中的檔案:`, files.map(f => f.name));

            // 尋找任何截圖檔案（更靈活的匹配）
            const studentFile = files.find(file => {
              if (!file.name) return false;

              const fileName = file.name.toLowerCase();
              const studentIdLower = studentId.toLowerCase();
              const studentIdShort = studentId.substring(0, 8).toLowerCase();

              // 檢查多種匹配方式
              return (
                fileName.includes(studentIdLower) ||
                fileName.includes(studentIdShort) ||
                fileName.includes('payment') ||
                fileName.includes('screenshot') ||
                fileName.includes('截圖') ||
                fileName.includes('png') || // 如果是 PNG 檔案，可能是截圖
                fileName.includes('jpg') || // 如果是 JPG 檔案，可能是截圖
                fileName.includes('jpeg')   // 如果是 JPEG 檔案，可能是截圖
              );
            });

            if (studentFile) {
              console.log(`✅ 在 ${dateStr} 找到學生檔案: ${studentFile.name}`);
              const { data, error } = await saasSupabase.storage
                .from('hanami-saas-system')
                .createSignedUrl(`payment-screenshots/${dateStr}/${studentFile.name}`, 3600);

              if (!error && data) {
                return { url: data.signedUrl, error: null };
              }
            } else {
              // 如果找不到特定學生的檔案，嘗試載入第一個可用的截圖檔案
              const firstImageFile = files.find(file => {
                if (!file.name) return false;
                const fileName = file.name.toLowerCase();
                return fileName.includes('png') || fileName.includes('jpg') || fileName.includes('jpeg');
              });

              if (firstImageFile) {
                console.log(`📸 載入第一個可用的截圖檔案: ${firstImageFile.name}`);
                const { data, error } = await saasSupabase.storage
                  .from('hanami-saas-system')
                  .createSignedUrl(`payment-screenshots/${dateStr}/${firstImageFile.name}`, 3600);

                if (!error && data) {
                  return { url: data.signedUrl, error: null };
                }
              }
            }
          }
        } catch (error) {
          console.log(`跳過 ${dateStr} 資料夾（可能不存在）`);
        }
      }

      console.log(`❌ 學生 ${studentId} 的付款截圖檔案不存在`);
      return { url: null, error: '截圖檔案不存在' };
    } catch (error) {
      console.error('獲取付款截圖時發生錯誤:', error);
      return { url: null, error: '系統錯誤' };
    }
  };

  // 獲取顯示的課程資料（優先使用編輯過的資料）
  const getDisplayLessons = () => {
    // 如果有選擇正式學生，使用該學生的最後一堂課日期來計算
    const originalLessons = generateLessonSchedule(selectedStudent, selectedRegularStudent);
    return originalLessons.map(lesson => {
      const editedLesson = editedLessons.find(el => el.id === lesson.id);
      return editedLesson || lesson;
    });
  };

  // 獲取狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 獲取狀態中文
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '未確認';
      case 'approved': return '確認';
      default: return '未知';
    }
  };

  // 過濾學生
  const filteredStudents = pendingStudents.filter(student => {
    if (filterStatus === 'all') return true;
    return student.review_status === filterStatus;
  });

  useEffect(() => {
    // 並行加載多個數據源，提高加載速度
    const loadData = async () => {
      const promises = [
        loadPendingStudents(),
        loadRegularStudents()
      ];

      // 如果需要顯示試堂學生，也並行加載
      if (showTrialStudents) {
        promises.push(loadTrialStudents());
      }

      // 並行執行所有加載操作
      await Promise.all(promises);
    };

    loadData();
  }, [orgId, showTrialStudents]);

  // 當機構選擇變化時，載入課程類型
  useEffect(() => {
    if (linkFormData.organizationId) {
      loadCourseTypes(linkFormData.organizationId);
    }
  }, [linkFormData.organizationId]);

  // 當 orgId 變化時，更新表單中的機構選擇
  useEffect(() => {
    if (orgId && !linkFormData.organizationId) {
      setLinkFormData(prev => ({ ...prev, organizationId: orgId }));
    }
  }, [orgId]);

  // 當選擇學生時載入付款截圖
  useEffect(() => {
    if (selectedStudent) {
      // 載入付款截圖
      if (selectedStudent.payment_method === '截圖' || selectedStudent.payment_method === 'screenshot') {
        getPaymentScreenshotUrl(selectedStudent.id).then(result => {
          setPaymentScreenshotUrl(result.url);
          if (result.error) {
            console.log(`付款截圖載入失敗: ${result.error}`);
          }
        });
      } else {
        setPaymentScreenshotUrl(null);
      }
    }
  }, [selectedStudent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-[#FFD59A] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 返回按鈕 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <BackButton href="/aihome/teacher-link" label="返回管理面板" />
        </motion.div>

        {/* 標題區域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AcademicCapIcon className="w-8 h-8 text-[#FFB6C1] mr-3" />
            </motion.div>
            <h1 className="text-4xl font-bold text-[#4B4036]">待審核學生管理</h1>
          </div>
          <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
            審核已完成付款的常規課程學生報名及試堂學生
          </p>
        </motion.div>

        {/* 統計卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          {!showTrialStudents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <HanamiCard className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#2B3A3B]">未確認</p>
                    <p className="text-2xl font-bold text-[#4B4036]">
                      {pendingStudents.filter(s => s.review_status === 'pending').length}
                    </p>
                  </div>
                </div>
              </HanamiCard>

              <HanamiCard className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#2B3A3B]">已確認</p>
                    <p className="text-2xl font-bold text-[#4B4036]">
                      {pendingStudents.filter(s => s.review_status === 'approved').length}
                    </p>
                  </div>
                </div>
              </HanamiCard>

              <HanamiCard className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#2B3A3B]">總數</p>
                    <p className="text-2xl font-bold text-[#4B4036]">
                      {pendingStudents.length}
                    </p>
                  </div>
                </div>
              </HanamiCard>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <HanamiCard className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#2B3A3B]">未確認支付的試堂學生</p>
                    <p className="text-2xl font-bold text-[#4B4036]">
                      {loadingTrialStudents ? '載入中...' : trialStudents.length}
                    </p>
                  </div>
                </div>
              </HanamiCard>
            </div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'students' ? 'text-[#E65100]' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            待審核學生
            {activeTab === 'students' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#E65100]"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'leave' ? 'text-[#E65100]' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            請假申請
            {activeTab === 'leave' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#E65100]"
              />
            )}
          </button>
        </div>

        {activeTab === 'leave' ? (
          /* Leave Requests UI */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {loadingLeaveRequests ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
                <p className="text-[#4B4036]">載入申請中...</p>
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-10 bg-white/50 rounded-2xl border border-[#EADBC8]">
                <p className="text-[#4B4036]">目前沒有待處理的請假申請</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaveRequests.map((request) => (
                  <HanamiCard key={request.id} className="p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <CalendarIcon className="w-24 h-24 text-[#FFD59A]" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-[#4B4036]">{request.student?.full_name}</h3>
                          <p className="text-sm text-[#4B4036]/70">{request.student?.nick_name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.leave_type === 'sick' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                          {request.leave_type === 'sick' ? '病假' : '事假'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-[#4B4036]/80">
                          <CalendarIcon className="w-4 h-4 mr-2 text-[#A68A64]" />
                          <span>申請日期: {new Date(request.lesson_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm text-[#4B4036]/80">
                          <ClockIcon className="w-4 h-4 mr-2 text-[#A68A64]" />
                          <span>狀態: {request.status === 'pending' ? '待審核' : request.status === 'approved' ? '已批准' : '已拒絕'}</span>
                        </div>
                        {request.proof_url && (
                          <div className="flex items-center text-sm text-[#4B4036]/80">
                            <LinkIcon className="w-4 h-4 mr-2 text-[#A68A64]" />
                            <a href={request.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              查看證明文件
                            </a>
                          </div>
                        )}
                      </div>

                      {request.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedLeaveRequest(request);
                            setShowLeaveReviewModal(true);
                          }}
                          className="w-full py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all active:scale-95"
                        >
                          審核申請
                        </button>
                      )}
                    </div>
                  </HanamiCard>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* Existing Students List UI */
          <>
            {/* 過濾器 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#EADBC8] mb-6"
            >
              <div className="flex flex-wrap gap-3">
                {showTrialStudents ? (
                  /* 試堂學生頁面：顯示返回按鍵 */
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowTrialStudents(false);
                      setFilterStatus('all');
                    }}
                    className="px-4 py-2 rounded-xl font-medium transition-all bg-white/70 border border-[#EADBC8] text-[#4B4036] hover:bg-white flex items-center gap-2 shadow-sm"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    返回待審核學生
                  </motion.button>
                ) : (
                  /* 待審核學生頁面：顯示過濾按鍵和試堂學生按鍵 */
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterStatus('all')}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${filterStatus === 'all'
                        ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-lg'
                        : 'bg-white/70 border border-[#EADBC8] text-[#4B4036] hover:bg-white shadow-sm'
                        }`}
                    >
                      全部
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterStatus('pending')}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${filterStatus === 'pending'
                        ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-lg'
                        : 'bg-white/70 border border-[#EADBC8] text-[#4B4036] hover:bg-white shadow-sm'
                        }`}
                    >
                      未確認
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterStatus('approved')}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${filterStatus === 'approved'
                        ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-lg'
                        : 'bg-white/70 border border-[#EADBC8] text-[#4B4036] hover:bg-white shadow-sm'
                        }`}
                    >
                      已確認
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowTrialStudents(true);
                        loadTrialStudents();
                      }}
                      className="px-4 py-2 rounded-xl font-medium transition-all bg-white/70 border border-[#EADBC8] text-[#4B4036] hover:bg-white shadow-sm"
                    >
                      試堂學生
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowLinkModal(true);
                        loadRegistrationLinks();
                      }}
                      className="px-4 py-2 rounded-xl font-medium transition-all bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:from-[#EBC9A4] hover:to-[#FFD59A] shadow-sm flex items-center gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      生成報名連結
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>

            {/* 學生列表 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-[#EADBC8] overflow-hidden"
            >
              {showTrialStudents ? (
                loadingTrialStudents ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
                    <p className="text-[#4B4036]">載入中...</p>
                  </div>
                ) : trialStudents.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[#4B4036]">目前沒有未確認支付的試堂學生</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* 試堂學生批量操作欄 */}
                    {selectedTrialStudentIds.length > 0 && (
                      <div className="bg-[#FFE0E0] border-b border-[#EADBC8] px-6 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#4B4036]">
                          已選擇 {selectedTrialStudentIds.length} 個試堂學生
                        </span>
                        <motion.button
                          onClick={deleteSelectedTrialStudents}
                          disabled={isDeletingTrial}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <TrashIcon className="w-4 h-4 mr-2" />
                          {isDeletingTrial ? '刪除中...' : '刪除選中'}
                        </motion.button>
                      </div>
                    )}
                    <table className="w-full">
                      <thead className="bg-[#FFF9F2] border-b border-[#EADBC8]">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">
                            <input
                              type="checkbox"
                              checked={trialStudents.length > 0 && selectedTrialStudentIds.length === trialStudents.length}
                              onChange={toggleSelectAllTrial}
                              className="w-4 h-4 text-[#FFD59A] border-[#EADBC8] rounded focus:ring-[#FFD59A]"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">學生資訊</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">課程資訊</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">付款資訊</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">狀態</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">報名時間</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EADBC8]">
                        {trialStudents.map((student, index) => (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`hover:bg-[#FFF9F2]/50 ${selectedTrialStudentIds.includes(student.id) ? 'bg-[#FFE0E0]/30' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedTrialStudentIds.includes(student.id)}
                                onChange={() => toggleTrialStudentSelection(student.id)}
                                className="w-4 h-4 text-[#FFD59A] border-[#EADBC8] rounded focus:ring-[#FFD59A]"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-[#4B4036]">{student.full_name || '未填寫'}</p>
                                {student.nick_name && (
                                  <p className="text-sm text-[#2B3A3B]">暱稱: {student.nick_name}</p>
                                )}
                                <p className="text-sm text-[#2B3A3B]">ID: {student.student_oid}</p>
                                {student.student_age && (
                                  <p className="text-sm text-[#2B3A3B]">
                                    {Math.floor(student.student_age / 12)}歲{student.student_age % 12}個月
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-[#4B4036]">{student.course_type || '未指定'}</p>
                                {student.lesson_date && (
                                  <p className="text-sm text-[#2B3A3B]">
                                    試堂日期: {new Date(student.lesson_date).toLocaleDateString('zh-TW')}
                                  </p>
                                )}
                                {student.actual_timeslot && (
                                  <p className="text-sm text-[#2B3A3B]">
                                    時間: {student.actual_timeslot}
                                  </p>
                                )}
                                {student.trial_status && (
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${student.trial_status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                    }`}>
                                    {student.trial_status === 'pending' ? '待安排' : '已安排'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                {student.contact_number && (
                                  <p className="text-sm text-[#2B3A3B] flex items-center">
                                    <PhoneIcon className="w-4 h-4 mr-1" />
                                    {student.contact_number}
                                  </p>
                                )}
                                {student.parent_email && (
                                  <p className="text-sm text-[#2B3A3B] flex items-center mt-1">
                                    <EnvelopeIcon className="w-4 h-4 mr-1" />
                                    {student.parent_email}
                                  </p>
                                )}
                                <p className="text-sm text-[#2B3A3B] mt-1">
                                  支付方式: {student.payment_method || '未指定'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                未確認支付
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-[#2B3A3B]">
                                {new Date(student.created_at).toLocaleDateString('zh-TW')}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <motion.button
                                onClick={() => {
                                  if (confirm('確認將此試堂學生的支付狀態更新為已確認？')) {
                                    updateTrialStudentPayment(student.id);
                                  }
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm"
                              >
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                確認支付
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="overflow-x-auto">
                  {/* 批量操作欄 */}
                  {selectedStudentIds.length > 0 && (
                    <div className="bg-[#FFE0E0] border-b border-[#EADBC8] px-6 py-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-[#4B4036]">
                        已選擇 {selectedStudentIds.length} 個學生
                      </span>
                      <motion.button
                        onClick={deleteSelectedStudents}
                        disabled={isDeleting}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        {isDeleting ? '刪除中...' : '刪除選中'}
                      </motion.button>
                    </div>
                  )}
                  <table className="w-full">
                    <thead className="bg-[#FFF9F2] border-b border-[#EADBC8]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">
                          <input
                            type="checkbox"
                            checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 text-[#FFD59A] border-[#EADBC8] rounded focus:ring-[#FFD59A]"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">學生資訊</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">課程資訊</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">付款資訊</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">狀態</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">報名時間</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#4B4036]">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADBC8]">
                      {filteredStudents.map((student, index) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`hover:bg-[#FFF9F2]/50 ${selectedStudentIds.includes(student.id) ? 'bg-[#FFE0E0]/30' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              className="w-4 h-4 text-[#FFD59A] border-[#EADBC8] rounded focus:ring-[#FFD59A]"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-[#4B4036]">{student.full_name}</p>
                              <p className="text-sm text-[#2B3A3B]">ID: {student.student_oid}</p>
                              {student.nick_name && (
                                <p className="text-sm text-[#2B3A3B]">暱稱: {student.nick_name}</p>
                              )}
                              <p className="text-sm text-[#2B3A3B]">
                                {student.student_age ? `${Math.floor(student.student_age / 12)}歲${student.student_age % 12}個月` : '年齡未知'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-[#4B4036]">{student.course_type}</p>
                              <p className="text-sm text-[#2B3A3B]">{student.selected_plan_name}</p>
                              {student.regular_weekday !== null && (
                                <p className="text-sm text-[#2B3A3B]">
                                  星期{getWeekdayName(student.regular_weekday || 0)} {student.regular_timeslot}
                                </p>
                              )}
                              <p className="text-sm text-[#2B3A3B]">
                                {student.package_lessons} 堂課
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-[#4B4036]">
                                ${student.payment_amount?.toLocaleString()}
                              </p>
                              <p className="text-sm text-[#2B3A3B]">{student.payment_method}</p>
                              <p className="text-sm text-[#2B3A3B]">{student.contact_number}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.review_status)}`}>
                              {getStatusText(student.review_status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-[#2B3A3B]">
                              {new Date(student.enrollment_date).toLocaleDateString('zh-TW')}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowModal(true);
                              }}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#FFD59A] hover:bg-[#EBC9A4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFD59A] transition-colors"
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              查看詳情
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* 詳情模態框 */}
            {showModal && selectedStudent && (
              <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8]"
                >
                  <h2 className="text-2xl font-bold text-[#4B4036] mb-6">學生詳情</h2>

                  {/* 正式學生選擇區域 */}
                  <div className="bg-gradient-to-r from-[#EBC9A4] to-[#FFB6C1] rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#4B4036] flex items-center">
                        <AcademicCapIcon className="w-5 h-5 mr-2" />
                        新增時間表
                      </h3>
                      <button
                        onClick={loadRegularStudents}
                        disabled={loadingRegularStudents}
                        className="px-3 py-1 bg-white bg-opacity-50 rounded-lg text-sm text-[#4B4036] hover:bg-opacity-70 transition-colors disabled:opacity-50"
                      >
                        {loadingRegularStudents ? '載入中...' : '重新載入'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {selectedStudent.review_status === 'pending' ? (
                        <>
                          <label className="block text-sm font-medium text-[#4B4036]">
                            選擇要新增時間表的學生：
                          </label>
                          <SearchableSelect
                            options={[
                              // 添加「新學生」選項
                              {
                                id: 'new_student',
                                label: '創建新學生',
                                value: 'new_student',
                                subtitle: '為此待審核學生創建新的正式學生記錄',
                                metadata: { id: 'new_student', full_name: '新學生', isNew: true }
                              },
                              // 現有學生選項
                              ...regularStudents.map(student => ({
                                id: student.id,
                                label: student.full_name,
                                value: student.student_oid,
                                subtitle: `${student.course_type} • 總堂數: ${student.total_lessons} • 淨餘: ${student.net_remaining_lessons}`,
                                metadata: student
                              }))
                            ]}
                            value={selectedRegularStudent?.id || ''}
                            onChange={(value, option) => {
                              if (value === 'new_student') {
                                // 設置為新學生選項
                                setSelectedRegularStudent({
                                  id: 'new_student',
                                  full_name: '新學生',
                                  isNew: true
                                } as any);
                                // 初始化新學生表單
                                if (selectedStudent) {
                                  initializeNewStudentForm(selectedStudent);
                                }
                              } else {
                                const student = regularStudents.find(s => s.id === value);
                                setSelectedRegularStudent(student || null);
                                // 清除新學生表單
                                setNewStudentForm(null);
                              }
                            }}
                            placeholder="請選擇學生..."
                            searchPlaceholder="搜尋學生姓名、ID 或課程類型..."
                            loading={loadingRegularStudents}
                            emptyMessage="沒有找到符合條件的學生"
                          />
                        </>
                      ) : (
                        <>
                          <label className="block text-sm font-medium text-[#4B4036]">
                            已選擇的學生：
                          </label>
                          <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-[#EADBC8]">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-[#4B4036]">
                                  {selectedStudent.selected_regular_student_name || '未知學生'}
                                </p>
                                <p className="text-sm text-[#2B3A3B]">
                                  學生 ID: {selectedStudent.selected_regular_student_id || '未知'}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  已確認
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedRegularStudent && selectedRegularStudent.id !== 'new_student' && (
                        <div className="bg-white bg-opacity-50 rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-[#4B4036]">總堂數</p>
                              <p className="text-lg font-bold text-[#4B4036]">{selectedRegularStudent.total_lessons} 堂</p>
                            </div>
                            <div>
                              <p className="font-medium text-[#4B4036]">已完成</p>
                              <p className="text-lg font-bold text-[#4B4036]">{selectedRegularStudent.completed_lessons} 堂</p>
                            </div>
                            <div>
                              <p className="font-medium text-[#4B4036]">剩餘堂數</p>
                              <p className="text-lg font-bold text-[#4B4036]">{selectedRegularStudent.remaining_lessons} 堂</p>
                            </div>
                            <div>
                              <p className="font-medium text-[#4B4036]">淨餘堂數</p>
                              <p className="text-lg font-bold text-[#4B4036]">{selectedRegularStudent.net_remaining_lessons} 堂</p>
                            </div>
                          </div>

                          {selectedRegularStudent.packages && selectedRegularStudent.packages.length > 0 && (
                            <div className="mt-3">
                              <p className="font-medium text-[#4B4036] mb-2">課程包詳情：</p>
                              <div className="space-y-2">
                                {selectedRegularStudent.packages.map((pkg) => (
                                  <div key={pkg.id} className="bg-white bg-opacity-30 rounded p-2 text-xs">
                                    <p><span className="font-medium">課程：</span>{pkg.course_name}</p>
                                    <p><span className="font-medium">總堂數：</span>{pkg.total_lessons} 堂</p>
                                    <p><span className="font-medium">剩餘：</span>{pkg.remaining_lessons} 堂</p>
                                    <p><span className="font-medium">時間：</span>星期{getWeekdayName(parseInt(pkg.weekday))} {pkg.lesson_time}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 新學生選項顯示 */}
                      {selectedRegularStudent && selectedRegularStudent.id === 'new_student' && (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] rounded-lg p-4 border border-[#EADBC8]">
                            <div className="text-center">
                              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-[#FFD59A] to-[#FFB6C1] mb-3">
                                <svg className="h-6 w-6 text-[#4B4036]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </div>
                              <p className="font-semibold text-[#4B4036] text-lg mb-2">
                                創建新學生
                              </p>
                              <p className="text-[#2B3A3B] text-sm">
                                將為待審核學生創建全新的正式學生記錄
                              </p>
                              <p className="text-[#2B3A3B] text-sm mt-1">
                                並新增 <span className="font-bold text-[#FFB6C1]">{selectedStudent?.package_lessons || 0}</span> 堂課
                              </p>
                            </div>
                          </div>

                          {/* 新學生表單 */}
                          {newStudentForm && (
                            <div className="bg-white rounded-lg p-6 border border-[#EADBC8] shadow-sm">
                              <h3 className="text-lg font-semibold text-[#4B4036] mb-4">新學生詳細信息</h3>
                              <div className="max-h-96 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  {/* 基本資料 */}
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-[#4B4036] border-b border-[#EADBC8] pb-1">基本資料</h4>

                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">姓名 *</label>
                                      <input
                                        type="text"
                                        value={newStudentForm.full_name}
                                        onChange={(e) => setNewStudentForm({ ...newStudentForm, full_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] border-2 border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] focus:outline-none transition-all duration-200 hover:border-[#FFD59A] shadow-sm hover:shadow-md"
                                        placeholder="請輸入學生姓名"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">暱稱</label>
                                      <input
                                        type="text"
                                        value={newStudentForm.nick_name}
                                        onChange={(e) => setNewStudentForm({ ...newStudentForm, nick_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] border-2 border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] focus:outline-none transition-all duration-200 hover:border-[#FFD59A] shadow-sm hover:shadow-md"
                                        placeholder="請輸入暱稱"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">聯絡電話 *</label>
                                      <input
                                        type="text"
                                        value={newStudentForm.contact_number}
                                        onChange={(e) => setNewStudentForm({ ...newStudentForm, contact_number: e.target.value })}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] border-2 border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] focus:outline-none transition-all duration-200 hover:border-[#FFD59A] shadow-sm hover:shadow-md"
                                        placeholder="請輸入聯絡電話"
                                      />
                                    </div>


                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">家長郵箱</label>
                                      <input
                                        type="email"
                                        value={newStudentForm.parent_email}
                                        onChange={(e) => setNewStudentForm({ ...newStudentForm, parent_email: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">性別</label>
                                      <div className="relative">
                                        <select
                                          value={newStudentForm.gender}
                                          onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value })}
                                          className="w-full px-4 py-3 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] border-2 border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] focus:outline-none transition-all duration-200 appearance-none cursor-pointer hover:border-[#FFD59A] shadow-sm hover:shadow-md"
                                        >
                                          <option value="" className="text-[#2B3A3B]">請選擇性別</option>
                                          <option value="男" className="text-[#4B4036] bg-[#FFF9F2]">男</option>
                                          <option value="女" className="text-[#4B4036] bg-[#FFF9F2]">女</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                          <svg className="w-5 h-5 text-[#FFB6C1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 課程資料 */}
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-[#4B4036] border-b border-[#EADBC8] pb-1">課程資料</h4>

                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">課程類型</label>
                                      <input
                                        type="text"
                                        value={newStudentForm.course_type}
                                        onChange={(e) => setNewStudentForm({ ...newStudentForm, course_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent"
                                      />
                                    </div>


                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">上課星期</label>
                                      <div className="relative">
                                        <select
                                          value={newStudentForm.regular_weekday || ''}
                                          onChange={(e) => setNewStudentForm({ ...newStudentForm, regular_weekday: e.target.value ? parseInt(e.target.value) : null })}
                                          className="w-full px-4 py-3 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] border-2 border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] focus:outline-none transition-all duration-200 appearance-none cursor-pointer hover:border-[#FFD59A] shadow-sm hover:shadow-md"
                                        >
                                          <option value="" className="text-[#2B3A3B]">請選擇上課星期</option>
                                          <option value="0" className="text-[#4B4036] bg-[#FFF9F2]">星期日</option>
                                          <option value="1" className="text-[#4B4036] bg-[#FFF9F2]">星期一</option>
                                          <option value="2" className="text-[#4B4036] bg-[#FFF9F2]">星期二</option>
                                          <option value="3" className="text-[#4B4036] bg-[#FFF9F2]">星期三</option>
                                          <option value="4" className="text-[#4B4036] bg-[#FFF9F2]">星期四</option>
                                          <option value="5" className="text-[#4B4036] bg-[#FFF9F2]">星期五</option>
                                          <option value="6" className="text-[#4B4036] bg-[#FFF9F2]">星期六</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                          <svg className="w-5 h-5 text-[#FFB6C1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">上課時間</label>
                                      <input
                                        type="time"
                                        value={newStudentForm.regular_timeslot}
                                        onChange={(e) => setNewStudentForm({ ...newStudentForm, regular_timeslot: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">開始日期</label>
                                      <input
                                        type="date"
                                        value={newStudentForm.started_date}
                                        onChange={(e) => setNewStudentForm({ ...newStudentForm, started_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent"
                                      />
                                    </div>

                                  </div>
                                </div>

                                {/* 其他資料 */}
                                <div className="mt-4 space-y-3">
                                  <h4 className="font-semibold text-[#4B4036] border-b border-[#EADBC8] pb-1">其他資料</h4>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">地址</label>
                                      <input
                                        type="text"
                                        value={newStudentForm.address}
                                        onChange={(e) => setNewStudentForm({ ...newStudentForm, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[#4B4036] font-medium mb-1">學校</label>
                                      <input
                                        type="text"
                                        value={newStudentForm.school}
                                        onChange={(e) => setNewStudentForm({ ...newStudentForm, school: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[#4B4036] font-medium mb-1">健康狀況備註</label>
                                    <textarea
                                      value={newStudentForm.health_notes}
                                      onChange={(e) => setNewStudentForm({ ...newStudentForm, health_notes: e.target.value })}
                                      rows={2}
                                      className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[#4B4036] font-medium mb-1">學生備註</label>
                                    <textarea
                                      value={newStudentForm.student_remarks}
                                      onChange={(e) => setNewStudentForm({ ...newStudentForm, student_remarks: e.target.value })}
                                      rows={2}
                                      className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 預覽堂數和時間卡片 */}
                  <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-sm text-[#4B4036] font-medium">預覽堂數</p>
                        <p className="text-2xl font-bold text-[#4B4036]">{selectedStudent.package_lessons || 0} 堂</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-[#4B4036] font-medium">上課時間</p>
                        <p className="text-lg font-bold text-[#4B4036]">
                          {selectedStudent.regular_weekday !== null ? `星期${getWeekdayName(selectedStudent.regular_weekday || 0)}` : '未設定'}
                        </p>
                        <p className="text-sm text-[#4B4036]">
                          {selectedStudent.regular_timeslot || '未設定時間'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-[#4B4036] font-medium">課程費用</p>
                        <p className="text-xl font-bold text-[#4B4036]">${selectedStudent.package_price?.toLocaleString() || 0}</p>
                      </div>
                    </div>

                    {/* 開始日期顯示 */}
                    <div className="mt-4 pt-4 border-t border-[#EADBC8]">
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <p className="text-sm text-[#4B4036] font-medium">開始日期</p>
                          <p className="text-lg font-bold text-[#4B4036]">
                            {selectedRegularStudent && selectedRegularStudent.id === 'new_student' ? (
                              (selectedStudent as any).started_date || '未設定'
                            ) : selectedRegularStudent && (selectedRegularStudent as any).lastLessonDate ? (
                              (() => {
                                const lastLessonDate = new Date((selectedRegularStudent as any).lastLessonDate);
                                const newStartDate = new Date(lastLessonDate);
                                newStartDate.setDate(lastLessonDate.getDate() + 7);
                                return newStartDate.toLocaleDateString('zh-TW', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                });
                              })()
                            ) : (
                              (selectedStudent as any).started_date || '未設定'
                            )}
                          </p>
                          {selectedRegularStudent && selectedRegularStudent.id === 'new_student' ? (
                            <p className="text-xs text-[#2B3A3B] mt-1">
                              使用待審核學生的開始日期
                            </p>
                          ) : selectedRegularStudent && (selectedRegularStudent as any).lastLessonDate && (
                            <p className="text-xs text-[#2B3A3B] mt-1">
                              基於 {selectedRegularStudent.full_name} 最後一堂課加一星期
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 課程時間表安排 */}
                  {selectedStudent && (selectedStudent.package_lessons || 0) > 0 && (
                    <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <CalendarDaysIcon className="w-5 h-5 text-[#4B4036] mr-2" />
                          <h3 className="text-lg font-semibold text-[#4B4036]">課程時間表安排</h3>
                        </div>
                        {selectedRegularStudent && (selectedRegularStudent as any).lastLessonDate && (
                          <div className="text-xs text-[#4B4036] bg-[#E0F2E0] px-2 py-1 rounded">
                            基於 {selectedRegularStudent.full_name} 最後一堂課 ({(selectedRegularStudent as any).lastLessonDate}) 加一星期計算
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {getDisplayLessons().map((lesson, index) => (
                          <div key={lesson.id} className="bg-white bg-opacity-70 rounded-lg p-3 border border-[#EADBC8] relative">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-[#4B4036]">第 {lesson.lessonNumber} 堂</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#4B4036] bg-[#FFD59A] px-2 py-1 rounded-full">
                                  {lesson.weekday}
                                </span>
                                <button
                                  onClick={() => handleEditLesson(lesson)}
                                  className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                                  title="編輯時間"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {editingLesson && editingLesson.id === lesson.id ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs text-[#4B4036] mb-1">日期</label>
                                  <input
                                    type="date"
                                    defaultValue={lesson.rawDate}
                                    className="w-full text-xs p-2 border border-[#EADBC8] rounded focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                                    id={`date-${lesson.id}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-[#4B4036] mb-1">時間</label>
                                  <input
                                    type="time"
                                    defaultValue={lesson.time}
                                    className="w-full text-xs p-2 border border-[#EADBC8] rounded focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                                    id={`time-${lesson.id}`}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const dateInput = document.getElementById(`date-${lesson.id}`) as HTMLInputElement;
                                      const timeInput = document.getElementById(`time-${lesson.id}`) as HTMLInputElement;
                                      handleSaveLessonEdit(lesson.id, dateInput.value, timeInput.value);
                                    }}
                                    className="flex-1 bg-[#FFD59A] text-[#4B4036] text-xs py-1 px-2 rounded hover:bg-[#EBC9A4] transition-colors"
                                  >
                                    儲存
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded hover:bg-gray-300 transition-colors"
                                  >
                                    取消
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-[#4B4036]">
                                <p className="font-medium">{lesson.date}</p>
                                <p className="text-[#2B3A3B]">{lesson.time}</p>
                                <p className="text-xs text-[#2B3A3B] mt-1">{lesson.courseType}</p>
                                {editedLessons.find(el => el.id === lesson.id) && (
                                  <span className="text-xs text-green-600 font-medium">已修改</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-[#E0F2E0] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-[#4B4036]">
                            <span className="font-medium">課程總計：</span>
                            {selectedStudent.package_lessons} 堂課程，每週 {selectedStudent.regular_weekday !== null ? `星期${getWeekdayName(selectedStudent.regular_weekday || 0)}` : '未設定'} {selectedStudent.regular_timeslot} 上課
                          </p>
                          {editedLessons.length > 0 && (
                            <span className="text-xs text-orange-600 font-medium">
                              已修改 {editedLessons.length} 堂課程
                            </span>
                          )}
                        </div>

                        {editedLessons.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-[#4B4036]">
                                有 {editedLessons.length} 堂課程的時間已調整
                              </p>
                              <button
                                onClick={() => {
                                  // 這裡可以添加保存到資料庫的邏輯
                                  alert(`已保存 ${editedLessons.length} 堂課程的時間調整`);
                                  setEditedLessons([]);
                                }}
                                className="bg-[#FFD59A] text-[#4B4036] text-xs py-1 px-3 rounded hover:bg-[#EBC9A4] transition-colors"
                              >
                                保存修改
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-medium text-[#4B4036] mb-3">基本資訊</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">姓名:</span> {selectedStudent.full_name}</p>
                        <p><span className="font-medium">暱稱:</span> {selectedStudent.nick_name || '無'}</p>
                        <p><span className="font-medium">年齡:</span> {selectedStudent.student_age ? `${Math.floor(selectedStudent.student_age / 12)}歲${selectedStudent.student_age % 12}個月` : '未知'}</p>
                        <p><span className="font-medium">性別:</span> {selectedStudent.gender || '未知'}</p>
                        <p><span className="font-medium">聯絡電話:</span> {selectedStudent.contact_number}</p>
                        <p><span className="font-medium">家長電郵:</span> {selectedStudent.parent_email || '無'}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-[#4B4036] mb-3">課程資訊</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">課程類型:</span> {selectedStudent.course_type}</p>
                        <p><span className="font-medium">課程計劃:</span> {selectedStudent.selected_plan_name || '無'}</p>
                        <p><span className="font-medium">開始日期:</span> {
                          selectedRegularStudent && (selectedRegularStudent as any).lastLessonDate ? (
                            (() => {
                              const lastLessonDate = new Date((selectedRegularStudent as any).lastLessonDate);
                              const newStartDate = new Date(lastLessonDate);
                              newStartDate.setDate(lastLessonDate.getDate() + 7);
                              return newStartDate.toLocaleDateString('zh-TW', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              });
                            })()
                          ) : (
                            (selectedStudent as any).started_date || '未設定'
                          )
                        }</p>
                        <p><span className="font-medium">課程時長:</span> {(selectedStudent as any).duration_months || 0} 個月</p>
                        <p><span className="font-medium">剩餘堂數:</span> {(selectedStudent as any).upcoming_lessons || 0} 堂</p>
                        <p><span className="font-medium">學生偏好:</span> {(selectedStudent as any).student_preference || '無'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-medium text-[#4B4036] mb-3">付款資訊</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <p><span className="font-medium">付款金額:</span> ${selectedStudent.payment_amount?.toLocaleString() || 0}</p>
                      <p><span className="font-medium">付款方式:</span> {selectedStudent.payment_method || '未知'}</p>
                    </div>

                    {/* 付款截圖顯示 */}
                    {(selectedStudent.payment_method === '截圖' || selectedStudent.payment_method === 'screenshot') && (
                      <div className="mt-4">
                        <h4 className="font-medium text-[#4B4036] mb-2">付款截圖</h4>
                        {paymentScreenshotUrl ? (
                          <div className="relative max-w-md">
                            <Image
                              src={paymentScreenshotUrl}
                              alt="付款截圖"
                              width={400}
                              height={300}
                              className="rounded-lg border border-[#EADBC8] shadow-md"
                              style={{ objectFit: 'contain' }}
                              onError={() => {
                                console.log('圖片載入失敗');
                                setPaymentScreenshotUrl(null);
                              }}
                            />
                            <div className="mt-2 text-xs text-[#2B3A3B]">
                              截圖來源: hanami-saas-system payment-screenshots bucket
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-[#FFE0E0] to-[#FFD59A] rounded-lg p-4 text-center">
                            <div className="text-[#4B4036] mb-2">
                              <svg className="w-8 h-8 mx-auto mb-2 text-[#FF6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <p className="font-medium">付款截圖無法載入</p>
                            </div>
                            <div className="text-sm text-[#2B3A3B] space-y-1">
                              <p>可能的原因：</p>
                              <ul className="text-xs text-left mt-2 space-y-1">
                                <li>• 截圖檔案尚未上傳到系統</li>
                                <li>• 檔案路徑或命名不正確</li>
                                <li>• 系統權限問題</li>
                              </ul>
                              <p className="text-xs mt-2 text-[#4B4036]">
                                請聯繫技術支援或重新上傳付款截圖
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedStudent && selectedStudent.review_status === 'pending' && (
                    <div className="mb-6">
                      <h3 className="font-medium text-[#4B4036] mb-3">操作選項</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#4B4036] mb-2">審核備註</label>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                            rows={3}
                            placeholder="輸入審核備註..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#4B4036] mb-2">拒絕原因（如適用）</label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                            rows={2}
                            placeholder="輸入拒絕原因..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-[#EADBC8] text-[#4B4036] rounded-lg hover:bg-[#FFF9F2] transition-colors"
                    >
                      關閉
                    </button>

                    {selectedStudent && selectedStudent.review_status === 'pending' && (
                      <button
                        onClick={showConfirmationModal}
                        className="px-4 py-2 bg-gradient-to-r from-[#EBC9A4] to-[#FFB6C1] text-[#4B4036] rounded-lg hover:from-[#FFD59A] hover:to-[#FFB6C1] transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        確認
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}

            {/* 確認視窗 */}
            {showConfirmModal && (
              <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[9999] p-2 sm:p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] shadow-2xl flex flex-col mx-2 sm:mx-4"
                >
                  {/* 標題區域 - 固定 */}
                  <div className="text-center mb-4 sm:mb-6">
                    {/* 圖標 */}
                    <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-r from-[#FFD59A] to-[#FFB6C1] mb-4 sm:mb-6">
                      <svg className="h-6 w-6 sm:h-8 sm:w-8 text-[#4B4036]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    {/* 標題 */}
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#4B4036] mb-3 sm:mb-4 px-2">
                      {selectedRegularStudent?.id === 'new_student' ? '確認創建新學生' : '確認操作'}
                    </h3>
                  </div>

                  {/* 內容區域 - 可滾動 */}
                  <div className="flex-1 overflow-y-auto mb-4 sm:mb-6">
                    <div className="text-[#2B3A3B] space-y-3">
                      <p className="text-base sm:text-lg px-2">
                        {selectedRegularStudent?.id === 'new_student'
                          ? '您確定要創建新學生並新增堂數嗎？'
                          : '您確定要為以下學生新增堂數嗎？'
                        }
                      </p>

                      {selectedRegularStudent && selectedStudent && (
                        <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] rounded-xl p-4 border border-[#EADBC8]">
                          {selectedRegularStudent.id === 'new_student' ? (
                            <div>
                              <div className="text-center mb-4">
                                <p className="font-semibold text-[#4B4036] text-lg">
                                  創建新學生
                                </p>
                                <p className="text-[#2B3A3B] mt-1">
                                  將為 <span className="font-bold text-[#FFB6C1]">{selectedStudent.full_name}</span> 創建正式學生記錄
                                </p>
                                <p className="text-[#2B3A3B] mt-1">
                                  並新增 <span className="font-bold text-[#FFB6C1]">{selectedStudent.package_lessons}</span> 堂課
                                </p>
                              </div>

                              {/* 簡潔的確認信息 */}
                              <div className="text-center px-2">
                                <div className="bg-gradient-to-r from-[#E0F2E0] to-[#FFF9F2] rounded-lg sm:rounded-xl p-4 sm:p-6 border border-[#EADBC8]">
                                  <div className="flex flex-col sm:flex-row items-center justify-center mb-3 sm:mb-4">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#10B981] mb-2 sm:mb-0 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <h4 className="text-base sm:text-lg font-semibold text-[#4B4036]">新學生信息摘要</h4>
                                  </div>

                                  <div className="space-y-2 text-xs sm:text-sm text-[#2B3A3B]">
                                    <p className="break-words"><span className="font-medium">姓名：</span>{newStudentForm?.full_name || '未設定'}</p>
                                    <p className="break-words"><span className="font-medium">聯絡電話：</span>{newStudentForm?.contact_number || '未設定'}</p>
                                    <p className="break-words"><span className="font-medium">課程類型：</span>{newStudentForm?.course_type || '未設定'}</p>
                                    <p className="break-words"><span className="font-medium">上課時間：</span>
                                      {newStudentForm?.regular_weekday !== null && newStudentForm?.regular_weekday !== undefined
                                        ? `星期${['日', '一', '二', '三', '四', '五', '六'][newStudentForm.regular_weekday]} ${newStudentForm.regular_timeslot || ''}`
                                        : '未設定'
                                      }
                                    </p>
                                    <p className="break-words"><span className="font-medium">開始日期：</span>{newStudentForm?.started_date || '未設定'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="font-semibold text-[#4B4036] text-lg">
                                {selectedRegularStudent.full_name}
                              </p>
                              <p className="text-[#2B3A3B] mt-1">
                                將新增 <span className="font-bold text-[#FFB6C1]">{selectedStudent.package_lessons}</span> 堂課
                              </p>
                              <p className="text-sm text-[#2B3A3B] mt-2">
                                待審核學生：{selectedStudent.full_name}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-xs sm:text-sm text-[#2B3A3B] bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2 mx-2">
                        <svg className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="break-words">
                          {selectedRegularStudent?.id === 'new_student'
                            ? '此操作將創建新的正式學生記錄並確認待審核學生狀態，無法撤銷。'
                            : '此操作將直接更新正式學生的堂數並確認待審核學生狀態，無法撤銷。'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 按鍵區域 - 固定在底部 */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-3 sm:pt-4 border-t border-[#EADBC8]">
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-[#EADBC8] text-[#4B4036] rounded-lg sm:rounded-xl font-medium hover:bg-[#FFF9F2] transition-all duration-200 text-sm sm:text-base"
                    >
                      取消
                    </button>
                    <button
                      onClick={updateRegularStudentLessons}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#EBC9A4] to-[#FFB6C1] text-[#4B4036] rounded-lg sm:rounded-xl font-medium hover:from-[#FFD59A] hover:to-[#FFB6C1] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                    >
                      {selectedRegularStudent?.id === 'new_student' ? '確認創建' : '確認執行'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* 報名連結管理彈窗 */}
            {showLinkModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[#4B4036] flex items-center gap-2">
                      <LinkIcon className="w-6 h-6" />
                      生成報名連結管理
                    </h2>
                    <button
                      onClick={() => setShowLinkModal(false)}
                      className="p-2 hover:bg-[#FFF9F2] rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
                    </button>
                  </div>

                  {/* 生成新連結按鈕 */}
                  <div className="mb-6 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={openLinkFormModal}
                      disabled={generatingLink}
                      className="px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      創建新連結
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => loadRegistrationLinks()}
                      disabled={loadingLinks}
                      className="px-4 py-2 bg-white border border-[#EADBC8] text-[#4B4036] rounded-lg font-medium hover:bg-[#FFF9F2] transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <ArrowPathIcon className={`w-4 h-4 ${loadingLinks ? 'animate-spin' : ''}`} />
                      刷新
                    </motion.button>
                  </div>

                  {/* 連結列表 */}
                  {loadingLinks ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
                      <p className="text-[#4B4036]">載入中...</p>
                    </div>
                  ) : registrationLinks.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[#4B4036]">目前沒有報名連結</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {registrationLinks.map((link) => {
                        const isExpired = new Date(link.expires_at) < new Date();
                        const isCompleted = link.status === 'completed';
                        const formData = link.form_data || {};
                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                        const registrationUrl = `${baseUrl}/aihome/course-activities/register?token=${link.token}`;

                        return (
                          <motion.div
                            key={link.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#FFF9F2] border border-[#EADBC8] rounded-xl p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${link.link_type === 'trial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {link.link_type === 'trial' ? '試堂' : '常規'}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${isExpired || link.status === 'expired'
                                    ? 'bg-red-100 text-red-800'
                                    : isCompleted
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-green-100 text-green-800'
                                    }`}>
                                    {isExpired || link.status === 'expired'
                                      ? '已過期'
                                      : isCompleted
                                        ? '已完成'
                                        : '有效'}
                                  </span>
                                </div>
                                <p className="text-sm text-[#4B4036] font-medium mb-1">
                                  學生：{formData.childFullName || '未填寫'}
                                </p>
                                <p className="text-xs text-[#2B3A3B] mb-2">
                                  課程：{formData.courseType || '未指定'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-[#2B3A3B] mb-2">
                                  <span>創建時間：{new Date(link.created_at).toLocaleString('zh-TW')}</span>
                                  <span>過期時間：{new Date(link.expires_at).toLocaleString('zh-TW')}</span>
                                  {link.expiry_hours && (
                                    <span>時限：{link.expiry_hours} 小時
                                      {link.expiry_hours >= 24 && (
                                        <span>（{Math.floor(link.expiry_hours / 24)} 天{link.expiry_hours % 24 > 0 ? ` ${link.expiry_hours % 24} 小時` : ''}）</span>
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                  <input
                                    type="text"
                                    value={registrationUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 text-xs border border-[#EADBC8] rounded-lg bg-white text-[#4B4036]"
                                  />
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => copyLinkToClipboard(registrationUrl)}
                                    className="px-3 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors flex items-center gap-1 text-xs"
                                  >
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                    複製
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => deleteRegistrationLink(link.id)}
                                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 text-xs"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                    刪除
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {/* 報名連結表單彈窗 */}
            <AnimatePresence>
              {showLinkFormModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  onClick={() => setShowLinkFormModal(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] to-[#FFB6C1] rounded-xl flex items-center justify-center">
                          <LinkIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-[#4B4036]">創建報名連結</h2>
                          <p className="text-sm text-[#2B3A3B] mt-1">填寫報名資料後生成連結發送給客戶</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowLinkFormModal(false)}
                        className="p-2 rounded-full hover:bg-[#FFF9F2] transition-colors"
                      >
                        <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                      </motion.button>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      generateLinkFromForm();
                    }} className="space-y-6">
                      {/* 機構選擇 */}
                      <div>
                        <label htmlFor="organizationId" className="block text-sm font-medium text-[#4B4036] mb-2">
                          選擇機構 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <motion.select
                            id="organizationId"
                            value={linkFormData.organizationId}
                            onChange={(e) => {
                              setLinkFormData(prev => ({ ...prev, organizationId: e.target.value, courseType: '', selectedPlan: '' }));
                              if (e.target.value) {
                                loadCourseTypes(e.target.value);
                              }
                            }}
                            disabled={!!(orgId && organizations.length === 1)}
                            whileHover={orgId && organizations.length === 1 ? {} : { scale: 1.01 }}
                            whileTap={orgId && organizations.length === 1 ? {} : { scale: 0.99 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className={`w-full px-4 py-3 pr-10 bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] border-2 border-[#EADBC8] rounded-2xl text-[#4B4036] text-sm font-medium focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] transition-all duration-200 appearance-none shadow-sm hover:shadow-md focus:shadow-lg ${orgId && organizations.length === 1
                              ? 'disabled:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                              }`}
                          >
                            <option value="">請選擇機構</option>
                            {organizations.map(org => (
                              <option key={org.id} value={org.id}>{org.org_name}</option>
                            ))}
                          </motion.select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-5 h-5 text-[#EBC9A4]" size={20} />
                          </div>
                        </div>
                        {linkFormErrors.organizationId && (
                          <p className="text-red-500 text-xs mt-1">{linkFormErrors.organizationId}</p>
                        )}
                      </div>

                      {/* 課程性質 */}
                      <div>
                        <label className="block text-sm font-medium text-[#4B4036] mb-3">
                          課程性質 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                          <motion.label
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center space-x-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${linkFormData.courseNature === 'trial'
                              ? 'border-[#FFB6C1] bg-[#FFB6C1]/10'
                              : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]'
                              }`}
                          >
                            <input
                              type="radio"
                              value="trial"
                              checked={linkFormData.courseNature === 'trial'}
                              onChange={(e) => setLinkFormData(prev => ({ ...prev, courseNature: e.target.value as 'trial' | 'regular' }))}
                              className="w-4 h-4 text-[#FFB6C1] focus:ring-[#FFB6C1]"
                            />
                            <span className="text-[#4B4036] font-medium">試堂</span>
                          </motion.label>
                          <motion.label
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center space-x-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${linkFormData.courseNature === 'regular'
                              ? 'border-[#FFB6C1] bg-[#FFB6C1]/10'
                              : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]'
                              }`}
                          >
                            <input
                              type="radio"
                              value="regular"
                              checked={linkFormData.courseNature === 'regular'}
                              onChange={(e) => setLinkFormData(prev => ({ ...prev, courseNature: e.target.value as 'trial' | 'regular' }))}
                              className="w-4 h-4 text-[#FFB6C1] focus:ring-[#FFB6C1]"
                            />
                            <span className="text-[#4B4036] font-medium">常規</span>
                          </motion.label>
                        </div>
                      </div>

                      {/* 課程類型 */}
                      <div>
                        <label htmlFor="courseType" className="block text-sm font-medium text-[#4B4036] mb-2">
                          課程類型 <span className="text-red-500">*</span>
                        </label>
                        {loadingCourseTypes ? (
                          <div className="flex items-center space-x-2 text-sm text-[#2B3A3B]">
                            <div className="w-4 h-4 border-2 border-[#FFB6C1] border-t-transparent rounded-full animate-spin"></div>
                            <span>載入中...</span>
                          </div>
                        ) : (
                          <div className="relative">
                            <motion.select
                              id="courseType"
                              value={linkFormData.courseType}
                              onChange={(e) => {
                                setLinkFormData(prev => ({ ...prev, courseType: e.target.value, selectedPlan: '', selectedDate: '', selectedTimeSlot: '' }));
                                if (e.target.value) {
                                  loadPricingPlans(e.target.value);
                                  loadCourseSchedule(e.target.value);
                                } else {
                                  setWeekSchedule([]);
                                  setAvailableDates([]);
                                }
                              }}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              disabled={!linkFormData.organizationId}
                              className="w-full px-4 py-3 pr-10 bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] border-2 border-[#EADBC8] rounded-2xl text-[#4B4036] text-sm font-medium focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:shadow-md focus:shadow-lg disabled:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">{linkFormData.organizationId ? '請選擇課程類型' : '請先選擇機構'}</option>
                              {courseTypes.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                              ))}
                            </motion.select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <ChevronDown className="w-5 h-5 text-[#EBC9A4]" size={20} />
                            </div>
                          </div>
                        )}
                        {linkFormErrors.courseType && (
                          <p className="text-red-500 text-xs mt-1">{linkFormErrors.courseType}</p>
                        )}
                      </div>

                      {/* 日期時間區塊 */}
                      <div className="bg-gradient-to-r from-[#FFF9F2] to-[#F8F5EC] rounded-xl p-6 border border-[#EADBC8]">
                        <h3 className="text-lg font-semibold text-[#4B4036] mb-4 flex items-center">
                          <CalendarDaysIcon className="w-5 h-5 mr-2 text-[#FFB6C1]" />
                          日期時間
                        </h3>
                        <div className="space-y-3">
                          {loadingSchedule && (
                            <div className="flex items-center space-x-2 text-sm text-[#2B3A3B] mb-2">
                              <div className="w-4 h-4 border-2 border-[#FFB6C1] border-t-transparent rounded-full animate-spin"></div>
                              <span>載入課程時間中...</span>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="selectedDate" className="block text-sm font-medium text-[#4B4036] mb-2">
                                日期
                              </label>
                              <div className="relative">
                                <motion.select
                                  id="selectedDate"
                                  value={linkFormData.selectedDate}
                                  onChange={(e) => {
                                    setLinkFormData(prev => ({ ...prev, selectedDate: e.target.value, selectedTimeSlot: '' }));
                                  }}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                  disabled={!linkFormData.courseType || availableDates.length === 0}
                                  className="w-full px-4 py-3 pr-10 bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] border-2 border-[#EADBC8] rounded-2xl text-[#4B4036] text-sm font-medium focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:shadow-md focus:shadow-lg disabled:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">{linkFormData.courseType ? '請選擇日期' : '請先選擇課程類型'}</option>
                                  {availableDates.map((day) => (
                                    <option key={day.date} value={day.date}>
                                      {day.date}（{day.weekdayName}）
                                    </option>
                                  ))}
                                </motion.select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <ChevronDown className="w-5 h-5 text-[#EBC9A4]" size={20} />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label htmlFor="selectedTimeSlot" className="block text-sm font-medium text-[#4B4036] mb-2">
                                時間
                              </label>
                              <div className="relative">
                                <motion.select
                                  id="selectedTimeSlot"
                                  value={linkFormData.selectedTimeSlot}
                                  onChange={(e) => setLinkFormData(prev => ({ ...prev, selectedTimeSlot: e.target.value }))}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                  disabled={!linkFormData.selectedDate || availableDates.length === 0}
                                  className="w-full px-4 py-3 pr-10 bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] border-2 border-[#EADBC8] rounded-2xl text-[#4B4036] text-sm font-medium focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:shadow-md focus:shadow-lg disabled:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">{linkFormData.selectedDate ? '請選擇時間' : '請先選擇日期'}</option>
                                  {availableDates
                                    .filter((day) => day.date === linkFormData.selectedDate)
                                    .flatMap((day) => day.timeSlots)
                                    .map((slot: any) => (
                                      <option key={slot.timeslot} value={slot.timeslot}>
                                        {slot.time || slot.timeslot}
                                      </option>
                                    ))}
                                </motion.select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <ChevronDown className="w-5 h-5 text-[#EBC9A4]" size={20} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 價格計劃（僅常規課程） */}
                      {linkFormData.courseNature === 'regular' && linkFormData.courseType && (
                        <div>
                          <label htmlFor="selectedPlan" className="block text-sm font-medium text-[#4B4036] mb-2">
                            價格計劃
                          </label>
                          <div className="relative">
                            <motion.select
                              id="selectedPlan"
                              value={linkFormData.selectedPlan}
                              onChange={(e) => setLinkFormData(prev => ({ ...prev, selectedPlan: e.target.value }))}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              className="w-full px-4 py-3 pr-10 bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] border-2 border-[#EADBC8] rounded-2xl text-[#4B4036] text-sm font-medium focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:shadow-md focus:shadow-lg"
                            >
                              <option value="">請選擇價格計劃</option>
                              {pricingPlans.map(plan => (
                                <option key={plan.id} value={plan.id}>{plan.plan_name}</option>
                              ))}
                            </motion.select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <ChevronDown className="w-5 h-5 text-[#EBC9A4]" size={20} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 孩子資料區塊 */}
                      <div className="bg-gradient-to-r from-[#FFF9F2] to-[#F8F5EC] rounded-xl p-6 border border-[#EADBC8]">
                        <h3 className="text-lg font-semibold text-[#4B4036] mb-4 flex items-center">
                          <UserIcon className="w-5 h-5 mr-2 text-[#FFB6C1]" />
                          孩子資料
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="childFullName" className="block text-sm font-medium text-[#4B4036] mb-2">
                              孩子姓名 <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="childFullName"
                              type="text"
                              value={linkFormData.childFullName}
                              onChange={(e) => setLinkFormData(prev => ({ ...prev, childFullName: e.target.value }))}
                              placeholder="請輸入孩子姓名"
                              className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all bg-white"
                            />
                            {linkFormErrors.childFullName && (
                              <p className="text-red-500 text-xs mt-1">{linkFormErrors.childFullName}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="childNickname" className="block text-sm font-medium text-[#4B4036] mb-2">
                              暱稱
                            </label>
                            <input
                              id="childNickname"
                              type="text"
                              value={linkFormData.childNickname}
                              onChange={(e) => setLinkFormData(prev => ({ ...prev, childNickname: e.target.value }))}
                              placeholder="請輸入暱稱（選填）"
                              className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label htmlFor="childBirthDate" className="block text-sm font-medium text-[#4B4036] mb-2">
                              生日
                            </label>
                            <input
                              id="childBirthDate"
                              type="date"
                              value={linkFormData.childBirthDate}
                              onChange={(e) => {
                                const birthDate = e.target.value;
                                let age = 0;
                                if (birthDate) {
                                  const birth = new Date(birthDate);
                                  const now = new Date();
                                  age = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
                                }
                                setLinkFormData(prev => ({ ...prev, childBirthDate: birthDate, childAge: age }));
                              }}
                              className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all bg-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="childGender" className="block text-sm font-medium text-[#4B4036] mb-2">
                              性別 <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <motion.select
                                id="childGender"
                                value={linkFormData.childGender}
                                onChange={(e) => setLinkFormData(prev => ({ ...prev, childGender: e.target.value }))}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className="w-full px-4 py-3 pr-10 bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] border-2 border-[#EADBC8] rounded-2xl text-[#4B4036] text-sm font-medium focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:shadow-md focus:shadow-lg"
                              >
                                <option value="">請選擇</option>
                                <option value="男">男</option>
                                <option value="女">女</option>
                              </motion.select>
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <ChevronDown className="w-5 h-5 text-[#EBC9A4]" size={20} />
                              </div>
                            </div>
                            {linkFormErrors.childGender && (
                              <p className="text-red-500 text-xs mt-1">{linkFormErrors.childGender}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <label htmlFor="childPreferences" className="block text-sm font-medium text-[#4B4036] mb-2">
                            喜好物
                          </label>
                          <input
                            id="childPreferences"
                            type="text"
                            value={linkFormData.childPreferences}
                            onChange={(e) => setLinkFormData(prev => ({ ...prev, childPreferences: e.target.value }))}
                            placeholder="請輸入孩子的喜好物（選填）"
                            className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all bg-white"
                          />
                        </div>

                        <div className="mt-4">
                          <label htmlFor="childHealthNotes" className="block text-sm font-medium text-[#4B4036] mb-2">
                            健康/過敏情況
                          </label>
                          <textarea
                            id="childHealthNotes"
                            value={linkFormData.childHealthNotes}
                            onChange={(e) => setLinkFormData(prev => ({ ...prev, childHealthNotes: e.target.value }))}
                            rows={2}
                            placeholder="請輸入健康狀況或過敏情況（選填）"
                            className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all resize-none bg-white"
                          />
                        </div>
                      </div>

                      {/* 聯絡方式區塊 */}
                      <div className="bg-gradient-to-r from-[#FFF9F2] to-[#F8F5EC] rounded-xl p-6 border border-[#EADBC8]">
                        <h3 className="text-lg font-semibold text-[#4B4036] mb-4 flex items-center">
                          <PhoneIcon className="w-5 h-5 mr-2 text-[#FFB6C1]" />
                          聯絡方式
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="parentName" className="block text-sm font-medium text-[#4B4036] mb-2">
                              家長姓名
                            </label>
                            <input
                              id="parentName"
                              type="text"
                              value={linkFormData.parentName}
                              onChange={(e) => setLinkFormData(prev => ({ ...prev, parentName: e.target.value }))}
                              placeholder="請輸入家長姓名"
                              className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all bg-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="parentPhone" className="block text-sm font-medium text-[#4B4036] mb-2">
                              電話
                            </label>
                            <div className="flex gap-2">
                              <div className="relative">
                                <motion.select
                                  value={linkFormData.parentCountryCode}
                                  onChange={(e) => setLinkFormData(prev => ({ ...prev, parentCountryCode: e.target.value }))}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                  className="px-3 py-3 pr-8 bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] border-2 border-[#EADBC8] rounded-2xl text-[#4B4036] text-sm font-medium focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:shadow-md focus:shadow-lg"
                                >
                                  <option value="+852">+852</option>
                                  <option value="+86">+86</option>
                                  <option value="+1">+1</option>
                                </motion.select>
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <ChevronDown className="w-4 h-4 text-[#EBC9A4]" size={16} />
                                </div>
                              </div>
                              <input
                                id="parentPhone"
                                type="tel"
                                value={linkFormData.parentPhone}
                                onChange={(e) => setLinkFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                                placeholder="請輸入電話號碼"
                                className="flex-1 px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all bg-white"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <label htmlFor="parentEmail" className="block text-sm font-medium text-[#4B4036] mb-2">
                            電子郵件
                          </label>
                          <input
                            id="parentEmail"
                            type="email"
                            value={linkFormData.parentEmail}
                            onChange={(e) => setLinkFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                            placeholder="請輸入電子郵件地址"
                            className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all bg-white"
                          />
                        </div>
                      </div>

                      {/* 連結時限設定 */}
                      <div>
                        <label htmlFor="linkExpiryHours" className="block text-sm font-medium text-[#4B4036] mb-2">
                          連結時限 <span className="text-gray-400">(選填，預設24小時)</span>
                        </label>
                        <div className="relative">
                          <motion.select
                            id="linkExpiryHours"
                            value={[1, 6, 12, 24, 48, 72, 168].includes(linkFormData.linkExpiryHours)
                              ? linkFormData.linkExpiryHours.toString()
                              : 'custom'}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === 'custom') {
                                // 如果選擇自訂，顯示輸入框
                                const customHours = prompt('請輸入自訂時限（小時）:', linkFormData.linkExpiryHours.toString());
                                if (customHours && !isNaN(Number(customHours)) && Number(customHours) > 0) {
                                  setLinkFormData(prev => ({ ...prev, linkExpiryHours: Number(customHours) }));
                                }
                              } else {
                                setLinkFormData(prev => ({ ...prev, linkExpiryHours: Number(value) }));
                              }
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="w-full px-4 py-3 pr-10 bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] border-2 border-[#EADBC8] rounded-2xl text-[#4B4036] text-sm font-medium focus:ring-2 focus:ring-[#FFB6C1] focus:border-[#FFB6C1] transition-all duration-200 appearance-none cursor-pointer shadow-sm hover:shadow-md focus:shadow-lg"
                          >
                            <option value="1">1 小時</option>
                            <option value="6">6 小時</option>
                            <option value="12">12 小時</option>
                            <option value="24">24 小時（預設）</option>
                            <option value="48">48 小時</option>
                            <option value="72">72 小時</option>
                            <option value="168">7 天（168 小時）</option>
                            <option value="custom">
                              {[1, 6, 12, 24, 48, 72, 168].includes(linkFormData.linkExpiryHours)
                                ? '自訂時限'
                                : `自訂：${linkFormData.linkExpiryHours} 小時`}
                            </option>
                          </motion.select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-5 h-5 text-[#EBC9A4]" size={20} />
                          </div>
                        </div>
                        {linkFormData.linkExpiryHours && (
                          <p className="text-xs text-[#2B3A3B] mt-2">
                            連結將在 {linkFormData.linkExpiryHours} 小時後過期
                            {linkFormData.linkExpiryHours >= 24 && (
                              <span>（{Math.floor(linkFormData.linkExpiryHours / 24)} 天 {linkFormData.linkExpiryHours % 24 > 0 ? `${linkFormData.linkExpiryHours % 24} 小時` : ''}）</span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* 備註 */}
                      <div>
                        <label htmlFor="remarks" className="block text-sm font-medium text-[#4B4036] mb-2">
                          備註 <span className="text-gray-400">(選填)</span>
                        </label>
                        <textarea
                          id="remarks"
                          value={linkFormData.remarks}
                          onChange={(e) => setLinkFormData(prev => ({ ...prev, remarks: e.target.value }))}
                          rows={3}
                          placeholder="請輸入備註資訊..."
                          className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all resize-none bg-white"
                        />
                      </div>

                      {/* 按鈕區域 */}
                      <div className="flex space-x-3 pt-4 border-t border-[#EADBC8]">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowLinkFormModal(false)}
                          className="flex-1 px-6 py-3 border border-[#EADBC8] text-[#4B4036] rounded-xl font-medium hover:bg-[#F8F5EC] transition-all"
                        >
                          取消
                        </motion.button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={generatingLink}
                          className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ${generatingLink ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                        >
                          {generatingLink ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>生成中...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <LinkIcon className="w-5 h-5" />
                              <span>生成連結</span>
                            </div>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      {/* Leave Review Modal */}
      <AnimatePresence>
        {showLeaveReviewModal && selectedLeaveRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#FFFDF8] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#EADBC8]"
            >
              <div className="p-6 border-b border-[#EADBC8] flex justify-between items-center bg-gradient-to-r from-[#FFF9F2] to-[#FFF3E6]">
                <h3 className="text-xl font-bold text-[#4B4036]">審核請假申請</h3>
                <button
                  onClick={() => setShowLeaveReviewModal(false)}
                  className="p-2 hover:bg-[#EADBC8]/20 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-[#A68A64]" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-[#FFF9F2] p-4 rounded-xl border border-[#EADBC8]">
                  <h4 className="font-bold text-[#4B4036] mb-2">{selectedLeaveRequest.student?.full_name}</h4>
                  <p className="text-sm text-[#4B4036]/80">申請日期: {new Date(selectedLeaveRequest.lesson_date).toLocaleDateString()}</p>
                  <p className="text-sm text-[#4B4036]/80">類型: {selectedLeaveRequest.leave_type === 'sick' ? '病假' : '事假'}</p>
                  {selectedLeaveRequest.proof_url && (
                    <div className="mt-2">
                      <div className="mt-2">
                        <button
                          onClick={() => setPreviewImage(selectedLeaveRequest.proof_url)}
                          className="text-blue-600 hover:underline text-sm flex items-center bg-transparent border-none cursor-pointer p-0"
                        >
                          <LinkIcon className="w-4 h-4 mr-1" />
                          查看證明文件
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-1">審核備註</label>
                  <textarea
                    value={reviewLeaveNotes}
                    onChange={(e) => setReviewLeaveNotes(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-[#EADBC8] bg-white focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent outline-none transition-all"
                    rows={3}
                    placeholder="輸入備註..."
                  />
                </div>

                {leaveRejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-red-600 mb-1">拒絕原因</label>
                    <textarea
                      value={leaveRejectionReason}
                      onChange={(e) => setLeaveRejectionReason(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-red-200 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-transparent outline-none transition-all"
                      rows={2}
                      placeholder="輸入拒絕原因..."
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleReviewLeave('approved')}
                    className="flex-1 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    批准申請
                  </button>
                  <button
                    onClick={() => {
                      if (!leaveRejectionReason) {
                        setLeaveRejectionReason('不符合請假規定');
                        return;
                      }
                      handleReviewLeave('rejected');
                    }}
                    className="flex-1 py-3 bg-white border border-red-200 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all active:scale-95"
                  >
                    拒絕申請
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <img
                src={previewImage}
                alt="Proof Preview"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

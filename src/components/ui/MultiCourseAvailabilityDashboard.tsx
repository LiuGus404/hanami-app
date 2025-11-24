'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBatchConversationDays } from '@/hooks/useBatchConversationDays';
import { Calendar, Clock, Users, Plus, Trash2, Edit, Settings, Sparkles, Camera, Phone, Wand2 } from 'lucide-react';

import TrialLimitSettingsModal from './TrialLimitSettingsModal';

import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { getUserSession, type OrganizationProfile } from '@/lib/authUtils';
import { useTeacherLinkOrganization } from '@/app/aihome/teacher-link/create/TeacherLinkShell';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 固定香港時區的 Date 產生器
const getHongKongDate = (date = new Date()) => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (8 * 3600000)); // 香港是 UTC+8
};

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function getTodayISO(): string {
  const today = getHongKongDate();
  return today.toISOString().split('T')[0];
}

interface MultiCourseSlot {
  id: string;
  weekday: number;
  timeslot: string;
  courses: CourseInfo[];
  max_total_students: number;
  current_total_students: number;
  available_dates?: {date: string, remain: number}[];
  is_trial_open?: boolean;
  is_registration_open?: boolean;
}

interface CourseInfo {
  course_code: string;
  course_name: string;
  course_type: string;
  max_students: number;
  current_students: number;
  teacher_name: string | null;
  room_location: string | null;
  trial_students: TrialStudent[];
  regular_students_ages: number[];
  regular_students: any[];
  queue_students: QueueStudent[];
}

interface TrialStudent {
  id: string;
  full_name: string;
  student_age: number | null;
  course_type?: string;
  actual_timeslot: string | null;
  weekday: number;
  trial_course_code?: string;
}

interface QueueStudent {
  id: string;
  full_name: string;
  student_age?: number;
  phone_no?: string;
  notes?: string;
  status?: string;
  prefer_time?: any;
  course_types?: string[];
}

interface CourseCode {
  id: string;
  course_code: string;
  course_name: string;
  course_type_id: string;
  course_type_name: string;
  max_students: number;
  teacher_id: string | null;
  teacher_name: string | null;
  room_location: string | null;
  is_active: boolean;
}

// 將月齡轉換為歲數顯示
function convertMonthsToYears(months: number): string {
  if (months < 12) {
    return `${months}個月`;
  } else if (months % 12 === 0) {
    return `${Math.floor(months / 12)}歲`;
  } else {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years}歲${remainingMonths}個月`;
  }
}

// 格式化試堂日期顯示
function formatTrialDate(dateString: string): string {
  const date = new Date(dateString);
  const today = getHongKongDate();
  const todayStr = today.toISOString().split('T')[0];
  
  if (dateString === todayStr) {
    return '今天';
  }
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  if (dateString === tomorrowStr) {
    return '明天';
  }
  
  // 顯示年/月/日格式
  return date.toLocaleDateString('zh-TW', { 
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit' 
  });
}

function calculateAgeRange(students: { student_age: number | null | undefined }[]): string {
  const ages = students
    .map(s => s.student_age)
    .filter(age => age !== null && age !== undefined && age >= 0 && age <= 1800) as number[]; // 最大150歲 = 1800個月
  
  if (ages.length === 0) return '無年齡資料';
  
  // 轉換為歲數
  const convertedAges = ages.map(age => convertMonthsToYears(age));
  
  if (convertedAges.length === 1) return convertedAges[0];
  
  // 計算年齡範圍
  const minMonths = Math.min(...ages);
  const maxMonths = Math.max(...ages);
  
  const minAge = convertMonthsToYears(minMonths);
  const maxAge = convertMonthsToYears(maxMonths);
  
  return minAge === maxAge ? minAge : `${minAge}-${maxAge}`;
}

export default function MultiCourseAvailabilityDashboard() {
  const { user } = useUser();
  
  // 嘗試從 TeacherLinkShell context 獲取組織信息（如果可用）
  let teacherLinkOrg: { orgId: string | null; organization: OrganizationProfile | null } | null = null;
  try {
    teacherLinkOrg = useTeacherLinkOrganization();
  } catch (e) {
    // 不在 TeacherLinkShell 上下文中，繼續使用其他方法
  }
  
  // 從會話中獲取機構信息（可能沒有 OrganizationProvider）
  const session = getUserSession();
  const currentOrganization = session?.organization || null;
  
  const effectiveOrgId = useMemo(
    () => teacherLinkOrg?.orgId || teacherLinkOrg?.organization?.id || currentOrganization?.id || user?.organization?.id || null,
    [teacherLinkOrg?.orgId, teacherLinkOrg?.organization?.id, currentOrganization?.id, user?.organization?.id]
  );
  const validOrgId = useMemo(
    () => (effectiveOrgId && UUID_REGEX.test(effectiveOrgId) ? effectiveOrgId : null),
    [effectiveOrgId]
  );
  const hasValidOrg = Boolean(validOrgId);
  
  // 調試日誌
  useEffect(() => {
    console.log('[MultiCourseAvailabilityDashboard] 組織狀態:', {
      effectiveOrgId,
      validOrgId,
      hasValidOrg,
      teacherLinkOrgId: teacherLinkOrg?.orgId,
      teacherLinkOrgName: teacherLinkOrg?.organization?.name,
      currentOrganization: currentOrganization?.id,
      userOrg: user?.organization?.id
    });
  }, [effectiveOrgId, validOrgId, hasValidOrg, teacherLinkOrg?.orgId, teacherLinkOrg?.organization?.name, currentOrganization?.id, user?.organization?.id]);
  const [slots, setSlots] = useState<MultiCourseSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [expandedTrial, setExpandedTrial] = useState<{[key:string]: boolean}>({});
  const [expandedTrialByDate, setExpandedTrialByDate] = useState<{[key:string]: boolean}>({});
  const [expandedAvailableDates, setExpandedAvailableDates] = useState<{[key:string]: boolean}>({});
  const [queueByDay, setQueueByDay] = useState<{[weekday: number]: any[]}>({});
  const [expandedQueue, setExpandedQueue] = useState<{[weekday: number]: boolean}>({});
  const [expandedCourses, setExpandedCourses] = useState<{[weekday: number]: {[courseCode: string]: boolean}}>({});
  const [unassignedStudentsBySlot, setUnassignedStudentsBySlot] = useState<{[key: string]: number}>({});
  const [courseCodes, setCourseCodes] = useState<{[id: string]: CourseCode}>({});
  const [courseTypes, setCourseTypes] = useState<any[]>([]);
  const [trialLimitSettings, setTrialLimitSettings] = useState<{[courseTypeId: string]: number}>({});
  const [showTrialLimitModal, setShowTrialLimitModal] = useState(false);
  const [showSlotDetailModal, setShowSlotDetailModal] = useState(false);
  const [selectedSlotDetail, setSelectedSlotDetail] = useState<any>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(false);
  const [studentsToRemove, setStudentsToRemove] = useState<string[]>([]);
  const [queueStudentsLoading, setQueueStudentsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [selectedStudentPhone, setSelectedStudentPhone] = useState<string>('');
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);

  // 學生管理相關狀態
  const [showStudentEditModal, setShowStudentEditModal] = useState(false);
  
  // 試堂和報名開關狀態
  const [trialToggleLoading, setTrialToggleLoading] = useState(false);
  const [registrationToggleLoading, setRegistrationToggleLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<{
    status: string;
    notes: string;
    course_types: string[];
    prefer_time: { week: number[]; range: string[] };
  }>({
    status: '',
    notes: '',
    course_types: [],
    prefer_time: { week: [], range: [] }
  });

  // 批量載入對話記錄
  const extractPhoneNumbers = (students: any[]) => {
    return students
      .map(student => student.phone_no)
      .filter((phone): phone is string => !!phone && phone.trim() !== '');
  };

  // 當等候區學生載入完成後，批量載入對話記錄
  const allQueueStudents = selectedSlotDetail?.queue_students || [];
  const phoneNumbers = extractPhoneNumbers(allQueueStudents);
  const { results: batchConversationResults, loading: batchConversationLoading } = useBatchConversationDays(phoneNumbers);

  // 切換區塊展開/收起狀態
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // 切換試堂開放狀態
  const toggleTrialOpen = async () => {
    if (!selectedSlotDetail || trialToggleLoading) return;
    if (!hasValidOrg) {
      alert('尚未選擇機構，無法切換試堂狀態');
      return;
    }
    
    setTrialToggleLoading(true);
    try {
      const newTrialStatus = !selectedSlotDetail.is_trial_open;
      
      // 更新資料庫，確保 org_id 被記錄
      const { error } = await supabase
        .from('hanami_schedule')
        .update({ 
          is_trial_open: newTrialStatus,
          org_id: validOrgId as string
        })
        .eq('weekday', selectedSlotDetail.weekday)
        .eq('timeslot', selectedSlotDetail.time)
        .eq('course_code', selectedSlotDetail.course_code)
        .eq('org_id', validOrgId as string);
      
      if (error) throw error;
      
      // 更新本地狀態
      setSelectedSlotDetail((prev: any) => ({
        ...prev,
        is_trial_open: newTrialStatus
      }));
      
      // 重新載入數據以保持同步
      await fetchData();
      
      alert(`試堂狀態已${newTrialStatus ? '開啟' : '關閉'}`);
    } catch (error) {
      console.error('切換試堂狀態失敗:', error);
      alert('切換試堂狀態失敗，請重試');
    } finally {
      setTrialToggleLoading(false);
    }
  };

  // 切換報名開放狀態
  const toggleRegistrationOpen = async () => {
    if (!selectedSlotDetail || registrationToggleLoading) return;
    if (!hasValidOrg) {
      alert('尚未選擇機構，無法切換報名狀態');
      return;
    }
    
    setRegistrationToggleLoading(true);
    try {
      const newRegistrationStatus = !selectedSlotDetail.is_registration_open;
      
      // 更新資料庫，確保 org_id 被記錄
      const { error } = await supabase
        .from('hanami_schedule')
        .update({ 
          is_registration_open: newRegistrationStatus,
          org_id: validOrgId as string
        })
        .eq('weekday', selectedSlotDetail.weekday)
        .eq('timeslot', selectedSlotDetail.time)
        .eq('course_code', selectedSlotDetail.course_code)
        .eq('org_id', validOrgId as string);
      
      if (error) throw error;
      
      // 更新本地狀態
      setSelectedSlotDetail((prev: any) => ({
        ...prev,
        is_registration_open: newRegistrationStatus
      }));
      
      // 重新載入數據以保持同步
      await fetchData();
      
      alert(`報名狀態已${newRegistrationStatus ? '開啟' : '關閉'}`);
    } catch (error) {
      console.error('切換報名狀態失敗:', error);
      alert('切換報名狀態失敗，請重試');
    } finally {
      setRegistrationToggleLoading(false);
    }
  };


  // 打開學生編輯彈窗
  const openStudentEditModal = (student: any) => {
    setEditingStudent(student);
    
    // 安全地解析 prefer_time
    let preferTime = { week: [], range: [] };
    if (student.prefer_time) {
      try {
        if (typeof student.prefer_time === 'string') {
          preferTime = JSON.parse(student.prefer_time);
        } else {
          preferTime = student.prefer_time;
        }
      } catch (e) {
        console.warn('無法解析 prefer_time:', student.prefer_time);
      }
    }
    
    setEditFormData({
      status: student.status || '',
      notes: student.notes || '',
      course_types: Array.isArray(student.course_types) ? student.course_types : [],
      prefer_time: {
        week: Array.isArray(preferTime.week) ? preferTime.week : [],
        range: Array.isArray(preferTime.range) ? preferTime.range : []
      }
    });
    setShowStudentEditModal(true);
  };

  // 關閉學生編輯彈窗
  const closeStudentEditModal = () => {
    setShowStudentEditModal(false);
    setEditingStudent(null);
    setEditFormData({
      status: '',
      notes: '',
      course_types: [],
      prefer_time: { week: [], range: [] }
    });
  };

  // 刪除等候區學生
  const deleteQueueStudent = async (studentId: string) => {
    if (!confirm('確定要刪除此等候區學生嗎？')) return;
    if (!hasValidOrg) {
      alert('尚未選擇機構，無法刪除等候區學生');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('hanami_trial_queue')
        .delete()
        .eq('id', studentId)
        .eq('org_id', validOrgId as string);
      
      if (error) throw error;
      
      // 重新載入等候區學生
      if (selectedSlotDetail) {
        await loadQueueStudentsForSlot(selectedSlotDetail);
      }
      
      alert('等候區學生已刪除');
    } catch (error) {
      console.error('刪除等候區學生失敗:', error);
      alert('刪除失敗，請重試');
    }
  };


  // 發送WhatsApp訊息
  const sendWhatsAppMessage = (phoneNumber: string, studentName: string, courseInfo?: { courseName?: string; timeSlot?: string; studentStatus?: string }) => {
    if (!phoneNumber) {
      alert('此學生沒有聯絡電話');
      return;
    }

    // 處理電話號碼格式（移除所有非數字字符）
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // 如果是香港電話號碼（8位數），加上852區號
    const formattedPhoneNumber = cleanPhoneNumber.length === 8 ? `852${cleanPhoneNumber}` : cleanPhoneNumber;
    
    // 根據學生狀態決定訊息內容
    let defaultMessage;
    if (studentName === '未知學生' || !studentName) {
      // 未知試堂學生的預設訊息
      const today = new Date();
      
      // 計算這個星期的同一天（如果今天是星期一，就是下個星期一）
      const currentWeekday = selectedSlotDetail?.weekday !== undefined ? selectedSlotDetail.weekday : today.getDay();
      const thisWeekSameDay = new Date(today);
      const daysUntilTarget = (currentWeekday - today.getDay() + 7) % 7;
      thisWeekSameDay.setDate(today.getDate() + daysUntilTarget);
      
      // 如果今天就是目標星期幾，則選擇下個星期的同一天
      if (daysUntilTarget === 0) {
        thisWeekSameDay.setDate(thisWeekSameDay.getDate() + 7);
      }
      
      // 計算再加7天的同一天
      const nextWeekSameDay = new Date(thisWeekSameDay);
      nextWeekSameDay.setDate(thisWeekSameDay.getDate() + 7);
      
      const formatDate = (date: Date) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
      };
      
      // 獲取課程和時段資訊
      let courseName = courseInfo?.courseName || 'XX';
      let timeSlot = courseInfo?.timeSlot || 'XX時段';
      
      // 移除課程名稱中可能包含的「班」字，避免重複
      if (courseName.includes('班')) {
        courseName = courseName.replace('班', '');
      }
      
      // 格式化時段顯示，加入星期幾
      if (timeSlot && timeSlot !== 'XX時段') {
        // 如果時段已經包含「時段」字樣，移除它
        if (timeSlot.includes('時段')) {
          timeSlot = timeSlot.replace('時段', '');
        }
        
        // 獲取星期幾
        const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekday = selectedSlotDetail?.weekday !== undefined ? weekdayNames[selectedSlotDetail.weekday] : '';
        
        // 格式化時段為更友好的格式，包含星期幾
        timeSlot = `${weekday} ${timeSlot}時段`;
      }
      
      // 根據學生姓名決定開頭稱呼
      const greeting = studentName && studentName !== '未知學生' 
        ? `${studentName}媽媽你好` 
        : '媽媽你好';
      
      // 根據學生狀態決定使用「上堂」還是「試堂」
      const isTrialed = courseInfo?.studentStatus === '已試堂';
      const lessonType = isTrialed ? '上堂' : '試堂';
      
      defaultMessage = `${greeting} :)

哩邊係Hanami Music聯絡你
之前留過資料想排課堂 ^^

好消息
有學生調左時間，${courseName}班
${timeSlot}有一個位 ^^

可以睇下想${formatDate(thisWeekSameDay)}/或${formatDate(nextWeekSameDay)}${lessonType} 
如果時間上ok，可以盡快回覆我地幫小朋友留位先~ ~:)`;
    } else {
      // 已知學生的預設訊息
      defaultMessage = `您好，我是Hanami Music的老師，想與您討論 ${studentName} 的課程安排。`;
    }
    
    const message = encodeURIComponent(defaultMessage);
    
    const whatsappUrl = `https://wa.me/${formattedPhoneNumber}?text=${message}`;
    
    // 在新視窗中開啟WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  // 保存學生編輯
  const saveStudentEdit = async () => {
    if (!editingStudent) return;
    if (!hasValidOrg) {
      alert('尚未選擇機構，無法更新學生資料');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('hanami_trial_queue')
        .update({
          status: editFormData.status,
          notes: editFormData.notes,
          course_types: editFormData.course_types,
          prefer_time: editFormData.prefer_time
        })
        .eq('id', editingStudent.id)
        .eq('org_id', validOrgId as string);
      
      if (error) throw error;
      
      // 重新載入等候區學生
      if (selectedSlotDetail) {
        await loadQueueStudentsForSlot(selectedSlotDetail);
      }
      
      closeStudentEditModal();
      alert('學生資料已更新');
    } catch (error) {
      console.error('更新學生資料失敗:', error);
      alert('更新失敗，請重試');
    }
  };

  // 載入對話記錄
  const loadConversationHistory = async (phoneNo: string, studentName: string) => {
    setConversationLoading(true);
    setSelectedStudentPhone(phoneNo);
    
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(phoneNo)}`);
      if (!response.ok) {
        throw new Error('無法載入對話記錄');
      }
      
      const data = await response.json();
      setConversationMessages(data.messages || []);
      setShowConversationModal(true);
    } catch (error) {
      console.error('載入對話記錄失敗:', error);
      alert('載入對話記錄失敗');
    } finally {
      setConversationLoading(false);
    }
  };

  // 載入等候區學生
  const loadQueueStudentsForSlot = async (slot: any) => {
    setQueueStudentsLoading(true);
    try {
      if (!hasValidOrg) {
        setQueueStudentsLoading(false);
        return;
      }
      // 取得等候區學生
      const { data: queueStudentsData, error: queueStudentsError } = await supabase
        .from('hanami_trial_queue')
        .select('*')
        .eq('org_id', validOrgId as string);

      if (queueStudentsError) {
        console.error('無法載入等候區學生：', queueStudentsError);
        return;
      }

      // 按創建時間排序並分類等候區學生
      const sortedQueueStudents = queueStudentsData?.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) || [];

      // 過濾有效學生（排除舊學生）
      const validQueueStudents = sortedQueueStudents.filter(student => 
        student.status !== '舊學生'
      ) || [];

      // 匹配等候區學生
      const queueStudents = validQueueStudents.filter(queueStudent => {
        if (!queueStudent.prefer_time) return false;
        
        try {
          let preferTime;
          if (typeof queueStudent.prefer_time === 'string') {
            const cleanJson = queueStudent.prefer_time.replace(/""/g, '"');
            preferTime = JSON.parse(cleanJson);
          } else {
            preferTime = queueStudent.prefer_time;
          }
          
          const preferredWeeks = preferTime.week || [];
          return preferredWeeks.includes(slot.weekday);
          
        } catch (error) {
          console.error('解析 prefer_time 失敗:', error, queueStudent.prefer_time);
          return false;
        }
      }).map(queueStudent => ({
        id: queueStudent.id,
        full_name: queueStudent.full_name || '未知學生',
        student_age: queueStudent.student_age,
        phone_no: queueStudent.phone_no,
        notes: queueStudent.notes,
        status: queueStudent.status,
        prefer_time: queueStudent.prefer_time,
        course_types: queueStudent.course_types,
        created_at: queueStudent.created_at
      })) || [];

    // 更新選中的時段詳情
    setSelectedSlotDetail((prev: any) => ({
      ...prev,
      queue_students: queueStudents
    }));

        console.log(`載入等候區學生完成，匹配到 ${queueStudents.length} 名學生`);

    } catch (error) {
      console.error('載入等候區學生失敗:', error);
    } finally {
      setQueueStudentsLoading(false);
    }
  };

  // 處理格子點擊事件
  const handleSlotClick = async (slot: any) => {
    console.log('格子被點擊，打開時段詳情模態框:', slot);
    setSelectedSlotDetail(slot);
    setShowSlotDetailModal(true);
    
    // 載入等候區學生
    await loadQueueStudentsForSlot(slot);
  };

  // 處理添加學生按鈕點擊
  const handleAddStudentClick = async () => {
    if (!selectedSlotDetail) return;
    if (!hasValidOrg) {
      alert('尚未選擇機構，無法載入學生資料');
      return;
    }
    
    try {
      console.log('開始載入可用學生，當前時段信息:', {
        weekday: selectedSlotDetail.weekday,
        timeslot: selectedSlotDetail.time,
        course_code: selectedSlotDetail.course_code
      });

      // 獲取所有學生數據（使用 API 端點繞過 RLS）
      let allStudents: any[] = [];
      try {
        // 獲取用戶 email（優先從 session，然後從 user）
        const userEmail = session?.email || user?.email || null;
        const apiUrl = `/api/students/list?orgId=${encodeURIComponent(validOrgId as string)}&studentType=常規${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
        
        const response = await fetch(apiUrl, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const result = await response.json();
          allStudents = result.students || [];
          // 按姓名排序
          allStudents.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
          console.log('通過 API 載入所有學生數量:', allStudents.length);
        } else {
          console.error('無法載入學生，API 返回錯誤:', response.status);
          // 如果 API 失敗，嘗試直接查詢（可能也會失敗，但至少不會崩潰）
          const { data, error: studentsError } = await supabase
            .from('Hanami_Students')
            .select('*')
            .eq('org_id', validOrgId as string)
            .eq('student_type', '常規')
            .order('full_name', { ascending: true });
          
          if (!studentsError && data) {
            allStudents = data;
          } else {
            throw studentsError || new Error('無法載入學生數據');
          }
        }
      } catch (error) {
        console.error('載入學生數據時發生錯誤:', error);
        throw error;
      }

      console.log('載入的所有學生數量:', allStudents?.length || 0);
      
      // 調試：檢查是否有星期日 09:15:00 的學生
      const sundayStudents = allStudents?.filter(s => s.regular_weekday === 0 && s.regular_timeslot === '09:15:00');
      console.log('星期日 09:15:00 的學生:', sundayStudents?.map(s => ({ 
        name: s.full_name, 
        weekday: s.regular_weekday, 
        timeslot: s.regular_timeslot,
        timeslotType: typeof s.regular_timeslot,
        student_type: s.student_type 
      })));
      
      // 調試：檢查所有星期日的學生
      const allSundayStudents = allStudents?.filter(s => s.regular_weekday === 0);
      console.log('所有星期日學生:', allSundayStudents?.map(s => ({ 
        name: s.full_name, 
        weekday: s.regular_weekday, 
        timeslot: s.regular_timeslot,
        timeslotType: typeof s.regular_timeslot,
        isNull: s.regular_timeslot === null,
        isUndefined: s.regular_timeslot === undefined
      })));

          // 過濾條件：同時段 + 不在當前時段
          const currentStudentIds = new Set([
            ...selectedSlotDetail.regular_students.map((s: any) => s.id),
            ...selectedSlotDetail.trial_students.map((s: any) => s.id)
          ]);

          const available = allStudents?.filter(student => {
            // 0. 排除"已停用"的學生
            if (student.student_type === '已停用') {
              console.log(`學生 ${student.full_name} 已停用，排除`);
              return false;
            }
            
            // 1. 排除已經在這個時段的學生
            if (currentStudentIds.has(student.id)) {
              console.log(`學生 ${student.full_name} 已經在這個時段`);
              return false;
            }

        // 3. 檢查是否同時段
        if (student.regular_weekday === null || student.regular_weekday === undefined || 
            student.regular_timeslot === null || student.regular_timeslot === undefined) {
          console.log(`學生 ${student.full_name} 沒有設定時段`, {
            regular_weekday: student.regular_weekday,
            regular_timeslot: student.regular_timeslot,
            timeslotType: typeof student.regular_timeslot,
            isNull: student.regular_timeslot === null,
            isUndefined: student.regular_timeslot === undefined
          });
          return false;
        }

        // 轉換星期數字格式
        let studentWeekday: number;
        if (typeof student.regular_weekday === 'string') {
          studentWeekday = parseInt(student.regular_weekday);
          if (isNaN(studentWeekday)) {
            console.log(`學生 ${student.full_name} 的星期格式錯誤: ${student.regular_weekday}`);
            return false;
          }
        } else {
          studentWeekday = student.regular_weekday;
        }

        // 檢查星期和時間是否匹配
        const isSameWeekday = studentWeekday === selectedSlotDetail.weekday;
        const isSameTimeslot = student.regular_timeslot === selectedSlotDetail.time;

        console.log(`學生 ${student.full_name} 時段檢查:`, {
          studentWeekday,
          selectedWeekday: selectedSlotDetail.weekday,
          studentTimeslot: student.regular_timeslot,
          selectedTimeslot: selectedSlotDetail.time,
          isSameWeekday,
          isSameTimeslot,
          match: isSameWeekday && isSameTimeslot
        });

        return isSameWeekday && isSameTimeslot;
      }) || [];

      console.log('符合條件的學生數量:', available.length);
      console.log('符合條件的學生列表:', available.map(s => ({
        name: s.full_name,
        weekday: s.regular_weekday,
        timeslot: s.regular_timeslot,
        course_code: s.primary_course_code
      })));

      setAvailableStudents(available);
      setSelectedStudents([]);
      setShowAddStudentModal(true);
    } catch (error) {
      console.error('載入可用學生失敗:', error);
      alert('載入可用學生失敗');
    }
  };

  // 處理添加學生到課程
  const handleAddStudentsToCourse = async () => {
    if (!selectedSlotDetail || selectedStudents.length === 0) return;
    if (!hasValidOrg) {
      alert('尚未選擇機構，無法添加學生到課程');
      return;
    }

    try {
      console.log('開始添加學生到課程:', {
        course_code: selectedSlotDetail.course_code,
        student_count: selectedStudents.length,
        student_ids: selectedStudents
      });

      // 1. 更新學生的課程代碼（使用 API 端點繞過 RLS）
      const updateResponse = await fetch('/api/students/batch-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          updates: {
            primary_course_code: selectedSlotDetail.course_code
          },
          orgId: validOrgId as string,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.error || '更新學生課程代碼失敗');
      }

      const updateResult = await updateResponse.json();
      if (!updateResult.success) {
        throw new Error(updateResult.error || '更新學生課程代碼失敗');
      }

      // 2. 找到對應的時段記錄並更新 assigned_student_ids
      const { data: scheduleData, error: scheduleQueryError } = await supabase
        .from('hanami_schedule')
        .select('id, assigned_student_ids')
        .eq('weekday', selectedSlotDetail.weekday)
        .eq('timeslot', selectedSlotDetail.time)
        .eq('course_code', selectedSlotDetail.course_code)
        .eq('org_id', validOrgId as string);

      if (scheduleQueryError) throw scheduleQueryError;

      if (scheduleData && scheduleData.length > 0) {
        const scheduleId = scheduleData[0].id;
        const currentStudentIds = scheduleData[0].assigned_student_ids || [];
        
        // 合併現有的學生ID和新增的學生ID（避免重複）
        const updatedStudentIds = [...new Set([...currentStudentIds, ...selectedStudents])];
        
        console.log('更新時段的 assigned_student_ids:', {
          schedule_id: scheduleId,
          current_ids: currentStudentIds,
          new_ids: selectedStudents,
          updated_ids: updatedStudentIds
        });

        const { error: scheduleError } = await supabase
          .from('hanami_schedule')
          .update({
            assigned_student_ids: updatedStudentIds
          })
          .eq('id', scheduleId)
          .eq('org_id', validOrgId as string);

        if (scheduleError) throw scheduleError;
      }

      alert(`成功添加 ${selectedStudents.length} 名學生到課程 ${selectedSlotDetail.course_code}`);
      
      // 立即關閉模態框並重新載入數據
      setShowAddStudentModal(false);
      setShowSlotDetailModal(false); // 同時關閉時段詳情模態框
      setSelectedStudents([]);
      
      // 重新載入數據
      await fetchData();
    } catch (error: any) {
      console.error('添加學生到課程失敗:', error);
      const errorMessage = error?.message || error?.error || '未知錯誤';
      const errorCode = error?.code || '';
      console.error('錯誤詳情:', { errorMessage, errorCode, error });
      alert(`添加學生到課程失敗: ${errorMessage}${errorCode ? ` (${errorCode})` : ''}`);
    }
  };

  // 處理移除學生從課程
  const handleRemoveStudentsFromCourse = async () => {
    if (!selectedSlotDetail || studentsToRemove.length === 0) return;
    if (!hasValidOrg) {
      alert('尚未選擇機構，無法移除學生');
      return;
    }

    try {
      console.log('開始移除學生從課程:', {
        course_code: selectedSlotDetail.course_code,
        student_count: studentsToRemove.length,
        student_ids: studentsToRemove,
        weekday: selectedSlotDetail.weekday,
        timeslot: selectedSlotDetail.time
      });

      // 只從時段的 assigned_student_ids 中移除學生，不清空學生的 primary_course_code
      // 這樣可以讓系統完全依賴 assigned_student_ids 來顯示學生
      const { data: scheduleData, error: scheduleQueryError } = await supabase
        .from('hanami_schedule')
        .select('id, assigned_student_ids')
        .eq('weekday', selectedSlotDetail.weekday)
        .eq('timeslot', selectedSlotDetail.time)
        .eq('course_code', selectedSlotDetail.course_code)
        .eq('org_id', validOrgId as string);

      if (scheduleQueryError) throw scheduleQueryError;

      if (scheduleData && scheduleData.length > 0) {
        const scheduleId = scheduleData[0].id;
        const currentStudentIds = scheduleData[0].assigned_student_ids || [];
        
        // 移除指定的學生ID
        const updatedStudentIds = currentStudentIds.filter((id: any) => !studentsToRemove.includes(id));
        
        console.log('更新時段的 assigned_student_ids (移除學生):', {
          schedule_id: scheduleId,
          current_ids: currentStudentIds,
          remove_ids: studentsToRemove,
          updated_ids: updatedStudentIds,
          removed_count: currentStudentIds.length - updatedStudentIds.length
        });

        const { error: scheduleError } = await supabase
          .from('hanami_schedule')
          .update({
            assigned_student_ids: updatedStudentIds
          })
          .eq('id', scheduleId)
          .eq('org_id', validOrgId as string);

        if (scheduleError) throw scheduleError;
        
        console.log('移除學生操作完成，時段 assigned_student_ids 已更新');
      } else {
        console.warn('沒有找到對應的時段記錄進行更新');
      }

      alert(`成功移除 ${studentsToRemove.length} 名學生從課程 ${selectedSlotDetail.course_code}`);
      
      // 立即關閉模態框並重新載入數據
      setShowRemoveStudentModal(false);
      setShowSlotDetailModal(false); // 同時關閉時段詳情模態框
      setStudentsToRemove([]);
      
      // 重新載入數據
      await fetchData();
      
      // 額外驗證：檢查移除的學生是否還在 assigned_student_ids 中
      console.log('驗證移除操作：檢查時段數據是否正確更新');
      const { data: verifyData, error: verifyError } = await supabase
        .from('hanami_schedule')
        .select('assigned_student_ids')
        .eq('weekday', selectedSlotDetail.weekday)
        .eq('timeslot', selectedSlotDetail.time)
        .eq('course_code', selectedSlotDetail.course_code)
        .eq('org_id', validOrgId as string);
      
      if (!verifyError && verifyData && verifyData.length > 0) {
        const currentIds = verifyData[0].assigned_student_ids || [];
        const stillPresent = studentsToRemove.filter(id => currentIds.includes(id));
        if (stillPresent.length > 0) {
          console.warn('警告：部分學生仍在 assigned_student_ids 中:', stillPresent);
        } else {
          console.log('驗證成功：所有選中的學生已從 assigned_student_ids 中移除');
        }
      }
    } catch (error: any) {
      console.error('移除學生從課程失敗:', error);
      const errorMessage = error?.message || '未知錯誤';
      const errorCode = error?.code || '未知錯誤代碼';
      console.error('錯誤詳情:', { errorMessage, errorCode, error });
      alert(`移除學生從課程失敗: ${errorMessage} (${errorCode})`);
    }
  };

  // 處理移除學生按鈕點擊
  const handleRemoveStudentClick = () => {
    if (!selectedSlotDetail || selectedSlotDetail.regular_students.length === 0) {
      alert('沒有學生可以移除');
      return;
    }
    
    setStudentsToRemove([]);
    setShowRemoveStudentModal(true);
  };

  const fetchData = useCallback(async () => {
    console.log('[MultiCourseAvailabilityDashboard] fetchData 被調用', { hasValidOrg, validOrgId });
    if (!hasValidOrg) {
      console.log('[MultiCourseAvailabilityDashboard] 沒有有效的組織，設置 loading 為 false');
      setSlots([]);
      setQueueByDay({});
      setLoading(false);
      return;
    }
    console.log('[MultiCourseAvailabilityDashboard] 開始載入數據...');
    setLoading(true);
    setError(null);
    try {
      // 1. 載入課程代碼資料
      const { data: courseCodesData, error: courseCodesError } = await supabase
        .from('hanami_course_codes')
        .select(`
          id,
          course_code,
          course_name,
          max_students,
          teacher_id,
          room_location,
          is_active,
          course_type_id
        `)
        .eq('is_active', true)
        .eq('org_id', validOrgId as string);

      if (courseCodesError) {
        console.error('無法載入課程代碼：', courseCodesError);
        setError(`無法載入課程代碼：${courseCodesError.message}`);
        setLoading(false);
        return;
      }

      // 建立課程代碼映射表
      const courseCodesMap: {[id: string]: CourseCode} = {};
      courseCodesData?.forEach(course => {
        courseCodesMap[course.course_code] = {
          id: course.id,
          course_code: course.course_code,
          course_name: course.course_name,
          course_type_id: course.course_type_id,
          course_type_name: '載入中...', // 稍後載入課程類型名稱
          max_students: course.max_students,
          teacher_id: course.teacher_id,
          teacher_name: null, // 將在後面載入教師資訊
          room_location: course.room_location,
          is_active: course.is_active
        };
      });
      setCourseCodes(courseCodesMap);

      // 2. 載入教師資訊
      const { data: teachersData } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname')
        .eq('org_id', validOrgId as string);

      const teachersMap: {[id: string]: string} = {};
      teachersData?.forEach(teacher => {
        teachersMap[teacher.id] = teacher.teacher_nickname || '未知教師';
      });

      // 3. 載入課程類型資訊
      const { data: courseTypesData } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name')
        .eq('org_id', validOrgId as string);

      const courseTypesMap: {[id: string]: string} = {};
      courseTypesData?.forEach(courseType => {
        courseTypesMap[courseType.id] = courseType.name || '未知課程';
      });

      // 設置課程類型狀態
      setCourseTypes(courseTypesData || []);

      // 更新課程代碼中的教師名稱和課程類型名稱
      Object.keys(courseCodesMap).forEach(courseCode => {
        const course = courseCodesMap[courseCode];
        if (course.teacher_id && teachersMap[course.teacher_id]) {
          course.teacher_name = teachersMap[course.teacher_id];
        }
        if (course.course_type_id && courseTypesMap[course.course_type_id]) {
          course.course_type_name = courseTypesMap[course.course_type_id];
        }
      });
      setCourseCodes({...courseCodesMap});

      // 調試信息：顯示課程類型映射
      console.log('課程類型映射表：', courseTypesMap);
      console.log('課程代碼映射表：', Object.keys(courseCodesMap).map(code => ({
        course_code: code,
        course_name: courseCodesMap[code].course_name,
        course_type_id: courseCodesMap[code].course_type_id,
        course_type_name: courseCodesMap[code].course_type_name
      })));

      // 3. 從 hanami_schedule 表取得多課程時間表
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('hanami_schedule')
        .select('*, is_trial_open, is_registration_open')
        .not('course_code', 'is', null)
        .eq('org_id', validOrgId as string)
        .order('weekday', { ascending: true })
        .order('timeslot', { ascending: true });

      if (scheduleError) {
        setError(`無法載入時間表：${scheduleError.message}`);
        setLoading(false);
        return;
      }

      // 4. 取得所有常規學生（使用 API 端點繞過 RLS）
      let regularStudentsData: any[] = [];
      let allRegularStudentsData: any[] = []; // 用於未安排學生計算（包含所有學生，不限制 primary_course_code）
      try {
        // 獲取用戶 email（優先從 session，然後從 user）
        const userEmail = session?.email || user?.email || null;
        const apiUrl = `/api/students/list?orgId=${encodeURIComponent(validOrgId as string)}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
        
        const response = await fetch(apiUrl, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const result = await response.json();
          allRegularStudentsData = result.students || [];
          // 保存完整數據用於未安排學生計算（只過濾"已停用"的學生）
          allRegularStudentsData = allRegularStudentsData.filter((s: any) => 
            s.student_type !== '已停用'
          );
          // 過濾掉 primary_course_code 為 null 的學生，以及"已停用"的學生（用於主要顯示）
          regularStudentsData = allRegularStudentsData.filter((s: any) => 
            s.primary_course_code != null
          );
          console.log('通過 API 載入常規學生數量（已過濾已停用）:', regularStudentsData.length);
          console.log('通過 API 載入所有常規學生數量（用於未安排計算，已過濾已停用）:', allRegularStudentsData.length);
        } else {
          console.error('無法載入常規學生，API 返回錯誤:', response.status);
          // 如果 API 失敗，嘗試直接查詢（可能也會失敗，但至少不會崩潰）
          const { data, error: regularStudentsError } = await supabase
            .from('Hanami_Students')
            .select('*')
            .eq('org_id', validOrgId as string)
            .neq('student_type', '已停用');
          
          if (!regularStudentsError && data) {
            allRegularStudentsData = data;
            regularStudentsData = data.filter((s: any) => s.primary_course_code != null);
          } else {
            console.error('直接查詢也失敗:', regularStudentsError);
          }
        }
      } catch (error) {
        console.error('載入常規學生時發生錯誤:', error);
      }

      // 5. 取得試聽學生
      const { data: trialStudentsData, error: trialStudentsError } = await supabase
        .from('hanami_trial_students')
        .select('*')
        .eq('org_id', validOrgId as string)
        .not('trial_course_code', 'is', null);

      if (trialStudentsError) {
        console.error('無法載入試聽學生：', trialStudentsError);
      }

      // 6. 等候區學生將在點擊時段詳情時才載入

      // 7. 處理多課程時間表數據
      const multiCourseSlots: MultiCourseSlot[] = [];
      const slotMap: {[key: string]: MultiCourseSlot} = {};

      scheduleData?.forEach(slot => {
        const slotKey = `${slot.weekday}_${slot.timeslot}`;
        
        if (!slotMap[slotKey]) {
          slotMap[slotKey] = {
            id: slot.id,
            weekday: slot.weekday,
            timeslot: slot.timeslot,
            courses: [],
            max_total_students: 0,
            current_total_students: 0,
            is_trial_open: slot.is_trial_open ?? true,
            is_registration_open: slot.is_registration_open ?? true
          };
        }

        const courseInfo: CourseInfo = {
          course_code: slot.course_code,
          course_name: courseCodesMap[slot.course_code]?.course_name || '未知課程',
          course_type: courseCodesMap[slot.course_code]?.course_type_name || '未知類型',
          max_students: courseCodesMap[slot.course_code]?.max_students || slot.max_students || 0,
          current_students: 0,
          teacher_name: courseCodesMap[slot.course_code]?.teacher_name || null,
          room_location: courseCodesMap[slot.course_code]?.room_location || slot.room_id || null,
          trial_students: [],
          regular_students_ages: [],
          regular_students: [],
          queue_students: []
        };

        // 使用 assigned_student_ids 直接獲取學生
        console.log(`時段 ${slot.timeslot} 課程 ${slot.course_code} 的 assigned_student_ids:`, slot.assigned_student_ids);
        
        let regularStudents: any[] = [];
        
        // 完全依賴 assigned_student_ids 來顯示學生，不再回退到傳統邏輯
        if (slot.assigned_student_ids && slot.assigned_student_ids.length > 0) {
          // 直接通過 assigned_student_ids 獲取學生，並過濾掉"已停用"的學生
          regularStudents = regularStudentsData?.filter(student => 
            slot.assigned_student_ids.includes(student.id) &&
            student.student_type !== '已停用'
          ) || [];
          
          // 如果發現有"已停用"的學生在 assigned_student_ids 中，自動從 assigned_student_ids 中移除
          const inactiveStudentIds = regularStudentsData?.filter(student => 
            slot.assigned_student_ids.includes(student.id) &&
            student.student_type === '已停用'
          ).map(s => s.id) || [];
          
          if (inactiveStudentIds.length > 0) {
            console.log(`發現 ${inactiveStudentIds.length} 名已停用學生在 assigned_student_ids 中，自動移除:`, inactiveStudentIds);
            
            // 更新 assigned_student_ids，移除已停用的學生
            const updatedAssignedIds = slot.assigned_student_ids.filter((id: string) => !inactiveStudentIds.includes(id));
            
            // 異步更新資料庫（不等待完成，避免阻塞）
            supabase
              .from('hanami_schedule')
              .update({ assigned_student_ids: updatedAssignedIds })
              .eq('id', slot.id)
              .eq('org_id', validOrgId as string)
              .then(({ error }) => {
                if (error) {
                  console.error('自動移除已停用學生失敗:', error);
                } else {
                  console.log('成功自動移除已停用學生');
                }
              });
          }
          
          console.log(`通過 assigned_student_ids 找到 ${regularStudents.length} 名學生（已過濾已停用）:`, 
            regularStudents.map(s => ({ id: s.id, name: s.full_name, student_type: s.student_type })));
        } else {
          // 沒有 assigned_student_ids 時，顯示空列表
          console.log(`時段 ${slot.timeslot} 課程 ${slot.course_code} 沒有 assigned_student_ids，顯示空列表`);
          regularStudents = [];
        }

        courseInfo.current_students = regularStudents.length;
        courseInfo.regular_students = regularStudents;
        courseInfo.regular_students_ages = regularStudents
          .map(s => s.student_age)
          .filter(age => age !== null && age !== undefined && age >= 0 && age <= 1800) as number[]; // 過濾異常年齡（最大150歲 = 1800個月）

        // 根據傳統視圖邏輯計算試堂學生
        // 定義課程類型名稱（用於試堂學生過濾）
        const scheduleCourseName = courseCodesMap[slot.course_code]?.course_type_name || '未知課程';
        
        const trialStudents = trialStudentsData?.filter(student => {
          // 排除今天以前的試堂學生
          const lessonDate = getHongKongDate(new Date(student.lesson_date));
          const today = getHongKongDate();
          const todayStr = today.toISOString().split('T')[0];
          const lessonDateStr = lessonDate.toISOString().split('T')[0];
          
          if (lessonDateStr < todayStr) return false; // 排除過期的試堂
          
          // 根據傳統視圖邏輯：將lesson_date轉換為星期進行匹配
          const tWeekdayNum = lessonDate.getDay();
          
          // 星期、時段和課程類型匹配
          return (
            tWeekdayNum === slot.weekday &&
            student.actual_timeslot === slot.timeslot &&
            student.course_type === scheduleCourseName
          );
        }).map(student => ({
          id: student.id,
          full_name: student.full_name || '未知學生',
          student_age: (student.student_age && student.student_age >= 0 && student.student_age <= 1800) ? student.student_age : null, // 最大150歲 = 1800個月
          course_type: student.course_type,
          actual_timeslot: student.actual_timeslot,
          weekday: slot.weekday,
          trial_course_code: student.trial_course_code,
          lesson_date: student.lesson_date // 保留試堂日期
        })) || [];

        // 按試堂日期排序試堂學生
        trialStudents.sort((a, b) => {
          return new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime();
        });
        
        courseInfo.trial_students = trialStudents;

        // 等候區學生將在點擊時段詳情時才載入
        courseInfo.queue_students = [];

        slotMap[slotKey].courses.push(courseInfo);
        slotMap[slotKey].max_total_students += courseInfo.max_students;
        slotMap[slotKey].current_total_students += courseInfo.current_students;
        
        // 調試信息：檢查容量計算和學生分組
        console.log(`時段 ${slot.timeslot} 課程 ${courseInfo.course_code}:`, {
          assigned_student_ids: slot.assigned_student_ids,
          using_assigned_ids: slot.assigned_student_ids && slot.assigned_student_ids.length > 0,
          max_students: courseInfo.max_students,
          current_students: courseInfo.current_students,
          regular_count: regularStudents.length,
          trial_count: trialStudents.length,
          regular_students: regularStudents.map(s => ({ 
            id: s.id, 
            name: s.full_name, 
            course_type: s.course_type, 
            weekday: s.regular_weekday, 
            timeslot: s.regular_timeslot 
          })),
          trial_students: trialStudents.map(s => ({ 
            name: s.full_name, 
            course_type: s.course_type, 
            lesson_date: s.lesson_date, 
            actual_timeslot: s.actual_timeslot 
          })),
          queue_students: [], // 等候區學生將在點擊時段詳情時才載入
          total_max: slotMap[slotKey].max_total_students,
          total_current: slotMap[slotKey].current_total_students,
          today: getHongKongDate().toISOString().split('T')[0],
          note: '完全依賴 assigned_student_ids 顯示學生，不再使用傳統邏輯'
        });
      });

      // ============================================
      // 未安排學生判定邏輯說明（完全套用"添加學生到課程"的邏輯）：
      // ============================================
      // 1. 篩選條件：
      //    - 學生必須有 fixed 上課時間（regular_weekday 和 regular_timeslot 不為 null）
      //    - 學生狀態不能是"已停用"（student_type !== '已停用'）
      //    - **不要求 primary_course_code**（與"添加學生到課程"邏輯一致）
      //
      // 2. 匹配條件（必須同時滿足）：
      //    a) 時間匹配：學生的 regular_weekday 和 regular_timeslot 必須與時段的 weekday 和 timeslot 完全一致
      //    b) **不檢查課程匹配**（與"添加學生到課程"邏輯一致）
      //
      // 3. 未安排判定：
      //    - 如果該時段的任何 hanami_schedule 記錄的 assigned_student_ids 中包含該學生 → 已安排
      //    - 否則 → 未安排
      //
      // 4. 鍵值格式：
      //    - 計算時使用：`${weekday}_${normalizedTimeslot}`（weekday 為數字，timeslot 為 HH:MM 格式）
      //    - 顯示時使用相同的鍵值格式進行查找
      // ============================================
      
      // 計算每個時段未安排進班別的學生數量
      const unassignedCounts: {[key: string]: number} = {};
      
      // 獲取所有有固定上課時間的學生（regular_weekday 和 regular_timeslot 不為 null），並排除"已停用"的學生
      // **不要求 primary_course_code**（與"添加學生到課程"邏輯一致）
      // 使用 allRegularStudentsData（包含所有學生，不限制 primary_course_code）進行未安排學生計算
      const studentsWithSchedule = allRegularStudentsData?.filter((s: any) => 
        s.regular_weekday !== null && 
        s.regular_weekday !== undefined && 
        s.regular_timeslot !== null && 
        s.regular_timeslot !== undefined &&
        s.student_type !== '已停用'
      ) || [];
      
      // 調試：記錄有固定上課時間的學生統計
      console.log('[未安排學生計算-套用添加學生邏輯] 有固定上課時間的學生數量:', studentsWithSchedule.length);
      
      // 標準化時間格式的輔助函數（移除秒數，統一為 HH:MM 格式）
      const normalizeTime = (timeStr: string | null | undefined): string => {
        if (!timeStr) return '';
        // 如果是 HH:MM:SS 格式，轉換為 HH:MM
        if (timeStr.length >= 8 && timeStr.includes(':')) {
          return timeStr.substring(0, 5);
        }
        // 如果是 HH:MM 格式，保持不變
        return timeStr.length >= 5 ? timeStr.substring(0, 5) : timeStr;
      };
      
      // 對每個時段計算未安排的學生（完全套用"添加學生到課程"的邏輯）
      Object.values(slotMap).forEach(slot => {
        // 標準化時間格式，確保鍵值一致
        const normalizedTimeslot = normalizeTime(slot.timeslot);
        // 確保 weekday 類型一致（轉換為數字）- 與顯示邏輯保持一致
        const slotWeekday = typeof slot.weekday === 'string' 
          ? parseInt(slot.weekday, 10) 
          : (typeof slot.weekday === 'number' ? slot.weekday : 0);
        const slotKey = `${slotWeekday}_${normalizedTimeslot}`;
        
        // 獲取該時段所有課程的 assigned_student_ids（合併所有課程的學生ID）
        const allAssignedStudentIds = new Set<string>();
        let matchedScheduleCount = 0;
        scheduleData?.forEach((s: any) => {
          const normalizedSTimeslot = normalizeTime(s.timeslot);
          const sWeekday = typeof s.weekday === 'string' 
            ? parseInt(s.weekday, 10) 
            : s.weekday;
          // 如果該 schedule 記錄匹配當前時段
          if (sWeekday === slotWeekday && normalizedSTimeslot === normalizedTimeslot) {
            matchedScheduleCount++;
            // 將該課程的 assigned_student_ids 加入集合
            if (s.assigned_student_ids && Array.isArray(s.assigned_student_ids)) {
              s.assigned_student_ids.forEach((id: string) => allAssignedStudentIds.add(id));
            }
          }
        });
        
        // 調試：記錄已安排學生ID的構建過程
        if (process.env.NODE_ENV === 'development') {
          console.log(`[已安排學生ID構建] 時段 ${slotKey}:`, {
            時段鍵值: slotKey,
            匹配的schedule記錄數: matchedScheduleCount,
            已安排學生ID數量: allAssignedStudentIds.size,
            已安排學生ID列表: Array.from(allAssignedStudentIds)
          });
        }
        
        // 找出該時段應該上課但未安排的學生
        // **完全套用"添加學生到課程"的邏輯：只檢查時間匹配，不檢查課程**
        const unassignedInSlot = studentsWithSchedule.filter((student: any) => {
          // 1. 檢查時間是否匹配（確保 weekday 和 timeslot 都不為 null）
          if (student.regular_weekday === null || student.regular_weekday === undefined ||
              student.regular_timeslot === null || student.regular_timeslot === undefined) {
            return false;
          }
          
          // 轉換星期數字格式（與"添加學生到課程"邏輯一致）
          let studentWeekday: number;
          if (typeof student.regular_weekday === 'string') {
            studentWeekday = parseInt(student.regular_weekday);
            if (isNaN(studentWeekday)) {
              return false;
            }
          } else {
            studentWeekday = student.regular_weekday;
          }
          
          // 檢查星期和時間是否匹配
          // 為了確保鍵值一致性，我們使用標準化時間進行比較
          const isSameWeekday = studentWeekday === slotWeekday;
          
          // 標準化學生時間和時段時間進行比較
          const normalizedStudentTime = normalizeTime(student.regular_timeslot);
          const normalizedSlotTime = normalizedTimeslot; // 已在外部作用域定義
          
          // 如果標準化時間不為空且長度足夠，進行比較
          if (!normalizedStudentTime || normalizedStudentTime.length < 5) {
            return false;
          }
          
          const isSameTimeslot = normalizedStudentTime === normalizedSlotTime;
          
          if (!isSameWeekday || !isSameTimeslot) {
            return false;
          }
          
          // 2. 檢查該學生是否已經在該時段的任何課程中（檢查合併後的 assigned_student_ids）
          // 如果學生已經在 assigned_student_ids 中，則為已安排，不算未安排
          if (allAssignedStudentIds.has(student.id)) {
            return false;
          }
          
          // 如果時間匹配且不在 assigned_student_ids 中，則為未安排
          return true;
        });
        
        // 找出所有時間匹配的學生（用於調試）
        const allMatchingStudents = studentsWithSchedule.filter((student: any) => {
          if (student.regular_weekday === null || student.regular_weekday === undefined ||
              student.regular_timeslot === null || student.regular_timeslot === undefined) {
            return false;
          }
          let studentWeekday: number;
          if (typeof student.regular_weekday === 'string') {
            studentWeekday = parseInt(student.regular_weekday);
            if (isNaN(studentWeekday)) return false;
          } else {
            studentWeekday = student.regular_weekday;
          }
          const isSameWeekday = studentWeekday === slotWeekday;
          
          // 使用標準化時間進行比較（與計算邏輯一致）
          const normalizedStudentTime = normalizeTime(student.regular_timeslot);
          if (!normalizedStudentTime || normalizedStudentTime.length < 5) {
            return false;
          }
          const isSameTimeslot = normalizedStudentTime === normalizedTimeslot;
          
          return isSameWeekday && isSameTimeslot;
        });
        
        unassignedCounts[slotKey] = unassignedInSlot.length;
        
        // 調試：記錄所有時段的鍵值生成（包括未安排學生數為0的）
        console.log(`[計算邏輯-鍵值生成] 時段 ${slotKey}:`, {
          時段鍵值: slotKey,
          原始weekday: slot.weekday,
          標準化weekday: slotWeekday,
          原始timeslot: slot.timeslot,
          標準化timeslot: normalizedTimeslot,
          未安排學生數: unassignedInSlot.length,
          匹配學生總數: allMatchingStudents.length,
          已安排學生數: allMatchingStudents.length - unassignedInSlot.length
        });
        
        // 調試：記錄未安排學生的詳細信息（僅當有未安排學生或匹配學生時）
        if (unassignedInSlot.length > 0 || allMatchingStudents.length > 0) {
          console.log(`[未安排學生-套用添加學生邏輯] 時段 ${slotKey} (星期${slot.weekday}, ${slot.timeslot}):`, {
            時段鍵值: slotKey,
            時段時間: slot.timeslot,
            匹配學生總數: allMatchingStudents.length,
            未安排學生數: unassignedInSlot.length,
            已安排學生數: allMatchingStudents.length - unassignedInSlot.length,
            已安排學生ID集合: Array.from(allAssignedStudentIds),
            未安排學生: unassignedInSlot.map(s => ({
              姓名: s.full_name,
              id: s.id,
              primary_course_code: s.primary_course_code,
              regular_weekday: s.regular_weekday,
              regular_timeslot: s.regular_timeslot
            })),
            所有匹配學生詳情: allMatchingStudents.map(s => ({
              姓名: s.full_name,
              id: s.id,
              primary_course_code: s.primary_course_code,
              regular_weekday: s.regular_weekday,
              regular_timeslot: s.regular_timeslot,
              是否在assigned_student_ids中: allAssignedStudentIds.has(s.id),
              是否算作未安排: unassignedInSlot.some(u => u.id === s.id)
            }))
          });
        }
      });
      
      // ============================================
      // 處理不在 slotMap 中的時段（學生有固定時間但該時段沒有 hanami_schedule 記錄）
      // ============================================
      // 對於每個有固定上課時間的學生，檢查他們的時段是否存在於 slotMap 中
      // 如果不存在，則該學生應該算作未安排（與"添加學生到課程"邏輯一致，不要求 primary_course_code）
      studentsWithSchedule.forEach((student: any) => {
        // 確保 weekday 和 timeslot 都不為 null
        if (student.regular_weekday === null || student.regular_weekday === undefined ||
            student.regular_timeslot === null || student.regular_timeslot === undefined) {
          return;
        }
        
        // 轉換星期數字格式（與"添加學生到課程"邏輯一致）
        let studentWeekday: number;
        if (typeof student.regular_weekday === 'string') {
          studentWeekday = parseInt(student.regular_weekday);
          if (isNaN(studentWeekday)) return;
        } else {
          studentWeekday = student.regular_weekday;
        }
        
        // 生成鍵值（使用標準化時間，與計算邏輯保持一致）
        const normalizedStudentTime = normalizeTime(student.regular_timeslot);
        if (!normalizedStudentTime || normalizedStudentTime.length < 5) {
          return;
        }
        const studentSlotKey = `${studentWeekday}_${normalizedStudentTime}`;
        
        // 檢查該時段是否存在於 slotMap 中（使用標準化時間進行比較，確保一致性）
        const slotExists = Object.values(slotMap).some(slot => {
          const slotWeekday = typeof slot.weekday === 'string' 
            ? parseInt(slot.weekday, 10) 
            : (typeof slot.weekday === 'number' ? slot.weekday : 0);
          // 使用標準化時間進行比較
          const normalizedSlotTime = normalizeTime(slot.timeslot);
          return slotWeekday === studentWeekday && normalizedSlotTime === normalizedStudentTime;
        });
        
        // 如果時段不存在於 slotMap 中，則該學生應該算作未安排
        // （因為他們有固定時間但該時段沒有課程安排）
        if (!slotExists) {
          // 初始化該時段的計數（如果尚未存在）
          if (!unassignedCounts[studentSlotKey]) {
            unassignedCounts[studentSlotKey] = 0;
          }
          // 增加未安排學生數
          unassignedCounts[studentSlotKey]++;
          
          // 調試：記錄不在 slotMap 中的時段
          console.log(`[未安排學生-無時段記錄] 學生 ${student.full_name} 的時段 ${studentSlotKey} 不存在於 slotMap 中，計入未安排`, {
            學生姓名: student.full_name,
            時段鍵值: studentSlotKey,
            regular_weekday: student.regular_weekday,
            regular_timeslot: student.regular_timeslot,
            標準化時間: normalizedStudentTime,
            primary_course_code: student.primary_course_code
          });
        }
      });
      
      // 調試：記錄所有未安排學生的統計
      const totalUnassigned = Object.values(unassignedCounts).reduce((sum, count) => sum + count, 0);
      const slotsWithUnassigned = Object.keys(unassignedCounts).filter(key => unassignedCounts[key] > 0).length;
      
      // 特別調試：檢查星期0（星期日）的所有時段
      const sundaySlots = Object.values(slotMap).filter(slot => {
        const slotWeekday = typeof slot.weekday === 'string' 
          ? parseInt(slot.weekday, 10) 
          : (typeof slot.weekday === 'number' ? slot.weekday : -1);
        return slotWeekday === 0;
      });
      
      console.log('[未安排學生統計-套用添加學生邏輯]', {
        總未安排學生數: totalUnassigned,
        有時段未安排學生的時段數: slotsWithUnassigned,
        總時段數: Object.keys(unassignedCounts).length,
        未安排學生分佈: Object.entries(unassignedCounts)
          .filter(([_, count]) => count > 0)
          .reduce((acc, [key, count]) => {
            acc[key] = count;
            return acc;
          }, {} as {[key: string]: number}),
        // 添加所有生成的鍵值列表（包括未安排學生數為0的），方便調試
        所有生成的鍵值: Object.keys(unassignedCounts).sort(),
        // 特別列出星期0（星期日）的所有鍵值
        星期0的所有鍵值: Object.keys(unassignedCounts).filter(key => key.startsWith('0_')),
        // 星期0的所有時段（來自 slotMap）
        星期0的所有時段: sundaySlots.map(slot => ({
          weekday: slot.weekday,
          timeslot: slot.timeslot,
          標準化時間: normalizeTime(slot.timeslot),
          生成的鍵值: `${typeof slot.weekday === 'string' ? parseInt(slot.weekday, 10) : slot.weekday}_${normalizeTime(slot.timeslot)}`,
          課程代碼: slot.courses.map(c => c.course_code)
        })),
        // 星期0的所有學生（有固定時間的）
        星期0的所有學生: studentsWithSchedule.filter((s: any) => {
          let sWeekday: number;
          if (typeof s.regular_weekday === 'string') {
            sWeekday = parseInt(s.regular_weekday, 10);
            if (isNaN(sWeekday)) return false;
          } else {
            sWeekday = s.regular_weekday;
          }
          return sWeekday === 0;
        }).map((s: any) => ({
          姓名: s.full_name,
          id: s.id,
          primary_course_code: s.primary_course_code,
          regular_weekday: s.regular_weekday,
          regular_timeslot: s.regular_timeslot,
          標準化時間: normalizeTime(s.regular_timeslot),
          生成的鍵值: `${typeof s.regular_weekday === 'string' ? parseInt(s.regular_weekday, 10) : s.regular_weekday}_${normalizeTime(s.regular_timeslot)}`
        }))
      });
      
      setUnassignedStudentsBySlot(unassignedCounts);

      // 轉換為陣列並進行數據驗證
      Object.values(slotMap).forEach(slot => {
        // 數據驗證：確保容量計算正確
        const calculatedMax = slot.courses.reduce((sum, course) => sum + course.max_students, 0);
        const calculatedCurrent = slot.courses.reduce((sum, course) => sum + course.current_students, 0);
        
        // 修正容量數據
        slot.max_total_students = calculatedMax;
        slot.current_total_students = calculatedCurrent;
        
        // 驗證每個課程的學生數據
        slot.courses.forEach(course => {
          // 確保年齡數據正確（月齡範圍：0-1800個月 = 0-150歲）
          course.regular_students_ages = course.regular_students_ages.filter(age => age >= 0 && age <= 1800);
          
          // 確保學生數量正確
          course.current_students = course.regular_students.length;
        });
        
        multiCourseSlots.push(slot);
      });

      console.log('多課程視圖數據處理完成：', {
        總時段數: multiCourseSlots.length,
        總課程數: multiCourseSlots.reduce((sum, slot) => sum + slot.courses.length, 0),
        總學生數: multiCourseSlots.reduce((sum, slot) => sum + slot.current_total_students, 0)
      });

      setSlots(multiCourseSlots);

      // 7. 處理試聽隊列數據
      const queueData: {[weekday: number]: any[]} = {};
      trialStudentsData?.forEach(student => {
        if (student.weekday !== null && student.weekday !== undefined) {
          if (!queueData[student.weekday]) {
            queueData[student.weekday] = [];
          }
          queueData[student.weekday].push(student);
        }
      });
      setQueueByDay(queueData);
      console.log('[MultiCourseAvailabilityDashboard] 數據載入完成');

    } catch (err) {
      console.error('[MultiCourseAvailabilityDashboard] 載入數據時發生錯誤：', err);
      setError('載入數據時發生錯誤，請稍後再試');
    } finally {
      console.log('[MultiCourseAvailabilityDashboard] 設置 loading 為 false');
      setLoading(false);
    }
  }, [hasValidOrg, validOrgId]);

  useEffect(() => {
    console.log('[MultiCourseAvailabilityDashboard] useEffect 觸發，調用 fetchData');
    fetchData();
  }, [fetchData]);
  
  // 額外檢查：如果沒有有效組織且 loading 為 true，確保設置為 false
  useEffect(() => {
    if (!hasValidOrg && loading) {
      console.log('[MultiCourseAvailabilityDashboard] 額外檢查：沒有有效組織但 loading 為 true，設置為 false');
      setLoading(false);
    }
  }, [hasValidOrg, loading]);

  const handleExpandCourse = (weekday: number, courseCode: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        [courseCode]: !prev[weekday]?.[courseCode]
      }
    }));
  };

  const handleExpandTrial = (key: string) => {
    setExpandedTrial(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExpandQueue = (weekday: number) => {
    setExpandedQueue(prev => ({
      ...prev,
      [weekday]: !prev[weekday]
    }));
  };

  const handleExpandAvailableDates = (key: string) => {
    setExpandedAvailableDates(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-[#2B3A3B] text-lg font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            載入中...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 mb-4 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start">
          <motion.div 
            className="flex-shrink-0"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </motion.div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">載入錯誤</h3>
            <div className="text-red-700 mb-4">{error}</div>
            <motion.button
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              onClick={fetchData}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              重新載入
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // 將多課程時段轉換為傳統視圖的格式
  const slotsByDay: {[dayIdx: number]: any[]} = {};
  weekdays.forEach((_, dayIdx) => {
    slotsByDay[dayIdx] = [];
  });

      // 將多課程時段轉換為傳統視圖格式
      slots.forEach(slot => {
        slot.courses.forEach(course => {
          slotsByDay[slot.weekday].push({
            id: `${slot.id}_${course.course_code}`,
            weekday: slot.weekday,
            time: slot.timeslot,
            course: course.course_type,
            course_code: course.course_code,
            course_name: course.course_name,
            max: course.max_students,
            current: course.current_students,
            regular_students: course.regular_students,
            trial_students: course.trial_students,
            regular_students_ages: course.regular_students_ages,
            teacher_name: course.teacher_name,
            room_location: course.room_location,
            is_trial_open: slot.is_trial_open,
            is_registration_open: slot.is_registration_open
          });
        });
      });

  // 移除重複的 loading 檢查，已在上面處理

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  // 檢查是否有課堂資料
  if (slots.length === 0) {
    return (
      <motion.div 
        className="w-full flex flex-col items-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Image alt="icon" height={32} src="/rabbit.png" width={32} />
          </motion.div>
          <h2 className="text-2xl font-bold text-[#2B3A3B]">多課程時間表</h2>
        </motion.div>
        <motion.div 
          className="text-center p-8 bg-gradient-to-br from-[#FFFDF7] to-[#FFF9F2] border border-[#EADBC8] rounded-2xl shadow-lg max-w-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div 
            className="text-[#2B3A3B] mb-4 text-lg font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            目前沒有多課程資料
          </motion.div>
          <motion.div
            className="text-sm text-[#87704e]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            請先創建屬於您的機構，並建立課程與學生資料。
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#4B4036]">多課程時間表</h2>
          <Image alt="icon" height={24} src="/rabbit.png" width={24} />
        </div>
        <div className="flex items-center gap-3">
          {/* 狀態指示器圖例 */}
          <div className="flex items-center gap-2 text-xs text-[#87704e] bg-[#FFF9F2] px-3 py-1.5 rounded-lg border border-[#EADBC8]">
            <span className="font-medium">狀態指示器:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full" title="試堂開放"></div>
              <span>試堂</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full" title="報名開放"></div>
              <span>報名</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full" title="關閉"></div>
              <span>關閉</span>
            </div>
          </div>
          <button
            className="px-3 py-1.5 bg-[#EADBC8] text-[#4B4036] rounded-lg hover:bg-[#D4C4A8] transition-colors text-sm flex items-center gap-2 transform hover:scale-105"
            onClick={() => setShowTrialLimitModal(true)}
          >
            <Image alt="設定" height={16} src="/edit-pencil.png" width={16} />
            試堂人數設定
          </button>
        </div>
      </div>

      <div className="w-full overflow-auto">
        <div className="min-w-[700px] border border-[#EADBC8] rounded-xl bg-[#FFFDF7] shadow-sm">
          <div className="grid grid-cols-7 text-sm">
            {/* 星期標題 */}
            {weekdays.map((day) => (
              <div key={day} className="bg-gradient-to-br from-[#FFF5E5] to-[#FFEAA7] font-bold border-b border-r border-[#EADBC8] p-2 text-center text-[#4B4036]">
                {day}
              </div>
            ))}
            {/* 動態產生每一天的時段格子 */}
            {weekdays.map((_, dayIdx) => (
              <div key={dayIdx} className="flex flex-col border-r border-[#EADBC8] min-h-[60px]">
                {/* 課程總數統計 */}
                {slotsByDay[dayIdx] && slotsByDay[dayIdx].length > 0 && (
                  <div className="flex justify-center mb-1">
                    <div className="text-xs px-2 py-1 rounded bg-gradient-to-r from-[#FFF0E5] to-[#FFEAA7] text-[#8B4513] border border-orange-200 shadow-sm">
                      {(() => {
                        const daySlots = slotsByDay[dayIdx] || [];
                        const totalRegular = daySlots.reduce((sum, slot) => sum + slot.regular_students.length, 0);
                        const totalTrial = daySlots.reduce((sum, slot) => sum + slot.trial_students.length, 0);
                        const totalCapacity = daySlots.reduce((sum, slot) => sum + slot.max, 0);
                        return `${totalRegular}+${totalTrial}/${totalCapacity}`;
                      })()}
                    </div>
                  </div>
                )}
                {slotsByDay[dayIdx] && slotsByDay[dayIdx].length > 0 ? (
                  slotsByDay[dayIdx].map((slot, i) => (
                    <div
                      key={slot.id || slot.time + slot.course + i}
                      className="border border-[#EADBC8] p-2 text-center text-sm rounded-xl shadow hover:shadow-md transition-all duration-300 transform hover:scale-105 my-1 mx-1 cursor-pointer"
                      style={{ 
                        backgroundColor: slot.current < slot.max ? 
                          'linear-gradient(135deg, #FFF9E6 0%, #FFEAA7 100%)' : 
                          'linear-gradient(135deg, #FFFDF7 0%, #FFF9F2 100%)',
                        background: slot.current < slot.max ? 
                          'linear-gradient(135deg, #FFF9E6 0%, #FFEAA7 100%)' : 
                          'linear-gradient(135deg, #FFFDF7 0%, #FFF9F2 100%)'
                      }}
                      onClick={() => handleSlotClick(slot)}
                    >
                      <div className="text-[10px] text-gray-500 mb-1">
                        {slot.time}｜{slot.course}
                      </div>
                      <div className="font-semibold text-[#4B4036] text-sm mb-1">
                        {slot.regular_students.length}{slot.trial_students.length > 0 ? `+${slot.trial_students.length}` : ''}/{slot.max}
                      </div>
                      {/* 顯示未安排進班別的學生數量 */}
                      {(() => {
                        // 標準化時間格式（與計算邏輯保持一致）
                        const normalizeTime = (timeStr: string | null | undefined): string => {
                          if (!timeStr) return '';
                          // 如果是 HH:MM:SS 格式，轉換為 HH:MM
                          if (timeStr.length >= 8 && timeStr.includes(':')) {
                            return timeStr.substring(0, 5);
                          }
                          // 如果是 HH:MM 格式，保持不變
                          return timeStr.length >= 5 ? timeStr.substring(0, 5) : timeStr;
                        };
                        
                        // 標準化 slot.time（它來自 slot.timeslot）
                        const normalizedTime = normalizeTime(slot.time);
                        // 確保 weekday 類型一致（轉換為數字）- 與計算邏輯完全一致
                        const slotWeekday = typeof slot.weekday === 'string' 
                          ? parseInt(slot.weekday, 10) 
                          : (typeof slot.weekday === 'number' ? slot.weekday : 0);
                        const slotKey = `${slotWeekday}_${normalizedTime}`;
                        
                        // 直接使用計算邏輯生成的鍵值格式（與計算邏輯完全一致）
                        let unassignedCount = unassignedStudentsBySlot[slotKey] || 0;
                        
                        // 定義替代鍵值（用於後備查找和調試）
                        const alternativeKeys = [
                          `${slot.weekday}_${normalizedTime}`, // 原始weekday（可能是字符串）+ 標準化時間
                          `${slotWeekday}_${slot.time}`, // 標準化weekday + 原始時間
                          `${slot.weekday}_${slot.time}`, // 原始格式
                          // 如果 slot.time 是 HH:MM:SS 格式，也嘗試
                          slot.time && slot.time.length >= 8 ? `${slotWeekday}_${slot.time.substring(0, 5)}` : null,
                          slot.time && slot.time.length >= 8 ? `${slot.weekday}_${slot.time.substring(0, 5)}` : null,
                        ].filter(Boolean) as string[];
                        
                        // 如果沒有找到，嘗試其他可能的鍵值格式（僅作為後備）
                        if (unassignedCount === 0) {
                          for (const key of alternativeKeys) {
                            const count = unassignedStudentsBySlot[key] || 0;
                            if (count > unassignedCount) {
                              unassignedCount = count;
                            }
                          }
                        }
                        
                        // 調試：記錄查找過程（包括所有時段，用於排查鍵值不匹配問題）
                        if (process.env.NODE_ENV === 'development') {
                          // 檢查是否有相近的鍵值（用於排查格式不一致問題）
                          const allKeysForWeekday = Object.keys(unassignedStudentsBySlot).filter(k => {
                            const keyWeekday = k.split('_')[0];
                            return keyWeekday === String(slotWeekday) || keyWeekday === String(slot.weekday);
                          });
                          
                          // 記錄所有時段的查找過程（包括成功和失敗的）
                          const keyExists = slotKey in unassignedStudentsBySlot;
                          if (!keyExists || (unassignedCount === 0 && allKeysForWeekday.length > 0)) {
                            console.log(`[顯示邏輯] 時段 ${slot.time} (星期${slot.weekday}) ${keyExists ? '鍵值存在但數量為0' : '未找到匹配鍵值'}:`, {
                              使用的鍵值: slotKey,
                              鍵值是否存在: keyExists,
                              未安排學生數: unassignedCount,
                              slot_weekday類型: typeof slot.weekday,
                              slot_weekday值: slot.weekday,
                              標準化weekday: slotWeekday,
                              slot_time原始值: slot.time,
                              標準化時間: normalizedTime,
                              該weekday的所有可用鍵值: allKeysForWeekday,
                              所有鍵值對應的數量: allKeysForWeekday.map(k => ({ 
                                key: k, 
                                count: unassignedStudentsBySlot[k] || 0 
                              })),
                              unassignedStudentsBySlot的所有鍵值: Object.keys(unassignedStudentsBySlot).sort(),
                              嘗試的替代鍵值: alternativeKeys,
                              替代鍵值結果: alternativeKeys.map((k: string) => ({
                                key: k,
                                exists: k in unassignedStudentsBySlot,
                                count: unassignedStudentsBySlot[k] || 0
                              }))
                            });
                          } else if (unassignedCount > 0) {
                            // 成功找到時也記錄（用於驗證邏輯正確性）
                            console.log(`[顯示邏輯] 時段 ${slot.time} (星期${slot.weekday}) 成功找到:`, {
                              使用的鍵值: slotKey,
                              未安排學生數: unassignedCount,
                              slot_weekday類型: typeof slot.weekday,
                              slot_weekday值: slot.weekday,
                              標準化weekday: slotWeekday,
                              slot_time原始值: slot.time,
                              標準化時間: normalizedTime
                            });
                          }
                        }
                        
                        return unassignedCount > 0 ? (
                          <div className="text-[9px] text-orange-600 font-medium mb-1 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                            未安排: {unassignedCount}人
                          </div>
                        ) : null;
                      })()}
                      <div className="text-[9px] text-[#87704e] mb-1">
                        {slot.course_code}
                      </div>
                      {/* 顯示常規學生年齡範圍 */}
                      {slot.regular_students_ages && slot.regular_students_ages.length > 0 && (
                        <div className="text-[9px] text-[#87704e] mb-1">
                          {calculateAgeRange(slot.regular_students_ages.map((a: any) => ({ student_age: a })))}
                        </div>
                      )}
                      {/* 試堂和報名狀態指示器 */}
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {/* 試堂狀態指示器 */}
                        <div className={`w-2 h-2 rounded-full ${
                          slot.is_trial_open ? 'bg-green-400' : 'bg-red-400'
                        }`} title={slot.is_trial_open ? '試堂開放' : '試堂關閉'}></div>
                        {/* 報名狀態指示器 */}
                        <div className={`w-2 h-2 rounded-full ${
                          slot.is_registration_open ? 'bg-blue-400' : 'bg-orange-400'
                        }`} title={slot.is_registration_open ? '報名開放' : '報名關閉'}></div>
                      </div>
                      {/* 試堂學生展開按鈕 */}
                      {slot.trial_students && slot.trial_students.length > 0 && (
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <button
                            className="text-[9px] px-2 py-1 rounded bg-gradient-to-r from-[#FFF9E2] to-[#FFEAA7] text-[#4B4036] border border-yellow-200 hover:from-[#FFEFC2] hover:to-[#FFD93D] transition-all duration-300 transform hover:scale-105"
                            onClick={() => setExpandedTrial(prev => ({ ...prev, [`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`]: !prev[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] }))}
                          >
                            {expandedTrial[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] ? '收起' : '展開'}試堂學生（{slot.trial_students.length}）
                          </button>
                        </div>
                      )}
                      {/* 展開時才顯示名單 */}
                      {slot.trial_students && slot.trial_students.length > 0 && expandedTrial[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] && (
                        <div className="flex flex-col gap-1 mt-1">
                          {/* 按日期分組試堂學生 */}
                          {(() => {
                            // 按日期分組
                            const studentsByDate: { [date: string]: any[] } = {};
                            slot.trial_students.forEach((stu: any) => {
                              if (stu.lesson_date) {
                                const dateKey = stu.lesson_date;
                                if (!studentsByDate[dateKey]) {
                                  studentsByDate[dateKey] = [];
                                }
                                studentsByDate[dateKey].push(stu);
                              }
                            });
                            
                            // 按日期排序
                            const sortedDates = Object.keys(studentsByDate).sort((a, b) => {
                              return new Date(a).getTime() - new Date(b).getTime();
                            });
                            
                            return sortedDates.map(dateKey => {
                              const students = studentsByDate[dateKey];
                              const dateStr = formatTrialDate(dateKey);
                              const expandedKey = `${slot.weekday}_${slot.time}_${slot.course}_${slot.id}_${dateKey}`;
                              
                              return (
                                <div key={dateKey} className="border border-yellow-200 rounded p-1 bg-gradient-to-r from-[#FFF9E6] to-[#FFEAA7]">
                                  <button
                                    className="w-full text-left text-[9px] font-semibold text-[#4B4036] mb-1 px-1 flex items-center justify-between"
                                    onClick={() => setExpandedTrialByDate(prev => ({ ...prev, [expandedKey]: !prev[expandedKey] }))}
                                  >
                                    <span>試堂日期: {dateStr} ({students.length}人)</span>
                                    <span className="text-[8px]">
                                      {expandedTrialByDate[expandedKey] ? '收起' : '展開'}
                                    </span>
                                  </button>
                                  {expandedTrialByDate[expandedKey] && (
                                    <div className="flex flex-col gap-1">
                                      {students.map((stu) => (
                                        <button
                                          key={stu.id}
                                          className="inline-block px-2 py-1 rounded bg-gradient-to-r from-[#FFF9E6] to-[#FFEAA7] text-[9px] text-[#4B4036] hover:from-[#FFEFC2] hover:to-[#FFD93D] transition-all duration-300 transform hover:scale-105 leading-snug"
                                          style={{ cursor: 'pointer' }}
                                        >
                                          <div>{stu.full_name || '未知學生'}</div>
                                          <div className="flex items-center gap-2 text-[8px] text-[#87704e] mt-0.5">
                                            {stu.student_age && (
                                              <span>{convertMonthsToYears(stu.student_age)}</span>
                                            )}
                                            <span className="text-[#E17055]">試堂</span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-[#87704e] text-center p-2">
                    無課程
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 試堂限制設定模態框 */}
      <TrialLimitSettingsModal
        isOpen={showTrialLimitModal}
        onClose={() => setShowTrialLimitModal(false)}
        onSave={(settings) => {
          setTrialLimitSettings(settings);
          setShowTrialLimitModal(false);
        }}
        currentSettings={trialLimitSettings}
      />

      {/* 時段詳情模態框 */}
      <AnimatePresence>
        {showSlotDetailModal && selectedSlotDetail && (
        <motion.div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSlotDetailModal(false)}
        >
          <motion.div 
            className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-[#EADBC8]"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 模態框標題 */}
            <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] p-6 border-b-2 border-[#EADBC8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#2B3A3B]">時段詳情</h2>
                    <p className="text-[#4B4036] text-sm">
                      {weekdays[selectedSlotDetail.weekday]} {selectedSlotDetail.time}
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  onClick={() => setShowSlotDetailModal(false)}
                >
                  <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 模態框內容 */}
            <div className="p-6 overflow-y-auto flex-1 max-h-[calc(90vh-200px)] scrollbar-thin scrollbar-thumb-[#EADBC8] scrollbar-track-transparent">
              {/* 課程基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <motion.div 
                  className="bg-gradient-to-br from-[#E0F2E0] to-[#C8E6C9] p-4 rounded-xl border border-[#4CAF50]/20"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#2E7D32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="font-semibold text-[#2E7D32]">課程代碼</span>
                  </div>
                  <p className="text-lg font-bold text-[#1B5E20]">
                    {selectedSlotDetail.course_code}
                  </p>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] p-4 rounded-xl border border-[#FF9800]/20"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#E65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold text-[#E65100]">課程名稱</span>
                  </div>
                  <p className="text-lg font-bold text-[#BF360C]">
                    {selectedSlotDetail.course_name}
                  </p>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#F3E5F5] to-[#E1BEE7] p-4 rounded-xl border border-[#9C27B0]/20"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#6A1B9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-semibold text-[#6A1B9A]">課程類型</span>
                  </div>
                  <p className="text-lg font-bold text-[#4A148C]">
                    {selectedSlotDetail.course}
                  </p>
                </motion.div>
              </div>

              {/* 容量信息 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <motion.div 
                  className="bg-gradient-to-br from-[#E8F5E8] to-[#C8E6C9] p-4 rounded-xl border border-[#4CAF50]/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-2xl font-bold text-[#2E7D32] mb-1">
                    {selectedSlotDetail.max}
                  </div>
                  <div className="text-sm text-[#4CAF50] font-medium">總容量</div>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] p-4 rounded-xl border border-[#FFC107]/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-2xl font-bold text-[#F57F17] mb-1">
                    {selectedSlotDetail.regular_students.length}
                  </div>
                  <div className="text-sm text-[#FF8F00] font-medium">常規學生</div>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] p-4 rounded-xl border border-[#2196F3]/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-2xl font-bold text-[#1565C0] mb-1">
                    {selectedSlotDetail.trial_students.length}
                  </div>
                  <div className="text-sm text-[#1976D2] font-medium">試堂學生</div>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#FCE4EC] to-[#F8BBD9] p-4 rounded-xl border border-[#E91E63]/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="text-2xl font-bold text-[#C2185B] mb-1">
                    {Math.round((selectedSlotDetail.current / selectedSlotDetail.max) * 100)}%
                  </div>
                  <div className="text-sm text-[#E91E63] font-medium">使用率</div>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#F3E5F5] to-[#E1BEE7] p-4 rounded-xl border border-[#9C27B0]/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="text-2xl font-bold text-[#6A1B9A] mb-1">
                    {selectedSlotDetail.queue_students?.length || 0}
                  </div>
                  <div className="text-sm text-[#7B1FA2] font-medium">等候區</div>
                </motion.div>
              </div>

              {/* 時段控制面板 */}
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#9C27B0] to-[#673AB7] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#4B4036]">時段控制</h3>
                </div>
                
                <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-lg p-6 border border-[#EADBC8]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 試堂開放控制 */}
                    <motion.div 
                      className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedSlotDetail.is_trial_open 
                              ? 'bg-gradient-to-br from-[#4CAF50] to-[#2E7D32]' 
                              : 'bg-gradient-to-br from-[#F44336] to-[#C62828]'
                          }`}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#4B4036]">試堂開放</h4>
                            <p className="text-sm text-[#87704e]">
                              {selectedSlotDetail.is_trial_open ? '目前開放試堂' : '目前關閉試堂'}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FCD58B] focus:ring-offset-2 ${
                            selectedSlotDetail.is_trial_open ? 'bg-[#4CAF50]' : 'bg-gray-200'
                          } ${trialToggleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          onClick={toggleTrialOpen}
                          disabled={trialToggleLoading}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              selectedSlotDetail.is_trial_open ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                          {trialToggleLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </motion.button>
                      </div>
                      <div className="text-xs text-[#87704e] bg-gray-50 p-3 rounded-lg">
                        {selectedSlotDetail.is_trial_open 
                          ? '✓ 學生可以預約此時段的試堂課程' 
                          : '✗ 學生無法預約此時段的試堂課程'
                        }
                      </div>
                    </motion.div>

                    {/* 報名開放控制 */}
                    <motion.div 
                      className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedSlotDetail.is_registration_open 
                              ? 'bg-gradient-to-br from-[#2196F3] to-[#1565C0]' 
                              : 'bg-gradient-to-br from-[#FF9800] to-[#E65100]'
                          }`}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#4B4036]">報名開放</h4>
                            <p className="text-sm text-[#87704e]">
                              {selectedSlotDetail.is_registration_open ? '目前開放報名' : '目前關閉報名'}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FCD58B] focus:ring-offset-2 ${
                            selectedSlotDetail.is_registration_open ? 'bg-[#2196F3]' : 'bg-gray-200'
                          } ${registrationToggleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          onClick={toggleRegistrationOpen}
                          disabled={registrationToggleLoading}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              selectedSlotDetail.is_registration_open ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                          {registrationToggleLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </motion.button>
                      </div>
                      <div className="text-xs text-[#87704e] bg-gray-50 p-3 rounded-lg">
                        {selectedSlotDetail.is_registration_open 
                          ? '✓ 學生可以報名此時段的正式課程' 
                          : '✗ 學生無法報名此時段的正式課程'
                        }
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* 常規學生列表 */}
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#F57F17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#4B4036]">常規學生 ({(selectedSlotDetail.regular_students?.length || 0)})</h3>
                </div>
                <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-lg p-4 min-h-[120px]">
                  {(selectedSlotDetail.regular_students?.length || 0) > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(selectedSlotDetail.regular_students || []).map((student: any, index: number) => (
                        <motion.div
                          key={student.id || index}
                          className="bg-white rounded-lg p-3 border border-[#EADBC8] shadow-sm"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center text-xs font-bold text-[#4B4036]">
                              {student.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-[#4B4036] text-sm">
                                {student.full_name || '未知學生'}
                              </div>
                              {student.student_age && (
                                <div className="text-xs text-[#87704e]">
                                  {student.student_age}個月
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-[#87704e]">暫無常規學生</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* 試堂學生列表 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#1565C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#4B4036]">試堂學生 ({(selectedSlotDetail.trial_students?.length || 0)})</h3>
                </div>
                <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-lg p-4 min-h-[120px]">
                  {(selectedSlotDetail.trial_students?.length || 0) > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(selectedSlotDetail.trial_students || []).map((student: any, index: number) => (
                        <motion.div
                          key={student.id || index}
                          className="bg-white rounded-lg p-3 border border-[#EADBC8] shadow-sm"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.1 + index * 0.1 }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FF9BB3] rounded-full flex items-center justify-center text-xs font-bold text-[#4B4036]">
                              {student.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-[#4B4036] text-sm">
                                {student.full_name || '未知學生'}
                              </div>
                              {student.student_age && (
                                <div className="text-xs text-[#87704e]">
                                  {student.student_age}個月
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-[#87704e]">暫無試堂學生</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* 等候區學生列表 */}
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#E1BEE7] to-[#CE93D8] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#7B1FA2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#4B4036]">
                    等候區學生 ({(selectedSlotDetail.queue_students?.length || 0)})
                    <span className="text-sm font-normal text-[#87704e] ml-2">
                      未試堂: {(selectedSlotDetail.queue_students || []).filter((s: any) => 
                        s.status === '未試堂' || s.status === 'pending'
                      ).length} | 
                      已試堂: {(selectedSlotDetail.queue_students || []).filter((s: any) => 
                        s.status === '已試堂'
                      ).length}
                    </span>
                  </h3>
                </div>
                <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-lg p-4 min-h-[120px]">
                  {(queueStudentsLoading || batchConversationLoading) ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[#87704e]">
                        {queueStudentsLoading ? '載入等候區學生中...' : '載入對話記錄中...'}
                      </p>
                    </div>
                  ) : (selectedSlotDetail.queue_students?.length || 0) > 0 ? (
                    <div className="space-y-4">
                      {/* 已試堂學生 - 放在最上面 */}
                      {(selectedSlotDetail.queue_students || []).filter((student: any) => 
                        student.status === '已試堂'
                      ).length > 0 && (
                        <div>
                          <div 
                            className="flex items-center gap-2 mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            onClick={() => toggleSection('tried_students')}
                          >
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <h4 className="font-semibold text-[#4B4036] text-sm">
                              已試堂學生 ({(selectedSlotDetail.queue_students || []).filter((s: any) => 
                                s.status === '已試堂'
                              ).length})
                            </h4>
                            <div className="ml-auto">
                              <svg 
                                className={`w-4 h-4 text-[#87704e] transition-transform duration-200 ${
                                  expandedSections['tried_students'] ? 'rotate-180' : ''
                                }`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          {expandedSections['tried_students'] && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(selectedSlotDetail.queue_students || [])
                              .filter((student: any) => student.status === '已試堂')
                              .map((student: any, index: number) => (
                              <motion.div
                                key={student.id || index}
                                className="bg-white rounded-lg p-3 border border-green-200 shadow-sm"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.3 + index * 0.1 }}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                    {student.full_name?.charAt(0) || '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-[#4B4036] text-sm mb-1">
                                      {student.full_name || '未知學生'}
                                    </div>
                                    <div className="space-y-1 text-xs text-[#87704e]">
                                      {student.student_age && (
                                        <div className="flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          {student.student_age >= 24 
                                            ? `${Math.floor(student.student_age / 12)}歲${student.student_age % 12}月`
                                            : `${student.student_age}個月`
                                          }
                                        </div>
                                      )}
                                      {student.phone_no && (
                                        <div className="flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                          </svg>
                                          {student.phone_no}
                                        </div>
                                      )}
                                      {student.created_at && (
                                        <div className="flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          留位時間: {new Date(student.created_at).toLocaleDateString('zh-TW', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                      )}
                                      {student.phone_no && (
                                        <div 
                                          className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                                          onClick={() => loadConversationHistory(student.phone_no, student.full_name)}
                                          title="點擊查看對話記錄"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                          </svg>
                                          <span className="text-xs">
                                            {batchConversationLoading ? (
                                              '載入中...'
                                            ) : (
                                              batchConversationResults[student.phone_no] ? (
                                                batchConversationResults[student.phone_no].daysSinceLastMessage !== null
                                                  ? `最近對話: ${batchConversationResults[student.phone_no].daysSinceLastMessage}天前`
                                                  : '無對話記錄'
                                              ) : '無對話記錄'
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {student.notes && (
                                      <div className="mt-2 text-xs text-[#87704e] bg-green-50 p-2 rounded border">
                                        <span className="font-medium">備註:</span> {student.notes}
                                      </div>
                                    )}
                                  </div>
                                   {/* 管理按鈕 */}
                                   <div className="flex gap-1 mt-2">
                                     <button
                                       onClick={() => openStudentEditModal(student)}
                                       className="flex-1 px-2 py-1 text-xs bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-full hover:from-[#FCD58B] hover:to-[#EBC9A4] transition-all duration-300 transform hover:scale-105 hover:shadow-sm border border-[#EADBC8]"
                                       title="編輯學生"
                                     >
                                       編輯
                                     </button>
                                     {student.phone_no && (
                                       <button
                                         onClick={() => sendWhatsAppMessage(student.phone_no, student.full_name, {
                                           courseName: selectedSlotDetail?.course_name,
                                           timeSlot: selectedSlotDetail?.time,
                                           studentStatus: student.status
                                         })}
                                         className="px-2 py-1 text-xs bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white rounded-full hover:from-[#66BB6A] hover:to-[#4CAF50] transition-all duration-300 transform hover:scale-105 hover:shadow-sm flex items-center justify-center"
                                         title="發送WhatsApp訊息"
                                       >
                                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                           <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                         </svg>
                                       </button>
                                     )}
                                     <button
                                       onClick={() => deleteQueueStudent(student.id)}
                                       className="flex-1 px-2 py-1 text-xs bg-gradient-to-r from-[#FFE0E0] to-[#FFD59A] text-[#2B3A3B] rounded-full hover:from-[#FFCCCC] hover:to-[#FCD58B] transition-all duration-300 transform hover:scale-105 hover:shadow-sm border border-[#EADBC8]"
                                       title="刪除學生"
                                     >
                                       刪除
                                     </button>
                                   </div>
                                </div>
                              </motion.div>
                            ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 未試堂學生 */}
                      {(selectedSlotDetail.queue_students || []).filter((student: any) => 
                        student.status === '未試堂' || student.status === 'pending'
                      ).length > 0 && (
                        <div>
                          <div 
                            className="flex items-center gap-2 mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            onClick={() => toggleSection('pending_students')}
                          >
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <h4 className="font-semibold text-[#4B4036] text-sm">
                              未試堂學生 ({(selectedSlotDetail.queue_students || []).filter((s: any) => 
                                s.status === '未試堂' || s.status === 'pending'
                              ).length})
                            </h4>
                            <div className="ml-auto">
                              <svg 
                                className={`w-4 h-4 text-[#87704e] transition-transform duration-200 ${
                                  expandedSections['pending_students'] ? 'rotate-180' : ''
                                }`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          {expandedSections['pending_students'] && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(selectedSlotDetail.queue_students || [])
                              .filter((student: any) => 
                                student.status === '未試堂' || student.status === 'pending'
                              )
                              .map((student: any, index: number) => (
                              <motion.div
                                key={student.id || index}
                                className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.4 + index * 0.1 }}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                    {student.full_name?.charAt(0) || '?'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-[#4B4036] text-sm mb-1">
                                      {student.full_name || '未知學生'}
                                    </div>
                                    <div className="space-y-1 text-xs text-[#87704e]">
                                      {student.student_age && (
                                        <div className="flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          {student.student_age >= 24 
                                            ? `${Math.floor(student.student_age / 12)}歲${student.student_age % 12}月`
                                            : `${student.student_age}個月`
                                          }
                                        </div>
                                      )}
                                      {student.phone_no && (
                                        <div className="flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                          </svg>
                                          {student.phone_no}
                                        </div>
                                      )}
                                      {student.created_at && (
                                        <div className="flex items-center gap-1">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          留位時間: {new Date(student.created_at).toLocaleDateString('zh-TW', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                      )}
                                      {student.phone_no && (
                                        <div 
                                          className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                                          onClick={() => loadConversationHistory(student.phone_no, student.full_name)}
                                          title="點擊查看對話記錄"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                          </svg>
                                          <span className="text-xs">
                                            {batchConversationLoading ? (
                                              '載入中...'
                                            ) : (
                                              batchConversationResults[student.phone_no] ? (
                                                batchConversationResults[student.phone_no].daysSinceLastMessage !== null
                                                  ? `最近對話: ${batchConversationResults[student.phone_no].daysSinceLastMessage}天前`
                                                  : '無對話記錄'
                                              ) : '無對話記錄'
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {student.notes && (
                                      <div className="mt-2 text-xs text-[#87704e] bg-blue-50 p-2 rounded border">
                                        <span className="font-medium">備註:</span> {student.notes}
                                      </div>
                                    )}
                                  </div>
                                   {/* 管理按鈕 */}
                                   <div className="flex gap-1 mt-2">
                                     <button
                                       onClick={() => openStudentEditModal(student)}
                                       className="flex-1 px-2 py-1 text-xs bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-full hover:from-[#FCD58B] hover:to-[#EBC9A4] transition-all duration-300 transform hover:scale-105 hover:shadow-sm border border-[#EADBC8]"
                                       title="編輯學生"
                                     >
                                       編輯
                                     </button>
                                     {student.phone_no && (
                                       <button
                                         onClick={() => sendWhatsAppMessage(student.phone_no, student.full_name, {
                                           courseName: selectedSlotDetail?.course_name,
                                           timeSlot: selectedSlotDetail?.time,
                                           studentStatus: student.status
                                         })}
                                         className="px-2 py-1 text-xs bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white rounded-full hover:from-[#66BB6A] hover:to-[#4CAF50] transition-all duration-300 transform hover:scale-105 hover:shadow-sm flex items-center justify-center"
                                         title="發送WhatsApp訊息"
                                       >
                                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                           <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                         </svg>
                                       </button>
                                     )}
                                     <button
                                       onClick={() => deleteQueueStudent(student.id)}
                                       className="flex-1 px-2 py-1 text-xs bg-gradient-to-r from-[#FFE0E0] to-[#FFD59A] text-[#2B3A3B] rounded-full hover:from-[#FFCCCC] hover:to-[#FCD58B] transition-all duration-300 transform hover:scale-105 hover:shadow-sm border border-[#EADBC8]"
                                       title="刪除學生"
                                     >
                                       刪除
                                     </button>
                                   </div>
                                </div>
                              </motion.div>
                            ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[#87704e]">暫無等候區學生</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* 模態框底部 */}
            <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] p-6 border-t-2 border-[#EADBC8]">
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 bg-gradient-to-r from-[#FFB6C1] to-[#FF9BB3] text-white py-3 px-6 rounded-xl hover:from-[#FF9BB3] hover:to-[#FF8FA3] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 relative z-10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('添加學生按鈕被點擊了！');
                    handleAddStudentClick();
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加學生到課程
                </motion.button>
                <motion.button
                  className="flex-1 bg-gradient-to-r from-[#FFCDD2] to-[#FFB3BA] text-white py-3 px-6 rounded-xl hover:from-[#FFB3BA] hover:to-[#FF9FA6] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2 relative z-10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('移除學生按鈕被點擊了！');
                    handleRemoveStudentClick();
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  移除學生
                </motion.button>
                <motion.button
                  className="flex-1 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white py-3 px-6 rounded-xl hover:from-[#8f7350] hover:to-[#7a6348] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium relative z-10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSlotDetailModal(false);
                  }}
                >
                  關閉
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* 添加學生模態框 */}
      <AnimatePresence>
        {showAddStudentModal && (
          <motion.div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddStudentModal(false)}
          >
            <motion.div 
              className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-[#EADBC8]"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* 模態框標題 */}
            <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] p-6 border-b-2 border-[#EADBC8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#2B3A3B]">添加學生到課程</h2>
                    <p className="text-[#4B4036] text-sm">
                      {selectedSlotDetail?.course_code} - {selectedSlotDetail?.course_name}
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  onClick={() => setShowAddStudentModal(false)}
                >
                  <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 模態框內容 */}
            <div className="p-6 overflow-y-auto flex-1 max-h-[calc(90vh-200px)] scrollbar-thin scrollbar-thumb-[#EADBC8] scrollbar-track-transparent">
              {/* 選擇提示區域 */}
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-4 rounded-xl border border-[#EADBC8] shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FF9BB3] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#4B4036]">
                      選擇要添加到課程的學生 ({selectedStudents.length} 已選擇)
                    </h3>
                  </div>
                  
                  {/* 過濾條件 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <motion.div 
                      className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-green-700 font-medium">
                        同時段 ({weekdays[selectedSlotDetail?.weekday]} {selectedSlotDetail?.time})
                      </span>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-blue-700 font-medium">
                        已排除現有學生
                      </span>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-purple-700 font-medium">
                        assigned_student_ids 管理
                      </span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {availableStudents.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {availableStudents.map((student, index) => (
                    <motion.div
                      key={student.id}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden ${
                        selectedStudents.includes(student.id)
                          ? 'bg-gradient-to-br from-[#E8F5E8] to-[#C8E6C9] border-[#4CAF50] shadow-lg'
                          : 'bg-gradient-to-br from-white to-[#FFF9F2] border-[#EADBC8] hover:shadow-md hover:border-[#FFD59A]'
                      }`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      onClick={() => {
                        setSelectedStudents(prev => 
                          prev.includes(student.id)
                            ? prev.filter(id => id !== student.id)
                            : [...prev, student.id]
                        );
                      }}
                    >
                      {/* 學生頭像 */}
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          selectedStudents.includes(student.id)
                            ? 'bg-gradient-to-br from-[#4CAF50] to-[#2E7D32]'
                            : 'bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4]'
                        }`}>
                          {student.full_name?.charAt(0) || '?'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#4B4036] mb-2 truncate">
                            {student.full_name}
                          </div>
                          <div className="space-y-1 text-sm text-[#87704e]">
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              年齡: {student.student_age ? convertMonthsToYears(student.student_age) : '未設定'}
                            </div>
                            {student.contact_number && (
                              <div className="flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                聯絡: {student.contact_number}
                              </div>
                            )}
                            {student.parent_email && (
                              <div className="flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                家長郵箱: {student.parent_email}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 選擇狀態指示器 */}
                        <div className="absolute top-3 right-3">
                          {selectedStudents.includes(student.id) ? (
                            <div className="w-6 h-6 bg-[#4CAF50] rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-[#EADBC8] rounded-full hover:border-[#FFD59A] transition-colors"></div>
                          )}
                        </div>
                      </div>
                      
                      {/* 選擇狀態背景 */}
                      {selectedStudents.includes(student.id) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50]/10 to-[#2E7D32]/10 pointer-events-none"></div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center py-12 bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-xl border border-[#EADBC8] shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-[#EADBC8] to-[#D4C4A8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-[#87704e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#4B4036] mb-2">沒有可用的學生</h3>
                  <p className="text-[#87704e] text-sm">
                    目前沒有符合條件的學生可以添加到這個課程
                  </p>
                </motion.div>
              )}
            </div>

            {/* 模態框底部 */}
            <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] p-6 border-t-2 border-[#EADBC8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#4B4036]">
                    已選擇 {selectedStudents.length} 名學生
                  </span>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl border-2 border-[#EADBC8] text-[#4B4036] hover:bg-[#FFF9F2] hover:border-[#FFD59A]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddStudentModal(false)}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    className="bg-gradient-to-r from-[#FFB6C1] to-[#FF9BB3] hover:from-[#FF9BB3] hover:to-[#FF7A9B] text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    whileHover={{ scale: selectedStudents.length > 0 ? 1.02 : 1 }}
                    whileTap={{ scale: selectedStudents.length > 0 ? 0.98 : 1 }}
                    onClick={handleAddStudentsToCourse}
                    disabled={selectedStudents.length === 0}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    添加選中的學生 ({selectedStudents.length})
                  </motion.button>
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 移除學生模態框 */}
      {showRemoveStudentModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* 模態框標題 */}
            <div className="bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">移除學生從課程</h3>
                    <p className="text-white text-opacity-90">
                      {selectedSlotDetail?.course_code} - {selectedSlotDetail?.course_name}
                    </p>
                  </div>
                </div>
                <button
                  className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  onClick={() => setShowRemoveStudentModal(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 模態框內容 */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <div className="text-sm text-[#87704e] mb-2">
                  選擇要移除的學生 ({studentsToRemove.length} 已選擇)
                </div>
                <div className="text-xs text-[#87704e] space-y-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    移除後學生將從此課程中移除，但保持其他資料不變
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    系統完全依賴 assigned_student_ids 來顯示學生
                  </div>
                </div>
              </div>

              {selectedSlotDetail?.regular_students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {selectedSlotDetail.regular_students.map((student: any) => (
                    <div
                      key={student.id}
                      className={`p-4 rounded-xl border transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                        studentsToRemove.includes(student.id)
                          ? 'bg-gradient-to-br from-[#FFEBEE] to-[#FFCDD2] border-[#F44336] shadow-md'
                          : 'bg-gradient-to-br from-[#F3EFE3] to-[#E8DCC6] border-[#EADBC8] hover:shadow-md'
                      }`}
                      onClick={() => {
                        setStudentsToRemove(prev => 
                          prev.includes(student.id)
                            ? prev.filter(id => id !== student.id)
                            : [...prev, student.id]
                        );
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-[#4B4036] mb-1">{student.full_name}</div>
                          <div className="text-sm text-[#87704e]">
                            <div>年齡: {student.student_age ? convertMonthsToYears(student.student_age) : '未設定'}</div>
                            {student.contact_number && (
                              <div>聯絡: {student.contact_number}</div>
                            )}
                            {student.parent_email && (
                              <div>家長郵箱: {student.parent_email}</div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {studentsToRemove.includes(student.id) ? (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-[#EADBC8] rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#87704e] bg-gradient-to-br from-[#F9F9F9] to-[#F0F0F0] rounded-xl border border-[#E0E0E0]">
                  暫無常規學生可以移除
                </div>
              )}
            </div>

            {/* 模態框底部按鈕 */}
            <div className="p-6 border-t border-[#EADBC8] bg-[#FFFDF8] rounded-b-2xl flex-shrink-0">
              <div className="flex justify-center gap-4">
                <button
                  className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-[#EADBC8] text-[#4B4036] hover:bg-[#F0F0F0]"
                  onClick={() => setShowRemoveStudentModal(false)}
                >
                  取消
                </button>
                <button
                  className="bg-gradient-to-r from-[#FF6B6B] to-[#FF5252] hover:from-[#FF5252] hover:to-[#FF1744] text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleRemoveStudentsFromCourse}
                  disabled={studentsToRemove.length === 0}
                >
                  移除選中的學生 ({studentsToRemove.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 對話記錄彈窗 */}
      {showConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
          >
            {/* 彈窗標題 */}
            <div className="p-6 border-b border-[#EADBC8] bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-white rounded-xl mr-4 shadow-sm">
                    <svg className="w-6 h-6 text-[#2B3A3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#2B3A3B]">對話記錄</h3>
                    <p className="text-[#2B3A3B]/70">電話: {selectedStudentPhone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConversationModal(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-[#2B3A3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 對話內容 */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#FFF9F2]">
              {conversationLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FCD58B] mr-3" />
                  <span className="text-[#2B3A3B]">載入對話記錄中...</span>
                </div>
              ) : conversationMessages.length > 0 ? (
                <div className="space-y-4">
                  {conversationMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${message.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl p-4 ${
                        message.direction === 'incoming' 
                          ? 'bg-white border border-[#EADBC8] text-[#2B3A3B]' 
                          : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B]'
                      }`}>
                        <div className="flex items-center mb-2">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            message.direction === 'incoming' ? 'bg-blue-500' : 'bg-orange-500'
                          }`}></div>
                          <span className="text-xs font-medium">
                            {message.direction === 'incoming' ? '家長' : '機構'}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {new Date(message.timestamp).toLocaleString('zh-TW', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-[#2B3A3B]/70">暫無對話記錄</p>
                </div>
              )}
            </div>

            {/* 彈窗底部 */}
            <div className="p-6 border-t border-[#EADBC8] bg-[#FFFDF8] rounded-b-2xl">
              <div className="flex justify-center">
                <button
                  onClick={() => setShowConversationModal(false)}
                  className="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-[#EADBC8] text-[#4B4036] hover:bg-[#F0F0F0]"
                >
                  關閉
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 學生編輯彈窗 */}
      {showStudentEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* 彈窗標題 */}
            <div className="relative p-8 bg-gradient-to-br from-[#FFD59A] via-[#EBC9A4] to-[#FFB6C1] rounded-t-3xl">
              <div className="absolute inset-0 bg-white/10 rounded-t-3xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 bg-white/90 backdrop-blur-sm rounded-2xl mr-6 shadow-lg">
                    <svg className="w-8 h-8 text-[#2B3A3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#2B3A3B] mb-1">編輯等候區學生</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-sm font-bold text-[#2B3A3B]">
                        {editingStudent.full_name?.charAt(0) || '?'}
                      </div>
                      <p className="text-[#2B3A3B]/80 font-medium">{editingStudent.full_name}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeStudentEditModal}
                  className="p-3 hover:bg-white/30 rounded-2xl transition-all duration-300 hover:scale-110"
                >
                  <svg className="w-6 h-6 text-[#2B3A3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 編輯表單 */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8]">
              <div className="p-8 space-y-8">
                {/* 狀態選擇 */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#EADBC8]/50">
                  <label className="block text-lg font-semibold text-[#4B4036] mb-4 flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    試堂狀態
                  </label>
                  <div className="relative">
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border-2 border-[#EADBC8] rounded-xl focus:ring-4 focus:ring-[#FCD58B]/30 focus:border-[#FCD58B] transition-all duration-300 appearance-none cursor-pointer text-[#4B4036] font-medium"
                    >
                      <option value="未試堂">未試堂</option>
                      <option value="已試堂">已試堂</option>
                      <option value="pending">pending</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-[#87704e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 備註 */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#EADBC8]/50">
                  <label className="block text-lg font-semibold text-[#4B4036] mb-4 flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    備註
                  </label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border-2 border-[#EADBC8] rounded-xl focus:ring-4 focus:ring-[#FCD58B]/30 focus:border-[#FCD58B] transition-all duration-300 resize-none text-[#4B4036] placeholder-[#87704e]"
                    placeholder="輸入學生備註..."
                  />
                </div>

                {/* 課程類型 */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#EADBC8]/50">
                  <label className="block text-lg font-semibold text-[#4B4036] mb-4 flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#EBC9A4] to-[#FFD59A] rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    課程類型
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {courseTypes.map((courseType) => (
                      <label key={courseType.id} className="flex items-center p-3 bg-white/80 rounded-xl hover:bg-white transition-all duration-300 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={editFormData.course_types.includes(courseType.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditFormData(prev => ({
                                ...prev,
                                course_types: [...prev.course_types, courseType.name]
                              }));
                            } else {
                              setEditFormData(prev => ({
                                ...prev,
                                course_types: prev.course_types.filter(type => type !== courseType.name)
                              }));
                            }
                          }}
                          className="mr-3 w-5 h-5 text-[#FCD58B] focus:ring-[#FCD58B] rounded border-2 border-[#EADBC8]"
                        />
                        <span className="text-[#4B4036] font-medium group-hover:text-[#2B3A3B] transition-colors">{courseType.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 偏好時間 */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#EADBC8]/50">
                  <label className="block text-lg font-semibold text-[#4B4036] mb-4 flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#FFB6C1] rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    偏好星期
                  </label>
                  <div className="grid grid-cols-7 gap-3">
                    {['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'].map((day, index) => (
                      <label key={day} className="flex flex-col items-center p-3 bg-white/80 rounded-xl hover:bg-white transition-all duration-300 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={editFormData.prefer_time?.week?.includes(index) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditFormData(prev => ({
                                ...prev,
                                prefer_time: {
                                  ...prev.prefer_time,
                                  week: [...(prev.prefer_time?.week || []), index]
                                }
                              }));
                            } else {
                              setEditFormData(prev => ({
                                ...prev,
                                prefer_time: {
                                  ...prev.prefer_time,
                                  week: (prev.prefer_time?.week || []).filter(w => w !== index)
                                }
                              }));
                            }
                          }}
                          className="mb-2 w-5 h-5 text-[#FCD58B] focus:ring-[#FCD58B] rounded border-2 border-[#EADBC8]"
                        />
                        <span className="text-xs text-[#4B4036] font-medium group-hover:text-[#2B3A3B] transition-colors">{day.slice(-1)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 時間範圍 */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#EADBC8]/50">
                  <label className="block text-lg font-semibold text-[#4B4036] mb-4 flex items-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#FFB6C1] to-[#EBC9A4] rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    偏好時段
                  </label>
                  <div className="flex gap-4 justify-center">
                    {/* AM選擇 */}
                    <label className="flex items-center p-6 bg-white/80 rounded-2xl hover:bg-white transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-[#FCD58B] min-w-[140px]">
                      <input
                        type="radio"
                        name="time_period"
                        value="AM"
                        checked={(() => {
                          const range = editFormData.prefer_time?.range;
                          if (!range || range.length < 2) return false;
                          // 檢查是否包含AM時段（12:00前）
                          return range[0]?.includes('AM') || range[1]?.includes('AM') || 
                                 range[0]?.includes('12:00AM') || range[1]?.includes('12:00AM');
                        })()}
                        onChange={(e) => {
                          const newRange = ['09:00AM', '12:00AM']; // 上午：9:00 - 12:00
                          setEditFormData(prev => ({
                            ...prev,
                            prefer_time: {
                              ...prev.prefer_time,
                              range: newRange
                            }
                          }));
                        }}
                        className="mr-4 w-5 h-5 text-[#FCD58B] focus:ring-[#FCD58B]"
                      />
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mb-2 mx-auto">
                          <svg className="w-6 h-6 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-[#4B4036] font-semibold text-lg group-hover:text-[#2B3A3B] transition-colors">上午</span>
                        <p className="text-xs text-[#87704e] mt-1">9:00 - 12:00</p>
                      </div>
                    </label>

                    {/* PM選擇 */}
                    <label className="flex items-center p-6 bg-white/80 rounded-2xl hover:bg-white transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-[#FCD58B] min-w-[140px]">
                      <input
                        type="radio"
                        name="time_period"
                        value="PM"
                        checked={(() => {
                          const range = editFormData.prefer_time?.range;
                          if (!range || range.length < 2) return false;
                          // 檢查是否包含PM時段（12:00後）
                          return range[0]?.includes('PM') || range[1]?.includes('PM');
                        })()}
                        onChange={(e) => {
                          const newRange = ['12:00PM', '06:00PM']; // 下午：12:00 - 6:00
                          setEditFormData(prev => ({
                            ...prev,
                            prefer_time: {
                              ...prev.prefer_time,
                              range: newRange
                            }
                          }));
                        }}
                        className="mr-4 w-5 h-5 text-[#FCD58B] focus:ring-[#FCD58B]"
                      />
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#EBC9A4] to-[#FFB6C1] rounded-full flex items-center justify-center mb-2 mx-auto">
                          <svg className="w-6 h-6 text-[#2B3A3B]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-[#4B4036] font-semibold text-lg group-hover:text-[#2B3A3B] transition-colors">下午</span>
                        <p className="text-xs text-[#87704e] mt-1">12:00 - 6:00</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 彈窗底部 */}
            <div className="p-8 bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] border-t border-[#EADBC8]/50">
              <div className="flex justify-end gap-4">
                <button
                  onClick={closeStudentEditModal}
                  className="px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 border-[#EADBC8] text-[#4B4036] hover:bg-[#F0F0F0] hover:border-[#D4C4A8]"
                >
                  取消
                </button>
                <button
                  onClick={saveStudentEdit}
                  className="px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] hover:from-[#FCD58B] hover:to-[#EBC9A4] shadow-md"
                >
                  保存變更
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

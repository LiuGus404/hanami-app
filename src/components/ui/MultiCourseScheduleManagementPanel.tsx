'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { PopupSelect } from './PopupSelect';
import TimePicker from './TimePicker';
import CourseTypePreviewCard from './CourseTypePreviewCard';

import { supabase } from '@/lib/supabase';
import { createSaasClient } from '@/lib/supabase-saas';
import { useUser } from '@/hooks/useUser';
import { useOrganization } from '@/contexts/OrganizationContext';
import { buildTeacherDisplayName } from '@/lib/teacherUtils';
import { getUserSession } from '@/lib/authUtils';

// 嘗試從 TeacherLinkShell context 獲取組織信息（如果可用）
// 直接導入，如果 context 不可用會拋出錯誤，但在 teacher-link 頁面中應該可用
import { useTeacherLinkOrganization } from '@/app/aihome/teacher-link/create/TeacherLinkShell';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface ScheduleSlot {
  id: string;
  weekday: number | null;
  timeslot: string | null;
  max_students: number | null;
  assigned_teachers: string | null;
  created_at: string;
  updated_at: string | null;
  course_type: string | null;
  duration: string | null;
  course_code: string | null;
  course_section: string | null;
  room_id: string | null;
  is_primary_schedule: boolean | null;
}

interface CourseCode {
  id: string;
  course_code: string;
  course_name: string;
  course_description: string | null;
  max_students: number;
  teacher_id: string | null;
  room_location: string | null;
  is_active: boolean;
  course_type_id: string | null;
  course_type_name: string;
  teacher_name?: string | null;
}

interface CoursePackageConfig {
  id: string;
  title: string;
  lessons: number;
  price: number;
  description?: string | null;
  is_active?: boolean;
}

interface TrialBundleConfig {
  id: string;
  title: string;
  duration_minutes: number;
  price: number;
  note?: string | null;
  is_active?: boolean;
}

interface CourseTypeDiscountConfigs {
  packages: CoursePackageConfig[];
  trialBundles: TrialBundleConfig[];
}

interface CourseType {
  id: string;
  name: string | null;
  status: boolean | null;
  min_age: number | null;
  max_age: number | null;
  duration_minutes: number | null;
  max_students: number | null;
  difficulty_level: string | null;
  pricing_model: string | null;
  price_per_lesson: number | null;
  currency: string | null;
  is_pricing_enabled: boolean | null;
  trial_limit: number | null;
  description: string | null;
  color_code?: string | null;
  icon_type?: string | null;
  display_order?: number | null;
  discount_configs?: CourseTypeDiscountConfigs | null;
  images?: string[] | null;
}

interface Teacher {
  id: string;
  teacher_nickname: string | null;
  teacher_fullname: string | null;
  user_email?: string | null;
  role?: string | null;
  user_full_name?: string | null;
}

// 安全地獲取組織信息，即使沒有 OrganizationProvider
function useSafeOrganization() {
  const session = getUserSession();
  const sessionOrganization = session?.organization || null;
  
  // 嘗試使用 useOrganization，但需要檢查是否有 OrganizationProvider
  // 由於 React Hooks 規則，我們不能使用 try-catch，所以我們需要一個不同的方法
  // 我們將直接使用 session 作為主要來源，因為在 teacher-link 頁面中可能沒有 OrganizationProvider
  return sessionOrganization;
}

export default function MultiCourseScheduleManagementPanel() {
  const { user } = useUser();
  // 使用 isMounted 來確保只在客戶端執行，避免 hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  
  // 嘗試從 TeacherLinkShell context 獲取組織信息（優先）
  // 在 teacher-link 頁面中，這個 Hook 應該可用
  // 如果 context 不可用，Hook 會拋出錯誤，但這在 teacher-link 頁面中不應該發生
  let teacherLinkOrgId: string | null = null;
  let teacherLinkOrg: any = null;
  
  // 使用 try-catch 包裹 Hook 調用（雖然不符合 React 規則，但這是必要的）
  // 因為這個組件可能在不使用 TeacherLinkShell 的頁面中使用
  try {
    const teacherLinkContext = useTeacherLinkOrganization();
    teacherLinkOrgId = teacherLinkContext?.orgId || null;
    teacherLinkOrg = teacherLinkContext?.organization || null;
  } catch (e) {
    // TeacherLinkShell context 不可用，將使用其他方法
    // 這是正常的，因為這個組件可能在不使用 TeacherLinkShell 的頁面中使用
    console.log('[MultiCourseScheduleManagementPanel] TeacherLinkShell context 不可用，將使用其他方法');
  }
  
  // 從會話中獲取機構信息（可能沒有 OrganizationProvider）
  // 只在客戶端掛載後獲取，避免服務器端和客戶端不一致
  const [sessionOrganization, setSessionOrganization] = useState<any>(null);
  
  useEffect(() => {
    setIsMounted(true);
    const session = getUserSession();
    setSessionOrganization(session?.organization || null);
  }, []);
  
  // 在 teacher-link 頁面中，優先使用 TeacherLinkShell context 的組織信息
  // 否則使用 session 中的組織信息
  const currentOrganization = isMounted 
    ? (teacherLinkOrg || sessionOrganization)
    : null;
  
  const effectiveOrgId = useMemo(
    () => 
      (isMounted && teacherLinkOrgId) || 
      (isMounted && currentOrganization?.id) || 
      (isMounted && user?.organization?.id) || 
      null,
    [isMounted, teacherLinkOrgId, currentOrganization?.id, user?.organization?.id]
  );
  const validOrgId = useMemo(
    () => (effectiveOrgId && UUID_REGEX.test(effectiveOrgId) ? effectiveOrgId : null),
    [effectiveOrgId]
  );
  const hasValidOrg = Boolean(validOrgId);
  
  // 調試日誌
  useEffect(() => {
    if (isMounted) {
      console.log('[MultiCourseScheduleManagementPanel] 組織狀態:', {
        effectiveOrgId,
        validOrgId,
        hasValidOrg,
        teacherLinkOrgId,
        teacherLinkOrgName: teacherLinkOrg?.name,
        currentOrganization: currentOrganization?.id,
        userOrg: user?.organization?.id,
        sessionOrg: sessionOrganization?.id
      });
    }
  }, [isMounted, effectiveOrgId, validOrgId, hasValidOrg, teacherLinkOrgId, teacherLinkOrg?.name, currentOrganization?.id, user?.organization?.id, sessionOrganization?.id]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [courseCodes, setCourseCodes] = useState<CourseCode[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 新增課堂時段
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<ScheduleSlot>>({
    weekday: 1,
    timeslot: '09:00:00',
    max_students: 10,
    assigned_teachers: '',
    course_code: '',
    course_section: 'A',
    room_id: '',
    duration: '01:00:00',
    is_primary_schedule: true,
  });

  // 編輯課堂時段
  const [showEditSlot, setShowEditSlot] = useState(false);
  const [editSlot, setEditSlot] = useState<Partial<ScheduleSlot>>({});

  // 選擇器狀態
  const [showWeekdaySelect, setShowWeekdaySelect] = useState(false);
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [showCourseCodeSelect, setShowCourseCodeSelect] = useState(false);
  const [showEditWeekdaySelect, setShowEditWeekdaySelect] = useState(false);
  const [showEditTeacherSelect, setShowEditTeacherSelect] = useState(false);
  
  // 時段詳情視窗狀態
  const [showSlotDetail, setShowSlotDetail] = useState(false);
  const [selectedSlotDetail, setSelectedSlotDetail] = useState<any>(null);
  const [showEditCourseCodeSelect, setShowEditCourseCodeSelect] = useState(false);

  // 課程代碼管理
  const [showCourseCodeManagement, setShowCourseCodeManagement] = useState(false);
  const [showScheduleManagement, setShowScheduleManagement] = useState(true);
  const [showAddCourseCode, setShowAddCourseCode] = useState(false);
  const [showEditCourseCode, setShowEditCourseCode] = useState(false);
  
  // 新增課程代碼選擇器狀態
  const [showAddTeacherSelect, setShowAddTeacherSelect] = useState(false);
  const [showAddCourseTypeSelect, setShowAddCourseTypeSelect] = useState(false);
  
  // 編輯課程代碼選擇器狀態
  const [showEditCourseCodeTeacherSelect, setShowEditCourseCodeTeacherSelect] = useState(false);
  const [showEditCourseCodeCourseTypeSelect, setShowEditCourseCodeCourseTypeSelect] = useState(false);
  const [editingCourseCode, setEditingCourseCode] = useState<CourseCode | null>(null);
  const [newCourseCode, setNewCourseCode] = useState<Partial<CourseCode>>({
    course_code: '',
    course_name: '',
    course_description: '',
    max_students: 8,
    teacher_id: '',
    room_location: '',
    is_active: true,
    course_type_id: '',
  });

  const [showCourseTypeManagement, setShowCourseTypeManagement] = useState(false);
  const [showCourseTypeModal, setShowCourseTypeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewingCourseType, setPreviewingCourseType] = useState<CourseType | null>(null);
  const [editingCourseType, setEditingCourseType] = useState<CourseType | null>(null);
  const [courseTypeForm, setCourseTypeForm] = useState<Partial<CourseType> & {
    color_code?: string;
    icon_type?: string;
    display_order?: number;
    discount_configs?: CourseTypeDiscountConfigs;
  }>({
    name: '',
    status: true,
    min_age: null,
    max_age: null,
    duration_minutes: 45,
    max_students: 6,
    difficulty_level: 'beginner',
    pricing_model: 'monthly',
    price_per_lesson: null,
    currency: 'HKD',
    is_pricing_enabled: true,
    trial_limit: 1,
    description: '',
    color_code: 'from-pink-400 to-rose-400',
    icon_type: 'sparkles',
    display_order: courseTypes.length,
    discount_configs: {
      packages: [],
      trialBundles: [],
    },
  });
  const [courseTypeSaving, setCourseTypeSaving] = useState(false);
  
  // 圖片上傳相關狀態
  const [courseTypeImages, setCourseTypeImages] = useState<string[]>([]);
  const [initialCourseTypeImages, setInitialCourseTypeImages] = useState<string[]>([]); // 追蹤初始圖片，用於取消時刪除新上傳的圖片
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState<{ [key: string]: number }>({});

  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // 時間排序輔助函數
  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    const seconds = parseInt(parts[2] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const sortScheduleSlots = (slots: ScheduleSlot[]) => {
    const sorted = [...slots].sort((a, b) => {
      // 預設排序：先按星期（星期日=0到星期六=6），再按時間（早到晚）
      const aWeekday = a.weekday || 0;
      const bWeekday = b.weekday || 0;
      const aTime = a.timeslot || '00:00:00';
      const bTime = b.timeslot || '00:00:00';

      // 如果用戶點擊了排序，使用用戶選擇的排序方式
      if (sortField && sortField !== '') {
        let aValue: any = a[sortField as keyof ScheduleSlot];
        let bValue: any = b[sortField as keyof ScheduleSlot];

        if (sortField === 'weekday') {
          aValue = aWeekday;
          bValue = bWeekday;
        } else if (sortField === 'timeslot') {
          aValue = aTime;
          bValue = bTime;
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }

      // 預設排序邏輯：星期日到星期六，時間從早到晚
      if (aWeekday !== bWeekday) {
        return aWeekday - bWeekday; // 星期日(0) 到 星期六(6)
      }
      
      // 如果星期相同，按時間排序（早到晚）
      // 使用數值比較確保正確的時間排序
      const timeA = parseTime(aTime);
      const timeB = parseTime(bTime);
      
      return timeA - timeB;
    });

    // 調試日誌：顯示排序結果
    if (sorted.length > 0) {
      console.log('=== 時間表排序調試 ===');
      console.log('原始數據數量：', slots.length);
      console.log('排序後數據數量：', sorted.length);
      console.log('當前排序設定：', { sortField, sortDirection });
      
      console.log('時間表排序結果（前10筆）：', sorted.slice(0, 10).map(slot => ({
        星期: weekdays[slot.weekday || 0],
        時間: slot.timeslot,
        課程: slot.course_code || '未設定',
        星期數值: slot.weekday,
        時間數值: slot.timeslot,
        時間秒數: parseTime(slot.timeslot || '00:00:00')
      })));
      
      // 檢查同一天的排序
      const sameDaySlots = sorted.filter(slot => slot.weekday === sorted[0].weekday);
      if (sameDaySlots.length > 1) {
        console.log(`同一天(${weekdays[sameDaySlots[0].weekday || 0]})的時間排序：`, 
          sameDaySlots.map(slot => ({
            時間: slot.timeslot,
            秒數: parseTime(slot.timeslot || '00:00:00')
          })));
      }
    }

    return sorted;
  };

  const fetchData = useCallback(async () => {
    console.log('[MultiCourseScheduleManagementPanel] fetchData 被調用');
    console.log('[MultiCourseScheduleManagementPanel] hasValidOrg:', hasValidOrg);
    console.log('[MultiCourseScheduleManagementPanel] validOrgId:', validOrgId);
    console.log('[MultiCourseScheduleManagementPanel] validOrgIdType:', typeof validOrgId);
    console.log('[MultiCourseScheduleManagementPanel] validOrgIdLength:', validOrgId?.length);
    if (!hasValidOrg) {
      console.log('[MultiCourseScheduleManagementPanel] 沒有有效的組織，設置 loading 為 false');
      setScheduleSlots([]);
      setCourseCodes([]);
      setTeachers([]);
      setAdmins([]);
      setCourseTypes([]);
      setLoadError(null);
      setLoading(false);
      return;
    }
    if (!validOrgId) {
      console.error('[MultiCourseScheduleManagementPanel] 錯誤：hasValidOrg 為 true 但 validOrgId 為 null/undefined');
      setLoading(false);
      setLoadError('組織 ID 無效');
      return;
    }
    console.log('[MultiCourseScheduleManagementPanel] 開始載入數據...', { validOrgId });
    console.log('[MultiCourseScheduleManagementPanel] 設置 loading 為 true');
    setLoading(true);
    setLoadError(null);
    console.log('[MultiCourseScheduleManagementPanel] 進入 try 塊');
    try {
      console.log('[MultiCourseScheduleManagementPanel] 開始執行 Promise.all 查詢...', { validOrgId });
      const rolesForMembers = ['owner', 'admin', 'teacher'];
      
      // 添加超時處理，防止查詢永遠掛起
      const queryPromise = Promise.all([
        supabase
          .from('hanami_schedule')
          .select('*')
          .eq('org_id', validOrgId as string),
        supabase
          .from('hanami_course_codes')
          .select(`
            id,
            course_code,
            course_name,
            course_description,
            max_students,
            teacher_id,
            room_location,
            is_active,
            course_type_id
          `)
          .eq('org_id', validOrgId as string)
          .order('course_code', { ascending: true }),
        supabase
          .from('Hanami_CourseTypes')
          .select(`
            id,
            name,
            status,
            min_age,
            max_age,
            duration_minutes,
            max_students,
            difficulty_level,
            pricing_model,
            price_per_lesson,
            currency,
            is_pricing_enabled,
            trial_limit,
            description,
            color_code,
            icon_type,
            display_order,
            discount_configs,
            images
          `)
          .eq('org_id', validOrgId as string)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('hanami_employee')
          .select('id, teacher_nickname, teacher_fullname')
          .eq('org_id', validOrgId as string)
          .order('teacher_nickname', { ascending: true }),
        supabase
          .from('hanami_admin')
          .select('id, admin_name, admin_email, admin_oid, role')
          .eq('org_id', validOrgId as string)
          .eq('role', 'admin'),
        supabase
          .from('hanami_user_organizations')
          .select('id, user_id, user_email, role')
          .eq('org_id', validOrgId as string)
          .in('role', rolesForMembers)
      ]);
      
      // 添加超時處理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('查詢超時（30秒）'));
        }, 30000);
      });
      
      let scheduleData, courseCodesData, courseTypesData, teachersData, adminsData, membersData;
      let scheduleError, courseCodesError, courseTypesError, teachersError, adminsError, membersError;
      
      try {
        const results = await Promise.race([
          queryPromise,
          timeoutPromise
        ]) as any[];
        
        [
          { data: scheduleData, error: scheduleError },
          { data: courseCodesData, error: courseCodesError },
          { data: courseTypesData, error: courseTypesError },
          { data: teachersData, error: teachersError },
          { data: adminsData, error: adminsError },
          { data: membersData, error: membersError }
        ] = results;
      } catch (timeoutError: any) {
        console.error('[MultiCourseScheduleManagementPanel] 查詢超時或失敗:', timeoutError);
        setLoadError(`載入資料超時：${timeoutError?.message || '未知錯誤'}`);
        // 設置默認值
        scheduleData = courseCodesData = courseTypesData = teachersData = adminsData = membersData = [];
        scheduleError = courseCodesError = courseTypesError = teachersError = adminsError = membersError = null;
      }
      
      console.log('[MultiCourseScheduleManagementPanel] Promise.all 查詢完成', {
        scheduleError: scheduleError?.message,
        courseCodesError: courseCodesError?.message,
        courseTypesError: courseTypesError?.message,
        teachersError: teachersError?.message,
        adminsError: adminsError?.message,
        membersError: membersError?.message
      });

      if (scheduleError) {
        console.error('[MultiCourseScheduleManagementPanel] 載入時間表失敗：', scheduleError);
        setScheduleSlots([]);
        setLoadError('載入時間表資料時發生錯誤，請稍後再試。');
        // 不要 return，繼續執行以確保 finally 塊中的 setLoading(false) 被執行
      } else {
        setScheduleSlots(scheduleData || []);
      }

      if (courseCodesError) {
        console.error('[MultiCourseScheduleManagementPanel] 載入課程代碼失敗：', courseCodesError);
        setCourseCodes([]);
        setLoadError('載入課程代碼資料時發生錯誤，請稍後再試。');
        // 不要 return，繼續執行以確保 finally 塊中的 setLoading(false) 被執行
      }

      if (courseTypesError) {
        console.error('[MultiCourseScheduleManagementPanel] 載入課程類型失敗：', courseTypesError);
        setCourseTypes([]);
        setLoadError('載入課程類型資料時發生錯誤，請稍後再試。');
        // 不要 return，繼續執行以確保 finally 塊中的 setLoading(false) 被執行
      }

      if (adminsError) {
        console.error('載入管理員資料失敗：', adminsError);
        setAdmins([]);
      } else {
        setAdmins(adminsData || []);
      }

      const normalizedCourseTypes = (courseTypesData || []).map((ct: any) => ({
        ...ct,
        discount_configs: {
          packages: ct?.discount_configs?.packages ?? [],
          trialBundles: ct?.discount_configs?.trialBundles ?? [],
        },
      })) as CourseType[];
      setCourseTypes(normalizedCourseTypes);

      if (teachersError) {
        console.error('載入教師資料失敗（hanami_employee）：', teachersError);
      }

      const canonicalMembers = (membersData || []).filter((member: any) => {
        const role = (member.role || '').toLowerCase();
        return rolesForMembers.includes(role);
      });

      const memberUserIds = Array.from(
        new Set(
          canonicalMembers
            .map((member: any) => member.user_id)
            .filter((id: string | null | undefined): id is string => Boolean(id))
        )
      );

      const saasUserMap = new Map<string, { full_name: string | null; email: string | null }>();
      console.log('[MultiCourseScheduleManagementPanel] 準備查詢 saas_users，memberUserIds.length:', memberUserIds.length);
      if (memberUserIds.length > 0) {
        try {
          console.log('[MultiCourseScheduleManagementPanel] 開始查詢 saas_users...');
          const saasClient = createSaasClient();
          
          // 添加超時處理，防止查詢永遠掛起
          const saasQueryPromise = saasClient
            .from('saas_users')
            .select('id, email, full_name')
            .in('id', memberUserIds)
            .then((result: any) => {
              console.log('[MultiCourseScheduleManagementPanel] saas_users 查詢成功返回');
              return result;
            });
          
          const saasTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              console.warn('[MultiCourseScheduleManagementPanel] saas_users 查詢超時（5秒）');
              reject(new Error('saas_users 查詢超時（5秒）'));
            }, 5000);
          });
          
          let saasUsers, saasError;
          try {
            const result = await Promise.race([
              saasQueryPromise,
              saasTimeoutPromise
            ]) as any;
            saasUsers = result?.data;
            saasError = result?.error;
          } catch (timeoutErr: any) {
            console.warn('[MultiCourseScheduleManagementPanel] saas_users 查詢超時或失敗，繼續執行：', timeoutErr?.message);
            saasUsers = [];
            saasError = timeoutErr;
          }

          console.log('[MultiCourseScheduleManagementPanel] saas_users 查詢完成', { 
            saasUsersCount: saasUsers?.length || 0, 
            saasError: saasError?.message 
          });

          if (saasError) {
            console.warn('[MultiCourseScheduleManagementPanel] 查詢 saas_users 失敗：', saasError);
          } else if (saasUsers) {
            (saasUsers || []).forEach((user: any) => {
              saasUserMap.set(user.id, {
                full_name: user.full_name ?? null,
                email: user.email ?? null,
              });
            });
          }
        } catch (err: any) {
          console.warn('[MultiCourseScheduleManagementPanel] 連接 hanami_saas_system 失敗或超時：', err?.message || err);
          // 即使 saas_users 查詢失敗，也繼續執行，使用空映射
        }
      } else {
        console.log('[MultiCourseScheduleManagementPanel] 跳過 saas_users 查詢，因為 memberUserIds 為空');
      }

      const memberTeachers: Teacher[] = canonicalMembers
        .map((member: any) => {
          const canonicalId = member.user_id || member.user_email || member.id;
          if (!canonicalId) return null;
          const saasInfo = member.user_id ? saasUserMap.get(member.user_id) : undefined;
          const email = saasInfo?.email || member.user_email || null;
          const displayName = saasInfo?.full_name || (member.user_email ? member.user_email.split('@')[0] : null) || '未命名教師';
          return {
            id: canonicalId,
            teacher_nickname: displayName,
            teacher_fullname: null,
            user_email: email,
            role: member.role || null,
          } as Teacher;
        })
        .filter((teacher: Teacher | null): teacher is Teacher => Boolean(teacher));

      const employeeTeachers: Teacher[] = (teachersData || []).map((teacher: any) => ({
        id: teacher.id,
        teacher_nickname: teacher.teacher_nickname || teacher.teacher_fullname || null,
        teacher_fullname: teacher.teacher_fullname || null,
        user_email: null,
        role: 'employee',
      }));

      const mergedTeachersMap = new Map<string, Teacher>();
      [...memberTeachers, ...employeeTeachers].forEach((teacher) => {
        if (!teacher.id) return;
        if (!mergedTeachersMap.has(teacher.id)) {
          mergedTeachersMap.set(teacher.id, teacher);
        }
      });

      const mergedTeachers = Array.from(mergedTeachersMap.values()).sort((a, b) =>
        formatTeacherDisplay(a).localeCompare(formatTeacherDisplay(b), 'zh-Hant')
      );
      setTeachers(mergedTeachers);

      const teacherDisplayMap = new Map<string, string>();
      mergedTeachers.forEach((teacher) => {
        if (teacher.id) {
          teacherDisplayMap.set(teacher.id, formatTeacherDisplay(teacher));
        }
      });

      const courseTypesMap: { [id: string]: string } = {};
      normalizedCourseTypes.forEach((courseType) => {
        courseTypesMap[courseType.id] = courseType.name || '未知課程';
      });

      const courseCodesWithMeta = (courseCodesData || []).map((course: any) => ({
        ...course,
        max_students: course.max_students || 8,
        course_type_name: courseTypesMap[course.course_type_id] || '未知課程',
        teacher_name: course.teacher_id ? teacherDisplayMap.get(course.teacher_id) || null : null,
      }));

      console.log('[MultiCourseScheduleManagementPanel] 準備設置 courseCodes，數量:', courseCodesWithMeta.length);
      setCourseCodes(courseCodesWithMeta);
      setLoadError(null);
      console.log('[MultiCourseScheduleManagementPanel] 數據載入完成');
    } catch (error: any) {
      console.error('[MultiCourseScheduleManagementPanel] 載入數據時發生錯誤：', error);
      console.error('[MultiCourseScheduleManagementPanel] 錯誤詳情：', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      setLoadError(`載入資料時發生錯誤：${error?.message || '未知錯誤'}`);
    } finally {
      console.log('[MultiCourseScheduleManagementPanel] 進入 finally 塊，設置 loading 為 false');
      setLoading(false);
      console.log('[MultiCourseScheduleManagementPanel] loading 已設置為 false');
    }
  }, [hasValidOrg, validOrgId]);

  useEffect(() => {
    // 只在客戶端掛載後才執行 fetchData，避免 hydration mismatch
    if (!isMounted) {
      return;
    }
    console.log('[MultiCourseScheduleManagementPanel] useEffect 觸發，調用 fetchData', {
      hasValidOrg,
      validOrgId,
      loading,
      isMounted
    });
    fetchData();
  }, [fetchData, isMounted]);
  
  // 額外檢查：如果沒有有效組織且 loading 為 true，確保設置為 false
  useEffect(() => {
    if (isMounted && !hasValidOrg && loading) {
      console.log('[MultiCourseScheduleManagementPanel] 額外檢查：沒有有效組織但 loading 為 true，設置為 false');
      setLoading(false);
    }
  }, [isMounted, hasValidOrg, loading]);

  const handleAddSlot = async () => {
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再新增課堂時段');
      return;
    }
    try {
      // 驗證必要欄位
      if (newSlot.weekday === undefined || newSlot.weekday === null || !newSlot.timeslot) {
        console.log('新增時段驗證失敗：', { weekday: newSlot.weekday, timeslot: newSlot.timeslot });
        alert('請填寫星期和時間');
        return;
      }

      // 如果提供了 course_code，確保它是有效的
      if (newSlot.course_code && newSlot.course_code.trim() !== '') {
        const validCourseCodes = courseCodes.map(c => c.course_code);
        if (!validCourseCodes.includes(newSlot.course_code)) {
          alert('請選擇有效的課程代碼，或留空以不指定課程');
          return;
        }
      }

      console.log('開始新增時段...', newSlot);
      
      // 準備插入數據，將空字符串轉換為 null
      const insertData = {
        ...newSlot,
        org_id: validOrgId,
        course_code: newSlot.course_code && newSlot.course_code.trim() !== '' ? newSlot.course_code : null,
        assigned_teachers: newSlot.assigned_teachers && newSlot.assigned_teachers.trim() !== '' ? newSlot.assigned_teachers : null,
        room_id: newSlot.room_id && newSlot.room_id.trim() !== '' ? newSlot.room_id : null,
      };

      console.log('準備插入的數據：', insertData);
      
      // hanami_schedule table type may not be fully defined
      const { error } = await ((supabase as any)
        .from('hanami_schedule')
        .insert([insertData]));

      console.log('新增時段結果：', { error });

      if (error) {
        console.error('新增時段失敗：', error);
        alert('新增時段失敗：' + error.message);
        return;
      }

      setShowAddSlot(false);
      setNewSlot({
        weekday: 1,
        timeslot: '09:00:00',
        max_students: 10,
        assigned_teachers: '',
        course_code: '',
        course_section: 'A',
        room_id: '',
        duration: '01:00:00',
        is_primary_schedule: true,
      });
      fetchData();
    } catch (error) {
      console.error('新增時段時發生錯誤：', error);
      alert('新增時段時發生錯誤');
    }
  };

  const handleEditSlot = async () => {
    if (!hasValidOrg || !editSlot.id) {
      alert('請先創建屬於您的機構後再編輯課堂時段');
      return;
    }
    try {
      // 驗證必要欄位
      if (editSlot.weekday === undefined || editSlot.weekday === null || !editSlot.timeslot) {
        console.log('編輯時段驗證失敗：', { weekday: editSlot.weekday, timeslot: editSlot.timeslot });
        alert('請填寫星期和時間');
        return;
      }

      // 如果提供了 course_code，確保它是有效的
      if (editSlot.course_code && editSlot.course_code.trim() !== '') {
        const validCourseCodes = courseCodes.map(c => c.course_code);
        if (!validCourseCodes.includes(editSlot.course_code)) {
          alert('請選擇有效的課程代碼，或留空以不指定課程');
          return;
        }
      }

      console.log('開始更新時段...', editSlot);
      console.log('編輯時段詳細數據：', {
        weekday: editSlot.weekday,
        weekdayType: typeof editSlot.weekday,
        timeslot: editSlot.timeslot,
        timeslotType: typeof editSlot.timeslot,
        id: editSlot.id
      });
      
      // 準備更新數據，將空字符串轉換為 null
      const updateData = {
        ...editSlot,
        course_code: editSlot.course_code && editSlot.course_code.trim() !== '' ? editSlot.course_code : null,
        assigned_teachers: editSlot.assigned_teachers && editSlot.assigned_teachers.trim() !== '' ? editSlot.assigned_teachers : null,
        room_id: editSlot.room_id && editSlot.room_id.trim() !== '' ? editSlot.room_id : null,
        course_type: editSlot.course_type && editSlot.course_type.trim() !== '' ? editSlot.course_type : null,
      };

      console.log('準備更新的數據：', updateData);
      
      // hanami_schedule table type may not be fully defined
      const { error } = await ((supabase as any)
        .from('hanami_schedule')
        .update(updateData)
        .eq('id', editSlot.id)
        .eq('org_id', validOrgId as string));

      console.log('更新時段結果：', { error });

      if (error) {
        console.error('更新時段失敗：', error);
        alert('更新時段失敗：' + error.message);
        return;
      }

      setShowEditSlot(false);
      setEditSlot({});
      fetchData();
    } catch (error) {
      console.error('更新時段時發生錯誤：', error);
      alert('更新時段時發生錯誤');
    }
  };

  // 載入時段的學生數據
  const loadSlotStudents = async (slot: ScheduleSlot) => {
    if (!validOrgId || slot.weekday === null || slot.weekday === undefined || !slot.timeslot) {
      console.warn('無法載入學生數據：缺少必要信息', { validOrgId, weekday: slot.weekday, timeslot: slot.timeslot });
      return;
    }

    try {
      // 轉換 weekday: hanami_schedule 使用 1-7 (週一到週日)，Hanami_Students 使用 0-6 (週日到週六)
      // 需要將 hanami_schedule 的 weekday 轉換為 Hanami_Students 的格式
      // hanami_schedule: 1=週一, 2=週二, ..., 7=週日
      // Hanami_Students: 0=週日, 1=週一, 2=週二, ..., 6=週六
      const studentWeekday = slot.weekday === 7 ? 0 : slot.weekday;

      console.log('載入時段學生數據:', {
        scheduleWeekday: slot.weekday,
        studentWeekday: studentWeekday,
        timeslot: slot.timeslot,
        orgId: validOrgId
      });

      // 查詢常規學生：根據 regular_weekday 和 regular_timeslot 匹配
      const { data: regularStudents, error: regularError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, student_age, org_id, regular_weekday, regular_timeslot')
        .eq('org_id', validOrgId)
        .eq('regular_weekday', studentWeekday)
        .eq('regular_timeslot', slot.timeslot)
        .not('student_type', 'eq', 'inactive');

      if (regularError) {
        console.error('載入常規學生失敗:', regularError);
      }

      // 查詢試堂學生：根據 weekday 和 actual_timeslot 匹配
      // 注意：試堂學生可能沒有 regular_weekday，需要查詢所有匹配該時段的試堂學生
      const { data: trialStudents, error: trialError } = await supabase
        .from('hanami_trial_students')
        .select('id, full_name, student_age, org_id, weekday, actual_timeslot')
        .eq('org_id', validOrgId)
        .eq('weekday', slot.weekday.toString())
        .eq('actual_timeslot', slot.timeslot);

      if (trialError) {
        console.error('載入試堂學生失敗:', trialError);
      }

      // 更新 slot 對象，添加學生數據
      const assignedStudentIds = (regularStudents || [])
        .map((student: any) => student.id)
        .filter((id: string | null): id is string => Boolean(id));
      
      const trialStudentIds = (trialStudents || [])
        .map((student: any) => student.id)
        .filter((id: string | null): id is string => Boolean(id));

      // 更新 selectedSlotDetail
      setSelectedSlotDetail({
        ...slot,
        assigned_student_ids: assignedStudentIds,
        trial_student_ids: trialStudentIds,
        students: regularStudents || [],
        trial_students: trialStudents || []
      });

      console.log('學生數據載入完成:', {
        assignedStudentIds: assignedStudentIds.length,
        trialStudentIds: trialStudentIds.length,
        regularStudents: (regularStudents || []).length,
        trialStudents: (trialStudents || []).length
      });
    } catch (error) {
      console.error('載入時段學生數據時發生錯誤:', error);
    }
  };

  const handleDeleteSlots = async () => {
    if (selectedSlots.length === 0) return;
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再刪除課堂時段');
      return;
    }

    if (!confirm(`確定要刪除選中的 ${selectedSlots.length} 個時段嗎？`)) {
      return;
    }

    try {
      console.log('開始刪除時段...', selectedSlots);
      const { error } = await supabase
        .from('hanami_schedule')
        .delete()
        .in('id', selectedSlots)
        .eq('org_id', validOrgId as string);

      console.log('刪除時段結果：', { error });

      if (error) {
        console.error('刪除時段失敗：', error);
        alert('刪除時段失敗：' + error.message);
        return;
      }

      setSelectedSlots([]);
      setSelectAll(false);
      fetchData();
    } catch (error) {
      console.error('刪除時段時發生錯誤：', error);
      alert('刪除時段時發生錯誤');
    }
  };

  const handleAddCourseCode = async () => {
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再新增課程代碼');
      return;
    }
    try {
      // 驗證必要欄位
      if (!newCourseCode.course_code?.trim()) {
        alert('課程代碼不能為空');
        return;
      }
      
      if (!newCourseCode.course_name?.trim()) {
        alert('課程名稱不能為空');
        return;
      }
      
      if (!newCourseCode.max_students || newCourseCode.max_students <= 0) {
        alert('最大學生數必須大於 0');
        return;
      }

      console.log('開始新增課程代碼:', newCourseCode.course_code);
      console.log('新增資料:', newCourseCode);

      // 嘗試移除外鍵約束（如果存在）
      try {
        // 使用 Supabase 的 SQL 功能
        const { error: sqlError } = await supabase
          .from('hanami_course_codes')
          .select('id')
          .eq('org_id', validOrgId as string)
          .limit(1);
        
        if (!sqlError) {
          // 如果查詢成功，嘗試執行 DDL
          console.log('嘗試移除外鍵約束...');
          // 注意：Supabase 客戶端可能不支援 DDL，這裡只是嘗試
          console.log('外鍵約束處理完成');
        }
      } catch (error) {
        console.log('處理外鍵約束時發生錯誤:', error);
      }

      // 直接記錄選擇的 ID（教師或管理員）
      const validTeacherId = newCourseCode.teacher_id || null;
      console.log('記錄教師/管理員 ID:', validTeacherId);

      // hanami_course_codes table type may not be fully defined
      const { error } = await ((supabase as any)
        .from('hanami_course_codes')
        .insert([{
          ...newCourseCode,
          org_id: validOrgId,
          course_description: newCourseCode.course_description || null,
          teacher_id: validTeacherId,
          room_location: newCourseCode.room_location || null,
          course_type_id: newCourseCode.course_type_id || null,
        }]));

      if (error) {
        console.error('新增課程代碼失敗：', error);
        console.error('錯誤詳情：', JSON.stringify(error, null, 2));
        alert('新增課程代碼失敗：' + error.message);
        return;
      }

      console.log('新增操作完成，開始驗證新增結果...');
      
      // 使用驗證查詢來確認新增是否成功
      const { data: verifyData, error: verifyError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name, course_description, max_students, teacher_id, room_location, is_active, course_type_id, created_at')
        .eq('course_code', newCourseCode.course_code)
        .eq('org_id', validOrgId as string)
        .single();
      
      if (verifyError) {
        console.error('驗證新增失敗：', verifyError);
        alert('新增可能成功，但無法驗證。請重新載入頁面查看結果。');
        return;
      }

      console.log('驗證成功，新增確實生效：', verifyData);
      toast.success('課程代碼建立成功');

      setShowAddCourseCode(false);
      setShowAddTeacherSelect(false);
      setShowAddCourseTypeSelect(false);
      setNewCourseCode({
        course_code: '',
        course_name: '',
        course_description: '',
        max_students: 8,
        teacher_id: '',
        room_location: '',
        is_active: true,
        course_type_id: '',
      });
      fetchData();
    } catch (error) {
      console.error('新增課程代碼時發生錯誤：', error);
      alert('新增課程代碼時發生錯誤：' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  };

  const handleEditCourseCode = async () => {
    if (!hasValidOrg || !editingCourseCode) {
      alert('請先創建屬於您的機構後再編輯課程代碼');
      return;
    }

    try {
      // 驗證必要欄位
      if (!editingCourseCode.course_name?.trim()) {
        alert('課程名稱不能為空');
        return;
      }
      
      if (!editingCourseCode.max_students || editingCourseCode.max_students <= 0) {
        alert('最大學生數必須大於 0');
        return;
      }

      console.log('開始更新課程代碼:', editingCourseCode.course_code);
      console.log('完整的 editingCourseCode 物件:', editingCourseCode);
      console.log('更新資料:', {
        course_name: editingCourseCode.course_name,
        course_description: editingCourseCode.course_description,
        max_students: editingCourseCode.max_students,
        teacher_id: editingCourseCode.teacher_id,
        room_location: editingCourseCode.room_location,
        is_active: editingCourseCode.is_active,
        course_type_id: editingCourseCode.course_type_id,
        updated_at: new Date().toISOString()
      });

      // 先檢查記錄是否存在
      const { data: existingDataRaw, error: checkError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name')
        .eq('id', editingCourseCode.id)
        .eq('org_id', validOrgId as string)
        .single();
      
      const existingData = existingDataRaw as { id: string; course_code: string; course_name: string; [key: string]: any; } | null;

      if (checkError) {
        console.error('檢查記錄存在性失敗：', checkError);
        alert('無法找到要更新的記錄：' + checkError.message);
        return;
      }

      if (!existingData) {
        console.error('記錄不存在');
        alert('要更新的記錄不存在');
        return;
      }

      console.log('找到記錄：', existingData);
      console.log('比較課程名稱：');
      console.log('  - 表單中的課程名稱:', editingCourseCode.course_name);
      console.log('  - 資料庫中的課程名稱:', existingData.course_name);
      console.log('  - 是否相同:', editingCourseCode.course_name === existingData.course_name);
      
      // 檢查是否有實際的變更 - 需要先獲取完整的資料庫記錄
      const { data: fullExistingDataRaw, error: fullDataError } = await supabase
        .from('hanami_course_codes')
        .select('*')
        .eq('id', editingCourseCode.id)
        .eq('org_id', validOrgId as string)
        .single();
      
      const fullExistingData = fullExistingDataRaw as { course_name: string; course_description: string | null; max_students: number | null; teacher_id: string | null; room_location: string | null; is_active: boolean | null; course_type_id: string | null; [key: string]: any; } | null;

      if (fullDataError || !fullExistingData) {
        console.error('無法獲取完整的資料庫記錄：', fullDataError);
        alert('無法獲取完整的課程資料，請重新載入頁面後再試。');
        return;
      }

      console.log('完整的資料庫記錄：', fullExistingData);
      
      // 詳細比較每個欄位
      console.log('詳細欄位比較：');
      console.log('  - course_name:', editingCourseCode.course_name, 'vs', fullExistingData.course_name, '=', editingCourseCode.course_name !== fullExistingData.course_name);
      console.log('  - course_description:', editingCourseCode.course_description, 'vs', (fullExistingData.course_description || ''), '=', editingCourseCode.course_description !== (fullExistingData.course_description || ''));
      console.log('  - max_students:', editingCourseCode.max_students, 'vs', (fullExistingData.max_students || 8), '=', editingCourseCode.max_students !== (fullExistingData.max_students || 8));
      console.log('  - teacher_id:', editingCourseCode.teacher_id, 'vs', (fullExistingData.teacher_id || ''), '=', editingCourseCode.teacher_id !== (fullExistingData.teacher_id || ''));
      console.log('  - room_location:', editingCourseCode.room_location, 'vs', (fullExistingData.room_location || ''), '=', editingCourseCode.room_location !== (fullExistingData.room_location || ''));
      console.log('  - is_active:', editingCourseCode.is_active, 'vs', (fullExistingData.is_active || true), '=', editingCourseCode.is_active !== (fullExistingData.is_active || true));
      console.log('  - course_type_id:', editingCourseCode.course_type_id, 'vs', (fullExistingData.course_type_id || ''), '=', editingCourseCode.course_type_id !== (fullExistingData.course_type_id || ''));
      
      // 正確的欄位比較邏輯
      const courseNameChanged = editingCourseCode.course_name !== fullExistingData.course_name;
      const courseDescriptionChanged = editingCourseCode.course_description !== (fullExistingData.course_description || '');
      const maxStudentsChanged = editingCourseCode.max_students !== (fullExistingData.max_students || 8);
      const teacherIdChanged = editingCourseCode.teacher_id !== (fullExistingData.teacher_id || '');
      const roomLocationChanged = editingCourseCode.room_location !== (fullExistingData.room_location || '');
      const isActiveChanged = editingCourseCode.is_active !== (fullExistingData.is_active || true);
      const courseTypeIdChanged = editingCourseCode.course_type_id !== (fullExistingData.course_type_id || '');
      
      const hasChanges = 
        courseNameChanged ||
        courseDescriptionChanged ||
        maxStudentsChanged ||
        teacherIdChanged ||
        roomLocationChanged ||
        isActiveChanged ||
        courseTypeIdChanged;
      
      console.log('是否有變更:', hasChanges);
      console.log('詳細變更檢測：');
      console.log('  - courseNameChanged:', courseNameChanged);
      console.log('  - courseDescriptionChanged:', courseDescriptionChanged);
      console.log('  - maxStudentsChanged:', maxStudentsChanged);
      console.log('  - teacherIdChanged:', teacherIdChanged);
      console.log('  - roomLocationChanged:', roomLocationChanged);
      console.log('  - isActiveChanged:', isActiveChanged);
      console.log('  - courseTypeIdChanged:', courseTypeIdChanged);
      
      if (!hasChanges) {
        alert('沒有檢測到任何變更，請修改課程信息後再儲存。');
        return;
      }

      // 嘗試移除外鍵約束（如果存在）
      try {
        // 使用 Supabase 的 SQL 功能
        const { error: sqlError } = await supabase
          .from('hanami_course_codes')
          .select('id')
          .eq('org_id', validOrgId as string)
          .limit(1);
        
        if (!sqlError) {
          // 如果查詢成功，嘗試執行 DDL
          console.log('嘗試移除外鍵約束...');
          // 注意：Supabase 客戶端可能不支援 DDL，這裡只是嘗試
          console.log('外鍵約束處理完成');
        }
      } catch (error) {
        console.log('處理外鍵約束時發生錯誤:', error);
      }

      // 直接記錄選擇的 ID（教師或管理員）
      const validTeacherId = editingCourseCode.teacher_id || null;
      console.log('記錄教師/管理員 ID:', validTeacherId);

      // 執行更新操作（不使用 .select()）
      const updateData = {
        course_name: editingCourseCode.course_name,
        course_description: editingCourseCode.course_description || null,
        max_students: editingCourseCode.max_students,
        teacher_id: validTeacherId,
        room_location: editingCourseCode.room_location || null,
        is_active: editingCourseCode.is_active,
        course_type_id: editingCourseCode.course_type_id || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('準備更新的資料:', updateData);
      
      // hanami_course_codes table type may not be fully defined
      const { error } = await ((supabase as any)
        .from('hanami_course_codes')
        .update(updateData)
        .eq('id', editingCourseCode.id)
        .eq('org_id', validOrgId as string));

      if (error) {
        console.error('更新課程代碼失敗：', error);
        console.error('錯誤詳情：', JSON.stringify(error, null, 2));
        alert('更新課程代碼失敗：' + error.message);
        return;
      }

      console.log('更新操作完成，開始驗證更新結果...');
      
      // 使用驗證查詢來確認更新是否成功
      const { data: verifyDataRaw, error: verifyError } = await supabase
        .from('hanami_course_codes')
        .select('*')
        .eq('id', editingCourseCode.id)
        .maybeSingle();
      
      const verifyData = verifyDataRaw as { course_name: string; course_description: string | null; [key: string]: any; } | null;
      
      if (verifyError) {
        console.error('驗證更新結果失敗：', verifyError);
        alert('更新成功，但驗證結果失敗');
      } else if (verifyData) {
      console.log('驗證成功，更新確實生效：', verifyData);
      
      const actualChanges = [];
      if (verifyData.course_name !== fullExistingData.course_name) {
        actualChanges.push(`課程名稱: ${fullExistingData.course_name} → ${verifyData.course_name}`);
      }
      if (verifyData.course_description !== (fullExistingData.course_description || '')) {
        actualChanges.push(`課程描述: ${fullExistingData.course_description || '空'} → ${verifyData.course_description || '空'}`);
      }
      if (verifyData.max_students !== (fullExistingData.max_students || 8)) {
        actualChanges.push(`最大學生數: ${fullExistingData.max_students || 8} → ${verifyData.max_students}`);
      }
      if (verifyData.room_location !== (fullExistingData.room_location || '')) {
        actualChanges.push(`教室位置: ${fullExistingData.room_location || '空'} → ${verifyData.room_location || '空'}`);
      }
      if (verifyData.teacher_id !== (fullExistingData.teacher_id || '')) {
        actualChanges.push(`教師: ${fullExistingData.teacher_id || '空'} → ${verifyData.teacher_id || '空'}`);
      }
      
        toast.success(actualChanges.length > 0 ? `課程代碼已更新` : `課程代碼資料已同步`);
      }
      
      setShowEditCourseCode(false);
      setEditingCourseCode(null);
      fetchData();
    } catch (error) {
      console.error('更新課程代碼時發生錯誤：', error);
      alert('更新課程代碼時發生錯誤：' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  };

  const handleDeleteCourseCode = async (courseCodeId: string) => {
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再刪除課程代碼');
      return;
    }
    if (!confirm('確定要刪除這個課程代碼嗎？刪除後將無法恢復。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('hanami_course_codes')
        .delete()
        .eq('id', courseCodeId)
        .eq('org_id', validOrgId as string);

      if (error) {
        console.error('刪除課程代碼失敗：', error);
        alert('刪除課程代碼失敗：' + error.message);
        return;
      }

      fetchData();
    } catch (error) {
      console.error('刪除課程代碼時發生錯誤：', error);
      alert('刪除課程代碼時發生錯誤');
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSlots([]);
    } else {
      setSelectedSlots(scheduleSlots.map(slot => slot.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectSlot = (slotId: string) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter(id => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const getCourseCodeInfo = (courseCode: string) => {
    return courseCodes.find(code => code.course_code === courseCode);
  };

  const getTeacherInfo = (teacherId: string) => {
    return teachers.find(teacher => teacher.id === teacherId);
  };

  const formatTeacherDisplay = (teacher?: Teacher | null) => {
    if (!teacher) {
      return '未分配';
    }
    return buildTeacherDisplayName({
      nickname: teacher.teacher_nickname,
      fullname: teacher.teacher_fullname,
      userFullName: teacher.user_full_name,
      email: teacher.user_email,
    });
  };

  const getTeacherLabel = (teacherId?: string | null, fallback?: string | null) => {
    if (!teacherId) {
      return fallback || '未分配';
    }
    const teacher = getTeacherInfo(teacherId);
    if (teacher) {
      return formatTeacherDisplay(teacher);
    }
    return fallback || teacherId || '未分配';
  };

  const getCourseTypeLabel = (courseType?: CourseType | null) => {
    return courseType?.name || '未命名課程';
  };

  const resetCourseTypeForm = () => {
    setCourseTypeForm({
      name: '',
      status: true,
      min_age: null,
      max_age: null,
      duration_minutes: 45,
      max_students: 6,
      difficulty_level: 'beginner',
      pricing_model: 'monthly',
      price_per_lesson: null,
      currency: 'HKD',
      is_pricing_enabled: true,
      trial_limit: 1,
      description: '',
      color_code: 'from-pink-400 to-rose-400',
      icon_type: 'sparkles',
      display_order: courseTypes.length,
      discount_configs: {
        packages: [],
        trialBundles: [],
      },
    });
    setCourseTypeImages([]);
    setInitialCourseTypeImages([]);
    setImageUploadProgress({});
  };

  const openCreateCourseTypeModal = () => {
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再新增課程類型');
      return;
    }
    setEditingCourseType(null);
    resetCourseTypeForm();
    // 新增模式下，初始圖片為空數組，所有上傳的圖片都是新圖片
    setInitialCourseTypeImages([]);
    setShowCourseTypeModal(true);
  };

  const openEditCourseTypeModal = (courseType: CourseType) => {
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再編輯課程類型');
      return;
    }
    setEditingCourseType(courseType);
    setCourseTypeForm({
      name: courseType.name || '',
      status: courseType.status ?? true,
      min_age: courseType.min_age,
      max_age: courseType.max_age,
      duration_minutes: courseType.duration_minutes ?? 45,
      max_students: courseType.max_students ?? 6,
      difficulty_level: courseType.difficulty_level || 'beginner',
      pricing_model: courseType.pricing_model || 'monthly',
      price_per_lesson: courseType.price_per_lesson,
      currency: courseType.currency || 'HKD',
      is_pricing_enabled: courseType.is_pricing_enabled ?? true,
      trial_limit: courseType.trial_limit ?? 1,
      description: courseType.description || '',
      color_code: courseType.color_code || 'from-pink-400 to-rose-400',
      icon_type: courseType.icon_type || 'sparkles',
      display_order: courseType.display_order ?? courseTypes.indexOf(courseType),
      discount_configs: {
        packages: courseType.discount_configs?.packages || [],
        trialBundles: courseType.discount_configs?.trialBundles || [],
      },
    });
    // 初始化圖片數組
    const images = (courseType as any).images || [];
    const imageArray = Array.isArray(images) ? images : [];
    setCourseTypeImages(imageArray);
    setInitialCourseTypeImages(imageArray); // 保存初始圖片，用於取消時比較
    setImageUploadProgress({});
    setShowCourseTypeModal(true);
  };

  const updateCourseTypeForm = (
    field: keyof CourseType | 'color_code' | 'icon_type' | 'display_order' | 'discount_configs',
    value: any,
  ) => {
    setCourseTypeForm((prev) => {
      if (field === 'discount_configs') {
        return {
          ...prev,
          discount_configs: value,
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleCourseTypeToggleStatus = async (courseType: CourseType) => {
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再更新課程類型狀態');
      return;
    }
    try {
      const nextStatus = !(courseType.status ?? true);
      // Hanami_CourseTypes table type may not be fully defined
      const { error } = await ((supabase as any)
        .from('Hanami_CourseTypes')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', courseType.id)
        .eq('org_id', validOrgId as string));
      if (error) {
        console.error('更新課程類型狀態失敗：', error);
        alert('更新課程類型狀態失敗：' + error.message);
        return;
      }
      await fetchData();
    } catch (error) {
      console.error('更新課程類型狀態時發生錯誤：', error);
      alert('更新課程類型狀態時發生錯誤');
    }
  };

  const updatePackageAt = (index: number, field: keyof CoursePackageConfig, value: any) => {
    const current = courseTypeForm.discount_configs || { packages: [], trialBundles: [] };
    const nextPackages = current.packages.slice();
    nextPackages[index] = {
      ...nextPackages[index],
      [field]: value,
    };
    updateCourseTypeForm('discount_configs', {
      ...current,
      packages: nextPackages,
    });
  };

  const addPackage = () => {
    const current = courseTypeForm.discount_configs || { packages: [], trialBundles: [] };
    const nextPackages = [
      ...current.packages,
      {
        id: crypto.randomUUID(),
        title: '新套票',
        lessons: 4,
        price: 0,
        description: '',
        is_active: true,
      },
    ];
    updateCourseTypeForm('discount_configs', {
      ...current,
      packages: nextPackages,
    });
  };

  const removePackage = (index: number) => {
    const current = courseTypeForm.discount_configs || { packages: [], trialBundles: [] };
    const nextPackages = current.packages.filter((_, i) => i !== index);
    updateCourseTypeForm('discount_configs', {
      ...current,
      packages: nextPackages,
    });
  };

  const updateTrialBundleAt = (index: number, field: keyof TrialBundleConfig, value: any) => {
    const current = courseTypeForm.discount_configs || { packages: [], trialBundles: [] };
    const nextBundles = current.trialBundles.slice();
    nextBundles[index] = {
      ...nextBundles[index],
      [field]: value,
    };
    updateCourseTypeForm('discount_configs', {
      ...current,
      trialBundles: nextBundles,
    });
  };

  const addTrialBundle = () => {
    const current = courseTypeForm.discount_configs || { packages: [], trialBundles: [] };
    const nextBundles = [
      ...current.trialBundles,
      {
        id: crypto.randomUUID(),
        title: '新試堂優惠',
        duration_minutes: 30,
        price: 0,
        note: '',
        is_active: true,
      },
    ];
    updateCourseTypeForm('discount_configs', {
      ...current,
      trialBundles: nextBundles,
    });
  };

  const removeTrialBundle = (index: number) => {
    const current = courseTypeForm.discount_configs || { packages: [], trialBundles: [] };
    const nextBundles = current.trialBundles.filter((_, i) => i !== index);
    updateCourseTypeForm('discount_configs', {
      ...current,
      trialBundles: nextBundles,
    });
  };

  // 圖片上傳處理函數
  const handleImageUpload = async (files: FileList | File[]) => {
    if (!hasValidOrg) {
      toast.error('請先創建屬於您的機構');
      return;
    }

    const fileArray = Array.from(files);
    const maxImages = 5;
    const currentImageCount = courseTypeImages.length;
    const remainingSlots = maxImages - currentImageCount;

    if (fileArray.length > remainingSlots) {
      toast.error(`最多只能上傳 ${maxImages} 張圖片，目前已有 ${currentImageCount} 張，還可上傳 ${remainingSlots} 張`);
      return;
    }

    // 驗證文件類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`不支援的檔案類型: ${file.name}。僅支援 JPEG, PNG, WebP, GIF`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`檔案大小超過限制: ${file.name}。最大 2MB`);
        continue;
      }
    }

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      const courseTypeId = editingCourseType?.id || crypto.randomUUID();
      const bucketName = 'course-types';

      for (const file of fileArray) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        const storagePath = `${validOrgId}/${courseTypeId}/${timestamp}_${random}.${fileExt}`;

        // 設置上傳進度
        setImageUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          console.error('圖片上傳失敗:', uploadError);
          toast.error(`上傳失敗: ${file.name}`);
          setImageUploadProgress((prev) => {
            const next = { ...prev };
            delete next[file.name];
            return next;
          });
          continue;
        }

        // 獲取公開 URL
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(storagePath);

        uploadedUrls.push(publicUrlData.publicUrl);
        setImageUploadProgress((prev) => {
          const next = { ...prev };
          delete next[file.name];
          return next;
        });
      }

      if (uploadedUrls.length > 0) {
        setCourseTypeImages((prev) => [...prev, ...uploadedUrls]);
        toast.success(`成功上傳 ${uploadedUrls.length} 張圖片`);
      }
    } catch (error: any) {
      console.error('圖片上傳錯誤:', error);
      toast.error('圖片上傳失敗，請稍後再試');
    } finally {
      setUploadingImages(false);
    }
  };

  // 圖片排序處理函數
  const handleImageReorder = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(courseTypeImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCourseTypeImages(items);
    toast.success('圖片順序已更新');
  };

  // 清理未保存的新上傳圖片
  const cleanupUnsavedImages = async () => {
    // 找出新上傳但未保存的圖片（在 courseTypeImages 中但不在 initialCourseTypeImages 中）
    const newUploadedImages = courseTypeImages.filter(
      (url) => !initialCourseTypeImages.includes(url)
    );

    if (newUploadedImages.length === 0) {
      return;
    }

    // 刪除這些新上傳的圖片
    const bucketName = 'course-types';
    const deletePromises = newUploadedImages.map(async (imageUrl) => {
      try {
        const urlParts = imageUrl.split('/');
        const publicIndex = urlParts.findIndex((part) => part === 'public');
        
        let storagePath = '';
        if (publicIndex !== -1 && publicIndex < urlParts.length - 1) {
          const pathStartIndex = publicIndex + 2; // public + bucket name
          storagePath = urlParts.slice(pathStartIndex).join('/');
        } else {
          const objectIndex = urlParts.findIndex((part) => part === 'object');
          if (objectIndex !== -1 && objectIndex < urlParts.length - 1) {
            const pathStartIndex = objectIndex + 3; // object/public/bucket
            storagePath = urlParts.slice(pathStartIndex).join('/');
          }
        }

        if (storagePath) {
          const { error } = await supabase.storage
            .from(bucketName)
            .remove([storagePath]);

          if (error) {
            console.error('清理未保存圖片失敗:', imageUrl, error);
          }
        }
      } catch (error) {
        console.error('清理未保存圖片時發生錯誤:', imageUrl, error);
      }
    });

    await Promise.all(deletePromises);
  };

  // 圖片刪除處理函數
  const handleImageDelete = async (imageUrl: string, index: number) => {
    try {
      // 從 Storage 中刪除圖片（需要從 URL 中提取路徑）
      // Supabase Storage 公開 URL 格式通常是: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
      const urlParts = imageUrl.split('/');
      const bucketName = 'course-types';
      
      // 查找 'object' 或 'public' 之後的路徑
      const objectIndex = urlParts.findIndex((part) => part === 'object');
      const publicIndex = urlParts.findIndex((part) => part === 'public');
      
      let storagePath = '';
      if (publicIndex !== -1 && publicIndex < urlParts.length - 1) {
        // 跳過 'public' 和 bucket 名稱，獲取實際路徑
        const pathStartIndex = publicIndex + 2; // public + bucket name
        storagePath = urlParts.slice(pathStartIndex).join('/');
      } else if (objectIndex !== -1 && objectIndex < urlParts.length - 1) {
        // 備用方案：從 object 之後提取
        const pathStartIndex = objectIndex + 3; // object/public/bucket
        storagePath = urlParts.slice(pathStartIndex).join('/');
      } else {
        // 如果無法解析 URL，嘗試直接使用 URL 的最後部分作為路徑
        // 這適用於已經包含完整路徑的情況
        const lastSlashIndex = imageUrl.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          const possiblePath = imageUrl.substring(lastSlashIndex + 1);
          // 檢查是否包含 org_id 和 course_type_id（格式：org_id/course_type_id/filename）
          if (possiblePath.includes('/')) {
            storagePath = possiblePath;
          }
        }
      }

      if (storagePath) {
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([storagePath]);

        if (error) {
          console.error('刪除圖片失敗:', error);
          // 即使刪除失敗，也從 UI 中移除（因為可能已經被刪除或路徑不正確）
        }
      }

      // 從狀態中移除
      setCourseTypeImages((prev) => prev.filter((_, i) => i !== index));
      toast.success('圖片已刪除');
    } catch (error: any) {
      console.error('刪除圖片錯誤:', error);
      // 即使出錯，也從 UI 中移除
      setCourseTypeImages((prev) => prev.filter((_, i) => i !== index));
      toast.error('刪除圖片失敗，但已從列表中移除');
    }
  };

  const handleSaveCourseType = async () => {
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再新增課程類型');
      return;
    }

    const trimmedName = (courseTypeForm.name || '').trim();
    if (!trimmedName) {
      alert('請輸入課程類型名稱');
      return;
    }

    setCourseTypeSaving(true);
    try {
      const payload = {
        name: trimmedName,
        status: courseTypeForm.status ?? true,
        min_age: courseTypeForm.min_age ?? null,
        max_age: courseTypeForm.max_age ?? null,
        duration_minutes: courseTypeForm.duration_minutes ?? null,
        max_students: courseTypeForm.max_students ?? null,
        difficulty_level: courseTypeForm.difficulty_level || 'beginner',
        pricing_model: courseTypeForm.pricing_model || 'monthly',
        price_per_lesson: courseTypeForm.price_per_lesson ?? null,
        currency: courseTypeForm.currency || 'HKD',
        is_pricing_enabled: courseTypeForm.is_pricing_enabled ?? true,
        trial_limit: courseTypeForm.trial_limit ?? 1,
        description: courseTypeForm.description ?? null,
        color_code: (courseTypeForm as any).color_code ?? 'from-pink-400 to-rose-400',
        icon_type: (courseTypeForm as any).icon_type ?? 'sparkles',
        display_order: (courseTypeForm as any).display_order ?? 0,
        discount_configs: (courseTypeForm.discount_configs ?? {
          packages: [],
          trialBundles: [],
        }) as CourseTypeDiscountConfigs,
        images: courseTypeImages,
        updated_at: new Date().toISOString(),
      };

      if (editingCourseType) {
        // Hanami_CourseTypes table type may not be fully defined
        const { error } = await ((supabase as any)
          .from('Hanami_CourseTypes')
          .update(payload)
          .eq('id', editingCourseType.id)
          .eq('org_id', validOrgId as string));

        if (error) {
          console.error('更新課程類型失敗：', error);
          alert('更新課程類型失敗：' + error.message);
          return;
        }
      } else {
        // Hanami_CourseTypes table type may not be fully defined
        const { error } = await ((supabase as any)
          .from('Hanami_CourseTypes')
          .insert([{ ...payload, org_id: validOrgId }]));

        if (error) {
          console.error('新增課程類型失敗：', error);
          alert('新增課程類型失敗：' + error.message);
          return;
        }
      }

      await fetchData();
      // 保存成功後，更新初始圖片為當前圖片，這樣取消時不會刪除已保存的圖片
      setInitialCourseTypeImages(courseTypeImages);
      setShowCourseTypeModal(false);
      setEditingCourseType(null);
      resetCourseTypeForm();
    } catch (error) {
      console.error('儲存課程類型時發生錯誤：', error);
      alert('儲存課程類型時發生錯誤');
    } finally {
      setCourseTypeSaving(false);
    }
  };

  if (!hasValidOrg) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl border-2 border-[#EADBC8] px-8 py-6 shadow-xl">
            <p className="text-[#4B4036] font-medium">請先創建屬於您的機構，並建立課程與課堂資料。</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 載入中時顯示載入狀態
  // 使用 suppressHydrationWarning 來避免 hydration 錯誤
  // 因為 loading 狀態在服務器端和客戶端可能不同
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" suppressHydrationWarning>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-[#FFD59A] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-[#2B3A3B] font-medium">載入中...</p>
        </motion.div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl border-2 border-[#EADBC8] px-8 py-6 text-center shadow-xl"
        >
          <p className="text-sm text-[#4B4036] mb-4">{loadError}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all"
            onClick={fetchData}
          >
            重新嘗試載入
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 課程類型管理區塊 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl border-2 border-[#EADBC8] mb-6"
      >
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#D48347] mb-2">Step 1 · 課程類型</h2>
          <p className="text-sm text-[#2B3A3B] leading-relaxed">
            先建立課程類型，定義年齡層、課堂時長與優惠套票。這些設定會被後續的課程代碼引用，確保所有班別遵循同一套課程規格。
          </p>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#4B4036] flex items-center gap-2">
            <Image alt="課程類型" height={24} src="/icons/music.PNG" width={24} />
            課程類型管理
          </h3>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-sm font-medium text-[#4B4036] shadow-sm hover:bg-white transition-all"
              onClick={() => setShowCourseTypeManagement(!showCourseTypeManagement)}
            >
              {showCourseTypeManagement ? '收起管理' : '展開管理'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all"
              onClick={openCreateCourseTypeModal}
            >
              新增課程類型
            </motion.button>
          </div>
        </div>

        {showCourseTypeManagement && (
          <div className="space-y-4">
            {courseTypes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-gradient-to-br from-white/50 to-white/30 rounded-2xl border-2 border-dashed border-[#EADBC8]"
              >
                <p className="text-[#4B4036] font-medium mb-2">尚未建立任何課程類型</p>
                <p className="text-sm text-[#2B3A3B]">建立課程後，可於課程代碼與時間表中快速引用。</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseTypes.map((courseType) => {
                  const active = courseType.status ?? true;
                  const packages = courseType.discount_configs?.packages || [];
                  const trialBundles = courseType.discount_configs?.trialBundles || [];
                  const ageRangeLabel =
                    courseType.min_age !== null && courseType.max_age !== null
                      ? `${courseType.min_age} - ${courseType.max_age} 歲`
                      : '未設定年齡';
                  const durationLabel = courseType.duration_minutes
                    ? `${courseType.duration_minutes} 分鐘`
                    : '未設定時長';

                  return (
                    <motion.div
                      key={courseType.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-lg border-2 border-[#EADBC8] hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-bold text-[#4B4036] text-lg mb-1">
                            {courseType.name || '未命名課程類型'}
                          </div>
                          <div className="text-xs text-[#2B3A3B] mt-1">
                            難度：{courseType.difficulty_level || '未設定'} | 試堂上限：{courseType.trial_limit ?? '未設定'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              active 
                                ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200' 
                                : 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {active ? '啟用中' : '已停用'}
                          </motion.span>
                        </div>
                      </div>
                      <div className="text-sm text-[#4B4036] space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[#2B3A3B]">建議年齡：</span>
                          <span className="font-medium">{ageRangeLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#2B3A3B]">課堂時長：</span>
                          <span className="font-medium">{durationLabel}</span>
                          <span className="text-[#2B3A3B]">| 容量：</span>
                          <span className="font-medium">{courseType.max_students ?? '未設定'} 人</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#2B3A3B]">定價模式：</span>
                          <span className="font-medium">{courseType.pricing_model || '未設定'}{courseType.price_per_lesson ? `（每堂 ${courseType.price_per_lesson} ${courseType.currency || 'HKD'}）` : ''}</span>
                        </div>
                        <div className="text-xs text-[#A68A64] bg-gradient-to-r from-[#FFD59A]/20 to-[#EBC9A4]/20 rounded-lg px-3 py-2">
                          套票 {packages.length} 項 | 試堂優惠 {trialBundles.length} 項
                        </div>
                        <div className="text-xs text-[#2B3A3B] bg-white/50 rounded-lg px-3 py-2">
                          {courseType.description || '尚未填寫課程描述'}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-[#EADBC8]">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 px-3 py-2 bg-white/70 border border-[#EADBC8] text-[#4B4036] rounded-xl text-xs font-medium shadow-sm hover:bg-white transition-all flex items-center justify-center gap-1"
                          onClick={() => {
                            setPreviewingCourseType(courseType);
                            setShowPreviewModal(true);
                          }}
                          title="預覽課程"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span>預覽</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1 px-3 py-2 bg-white/70 border border-green-500 text-green-600 rounded-xl text-xs font-medium shadow-sm hover:bg-green-50 hover:border-green-600 transition-all"
                          onClick={() => openEditCourseTypeModal(courseType)}
                        >
                          編輯
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl text-xs font-medium shadow-sm hover:shadow-md transition-all"
                          onClick={() => handleCourseTypeToggleStatus(courseType)}
                        >
                          {active ? '停用' : '啟用'}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* 課程代碼管理區塊 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl border-2 border-[#EADBC8] mb-6"
      >
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#D48347] mb-2">Step 2 · 課程代碼</h2>
          <p className="text-sm text-[#2B3A3B] leading-relaxed">
            為不同課程類型建立班別與課程代碼，指定任教老師、教室與班別容量。課程代碼會在時間表建立中被選用，決定每個時段的詳細資訊。
          </p>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#4B4036] flex items-center gap-2">
            <Image alt="課程代碼" height={24} src="/icons/book-elephant.PNG" width={24} />
            課程代碼管理
          </h3>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-sm font-medium text-[#4B4036] shadow-sm hover:bg-white transition-all"
              onClick={() => setShowCourseCodeManagement(!showCourseCodeManagement)}
            >
              {showCourseCodeManagement ? '收起管理' : '展開管理'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowAddCourseCode(true)}
            >
              新增課程代碼
            </motion.button>
          </div>
        </div>

        {showCourseCodeManagement && (
          <div className="space-y-4">
            {courseCodes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-gradient-to-br from-white/50 to-white/30 rounded-2xl border-2 border-dashed border-[#EADBC8]"
              >
                <p className="text-[#4B4036] font-medium mb-2">沒有找到課程代碼數據</p>
                <p className="text-sm text-[#2B3A3B]">請檢查數據庫連接或添加新的課程代碼</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseCodes.map((courseCode, index) => (
                <motion.div
                  key={courseCode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-lg border-2 border-[#EADBC8] hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-[#4B4036] text-lg">{courseCode.course_code}</div>
                    <div className="flex items-center gap-2">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          courseCode.is_active 
                            ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200' 
                            : 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {courseCode.is_active ? '活躍' : '停用'}
                      </motion.span>
                    </div>
                  </div>
                  <div className="text-sm text-[#4B4036] mb-2 font-medium">{courseCode.course_name}</div>
                  <div className="text-xs text-[#2B3A3B] mb-3 bg-gradient-to-r from-[#FFD59A]/20 to-[#EBC9A4]/20 rounded-lg px-3 py-1 inline-block">
                    {courseCode.course_type_name}
                  </div>
                  <div className="text-sm text-[#2B3A3B] space-y-1 mb-4">
                    <div>容量: <span className="font-medium">{courseCode.max_students}人</span></div>
                    <div>教師: <span className="font-medium">{getTeacherLabel(courseCode.teacher_id, courseCode.teacher_name)}</span></div>
                    <div>教室: <span className="font-medium">{courseCode.room_location || '未設定'}</span></div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-[#EADBC8]">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 px-3 py-2 bg-white/70 border border-green-500 text-green-600 rounded-xl text-xs font-medium shadow-sm hover:bg-green-50 hover:border-green-600 transition-all"
                      onClick={() => {
                        setEditingCourseCode(courseCode);
                        setShowEditCourseCode(true);
                      }}
                      title="編輯課程代碼"
                    >
                      編輯
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-2 bg-white/70 border border-red-500 text-red-600 rounded-xl text-xs font-medium shadow-sm hover:bg-red-50 hover:border-red-600 transition-all"
                      onClick={() => handleDeleteCourseCode(courseCode.id)}
                      title="刪除課程代碼"
                    >
                      刪除
                    </motion.button>
                  </div>
                </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* 多課程時間表管理 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl border-2 border-[#EADBC8] mb-6"
      >
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[#D48347] mb-2">Step 3 · 多課程時間表</h2>
          <p className="text-sm text-[#2B3A3B] leading-relaxed">
            依據已設定的課程類型（Step 1）與課程代碼（Step 2），在這裡排出每週的授課時段。完成時間表後，老師與學生即可依時段進行課程，也能更清楚掌握教室使用與班別安排。
          </p>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#4B4036] flex items-center gap-2">
            <Image alt="時間表" height={24} src="/icons/clock.PNG" width={24} />
            多課程時間表管理
          </h3>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/70 border border-[#EADBC8] rounded-xl text-sm font-medium text-[#4B4036] shadow-sm hover:bg-white transition-all"
              onClick={() => setShowScheduleManagement(!showScheduleManagement)}
            >
              {showScheduleManagement ? '收起管理' : '展開管理'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all"
              onClick={() => setShowAddSlot(true)}
            >
              新增課堂時段
            </motion.button>
            {selectedSlots.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white/70 border border-red-500 text-red-600 rounded-xl text-sm font-medium shadow-sm hover:bg-red-50 hover:border-red-600 transition-all"
                onClick={handleDeleteSlots}
              >
                刪除選中 ({selectedSlots.length})
              </motion.button>
            )}
          </div>
        </div>

        {showScheduleManagement && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
              <p className="text-sm text-[#6E5A4A]">
                按星期與時間檢視所有課堂安排，隨時點擊進入詳情或調整班別設定。建議每個時段都對應一個課程代碼，確保教師、教室與學生資訊保持同步。
              </p>
        </div>

        {/* 時間表列表 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EADBC8]">
                <th className="text-left p-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-[#EADBC8]"
                  />
                </th>
                <th className="text-left p-3">
                  <button
                    onClick={() => handleSort('weekday')}
                    className="flex items-center gap-1 hover:text-[#A68A64]"
                  >
                    星期 {getSortIcon('weekday')}
                  </button>
                </th>
                <th className="text-left p-3">
                  <button
                    onClick={() => handleSort('timeslot')}
                    className="flex items-center gap-1 hover:text-[#A68A64]"
                  >
                    時間 {getSortIcon('timeslot')}
                  </button>
                </th>
                <th className="text-left p-3">課程代碼</th>
                <th className="text-left p-3">課程資訊</th>
                <th className="text-left p-3">班別</th>
                <th className="text-left p-3">容量</th>
                <th className="text-left p-3">教師</th>
                <th className="text-left p-3">教室</th>
                <th className="text-left p-3">操作</th>
              </tr>
            </thead>
            <tbody>
                  {scheduleSlots.length === 0 ? (
                    <tr>
                      <td className="p-6 text-center text-[#87704e]" colSpan={10}>
                        尚未建立課堂時段，點擊右上方「新增課堂時段」立即開始排課。
                      </td>
                    </tr>
                  ) : (
                    sortScheduleSlots(scheduleSlots).map((slot) => {
                const courseInfo = getCourseCodeInfo(slot.course_code || '');
                return (
                  <tr key={slot.id} className="border-b border-[#EADBC8] hover:bg-[#F3EFE3]">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedSlots.includes(slot.id)}
                        onChange={() => handleSelectSlot(slot.id)}
                        className="rounded border-[#EADBC8]"
                      />
                    </td>
                    <td className="p-3">
                      <span className="bg-[#A68A64] text-white px-2 py-1 rounded-full text-xs">
                        {weekdays[slot.weekday || 0]}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{slot.timeslot}</td>
                    <td className="p-3">
                      {slot.course_code ? (
                        <span className="bg-[#EBC9A4] text-[#4B4036] px-2 py-1 rounded-full text-xs">
                          {slot.course_code}
                        </span>
                      ) : (
                        <span className="text-[#87704e]">未設定</span>
                      )}
                    </td>
                    <td className="p-3">
                      {courseInfo ? (
                        <div>
                          <div className="font-medium text-[#4B4036]">{courseInfo.course_name}</div>
                          <div className="text-xs text-[#87704e]">({courseInfo.course_type_name})</div>
                        </div>
                      ) : (
                        <span className="text-[#87704e]">未知課程</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="bg-[#FFB6C1] text-[#4B4036] px-2 py-1 rounded-full text-xs">
                        {slot.course_section || 'A'}
                      </span>
                    </td>
                    <td className="p-3">{slot.max_students}人</td>
                    <td className="p-3">
                      {courseInfo?.teacher_id
                        ? getTeacherLabel(courseInfo.teacher_id, courseInfo.teacher_name)
                        : <span className="text-[#87704e]">未分配</span>}
                    </td>
                    <td className="p-3">
                      {courseInfo?.room_location || slot.room_id || (
                        <span className="text-[#87704e]">未設定</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="text-[#FFB6C1] hover:text-[#FF9BB3] text-sm transition-colors font-medium"
                          onClick={async () => {
                            // 載入該時段的學生數據
                            await loadSlotStudents(slot);
                            setSelectedSlotDetail(slot);
                            setShowSlotDetail(true);
                          }}
                        >
                          詳情
                        </button>
                        <button
                          className="text-[#A68A64] hover:text-[#8f7350] text-sm transition-colors"
                          onClick={() => {
                            console.log('點擊編輯按鈕，原始數據：', slot);
                            setEditSlot(slot);
                            setShowEditSlot(true);
                            console.log('設置編輯數據：', slot);
                          }}
                        >
                          編輯
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                    })
                  )}
            </tbody>
          </table>
        </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-dashed border-[#EADBC8] bg-[#FFF9F2] px-5 py-4 text-xs text-[#8A7C70]">
              <span className="font-semibold text-[#4B4036]">完整排課小提醒</span>
              <p>Step 1 · 課程類型管理 → Step 2 · 課程代碼管理 → Step 3 · 多課程時間表管理。依序建立，讓每個班級的課程、老師與時間都能清楚對應。</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* 新增時段模態框 */}
      {showAddSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-[#FFFDF7] shadow-[0_28px_80px_rgba(209,166,133,0.35)] ring-1 ring-[#F2E6D7]/80">
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-sm text-[#4B4036] shadow-sm transition hover:bg-[#FFF3E4]"
              onClick={() => setShowAddSlot(false)}
            >
              關閉
            </button>
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="relative flex flex-col gap-6 bg-gradient-to-br from-[#FFD6F0] via-[#FFE9D6] to-[#FAD5FF] px-6 py-8">
                <div className="absolute -top-12 right-2 h-48 w-48 rounded-full bg-white/25 blur-3xl" aria-hidden="true" />
                <div className="absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/75 shadow-lg">
                  <Image src="/icons/owl-clock.png" alt="新增課堂時段" width={40} height={40} className="drop-shadow" />
              </div>
                <div className="space-y-3 text-[#4B4036]">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                    Step 3 · 排課與時間表
                  </span>
                  <h3 className="text-2xl font-semibold leading-snug">
                    為班別安排固定授課時段，串連老師、教室與課程代碼。
                  </h3>
                  <p className="text-sm leading-relaxed text-[#604D3F]">
                    請先完成課程類型（Step 1）與課程代碼（Step 2），即可在此指定星期與時間，讓每堂課都對應到合適的老師與教室。
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-inner">
                  <span className="text-xs font-semibold text-[#8A7C70]">排課小提醒</span>
                  <ul className="mt-2 space-y-1 text-xs text-[#6E5A4A]">
                    <li>・ 一個時段對應一個課程代碼，維持班級資訊一致。</li>
                    <li>・ 建議依教室與老師可用時間安排，避免撞課。</li>
                    <li>・ 隨時可回來調整，保持時間表最新。</li>
                  </ul>
                </div>
            </div>
            
              <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
                <div className="space-y-5">
                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#4B4036]">時段設定</h4>
                      <span className="text-xs text-[#A68A64]">選擇星期與時間</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">星期 *</label>
                <button
                          className="flex w-full items-center justify-between rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                  onClick={() => setShowWeekdaySelect(true)}
                >
                  {weekdays[newSlot.weekday || 0]}
                          <span className="text-xs text-[#A68A64]">點擊選擇</span>
                </button>
              </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">時間 *</label>
                        <div className="rounded-2xl border border-[#F1E4D3] bg-[#FFFDF9] px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-[#F59BB5]/40">
                <TimePicker
                  value={newSlot.timeslot || '09:00:00'}
                            onChange={(time) => setNewSlot({ ...newSlot, timeslot: time })}
                />
              </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#4B4036]">班別與場地</h4>
                      <span className="text-xs text-[#A68A64]">連結對應的課程與教室</span>
                    </div>
                    <div className="space-y-4">
              <div>
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">課程代碼 *</label>
                <button
                          className="flex w-full items-center justify-between rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF8EC] via-[#FFEFF5] to-[#FFF7E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                  onClick={() => setShowCourseCodeSelect(true)}
                >
                  {getCourseCodeInfo(newSlot.course_code || '')?.course_name || '請選擇課程代碼'}
                          <span className="text-xs text-[#A68A64]">{newSlot.course_code ? '已選擇' : '建立班別後再選擇也可以'}</span>
                </button>
              </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                          <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">班別名稱</label>
                <input
                  type="text"
                  value={newSlot.course_section || 'A'}
                            onChange={(e) => setNewSlot({ ...newSlot, course_section: e.target.value })}
                            className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                            placeholder="例如：A班／幼幼班"
                />
              </div>
              <div>
                          <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">容量（人數）</label>
                <input
                  type="number"
                  value={newSlot.max_students || 10}
                            min={1}
                            onChange={(e) => setNewSlot({ ...newSlot, max_students: parseInt(e.target.value) || 1 })}
                            className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                />
              </div>
                      </div>
              <div>
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">教室／地點</label>
                <input
                  type="text"
                  value={newSlot.room_id || ''}
                          onChange={(e) => setNewSlot({ ...newSlot, room_id: e.target.value })}
                          className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                          placeholder="例如：教室 A／音樂廳"
                />
              </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#4B4036]">授課教師</h4>
                      <span className="text-xs text-[#A68A64]">指派老師掌握班級</span>
                    </div>
                    <div className="space-y-3">
                      <button
                        className="flex w-full items-center justify-between rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF8EC] via-[#FFEFF5] to-[#FFF7E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                        onClick={() => setShowTeacherSelect(true)}
                      >
                        <span>{getTeacherLabel(newSlot.assigned_teachers, '請選擇授課教師')}</span>
                        <span className="text-xs text-[#A68A64]">可從教師名單搜尋</span>
                      </button>
                      <p className="text-xs text-[#8A7C70]">
                        若還未建立教師資料，可先從「課程類型管理」與「課程代碼管理」完成設定，再回到此處指派。
                      </p>
                    </div>
                  </section>

                  <div className="flex flex-col gap-3 rounded-3xl border border-dashed border-[#EADBC8] bg-[#FFF9F2] px-5 py-4 text-xs text-[#8A7C70]">
                    <span className="font-semibold text-[#4B4036]">完成整體排課流程</span>
                    <p>Step 1 · 課程類型管理 → Step 2 · 課程代碼管理 → Step 3 · 多課程時間表管理。依序建立，讓每個班級都有完整資訊。</p>
              </div>
            </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                    className="flex-1 rounded-2xl bg-gradient-to-r from-[#F59BB5] via-[#FFD59A] to-[#F7C8D1] py-3 text-sm font-semibold text-[#4B4036] shadow-md transition hover:shadow-xl"
                onClick={handleAddSlot}
              >
                    新增課堂時段
              </button>
              <button
                    className="flex-1 rounded-2xl border border-[#EADBC8] bg-white/80 py-3 text-sm font-semibold text-[#8A7C70] shadow-sm transition hover:bg-[#FFF4DF]"
                onClick={() => setShowAddSlot(false)}
              >
                取消
              </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增課程代碼模態框 */}
      {showAddCourseCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-[#FFFDF7] shadow-[0_28px_80px_rgba(209,166,133,0.35)] ring-1 ring-[#F2E6D7]/80">
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-sm text-[#4B4036] shadow-sm transition hover:bg-[#FFF3E4]"
              onClick={() => setShowAddCourseCode(false)}
            >
              關閉
            </button>
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="relative flex flex-col gap-6 bg-gradient-to-br from-[#FFE8D4] via-[#FFD6F0] to-[#FAD5FF] px-6 py-8">
                <div className="absolute -top-12 right-2 h-48 w-48 rounded-full bg-white/25 blur-3xl" aria-hidden="true" />
                <div className="absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/75 shadow-lg">
                  <Image src="/icons/book-elephant.PNG" alt="新增課程代碼" width={38} height={38} className="drop-shadow" />
              </div>
                <div className="space-y-3 text-[#4B4036]">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                    Step 2 · 建立課程代碼
                  </span>
                  <h3 className="text-2xl font-semibold leading-snug">
                    快速建立班別與課程代碼，串連課程類型與教師時間表。
                  </h3>
                  <p className="text-sm leading-relaxed text-[#604D3F]">
                    選擇對應的課程類型與授課老師，輸入班別代碼與教室資訊，即可在時間表中安排課堂。
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-inner">
                  <span className="text-xs font-semibold text-[#8A7C70]">建立流程提醒</span>
                  <ul className="mt-2 space-y-1 text-xs text-[#6E5A4A]">
                    <li>・ 使用有意義的課程代碼方便搜尋。</li>
                    <li>・ 確保每個班別皆綁定課程類型。</li>
                    <li>・ 指派教師與教室，有助排程時快速選用。</li>
                  </ul>
                </div>
            </div>
            
              <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
            <div className="space-y-5">
                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <h4 className="mb-4 text-sm font-semibold text-[#4B4036]">班別資料</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                        <label className="block text-xs font-semibold text-[#8A7C70] mb-1">課程代碼 *</label>
                  <input
                    type="text"
                    value={newCourseCode.course_code || ''}
                    onChange={(e) => setNewCourseCode({...newCourseCode, course_code: e.target.value})}
                          className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                          placeholder="例如：PIANO_002"
                  />
                </div>
                <div>
                        <label className="block text-xs font-semibold text-[#8A7C70] mb-1">課程名稱 *</label>
                  <input
                    type="text"
                    value={newCourseCode.course_name || ''}
                    onChange={(e) => setNewCourseCode({...newCourseCode, course_name: e.target.value})}
                          className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                          placeholder="例如：鋼琴中級班 B"
                  />
                </div>
                <div>
                        <label className="block text-xs font-semibold text-[#8A7C70] mb-1">課程容量 *</label>
                  <input
                    type="number"
                          min={1}
                    value={newCourseCode.max_students || 8}
                    onChange={(e) => setNewCourseCode({...newCourseCode, max_students: parseInt(e.target.value) || 8})}
                          className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                          placeholder="最大人數"
                  />
                </div>
                <div>
                        <label className="block text-xs font-semibold text-[#8A7C70] mb-1">教室位置</label>
                  <input
                    type="text"
                    value={newCourseCode.room_location || ''}
                    onChange={(e) => setNewCourseCode({...newCourseCode, room_location: e.target.value})}
                          className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                          placeholder="例如：教室 B"
                  />
                </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <h4 className="mb-4 text-sm font-semibold text-[#4B4036]">課程設定</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-[#F1E4D3] bg-white/80 p-1 shadow-inner">
                  <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] transition hover:shadow"
                    onClick={() => setShowAddCourseTypeSelect(true)}
                  >
                          <span>
                      {newCourseCode.course_type_id 
                              ? courseTypes.find((t) => t.id === newCourseCode.course_type_id)?.name || '未知課程類型'
                              : '選擇課程類型'}
                          </span>
                          <span className="rounded-full bg-white/80 p-1 shadow">
                            <svg className="h-4 w-4 text-[#D48347]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                    </span>
                  </button>
                </div>
                      <div className="rounded-2xl border border-[#F1E4D3] bg-white/80 p-1 shadow-inner">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] transition hover:shadow"
                          onClick={() => setShowAddTeacherSelect(true)}
                        >
                          <span>
                            {newCourseCode.teacher_id
                              ? getTeacherLabel(newCourseCode.teacher_id, '指定授課教師')
                              : '指定授課教師'}
                          </span>
                          <span className="rounded-full bg-white/80 p-1 shadow">
                            <svg className="h-4 w-4 text-[#D48347]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-[#8A7C70] mb-1">課程描述</label>
                <textarea
                  value={newCourseCode.course_description || ''}
                  onChange={(e) => setNewCourseCode({...newCourseCode, course_description: e.target.value})}
                  rows={3}
                        className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                        placeholder="簡述班別重點、課程內容或注意事項"
                />
              </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <h4 className="mb-3 text-sm font-semibold text-[#4B4036]">啟用設定</h4>
                    <div className="flex items-center gap-3 rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] to-[#F3EFE3] px-4 py-4 shadow-inner">
                <input
                  type="checkbox"
                  id="new_is_active"
                  checked={newCourseCode.is_active}
                  onChange={(e) => setNewCourseCode({...newCourseCode, is_active: e.target.checked})}
                        className="h-4 w-4 rounded border-[#A68A64] text-[#A68A64] focus:ring-[#A68A64] focus:ring-2"
                      />
                      <label htmlFor="new_is_active" className="text-sm font-medium text-[#4B4036]">
                        開啟此課程代碼，讓教師可於時間表中選用
                </label>
              </div>
                  </section>

                  <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F1E4D3] pt-5">
              <button
                      type="button"
                      className="rounded-full border border-[#EADBC8] bg-white px-5 py-2 text-sm text-[#4B4036] transition hover:bg-[#FFF3E4]"
                onClick={() => setShowAddCourseCode(false)}
              >
                取消
              </button>
              <button
                      type="button"
                      className="rounded-full bg-[#F59BB5] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-[#F59BB5]/40 transition hover:bg-[#F27EA6]"
                onClick={handleAddCourseCode}
              >
                      新增課程代碼
              </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 編輯課程代碼模態框 */}
      {showEditCourseCode && editingCourseCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-[#FFFDF7] shadow-[0_28px_80px_rgba(209,166,133,0.35)] ring-1 ring-[#F2E6D7]/80">
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-sm text-[#4B4036] shadow-sm transition hover:bg-[#FFF3E4]"
              onClick={() => {
                setShowEditCourseCode(false);
                setEditingCourseCode(null);
              }}
            >
              關閉
            </button>

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="relative flex flex-col gap-6 bg-gradient-to-br from-[#FFE8D4] via-[#FFD6F0] to-[#FAD5FF] px-6 py-8">
                <div className="absolute -top-12 right-2 h-48 w-48 rounded-full bg-white/25 blur-3xl" aria-hidden="true" />
                <div className="absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/75 shadow-lg">
                  <Image src="/icons/book-elephant.png" alt="編輯課程代碼" width={40} height={40} className="drop-shadow" />
              </div>
                <div className="space-y-3 text-[#4B4036]">
                  <span className="inline-flex items-center gap-2 rounded-full bg白/75 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                    Step 2 · 調整課程代碼
                  </span>
                  <h3 className="text-2xl font-semibold leading-snug">
                    更新班別資訊、授課教師與教室設定，確保課程代碼保持最新。
                  </h3>
                  <p className="text-sm leading-relaxed text-[#604D3F]">
                    若班別結構或授課安排有變動，可於此處迅速調整。更新後建議同步檢視時間表，確認每個時段仍然適用。
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-inner">
                  <span className="text-xs font-semibold text-[#8A7C70]">編輯提示</span>
                  <ul className="mt-2 space-y-1 text-xs text-[#6E5A4A]">
                    <li>・ 班別人數或教室變更後，記得更新排課。</li>
                    <li>・ 課程類型變更會影響套票與時段策略。</li>
                    <li>・ 若需暫停班別，可關閉課程代碼啟用狀態。</li>
                  </ul>
                </div>
            </div>
            
              <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
            <div className="space-y-5">
                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#4B4036]">課程代碼基本資訊</h4>
                      <span className="text-xs text-[#A68A64]">代碼為系統唯一鍵</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">課程代碼</label>
                        <div className="flex items-center justify-between rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#F7F2EA] to-[#EEE2CE] px-4 py-3 text-sm font-semibold text-[#6E5A4A] shadow-inner">
                          <span className="font-mono text-base">{editingCourseCode.course_code}</span>
                          <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-[#A68A64] shadow-sm">不可修改</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">課程名稱 *</label>
                          <input
                            type="text"
                            value={editingCourseCode.course_name}
                            onChange={(e) => setEditingCourseCode({ ...editingCourseCode, course_name: e.target.value })}
                            className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                            placeholder="例如：鋼琴中級班 B"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">班別容量 *</label>
                          <input
                            type="number"
                            value={editingCourseCode.max_students || 0}
                            min={1}
                            onChange={(e) => setEditingCourseCode({ ...editingCourseCode, max_students: parseInt(e.target.value) || 0 })}
                            className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">課程描述</label>
                        <textarea
                          value={editingCourseCode.course_description || ''}
                          onChange={(e) => setEditingCourseCode({ ...editingCourseCode, course_description: e.target.value })}
                          rows={3}
                          className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60 resize-none"
                          placeholder="可描述課程重點、教材或班別定位"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#4B4036]">授課配置</h4>
                      <span className="text-xs text-[#A68A64]">教師、教室與課程類型</span>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">授課教師</label>
                          <button
                            type="button"
                            onClick={() => setShowEditCourseCodeTeacherSelect(true)}
                            className="flex w-full items-center justify-between rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF8EC] via-[#FFEFF5] to-[#FFF7E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                          >
                            {editingCourseCode.teacher_id ? (
                              getTeacherLabel(editingCourseCode.teacher_id, editingCourseCode.teacher_name || '未分配')
                             ) : (
                               '選擇教師'
                             )}
                            <span className="rounded-full bg-white/80 p-1 shadow">
                              <svg className="h-4 w-4 text-[#D48347]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </span>
                          </button>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">教室 / 地點</label>
                          <input
                            type="text"
                            value={editingCourseCode.room_location || ''}
                            onChange={(e) => setEditingCourseCode({ ...editingCourseCode, room_location: e.target.value })}
                            className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                            placeholder="例如：音樂室 B"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">課程類型</label>
                        <div className="rounded-2xl border border-[#F1E4D3] bg-white/80 p-1 shadow-inner">
                          <select
                            value={editingCourseCode.course_type_id || ''}
                            onChange={(e) => setEditingCourseCode({ ...editingCourseCode, course_type_id: e.target.value })}
                            className="w-full appearance-none rounded-2xl bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                          >
                            <option value="">選擇課程類型</option>
                            {courseTypes.map((courseType) => (
                              <option key={courseType.id} value={courseType.id}>
                                {getCourseTypeLabel(courseType)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#4B4036]">啟用狀態</h4>
                      <span className="text-xs text-[#A68A64]">停用後將從時間表選項中隱藏</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF9F2] to-[#FFEEDD] px-4 py-3">
                      <input
                        type="checkbox"
                        id="edit-course-code-active"
                        checked={!!editingCourseCode.is_active}
                        onChange={(e) => setEditingCourseCode({ ...editingCourseCode, is_active: e.target.checked })}
                        className="h-5 w-5 rounded border-2 border-[#E4D5BC] bg-white text-[#A68A64] focus:ring-[#A68A64] focus:ring-2 transition"
                      />
                      <label htmlFor="edit-course-code-active" className="text-sm font-medium text-[#4B4036]">
                        啟用此課程代碼供排課使用
                      </label>
                    </div>
                  </section>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      className="flex-1 rounded-2xl border border-[#EADBC8] bg-white/80 px-5 py-3 text-sm font-semibold text-[#8A7C70] shadow-sm transition hover:bg-[#FFF4DF]"
                      onClick={() => {
                        setShowEditCourseCode(false);
                        setEditingCourseCode(null);
                      }}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-2xl bg-gradient-to-r from-[#F59BB5] via-[#FFD59A] to-[#F7C8D1] px-6 py-3 text-sm font-semibold text-[#4B4036] shadow-lg shadow-[#F7C8D1]/50 transition hover:shadow-xl"
                      onClick={handleEditCourseCode}
                    >
                      儲存變更
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 選擇器模態框 */}
      {showWeekdaySelect && (
        <PopupSelect
          mode="single"
          options={weekdays.map((day, index) => ({ label: day, value: index.toString() }))}
          selected={newSlot.weekday?.toString() || '1'}
          title="選擇星期"
          onCancel={() => setShowWeekdaySelect(false)}
          onChange={(value) => setNewSlot({...newSlot, weekday: parseInt(value as string)})}
          onConfirm={() => setShowWeekdaySelect(false)}
        />
      )}

      {showCourseCodeSelect && (
        <PopupSelect
          mode="single"
          options={[
            { label: '不指定課程', value: '' },
            ...courseCodes.map(course => ({ 
              label: `${course.course_code} - ${course.course_name}`, 
              value: course.course_code 
            }))
          ]}
          selected={newSlot.course_code || ''}
          title="選擇課程代碼"
          onCancel={() => setShowCourseCodeSelect(false)}
          onChange={(value) => {
            const courseCode = value as string;
            const selectedCourse = courseCodes.find(c => c.course_code === courseCode);
            
            if (selectedCourse) {
              // 自動載入課程代碼的預設值
              setNewSlot({
                ...newSlot,
                course_code: courseCode,
                max_students: selectedCourse.max_students || newSlot.max_students,
                room_id: selectedCourse.room_location || newSlot.room_id,
                course_type: selectedCourse.course_type_name || newSlot.course_type,
                assigned_teachers: (selectedCourse as any).teacher_id || newSlot.assigned_teachers
              });
              console.log('新增時段自動載入課程代碼預設值：', {
                course_code: courseCode,
                max_students: selectedCourse.max_students,
                room_location: selectedCourse.room_location,
                course_type: selectedCourse.course_type_name,
                teacher_name: (selectedCourse as any).teacher_name
              });
            } else {
              // 不指定課程時保持原有值
              setNewSlot({...newSlot, course_code: courseCode});
            }
          }}
          onConfirm={() => setShowCourseCodeSelect(false)}
        />
      )}

      {/* 編輯時段模態框 */}
      {showEditSlot && editSlot.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-[#FFFDF7] shadow-[0_28px_80px_rgba(209,166,133,0.35)] ring-1 ring-[#F2E6D7]/80">
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-sm text-[#4B4036] shadow-sm transition hover:bg-[#FFF3E4]"
              onClick={() => {
                setShowEditSlot(false);
                setEditSlot({});
              }}
            >
              關閉
            </button>

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="relative flex flex-col gap-6 bg-gradient-to-br from-[#FFE6C9] via-[#FFD8DC] to-[#F9D5FF] px-6 py-8">
                <div className="absolute -top-12 right-2 h-48 w-48 rounded-full bg-white/25 blur-3xl" aria-hidden="true" />
                <div className="absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/75 shadow-lg">
                  <Image src="/icons/owl-clock.png" alt="編輯課堂時段" width={40} height={40} className="drop-shadow" />
              </div>
                <div className="space-y-3 text-[#4B4036]">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                    Step 3 · 調整排課資訊
                  </span>
                  <h3 className="text-2xl font-semibold leading-snug">
                    更新週期時段、教師與教室配置，維持時間表最新狀態。
                  </h3>
                  <p className="text-sm leading-relaxed text-[#604D3F]">
                    若課程內容、教師或教室有變動，可在此快速調整。完成後記得通知團隊與家長，確保行程同步。
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-inner">
                  <span className="text-xs font-semibold text-[#8A7C70]">排課調整提示</span>
                  <ul className="mt-2 space-y-1 text-xs text-[#6E5A4A]">
                    <li>・ 修改課程代碼時，記得確認班別容量與教室安排。</li>
                    <li>・ 若更換教師，建議同時更新教師的個人排程。</li>
                    <li>・ 課程時間變更後，請確認學生通知是否到位。</li>
                  </ul>
                </div>
            </div>
            
              <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
            <div className="space-y-5">
                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#4B4036]">時段設定</h4>
                      <span className="text-xs text-[#A68A64]">更新星期與時間</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">星期 *</label>
                  <button
                          className="flex w-full items-center justify-between rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                    onClick={() => setShowEditWeekdaySelect(true)}
                  >
                          {weekdays[editSlot.weekday || 0]}
                          <span className="text-xs text-[#A68A64]">點擊調整</span>
                  </button>
                </div>
                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">時間 *</label>
                        <div className="rounded-2xl border border-[#F1E4D3] bg-[#FFFDF9] px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-[#F59BB5]/40">
                    <TimePicker
                      value={editSlot.timeslot || '09:00:00'}
                            onChange={(time) => setEditSlot({ ...editSlot, timeslot: time })}
                    />
                  </div>
                </div>
              </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#4B4036]">班別與課程</h4>
                      <span className="text-xs text-[#A68A64]">調整課程與班別資訊</span>
                    </div>
                    <div className="space-y-4">
                <div>
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">課程代碼 *</label>
                  <button
                          className="flex w-full items-center justify-between rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF8EC] via-[#FFEFF5] to-[#FFF7E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                    onClick={() => setShowEditCourseCodeSelect(true)}
                  >
                          {getCourseCodeInfo(editSlot.course_code || '')?.course_name || '請選擇課程代碼'}
                          <span className="text-xs text-[#A68A64]">可重新指派</span>
                  </button>
                </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                          <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">班別名稱</label>
                  <input
                    type="text"
                    value={editSlot.course_section || 'A'}
                            onChange={(e) => setEditSlot({ ...editSlot, course_section: e.target.value })}
                            className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                            placeholder="例如：B班／進階班"
                  />
                </div>
                <div>
                          <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">容量（人數）</label>
                  <input
                    type="number"
                    value={editSlot.max_students || 10}
                            min={1}
                            onChange={(e) => setEditSlot({ ...editSlot, max_students: parseInt(e.target.value) || 1 })}
                            className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                  />
                </div>
                </div>
                <div>
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">教室／地點</label>
                  <input
                    type="text"
                    value={editSlot.room_id || ''}
                          onChange={(e) => setEditSlot({ ...editSlot, room_id: e.target.value })}
                          className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                          placeholder="例如：教室 B"
                  />
                </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#4B4036]">授課教師與資訊</h4>
                      <span className="text-xs text-[#A68A64]">確認教師與課程類型</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">授課教師</label>
                        <button
                          className="flex w-full items-center justify-between rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF8EC] via-[#FFEFF5] to-[#FFF7E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                          onClick={() => setShowEditTeacherSelect(true)}
                        >
                          {getTeacherLabel(editSlot.assigned_teachers, '請選擇授課教師')}
                          <span className="text-xs text-[#A68A64]">點擊變更</span>
                        </button>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">課程類型</label>
                  <input
                    type="text"
                    value={editSlot.course_type || ''}
                          onChange={(e) => setEditSlot({ ...editSlot, course_type: e.target.value })}
                          className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                          placeholder="例如：幼兒鋼琴"
                  />
                </div>
              </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[#4B4036]">課程時長</h4>
                      <span className="text-xs text-[#A68A64]">調整課堂時間</span>
                    </div>
                    <div className="rounded-2xl border border-[#F1E4D3] bg-[#FFFDF9] px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-[#F59BB5]/40">
                  <TimePicker
                    value={editSlot.duration || '01:00:00'}
                        onChange={(time) => setEditSlot({ ...editSlot, duration: time })}
                  />
                </div>
                  </section>

                  <div className="flex flex-col gap-3 rounded-3xl border border-dashed border-[#EADBC8] bg-[#FFF9F2] px-5 py-4 text-xs text-[#8A7C70]">
                    <span className="font-semibold text-[#4B4036]">排課流程提醒</span>
                    <p>Step 1 · 課程類型管理 → Step 2 · 課程代碼管理 → Step 3 · 多課程時間表管理。更新後請再次檢視時間表，確保各班資訊同步。</p>
            </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                      className="flex-1 rounded-2xl border border-[#EADBC8] bg-white/80 py-3 text-sm font-semibold text-[#8A7C70] shadow-sm transition hover:bg-[#FFF4DF]"
                onClick={() => {
                  setShowEditSlot(false);
                  setEditSlot({});
                }}
              >
                取消
              </button>
              <button
                      className="flex-1 rounded-2xl bg-gradient-to-r from-[#F59BB5] via-[#FFD59A] to-[#F7C8D1] py-3 text-sm font-semibold text-[#4B4036] shadow-md transition hover:shadow-xl"
                onClick={handleEditSlot}
              >
                      儲存變更
              </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增時段選擇器 */}
      {showTeacherSelect && (
        <PopupSelect
          mode="single"
          options={(() => {
            const teacherOptions = teachers.map(teacher => ({ 
              label: formatTeacherDisplay(teacher), 
              value: teacher.id 
            }));
            const allOptions = [
              { label: '不指定教師', value: '' },
              ...teacherOptions
            ];
            
            console.log('新增時段教師選擇器選項：', {
              teacherCount: teacherOptions.length,
              totalCount: allOptions.length,
              teachers: teacherOptions.map(t => t.label)
            });
            
            return allOptions;
          })()}
          selected={newSlot.assigned_teachers || ''}
          title="選擇教師"
          onCancel={() => setShowTeacherSelect(false)}
          onChange={(value) => setNewSlot({...newSlot, assigned_teachers: value as string})}
          onConfirm={() => setShowTeacherSelect(false)}
        />
      )}

      {/* 編輯時段選擇器 */}
      {showEditWeekdaySelect && (
        <PopupSelect
          mode="single"
          options={weekdays.map((day, index) => ({ label: day, value: index.toString() }))}
          selected={editSlot.weekday?.toString() || '1'}
          title="選擇星期"
          onCancel={() => setShowEditWeekdaySelect(false)}
          onChange={(value) => setEditSlot({...editSlot, weekday: parseInt(value as string)})}
          onConfirm={() => setShowEditWeekdaySelect(false)}
        />
      )}

      {showEditCourseCodeSelect && (
        <PopupSelect
          mode="single"
          options={[
            { label: '不指定課程', value: '' },
            ...courseCodes.map(course => ({ 
              label: `${course.course_code} - ${course.course_name}`, 
              value: course.course_code 
            }))
          ]}
          selected={editSlot.course_code || ''}
          title="選擇課程代碼"
          onCancel={() => setShowEditCourseCodeSelect(false)}
          onChange={(value) => {
            const courseCode = value as string;
            const selectedCourse = courseCodes.find(c => c.course_code === courseCode);
            
            if (selectedCourse) {
              // 自動載入課程代碼的預設值
              setEditSlot({
                ...editSlot,
                course_code: courseCode,
                max_students: selectedCourse.max_students || editSlot.max_students,
                room_id: selectedCourse.room_location || editSlot.room_id,
                course_type: selectedCourse.course_type_name || editSlot.course_type,
                assigned_teachers: (selectedCourse as any).teacher_id || editSlot.assigned_teachers
              });
              console.log('編輯時段自動載入課程代碼預設值：', {
                course_code: courseCode,
                max_students: selectedCourse.max_students,
                room_location: selectedCourse.room_location,
                course_type: selectedCourse.course_type_name,
                teacher_name: (selectedCourse as any).teacher_name
              });
            } else {
              // 不指定課程時保持原有值
              setEditSlot({...editSlot, course_code: courseCode});
            }
          }}
          onConfirm={() => setShowEditCourseCodeSelect(false)}
        />
      )}

      {showEditTeacherSelect && (
        <PopupSelect
          mode="single"
          options={(() => {
            const teacherOptions = teachers.map(teacher => ({ 
              label: formatTeacherDisplay(teacher), 
              value: teacher.id 
            }));
            const allOptions = [{ label: '不指定教師', value: '' }, ...teacherOptions];
            
            console.log('編輯時段教師選擇器選項：', {
              teacherCount: teacherOptions.length,
              totalCount: allOptions.length,
              teachers: teacherOptions.map(t => t.label)
            });
            
            return allOptions;
          })()}
          selected={editSlot.assigned_teachers || ''}
          title="選擇教師"
          onCancel={() => setShowEditTeacherSelect(false)}
          onChange={(value) => setEditSlot({...editSlot, assigned_teachers: value as string})}
          onConfirm={() => setShowEditTeacherSelect(false)}
        />
      )}

      {/* 編輯課程代碼選擇器 */}
      {showEditCourseCodeTeacherSelect && (
        <PopupSelect
          mode="single"
          options={[
            { label: '不指定教師', value: '' },
            // 教師選項
            ...teachers.map((teacher) => ({
              label: formatTeacherDisplay(teacher),
              value: teacher.id,
            })),
          ]}
          selected={editingCourseCode?.teacher_id || ''}
          title="選擇教師"
          onCancel={() => setShowEditCourseCodeTeacherSelect(false)}
          onChange={(value) => setEditingCourseCode({...editingCourseCode, teacher_id: value as string} as any)}
          onConfirm={() => setShowEditCourseCodeTeacherSelect(false)}
        />
      )}

      {/* 新增課程代碼選擇器 */}
      {showAddTeacherSelect && (
        <PopupSelect
          mode="single"
          options={[
            { label: '不指定教師', value: '' },
            // 教師選項
            ...teachers.map((teacher) => ({
              label: formatTeacherDisplay(teacher),
              value: teacher.id,
            })),
          ]}
          selected={newCourseCode.teacher_id || ''}
          title="選擇教師"
          onCancel={() => setShowAddTeacherSelect(false)}
          onChange={(value) => setNewCourseCode({...newCourseCode, teacher_id: value as string})}
          onConfirm={() => setShowAddTeacherSelect(false)}
        />
      )}

      {showAddCourseTypeSelect && (
        <PopupSelect
          mode="single"
          options={[
            { label: '不指定課程類型', value: '' },
            ...courseTypes.map(courseType => ({ 
              label: getCourseTypeLabel(courseType), 
              value: courseType.id 
            }))
          ]}
          selected={newCourseCode.course_type_id || ''}
          title="選擇課程類型"
          onCancel={() => setShowAddCourseTypeSelect(false)}
          onChange={(value) => setNewCourseCode({...newCourseCode, course_type_id: value as string})}
          onConfirm={() => setShowAddCourseTypeSelect(false)}
        />
      )}

      {/* 時段詳情視窗 */}
      {showSlotDetail && selectedSlotDetail && (
        <motion.div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSlotDetail(false)}
        >
          <motion.div 
            className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-[#EADBC8]"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 標題欄 */}
            <div className="bg-gradient-to-r from-[#FFE7D1] via-[#FFDDEA] to-[#FFD6F0] p-6 border-b-2 border-[#EADBC8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-12 h-12 bg-white/85 rounded-full flex items-center justify-center shadow-lg border border-white/60"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <svg className="w-6 h-6 text-[#D48347]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#2B3A3B]">時段詳情</h2>
                    <p className="text-[#4B4036] text-sm">
                      {weekdays[selectedSlotDetail.weekday || 0]} {selectedSlotDetail.timeslot}
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 hover:bg-white/30 rounded-full transition-colors"
                  onClick={() => setShowSlotDetail(false)}
                >
                  <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 內容區域 */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* 課程資訊卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div 
                  className="rounded-2xl border border-[#F1E4D3] bg-gradient-to-br from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] p-4 shadow-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#D48347]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="font-semibold text-[#A46832]">課程代碼</span>
                  </div>
                  <p className="text-lg font-bold text-[#4B4036]">
                    {selectedSlotDetail.course_code || '未設定'}
                  </p>
                </motion.div>

                <motion.div 
                  className="rounded-2xl border border-[#F1E4D3] bg-gradient-to-br from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] p-4 shadow-sm"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#D48347]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold text-[#A46832]">課程名稱</span>
                  </div>
                  <p className="text-lg font-bold text-[#4B4036]">
                    {getCourseCodeInfo(selectedSlotDetail.course_code || '')?.course_name || '未知課程'}
                  </p>
                </motion.div>

                <motion.div 
                  className="rounded-2xl border border-[#F1E4D3] bg-gradient-to-br from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] p-4 shadow-sm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#D48347]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-semibold text-[#A46832]">課程類型</span>
                  </div>
                  <p className="text-lg font-bold text-[#4B4036]">
                    {getCourseCodeInfo(selectedSlotDetail.course_code || '')?.course_type_name || '未知類型'}
                  </p>
                </motion.div>
              </div>

              {/* 統計資訊卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div 
                  className="rounded-2xl border border-[#F1E4D3] bg-white/90 p-4 text-center shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-2xl font-bold text-[#D48347] mb-1">
                    {selectedSlotDetail.max_students || 0}
                  </div>
                  <div className="text-sm text-[#8A7C70] font-medium">總容量</div>
                </motion.div>

                <motion.div 
                  className="rounded-2xl border border-[#F1E4D3] bg-white/90 p-4 text-center shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-2xl font-bold text-[#D48347] mb-1">
                    {selectedSlotDetail.assigned_student_ids?.length || 0}
                  </div>
                  <div className="text-sm text-[#8A7C70] font-medium">常規學生</div>
                </motion.div>

                <motion.div 
                  className="rounded-2xl border border-[#F1E4D3] bg-white/90 p-4 text-center shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-2xl font-bold text-[#D48347] mb-1">
                    {selectedSlotDetail.trial_student_ids?.length || 0}
                  </div>
                  <div className="text-sm text-[#8A7C70] font-medium">試堂學生</div>
                </motion.div>

                <motion.div 
                  className="rounded-2xl border border-[#F1E4D3] bg-white/90 p-4 text-center shadow-sm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="text-2xl font-bold text-[#D48347] mb-1">
                    {selectedSlotDetail.max_students ? 
                      Math.round(((selectedSlotDetail.assigned_student_ids?.length || 0) / selectedSlotDetail.max_students) * 100) : 0}%
                  </div>
                  <div className="text-sm text-[#8A7C70] font-medium">使用率</div>
                </motion.div>
              </div>

              {/* 學生列表 */}
              <div className="space-y-4">
                {/* 常規學生 */}
                <motion.div 
                  className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm"
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
                    <h3 className="text-lg font-semibold text-[#4B4036]">常規學生 ({(selectedSlotDetail.assigned_student_ids?.length || 0)})</h3>
                  </div>
                  <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-lg p-4 min-h-[120px]">
                    {(selectedSlotDetail.assigned_student_ids?.length || 0) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(selectedSlotDetail.assigned_student_ids || []).map((studentId: string, index: number) => {
                          const student = selectedSlotDetail.students?.find((s: any) => s.id === studentId);
                          return (
                            <motion.div
                              key={studentId}
                              className="bg-white rounded-lg p-3 border border-[#EADBC8] shadow-sm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.9 + index * 0.1 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center text-xs font-bold text-[#4B4036]">
                                  {student?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <div className="font-medium text-[#4B4036] text-sm">
                                    {student?.full_name || '未知學生'}
                                  </div>
                                  {student?.student_age && (
                                    <div className="text-xs text-[#87704e]">
                                      {student.student_age}個月
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-[#FFF4DF] rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-[#D7A264]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-[#87704e]">暫無常規學生</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* 試堂學生 */}
                <motion.div 
                  className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm"
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
                    <h3 className="text-lg font-semibold text-[#4B4036]">試堂學生 ({(selectedSlotDetail.trial_student_ids?.length || 0)})</h3>
                  </div>
                  <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-lg p-4 min-h-[120px]">
                    {(selectedSlotDetail.trial_student_ids?.length || 0) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(selectedSlotDetail.trial_student_ids || []).map((studentId: string, index: number) => {
                          const student = selectedSlotDetail.trial_students?.find((s: any) => s.id === studentId);
                          return (
                            <motion.div
                              key={studentId}
                              className="bg-white rounded-lg p-3 border border-[#EADBC8] shadow-sm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.1 + index * 0.1 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FF9BB3] rounded-full flex items-center justify-center text-xs font-bold text-[#4B4036]">
                                  {student?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <div className="font-medium text-[#4B4036] text-sm">
                                    {student?.full_name || '未知學生'}
                                  </div>
                                  {student?.student_age && (
                                    <div className="text-xs text-[#87704e]">
                                      {student.student_age}個月
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-[#FFF4DF] rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-[#D7A264]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-[#87704e]">暫無試堂學生</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* 底部操作按鈕 */}
            <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] p-6 border-t-2 border-[#EADBC8]">
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 bg-gradient-to-r from-[#F59BB5] via-[#FFD59A] to-[#F7C8D1] text-[#4B4036] py-3 px-6 rounded-xl hover:from-[#F4A6BE] hover:via-[#FFE1B7] hover:to-[#F8D3DA] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // 添加學生到課程的邏輯
                    console.log('添加學生到課程');
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加學生到課程
                </motion.button>
                <motion.button
                  className="flex-1 bg-gradient-to-r from-[#FFE7F3] via-[#FFDDEA] to-[#FFE6D7] text-[#4B4036] py-3 px-6 rounded-xl hover:from-[#FFDDEE] hover:via-[#FFD7E4] hover:to-[#FFE0CF] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // 移除學生的邏輯
                    console.log('移除學生');
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  移除學生
                </motion.button>
                <motion.button
                  className="flex-1 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white py-3 px-6 rounded-xl hover:from-[#8f7350] hover:to-[#7a6348] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSlotDetail(false)}
                >
                  關閉
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 課程類型建立/編輯彈窗 */}
      {showCourseTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] bg-[#FFFDF7] shadow-[0_28px_80px_rgba(209,166,133,0.35)] ring-1 ring-[#F2E6D7]/80">
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-sm text-[#4B4036] shadow-sm transition hover:bg-white"
              onClick={async () => {
                // 清理未保存的新上傳圖片
                await cleanupUnsavedImages();
                setShowCourseTypeModal(false);
                setEditingCourseType(null);
                resetCourseTypeForm();
              }}
            >
              關閉
            </button>
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="relative flex flex-col gap-6 bg-gradient-to-br from-[#FFE6C9] via-[#FFD8DC] to-[#F9D5FF] px-6 py-8">
                <div className="absolute -top-12 right-2 h-48 w-48 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                <div className="absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 shadow-lg">
                  <Image src="/icons/music.PNG" alt="課程類型" width={36} height={36} className="drop-shadow" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-[#4B4036]">
                    {editingCourseType ? '編輯課程類型' : '新增課程類型'}
                  </h3>
                  <p className="mt-2 text-sm text-[#604D3F]">
                    打造專屬的課程組合，調整年齡層、課堂時長與優惠套票，讓每位學生都能擁有適合的學習旅程。
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#8A7C70]">套票方案</span>
                    <span className="text-sm font-semibold text-[#4B4036]">
                      {(courseTypeForm.discount_configs?.packages?.length ?? 0).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-[#FFC9A9] via-[#FFAFBD] to-[#C9A6FF]" />
                </div>
                <div className="rounded-2xl bg-white/80 p-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#8A7C70]">試堂優惠</span>
                    <span className="text-sm font-semibold text-[#4B4036]">
                      {(courseTypeForm.discount_configs?.trialBundles?.length ?? 0).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-[#C6F2FF] via-[#A6E1FF] to-[#A6B4FF]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#4B4036]">小提醒</h4>
                  <ul className="mt-2 space-y-1 text-xs text-[#604D3F]">
                    <li>・ 套票價格與優惠可自由調整，系統將自動保存。</li>
                    <li>・ 建議為不同難度設定適合的年齡與課堂時長。</li>
                    <li>・ 可隨時停用課程類型，不影響既有資料。</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full rounded-full border border-[#EADBC8] bg-white px-4 py-2.5 text-sm text-[#4B4036] transition hover:bg-[#FFF3E4] flex items-center justify-center space-x-2 shadow-sm"
                    onClick={() => {
                      setPreviewingCourseType(null); // 清除預覽的課程類型，使用當前表單數據
                      setShowPreviewModal(true);
                    }}
                    disabled={courseTypeSaving}
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>預覽課程</span>
                  </button>
                </div>
              </div>

              <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  {/* 圖片上傳區域 */}
                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#4B4036]">課程封面圖片</h4>
                        <p className="text-xs text-[#8A7C70] mt-1">最多可上傳 5 張圖片，用於課程展示</p>
                      </div>
                      {courseTypeImages.length > 1 && (
                        <div className="flex items-center gap-2 text-xs text-[#8A7C70]">
                          <div className="flex flex-col gap-1">
                            <div className="w-3 h-0.5 bg-[#A68A64] rounded-full"></div>
                            <div className="w-3 h-0.5 bg-[#A68A64] rounded-full"></div>
                            <div className="w-3 h-0.5 bg-[#A68A64] rounded-full"></div>
                          </div>
                          <span>拖拽調整順序</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 圖片預覽網格（支持拖拽排序） */}
                    {courseTypeImages.length > 0 && (
                      <DragDropContext onDragEnd={handleImageReorder}>
                        <Droppable droppableId="course-images" direction="horizontal">
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 transition-colors ${
                                snapshot.isDraggingOver ? 'bg-[#FFF9F2] rounded-xl p-2' : ''
                              }`}
                            >
                              {courseTypeImages.map((imageUrl, index) => (
                                <Draggable key={imageUrl} draggableId={imageUrl} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`relative group ${
                                        snapshot.isDragging ? 'opacity-50 z-50' : ''
                                      }`}
                                    >
                                      <div className="aspect-square rounded-xl overflow-hidden border border-[#EADBC8] bg-[#FFFDF7] shadow-sm hover:shadow-md transition-shadow">
                                        <Image
                                          src={imageUrl}
                                          alt={`課程圖片 ${index + 1}`}
                                          width={200}
                                          height={200}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      {/* 拖拽手柄 */}
                                      <div
                                        {...provided.dragHandleProps}
                                        className="absolute top-2 left-2 p-1.5 bg-white/90 hover:bg-white text-[#4B4036] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-grab active:cursor-grabbing"
                                        title="拖拽調整順序"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                        </svg>
                                      </div>
                                      {/* 刪除按鈕 */}
                                      <button
                                        type="button"
                                        onClick={() => handleImageDelete(imageUrl, index)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                        title="刪除圖片"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                      {/* 順序標籤 */}
                                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-medium rounded-full">
                                        {index + 1}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}

                    {/* 上傳區域 */}
                    {courseTypeImages.length < 5 && (
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                          uploadingImages
                            ? 'border-[#A68A64] bg-[#FFF9F2]'
                            : 'border-[#EADBC8] bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] hover:border-[#A68A64] hover:bg-[#FFF9F2]'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleImageUpload(e.dataTransfer.files);
                          }
                        }}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          multiple
                          className="hidden"
                          id="course-type-image-upload"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleImageUpload(e.target.files);
                              e.target.value = ''; // 重置 input
                            }
                          }}
                          disabled={uploadingImages}
                        />
                        <label
                          htmlFor="course-type-image-upload"
                          className={`flex flex-col items-center justify-center cursor-pointer ${
                            uploadingImages ? 'pointer-events-none opacity-60' : ''
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-[#4B4036] mb-1">
                            {uploadingImages ? '上傳中...' : '點擊或拖拽圖片到此處上傳'}
                          </p>
                          <p className="text-xs text-[#8A7C70]">
                            還可上傳 {5 - courseTypeImages.length} 張（支援 JPEG, PNG, WebP, GIF，最大 2MB）
                          </p>
                        </label>
                        {uploadingImages && (
                          <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A68A64] mx-auto mb-2"></div>
                              <p className="text-xs text-[#4B4036]">上傳中...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {courseTypeImages.length >= 5 && (
                      <div className="rounded-xl bg-[#FFF9F2] border border-[#EADBC8] p-4 text-center">
                        <p className="text-sm text-[#8A7C70]">已達到最大上傳數量（5 張）</p>
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <h4 className="mb-4 text-sm font-semibold text-[#4B4036]">基本資訊</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#8A7C70] mb-1">課程類型名稱 *</label>
                        <input
                          className="w-full rounded-xl border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-sm focus:border-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]/30"
                          value={courseTypeForm.name || ''}
                          onChange={(e) => updateCourseTypeForm('name', e.target.value)}
                          placeholder="例如：幼兒鋼琴冒險班"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-[#8A7C70]">啟用狀態</label>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#4B4036]">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[#EADBC8] text-[#A68A64] focus:ring-[#A68A64]"
                            checked={courseTypeForm.status ?? true}
                            onChange={(e) => updateCourseTypeForm('status', e.target.checked)}
                          />
                          使用中
                        </label>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#8A7C70] mb-1">最小年齡</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-xl border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-sm focus:border-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]/30"
                          value={courseTypeForm.min_age ?? ''}
                          onChange={(e) => updateCourseTypeForm('min_age', e.target.value ? Number(e.target.value) : null)}
                          placeholder="例如：3"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#8A7C70] mb-1">最大年齡</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-xl border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-sm focus:border-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]/30"
                          value={courseTypeForm.max_age ?? ''}
                          onChange={(e) => updateCourseTypeForm('max_age', e.target.value ? Number(e.target.value) : null)}
                          placeholder="例如：8"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#8A7C70] mb-1">課堂時長 (分鐘)</label>
                        <input
                          type="number"
                          min={10}
                          className="w-full rounded-xl border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-sm focus:border-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]/30"
                          value={courseTypeForm.duration_minutes ?? ''}
                          onChange={(e) => updateCourseTypeForm('duration_minutes', e.target.value ? Number(e.target.value) : null)}
                          placeholder="例如：45"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#8A7C70] mb-1">建議容量 (人數)</label>
                        <input
                          type="number"
                          min={1}
                          className="w-full rounded-xl border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-sm focus:border-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]/30"
                          value={courseTypeForm.max_students ?? ''}
                          onChange={(e) => updateCourseTypeForm('max_students', e.target.value ? Number(e.target.value) : null)}
                          placeholder="例如：6"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#8A7C70] mb-2">難度等級</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'beginner', label: '初階' },
                            { value: 'intermediate', label: '中階' },
                            { value: 'advanced', label: '進階' },
                            { value: 'expert', label: '專家' },
                          ].map((option) => {
                            const active = (courseTypeForm.difficulty_level || 'beginner') === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateCourseTypeForm('difficulty_level', option.value)}
                                className={`rounded-2xl px-3 py-2 text-sm font-medium transition shadow-sm ${
                                  active
                                    ? 'bg-gradient-to-r from-[#FDECEF] via-[#FFE3F2] to-[#FBDDF2] text-[#4B4036]'
                                    : 'bg-white/80 text-[#7A6656] border border-[#F1E4D3] hover:bg-[#FFF3E4]'
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#8A7C70] mb-1">試堂上限</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-xl border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-sm focus:border-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]/30"
                          value={courseTypeForm.trial_limit ?? ''}
                          onChange={(e) => updateCourseTypeForm('trial_limit', e.target.value ? Number(e.target.value) : null)}
                          placeholder="例如：1"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <h4 className="mb-4 text-sm font-semibold text-[#4B4036]">定價設定</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#8A7C70] mb-2">定價模式</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'monthly', label: '月費' },
                            { value: 'yearly', label: '年費' },
                            { value: 'per_lesson', label: '每堂' },
                            { value: 'package', label: '套票' },
                          ].map((option) => {
                            const active = (courseTypeForm.pricing_model || 'monthly') === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateCourseTypeForm('pricing_model', option.value)}
                                className={`rounded-2xl px-3 py-2 text-sm font-medium transition shadow-sm ${
                                  active
                                    ? 'bg-gradient-to-r from-[#FFE7F3] via-[#FFDDEA] to-[#FFE6D7] text-[#4B4036]'
                                    : 'bg-white/80 text-[#7A6656] border border-[#F1E4D3] hover:bg-[#FFF3E4]'
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#8A7C70] mb-1">每堂價格</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="w-full rounded-xl border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-sm focus:border-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]/30"
                          value={courseTypeForm.price_per_lesson ?? ''}
                          onChange={(e) => updateCourseTypeForm('price_per_lesson', e.target.value ? Number(e.target.value) : null)}
                          placeholder="設定基礎每堂收費"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-[#8A7C70]">啟用標準定價</label>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#EADBC8] text-[#A68A64] focus:ring-[#A68A64]"
                          checked={courseTypeForm.is_pricing_enabled ?? true}
                          onChange={(e) => updateCourseTypeForm('is_pricing_enabled', e.target.checked)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#8A7C70] mb-1">貨幣</label>
                        <div className="relative rounded-2xl border border-[#F1E4D3] bg-white/80 p-1 shadow-inner">
                          <select
                            className="w-full appearance-none rounded-2xl bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-2.5 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                            value={courseTypeForm.currency || 'HKD'}
                            onChange={(e) => updateCourseTypeForm('currency', e.target.value)}
                          >
                            {[
                              { value: 'HKD', label: 'HKD ｜ 港幣' },
                              { value: 'TWD', label: 'TWD ｜ 新台幣' },
                              { value: 'USD', label: 'USD ｜ 美元' },
                              { value: 'CNY', label: 'CNY ｜ 人民幣' },
                              { value: 'JPY', label: 'JPY ｜ 日圓' },
                            ].map((currency) => (
                              <option key={currency.value} value={currency.value}>
                                {currency.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center justify-center">
                            <span className="rounded-full bg-white/80 p-1 shadow">
                              <svg className="h-4 w-4 text-[#D48347]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                       </div>
                    </div>
                    <p className="mt-3 text-xs text-[#8A7C70]">
                      詳細的套票與試堂優惠可在下方建立，多項優惠會同時儲存在 `discount_configs`，讓系統維持彈性擴充。
                    </p>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <h4 className="mb-4 text-sm font-semibold text-[#4B4036]">優惠設定</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div className="rounded-2xl border border-[#EADBC8] bg-[#FFFDF7] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-semibold text-[#4B4036]">課程套票</h5>
                            <p className="text-xs text-[#8A7C70]">設定多堂優惠，吸引長期學員。</p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full bg-white px-3 py-1 text-xs text-[#F59BB5] shadow-sm hover:bg-[#FFE5EE]"
                            onClick={addPackage}
                          >
                            新增套票
                          </button>
                        </div>
                        {(courseTypeForm.discount_configs?.packages || []).length === 0 ? (
                          <p className="rounded-xl bg-white/80 px-3 py-4 text-xs text-[#8A7C70] shadow-inner">
                            尚未設定套票，可新增多堂優惠或季票，提供不同堂數與價格組合。
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {(courseTypeForm.discount_configs?.packages || []).map((pkg, index) => (
                              <div key={pkg.id} className="rounded-2xl border border-[#EADBC8] bg-white px-4 py-4 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    className="flex-1 rounded-lg border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-sm focus:border-[#F59BB5] focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                                    value={pkg.title}
                                    onChange={(e) => updatePackageAt(index, 'title', e.target.value)}
                                    placeholder="套票名稱"
                                  />
                                  <button
                                    type="button"
                                    className="text-xs text-[#F59BB5] hover:text-[#F27EA6]"
                                    onClick={() => removePackage(index)}
                                  >
                                    移除
                                  </button>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                  <label className="flex flex-col gap-1 text-xs text-[#8A7C70]">
                                    堂數
                                    <input
                                      type="number"
                                      min={1}
                                      className="rounded-lg border border-[#EADBC8] bg-[#FFFDF7] px-2 py-2 text-sm focus:border-[#F59BB5] focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                                      value={pkg.lessons}
                                      onChange={(e) => updatePackageAt(index, 'lessons', Number(e.target.value) || 0)}
                                    />
                                  </label>
                                  <label className="flex flex-col gap-1 text-xs text-[#8A7C70]">
                                    套票價格
                                    <input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      className="rounded-lg border border-[#EADBC8] bg-[#FFFDF7] px-2 py-2 text-sm focus:border-[#F59BB5] focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                                      value={pkg.price}
                                      onChange={(e) => updatePackageAt(index, 'price', Number(e.target.value) || 0)}
                                    />
                                  </label>
                                </div>
                                <textarea
                                  rows={2}
                                  className="mt-3 w-full rounded-lg border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-xs focus:border-[#F59BB5] focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                                  value={pkg.description || ''}
                                  onChange={(e) => updatePackageAt(index, 'description', e.target.value)}
                                  placeholder="套票說明或限制"
                                />
                                <label className="mt-3 inline-flex items-center gap-2 text-xs text-[#4B4036]">
                                  <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 rounded border-[#EADBC8] text-[#A68A64] focus:ring-[#A68A64]"
                                    checked={pkg.is_active ?? true}
                                    onChange={(e) => updatePackageAt(index, 'is_active', e.target.checked)}
                                  />
                                  套票啟用中
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-[#EADBC8] bg-[#FFFDF7] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-semibold text-[#4B4036]">試堂優惠</h5>
                            <p className="text-xs text-[#8A7C70]">提供首次體驗的專屬方案，提升轉換率。</p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full bg-white px-3 py-1 text-xs text-[#F59BB5] shadow-sm hover:bg-[#FFE5EE]"
                            onClick={addTrialBundle}
                          >
                            新增優惠
                          </button>
                        </div>
                        {(courseTypeForm.discount_configs?.trialBundles || []).length === 0 ? (
                          <p className="rounded-xl bg-white/80 px-3 py-4 text-xs text-[#8A7C70] shadow-inner">
                            尚未設定試堂優惠，可定義免費體驗或優惠時數，吸引新學生。
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {(courseTypeForm.discount_configs?.trialBundles || []).map((bundle, index) => (
                              <div key={bundle.id} className="rounded-2xl border border-[#EADBC8] bg-white px-4 py-4 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    className="flex-1 rounded-lg border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-sm focus:border-[#F59BB5] focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                                    value={bundle.title}
                                    onChange={(e) => updateTrialBundleAt(index, 'title', e.target.value)}
                                    placeholder="優惠名稱"
                                  />
                                  <button
                                    type="button"
                                    className="text-xs text-[#F59BB5] hover:text-[#F27EA6]"
                                    onClick={() => removeTrialBundle(index)}
                                  >
                                    移除
                                  </button>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                  <label className="flex flex-col gap-1 text-xs text-[#8A7C70]">
                                    時長 (分)
                                    <input
                                      type="number"
                                      min={0}
                                      className="rounded-lg border border-[#EADBC8] bg-[#FFFDF7] px-2 py-2 text-sm focus:border-[#F59BB5] focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                                      value={bundle.duration_minutes}
                                      onChange={(e) => updateTrialBundleAt(index, 'duration_minutes', Number(e.target.value) || 0)}
                                    />
                                  </label>
                                  <label className="flex flex-col gap-1 text-xs text-[#8A7C70]">
                                    優惠價格
                                    <input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      className="rounded-lg border border-[#EADBC8] bg-[#FFFDF7] px-2 py-2 text-sm focus:border-[#F59BB5] focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                                      value={bundle.price}
                                      onChange={(e) => updateTrialBundleAt(index, 'price', Number(e.target.value) || 0)}
                                    />
                                  </label>
                                </div>
                                <textarea
                                  rows={2}
                                  className="mt-3 w-full rounded-lg border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-xs focus:border-[#F59BB5] focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                                  value={bundle.note || ''}
                                  onChange={(e) => updateTrialBundleAt(index, 'note', e.target.value)}
                                  placeholder="優惠說明／使用限制"
                                />
                                <label className="mt-3 inline-flex items-center gap-2 text-xs text-[#4B4036]">
                                  <input
                                    type="checkbox"
                                    className="h-3.5 w-3.5 rounded border-[#EADBC8] text-[#A68A64] focus:ring-[#A68A64]"
                                    checked={bundle.is_active ?? true}
                                    onChange={(e) => updateTrialBundleAt(index, 'is_active', e.target.checked)}
                                  />
                                  優惠啟用中
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                    <h4 className="mb-3 text-sm font-semibold text-[#4B4036]">備註</h4>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-[#EADBC8] bg-[#FFFDF7] px-3 py-2 text-sm focus:border-[#F59BB5] focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40"
                      value={courseTypeForm.description || ''}
                      onChange={(e) => updateCourseTypeForm('description', e.target.value)}
                      placeholder="可記錄課程亮點、教學提醒或老師備註"
                    />
                  </section>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F1E4D3] pt-5">
                  <button
                    type="button"
                    className="rounded-full border border-[#EADBC8] bg-white px-5 py-2 text-sm text-[#4B4036] transition hover:bg-[#FFF3E4]"
                    onClick={async () => {
                      // 清理未保存的新上傳圖片
                      await cleanupUnsavedImages();
                      setShowCourseTypeModal(false);
                      setEditingCourseType(null);
                      resetCourseTypeForm();
                    }}
                    disabled={courseTypeSaving}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#EADBC8] bg-white px-5 py-2 text-sm text-[#4B4036] transition hover:bg-[#FFF3E4] flex items-center space-x-2"
                    onClick={() => setShowPreviewModal(true)}
                    disabled={courseTypeSaving}
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>預覽</span>
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[#F59BB5] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-[#F59BB5]/40 transition hover:bg-[#F27EA6]"
                    onClick={handleSaveCourseType}
                    disabled={courseTypeSaving}
                  >
                    {courseTypeSaving ? '儲存中...' : '儲存課程類型'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 預覽模態框 */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 py-6 overflow-y-auto"
            onClick={() => setShowPreviewModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-transparent my-8 min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 關閉按鈕 */}
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewingCourseType(null);
                }}
                className="sticky top-0 float-right w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-white/70 text-[#4B4036] shadow-lg hover:bg-white transition-all flex items-center justify-center z-10 mb-4"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {/* 預覽卡片 */}
              <CourseTypePreviewCard
                name={
                  previewingCourseType?.name || 
                  courseTypeForm.name || 
                  '未命名課程'
                }
                description={
                  previewingCourseType?.description || 
                  courseTypeForm.description || 
                  null
                }
                durationMinutes={
                  previewingCourseType?.duration_minutes || 
                  courseTypeForm.duration_minutes || 
                  null
                }
                maxStudents={
                  previewingCourseType?.max_students || 
                  courseTypeForm.max_students || 
                  null
                }
                pricePerLesson={
                  previewingCourseType?.price_per_lesson || 
                  courseTypeForm.price_per_lesson || 
                  null
                }
                currency={
                  previewingCourseType?.currency || 
                  courseTypeForm.currency || 
                  'HKD'
                }
                images={
                  (previewingCourseType?.images && Array.isArray(previewingCourseType.images) && previewingCourseType.images.length > 0)
                    ? (previewingCourseType.images as string[])
                    : (courseTypeImages.length > 0 ? courseTypeImages : null)
                }
                minAge={
                  previewingCourseType?.min_age || 
                  courseTypeForm.min_age || 
                  null
                }
                maxAge={
                  previewingCourseType?.max_age || 
                  courseTypeForm.max_age || 
                  null
                }
                status={
                  previewingCourseType?.status ?? 
                  courseTypeForm.status ?? 
                  true
                }
                discountConfigs={
                  previewingCourseType?.discount_configs 
                    ? {
                        packages: (previewingCourseType.discount_configs.packages || []).map(pkg => ({
                          lessons: pkg.lessons,
                          price: pkg.price,
                          name: pkg.title
                        })),
                        trialBundles: (previewingCourseType.discount_configs.trialBundles || []).map(bundle => ({
                          lessons: 1, // 試堂優惠默認為1堂
                          price: bundle.price,
                          name: bundle.title
                        }))
                      }
                    : (courseTypeForm.discount_configs
                        ? {
                            packages: (courseTypeForm.discount_configs.packages || []).map(pkg => ({
                              lessons: pkg.lessons,
                              price: pkg.price,
                              name: pkg.title
                            })),
                            trialBundles: (courseTypeForm.discount_configs.trialBundles || []).map(bundle => ({
                              lessons: 1, // 試堂優惠默認為1堂
                              price: bundle.price,
                              name: bundle.title
                            }))
                          }
                        : null)
                }
                showEnrollButton={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

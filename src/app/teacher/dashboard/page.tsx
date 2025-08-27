'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ActivityForm from '@/components/admin/ActivityForm';
import TeachingActivityDetailModal from '@/components/ui/TeachingActivityDetailModal';
import { HanamiInput, HanamiButton } from '@/components/ui';

import { supabase } from '@/lib/supabase';
import { getUserSession, clearUserSession } from '@/lib/authUtils';
import TodayLessonsPanel from '@/components/ui/TodayLessonsPanel';
import { SimpleAbilityAssessmentModal, StudentTreeAssignmentModal, HanamiCard } from '@/components/ui';
import Calendarui from '@/components/ui/Calendarui';
import { PopupSelect } from '@/components/ui/PopupSelect';
import AbilityLevelManager from '@/components/admin/AbilityLevelManager';
import AbilityCategoryManager from '@/components/admin/AbilityCategoryManager';
import AbilityEditModal from '@/components/admin/AbilityEditModal';

interface Student {
  id: string;
  full_name: string;
  nick_name: string | null;
  student_age: number | null;
  course_type: string | null;
  regular_timeslot: string | null;
  regular_weekday: number | null;
  remaining_lessons?: number;
}

interface Lesson {
  id: string;
  lesson_date: string;
  lesson_status: string | null;
  full_name: string | null;
  course_type: string | null;
  lesson_activities: string | null;
  progress_notes: string | null;
  video_url: string | null;
  actual_timeslot: string | null;
  student_id: string;
  student_age: number | null;
}

interface TeacherSchedule {
  id: string;
  teacher_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface StudentProgress {
  student_id: string;
  student_name: string;
  assessment_status: string;
  media_upload_status: string;
  last_assessment_date: string;
  last_media_upload: string;
}

interface StudentWithoutAssessment {
  id: string;
  full_name: string;
  nick_name?: string | null;
  course_type?: string | null;
  last_assessment_date?: string | null;
  lesson_time?: string;
}

interface TeacherProfile {
  id: string;
  teacher_fullname: string | null;
  teacher_nickname: string | null;
  teacher_email: string | null;
  teacher_phone: string | null;
  teacher_address: string | null;
  teacher_dob: string | null;
  teacher_background: string | null;
  teacher_role: string | null;
  teacher_status: string | null;
  teacher_hsalary: number | null;
  teacher_msalary: number | null;
  teacher_bankid: string | null;
  course_roles_note: string | null;
}

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [todayAssessmentDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' }));
  const [todayMediaDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const [teacherData, setTeacherData] = useState<TeacherProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [studentsWithoutAssessment, setStudentsWithoutAssessment] = useState<StudentWithoutAssessment[]>([]);
  const [studentsAssessed, setStudentsAssessed] = useState<StudentWithoutAssessment[]>([]);
  const [studentsNoTree, setStudentsNoTree] = useState<StudentWithoutAssessment[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [hasTodaySchedule, setHasTodaySchedule] = useState(false); // 新增：老師今天是否有課程安排
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedAssessmentDate, setSelectedAssessmentDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' }));
  const [studentProgressExpanded, setStudentProgressExpanded] = useState(false);

  // 學生媒體狀態相關狀態
  const [studentsWithoutMedia, setStudentsWithoutMedia] = useState<StudentWithoutAssessment[]>([]);
  const [studentsWithMedia, setStudentsWithMedia] = useState<StudentWithoutAssessment[]>([]);
  const [loadingMediaStudents, setLoadingMediaStudents] = useState(false);
  const [selectedMediaDate, setSelectedMediaDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' }));
  const [studentMediaExpanded, setStudentMediaExpanded] = useState(false);

  // 日期選擇器狀態
  const [selectedDateType, setSelectedDateType] = useState<'assessment' | 'media'>('assessment');
  
  // 能力評估模態視窗狀態
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedStudentForAssessment, setSelectedStudentForAssessment] = useState<StudentWithoutAssessment | null>(null);

  // 成長樹分配模態視窗狀態
  const [showTreeAssignmentModal, setShowTreeAssignmentModal] = useState(false);
  const [selectedStudentForTreeAssignment, setSelectedStudentForTreeAssignment] = useState<StudentWithoutAssessment | null>(null);

  // 媒體上傳模態視窗狀態
  const [showMediaUploadModal, setShowMediaUploadModal] = useState(false);
  const [selectedStudentForMediaUpload, setSelectedStudentForMediaUpload] = useState<StudentWithoutAssessment | null>(null);
  const [studentMedia, setStudentMedia] = useState<any[]>([]);
  const [studentMediaQuota, setStudentMediaQuota] = useState<any>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // 日期選擇器狀態
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // 個人資料表單狀態
  const [profileForm, setProfileForm] = useState({
    teacher_fullname: '',
    teacher_nickname: '',
    teacher_email: '',
    teacher_phone: '',
    teacher_address: '',
    teacher_dob: '',
    teacher_background: '',
    teacher_bankid: '',
    course_roles_note: '',
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 成長樹管理相關狀態
  const [showAddTreeModal, setShowAddTreeModal] = useState(false);
  const [editingTree, setEditingTree] = useState<any>(null);
  const [trees, setTrees] = useState<any[]>([]);
  const [abilitiesOptions, setAbilitiesOptions] = useState<{ value: string; label: string }[]>([]);
  const [activitiesOptions, setActivitiesOptions] = useState<{ value: string; label: string }[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [teachersOptions, setTeachersOptions] = useState<{ value: string; label: string }[]>([]);
  const [courseTypesOptions, setCourseTypesOptions] = useState<{ value: string; label: string }[]>([]);

  // 成長樹表單狀態
  const [treeForm, setTreeForm] = useState({
    tree_name: '',
    tree_description: '',
    tree_icon: '🌳',
    course_type: '',
    tree_level: 1,
    is_active: true,
  });

  // 學習目標狀態
  const [goals, setGoals] = useState<any[]>([{
    goal_name: '',
    goal_description: '',
    goal_icon: '⭐',
    progress_max: 5,
    required_abilities: [],
    related_activities: [],
    progress_contents: [],
  }]);

  // 目標列表展開狀態
  const [expandedTrees, setExpandedTrees] = useState<Set<string>>(new Set());

  // 刪除確認狀態
  const [deletingTree, setDeletingTree] = useState<string | null>(null);

  // 能力選擇器狀態
  const [showAbilitySelector, setShowAbilitySelector] = useState<{open: boolean, goalIdx: number | null}>({ open: false, goalIdx: null });
  const [abilitySearchText, setAbilitySearchText] = useState('');
  const [abilityTempSelected, setAbilityTempSelected] = useState<string[]>([]);

  // 活動選擇器狀態
  const [showActivitySelector, setShowActivitySelector] = useState<{open: boolean, goalIdx: number | null}>({ open: false, goalIdx: null });
  const [activitySearchText, setActivitySearchText] = useState('');
  const [activityTempSelected, setActivityTempSelected] = useState<string[]>([]);

  // 詳細視窗狀態
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTree, setSelectedTree] = useState<any>(null);
  const [studentsInTree, setStudentsInTree] = useState<any[]>([]);
  
  // 目標展開狀態
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  
  // 成長樹篩選狀態
  const [growthTreeFilters, setGrowthTreeFilters] = useState({
    search: '',
    tree_levels: [] as number[],
    statuses: [] as string[],
    abilities: [] as string[],
    activities: [] as string[],
  });
  
  // 彈出選擇相關狀態
  const [showPopup, setShowPopup] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState<string | string[]>([]);

  // 能力發展管理相關狀態
  const [showAddAbilityModal, setShowAddAbilityModal] = useState(false);
  const [editingAbility, setEditingAbility] = useState<any>(null);
  const [abilities, setAbilities] = useState<any[]>([]);
  const [studentAbilities, setStudentAbilities] = useState<any[]>([]);
  const [abilityStudents, setAbilityStudents] = useState<any[]>([]);
  const [abilityGrowthTrees, setAbilityGrowthTrees] = useState<any[]>([]);
  const [abilityLoading, setAbilityLoading] = useState(true);
  const [abilityError, setAbilityError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLevelManager, setShowLevelManager] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<any>(null);
  
  // 刪除確認狀態
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [abilityToDelete, setAbilityToDelete] = useState<any>(null);

  // 新增能力表單狀態
  const [newAbility, setNewAbility] = useState({
    ability_name: '',
    ability_description: '',
    ability_color: '#FFB6C1',
    max_level: 5,
    category: '',
  });

  const [categories, setCategories] = useState<any[]>([]);

  // 自訂管理相關狀態
  const [showCustomManager, setShowCustomManager] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [customOptions, setCustomOptions] = useState<{ [key: string]: any[] }>({
    ability_categories: [
      { id: 'physical', name: '身體發展', is_default: true },
      { id: 'cognitive', name: '認知發展', is_default: true },
      { id: 'emotional', name: '情緒發展', is_default: true },
      { id: 'language', name: '語言發展', is_default: true },
      { id: 'artistic', name: '藝術發展', is_default: true },
    ],
  });
  const [editingOption, setEditingOption] = useState<{ id: string, name: string, is_default: boolean } | null>(null);
  const [newOptionName, setNewOptionName] = useState('');
  const [isDefaultOption, setIsDefaultOption] = useState(false);

  // 教學活動管理相關狀態
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [showActivityDetailModal, setShowActivityDetailModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [activityTypes, setActivityTypes] = useState<{ value: string; label: string }[]>([]);
  const [activityStatuses, setActivityStatuses] = useState<{ value: string; label: string }[]>([]);



  const [abilityFilters, setAbilityFilters] = useState({
    search: '',
    categories: [] as string[],
    levels: [] as string[],
    growth_trees: [] as string[],
  });

  const [activityFilters, setActivityFilters] = useState({
    search: '',
    types: [] as string[],
    statuses: [] as string[],
    tags: [] as string[],
  });

  // 權限檢查 - 簡化版本
  const permissions = {
    canViewDashboard: true,
    canViewProfile: true,
    canViewGrowthTree: true,
    canViewAbilityDevelopment: true,
    canViewTeachingActivities: true,
    canViewAbilityAssessment: true,
  };

  const { 
    canViewDashboard, 
    canViewProfile, 
    canViewGrowthTree, 
    canViewAbilityDevelopment, 
    canViewTeachingActivities, 
    canViewAbilityAssessment
  } = permissions;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      checkUserSession();
    }
  }, [mounted]);

  // 當 teacherData 載入完成時，初始化 profileForm
  useEffect(() => {
    if (teacherData) {
      console.log('🔄 初始化個人資料表單:', teacherData);
      setProfileForm({
        teacher_fullname: teacherData.teacher_fullname || '',
        teacher_nickname: teacherData.teacher_nickname || '',
        teacher_email: teacherData.teacher_email || '',
        teacher_phone: teacherData.teacher_phone || '',
        teacher_address: teacherData.teacher_address || '',
        teacher_dob: teacherData.teacher_dob || '',
        teacher_background: teacherData.teacher_background || '',
        teacher_bankid: teacherData.teacher_bankid || '',
        course_roles_note: teacherData.course_roles_note || '',
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
  }, [teacherData]);

  // 監聽網路狀態變化
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 網路已連接');
      if (error && error.includes('網路')) {
        setError(null);
        setLoading(true);
        checkUserSession();
      }
    };

    const handleOffline = () => {
      console.log('❌ 網路已中斷');
      setError('網路連接已中斷，請檢查網路連接');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  // 當選擇的評估日期改變時，重新載入需要評估的學生
  useEffect(() => {
    if (teacherData) {
      loadStudentsWithoutAssessment(teacherData);
    }
  }, [teacherData]);

  // 當選擇的媒體日期改變時，重新載入學生媒體狀態
  useEffect(() => {
    if (teacherData) {
      loadStudentsMediaStatus(teacherData);
    }
  }, [teacherData]);

  // 當教師資料載入完成後，在背景載入學生評估狀態
  useEffect(() => {
    if (teacherData && !loadingStudents && studentsWithoutAssessment.length === 0 && studentsAssessed.length === 0 && studentsNoTree.length === 0) {
      // 延遲載入，讓頁面先顯示
      const timer = setTimeout(() => {
        loadStudentsWithoutAssessment(teacherData);
      }, 500); // 延遲0.5秒載入，減少等待時間

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [teacherData]);

  // 當教師資料載入完成後，在背景載入學生媒體狀態
  useEffect(() => {
    if (teacherData && !loadingMediaStudents && studentsWithoutMedia.length === 0 && studentsWithMedia.length === 0) {
      // 延遲載入，讓頁面先顯示
      const timer = setTimeout(() => {
        loadStudentsMediaStatus(teacherData);
      }, 800); // 延遲0.8秒載入，在學生評估狀態之後

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [teacherData]);

  // 當教師資料載入完成後，同步到個人資料表單
  useEffect(() => {
    if (teacherData) {
      setProfileForm({
        teacher_fullname: teacherData.teacher_fullname || '',
        teacher_nickname: teacherData.teacher_nickname || '',
        teacher_email: teacherData.teacher_email || '',
        teacher_phone: teacherData.teacher_phone || '',
        teacher_address: teacherData.teacher_address || '',
        teacher_dob: teacherData.teacher_dob || '',
        teacher_background: teacherData.teacher_background || '',
        teacher_bankid: teacherData.teacher_bankid || '',
        course_roles_note: teacherData.course_roles_note || '',
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
  }, [teacherData]);

  // 當媒體模態視窗打開時載入學生媒體資料
  useEffect(() => {
    if (showMediaUploadModal && selectedStudentForMediaUpload) {
      loadStudentMedia(selectedStudentForMediaUpload.id);
    }
  }, [showMediaUploadModal, selectedStudentForMediaUpload]);

  // 當切換到成長樹管理頁面時載入資料
  useEffect(() => {
    if (activeTab === 'growth-tree' && trees.length === 0) {
      loadGrowthTreeData();
    }
  }, [activeTab, trees.length]);

  useEffect(() => {
    if (activeTab === 'ability-development' && abilities.length === 0) {
      loadAbilityData();
      loadCategories();
      loadCustomOptions();
    }
  }, [activeTab, abilities.length]);

  useEffect(() => {
    if (activeTab === 'teaching-activities') {
      loadActivityOptions();
      loadActivities();
    }
  }, [activeTab]);

  // 監控每個目標的 progress_max 變化
  useEffect(() => {
    setGoals(goals => goals.map(goal => {
      if (!goal.progress_max || goal.progress_max < 1) return { ...goal, progress_contents: [] };
      const max = goal.progress_max;
      let contents = goal.progress_contents || [];
      
      // 如果進度內容陣列長度與最大值不匹配，調整陣列長度
      if (contents.length > max) {
        contents = contents.slice(0, max);
      } else if (contents.length < max) {
        contents = [...contents, ...Array(max - contents.length).fill('')];
      }
      
      return { ...goal, progress_contents: contents };
    }));
  }, [goals.map(g => g.progress_max).join(',')]);

  const checkUserSession = async () => {
    try {
      setLoading(true);
      console.log('🔍 開始檢查用戶會話...');
      
      // 臨時調試：檢查 localStorage 和 cookie
      if (typeof window !== 'undefined') {
        console.log('🏠 檢查 localStorage...');
        const localSession = localStorage.getItem('hanami_user_session');
        console.log('📦 localStorage 內容:', localSession);
        
        console.log('🍪 檢查 cookie...');
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('hanami_user_session='));
        console.log('🍪 session cookie:', sessionCookie);
      }
      
      const session = getUserSession();
      console.log('📋 獲取到的用戶會話:', session);
      console.log('📋 會話類型:', typeof session);
      console.log('📋 會話是否為空:', !session);
      console.log('📋 會話內容:', JSON.stringify(session, null, 2));
      
      if (session && session.id && session.email) {
        console.log('✅ 會話有效，設置用戶會話');
        setUserSession(session);
        console.log('🔄 開始載入教師資料...');
        await loadTeacherData(session); // 直接傳遞會話資料
      } else {
        console.log('❌ 會話無效或缺少必要資訊');
        console.log('❌ 會話ID:', session?.id);
        console.log('❌ 會話Email:', session?.email);
        setError('請先登入');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Session check error:', error);
      setError('會話檢查失敗');
      setLoading(false);
    }
  };

    // 載入教師資料
  const loadTeacherData = async (session: any) => {
    if (!session) {
      console.log('沒有用戶會話，跳過教師資料載入');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('=== 開始載入教師資料 ===');
      console.log('用戶ID:', session.id);
      console.log('用戶Email:', session.email);
      
      // 檢查網路連接
      if (!navigator.onLine) {
        console.error('❌ 網路連接已中斷');
        setError('網路連接已中斷，請檢查網路連接');
        setLoading(false);
        return;
      }
      
      // 查詢教師資料
      console.log('查詢教師資料，使用ID:', session.id);
      const { data: teacherData, error: teacherError } = await supabase
        .from('hanami_employee')
        .select('*')
        .eq('id', session.id)
        .single();

      console.log('用ID查詢結果:', teacherData);
      console.log('查詢錯誤:', teacherError);
      
      if (teacherError) {
        console.error('教師資料查詢錯誤:', teacherError);
        
        // 檢查是否是網路錯誤
        if (
          teacherError instanceof Error &&
          (
            teacherError.message.includes('fetch') ||
            teacherError.message.includes('network') ||
            teacherError.message.includes('ERR_NAME_NOT_RESOLVED') ||
            teacherError.message.includes('ERR_INTERNET_DISCONNECTED')
          )
        ) {
          console.error('❌ 網路連接問題');
          setError('無法連接到資料庫，請檢查網路連接');
          setLoading(false);
          return;
        }
        
        // 如果ID查詢失敗，嘗試用email查詢
        console.log('嘗試用email查詢:', session.email);
        const { data: teacherByEmail, error: emailError } = await supabase
          .from('hanami_employee')
        .select('*')
          .eq('teacher_email', session.email)
          .single();
          
        if (emailError) {
          console.error('用email查詢教師資料也失敗:', emailError);
          
          // 檢查是否是網路錯誤
          if (
            emailError instanceof Error &&
            (
              emailError.message.includes('fetch') ||
              emailError.message.includes('network') ||
              emailError.message.includes('ERR_NAME_NOT_RESOLVED') ||
              emailError.message.includes('ERR_INTERNET_DISCONNECTED')
            )
          ) {
            console.error('❌ 網路連接問題');
            setError('無法連接到資料庫，請檢查網路連接');
            setLoading(false);
            return;
          }
          
          setTeacherData(null);
          setError('無法載入教師資料');
          return;
        }
        
        console.log('用email查詢結果:', teacherByEmail);
        const completeTeacherData: TeacherProfile = {
          ...teacherByEmail,
          course_roles_note: null
        };
        setTeacherData(completeTeacherData);
        // 載入今日課程
        console.log('=== 開始載入今日課程 ===');
        await loadTodayLessons(completeTeacherData);
        console.log('=== 今日課程載入完成 ===');
      } else {
        // ID 查詢成功，設置教師資料
        console.log('ID 查詢成功，設置教師資料');
        const completeTeacherData: TeacherProfile = {
          ...teacherData,
          course_roles_note: null
        };
        setTeacherData(completeTeacherData);
        // 載入今日課程
        console.log('=== 開始載入今日課程 ===');
        await loadTodayLessons(completeTeacherData);
        console.log('=== 今日課程載入完成 ===');
      }
      
    } catch (error) {
      console.error('載入教師資料錯誤:', error);
      
      // 檢查是否是網路錯誤
      if (
        error instanceof Error &&
        (
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('ERR_NAME_NOT_RESOLVED') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED')
        )
      ) {
        console.error('❌ 網路連接問題');
        setError('無法連接到資料庫，請檢查網路連接');
      } else {
        setError('載入教師資料時發生錯誤');
      }
      
      setTeacherData(null);
    } finally {
      console.log('=== 載入完成，設置 loading = false ===');
      setLoading(false);
    }
  };
  // 載入今日課程資料
  const loadTodayLessons = async (teacher: TeacherProfile) => {
    console.log('🚀 loadTodayLessons 函數開始執行');
    
    if (!teacher) {
      console.log('❌ 沒有教師資料，跳過課程載入');
      return;
    }
    
    console.log('✅ 有教師資料，開始查詢課程');
    
    try {
      console.log('📅 開始查詢今日課程...');
      // 使用香港時區獲取今日日期
      const today = new Date().toLocaleDateString('en-CA', { 
        timeZone: 'Asia/Hong_Kong' 
      });
      console.log('📅 今日日期 (香港時區):', today);
      console.log('👨‍🏫 教師暱稱:', teacher.teacher_nickname);
      console.log('🆔 教師ID:', teacher.id);
      console.log('📧 教師Email:', teacher.teacher_email);
      
      // 1. 首先檢查教師今日是否上班
      console.log('👨‍🏫 檢查教師今日是否上班...');
      console.log('📅 查詢教師排程，日期:', today);
      const { data: teacherSchedule, error: scheduleError } = await supabase
        .from('teacher_schedule')
        .select('*')
        .eq('teacher_id', teacher.id)
        .eq('scheduled_date', today);
      
      if (scheduleError) {
        console.error('❌ 查詢教師排程錯誤:', scheduleError);
        return;
      }
      
      console.log('📅 教師今日排程:', teacherSchedule);
      
      // 如果教師今日沒有上班，直接返回
      if (!teacherSchedule || teacherSchedule.length === 0) {
        console.log('❌ 教師今日沒有上班');
        setTodayLessons([]);
        return;
      }
      
      console.log('✅ 教師今日有上班，開始查詢課程');
      
      // 2. 查詢 hanami_student_lesson 表中的實際課程記錄
      console.log('📚 查詢 hanami_student_lesson 表...');
      console.log('📅 查詢課程記錄，日期:', today);
      const { data: lessonRecords, error: lessonError } = await supabase
        .from('hanami_student_lesson')
        .select(`
          id,
          lesson_date,
          lesson_status,
          actual_timeslot,
          lesson_activities,
          progress_notes,
          video_url,
          student_id,
          lesson_teacher
        `)
        .eq('lesson_date', today);
    
      let studentsMap = new Map(); 
    
      if (lessonError) {
        console.error('❌ 查詢課程記錄錯誤:', lessonError);
        console.error('❌ 錯誤詳情:', JSON.stringify(lessonError, null, 2));
      } else {
        console.log('✅ 所有課程記錄查詢結果:', lessonRecords);
        
        // 如果有課程記錄，再查詢學生資料
        if (lessonRecords && lessonRecords.length > 0) {
          const studentIds = lessonRecords.map(record => record.student_id);
          console.log('📋 需要查詢的學生ID:', studentIds);
          
          // 調試：檢查課程記錄中的 lesson_teacher 字段
          console.log('🔍 調試：檢查課程記錄中的 lesson_teacher 字段');
          lessonRecords.forEach((record, index) => {
            console.log(`📝 課程 ${index + 1}:`, {
              id: record.id,
              lesson_teacher: record.lesson_teacher,
              actual_timeslot: record.actual_timeslot,
              student_id: record.student_id
            });
          });
          
          // 調試：顯示教師資訊用於比對
          console.log('👨‍🏫 教師資訊用於比對:', {
            teacher_nickname: teacher.teacher_nickname,
            teacher_email: teacher.teacher_email,
            teacher_id: teacher.id
          });
          
          // 調試：顯示所有不同的 lesson_teacher 值
          const uniqueLessonTeachers = [...new Set(lessonRecords.map(r => r.lesson_teacher).filter(Boolean))];
          console.log('📋 所有不同的 lesson_teacher 值:', uniqueLessonTeachers);
          
          const { data: studentsData, error: studentsError } = await supabase
            .from('Hanami_Students')
            .select('id, full_name, nick_name, student_age, course_type, student_teacher, regular_timeslot')
            .in('id', studentIds.filter((id): id is string => !!id));
            
          if (studentsError) {
            console.error('❌ 查詢學生資料錯誤:', studentsError);
          } else {
            console.log('✅ 學生資料查詢結果:', studentsData);
            
            // 調試：檢查學生資料中的 student_teacher 字段
            console.log('🔍 調試：檢查學生資料中的 student_teacher 字段');
            studentsData?.forEach((student, index) => {
              console.log(`👤 學生 ${index + 1}:`, {
                id: student.id,
                full_name: student.full_name,
                nick_name: student.nick_name,
                student_teacher: student.student_teacher
              });
            });
            
            // 調試：顯示所有不同的 student_teacher 值
            const uniqueStudentTeachers = [...new Set(studentsData?.map(s => s.student_teacher).filter(Boolean))];
            console.log('📋 所有不同的 student_teacher 值:', uniqueStudentTeachers);
            
            // 創建學生資料映射
            studentsMap = new Map();
            studentsData?.forEach(student => {
              studentsMap.set(student.id, student);
            });
            
            // 篩選該教師的課程
            const teacherLessons = lessonRecords.filter(record => {
              const isMatch = record.lesson_teacher === teacher.teacher_nickname ||
                             record.lesson_teacher === teacher.teacher_email ||
                             record.lesson_teacher === teacher.id;
              console.log(`🔍 課程 ${record.id} 匹配檢查:`, {
                lesson_teacher: record.lesson_teacher,
                teacher_nickname: teacher.teacher_nickname,
                teacher_email: teacher.teacher_email,
                teacher_id: teacher.id,
                isMatch: isMatch
              });
              return isMatch;
            });
            console.log('👨‍🏫 該教師的課程記錄:', teacherLessons);
            
            // 如果沒有找到課程，嘗試根據學生的教師資訊篩選
            if (teacherLessons.length === 0) {
              console.log('🔄 嘗試根據學生的教師資訊篩選課程...');
              const teacherLessonsByStudent = lessonRecords.filter(record => {
                const studentData = studentsMap.get(record.student_id);
                const isMatch = studentData && (
                  studentData.student_teacher === teacher.teacher_nickname ||
                  studentData.student_teacher === teacher.teacher_email ||
                  studentData.student_teacher === teacher.id
                );
                console.log(`🔍 課程 ${record.id} 學生教師匹配檢查:`, {
                  student_id: record.student_id,
                  student_teacher: studentData?.student_teacher,
                  teacher_nickname: teacher.teacher_nickname,
                  teacher_email: teacher.teacher_email,
                  teacher_id: teacher.id,
                  isMatch: isMatch
                });
                return isMatch;
              });
              console.log('👨‍🏫 根據學生教師資訊篩選的課程記錄:', teacherLessonsByStudent);
              
              // 使用根據學生教師資訊篩選的結果
              if (teacherLessonsByStudent.length > 0) {
                teacherLessons.push(...teacherLessonsByStudent);
              }
            }
          }
        }
      }
    
      // 3. 查詢 hanami_trial_students 表中的試聽學生課程
      console.log('🎯 查詢 hanami_trial_students 表...');
      console.log('📅 查詢試聽學生，日期:', today);
      const { data: trialRecords, error: trialError } = await supabase
        .from('hanami_trial_students')
        .select(`
          id,
          lesson_date,
          actual_timeslot,
          full_name,
          nick_name,
          student_age,
          course_type,
          trial_status,
          student_teacher
        `)
        .eq('lesson_date', today);
    
      if (trialError) {
        console.error('❌ 查詢試聽學生錯誤:', trialError);
      } else {
        console.log('✅ 所有試聽學生查詢結果:', trialRecords);
        // 篩選該教師的試聽學生
        const teacherTrials = trialRecords?.filter(record => 
          record.student_teacher === teacher.teacher_nickname ||
          record.student_teacher === teacher.teacher_email ||
          record.student_teacher === teacher.id
        ) || [];
        console.log('👨‍🏫 該教師的試聽學生:', teacherTrials);
      }
    
      // 4. 如果沒有找到課程，嘗試查詢基於排程的學生
      console.log('📋 嘗試查詢基於排程的學生...');
      // 使用香港時區計算今日週幾
      const hongKongDate = new Date().toLocaleString('en-US', { 
        timeZone: 'Asia/Hong_Kong'
      });
      const todayWeekdayNum = new Date(hongKongDate).getDay();
      console.log('📅 今日週幾 (香港時區):', todayWeekdayNum);
      
                 const { data: scheduledStudents, error: studentScheduleError } = await supabase
             .from('Hanami_Students')
             .select(`
               id,
               full_name,
               nick_name,
               student_age,
               course_type,
               regular_timeslot,
               regular_weekday,
               student_teacher
             `)
             .eq('regular_weekday', todayWeekdayNum);
    
      if (studentScheduleError) {
        console.error('❌ 查詢排程學生錯誤:', studentScheduleError);
      } else {
        console.log('✅ 今日有排程的所有學生:', scheduledStudents);
        // 篩選該教師的學生
        const teacherScheduledStudents = scheduledStudents?.filter(student => 
          student.student_teacher === teacher.teacher_nickname ||
          student.student_teacher === teacher.teacher_email ||
          student.student_teacher === teacher.id
        ) || [];
        console.log('👨‍🏫 該教師今日有排程的學生:', teacherScheduledStudents);
      }
    
      // 5. 合併課程資料
      const allLessons: any[] = [];
    
      // 處理正式學生課程記錄 - 教師今日上班，顯示所有今日的課程
      if (lessonRecords && lessonRecords.length > 0) {
        console.log('🎯 教師今日有上班，顯示所有今日的課程記錄');
        
        // 篩選今日的課程記錄
        const todayLessons = lessonRecords.filter(record => {
          const isToday = record.lesson_date === today;
          console.log('🔍 檢查課程日期:', {
            record_id: record.id,
            lesson_date: record.lesson_date,
            today: today,
            isToday: isToday
          });
          return isToday;
        });
        
        console.log('📅 今日課程記錄數量:', todayLessons.length);
        
        todayLessons.forEach(record => {
          const studentData = studentsMap?.get(record.student_id);
          console.log('🔍 處理今日課程記錄:', {
            record_id: record.id,
            student_id: record.student_id,
            studentData: studentData,
            full_name: studentData?.full_name,
            nick_name: studentData?.nick_name,
            course_type: studentData?.course_type,
            student_age: studentData?.student_age,
            actual_timeslot: record.actual_timeslot
          });
          
          allLessons.push({
            id: record.id,
            lesson_date: record.lesson_date,
            lesson_status: record.lesson_status,
            actual_timeslot: record.actual_timeslot,
            course_type: studentData?.course_type || '未設定課程',
            full_name: studentData?.full_name || studentData?.nick_name || '未命名學生',
            student_id: record.student_id,
            student_age: studentData?.student_age,
            lesson_activities: record.lesson_activities,
            progress_notes: record.progress_notes,
            video_url: record.video_url,
            lesson_teacher: record.lesson_teacher,
            student_teacher: studentData?.student_teacher,
          });
        });
      }
    
      // 處理試聽學生課程記錄 - 教師今日上班，顯示所有今日的試聽學生
      if (trialRecords && trialRecords.length > 0) {
        console.log('🎯 處理試聽學生記錄');
        
        // 篩選今日的試聽學生
        const todayTrials = trialRecords.filter(record => {
          const isToday = record.lesson_date === today;
          console.log('🔍 檢查試聽學生日期:', {
            record_id: record.id,
            lesson_date: record.lesson_date,
            today: today,
            isToday: isToday
          });
          return isToday;
        });
        
        console.log('📅 今日試聽學生數量:', todayTrials.length);
        
        todayTrials.forEach(record => {
          allLessons.push({
            id: `trial-${record.id}`,
            lesson_date: record.lesson_date,
            lesson_status: record.trial_status || 'scheduled',
            actual_timeslot: record.actual_timeslot || '未設定時間',
            course_type: record.course_type || '試聽課程',
            full_name: record.full_name || record.nick_name || '未命名學生',
            student_id: `trial-${record.id}`,
            student_age: record.student_age,
            lesson_activities: null,
            progress_notes: null,
            video_url: null,
            lesson_teacher: null,
            student_teacher: record.student_teacher,
          });
        });
      }
    
            // 如果沒有課程記錄，使用排程學生 - 教師今日上班，顯示所有今日有排程的學生
      if (allLessons.length === 0 && scheduledStudents && scheduledStudents.length > 0) {
        console.log('🎯 使用排程學生作為備用');
        
        // 篩選今日有排程的學生
        const todayScheduledStudents = scheduledStudents.filter(student => {
          const hasSchedule = student.regular_weekday === todayWeekdayNum;
          console.log('🔍 檢查學生排程:', {
            student_id: student.id,
            student_name: student.full_name,
            regular_weekday: student.regular_weekday,
            todayWeekday: todayWeekdayNum,
            hasSchedule: hasSchedule
          });
          return hasSchedule;
        });
        
        console.log('📅 今日有排程的學生數量:', todayScheduledStudents.length);
        
        todayScheduledStudents.forEach(student => {
          allLessons.push({
            id: `schedule-${student.id}`,
            lesson_date: today,
            lesson_status: 'scheduled',
            actual_timeslot: student.regular_timeslot || '未設定時間',
            course_type: student.course_type || '未設定課程',
            full_name: student.full_name || student.nick_name || '未命名學生',
            student_id: student.id,
            student_age: student.student_age,
            lesson_activities: null,
            progress_notes: null,
            video_url: null,
            lesson_teacher: null,
            student_teacher: student.student_teacher,
          });
        });
      }
    
      console.log('🎯 最終合併後的課程資料:', allLessons);
      console.log('📊 課程數量:', allLessons.length);
      setTodayLessons(allLessons);
      console.log('✅ loadTodayLessons 函數執行完成');

    } catch (error) {
      console.error('❌ 載入今日課程錯誤:', error);
      setTodayLessons([]);
    }
  };

  // 載入需要評估的學生
  const loadStudentsWithoutAssessment = async (teacher: TeacherProfile) => {
    if (!teacher) {
      console.log('沒有教師資料，跳過學生評估狀態載入');
      return;
    }

    try {
      setLoadingStudents(true);
      console.log('=== 開始載入學生評估狀態 ===');
      console.log('教師ID:', teacher.id);
      console.log('教師Email:', teacher.teacher_email);

      // 首先檢查老師今天是否有排程
      const { data: teacherScheduleData, error: scheduleError } = await supabase
        .from('teacher_schedule')
        .select('*')
        .eq('teacher_id', teacher.id)
        .eq('scheduled_date', todayAssessmentDate);

      if (scheduleError) {
        console.error('檢查老師排程失敗:', scheduleError);
        throw scheduleError;
      }

      // 檢查老師今天是否有上班
      const hasSchedule = teacherScheduleData && teacherScheduleData.length > 0;
      setHasTodaySchedule(hasSchedule);
      console.log('老師今天是否有上班:', hasSchedule, '排程數量:', teacherScheduleData?.length || 0);

      if (!hasSchedule) {
        console.log('老師今天沒有上班，跳過學生資料載入');
        setStudentsWithoutAssessment([]);
        setStudentsAssessed([]);
        setStudentsNoTree([]);
        return;
      }

      // 優化：一次性獲取所有需要的數據，減少數據庫請求次數
      const [
        { data: todayLessonsData, error: todayLessonsError },
        { data: allAssessmentsData, error: allAssessmentsError },
        { data: studentTreesData, error: studentTreesError }
      ] = await Promise.all([
        // 1. 獲取選擇日期有上課的學生和時間
        supabase
          .from('hanami_student_lesson')
          .select('student_id, actual_timeslot')
          .eq('lesson_date', todayAssessmentDate)
          .order('actual_timeslot', { ascending: true }),
        
        // 2. 獲取所有學生的評估記錄（用於最後評估日期）
        supabase
          .from('hanami_ability_assessments')
          .select('student_id, assessment_date')
          .order('assessment_date', { ascending: false }),
        
        // 3. 獲取學生的成長樹分配資訊
        supabase
          .from('hanami_student_trees')
          .select('student_id, tree_id, status')
          .eq('status', 'active')
      ]);

      if (todayLessonsError) throw todayLessonsError;
      if (allAssessmentsError) throw allAssessmentsError;
      if (studentTreesError) throw studentTreesError;
      
      // 獲取選擇日期有上課的學生ID列表（保持時間順序）
      const todayStudentIds = [...new Set((todayLessonsData || []).map(lesson => lesson.student_id).filter((id): id is string => id !== null))];
      
      console.log('當日有課程的學生數量:', todayStudentIds.length);
      
      if (todayStudentIds.length > 0) {
        // 獲取這些學生的詳細資訊
        const { data: studentsData, error: studentsError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, nick_name, course_type')
          .in('id', todayStudentIds);

        if (studentsError) throw studentsError;
        
        // 建立映射表以提高查詢效率
        const lessonTimeMap = new Map();
        (todayLessonsData || []).forEach(lesson => {
          lessonTimeMap.set(lesson.student_id, lesson.actual_timeslot);
        });
        
        const studentTreeMap = new Map();
        (studentTreesData || []).forEach(item => {
          studentTreeMap.set(item.student_id, item.tree_id);
        });
        
        // 建立學生最後評估日期映射
        const lastAssessmentMap = new Map();
        (allAssessmentsData || []).forEach(assessment => {
          if (!lastAssessmentMap.has(assessment.student_id)) {
            lastAssessmentMap.set(assessment.student_id, assessment.assessment_date);
          }
        });
        
        // 獲取選擇日期有評估記錄的學生ID列表
        const todayAssessedStudentIds = new Set(
          (allAssessmentsData || [])
            .filter(assessment => assessment.assessment_date === todayAssessmentDate)
            .map(assessment => assessment.student_id)
        );
        
        // 分類學生
        const categorizedStudents = {
          assessed: [] as StudentWithoutAssessment[],
          unassessed: [] as StudentWithoutAssessment[],
          noTree: [] as StudentWithoutAssessment[]
        };
        
        // 處理每個學生（使用緩存的數據，避免重複查詢）
        for (const student of studentsData || []) {
          const studentWithData = {
            ...student,
            last_assessment_date: lastAssessmentMap.get(student.id) || null,
            lesson_time: lessonTimeMap.get(student.id) || ''
          };
          
          // 檢查是否有成長樹
          const hasTree = studentTreeMap.has(student.id);
          
          // 檢查今天是否已評估
          const isAssessedToday = todayAssessedStudentIds.has(student.id);
          
          if (isAssessedToday) {
            // 已評估
            categorizedStudents.assessed.push(studentWithData);
          } else if (hasTree) {
            // 未評估但有成長樹
            categorizedStudents.unassessed.push(studentWithData);
          } else {
            // 未分配成長樹
            categorizedStudents.noTree.push(studentWithData);
          }
        }
        
        // 按上課時間排序每個類別
        const sortByTime = (a: StudentWithoutAssessment, b: StudentWithoutAssessment) => {
          const timeA = a.lesson_time || '';
          const timeB = b.lesson_time || '';
          return timeA.localeCompare(timeB);
        };
        
        categorizedStudents.assessed.sort(sortByTime);
        categorizedStudents.unassessed.sort(sortByTime);
        categorizedStudents.noTree.sort(sortByTime);
        
        setStudentsWithoutAssessment(categorizedStudents.unassessed);
        setStudentsAssessed(categorizedStudents.assessed);
        setStudentsNoTree(categorizedStudents.noTree);
        
      } else {
        setStudentsWithoutAssessment([]);
        setStudentsAssessed([]);
        setStudentsNoTree([]);
      }
    } catch (error) {
      console.error('載入需要評估的學生時發生錯誤:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 載入學生媒體狀態
  const loadStudentsMediaStatus = async (teacher: TeacherProfile) => {
    if (!teacher) {
      console.log('沒有教師資料，跳過學生媒體狀態載入');
      return;
    }

    try {
      setLoadingMediaStudents(true);
      console.log('=== 開始載入學生媒體狀態 ===');
      console.log('教師ID:', teacher.id);
      console.log('教師Email:', teacher.teacher_email);

      // 首先檢查老師今天是否有排程
      const { data: teacherScheduleData, error: scheduleError } = await supabase
        .from('teacher_schedule')
        .select('*')
        .eq('teacher_id', teacher.id)
        .eq('scheduled_date', todayMediaDate);

      if (scheduleError) {
        console.error('檢查老師排程失敗:', scheduleError);
        throw scheduleError;
      }

      // 檢查老師今天是否有上班
      const hasSchedule = teacherScheduleData && teacherScheduleData.length > 0;
      setHasTodaySchedule(hasSchedule);
      console.log('老師今天是否有上班（媒體狀態）:', hasSchedule, '排程數量:', teacherScheduleData?.length || 0);

      if (!hasSchedule) {
        console.log('老師今天沒有上班，跳過媒體狀態載入');
        setStudentsWithMedia([]);
        setStudentsWithoutMedia([]);
        return;
      }

      // 優化：一次性獲取所有需要的數據，減少數據庫請求次數
      const [
        { data: todayLessonsData, error: todayLessonsError },
        { data: allMediaData, error: allMediaError }
      ] = await Promise.all([
        // 1. 獲取選擇日期有上課的學生和時間
        supabase
          .from('hanami_student_lesson')
          .select('student_id, actual_timeslot')
          .eq('lesson_date', todayMediaDate)
          .order('actual_timeslot', { ascending: true }),
        
        // 2. 獲取所有學生的媒體記錄（用於最後上傳日期）
        supabase
          .from('hanami_student_media')
          .select('student_id, created_at')
          .order('created_at', { ascending: false })
      ]);

      if (todayLessonsError) throw todayLessonsError;
      if (allMediaError) throw allMediaError;
      
      // 獲取選擇日期有上課的學生ID列表（保持時間順序）
      const todayStudentIds = [...new Set((todayLessonsData || []).map(lesson => lesson.student_id).filter((id): id is string => id !== null))];
      
      console.log('當日有課程的學生數量（媒體狀態）:', todayStudentIds.length);
      
      if (todayStudentIds.length > 0) {
        // 獲取這些學生的詳細資訊
        const { data: studentsData, error: studentsError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, nick_name, course_type')
          .in('id', todayStudentIds);

        if (studentsError) throw studentsError;
        
        // 建立映射表以提高查詢效率
        const lessonTimeMap = new Map();
        (todayLessonsData || []).forEach(lesson => {
          lessonTimeMap.set(lesson.student_id, lesson.actual_timeslot);
        });
        
        // 建立學生最後媒體上傳日期映射
        const lastMediaMap = new Map();
        (allMediaData || []).forEach(media => {
          if (!lastMediaMap.has(media.student_id)) {
            lastMediaMap.set(media.student_id, media.created_at);
          }
        });
        
        // 獲取選擇日期有媒體上傳的學生ID列表
        const todayMediaStudentIds = new Set(
          (allMediaData || [])
            .filter(media => media.created_at.startsWith(todayMediaDate))
            .map(media => media.student_id)
        );
        
        // 分類學生
        const categorizedStudents = {
          withMedia: [] as StudentWithoutAssessment[],
          withoutMedia: [] as StudentWithoutAssessment[]
        };
        
        // 處理每個學生（使用緩存的數據，避免重複查詢）
        for (const student of studentsData || []) {
          const studentWithData = {
            ...student,
            last_assessment_date: lastMediaMap.get(student.id) || null,
            lesson_time: lessonTimeMap.get(student.id) || ''
          };
          
          // 檢查今天是否已上傳媒體
          const hasMediaToday = todayMediaStudentIds.has(student.id);
          
          if (hasMediaToday) {
            // 已上傳媒體
            categorizedStudents.withMedia.push(studentWithData);
          } else {
            // 未上傳媒體
            categorizedStudents.withoutMedia.push(studentWithData);
          }
        }
        
        // 按上課時間排序每個類別
        const sortByTime = (a: StudentWithoutAssessment, b: StudentWithoutAssessment) => {
          const timeA = a.lesson_time || '';
          const timeB = b.lesson_time || '';
          return timeA.localeCompare(timeB);
        };
        
        categorizedStudents.withMedia.sort(sortByTime);
        categorizedStudents.withoutMedia.sort(sortByTime);
        
        setStudentsWithMedia(categorizedStudents.withMedia);
        setStudentsWithoutMedia(categorizedStudents.withoutMedia);
        
      } else {
        setStudentsWithMedia([]);
        setStudentsWithoutMedia([]);
      }
    } catch (error) {
      console.error('載入學生媒體狀態時發生錯誤:', error);
    } finally {
      setLoadingMediaStudents(false);
    }
  };
  // 處理能力評估提交
  // 載入學生媒體資料
  const loadStudentMedia = async (studentId: string) => {
    if (!studentId) return;
    
    setLoadingMedia(true);
    try {
      // 並行載入媒體檔案和配額資訊
      const [mediaResponse, quotaResponse] = await Promise.all([
        supabase
          .from('hanami_student_media')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('hanami_student_media_quota')
          .select('*')
          .eq('student_id', studentId)
          .single()
      ]);

      if (mediaResponse.error) throw mediaResponse.error;
      if (quotaResponse.error && quotaResponse.error.code !== 'PGRST116') throw quotaResponse.error;

      setStudentMedia(mediaResponse.data || []);
      setStudentMediaQuota(quotaResponse.data || {
        student_id: studentId,
        plan_type: 'free',
        video_limit: 5,
        photo_limit: 10,
        video_count: 0,
        photo_count: 0,
        total_used_space: 0,
        storage_limit_bytes: 262144000
      });
    } catch (error) {
      console.error('載入學生媒體資料失敗:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  // 檔案上傳處理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  // 檔案上傳到 Supabase Storage
  const uploadFiles = async () => {
    if (!selectedFiles.length || !selectedStudentForMediaUpload) return;

    setUploadingFiles(true);
    const uploadPromises = selectedFiles.map(async (file) => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedStudentForMediaUpload.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // 上傳到 Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('student-media')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 獲取檔案 URL
        const { data: urlData } = supabase.storage
          .from('student-media')
          .getPublicUrl(fileName);

        // 判斷媒體類型
        const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';

        // 插入資料庫記錄
        const { data: mediaData, error: mediaError } = await supabase
          .from('hanami_student_media')
          .insert({
            student_id: selectedStudentForMediaUpload.id,
            media_type: mediaType,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            title: file.name,
            uploaded_by: teacherData?.teacher_email || 'teacher'
          })
          .select()
          .single();

        if (mediaError) throw mediaError;

        return { success: true, data: mediaData };
      } catch (error) {
        console.error('檔案上傳失敗:', error);
        return { success: false, error };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(r => r.success).length;
    
    if (successCount > 0) {
      // 重新載入媒體資料
      await loadStudentMedia(selectedStudentForMediaUpload.id);
      setSelectedFiles([]);
    }

    setUploadingFiles(false);
  };

  // 刪除媒體檔案
  const deleteMedia = async (mediaId: string, filePath: string) => {
    try {
      // 刪除 Storage 中的檔案
      await supabase.storage
        .from('student-media')
        .remove([filePath]);

      // 刪除資料庫記錄
      const { error } = await supabase
        .from('hanami_student_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      // 重新載入媒體資料
      if (selectedStudentForMediaUpload) {
        await loadStudentMedia(selectedStudentForMediaUpload.id);
      }
    } catch (error) {
      console.error('刪除媒體檔案失敗:', error);
    }
  };

  // 切換收藏狀態
  const toggleFavorite = async (mediaId: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('hanami_student_media')
        .update({ is_favorite: !currentFavorite })
        .eq('id', mediaId);

      if (error) throw error;

      // 重新載入媒體資料
      if (selectedStudentForMediaUpload) {
        await loadStudentMedia(selectedStudentForMediaUpload.id);
      }
    } catch (error) {
      console.error('切換收藏狀態失敗:', error);
    }
  };
  // 格式化檔案大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化時間
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

          const handleAssessmentSubmit = async (assessment: any) => {
          console.log('=== handleAssessmentSubmit 函數被調用 ===');
          console.log('傳入的 assessment 參數:', assessment);
          
          try {
            console.log('提交能力評估:', assessment);
      
                   // 準備 API 調用的資料格式
             const apiData = {
               student_id: assessment.student_id,
               tree_id: assessment.tree_id,
               assessment_date: assessment.assessment_date,
               lesson_date: assessment.lesson_date,
               teacher_id: assessment.teacher_id,
               ability_assessments: assessment.ability_assessments || {},
               overall_performance_rating: assessment.overall_performance_rating || 3,
               general_notes: assessment.general_notes || '',
               next_lesson_focus: assessment.next_lesson_focus || '',
               goals: assessment.goals || []
             };

      console.log('準備的 API 資料:', apiData);
      console.log('goals 數量:', apiData.goals.length);
      apiData.goals.forEach((goal: any, index: number) => {
        console.log(`目標 ${index + 1}:`, {
          goal_id: goal.goal_id,
          assessment_mode: goal.assessment_mode,
          progress_level: goal.progress_level,
          selected_levels: goal.selected_levels
        });
      });

      // 調用 API
      console.log('調用 API...');
      const response = await fetch('/api/student-ability-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      console.log('API 回應狀態:', response.status);
      const result = await response.json();
      console.log('API 回應:', result);

      if (result.success) {
        console.log('✅ API 調用成功');
        console.log('能力評估記錄儲存成功:', result.data);
        
        // 顯示成功訊息
        alert('能力評估已成功提交！');
        
        // 關閉模態視窗
        setShowAssessmentModal(false);
        setSelectedStudentForAssessment(null);
        
        // 重新載入需要評估的學生列表
        loadStudentsWithoutAssessment(selectedTree);
        
      } else {
        console.error('❌ API 調用失敗:', result.error);
        throw new Error('儲存能力評估記錄失敗: ' + result.error);
      }
      
    } catch (error) {
      console.error('提交能力評估失敗:', error);
      alert('提交失敗: ' + (error as Error).message);
    }
  };

  const handleLogout = async () => {
    clearUserSession();
    window.location.href = '/teacher/login';
  };

  // 處理表單欄位變更
  const handleProfileChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 儲存個人資料
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);

      // 驗證密碼
      if (profileForm.new_password || profileForm.confirm_password || profileForm.old_password) {
        // 檢查是否輸入舊密碼
        if (!profileForm.old_password) {
          setSaveMessage({ type: 'error', text: '請輸入舊密碼' });
          return;
        }

        // 驗證舊密碼
        if (!teacherData?.id) {
          setSaveMessage({ type: 'error', text: '教師資料不完整，無法驗證密碼' });
          return;
        }
        const { data: currentTeacher, error: verifyError } = await supabase
          .from('hanami_employee')
          .select('teacher_password')
          .eq('id', teacherData.id)
          .single();

        if (verifyError) {
          setSaveMessage({ type: 'error', text: '驗證舊密碼時發生錯誤' });
          return;
        }

        if (currentTeacher?.teacher_password !== profileForm.old_password) {
          setSaveMessage({ type: 'error', text: '舊密碼不正確' });
          return;
        }

        // 驗證新密碼
        if (profileForm.new_password !== profileForm.confirm_password) {
          setSaveMessage({ type: 'error', text: '新密碼和確認密碼不一致' });
          return;
        }
        if (profileForm.new_password.length < 6) {
          setSaveMessage({ type: 'error', text: '密碼長度至少需要6個字符' });
          return;
        }
      }

      // 準備更新資料
      const updateData: any = {
        teacher_fullname: profileForm.teacher_fullname,
        teacher_nickname: profileForm.teacher_nickname,
        teacher_email: profileForm.teacher_email,
        teacher_phone: profileForm.teacher_phone,
        teacher_address: profileForm.teacher_address,
        teacher_background: profileForm.teacher_background,
        teacher_bankid: profileForm.teacher_bankid,
        course_roles_note: profileForm.course_roles_note,
      };

      // 如果有生日資料，轉換格式
      if (profileForm.teacher_dob) {
        updateData.teacher_dob = profileForm.teacher_dob;
      }

      // 如果有新密碼，添加密碼更新
      if (profileForm.new_password) {
        updateData.teacher_password = profileForm.new_password;
      }

      console.log('準備更新教師資料:', updateData);

      // 更新資料庫
      if (!teacherData || !teacherData.id) {
        setSaveMessage({ type: 'error', text: '教師資料不完整，無法更新' });
        return;
      }
      const { data, error } = await supabase
        .from('hanami_employee')
        .update(updateData)
        .eq('id', teacherData.id)
        .select()
        .single();

      if (error) {
        console.error('更新教師資料錯誤:', error);
        setSaveMessage({ type: 'error', text: `更新失敗: ${error.message}` });
        return;
      }

      console.log('更新成功:', data);

      // 更新本地狀態
      setTeacherData({
        ...data,
        course_roles_note: null
      });
      
      // 清空密碼欄位
      setProfileForm(prev => ({
        ...prev,
        old_password: '',
        new_password: '',
        confirm_password: ''
      }));

      // 顯示成功彈出提示
      setShowSuccessModal(true);

      // 清除錯誤訊息
      setSaveMessage(null);

    } catch (error) {
      console.error('儲存個人資料錯誤:', error);
      setSaveMessage({ type: 'error', text: '儲存失敗，請稍後再試' });
    } finally {
      setSaving(false);
    }
  };

  // 成長樹管理相關函數
  const handleAddTree = async (treeData: any, goals: any[]) => {
    try {
      console.log('開始新增成長樹:', treeData);
      console.log('目標資料:', goals);
      
      // 1. 新增成長樹
      const { data: treeInsert, error: treeError } = await supabase
        .from('hanami_growth_trees')
        .insert([{
          tree_name: treeData.tree_name,
          tree_description: treeData.tree_description,
          tree_icon: treeData.tree_icon,
          course_type_id: treeData.course_type,
          tree_level: treeData.tree_level,
          is_active: true,
        }])
        .select()
        .single();
      
      if (treeError) {
        console.error('新增成長樹失敗:', treeError);
        throw treeError;
      }
      
      console.log('成長樹新增成功:', treeInsert);
      const treeId = treeInsert.id;
      
      // 2. 新增所有目標
      if (goals && goals.length > 0) {
        const goalsInsert = goals.map((g, idx) => {
          const progressContents = Array.isArray(g.progress_contents) 
            ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
            : [];
          
          return {
            tree_id: treeId,
            goal_name: g.goal_name,
            goal_description: g.goal_description,
            goal_icon: g.goal_icon,
            goal_order: idx + 1,
            is_achievable: true,
            is_completed: false,
            progress_max: Number(g.progress_max) || 5,
            required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
            related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
            progress_contents: progressContents,
          };
        });
        
        const { data: goalsData, error: goalsError } = await supabase
          .from('hanami_growth_goals')
          .insert(goalsInsert)
          .select();
          
        if (goalsError) {
          console.error('新增目標失敗:', goalsError);
          throw goalsError;
        }
        
        console.log('目標新增成功:', goalsData);
      }
      
      // 3. 重新載入資料
      await loadGrowthTreeData();
      
      console.log('新增完成，關閉模態框');
      setShowAddTreeModal(false);
    } catch (error) {
      console.error('新增成長樹失敗:', error);
    }
  };

  const handleUpdateTree = async (treeData: any, goals: any[]) => {
    try {
      console.log('開始更新成長樹:', treeData);
      console.log('目標資料:', goals);
      
      if (!editingTree) {
        throw new Error('沒有要編輯的成長樹');
      }
      
      // 1. 更新成長樹
      const { error: treeError } = await supabase
        .from('hanami_growth_trees')
        .update({
          tree_name: treeData.tree_name,
          tree_description: treeData.tree_description,
          tree_icon: treeData.tree_icon,
          course_type_id: treeData.course_type,
          tree_level: treeData.tree_level,
          is_active: treeData.is_active,
        })
        .eq('id', editingTree.id);
      
      if (treeError) {
        console.error('更新成長樹失敗:', treeError);
        throw treeError;
      }
      
      // 2. 刪除舊目標
      const { error: deleteGoalsError } = await supabase
        .from('hanami_growth_goals')
        .delete()
        .eq('tree_id', editingTree.id);
      
      if (deleteGoalsError) {
        console.error('刪除舊目標失敗:', deleteGoalsError);
        throw deleteGoalsError;
      }
      
      // 3. 新增新目標
      if (goals && goals.length > 0) {
        const goalsInsert = goals.map((g, idx) => {
          const progressContents = Array.isArray(g.progress_contents) 
            ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
            : [];
          
          return {
            tree_id: editingTree.id,
            goal_name: g.goal_name,
            goal_description: g.goal_description,
            goal_icon: g.goal_icon,
            goal_order: idx + 1,
            is_achievable: true,
            is_completed: false,
            progress_max: Number(g.progress_max) || 5,
            required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
            related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
            progress_contents: progressContents,
          };
        });
        
        const { data: goalsData, error: goalsError } = await supabase
          .from('hanami_growth_goals')
          .insert(goalsInsert)
          .select();
          
        if (goalsError) {
          console.error('新增目標失敗:', goalsError);
          throw goalsError;
        }
        
        console.log('目標更新成功:', goalsData);
      }
      
      // 4. 重新載入資料
      await loadGrowthTreeData();
      
      console.log('更新完成，關閉模態框');
      setEditingTree(null);
    } catch (error) {
      console.error('更新成長樹失敗:', error);
    }
  };

  const handleEditTree = async (tree: any) => {
    setEditingTree(tree);
    setTreeForm({
      tree_name: tree.tree_name || '',
      tree_description: tree.tree_description || '',
      tree_icon: tree.tree_icon || '🌳',
      course_type: tree.course_type_id || tree.course_type || '',
      tree_level: tree.tree_level || 1,
      is_active: tree.is_active !== false,
    });

    // 載入該成長樹的目標
    try {
      const { data: goalsData, error } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', tree.id)
        .order('goal_order');

      if (error) throw error;

      const loadedGoals = (goalsData || []).map((goal: any) => ({
        goal_name: goal.goal_name || '',
        goal_description: goal.goal_description || '',
        goal_icon: goal.goal_icon || '⭐',
        progress_max: Number(goal.progress_max) || 5,
        required_abilities: Array.isArray(goal.required_abilities) ? goal.required_abilities : [],
        related_activities: Array.isArray(goal.related_activities) ? goal.related_activities : [],
        progress_contents: Array.isArray(goal.progress_contents) 
          ? goal.progress_contents.filter((content: string) => content && content.trim() !== '')
          : [],
      }));

      setGoals(loadedGoals.length > 0 ? loadedGoals : [{
        goal_name: '',
        goal_description: '',
        goal_icon: '⭐',
        progress_max: 5,
        required_abilities: [],
        related_activities: [],
        progress_contents: [],
      }]);
    } catch (error) {
      console.error('載入目標失敗:', error);
      setGoals([{
        goal_name: '',
        goal_description: '',
        goal_icon: '⭐',
        progress_max: 5,
        required_abilities: [],
        related_activities: [],
        progress_contents: [],
      }]);
    }
  };

  const handleTreeFormChange = (field: string, value: any) => {
    setTreeForm(prev => ({ ...prev, [field]: value }));
  };

  const resetTreeForm = () => {
    setTreeForm({
      tree_name: '',
      tree_description: '',
      tree_icon: '🌳',
      course_type: '',
      tree_level: 1,
      is_active: true,
    });
    setGoals([{
      goal_name: '',
      goal_description: '',
      goal_icon: '⭐',
      progress_max: 5,
      required_abilities: [],
      related_activities: [],
      progress_contents: [],
    }]);
  };

  // 學習目標處理函數
  const handleGoalChange = (idx: number, key: string, value: any) => {
    setGoals(prev => prev.map((goal, i) => 
      i === idx ? { ...goal, [key]: value } : goal
    ));
  };

  const addGoal = () => {
    setGoals(prev => [...prev, {
      goal_name: '',
      goal_description: '',
      goal_icon: '⭐',
      progress_max: 5,
      required_abilities: [],
      related_activities: [],
      progress_contents: [],
    }]);
  };

  const removeGoal = (idx: number) => {
    setGoals(prev => prev.filter((_, i) => i !== idx));
  };

  const handleProgressContentChange = (goalIdx: number, contentIdx: number, value: string) => {
    setGoals(prev => prev.map((goal, i) => {
      if (i === goalIdx) {
        const newContents = [...(goal.progress_contents || [])];
        newContents[contentIdx] = value;
        return { ...goal, progress_contents: newContents };
      }
      return goal;
    }));
  };
  // 能力選擇器處理函數
  const openAbilitySelector = (goalIdx: number) => {
    const currentAbilities = goals[goalIdx]?.required_abilities || [];
    setAbilityTempSelected(currentAbilities);
    setAbilitySearchText('');
    setShowAbilitySelector({ open: true, goalIdx });
  };

  const closeAbilitySelector = () => {
    setShowAbilitySelector({ open: false, goalIdx: null });
  };

  const handleAbilityToggle = (id: string) => {
    setAbilityTempSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleAbilityConfirm = () => {
    if (showAbilitySelector.goalIdx !== null) {
      handleGoalChange(showAbilitySelector.goalIdx, 'required_abilities', abilityTempSelected);
    }
    closeAbilitySelector();
  };

  // 活動選擇器處理函數
  const openActivitySelector = (goalIdx: number) => {
    const currentActivities = goals[goalIdx]?.related_activities || [];
    setActivityTempSelected(currentActivities);
    setActivitySearchText('');
    setShowActivitySelector({ open: true, goalIdx });
  };

  const closeActivitySelector = () => {
    setShowActivitySelector({ open: false, goalIdx: null });
  };

  const handleActivityToggle = (id: string) => {
    setActivityTempSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleActivityConfirm = () => {
    if (showActivitySelector.goalIdx !== null) {
      handleGoalChange(showActivitySelector.goalIdx, 'related_activities', activityTempSelected);
    }
    closeActivitySelector();
  };

  // 載入在此成長樹的學生資料
  const loadStudentsInTree = async (treeId: string) => {
    try {
      console.log('載入在此成長樹的學生資料:', treeId);
      
      // 使用現有的關聯表查詢學生
      const { data: studentsData, error } = await supabase
        .from('hanami_student_trees')
        .select(`
          student_id,
          enrollment_date,
          completion_date,
          tree_status,
          teacher_notes,
          start_date,
          status,
          completed_goals,
          Hanami_Students!inner (
            id,
            full_name,
            nick_name,
            student_age,
            course_type
          )
        `)
        .eq('tree_id', treeId)
        .or('status.eq.active,tree_status.eq.active');
      
      if (error) {
        console.error('載入學生資料失敗:', error);
        setStudentsInTree([]);
        return;
      }
      
      console.log('載入到的學生資料:', studentsData);
      console.log('學生數量:', studentsData?.length || 0);
      
      // 轉換資料格式以符合現有介面
      const formattedStudents = (studentsData || []).map(item => ({
        id: item.Hanami_Students.id,
        full_name: item.Hanami_Students.full_name,
        nick_name: item.Hanami_Students.nick_name,
        student_age: item.Hanami_Students.student_age,
        course_type: item.Hanami_Students.course_type,
        // 額外的關聯資訊
        start_date: item.start_date || item.enrollment_date,
        status: item.status || item.tree_status,
        completed_goals: item.completed_goals || []
      }));
      
      // 在客戶端排序
      formattedStudents.sort((a, b) => a.full_name.localeCompare(b.full_name));
      
      console.log('格式化後的學生資料:', formattedStudents);
      setStudentsInTree(formattedStudents);
    } catch (error) {
      console.error('載入學生資料失敗:', error);
      setStudentsInTree([]);
    }
  };

  // 打開詳細視窗
  const openDetailModal = async (tree: any) => {
    console.log('openDetailModal 被調用，tree:', tree);
    setSelectedTree(tree);
    await loadStudentsInTree(tree.id);
    setShowDetailModal(true);
    console.log('詳細視窗狀態已設置為 true');
  };

  // 關閉詳細視窗
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTree(null);
    setStudentsInTree([]);
    setExpandedGoals(new Set()); // 重置展開狀態
  };

  // 切換目標展開狀態
  const toggleGoalExpansion = (goalId: string) => {
    setExpandedGoals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  // 篩選處理函數
  const handleGrowthTreeFilterChange = (key: keyof typeof growthTreeFilters, value: any) => {
    setGrowthTreeFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 彈出選擇處理函數
  const handleFilterPopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
    const currentValue = growthTreeFilters[field as keyof typeof growthTreeFilters] || [];
    if (Array.isArray(currentValue) && typeof currentValue[0] === 'number') {
      setPopupSelected(currentValue.map(String));
    } else {
      setPopupSelected(currentValue as string | string[]);
    }
  };

  const handleFilterPopupConfirm = () => {
    let convertedValue: any = popupSelected;
    if (showPopup.field === 'tree_levels' && Array.isArray(popupSelected)) {
      convertedValue = (popupSelected as string[]).map(Number);
    }
    setGrowthTreeFilters(prev => ({
      ...prev,
      [showPopup.field]: convertedValue
    }));
    setShowPopup({ field: '', open: false });
  };

  const handleFilterPopupCancel = () => {
    const currentValue = growthTreeFilters[showPopup.field as keyof typeof growthTreeFilters] || [];
    if (Array.isArray(currentValue) && typeof currentValue[0] === 'number') {
      setPopupSelected(currentValue.map(String));
    } else {
      setPopupSelected(currentValue as string | string[]);
    }
    setShowPopup({ field: '', open: false });
  };

  // 清除篩選
  const clearGrowthTreeFilters = () => {
    setGrowthTreeFilters({
      search: '',
      tree_levels: [],
      statuses: [],
      abilities: [],
      activities: [],
    });
  };

  // 獲取篩選後的成長樹
  const getFilteredTrees = () => {
    return trees.filter(tree => {
      // 搜尋篩選
      if (growthTreeFilters.search && !tree.tree_name.toLowerCase().includes(growthTreeFilters.search.toLowerCase()) &&
          !(tree.tree_description && tree.tree_description.toLowerCase().includes(growthTreeFilters.search.toLowerCase()))) {
        return false;
      }

      // 成長樹等級篩選
      if (
        growthTreeFilters.tree_levels.length > 0 &&
        (tree.tree_level === undefined || !growthTreeFilters.tree_levels.includes(tree.tree_level))
      ) {
        return false;
      }

      // 狀態篩選
      if (growthTreeFilters.statuses.length > 0) {
        const isActive = tree.is_active ? 'active' : 'inactive';
        if (!growthTreeFilters.statuses.includes(isActive)) {
          return false;
        }
      }

      // 能力篩選
      if (growthTreeFilters.abilities.length > 0) {
        const treeGoals = getGoalsForTree(tree.id);
        const hasMatchingAbility = treeGoals.some(goal => 
          goal.required_abilities && goal.required_abilities.some((abilityId: string) => 
            growthTreeFilters.abilities.includes(abilityId)
          )
        );
        if (!hasMatchingAbility) {
          return false;
        }
      }

      // 活動篩選
      if (growthTreeFilters.activities.length > 0) {
        const treeGoals = getGoalsForTree(tree.id);
        const hasMatchingActivity = treeGoals.some(goal => 
          goal.related_activities && goal.related_activities.some((activityId: string) => 
            growthTreeFilters.activities.includes(activityId)
          )
        );
        if (!hasMatchingActivity) {
          return false;
        }
      }

      return true;
    });
  };

  // 目標列表展開/收起處理函數
  const toggleTreeExpansion = (treeId: string) => {
    setExpandedTrees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(treeId)) {
        newSet.delete(treeId);
      } else {
        newSet.add(treeId);
      }
      return newSet;
    });
  };
  // 刪除成長樹處理函數
  const handleDeleteTree = async (treeId: string) => {
    try {
      console.log('開始刪除成長樹:', treeId);
      
      // 檢查成長樹是否存在
      const { data: existingTree, error: checkError } = await supabase
        .from('hanami_growth_trees')
        .select('id, tree_name')
        .eq('id', treeId)
        .single();
      
      if (checkError) {
        console.error('檢查成長樹失敗:', checkError);
        throw new Error(`無法找到成長樹: ${checkError.message}`);
      }
      
      if (!existingTree) {
        throw new Error('成長樹不存在');
      }
      
      console.log('找到成長樹:', existingTree);
      
      // 1. 先檢查該成長樹有多少個目標
      const { data: goalsCount, error: countError } = await supabase
        .from('hanami_growth_goals')
        .select('id', { count: 'exact' })
        .eq('tree_id', treeId);
      
      if (countError) {
        console.error('檢查目標數量失敗:', countError);
        throw new Error(`檢查目標數量失敗: ${countError.message}`);
      }
      
      console.log(`該成長樹有 ${goalsCount?.length || 0} 個目標`);
      
      // 2. 刪除該成長樹的所有目標
      if (goalsCount && goalsCount.length > 0) {
        const { error: goalsError } = await supabase
          .from('hanami_growth_goals')
          .delete()
          .eq('tree_id', treeId);
        
        if (goalsError) {
          console.error('刪除目標失敗:', goalsError);
          throw new Error(`刪除目標失敗: ${goalsError.message}`);
        }
        
        console.log('目標刪除成功');
      }
      
      // 3. 刪除相關的學生樹記錄
      const { data: studentTrees, error: studentTreesError } = await supabase
        .from('hanami_student_trees')
        .select('id')
        .eq('tree_id', treeId);
      
      if (studentTreesError) {
        console.error('檢查學生樹記錄失敗:', studentTreesError);
        throw new Error(`檢查學生樹記錄失敗: ${studentTreesError.message}`);
      }
      
      if (studentTrees && studentTrees.length > 0) {
        console.log(`找到 ${studentTrees.length} 個學生樹記錄需要刪除`);
        
        const { error: deleteStudentTreesError } = await supabase
          .from('hanami_student_trees')
          .delete()
          .eq('tree_id', treeId);
        
        if (deleteStudentTreesError) {
          console.error('刪除學生樹記錄失敗:', deleteStudentTreesError);
          throw new Error(`刪除學生樹記錄失敗: ${deleteStudentTreesError.message}`);
        }
        
        console.log('學生樹記錄刪除成功');
      } else {
        console.log('沒有找到相關的學生樹記錄');
      }
      
      // 4. 刪除成長樹
      const { error: treeError } = await supabase
        .from('hanami_growth_trees')
        .delete()
        .eq('id', treeId);
      
      if (treeError) {
        console.error('刪除成長樹失敗:', treeError);
        throw new Error(`刪除成長樹失敗: ${treeError.message}`);
      }
      
      console.log('成長樹刪除成功');
      
      // 5. 重新載入資料
      await loadGrowthTreeData();
      
      // 6. 清除刪除狀態
      setDeletingTree(null);
      
      // 7. 顯示成功訊息
      alert(`成長樹 "${existingTree.tree_name}" 已成功刪除`);
      
    } catch (error: any) {
      console.error('刪除成長樹失敗:', error);
      alert(`刪除失敗: ${error.message || '未知錯誤'}`);
      setDeletingTree(null);
    }
  };

  // 載入成長樹相關資料
  const loadGrowthTreeData = async () => {
    try {
      console.log('開始載入成長樹資料...');
      
      // 課程類型（先載入，用於轉換 ID 到名稱）
      const { data: courseTypesData, error: courseTypesError } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name')
        .eq('status', true)
        .order('name');
      if (courseTypesError) throw courseTypesError;
      setCourseTypesOptions((courseTypesData || []).map((ct: any) => ({ value: ct.id, label: ct.name })));
      
      // 成長樹
      const { data: treesData, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('*')
        .order('tree_name');
      if (treesError) throw treesError;
      
      // 創建課程類型 ID 到名稱的映射
      const courseTypeMap = new Map();
      (courseTypesData || []).forEach((ct: any) => {
        courseTypeMap.set(ct.id, ct.name);
      });
      
      const fixedTrees = (treesData || []).map((t: any) => ({
        ...t,
        course_type: t.course_type_id ?? t.course_type ?? '',
        course_type_name: courseTypeMap.get(t.course_type_id) || '未知課程類型',
        tree_description: t.tree_description ?? undefined,
      }));
      setTrees(fixedTrees);
      console.log('載入成長樹:', fixedTrees);
      
      // 目標
      const { data: goalsData, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .order('goal_order');
      if (goalsError) throw goalsError;
      console.log('原始目標資料:', goalsData);
      const fixedGoals = (goalsData || []).map((g: any) => {
        const progressContents = Array.isArray(g.progress_contents) 
          ? (g.progress_contents as string[]).filter(content => content && content.trim() !== '')
          : [];
        
        return {
          ...g,
          tree_id: g.tree_id || g.treeId, // 確保 tree_id 欄位存在
          is_completed: g.is_completed ?? false,
          progress_max: Number(g.progress_max) || 5,
          required_abilities: Array.isArray(g.required_abilities) ? g.required_abilities : (g.required_abilities ? [g.required_abilities] : []),
          related_activities: Array.isArray(g.related_activities) ? g.related_activities : (g.related_activities ? [g.related_activities] : []),
          progress_contents: progressContents,
          goal_description: g.goal_description ?? '',
        };
      });
      setGoals(fixedGoals);
      console.log('處理後的目標:', fixedGoals);
      
      // 發展能力
      const { data: abilitiesData, error: abilitiesError } = await supabase
        .from('hanami_development_abilities')
        .select('id, ability_name')
        .order('ability_name');
      if (abilitiesError) throw abilitiesError;
      setAbilitiesOptions((abilitiesData || []).map((a: any) => ({ value: a.id, label: a.ability_name })));
      
      // 活動
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('hanami_teaching_activities')
        .select('id, activity_name')
        .order('activity_name');
      if (activitiesError) throw activitiesError;
      setActivitiesOptions((activitiesData || []).map((a: any) => ({ value: a.id, label: a.activity_name })));
      
      // 老師
      const { data: teachersData, error: teachersError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname, teacher_fullname')
        .order('teacher_nickname');
      if (teachersError) throw teachersError;
      // 管理員
      const { data: adminsData, error: adminsError } = await supabase
        .from('hanami_admin')
        .select('id, admin_name')
        .order('admin_name');
      if (adminsError) throw adminsError;
      setTeachersOptions([
        ...((teachersData || []).map((t: any) => ({ value: t.id, label: t.teacher_nickname || t.teacher_fullname || '老師' }))),
        ...((adminsData || []).map((a: any) => ({ value: a.id, label: `${a.admin_name}（管理員）` }))),
      ]);
      

      
      console.log('成長樹資料載入完成');
    } catch (err: any) {
      console.error('成長樹資料載入失敗:', err);
    }
  };

  // 獲取指定成長樹的目標
  const getGoalsForTree = (treeId: string) => {
    console.log('查找成長樹目標:', treeId);
    console.log('所有目標:', goals);
    const treeGoals = goals.filter(goal => goal.tree_id === treeId);
    console.log('該成長樹的目標:', treeGoals);
    return treeGoals;
  };

  // 能力發展管理相關函數
  const handleAddAbility = async (abilityData: any) => {
    try {
      console.log('新增能力:', abilityData);
      setShowAddAbilityModal(false);
    } catch (error) {
      console.error('新增能力失敗:', error);
    }
  };

  const handleUpdateAbility = async (abilityData: any) => {
    try {
      console.log('更新能力:', abilityData);
      setEditingAbility(null);
    } catch (error) {
      console.error('更新能力失敗:', error);
    }
  };

  const handleEditAbility = (ability: any) => {
    setEditingAbility(ability);
  };

  // 教學活動管理相關函數
  const handleAddActivity = async (activityData: any) => {
    try {
      console.log('新增教學活動:', activityData);
      console.log('活動數據類型檢查:', {
        activity_name: typeof activityData.activity_name,
        activity_type: typeof activityData.activity_type,
        category: typeof activityData.category,
        status: typeof activityData.status,
        is_active: typeof activityData.is_active,
        estimated_duration: typeof activityData.estimated_duration,
        template_id: typeof activityData.template_id
      });
      
      // ActivityForm 已經處理了數據格式，直接使用
      const { data, error } = await supabase
        .from('hanami_teaching_activities')
        .insert([activityData])
        .select();

      if (error) {
        console.error('Supabase 錯誤詳情:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('插入成功，返回數據:', data);
      setShowAddActivityModal(false);
      // 重新載入活動列表
      await loadActivities();
      toast.success('教學活動新增成功！');
    } catch (error) {
      console.error('新增教學活動失敗:', error);
      toast.error('新增教學活動失敗');
    }
  };

  const handleUpdateActivity = async (activityData: any) => {
    try {
      console.log('更新教學活動:', activityData);
      console.log('更新數據類型檢查:', {
        activity_name: typeof activityData.activity_name,
        activity_type: typeof activityData.activity_type,
        category: typeof activityData.category,
        status: typeof activityData.status,
        is_active: typeof activityData.is_active,
        estimated_duration: typeof activityData.estimated_duration,
        template_id: typeof activityData.template_id
      });
      
      if (!editingActivity?.id) {
        throw new Error('缺少活動 ID');
      }

      // ActivityForm 已經處理了數據格式，直接使用
      const { data, error } = await supabase
        .from('hanami_teaching_activities')
        .update(activityData)
        .eq('id', editingActivity.id)
        .select();

      if (error) {
        console.error('Supabase 更新錯誤詳情:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('更新成功，返回數據:', data);
      setEditingActivity(null);
      setShowAddActivityModal(false);
      // 重新載入活動列表
      await loadActivities();
      toast.success('教學活動更新成功！');
    } catch (error) {
      console.error('更新教學活動失敗:', error);
      toast.error('更新教學活動失敗');
    }
  };

  const handleEditActivity = (activity: any) => {
    setEditingActivity(activity);
  };

  // 打開教學活動詳細視窗
  const openActivityDetailModal = (activity: any) => {
    console.log('openActivityDetailModal 被調用，activity:', activity);
    setSelectedActivity(activity);
    setShowActivityDetailModal(true);
  };

  // 關閉教學活動詳細視窗
  const closeActivityDetailModal = () => {
    setShowActivityDetailModal(false);
    setSelectedActivity(null);
  };
  // 能力發展相關函數
  const loadAbilityData = async () => {
    setAbilityLoading(true);
    try {
      // 載入發展能力
      const { data: abilitiesData, error: abilitiesError } = await supabase
        .from('hanami_development_abilities')
        .select('*')
        .order('ability_name');

      if (abilitiesError) throw abilitiesError;
      // 修正 null 欄位為 undefined
      const fixedAbilities = (abilitiesData || []).map((a: any) => ({
        ...a,
        ability_description: a.ability_description ?? undefined,
        ability_icon: a.ability_icon ?? undefined,
        ability_color: a.ability_color ?? undefined,
        category: a.category ?? undefined,
      }));
      setAbilities(fixedAbilities);

      // 載入學生
      const { data: studentsData, error: studentsError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, nick_name, student_age, course_type')
        .order('full_name');

      if (studentsError) throw studentsError;
      setAbilityStudents(studentsData || []);

      // 載入學生能力記錄
      const { data: studentAbilitiesData, error: studentAbilitiesError } = await supabase
        .from('hanami_student_abilities')
        .select(`
          *,
          ability:hanami_development_abilities(*)
        `);

      if (studentAbilitiesError) throw studentAbilitiesError;
      // 修正欄位名稱與 null 欄位
      const fixedStudentAbilities = (studentAbilitiesData || []).map((a: any) => ({
        ...a,
        last_updated: a.last_assessment_date ?? a.updated_at ?? '',
        notes: a.notes ?? undefined,
      }));
      setStudentAbilities(fixedStudentAbilities);

      // 載入成長樹和成長目標
      const { data: growthTreesData, error: growthTreesError } = await supabase
        .from('hanami_growth_trees')
        .select(`
          *,
          goals:hanami_growth_goals(
            id,
            goal_name,
            required_abilities
          )
        `)
        .eq('is_active', true)
        .order('tree_name');

      if (growthTreesError) throw growthTreesError;
      setAbilityGrowthTrees(growthTreesData || []);

    } catch (err) {
      console.error('載入能力資料失敗：', err);
      setAbilityError('載入能力資料失敗');
    } finally {
      setAbilityLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // 載入自訂能力類別（使用 activity_type 並過濾發展相關）
      const { data: customData } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'activity_type')
        .eq('is_active', true)
        .like('option_name', '%發展%')
        .order('sort_order');

      const defaultCategories = [
        { id: 'physical', name: '身體發展' },
        { id: 'cognitive', name: '認知發展' },
        { id: 'emotional', name: '情緒發展' },
        { id: 'language', name: '語言發展' },
        { id: 'artistic', name: '藝術發展' },
      ];

      const customCategories = (customData || []).map(item => ({
        id: item.option_value,
        name: item.option_name,
      }));

      setCategories([...defaultCategories, ...customCategories]);
    } catch (err) {
      console.error('載入類別失敗：', err);
    }
  };

  const loadCustomOptions = async () => {
    try {
      console.log('能力頁面：開始載入自訂選項...');
      // 載入自訂能力類別（移除過濾條件，載入所有 activity_type）
      const { data: customData, error } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'activity_type')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('能力頁面：載入自訂選項錯誤:', error);
        return;
      }

      console.log('能力頁面：載入到的自訂資料:', customData);

      // 從 localStorage 載入用戶修改的預設類別
      const userModifiedDefaults = JSON.parse(localStorage.getItem('hanami_modified_defaults') || '{}');
      console.log('能力頁面：用戶修改的預設類別:', userModifiedDefaults);

      const defaultCategories = [
        { id: 'physical', name: '身體發展', is_default: true },
        { id: 'cognitive', name: '認知發展', is_default: true },
        { id: 'emotional', name: '情緒發展', is_default: true },
        { id: 'language', name: '語言發展', is_default: true },
        { id: 'artistic', name: '藝術發展', is_default: true },
      ];

      // 應用用戶的修改
      const modifiedDefaultCategories = defaultCategories
        .filter(cat => !userModifiedDefaults[cat.id]?.deleted) // 過濾被刪除的
        .map(cat => ({
          ...cat,
          name: userModifiedDefaults[cat.id]?.name || cat.name, // 應用修改的名稱
        }));

      // 載入自訂預設類別
      const customDefaultCategories = Object.entries(userModifiedDefaults)
        .filter(([id, data]: [string, any]) => data.is_custom_default && !data.deleted) // 過濾被刪除的
        .map(([id, data]: [string, any]) => ({
          id,
          name: data.name,
          is_default: true,
        }));

      console.log('能力頁面：修改後的預設類別:', modifiedDefaultCategories);
      console.log('能力頁面：自訂預設類別:', customDefaultCategories);
      
      const customCategories = (customData || []).map(item => ({
        id: item.option_value,
        name: item.option_name,
        is_default: false,
      }));

      const allCategories = [...modifiedDefaultCategories, ...customDefaultCategories, ...customCategories];
      console.log('能力頁面：合併後的所有類別:', allCategories);

      setCustomOptions(prev => ({
        ...prev,
        ability_categories: allCategories,
      }));
    } catch (error) {
      console.error('能力頁面：載入自訂選項失敗:', error);
    }
  };

  const loadActivityOptions = async () => {
    try {
      console.log('教學活動頁面：開始載入活動選項...');
      
      // 載入活動類型
      const { data: typeData } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'activity_type')
        .eq('is_active', true)
        .order('sort_order');

      const defaultTypes = [
        { value: 'game', label: '遊戲活動' },
        { value: 'training', label: '訓練活動' },
        { value: 'exercise', label: '練習活動' },
        { value: 'storybook', label: '繪本活動' },
        { value: 'performance', label: '表演活動' },
      ];
      const customTypes = (typeData || []).map((item: any) => ({ 
        value: item.option_value, 
        label: item.option_name, 
      }));
      setActivityTypes([...defaultTypes, ...customTypes]);

      // 載入狀態選項
      const { data: statusData } = await supabase
        .from('hanami_custom_options')
        .select('*')
        .eq('option_type', 'status')
        .eq('is_active', true)
        .order('sort_order');

      const defaultStatuses = [
        { value: 'draft', label: '草稿' },
        { value: 'published', label: '已發布' },
        { value: 'archived', label: '已封存' },
      ];
      const customStatuses = (statusData || []).map((item: any) => ({ 
        value: item.option_value, 
        label: item.option_name, 
      }));
      setActivityStatuses([...defaultStatuses, ...customStatuses]);

      console.log('教學活動頁面：載入活動選項完成');
    } catch (error) {
      console.error('教學活動頁面：載入活動選項失敗:', error);
    }
  };

  const loadActivities = async () => {
    try {
      console.log('載入教學活動列表...');
      
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('hanami_teaching_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (activitiesError) {
        console.error('載入教學活動列表失敗:', activitiesError);
        return;
      }

      console.log('教學活動列表載入成功:', activitiesData);
      setActivities(activitiesData || []);
    } catch (error) {
      console.error('載入教學活動列表錯誤:', error);
    }
  };

  const createAbility = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_development_abilities')
        .insert([{
          ...newAbility,
          category: newAbility.category || null,
        }])
        .select()
        .single();

      if (error) throw error;
      // 修正 null 欄位為 undefined
      const fixedData = {
        ...data,
        ability_description: data.ability_description ?? undefined,
        ability_icon: data.ability_icon ?? undefined,
        ability_color: data.ability_color ?? undefined,
        category: data.category ?? undefined,
      };
      setAbilities([...abilities, fixedData]);
      setShowCreateModal(false);
      setNewAbility({
        ability_name: '',
        ability_description: '',
        ability_color: '#FFB6C1',
        max_level: 5,
        category: '',
      });
      toast.success('能力建立成功！');
    } catch (err) {
      console.error('建立能力失敗：', err);
      toast.error('建立能力失敗');
    }
  };

  const deleteAbility = async (ability: any) => {
    try {
      // 檢查是否有學生正在使用此能力
      const { data: studentAbilitiesData, error: checkError } = await supabase
        .from('hanami_student_abilities')
        .select('id')
        .eq('ability_id', ability.id)
        .limit(1);

      if (checkError) throw checkError;

      if (studentAbilitiesData && studentAbilitiesData.length > 0) {
        toast.error('無法刪除：已有學生正在使用此能力');
        return;
      }

      // 檢查是否有成長樹正在使用此能力
      const { data: growthTreesData, error: treesError } = await supabase
        .from('hanami_growth_goals')
        .select('id, goal_name')
        .contains('required_abilities', [ability.id]);

      if (treesError) throw treesError;

      if (growthTreesData && growthTreesData.length > 0) {
        toast.error(`無法刪除：此能力正在被以下成長目標使用：${growthTreesData.map(g => g.goal_name).join(', ')}`);
        return;
      }

      // 執行刪除
      const { error: deleteError } = await supabase
        .from('hanami_development_abilities')
        .delete()
        .eq('id', ability.id);

      if (deleteError) throw deleteError;

      // 從本地狀態中移除
      setAbilities(abilities.filter(a => a.id !== ability.id));
      setShowDeleteConfirm(false);
      setAbilityToDelete(null);
      toast.success('能力刪除成功！');
    } catch (err) {
      console.error('刪除能力失敗：', err);
      toast.error('刪除失敗，請重試');
    }
  };

  const handleDeleteClick = (ability: any) => {
    setAbilityToDelete(ability);
    setShowDeleteConfirm(true);
  };

  const getStudentAbility = (studentId: string, abilityId: string) => {
    return studentAbilities.find(sa => 
      sa.student_id === studentId && sa.ability_id === abilityId,
    );
  };

  const getGrowthTreesForAbility = (abilityId: string) => {
    return abilityGrowthTrees.filter(tree => {
      if (!tree.goals || !Array.isArray(tree.goals)) return false;
      
      return tree.goals.some((goal: any) => {
        if (!goal.required_abilities || !Array.isArray(goal.required_abilities)) return false;
        return goal.required_abilities.includes(abilityId);
      });
    });
  };

  const getAbilityRequirementCount = (treeId: string, abilityId: string) => {
    const tree = abilityGrowthTrees.find(t => t.id === treeId);
    if (!tree || !tree.goals || !Array.isArray(tree.goals)) return 0;
    
    return tree.goals.filter((goal: any) => {
      if (!goal.required_abilities || !Array.isArray(goal.required_abilities)) return false;
      return goal.required_abilities.includes(abilityId);
    }).length;
  };

  const getAbilityLevelColor = (level: number, maxLevel: number) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAbilityLevelText = (level: number, maxLevel: number) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return '優秀';
    if (percentage >= 60) return '良好';
    if (percentage >= 40) return '一般';
    return '需要加強';
  };

  // 彈出選擇相關函數
  const handlePopupOpen = (field: string) => {
    setShowPopup({ field, open: true });
    if (field === 'category') {
    // 找到當前選中類別的 ID
    const currentCategory = customOptions.ability_categories.find(cat => cat.name === newAbility.category);
    setPopupSelected(currentCategory?.id || '');
    } else if (field === 'activity_type') {
      // 找到當前選中活動類型的 value
      const currentType = activityTypes.find(type => type.label === editingActivity?.activity_type);
      setPopupSelected(currentType?.value || '');
    } else if (field === 'status') {
      // 找到當前選中狀態的 value
      const currentStatus = activityStatuses.find(status => status.label === editingActivity?.status);
      setPopupSelected(currentStatus?.value || '');
    }
  };

  const handlePopupConfirm = () => {
    if (showPopup.field === 'category') {
    // 根據選中的 ID 找到對應的類別名稱
    const selectedCategory = customOptions.ability_categories.find(cat => cat.id === popupSelected);
    setNewAbility({
      ...newAbility,
      category: selectedCategory?.name || '',
    });
    } else if (showPopup.field === 'activity_type') {
      // 根據選中的 value 找到對應的活動類型標籤
      const selectedType = activityTypes.find(type => type.value === popupSelected);
      if (editingActivity) {
        setEditingActivity({
          ...editingActivity,
          activity_type: selectedType?.label || '',
        });
      }
    } else if (showPopup.field === 'status') {
      // 根據選中的 value 找到對應的狀態標籤
      const selectedStatus = activityStatuses.find(status => status.value === popupSelected);
      if (editingActivity) {
        setEditingActivity({
          ...editingActivity,
          status: selectedStatus?.label || '',
        });
      }
    }
    setShowPopup({ field: '', open: false });
  };

  const handlePopupCancel = () => {
    if (showPopup.field === 'category') {
    // 找到當前選中類別的 ID
    const currentCategory = customOptions.ability_categories.find(cat => cat.name === newAbility.category);
    setPopupSelected(currentCategory?.id || '');
    } else if (showPopup.field === 'activity_type') {
      // 找到當前選中活動類型的 value
      const currentType = activityTypes.find(type => type.label === editingActivity?.activity_type);
      setPopupSelected(currentType?.value || '');
    } else if (showPopup.field === 'status') {
      // 找到當前選中狀態的 value
      const currentStatus = activityStatuses.find(status => status.label === editingActivity?.status);
      setPopupSelected(currentStatus?.value || '');
    }
    setShowPopup({ field: '', open: false });
  };

  // 自訂管理相關函數
  const handleCustomManagerOpen = (field: string) => {
    setShowCustomManager({ field, open: true });
    setNewOptionName('');
    setEditingOption(null);
  };

  const handleCustomManagerClose = () => {
    setShowCustomManager({ field: '', open: false });
    setNewOptionName('');
    setEditingOption(null);
  };
  const handleAddCustomOption = async () => {
    if (!newOptionName.trim()) return;

    try {
      console.log('=== 開始新增操作 ===');
      console.log('新增類別名稱:', newOptionName.trim());
      console.log('是否設為預設:', isDefaultOption);
      
      if (isDefaultOption) {
        // 新增為預設類別：保存到 localStorage
        const newId = `custom_${Date.now()}`;
        const newDefaultCategory = {
          id: newId,
          name: newOptionName.trim(),
          is_default: true,
        };
        
        // 保存到 localStorage
        const userModifiedDefaults = JSON.parse(localStorage.getItem('hanami_modified_defaults') || '{}');
        userModifiedDefaults[newId] = { 
          name: newOptionName.trim(),
          is_custom_default: true // 標記為自訂預設
        };
        localStorage.setItem('hanami_modified_defaults', JSON.stringify(userModifiedDefaults));
        console.log('已保存新預設類別到 localStorage:', userModifiedDefaults);
        
        setCustomOptions(prev => {
          const newCategories = [...prev.ability_categories, newDefaultCategory];
          console.log('新增後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('預設類別新增完成');
        toast.success(`已新增預設類別「${newOptionName.trim()}」！`);
      } else {
        // 新增為自訂類別：保存到資料庫
        const optionValue = newOptionName.toLowerCase().replace(/\s+/g, '_');
        
        const { error } = await supabase
          .from('hanami_custom_options')
          .insert({
            option_type: 'activity_type',
            option_name: newOptionName.trim(),
            option_value: optionValue,
            sort_order: customOptions.ability_categories.length + 100,
            is_active: true,
          });

        if (error) throw error;

        // 更新本地狀態
        const newOption = {
          id: optionValue,
          name: newOptionName.trim(),
          is_default: false,
        };

        setCustomOptions(prev => ({
          ...prev,
          ability_categories: [...prev.ability_categories, newOption],
        }));
        
        console.log('自訂類別新增完成');
        toast.success('新增類別成功！');
      }

      setNewOptionName('');
      setIsDefaultOption(false);
      console.log('=== 新增操作完成 ===');
    } catch (error) {
      console.error('新增類別失敗:', error);
      toast.error('新增失敗，請重試');
    }
  };

  const handleEditCustomOption = async () => {
    if (!editingOption || !newOptionName.trim()) return;

    try {
      console.log('=== 能力頁面：開始編輯操作 ===');
      console.log('編輯選項:', editingOption);
      console.log('新名稱:', newOptionName.trim());
      console.log('當前所有類別:', customOptions.ability_categories);
      
      if (editingOption.is_default) {
        // 預設類別：保存到 localStorage
        console.log('編輯預設類別:', editingOption.name);
        
        // 保存編輯操作到 localStorage
        const userModifiedDefaults = JSON.parse(localStorage.getItem('hanami_modified_defaults') || '{}');
        userModifiedDefaults[editingOption.id] = { 
          ...userModifiedDefaults[editingOption.id],
          name: newOptionName.trim() 
        };
        localStorage.setItem('hanami_modified_defaults', JSON.stringify(userModifiedDefaults));
        console.log('已保存編輯操作到 localStorage:', userModifiedDefaults);
        
        setCustomOptions(prev => {
          const newCategories = prev.ability_categories.map(option =>
            option.id === editingOption.id ? { ...option, name: newOptionName.trim() } : option,
          );
          console.log('編輯後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('預設類別編輯完成');
        toast.success(`已更新預設類別「${editingOption.name}」為「${newOptionName.trim()}」！`);
      } else {
        // 自訂類別：更新資料庫
        console.log('編輯自訂類別:', editingOption.name);
        const { error } = await supabase
          .from('hanami_custom_options')
          .update({
            option_name: newOptionName.trim(),
          })
          .eq('option_type', 'activity_type')
          .eq('option_value', editingOption.id);

        if (error) {
          console.error('資料庫更新錯誤:', error);
          throw error;
        }

        // 更新本地狀態
        setCustomOptions(prev => {
          const newCategories = prev.ability_categories.map(option =>
            option.id === editingOption.id ? { ...option, name: newOptionName.trim(), is_default: editingOption.is_default } : option,
          );
          console.log('編輯後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('自訂類別編輯完成');
        toast.success('更新類別成功！');
      }

      setNewOptionName('');
      setEditingOption(null);
      console.log('=== 能力頁面：編輯操作完成 ===');
    } catch (error) {
      console.error('更新類別失敗:', error);
      toast.error('更新失敗，請重試');
    }
  };
  const handleDeleteCustomOption = async (optionId: string) => {
    try {
      const optionToDelete = customOptions.ability_categories.find(opt => opt.id === optionId);
      
      if (!optionToDelete) {
        console.error('未找到要刪除的選項！');
        toast.error('未找到要刪除的選項');
        return;
      }

      // 刪除確認對話框
      const confirmMessage = optionToDelete.is_default 
        ? `確定要刪除預設類別「${optionToDelete.name}」嗎？\n\n注意：此操作會將該類別從預設列表中移除，但可以通過「重置預設」按鈕恢復。`
        : `確定要刪除類別「${optionToDelete.name}」嗎？\n\n此操作無法撤銷。`;
      
      const isConfirmed = confirm(confirmMessage);
      if (!isConfirmed) {
        console.log('用戶取消刪除操作');
        return;
      }

      console.log('=== 能力頁面：開始刪除操作 ===');
      console.log('刪除選項 ID:', optionId);
      console.log('當前所有類別:', customOptions.ability_categories);
      console.log('找到要刪除的選項:', optionToDelete);
      
      if (optionToDelete.is_default) {
        // 預設類別：保存到 localStorage
        console.log('刪除預設類別:', optionToDelete.name);
        
        // 保存刪除操作到 localStorage
        const userModifiedDefaults = JSON.parse(localStorage.getItem('hanami_modified_defaults') || '{}');
        userModifiedDefaults[optionToDelete.id] = { deleted: true };
        localStorage.setItem('hanami_modified_defaults', JSON.stringify(userModifiedDefaults));
        console.log('已保存刪除操作到 localStorage:', userModifiedDefaults);
        
        setCustomOptions(prev => {
          const newCategories = prev.ability_categories.filter(option => option.id !== optionId);
          console.log('刪除後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('預設類別刪除完成');
        toast.success(`已刪除預設類別「${optionToDelete.name}」！`);
      } else {
        // 自訂類別：軟刪除（設為非活躍）
        console.log('刪除自訂類別:', optionToDelete.name);
        const { error } = await supabase
          .from('hanami_custom_options')
          .update({ is_active: false })
          .eq('option_type', 'activity_type')
          .eq('option_value', optionId);

        if (error) {
          console.error('資料庫刪除錯誤:', error);
          throw error;
        }

        // 更新本地狀態
        setCustomOptions(prev => {
          const newCategories = prev.ability_categories.filter(option => option.id !== optionId);
          console.log('刪除後的類別列表:', newCategories);
          return {
            ...prev,
            ability_categories: newCategories,
          };
        });
        
        console.log('自訂類別刪除完成');
        toast.success('刪除類別成功！');
      }
      
      console.log('=== 能力頁面：刪除操作完成 ===');
    } catch (error) {
      console.error('刪除類別失敗:', error);
      toast.error('刪除失敗，請重試');
    }
  };

  const startEditOption = (option: any) => {
    console.log('能力頁面：開始編輯選項:', option);
    setEditingOption(option);
    setNewOptionName(option.name);
    setIsDefaultOption(option.is_default); // 設置預設選中狀態
    console.log('能力頁面：設置編輯狀態完成');
  };



  // 3D 卡片組件
  const Card3D = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <div
      className={`bg-white rounded-3xl shadow-lg p-6 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #FFF9F2 0%, #FFFDF8 100%)',
        border: '1px solid #EADBC8'
      }}
      onClick={onClick}
    >
      {children}
          </div>
  );

  // 渲染儀表板
  const renderDashboard = () => (
    <div
      className="space-y-6"
    >
      {/* 歡迎區域 */}
      <div>
        <Card3D className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/hanami.png"
              alt="Hanami Logo"
              width={60}
              height={60}
              className="rounded-full"
              priority
            />
          </div>
          <h2 className="text-2xl font-bold text-[#4B4036] mb-2">
            歡迎回來，{teacherData?.teacher_nickname || teacherData?.teacher_fullname || '老師'}
          </h2>
          <p className="text-[#8B7355] mb-4">
            {isWorking ? '今天有課程安排，準備好迎接學生了嗎？' : '今天沒有課程安排，可以休息一下'}
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/icons/clock.PNG"
                alt="時鐘"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="text-sm text-[#8B7355]" suppressHydrationWarning={true}>
                {new Date().toLocaleDateString('zh-TW', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </span>
          </div>
          </div>
        </Card3D>
      </div>

      {/* 今日課程 */}
              <div>
        <TodayLessonsPanel lessons={todayLessons} loading={loading} />
              </div>

      {/* 學生進度 */}
      <div>
        <Card3D>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Image
                src="/icons/book-elephant.PNG"
                alt="書本"
                width={32}
                height={32}
                className="mr-3"
              />
              <h3 className="text-xl font-bold text-[#4B4036]">
                今天 學生評估狀態
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8B7355] px-3 py-2 bg-gray-100 rounded-md">
                {todayAssessmentDate}
              </span>
              <button
                onClick={() => setStudentProgressExpanded(!studentProgressExpanded)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-[#FFF9F2] hover:bg-[#EADBC8] rounded-lg transition-colors"
              >
                <span className="text-[#4B4036] font-medium">
                  {studentProgressExpanded ? '收起' : '展開'}
                </span>
                <svg
                  className={`w-4 h-4 text-[#4B4036] transition-transform duration-200 ${
                    studentProgressExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
        </div>

          {/* 收起狀態 - 只顯示數字 */}
          {!studentProgressExpanded && (
            <div className="grid grid-cols-3 gap-4">
              {loadingStudents ? (
                // 載入狀態
                <>
                  <div className="text-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="text-2xl font-bold text-gray-400 mb-1">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">載入中...</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="text-2xl font-bold text-gray-400 mb-1">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">載入中...</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="text-2xl font-bold text-gray-400 mb-1">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">載入中...</div>
                  </div>
                </>
              ) : (
                // 正常狀態
                <>
                  <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="text-2xl font-bold text-amber-600 mb-1">
                      {studentsWithoutAssessment.length}
                    </div>
                    <div className="text-sm text-amber-700 font-medium">未評估</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {studentsAssessed.length}
                    </div>
                    <div className="text-sm text-green-700 font-medium">已評估</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {studentsNoTree.length}
                    </div>
                    <div className="text-sm text-red-700 font-medium">未分配成長樹</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 展開狀態 - 顯示詳細內容 */}
          {studentProgressExpanded && (
            <>
              {/* 載入動畫 */}
              {loadingStudents && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-[#EADBC8] border-t-[#A64B2A] rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm text-hanami-text-secondary">載入學生資料中...</p>
                  </div>
                </div>
              )}

              {/* 學生評估內容 */}
              {!loadingStudents && (
                <>
                  {/* 未評估學生 */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                      <h4 className="font-semibold text-[#4B4036]">未評估 ({studentsWithoutAssessment.length})</h4>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {studentsWithoutAssessment.length > 0 ? (
                        studentsWithoutAssessment.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:border-amber-300 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-sm">
                                  <span className="text-white text-xs font-bold">
                                    {student.full_name.charAt(0)}
                                  </span>
                                </div>
              <div>
                                  <p className="font-medium text-[#4B4036] text-sm">
                                    {student.full_name}
                                  </p>
                                  <p className="text-xs text-[#87704e]">
                                    {student.course_type || '未設定課程'}
                                  </p>
              </div>
            </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                  {student.lesson_time || '時間未定'}
                                </span>
                                <span className="text-gray-500">
                                  最後評估: {student.last_assessment_date ? new Date(student.last_assessment_date).toLocaleDateString('zh-TW') : '從未評估'}
                                </span>
        </div>
    </div>
                            <div className="text-right">
                              <button
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500 transition-all duration-200 shadow-sm"
                                onClick={() => {
                                  setSelectedStudentForAssessment(student);
                                  setShowAssessmentModal(true);
                                }}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                新增評估
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[#87704e] text-sm">
                          <svg className="h-8 w-8 mx-auto mb-1 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <p>所有學生都已評估</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 已評估學生 */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <h4 className="font-semibold text-[#4B4036]">已評估 ({studentsAssessed.length})</h4>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {studentsAssessed.length > 0 ? (
                        studentsAssessed.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-green-300 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-sm">
                                  <span className="text-white text-xs font-bold">
                                    {student.full_name.charAt(0)}
                                  </span>
                                </div>
            <div>
                                  <p className="font-medium text-[#4B4036] text-sm">
                                    {student.full_name}
                                  </p>
                                  <p className="text-xs text-[#87704e]">
                                    {student.course_type || '未設定課程'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                  {student.lesson_time || '時間未定'}
                                </span>
                                <span className="text-gray-500">
                                  已評估 ✓
                                </span>
                              </div>
            </div>
            <div className="text-right">
                              <button
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-green-400 to-emerald-400 text-white hover:from-green-500 hover:to-emerald-500 transition-all duration-200 shadow-sm"
                                onClick={() => {
                                  setSelectedStudentForAssessment(student);
                                  setShowAssessmentModal(true);
                                }}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                修改評估
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[#87704e] text-sm">
                          <svg className="h-8 w-8 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>沒有已評估的學生</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 未分配成長樹學生 */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <h4 className="font-semibold text-[#4B4036]">未分配成長樹 ({studentsNoTree.length})</h4>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {studentsNoTree.length > 0 ? (
                        studentsNoTree.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-rose-400 rounded-full flex items-center justify-center shadow-sm">
                                  <span className="text-white text-xs font-bold">
                                    {student.full_name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-[#4B4036] text-sm">
                                    {student.full_name}
                                  </p>
                                  <p className="text-xs text-[#87704e]">
                                    {student.course_type || '未設定課程'}
              </p>
            </div>
          </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                  {student.lesson_time || '時間未定'}
                                </span>
                                <span className="text-gray-500">
                                  最後評估: {student.last_assessment_date ? new Date(student.last_assessment_date).toLocaleDateString('zh-TW') : '從未評估'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <button
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-red-400 to-rose-400 text-white hover:from-red-500 hover:to-rose-500 transition-all duration-200 shadow-sm"
                                onClick={() => {
                                  setSelectedStudentForTreeAssignment(student);
                                  setShowTreeAssignmentModal(true);
                                }}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                分配成長樹
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[#87704e] text-sm">
                          <svg className="h-8 w-8 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <p>所有學生都已分配成長樹</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </Card3D>
      </div>

      {/* 學生媒體狀態 */}
      <div>
        <Card3D>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Image
                src="/camera.png"
                alt="相機"
                width={32}
                height={32}
                className="mr-3"
              />
              <h3 className="text-xl font-bold text-[#4B4036]">
                今天 學生媒體狀態
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8B7355] px-3 py-2 bg-gray-100 rounded-md">
                {todayMediaDate}
              </span>
              <button
                onClick={() => setStudentMediaExpanded(!studentMediaExpanded)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-[#FFF9F2] hover:bg-[#EADBC8] rounded-lg transition-colors"
              >
                <span className="text-[#4B4036] font-medium">
                  {studentMediaExpanded ? '收起' : '展開'}
                </span>
                <svg
                  className={`w-4 h-4 text-[#4B4036] transition-transform duration-200 ${
                    studentMediaExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* 收起狀態 - 只顯示數字 */}
          {!studentMediaExpanded && (
            <div className="grid grid-cols-2 gap-4">
              {loadingMediaStudents ? (
                // 載入狀態
                <>
                  <div className="text-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="text-2xl font-bold text-gray-400 mb-1">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">載入中...</div>
                    <div className="text-xs text-gray-400 mt-1">優化載入中</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="text-2xl font-bold text-gray-400 mb-1">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">載入中...</div>
                    <div className="text-xs text-gray-400 mt-1">優化載入中</div>
                  </div>
                </>
              ) : (
                // 正常狀態
                <>
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {studentsWithoutMedia.length}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">未上傳</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {studentsWithMedia.length}
                    </div>
                    <div className="text-sm text-purple-700 font-medium">已上傳</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 展開狀態 - 顯示詳細內容 */}
          {studentMediaExpanded && (
            <>
              {/* 載入動畫 */}
              {loadingMediaStudents && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-[#EADBC8] border-t-[#A64B2A] rounded-full animate-spin"></div>
                    </div>
                    <p className="text-[#87704e] text-sm">載入學生媒體狀態中...</p>
                  </div>
                </div>
              )}

              {/* 詳細內容 */}
              {!loadingMediaStudents && (
                <>
                  {/* 未上傳媒體學生 */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <h4 className="font-semibold text-[#4B4036]">未上傳媒體 ({studentsWithoutMedia.length})</h4>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {studentsWithoutMedia.length > 0 ? (
                        studentsWithoutMedia.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center shadow-sm">
                                  <span className="text-white text-xs font-bold">
                                    {student.full_name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-[#4B4036] text-sm">
                                    {student.full_name}
                                  </p>
                                  <p className="text-xs text-[#87704e]">
                                    {student.course_type || '未設定課程'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                  {student.lesson_time || '時間未定'}
                                </span>
                                <span className="text-gray-500">
                                  最後上傳: {student.last_assessment_date ? new Date(student.last_assessment_date).toLocaleDateString('zh-TW') : '從未上傳'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <button
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-blue-400 to-indigo-400 text-white hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-sm"
                                onClick={() => {
                                  setSelectedStudentForMediaUpload(student);
                                  setShowMediaUploadModal(true);
                                }}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                上傳媒體
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[#87704e] text-sm">
                          <svg className="h-8 w-8 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p>所有學生都已上傳媒體</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 已上傳媒體學生 */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <h4 className="font-semibold text-[#4B4036]">已上傳媒體 ({studentsWithMedia.length})</h4>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {studentsWithMedia.length > 0 ? (
                        studentsWithMedia.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-violet-400 rounded-full flex items-center justify-center shadow-sm">
                                  <span className="text-white text-xs font-bold">
                                    {student.full_name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-[#4B4036] text-sm">
                                    {student.full_name}
                                  </p>
                                  <p className="text-xs text-[#87704e]">
                                    {student.course_type || '未設定課程'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                  {student.lesson_time || '時間未定'}
                                </span>
                                <span className="text-gray-500">
                                  已上傳 ✓
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <button
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-purple-400 to-violet-400 text-white hover:from-purple-500 hover:to-violet-500 transition-all duration-200 shadow-sm"
                                onClick={() => {
                                  setSelectedStudentForMediaUpload(student);
                                  setShowMediaUploadModal(true);
                                }}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                查看媒體
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[#87704e] text-sm">
                          <svg className="h-8 w-8 mx-auto mb-1 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p>沒有已上傳媒體的學生</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </Card3D>
      </div>

      {/* 快速功能 */}
      <div>
        <Card3D>
          <h3 className="text-xl font-bold text-[#4B4036] mb-4">快速功能</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {canViewGrowthTree && (
              <button
                onClick={() => setActiveTab('growth-tree')}
                className="flex flex-col items-center p-4 bg-[#FFF9F2] rounded-xl border border-[#EADBC8] hover:bg-[#EADBC8] transition-colors"
              >
                <Image
                  src="/leaf-sprout.png"
                  alt="成長樹"
                  width={32}
                  height={32}
                  className="mb-2"
                />
                <span className="text-sm font-medium text-[#4B4036]">成長樹</span>
              </button>
            )}
            {canViewAbilityDevelopment && (
              <button
                onClick={() => setActiveTab('ability-development')}
                className="flex flex-col items-center p-4 bg-[#FFF9F2] rounded-xl border border-[#EADBC8] hover:bg-[#EADBC8] transition-colors"
              >
                <Image
                  src="/icons/bear-face.PNG"
                  alt="能力發展"
                  width={32}
                  height={32}
                  className="mb-2"
                />
                <span className="text-sm font-medium text-[#4B4036]">能力發展</span>
              </button>
            )}
            {canViewTeachingActivities && (
              <button
                onClick={() => setActiveTab('teaching-activities')}
                className="flex flex-col items-center p-4 bg-[#FFF9F2] rounded-xl border border-[#EADBC8] hover:bg-[#EADBC8] transition-colors"
              >
                <Image
                  src="/icons/elephant.PNG"
                  alt="教學活動"
                  width={32}
                  height={32}
                  className="mb-2"
                />
                <span className="text-sm font-medium text-[#4B4036]">教學活動</span>
              </button>
            )}
            {canViewAbilityAssessment && (
              <button
                onClick={() => setActiveTab('ability-assessment')}
                className="flex flex-col items-center p-4 bg-[#FFF9F2] rounded-xl border border-[#EADBC8] hover:bg-[#EADBC8] transition-colors"
              >
                <Image
                  src="/icons/penguin-face.PNG"
                  alt="能力評估"
                  width={32}
                  height={32}
                  className="mb-2"
                />
                <span className="text-sm font-medium text-[#4B4036]">能力評估</span>
              </button>
            )}
            </div>
        </Card3D>
        </div>
    </div>
  );
  // 渲染個人資料
  const renderProfile = () => (
    <div
      className="space-y-6"
    >
      {/* 個人資料管理 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-xl flex items-center justify-center">
            <Image
              src="/icons/user-profile.png"
              alt="個人資料"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </div>
              <div>
            <h3 className="text-lg font-semibold text-[#4B4036]">個人資料管理</h3>
            <p className="text-sm text-[#2B3A3B]">管理您的個人資訊</p>
              </div>
            </div>

        {teacherData ? (
    <div className="space-y-4">
            {/* 儲存訊息 */}
            {saveMessage && (
              <div className={`p-4 rounded-xl ${
                saveMessage.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {saveMessage.text}
        </div>
            )}

            {/* 姓名 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">姓名</label>
              <input
                type="text"
                value={profileForm.teacher_fullname}
                onChange={(e) => handleProfileChange('teacher_fullname', e.target.value)}
                placeholder="請輸入您的姓名"
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
              />
    </div>

            {/* 暱稱 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">暱稱 *</label>
              <input
                type="text"
                value={profileForm.teacher_nickname}
                onChange={(e) => handleProfileChange('teacher_nickname', e.target.value)}
                placeholder="請輸入您的暱稱"
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
              />
            </div>

            {/* 電子郵件 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">電子郵件</label>
              <input
                type="email"
                value={profileForm.teacher_email}
                onChange={(e) => handleProfileChange('teacher_email', e.target.value)}
                placeholder="請輸入您的電子郵件"
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
              />
            </div>

            {/* 電話 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">電話</label>
              <input
                type="tel"
                value={profileForm.teacher_phone}
                onChange={(e) => handleProfileChange('teacher_phone', e.target.value)}
                placeholder="請輸入您的電話號碼"
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
              />
            </div>

            {/* 地址 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">地址</label>
              <textarea
                value={profileForm.teacher_address}
                onChange={(e) => handleProfileChange('teacher_address', e.target.value)}
                placeholder="請輸入您的地址"
                rows={3}
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
              />
            </div>

            {/* 生日 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">生日</label>
              <input
                type="date"
                value={profileForm.teacher_dob}
                onChange={(e) => handleProfileChange('teacher_dob', e.target.value)}
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
              />
            </div>

            {/* 背景資料 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">教育背景</label>
              <textarea
                value={profileForm.teacher_background}
                onChange={(e) => handleProfileChange('teacher_background', e.target.value)}
                placeholder="請輸入您的教育背景、專業資格等"
                rows={4}
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
              />
            </div>

            {/* 銀行資訊 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">銀行帳號</label>
              <input
                type="text"
                value={profileForm.teacher_bankid}
                onChange={(e) => handleProfileChange('teacher_bankid', e.target.value)}
                placeholder="請輸入銀行帳號"
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
              />
            </div>

            {/* 課程角色備註 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">課程角色備註</label>
              <textarea
                value={profileForm.course_roles_note}
                onChange={(e) => handleProfileChange('course_roles_note', e.target.value)}
                placeholder="請輸入您的課程角色備註"
                rows={3}
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
              />
            </div>

            {/* 密碼設定 */}
            <div className="pt-4 border-t border-[#EADBC8]">
              <h4 className="text-md font-medium text-[#4B4036] mb-4">密碼設定</h4>
    <div className="space-y-4">
            <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2">舊密碼</label>
                  <input
                    type="password"
                    value={profileForm.old_password}
                    onChange={(e) => handleProfileChange('old_password', e.target.value)}
                    placeholder="請輸入舊密碼"
                    className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
                  />
            </div>
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2">新密碼</label>
                  <input
                    type="password"
                    value={profileForm.new_password}
                    onChange={(e) => handleProfileChange('new_password', e.target.value)}
                    placeholder="請輸入新密碼"
                    className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
                  />
            </div>
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2">確認新密碼</label>
                  <input
                    type="password"
                    value={profileForm.confirm_password}
                    onChange={(e) => handleProfileChange('confirm_password', e.target.value)}
                    placeholder="請再次輸入新密碼"
                    className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:border-[#FFD59A] transition-all duration-200"
                  />
          </div>
              </div>
            </div>

            {/* 儲存按鈕 */}
            <div className="pt-4">
              <button 
                onClick={handleSaveProfile}
                disabled={saving}
                className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                  saving 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:shadow-lg'
                }`}
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-[#4B4036] border-t-transparent rounded-full animate-spin mr-2"></div>
                    儲存中...
                  </div>
                ) : (
                  '儲存變更'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-[#8B7355] mb-4">載入中...</div>
            <div className="w-8 h-8 border-4 border-[#FFD59A] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
  // 渲染成長樹管理頁面
  const renderGrowthTree = () => {
    console.log('renderGrowthTree 被調用，trees 數量:', trees.length);
    console.log('trees 數據:', trees);
    
    return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#4B4036] mb-2">成長樹管理</h2>
        <p className="text-[#8B7355]">管理教學成長樹和學習目標</p>
      </div>

      {/* 導航按鈕區域 */}
      <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => setActiveTab('dashboard')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            儀表板
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#A64B2A] text-white hover:bg-[#8B3A1F] transition-colors"
            onClick={() => setActiveTab('growth-tree')}
          >
            <Image
              src="/icons/bear-face.PNG"
              alt="成長樹"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            成長樹管理
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => setActiveTab('ability-development')}
          >
            <Image
              src="/icons/elephant.PNG"
              alt="能力發展"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            發展能力圖卡
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => setActiveTab('teaching-activities')}
          >
            <Image
              src="/icons/music.PNG"
              alt="教學活動"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            教學活動管理
          </button>
        </div>
      </div>

      {/* 搜尋和篩選工具列 */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-[#EADBC8]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* 搜尋和篩選 */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                placeholder="搜尋成長樹名稱或描述..."
                type="text"
                value={growthTreeFilters.search}
                onChange={(e) => handleGrowthTreeFilterChange('search', e.target.value)}
              />
            </div>
            
            {/* 成長樹等級多選篩選 */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[140px]"
                type="button"
                onClick={() => handleFilterPopupOpen('tree_levels')}
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span className="text-sm text-gray-700">成長樹等級</span>
                {growthTreeFilters.tree_levels.length > 0 && (
                  <span className="ml-auto bg-[#A64B2A] text-white text-xs rounded-full px-2 py-1">
                    {growthTreeFilters.tree_levels.length}
                  </span>
                )}
              </button>
            </div>

            {/* 狀態多選篩選 */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[100px]"
                type="button"
                onClick={() => handleFilterPopupOpen('statuses')}
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span className="text-sm text-gray-700">狀態</span>
                {growthTreeFilters.statuses.length > 0 && (
                  <span className="ml-auto bg-[#A64B2A] text-white text-xs rounded-full px-2 py-1">
                    {growthTreeFilters.statuses.length}
                  </span>
                )}
              </button>
            </div>

            {/* 能力多選篩選 */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[100px]"
                type="button"
                onClick={() => handleFilterPopupOpen('abilities')}
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span className="text-sm text-gray-700">能力</span>
              </button>
            </div>

            {/* 活動多選篩選 */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors min-w-[100px]"
                type="button"
                onClick={() => handleFilterPopupOpen('activities')}
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                <span className="text-sm text-gray-700">活動</span>
                {growthTreeFilters.activities.length > 0 && (
                  <span className="ml-auto bg-[#A64B2A] text-white text-xs rounded-full px-2 py-1">
                    {growthTreeFilters.activities.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 清除篩選按鈕 */}
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              onClick={clearGrowthTreeFilters}
            >
              清除篩選
            </button>
          </div>
        </div>

        {/* 已選擇的篩選條件顯示 */}
        {(growthTreeFilters.tree_levels.length > 0 || growthTreeFilters.statuses.length > 0 || growthTreeFilters.abilities.length > 0 || growthTreeFilters.activities.length > 0) && (
          <div className="mt-4 pt-4 border-t border-[#EADBC8]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">已選擇的篩選條件：</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {growthTreeFilters.tree_levels.map(level => (
                <span key={level} className="inline-flex items-center gap-1 px-2 py-1 bg-[#A64B2A] text-white text-xs rounded-full">
                  等級 {level}
                  <button
                    onClick={() => handleGrowthTreeFilterChange('tree_levels', growthTreeFilters.tree_levels.filter(l => l !== level))}
                    className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {growthTreeFilters.statuses.map(status => (
                <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-[#A64B2A] text-white text-xs rounded-full">
                  {status === 'active' ? '啟用' : '停用'}
                  <button
                    onClick={() => handleGrowthTreeFilterChange('statuses', growthTreeFilters.statuses.filter(s => s !== status))}
                    className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              {growthTreeFilters.abilities.map(abilityId => {
                const ability = abilitiesOptions.find(a => a.value === abilityId);
                return (
                  <span key={abilityId} className="inline-flex items-center gap-1 px-2 py-1 bg-[#A64B2A] text-white text-xs rounded-full">
                    {ability?.label || abilityId}
                    <button
                      onClick={() => handleGrowthTreeFilterChange('abilities', growthTreeFilters.abilities.filter(a => a !== abilityId))}
                      className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              {growthTreeFilters.activities.map(activityId => {
                const activity = activitiesOptions.find(a => a.value === activityId);
                return (
                  <span key={activityId} className="inline-flex items-center gap-1 px-2 py-1 bg-[#A64B2A] text-white text-xs rounded-full">
                    {activity?.label || activityId}
                    <button
                      onClick={() => handleGrowthTreeFilterChange('activities', growthTreeFilters.activities.filter(a => a !== activityId))}
                      className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 操作按鈕 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors shadow-sm"
            onClick={() => {
              setShowAddTreeModal(true);
              resetTreeForm();
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增成長樹
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8B7355]">
          <span>共 {getFilteredTrees().length} 個成長樹</span>
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card3D className="p-6 text-center">
          <div className="text-2xl font-bold text-[#4B4036] mb-2">
            {getFilteredTrees().length}
          </div>
          <div className="text-sm text-[#8B7355]">總成長樹數</div>
        </Card3D>
        
        <Card3D className="p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {getFilteredTrees().filter(tree => tree.is_active).length}
          </div>
          <div className="text-sm text-[#8B7355]">啟用中</div>
        </Card3D>
        
        <Card3D className="p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {goals.length}
          </div>
          <div className="text-sm text-[#8B7355]">總目標數</div>
        </Card3D>
        
        <Card3D className="p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {abilitiesOptions.length}
          </div>
          <div className="text-sm text-[#8B7355]">相關能力</div>
        </Card3D>
      </div>

      {/* 彈出選擇組件 */}
      {showPopup.open && (
        <PopupSelect
          mode="multiple"
          options={
            showPopup.field === 'tree_levels'
              ? [1, 2, 3, 4, 5].map(level => ({ value: level.toString(), label: `等級 ${level}` }))
              : showPopup.field === 'statuses'
              ? [
                  { value: 'active', label: '啟用' },
                  { value: 'inactive', label: '停用' }
                ]
              : showPopup.field === 'abilities'
              ? abilitiesOptions
              : showPopup.field === 'activities'
              ? activitiesOptions
              : []
          }
          selected={popupSelected}
          title={
            showPopup.field === 'tree_levels' ? '選擇成長樹等級' :
            showPopup.field === 'statuses' ? '選擇狀態' :
            showPopup.field === 'abilities' ? '選擇能力' :
            showPopup.field === 'activities' ? '選擇活動' : '選擇'
          }
          onCancel={handleFilterPopupCancel}
          onChange={(value: string | string[]) => setPopupSelected(value)}
          onConfirm={handleFilterPopupConfirm}
        />
      )}
      {/* 成長樹列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredTrees().length > 0 ? (
          getFilteredTrees().map((tree) => {
            const treeGoals = getGoalsForTree(tree.id);
            const completedGoals = treeGoals.filter(goal => goal.is_completed).length;
            const totalGoals = treeGoals.length;
            const progressPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
            
            return (
              <Card3D key={tree.id} className="p-6 rounded-2xl shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer border border-[#EADBC8] relative" onClick={() => {
                console.log('卡片被點擊，tree:', tree);
                openDetailModal(tree);
              }}>
                {/* 標題和描述區域 */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#4B4036] mb-2 flex items-center gap-2">
                    <span className="text-2xl">{tree.tree_icon || '🌳'}</span>
                    {tree.tree_name}
                  </h3>
                  <p className="text-sm text-[#8B7355] mb-3">{tree.tree_description || '無描述'}</p>
                </div>

                {/* 操作按鈕區域 - 移到標題下方 */}
                <div className="flex justify-end space-x-2 mb-4">
                  <button
                    className="p-2 rounded-full bg-[#EBC9A4] hover:bg-[#FFB6C1] shadow text-[#4B4036] transition-colors"
                    title="編輯"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTree(tree);
                    }}
                  >
                    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <path d="M15.232 5.232a3 3 0 1 1 4.243 4.243L7.5 21H3v-4.5L15.232 5.232Z" stroke="#A64B2A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                  </button>
                  {deletingTree === tree.id ? (
                    <div className="flex space-x-2">
                      <button
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTree(tree.id);
                        }}
                      >
                        確認
                      </button>
                      <button
                        className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTree(null);
                        }}
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      className="p-2 rounded-full bg-[#FFE0E0] hover:bg-red-400 shadow text-[#4B4036] transition-colors"
                      title="刪除"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingTree(tree.id);
                      }}
                    >
                      <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                        <path d="M6 18 18 6M6 6l12 12" stroke="#A64B2A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-[#8B7355] gap-2">
                    <span>課程類型: {tree.course_type_name || '未設定'}</span>
                    <span>等級: Lv.{tree.tree_level || 1}</span>
                    <span>狀態: {tree.is_active ? '啟用' : '停用'}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[#4B4036]">目標進度</span>
                    <span className="text-sm text-[#8B7355]">{completedGoals}/{totalGoals}</span>
                  </div>
                  <div className="w-full bg-[#FFFDF8] rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }} 
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[#4B4036]">目標列表:</p>
                    {treeGoals.length > 3 && (
                      <button
                        onClick={() => toggleTreeExpansion(tree.id)}
                        className="text-xs text-[#A64B2A] hover:text-[#8B3A1F] transition-colors flex items-center gap-1"
                      >
                        {expandedTrees.has(tree.id) ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            收起
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            展開 ({treeGoals.length - 3} 個更多)
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {treeGoals.length > 0 ? (
                      treeGoals
                        .slice(0, expandedTrees.has(tree.id) ? treeGoals.length : 3)
                        .map((goal) => (
                          <div key={goal.id} className="flex items-center text-sm gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                            <span className={`w-2 h-2 rounded-full mr-2 ${goal.is_completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={`text-xs ${goal.is_completed ? 'text-green-600' : 'text-[#8B7355]'}`}>
                              {goal.goal_icon || '⭐'} {goal.goal_name}
                            </span>
                            <span className={`text-xs ml-auto ${goal.is_completed ? 'text-green-600' : 'text-gray-400'}`}>
                              {goal.is_completed ? '✓' : '○'}
                            </span>
                          </div>
                        ))
                    ) : (
                      <div className="text-xs text-gray-400">暫無目標</div>
                    )}
                    {!expandedTrees.has(tree.id) && treeGoals.length > 3 && (
                      <div className="text-xs text-gray-400 italic">
                        ... 還有 {treeGoals.length - 3} 個目標
                      </div>
                    )}
                  </div>
                </div>
              </Card3D>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-[#8B7355]">
              {trees.length === 0 ? '尚無成長樹資料' : '沒有符合篩選條件的成長樹'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
  };
  // 渲染能力發展圖卡頁面
  const renderAbilityDevelopment = () => {
    if (abilityLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-hanami-primary" />
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#4B4036] mb-2">發展能力圖卡</h2>
          <p className="text-[#8B7355]">管理學生發展能力評估</p>
        </div>

        {/* 導航按鈕區域 */}
        <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => setActiveTab('dashboard')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              儀表板
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => setActiveTab('growth-tree')}
            >
              <Image
                src="/icons/bear-face.PNG"
                alt="成長樹"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              成長樹管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#A64B2A] text-white hover:bg-[#8B3A1F] transition-colors"
              onClick={() => setActiveTab('ability-development')}
            >
              <Image
                src="/icons/elephant.PNG"
                alt="能力發展"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              發展能力圖卡
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => setActiveTab('teaching-activities')}
            >
              <Image
                src="/icons/music.PNG"
                alt="教學活動"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              教學活動管理
            </button>
          </div>
        </div>

        {/* 錯誤訊息 */}
        {abilityError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {abilityError}
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors shadow-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增能力圖卡
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8B7355]">
            <span>共 {abilities.length} 個能力圖卡</span>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card3D className="p-6 text-center">
            <div className="text-2xl font-bold text-[#4B4036] mb-2">
              {abilities.length}
            </div>
            <div className="text-sm text-[#8B7355]">總能力數</div>
          </Card3D>
          
          <Card3D className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {abilities.filter(a => a.is_active !== false).length}
            </div>
            <div className="text-sm text-[#8B7355]">啟用中</div>
          </Card3D>
          
          <Card3D className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {new Set(abilities.map(a => a.category).filter(Boolean)).size}
            </div>
            <div className="text-sm text-[#8B7355]">能力分類</div>
          </Card3D>
          
          <Card3D className="p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {Math.max(...abilities.map(a => a.max_level || 5), 5)}
            </div>
            <div className="text-sm text-[#8B7355]">能力等級</div>
          </Card3D>
        </div>

        {/* 能力概覽 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {abilities.map((ability) => (
            <Card3D key={ability.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
              <div className="p-4 text-center">
                {/* 能力圖標 */}
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: ability.ability_color || '#FFB6C1' }}
                >
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                
                {/* 能力名稱 */}
                <h3 className="font-bold text-base text-hanami-text mb-2">
                  {ability.ability_name}
                </h3>
                
                {/* 能力描述 */}
                <p className="text-xs text-hanami-text-secondary mb-3 leading-relaxed line-clamp-2">
                  {ability.ability_description}
                </p>
                
                {/* 能力類別標籤 */}
                {ability.category && (
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 text-xs bg-hanami-primary/20 text-hanami-text border border-hanami-primary/30 rounded-full">
                      {ability.category}
                    </span>
                  </div>
                )}
                
                {/* 操作按鈕 */}
                <div className="mb-3 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => {
                      setSelectedAbility(ability);
                      setShowLevelManager(true);
                    }}
                    className="p-1.5 text-[#A68A64] hover:bg-[#FFF9F2] rounded-full transition-colors"
                    title="等級管理"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setEditingAbility(ability);
                      setShowEditModal(true);
                    }}
                    className="p-1.5 text-[#A64B2A] hover:bg-[#FFF9F2] rounded-full transition-colors"
                    title="編輯能力"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232a3 3 0 1 1 4.243 4.243L7.5 21H3v-4.5L15.232 5.232Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(ability)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="刪除能力"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                {/* 需要此能力的成長樹 */}
                <div className="space-y-1 pt-2 border-t border-[#EADBC8]/50">
                  <div className="text-xs text-hanami-text-secondary font-medium mb-1">相關成長樹</div>
                  {(() => {
                    const treesForAbility = getGrowthTreesForAbility(ability.id);
                    return (
                      <>
                        {treesForAbility.slice(0, 2).map((tree) => {
                          const requirementCount = getAbilityRequirementCount(tree.id, ability.id);
                          return (
                            <div key={tree.id} className="flex items-center justify-between text-xs">
                              <span className="truncate text-[#87704e]">
                                {tree.tree_name}
                              </span>
                              <span className="font-medium text-hanami-primary bg-hanami-primary/10 px-1.5 py-0.5 rounded-full text-xs">
                                {requirementCount}
                              </span>
                            </div>
                          );
                        })}
                        {treesForAbility.length > 2 && (
                          <div className="text-xs text-hanami-text-secondary">
                            +{treesForAbility.length - 2} 個
                          </div>
                        )}
                        {treesForAbility.length === 0 && (
                          <div className="text-xs text-hanami-text-secondary">
                            暫無相關
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </Card3D>
          ))}
        </div>

        {abilities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#8B7355]">
              尚無能力圖卡資料
            </p>
          </div>
        )}
        {/* 新增能力模態框 */}
        {showCreateModal && (
          <>
            {/* 彈出選擇組件 */}
            {showPopup.open && (
              <PopupSelect
                mode="single"
                options={customOptions.ability_categories.map(cat => ({ value: cat.id, label: cat.name }))}
                selected={popupSelected}
                title="選擇能力類別"
                onCancel={handlePopupCancel}
                onChange={(value: string | string[]) => setPopupSelected(value)}
                onConfirm={handlePopupConfirm}
              />
            )}

            {/* 自訂管理彈出視窗 */}
            {showCustomManager.open && (
              <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-[60]">
                <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="p-4 md:p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl md:text-2xl font-bold text-hanami-text">
                        管理能力類別
                      </h2>
                      <button
                        className="text-sm text-red-600 hover:text-red-800 underline"
                        onClick={() => {
                          if (confirm('確定要重置所有預設類別嗎？這將恢復所有預設類別到原始狀態。')) {
                            localStorage.removeItem('hanami_modified_defaults');
                            loadCustomOptions();
                            toast.success('已重置所有預設類別！');
                          }
                        }}
                      >
                        重置預設
                      </button>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 space-y-4">
                    {/* 新增/編輯表單 */}
                    {(editingOption || !customOptions.ability_categories.length) && (
                      <Card3D className="p-4">
                        <h3 className="text-lg font-semibold text-hanami-text mb-4">
                          {editingOption ? '編輯類別' : '新增類別'}
                        </h3>
                        <div className="space-y-3">
                          <HanamiInput
                            label="類別名稱"
                            placeholder="請輸入類別名稱"
                            value={newOptionName}
                            onChange={(e) => setNewOptionName(e.target.value)}
                          />
                          
                          {/* 預設類別選擇 */}
                          {!editingOption && (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="isDefaultOption"
                                checked={isDefaultOption}
                                onChange={(e) => setIsDefaultOption(e.target.checked)}
                                className="rounded border-gray-300 text-hanami-primary focus:ring-hanami-primary"
                              />
                              <label htmlFor="isDefaultOption" className="text-sm text-hanami-text">
                                設為預設類別
                              </label>
                              <span className="text-xs text-hanami-text-secondary">
                                (預設類別會在所有能力編輯中優先顯示)
                              </span>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <HanamiButton
                              variant="primary"
                              onClick={editingOption ? handleEditCustomOption : handleAddCustomOption}
                              disabled={!newOptionName.trim()}
                            >
                              {editingOption ? '更新' : '新增'}
                            </HanamiButton>
                            <HanamiButton 
                              variant="secondary" 
                              onClick={() => {
                                setEditingOption(null);
                                setNewOptionName('');
                                setIsDefaultOption(false);
                              }}
                            >
                              取消
                            </HanamiButton>
                          </div>
                        </div>
                      </Card3D>
                    )}

                    {/* 新增按鈕 */}
                    {!editingOption && customOptions.ability_categories.length > 0 && (
                      <HanamiButton
                        variant="primary"
                        onClick={() => setEditingOption({ id: '', name: '', is_default: false })}
                        className="w-full"
                      >
                        + 新增類別
                      </HanamiButton>
                    )}

                    {/* 現有類別列表 */}
                    <div>
                      <h3 className="text-lg font-semibold text-hanami-text mb-4">現有類別</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {customOptions.ability_categories.map((option) => (
                          <div key={option.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.name}</span>
                              {option.is_default && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">預設</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="text-blue-600 hover:text-blue-800 px-2 py-1 text-sm"
                                onClick={() => {
                                  console.log('編輯按鈕被點擊！選項:', option);
                                  startEditOption(option);
                                }}
                              >
                                編輯
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                                onClick={() => {
                                  console.log('刪除按鈕被點擊！選項 ID:', option.id);
                                  handleDeleteCustomOption(option.id);
                                }}
                              >
                                刪除
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 border-t border-gray-200 flex justify-end">
                    <HanamiButton
                      variant="secondary"
                      onClick={handleCustomManagerClose}
                    >
                      關閉
                    </HanamiButton>
                  </div>
                </div>
              </div>
            )}

            {/* 主新增模態框 */}
            <div className="fixed inset-0 bg-gradient-to-br from-[#FFF9F2]/80 to-[#FFD59A]/60 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold text-hanami-text mb-4">
                  新增發展能力
                </h2>
                
                <div className="space-y-4">
                  <HanamiInput
                    required
                    label="能力名稱"
                    placeholder="例如：小肌發展"
                    value={newAbility.ability_name}
                    onChange={e => setNewAbility({ ...newAbility, ability_name: e.target.value })}
                  />

                  <HanamiInput
                    label="能力描述"
                    placeholder="能力的詳細描述"
                    value={newAbility.ability_description}
                    onChange={e => setNewAbility({ ...newAbility, ability_description: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <HanamiInput
                      label="最大等級"
                      placeholder="1~10"
                      type="number"
                      min={1}
                      max={10}
                      value={newAbility.max_level.toString()}
                      onChange={e => setNewAbility({ ...newAbility, max_level: parseInt(e.target.value) || 5 })}
                    />

                    <div>
                      <label className="block text-sm font-medium text-hanami-text mb-2">
                        主題色彩
                      </label>
                      <input
                        className="w-full h-10 rounded-lg border border-hanami-border"
                        type="color"
                        value={newAbility.ability_color}
                        onChange={e => setNewAbility({ ...newAbility, ability_color: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* 能力類別選擇 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-hanami-text">
                        能力類別
                      </label>
                      <button
                        className="text-sm text-hanami-primary hover:text-hanami-accent underline"
                        type="button"
                        onClick={() => handleCustomManagerOpen('ability_category')}
                      >
                        管理選項
                      </button>
                    </div>
                    <button
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent text-left bg-white"
                      type="button"
                      onClick={() => handlePopupOpen('category')}
                    >
                      {newAbility.category ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-primary/20 text-hanami-text border border-hanami-primary/30">
                          {newAbility.category}
                        </span>
                      ) : (
                        '請選擇能力類別'
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <HanamiButton
                    className="flex-1"
                    variant="secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    取消
                  </HanamiButton>
                  <HanamiButton
                    className="flex-1"
                    disabled={!newAbility.ability_name}
                    variant="primary"
                    onClick={createAbility}
                  >
                    建立
                  </HanamiButton>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 等級管理模態框 */}
        {showLevelManager && selectedAbility && (
          <AbilityLevelManager
            abilityId={selectedAbility.id}
            abilityName={selectedAbility.ability_name}
            maxLevel={selectedAbility.max_level}
            onClose={() => {
              setShowLevelManager(false);
              setSelectedAbility(null);
            }}
          />
        )}

        {/* 類別管理模態框 */}
        {showCategoryManager && (
          <AbilityCategoryManager
            onClose={() => setShowCategoryManager(false)}
            onCategoryChange={() => {
              loadCategories();
            }}
          />
        )}

        {/* 編輯能力模態框 */}
        {showEditModal && editingAbility && (
          <AbilityEditModal
            ability={editingAbility}
            onClose={() => {
              setShowEditModal(false);
              setEditingAbility(null);
            }}
            onUpdate={(updatedAbility) => {
              setAbilities(abilities.map(a => a.id === updatedAbility.id ? updatedAbility : a));
              setShowEditModal(false);
              setEditingAbility(null);
            }}
          />
        )}

        {/* 刪除確認模態框 */}
        {showDeleteConfirm && abilityToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-100">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  確認刪除能力
                </h3>
                <p className="text-gray-600 mb-6">
                  您確定要刪除能力「<span className="font-semibold text-red-600">{abilityToDelete.ability_name}</span>」嗎？
                  <br />
                  <span className="text-sm text-gray-500">
                    此操作無法復原，請謹慎操作。
                  </span>
                </p>
                <div className="flex gap-3">
                  <HanamiButton
                    variant="secondary"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setAbilityToDelete(null);
                    }}
                    className="flex-1"
                  >
                    取消
                  </HanamiButton>
                  <HanamiButton
                    variant="danger"
                    onClick={() => deleteAbility(abilityToDelete)}
                    className="flex-1"
                  >
                    確認刪除
                  </HanamiButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  // 渲染教學活動管理頁面
  const renderTeachingActivities = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#4B4036] mb-2">教學活動管理</h2>
        <p className="text-[#8B7355]">管理教學活動和課程內容</p>
      </div>

      {/* 導航按鈕區域 */}
      <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => setActiveTab('dashboard')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            儀表板
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => setActiveTab('growth-tree')}
          >
            <Image
              src="/icons/bear-face.PNG"
              alt="成長樹"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            成長樹管理
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
            onClick={() => setActiveTab('ability-development')}
          >
            <Image
              src="/icons/elephant.PNG"
              alt="能力發展"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            發展能力圖卡
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#A64B2A] text-white hover:bg-[#8B3A1F] transition-colors"
            onClick={() => setActiveTab('teaching-activities')}
          >
            <Image
              src="/icons/music.PNG"
              alt="教學活動"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            教學活動管理
          </button>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors shadow-sm"
            onClick={() => setShowAddActivityModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增教學活動
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8B7355]">
          <span>共 {activities.length} 個教學活動</span>
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card3D className="p-6 text-center">
          <div className="text-2xl font-bold text-[#4B4036] mb-2">
            {activities.length}
          </div>
          <div className="text-sm text-[#8B7355]">總活動數</div>
        </Card3D>
        
        <Card3D className="p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {activities.filter(a => a.is_active).length}
          </div>
          <div className="text-sm text-[#8B7355]">啟用中</div>
        </Card3D>
        
        <Card3D className="p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {new Set(activities.map(a => a.category).filter(Boolean)).size}
          </div>
          <div className="text-sm text-[#8B7355]">活動分類</div>
        </Card3D>
        
        <Card3D className="p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {new Set(activities.map(a => a.difficulty_level).filter(Boolean)).size}
          </div>
          <div className="text-sm text-[#8B7355]">難度等級</div>
        </Card3D>
      </div>

      {/* 教學活動列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-[#4B4036] mb-2">還沒有教學活動</h3>
            <p className="text-[#8B7355] mb-4">點擊「新增教學活動」開始創建您的第一個活動</p>
              <button
              className="px-6 py-3 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors"
              onClick={() => setShowAddActivityModal(true)}
            >
              新增教學活動
              </button>
            </div>
        ) : (
          activities.map((activity) => (
            <HanamiCard key={activity.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#4B4036] mb-2 flex items-center gap-2">
                <span className="text-2xl">🎵</span>
                    {activity.activity_name}
              </h3>
                  <p className="text-sm text-[#8B7355] mb-3">{activity.activity_description || '無描述'}</p>
            </div>
                <div className="flex space-x-2">
              <button
                    className="p-2 rounded-full bg-hanami-primary hover:bg-hanami-accent shadow text-hanami-text"
                    title="查看詳情"
                    onClick={() => openActivityDetailModal(activity)}
              >
                    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </button>
              <button
                    className="p-2 rounded-full bg-hanami-secondary hover:bg-hanami-accent shadow text-hanami-text"
                    title="編輯"
                    onClick={() => handleEditActivity(activity)}
              >
                    <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
                      <path d="M15.232 5.232a3 3 0 1 1 4.243 4.243L7.5 21H3v-4.5L15.232 5.232Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
          </div>
          <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-hanami-text-secondary gap-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {activity.activity_type || '未設定'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    等級 {activity.difficulty_level || '未設定'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {activity.estimated_duration || activity.duration_minutes || 0}分鐘
                  </span>
            </div>
          </div>
              {activity.materials_needed && activity.materials_needed.length > 0 && (
          <div className="mb-4">
                  <p className="text-sm font-medium text-hanami-text mb-2">所需材料:</p>
            <div className="flex flex-wrap gap-1">
                    {activity.materials_needed.slice(0, 3).map((material: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-hanami-surface text-hanami-text-secondary text-xs rounded-full"
                      >
                        {material}
                      </span>
                    ))}
                    {activity.materials_needed.length > 3 && (
                      <span className="px-2 py-1 bg-hanami-surface text-hanami-text-secondary text-xs rounded-full">
                        +{activity.materials_needed.length - 3} 更多
                      </span>
                    )}
            </div>
          </div>
              )}
              
              {activity.instructions && (
          <div>
                  <p className="text-sm font-medium text-hanami-text mb-2">操作說明:</p>
                  <p className="text-sm text-hanami-text-secondary line-clamp-2">
                    {activity.instructions}
                  </p>
            </div>
              )}
            </HanamiCard>
          ))
        )}
      </div>

      <div className="text-center py-12">
        <p className="text-[#8B7355]">
          尚無更多教學活動
        </p>
      </div>

      {/* 教學活動詳細模態視窗 */}
      {showActivityDetailModal && selectedActivity && (
        <TeachingActivityDetailModal
          activity={selectedActivity}
          onClose={closeActivityDetailModal}
          onEdit={() => {
            closeActivityDetailModal();
            handleEditActivity(selectedActivity);
          }}
          onDelete={() => {
            // TODO: 實現刪除功能
            console.log('刪除教學活動:', selectedActivity.id);
            closeActivityDetailModal();
          }}
        />
      )}
    </div>
  );

  // 渲染能力評估
  const renderAbilityAssessment = () => (
    <div
      className="space-y-6"
    >
      <div>
        <Card3D>
          <div className="flex items-center mb-4">
            <Image
              src="/icons/penguin-face.PNG"
              alt="能力評估"
              width={32}
              height={32}
              className="mr-3"
            />
            <h3 className="text-xl font-bold text-[#4B4036]">能力評估管理</h3>
          </div>
          <div className="text-center py-8 text-[#8B7355]">
            <Image
              src="/icons/penguin-face.PNG"
              alt="能力評估"
              width={64}
              height={64}
              className="mx-auto mb-4 opacity-50"
            />
            <p>能力評估管理功能</p>
    </div>
        </Card3D>
      </div>
    </div>
  );
  // 渲染今天學生評估狀態頁面
  const renderTodayAssessment = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#4B4036] mb-2">今天 學生評估狀態</h2>
        <p className="text-[#8B7355]">查看今天的學生評估進度</p>
      </div>

      {/* 當老師今天沒有上班時顯示提示 */}
      {!hasTodaySchedule && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">今天沒有上班</h3>
              <p className="text-blue-600">根據您的排程安排，您今天沒有上班，因此沒有學生需要評估。</p>
            </div>
          </div>
        </div>
      )}

      {/* 學生評估狀態卡片 */}
      <Card3D>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Image
              src="/icons/book-elephant.PNG"
              alt="書本"
              width={32}
              height={32}
              className="mr-3"
            />
            <h3 className="text-xl font-bold text-[#4B4036]">
              今天 學生評估狀態
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8B7355] px-3 py-1 bg-gray-100 rounded-md">
              {todayAssessmentDate}
            </span>
          </div>
        </div>

        {/* 載入狀態 */}
        {loadingStudents && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">載入學生評估狀態中...</p>
          </div>
        )}

        {/* 評估狀態統計 - 只有當有課程安排時才顯示 */}
        {!loadingStudents && hasTodaySchedule && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">未評估</p>
                  <p className="text-2xl font-bold text-red-700">{studentsWithoutAssessment.length}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">已評估</p>
                  <p className="text-2xl font-bold text-green-700">{studentsAssessed.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">無成長樹</p>
                  <p className="text-2xl font-bold text-yellow-700">{studentsNoTree.length}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Image
                    src="/icons/bear-face.PNG"
                    alt="成長樹"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 學生列表 - 只有當有課程安排時才顯示 */}
        {!loadingStudents && hasTodaySchedule && (studentsWithoutAssessment.length > 0 || studentsAssessed.length > 0 || studentsNoTree.length > 0) && (
    <div className="space-y-4">
            {/* 未評估學生 */}
            {studentsWithoutAssessment.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  未評估學生 ({studentsWithoutAssessment.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {studentsWithoutAssessment.map((student) => (
                    <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-[#4B4036]">{student.full_name}</h5>
                        <span className="text-xs text-gray-500">{student.lesson_time}</span>
                      </div>
                      <p className="text-sm text-[#87704e] mb-3">{student.course_type || '未設定課程'}</p>
                      <button
                        onClick={() => {
                          setSelectedStudentForAssessment(student);
                          setShowAssessmentModal(true);
                        }}
                        className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium"
                      >
                        開始評估
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 已評估學生 */}
            {studentsAssessed.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  已評估學生 ({studentsAssessed.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {studentsAssessed.map((student) => (
                    <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-[#4B4036]">{student.full_name}</h5>
                        <span className="text-xs text-gray-500">{student.lesson_time}</span>
                      </div>
                      <p className="text-sm text-[#87704e] mb-3">{student.course_type || '未設定課程'}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudentForAssessment(student);
                            setShowAssessmentModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 text-sm font-medium"
                        >
                          重新評估
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentForTreeAssignment(student);
                            setShowTreeAssignmentModal(true);
                          }}
                          className="px-3 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg hover:from-purple-600 hover:to-violet-600 transition-all duration-200 text-sm font-medium"
                        >
                          分配成長樹
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 無成長樹學生 */}
            {studentsNoTree.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  無成長樹學生 ({studentsNoTree.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {studentsNoTree.map((student) => (
                    <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-[#4B4036]">{student.full_name}</h5>
                        <span className="text-xs text-gray-500">{student.lesson_time}</span>
                      </div>
                      <p className="text-sm text-[#87704e] mb-3">{student.course_type || '未設定課程'}</p>
                      <button
                        onClick={() => {
                          setSelectedStudentForTreeAssignment(student);
                          setShowTreeAssignmentModal(true);
                        }}
                        className="w-full px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 text-sm font-medium"
                      >
                        分配成長樹
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card3D>
    </div>
  );

  // 渲染今天學生媒體狀態頁面
  const renderTodayMedia = () => (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#4B4036] mb-2">今天 學生媒體狀態</h2>
        <p className="text-[#8B7355]">查看今天的學生媒體上傳進度</p>
      </div>

      {/* 當老師今天沒有上班時顯示提示 */}
      {!hasTodaySchedule && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">今天沒有上班</h3>
              <p className="text-blue-600">根據您的排程安排，您今天沒有上班，因此沒有學生需要上傳媒體。</p>
            </div>
          </div>
        </div>
      )}

      {/* 學生媒體狀態卡片 */}
      <Card3D>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Image
              src="/camera.png"
              alt="相機"
              width={32}
              height={32}
              className="mr-3"
            />
            <h3 className="text-xl font-bold text-[#4B4036]">
              今天 學生媒體狀態
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8B7355] px-3 py-1 bg-gray-100 rounded-md">
              {todayMediaDate}
            </span>
          </div>
          </div>

        {/* 載入狀態 */}
        {loadingMediaStudents && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">載入學生媒體狀態中...</p>
          </div>
        )}

        {/* 媒體狀態統計 - 只有當有課程安排時才顯示 */}
        {!loadingMediaStudents && hasTodaySchedule && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm font-medium text-red-600">未上傳媒體</p>
                  <p className="text-2xl font-bold text-red-700">{studentsWithoutMedia.length}</p>
            </div>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
            </div>
          </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">已上傳媒體</p>
                  <p className="text-2xl font-bold text-green-700">{studentsWithMedia.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 學生列表 - 只有當有課程安排時才顯示 */}
        {!loadingMediaStudents && hasTodaySchedule && (studentsWithoutMedia.length > 0 || studentsWithMedia.length > 0) && (
          <div className="space-y-4">
            {/* 未上傳媒體學生 */}
            {studentsWithoutMedia.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  未上傳媒體學生 ({studentsWithoutMedia.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {studentsWithoutMedia.map((student) => (
                    <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-[#4B4036]">{student.full_name}</h5>
                        <span className="text-xs text-gray-500">{student.lesson_time}</span>
                      </div>
                      <p className="text-sm text-[#87704e] mb-3">{student.course_type || '未設定課程'}</p>
                      <button
                        onClick={() => {
                          setSelectedStudentForMediaUpload(student);
                          setShowMediaUploadModal(true);
                        }}
                        className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium"
                      >
                        上傳媒體
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 已上傳媒體學生 */}
            {studentsWithMedia.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  已上傳媒體學生 ({studentsWithMedia.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {studentsWithMedia.map((student) => (
                    <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-[#4B4036]">{student.full_name}</h5>
                        <span className="text-xs text-gray-500">{student.lesson_time}</span>
                      </div>
                      <p className="text-sm text-[#87704e] mb-3">{student.course_type || '未設定課程'}</p>
                      <button
                        onClick={() => {
                          setSelectedStudentForMediaUpload(student);
                          setShowMediaUploadModal(true);
                        }}
                        className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg hover:from-purple-600 hover:to-violet-600 transition-all duration-200 text-sm font-medium"
                      >
                        查看媒體
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card3D>
    </div>
  );

  // 渲染內容
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'today-assessment':
        return renderTodayAssessment();
      case 'today-media':
        return renderTodayMedia();
      case 'profile':
        return renderProfile();
      case 'growth-tree':
        return renderGrowthTree();
      case 'ability-development':
        return renderAbilityDevelopment();
      case 'teaching-activities':
        return renderTeachingActivities();
      case 'ability-assessment':
        return renderAbilityAssessment();
      default:
        return renderDashboard();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#4B4036] mb-4">載入中...</div>
          <div className="text-[#87704e]">正在載入教師資料</div>
        </div>
      </div>
    );
  }

  if (error) {
  return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
        <div className="text-center">
          <Image
            src="/hanami.png"
            alt="Hanami Logo"
            width={80}
            height={80}
            className="mx-auto mb-6 rounded-full"
            priority
          />
          <h2 className="text-2xl font-bold text-[#4B4036] mb-4">載入錯誤</h2>
          <p className="text-[#8B7355] mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                checkUserSession();
              }}
              className="px-6 py-3 bg-[#FFD59A] text-[#4B4036] rounded-xl font-medium hover:bg-[#EBC9A4] transition-colors"
            >
              重試
            </button>
            <button
              onClick={() => window.location.href = '/teacher/login'}
              className="px-6 py-3 bg-[#A64B2A] text-white rounded-xl font-medium hover:bg-[#8B3A1F] transition-colors"
            >
              返回登入
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div 
      className="min-h-screen bg-[#FFF9F2]"
    >
      {/* 成功提示模態框 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#4B4036] mb-2">更新成功</h3>
              <p className="text-[#87704e] mb-6">個人資料已成功更新</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] px-6 py-2 rounded-full font-medium transition-colors"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 頂部導航 */}
      <div className="bg-white shadow-sm border-b border-[#EADBC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-[#8B7355] hover:text-[#4B4036] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Image
                src="/hanami.png"
                alt="Hanami Logo"
                width={40}
                height={40}
                className="rounded-full"
                priority
              />
              <h1 className="text-xl font-bold text-[#4B4036]">教師面板</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-[#8B7355] hover:text-[#4B4036] transition-colors"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主內容區域 */}
      <div className="flex flex-1">
        {/* 側邊欄 */}
        <div className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* 側邊欄標題 */}
            <div className="flex items-center justify-between p-4 border-b border-[#EADBC8]">
              <h2 className="text-lg font-semibold text-[#4B4036]">功能選單</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-[#8B7355] hover:text-[#4B4036] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 導航選單 */}
            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-md'
                    : 'text-[#8B7355] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                }`}
              >
                <div className="w-5 h-5 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#4B4036]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <span className="font-medium">儀表板</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('today-assessment');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'today-assessment'
                    ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-md'
                    : 'text-[#8B7355] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                }`}
              >
                <Image
                  src="/icons/book-elephant.PNG"
                  alt="今天學生評估狀態"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="font-medium">今天 學生評估狀態</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('today-media');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'today-media'
                    ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-md'
                    : 'text-[#8B7355] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                }`}
              >
                <Image
                  src="/camera.png"
                  alt="今天學生媒體狀態"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="font-medium">今天 學生媒體狀態</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-md'
                    : 'text-[#8B7355] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                }`}
              >
                <div className="w-5 h-5 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#4B4036]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="font-medium">個人資料</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('growth-tree');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'growth-tree'
                    ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-md'
                    : 'text-[#8B7355] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                }`}
              >
                <Image
                  src="/icons/bear-face.PNG"
                  alt="成長樹"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="font-medium">成長樹管理</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('ability-development');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'ability-development'
                    ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-md'
                    : 'text-[#8B7355] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                }`}
              >
                <Image
                  src="/icons/elephant.PNG"
                  alt="能力發展"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="font-medium">能力發展</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('teaching-activities');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'teaching-activities'
                    ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-md'
                    : 'text-[#8B7355] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                }`}
              >
                <Image
                  src="/icons/music.PNG"
                  alt="教學活動"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="font-medium">教學活動</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('ability-assessment');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === 'ability-assessment'
                    ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-md'
                    : 'text-[#8B7355] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                }`}
              >
                <Image
                  src="/icons/penguin-face.PNG"
                  alt="能力評估"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span className="font-medium">能力評估</span>
              </button>
            </nav>
          </div>
        </div>

        {/* 側邊欄遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-transparent z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 主要內容 */}
        <div className="flex-1 p-6 overflow-auto">
      {renderContent()}
        </div>
      </div>

      {/* 能力評估模態視窗 */}
      {showAssessmentModal && (
        <SimpleAbilityAssessmentModal
          onClose={() => {
            setShowAssessmentModal(false);
            setSelectedStudentForAssessment(null);
          }}
          onSubmit={handleAssessmentSubmit}
          defaultStudent={selectedStudentForAssessment ? {
            id: selectedStudentForAssessment.id,
            full_name: selectedStudentForAssessment.full_name,
            nick_name: selectedStudentForAssessment.nick_name ?? undefined
          } : undefined}
          defaultAssessmentDate={selectedAssessmentDate}
          showOnlyTodayStudents={true} // 老師版面只顯示當日學生
        />
      )}

      {/* 成長樹分配模態視窗 */}
      {showTreeAssignmentModal && (
        <StudentTreeAssignmentModal
          isOpen={showTreeAssignmentModal}
          onClose={() => {
            setShowTreeAssignmentModal(false);
            setSelectedStudentForTreeAssignment(null);
          }}
          student={selectedStudentForTreeAssignment ? {
            id: selectedStudentForTreeAssignment.id,
            full_name: selectedStudentForTreeAssignment.full_name,
            nick_name: selectedStudentForTreeAssignment.nick_name ?? undefined,
            course_type: selectedStudentForTreeAssignment.course_type ?? undefined
          } : undefined}
          onSuccess={() => {
            // 重新載入需要評估的學生列表
            if (teacherData) {
              loadStudentsWithoutAssessment(teacherData);
            }
          }}
        />
      )}

      {/* 日期選擇器 */}
      {showDatePicker && (
        <Calendarui
          value={selectedDateType === 'assessment' ? selectedAssessmentDate : selectedMediaDate}
          onSelect={(date) => {
            if (selectedDateType === 'assessment') {
              setSelectedAssessmentDate(date);
            } else {
              setSelectedMediaDate(date);
            }
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* 媒體上傳模態視窗 */}
      {showMediaUploadModal && selectedStudentForMediaUpload && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* 標題欄 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {selectedStudentForMediaUpload.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#4B4036]">
                    管理 {selectedStudentForMediaUpload.full_name} 的媒體庫
                  </h2>
                  <p className="text-sm text-[#87704e]">
                    管理 {selectedStudentForMediaUpload.full_name} 的影片和相片檔案 ✨
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMediaUploadModal(false);
                  setSelectedStudentForMediaUpload(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 內容區域 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* 配額資訊 */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#4B4036] mb-1">媒體配額</h3>
                    <p className="text-sm text-[#87704e]">
                      影片: {studentMediaQuota?.video_count || 0}/{studentMediaQuota?.video_limit || 5} | 
                      相片: {studentMediaQuota?.photo_count || 0}/{studentMediaQuota?.photo_limit || 10} | 
                      總容量: {formatFileSize(studentMediaQuota?.total_used_space || 0)}/{formatFileSize(studentMediaQuota?.storage_limit_bytes || 262144000)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {studentMediaQuota ? Math.round((studentMediaQuota.total_used_space / studentMediaQuota.storage_limit_bytes) * 100) : 0}%
                    </div>
                    <div className="text-xs text-blue-600">使用率</div>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-indigo-400 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${studentMediaQuota ? Math.min((studentMediaQuota.total_used_space / studentMediaQuota.storage_limit_bytes) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* 上傳區域 */}
              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#4B4036] mb-2">
                        拖放檔案到這裡或點擊上傳
                      </h3>
                      <p className="text-sm text-[#87704e] mb-4">
                        支援影片 (MP4, MOV) 和相片 (JPG, PNG) 格式
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="video/*,image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="media-upload-input"
                      />
                      <label
                        htmlFor="media-upload-input"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-medium cursor-pointer inline-block"
                      >
                        選擇檔案
                      </label>
                    </div>
                  </div>
                  
                  {/* 選中的檔案列表 */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-[#4B4036] mb-3">選中的檔案:</h4>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                {file.type.startsWith('video/') ? (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#4B4036]">{file.name}</p>
                                <p className="text-xs text-[#87704e]">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                              className="p-1 hover:bg-red-100 rounded-full transition-colors"
                            >
                              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={uploadFiles}
                          disabled={uploadingFiles}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingFiles ? '上傳中...' : '開始上傳'}
                        </button>
                        <button
                          onClick={() => setSelectedFiles([])}
                          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          清除選擇
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 媒體列表 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#4B4036]">媒體檔案</h3>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 載入狀態 */}
                {loadingMedia && (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">載入媒體檔案中...</p>
                  </div>
                )}

                {/* 空狀態 */}
                {!loadingMedia && studentMedia.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">還沒有媒體檔案</h3>
                    <p className="text-gray-500 mb-4">
                      開始上傳 {selectedStudentForMediaUpload.full_name} 的第一個媒體檔案
                    </p>
                    <label
                      htmlFor="media-upload-input"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer inline-block"
                    >
                      上傳第一個檔案
                    </label>
                  </div>
                )}

                {/* 媒體檔案列表 */}
                {!loadingMedia && studentMedia.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studentMedia.map((media) => (
                      <div key={media.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* 媒體預覽 */}
                        <div className="relative aspect-video bg-gray-100">
                          {media.media_type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          
                          {/* 收藏按鈕 */}
                          <button
                            onClick={() => toggleFavorite(media.id, media.is_favorite)}
                            className="absolute top-2 right-2 p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
                          >
                            <svg 
                              className={`w-4 h-4 ${media.is_favorite ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>

                          {/* 刪除按鈕 */}
                          <button
                            onClick={() => deleteMedia(media.id, media.file_path)}
                            className="absolute top-2 left-2 p-1 bg-white bg-opacity-80 rounded-full hover:bg-red-100 transition-all"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {/* 媒體資訊 */}
                        <div className="p-3">
                          <h4 className="font-medium text-[#4B4036] text-sm mb-1 truncate">
                            {media.title || media.file_name}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-[#87704e]">
                            <span>{formatFileSize(media.file_size)}</span>
                            <span>{new Date(media.created_at).toLocaleDateString('zh-TW')}</span>
                          </div>
                          {media.media_type === 'video' && media.file_duration && (
                            <div className="text-xs text-[#87704e] mt-1">
                              時長: {formatDuration(media.file_duration)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 底部按鈕 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowMediaUploadModal(false);
                  setSelectedStudentForMediaUpload(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                關閉
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200">
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 能力發展新增/編輯模態框 */}
      {(showAddAbilityModal || editingAbility) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[#A64B2A] to-[#8B3A1F] px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingAbility ? '編輯能力圖卡' : '新增能力圖卡'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddAbilityModal(false);
                    setEditingAbility(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* 能力基本資訊 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      能力名稱 *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                      placeholder="請輸入能力名稱"
                      defaultValue={editingAbility?.ability_name || ''}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-[#4B4036]">
                      能力分類 *
                    </label>
                      <button
                        className="text-sm text-[#A64B2A] hover:text-[#8B3A1F] underline"
                        type="button"
                        onClick={() => handleCustomManagerOpen('ability_category')}
                      >
                        管理選項
                      </button>
                    </div>
                    <button
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors"
                      type="button"
                      onClick={() => handlePopupOpen('category')}
                    >
                      {editingAbility?.category ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#FFD59A]/20 text-[#4B4036] border border-[#FFD59A]/30">
                          {editingAbility.category}
                        </span>
                      ) : (
                        '請選擇能力分類'
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2">
                    能力描述
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                    rows={3}
                    placeholder="請輸入能力描述"
                    defaultValue={editingAbility?.ability_description || ''}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      能力等級
                    </label>
                                         <select 
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                       value={treeForm.tree_level}
                       onChange={(e) => handleTreeFormChange('tree_level', parseInt(e.target.value))}
                     >
                       <option value="1">等級 1</option>
                       <option value="2">等級 2</option>
                       <option value="3">等級 3</option>
                       <option value="4">等級 4</option>
                       <option value="5">等級 5</option>
                     </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      狀態
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent">
                      <option value="active">啟用</option>
                      <option value="inactive">停用</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      能力圖標
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                      placeholder="🎵"
                      defaultValue={editingAbility?.ability_icon || '🎵'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按鈕 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowAddAbilityModal(false);
                  setEditingAbility(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (editingAbility) {
                    handleUpdateAbility(editingAbility);
                  } else {
                    handleAddAbility({});
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#A64B2A] to-[#8B3A1F] text-white rounded-lg hover:from-[#8B3A1F] hover:to-[#6B2A0F] transition-all duration-200"
              >
                {editingAbility ? '更新能力圖卡' : '新增能力圖卡'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 彈出選擇組件 */}
      {showPopup.open && (
        <PopupSelect
          mode="single"
          options={
            showPopup.field === 'category' ? customOptions.ability_categories.map(cat => ({ value: cat.id, label: cat.name })) :
            showPopup.field === 'activity_type' ? activityTypes :
            showPopup.field === 'status' ? activityStatuses :
            []
          }
          selected={popupSelected}
          title={
            showPopup.field === 'category' ? '選擇能力分類' :
            showPopup.field === 'activity_type' ? '選擇活動類型' :
            showPopup.field === 'status' ? '選擇狀態' :
            '選擇'
          }
          onCancel={handlePopupCancel}
          onChange={(value: string | string[]) => setPopupSelected(value)}
          onConfirm={handlePopupConfirm}
        />
      )}
      {/* 自訂管理彈出視窗 */}
      {showCustomManager.open && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-hanami-text">
                  {showCustomManager.field === 'ability_category' ? '管理能力分類' :
                   showCustomManager.field === 'activity_type' ? '管理活動類型' :
                   showCustomManager.field === 'status' ? '管理狀態' :
                   '管理選項'}
                </h2>
                <button
                  className="text-sm text-red-600 hover:text-red-800 underline"
                  onClick={() => {
                    if (confirm('確定要重置所有預設類別嗎？這將恢復所有預設類別到原始狀態。')) {
                      localStorage.removeItem('hanami_modified_defaults');
                      loadCustomOptions();
                      toast.success('已重置所有預設類別！');
                    }
                  }}
                >
                  重置預設
                </button>
              </div>
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              {/* 新增/編輯表單 */}
              {(editingOption || !customOptions.ability_categories.length) && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="text-lg font-semibold text-hanami-text mb-4">
                    {editingOption ? 
                      (showCustomManager.field === 'ability_category' ? '編輯類別' :
                       showCustomManager.field === 'activity_type' ? '編輯活動類型' :
                       showCustomManager.field === 'status' ? '編輯狀態' :
                       '編輯選項') :
                      (showCustomManager.field === 'ability_category' ? '新增類別' :
                       showCustomManager.field === 'activity_type' ? '新增活動類型' :
                       showCustomManager.field === 'status' ? '新增狀態' :
                       '新增選項')
                    }
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                      placeholder={
                        showCustomManager.field === 'ability_category' ? '請輸入類別名稱' :
                        showCustomManager.field === 'activity_type' ? '請輸入活動類型名稱' :
                        showCustomManager.field === 'status' ? '請輸入狀態名稱' :
                        '請輸入選項名稱'
                      }
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                    />
                    
                    {/* 預設類別選擇 */}
                    {!editingOption && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isDefaultOption"
                          checked={isDefaultOption}
                          onChange={(e) => setIsDefaultOption(e.target.checked)}
                          className="rounded border-gray-300 text-[#A64B2A] focus:ring-[#A64B2A]"
                        />
                        <label htmlFor="isDefaultOption" className="text-sm text-hanami-text">
                          設為預設類別
                        </label>
                        <span className="text-xs text-hanami-text-secondary">
                          (預設類別會在所有能力編輯中優先顯示)
                        </span>
                </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors"
                        onClick={editingOption ? handleEditCustomOption : handleAddCustomOption}
                        disabled={!newOptionName.trim()}
                      >
                        {editingOption ? '更新' : '新增'}
                      </button>
                      <button 
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        onClick={() => {
                          setEditingOption(null);
                          setNewOptionName('');
                          setIsDefaultOption(false);
                        }}
                      >
                        取消
                      </button>
                  </div>
                  </div>
                  </div>
              )}

              {/* 新增按鈕 */}
              {!editingOption && (
                <button
                  className="w-full px-4 py-2 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors"
                  onClick={() => setEditingOption({ id: '', name: '', is_default: false })}
                >
                  + {showCustomManager.field === 'ability_category' ? '新增類別' :
                     showCustomManager.field === 'activity_type' ? '新增活動類型' :
                     showCustomManager.field === 'status' ? '新增狀態' :
                     '新增選項'}
                </button>
              )}

              {/* 現有選項列表 */}
                <div>
                <h3 className="text-lg font-semibold text-hanami-text mb-4">
                  {showCustomManager.field === 'ability_category' ? '現有類別' :
                   showCustomManager.field === 'activity_type' ? '現有活動類型' :
                   showCustomManager.field === 'status' ? '現有狀態' :
                   '現有選項'}
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(showCustomManager.field === 'ability_category' ? customOptions.ability_categories :
                    showCustomManager.field === 'activity_type' ? activityTypes :
                    showCustomManager.field === 'status' ? activityStatuses :
                    []).map((option) => (
                    <div key={option.id || option.value} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {showCustomManager.field === 'ability_category' ? option.name :
                           showCustomManager.field === 'activity_type' ? option.label :
                           showCustomManager.field === 'status' ? option.label :
                           option.name || option.label}
                        </span>
                        {option.is_default && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">預設</span>
                        )}
                </div>
                      <div className="flex gap-2">
              <button
                          className="text-blue-600 hover:text-blue-800 px-2 py-1 text-sm"
                          onClick={() => startEditOption(option)}
                        >
                          編輯
              </button>
              <button
                          className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                          onClick={() => handleDeleteCustomOption(option.id || option.value)}
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-gray-200 flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={handleCustomManagerClose}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

              {/* 教學活動新增/編輯模態框 */}
        {(showAddActivityModal || editingActivity) && (
          <ActivityForm
            activity={editingActivity}
            mode={editingActivity ? 'edit' : 'create'}
            onCancel={() => {
              setShowAddActivityModal(false);
              setEditingActivity(null);
            }}
            onSubmit={editingActivity ? handleUpdateActivity : handleAddActivity}
          />
        )}
      {/* 成長樹新增/編輯模態框 */}
      {(showAddTreeModal || editingTree) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[#A64B2A] to-[#8B3A1F] px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingTree ? '編輯成長樹' : '新增成長樹'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddTreeModal(false);
                    setEditingTree(null);
                    resetTreeForm();
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* 成長樹基本資訊 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      成長樹名稱 *
                    </label>
                                         <input
                       type="text"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                       placeholder="請輸入成長樹名稱"
                       value={treeForm.tree_name}
                       onChange={(e) => handleTreeFormChange('tree_name', e.target.value)}
                     />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      課程類型 *
                    </label>
                                         <select 
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                       value={treeForm.course_type}
                       onChange={(e) => handleTreeFormChange('course_type', e.target.value)}
                     >
                       <option value="">請選擇課程類型</option>
                       {courseTypesOptions.map((option) => (
                         <option key={option.value} value={option.value}>
                           {option.label}
                         </option>
                       ))}
                     </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2">
                    成長樹描述
                  </label>
                                     <textarea
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                     rows={3}
                     placeholder="請輸入成長樹描述"
                     value={treeForm.tree_description}
                     onChange={(e) => handleTreeFormChange('tree_description', e.target.value)}
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      成長樹等級
                    </label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                      value={treeForm.tree_level}
                      onChange={(e) => handleTreeFormChange('tree_level', parseInt(e.target.value))}
                    >
                      <option value="1">等級 1</option>
                      <option value="2">等級 2</option>
                      <option value="3">等級 3</option>
                      <option value="4">等級 4</option>
                      <option value="5">等級 5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      狀態
                    </label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                      value={treeForm.is_active ? 'active' : 'inactive'}
                      onChange={(e) => handleTreeFormChange('is_active', e.target.value === 'active')}
                    >
                      <option value="active">啟用</option>
                      <option value="inactive">停用</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      成長樹圖標
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                      placeholder="🌳"
                      value={treeForm.tree_icon}
                      onChange={(e) => handleTreeFormChange('tree_icon', e.target.value)}
                    />
                  </div>
                </div>

                {/* 目標列表 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#4B4036]">學習目標</h3>
                    <button 
                      type="button"
                      onClick={addGoal}
                      className="px-4 py-2 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors"
                    >
                      新增目標
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {goals.map((goal, goalIdx) => (
                      <div key={goalIdx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-md font-medium text-[#4B4036]">目標 {goalIdx + 1}</h4>
                          {goals.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeGoal(goalIdx)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              刪除
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-[#4B4036] mb-2">
                              目標名稱 *
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                              placeholder="請輸入目標名稱"
                              value={goal.goal_name}
                              onChange={(e) => handleGoalChange(goalIdx, 'goal_name', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#4B4036] mb-2">
                              目標圖標
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                              placeholder="⭐"
                              value={goal.goal_icon}
                              onChange={(e) => handleGoalChange(goalIdx, 'goal_icon', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-[#4B4036] mb-2">
                            目標描述
                          </label>
                          <textarea
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                            rows={2}
                            placeholder="請輸入目標描述"
                            value={goal.goal_description}
                            onChange={(e) => handleGoalChange(goalIdx, 'goal_description', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-[#4B4036] mb-2">
                              進度最大值
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                              value={goal.progress_max}
                              onChange={(e) => handleGoalChange(goalIdx, 'progress_max', parseInt(e.target.value) || 5)}
                            />
                          </div>
                        </div>

                        {/* 所需發展能力 */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-[#4B4036] mb-2">
                            所需發展能力
                          </label>
                          <button
                            type="button"
                            onClick={() => openAbilitySelector(goalIdx)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors"
                          >
                            {goal.required_abilities && goal.required_abilities.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {goal.required_abilities.map((abilityId: string) => {
                                  const ability = abilitiesOptions.find(a => a.value === abilityId);
                                  return (
                                    <span key={abilityId} className="inline-flex items-center px-2 py-1 bg-[#EBC9A4] text-[#4B4036] text-xs rounded-full">
                                      {ability?.label || abilityId}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-500">請選擇所需發展能力</span>
                            )}
                          </button>
                        </div>

                        {/* 相關活動 */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-[#4B4036] mb-2">
                            相關活動
                          </label>
                          <button
                            type="button"
                            onClick={() => openActivitySelector(goalIdx)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-left bg-white hover:bg-gray-50 transition-colors"
                          >
                            {goal.related_activities && goal.related_activities.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {goal.related_activities.map((activityId: string) => {
                                  const activity = activitiesOptions.find(a => a.value === activityId);
                                  return (
                                    <span key={activityId} className="inline-flex items-center px-2 py-1 bg-[#FFB6C1] text-[#4B4036] text-xs rounded-full">
                                      {activity?.label || activityId}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-500">請選擇相關活動</span>
                            )}
                          </button>
                        </div>

                        {/* 進度內容 */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-[#4B4036] mb-2">
                            進度內容
                          </label>
                          <div className="space-y-2">
                            {Array.from({ length: goal.progress_max }, (_, i) => (
                              <div key={i} className="flex gap-2">
                                <span className="text-sm text-gray-500 w-8 pt-2">{i + 1}.</span>
                                <input
                                  type="text"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                                  placeholder={`進度 ${i + 1} 的描述`}
                                  value={goal.progress_contents[i] || ''}
                                  onChange={(e) => handleProgressContentChange(goalIdx, i, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按鈕 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowAddTreeModal(false);
                  setEditingTree(null);
                  resetTreeForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (editingTree) {
                    handleUpdateTree(treeForm, goals);
                  } else {
                    handleAddTree(treeForm, goals);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#A64B2A] to-[#8B3A1F] text-white rounded-lg hover:from-[#8B3A1F] hover:to-[#6B2A0F] transition-all duration-200"
              >
                {editingTree ? '更新成長樹' : '新增成長樹'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 能力選擇器彈出視窗 */}
      {showAbilitySelector.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[#A64B2A] to-[#8B3A1F] px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">選擇所需發展能力</h2>
                <button
                  onClick={closeAbilitySelector}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* 搜尋框 */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="搜尋能力..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  value={abilitySearchText}
                  onChange={(e) => setAbilitySearchText(e.target.value)}
                />
              </div>
              
              {/* 能力列表 */}
              <div className="space-y-2">
                {abilitiesOptions
                  .filter(ability => 
                    ability.label.toLowerCase().includes(abilitySearchText.toLowerCase())
                  )
                  .map((ability) => (
                    <div
                      key={ability.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        abilityTempSelected.includes(ability.value)
                          ? 'bg-[#EBC9A4] border-[#A64B2A]'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleAbilityToggle(ability.value)}
                    >
                      <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                        abilityTempSelected.includes(ability.value)
                          ? 'bg-[#A64B2A] border-[#A64B2A]'
                          : 'border-gray-300'
                      }`}>
                        {abilityTempSelected.includes(ability.value) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${
                        abilityTempSelected.includes(ability.value)
                          ? 'text-[#4B4036] font-medium'
                          : 'text-gray-700'
                      }`}>
                        {ability.label}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* 底部按鈕 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeAbilitySelector}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAbilityConfirm}
                className="px-4 py-2 bg-gradient-to-r from-[#A64B2A] to-[#8B3A1F] text-white rounded-lg hover:from-[#8B3A1F] hover:to-[#6B2A0F] transition-all duration-200"
              >
                確認選擇
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 活動選擇器彈出視窗 */}
      {showActivitySelector.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[#A64B2A] to-[#8B3A1F] px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">選擇相關活動</h2>
                <button
                  onClick={closeActivitySelector}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* 搜尋框 */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="搜尋活動..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  value={activitySearchText}
                  onChange={(e) => setActivitySearchText(e.target.value)}
                />
              </div>
              
              {/* 活動列表 */}
              <div className="space-y-2">
                {activitiesOptions
                  .filter(activity => 
                    activity.label.toLowerCase().includes(activitySearchText.toLowerCase())
                  )
                  .map((activity) => (
                    <div
                      key={activity.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        activityTempSelected.includes(activity.value)
                          ? 'bg-[#FFB6C1] border-[#A64B2A]'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleActivityToggle(activity.value)}
                    >
                      <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                        activityTempSelected.includes(activity.value)
                          ? 'bg-[#A64B2A] border-[#A64B2A]'
                          : 'border-gray-300'
                      }`}>
                        {activityTempSelected.includes(activity.value) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${
                        activityTempSelected.includes(activity.value)
                          ? 'text-[#4B4036] font-medium'
                          : 'text-gray-700'
                      }`}>
                        {activity.label}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* 底部按鈕 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeActivitySelector}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleActivityConfirm}
                className="px-4 py-2 bg-gradient-to-r from-[#A64B2A] to-[#8B3A1F] text-white rounded-lg hover:from-[#8B3A1F] hover:to-[#6B2A0F] transition-all duration-200"
              >
                確認選擇
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 成長樹詳細視窗 */}
      {showDetailModal && selectedTree && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* 標題欄 */}
            <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedTree.tree_icon || '🌳'}</span>
                  <h2 className="text-2xl font-bold text-[#4B4036]">{selectedTree.tree_name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-[#4B4036] border border-white/30 rounded-lg transition-colors"
                    onClick={() => {
                      closeDetailModal();
                      handleEditTree(selectedTree);
                    }}
                  >
                    編輯
                  </button>
                  <button
                    className="text-[#4B4036] hover:text-[#8B7355] transition-colors p-2"
                    onClick={closeDetailModal}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* 內容區域 - 可滾動 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左側：基本信息 */}
                <div className="space-y-6">
                  {/* 描述 */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      描述
                    </h3>
                    <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8]">
                      <p className="text-[#4B4036]">
                        {selectedTree.tree_description || '暫無描述'}
                      </p>
                    </div>
                  </div>

                  {/* 基本信息 */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-3">基本信息</h3>
                    <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8] space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#8B7355]">課程類型:</span>
                        <span className="text-[#4B4036] font-medium">{selectedTree.course_type_name || selectedTree.course_type || '未指定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B7355]">等級:</span>
                        <span className="text-[#4B4036] font-medium">Lv.{selectedTree.tree_level || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B7355]">狀態:</span>
                        <span className={`font-medium ${selectedTree.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedTree.is_active ? '啟用' : '停用'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B7355]">目標總數:</span>
                        <span className="text-[#4B4036] font-medium">{getGoalsForTree(selectedTree.id).length} 個</span>
                      </div>
                    </div>
                  </div>

                  {/* 進度概覽 */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-3">進度概覽</h3>
                    <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8]">
                      {(() => {
                        const treeGoals = getGoalsForTree(selectedTree.id);
                        const completedGoals = treeGoals.filter(goal => goal.is_completed).length;
                        const progressPercentage = treeGoals.length > 0 ? (completedGoals / treeGoals.length) * 100 : 0;
                        
                        return (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[#4B4036]">完成進度</span>
                              <span className="text-[#4B4036] font-medium">{completedGoals}/{treeGoals.length}</span>
                            </div>
                            <div className="w-full bg-white rounded-full h-3 mb-2">
                              <div 
                                className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] h-3 rounded-full transition-all duration-300" 
                                style={{ width: `${progressPercentage}%` }} 
                              />
                            </div>
                            <p className="text-sm text-[#8B7355]">
                              完成率: {progressPercentage.toFixed(1)}%
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 右側：目標和學生 */}
                <div className="space-y-6">
                  {/* 目標列表 */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      目標列表 ({getGoalsForTree(selectedTree.id).length})
                    </h3>
                    <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8] max-h-80 overflow-y-auto">
                      {(() => {
                        const treeGoals = getGoalsForTree(selectedTree.id);
                        
                        if (treeGoals.length > 0) {
                          return (
                            <div className="space-y-3">
                              {treeGoals.map((goal, index) => {
                                const goalId = goal.id || `goal-${index}`;
                                const isExpanded = expandedGoals.has(goalId);
                                const hasAbilities = goal.required_abilities && goal.required_abilities.length > 0;
                                const hasActivities = goal.related_activities && goal.related_activities.length > 0;
                                
                                return (
                                  <div key={goalId} className="border border-[#EADBC8] rounded-lg bg-white">
                                    {/* 目標標題行 */}
                                    <div 
                                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#FFF9F2] transition-colors"
                                      onClick={() => toggleGoalExpansion(goalId)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-xl">{goal.goal_icon || '⭐'}</span>
                                        <div>
                                          <h4 className="font-medium text-[#4B4036]">{goal.goal_name}</h4>
                                          {goal.goal_description && (
                                            <p className="text-sm text-[#8B7355]">{goal.goal_description}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {/* 能力數量指示器 */}
                                        {hasAbilities && (
                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            {goal.required_abilities.length} 能力
                                          </span>
                                        )}
                                        {/* 活動數量指示器 */}
                                        {hasActivities && (
                                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                            {goal.related_activities.length} 活動
                                          </span>
                                        )}
                                        {/* 狀態標籤 */}
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          goal.is_completed 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {goal.is_completed ? '已完成' : '進行中'}
                                        </span>
                                        {/* 展開/收起箭頭 */}
                                        <svg 
                                          className={`w-4 h-4 text-[#8B7355] transition-transform duration-200 ${
                                            isExpanded ? 'rotate-180' : ''
                                          }`}
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </div>
                                    </div>
                                    
                                    {/* 展開的詳細內容 */}
                                    {isExpanded && (
                                      <div className="border-t border-[#EADBC8] p-3 bg-[#FFF9F2]">
                                        {/* 所需能力 */}
                                        {hasAbilities && (
                                          <div className="mb-3">
                                            <span className="text-xs font-medium text-[#8B7355] block mb-2">所需能力:</span>
                                            <div className="flex flex-wrap gap-1">
                                              {goal.required_abilities.map((abilityId: string, idx: number) => {
                                                const ability = abilitiesOptions.find(a => a.value === abilityId);
                                                return (
                                                  <span key={`ability-${goalId}-${idx}-${abilityId}`} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {ability?.label || '未知能力'}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}

                                        {/* 相關活動 */}
                                        {hasActivities && (
                                          <div>
                                            <span className="text-xs font-medium text-[#8B7355] block mb-2">相關活動:</span>
                                            <div className="flex flex-wrap gap-1">
                                              {goal.related_activities.map((activityId: string, idx: number) => {
                                                const activity = activitiesOptions.find(a => a.value === activityId);
                                                return (
                                                  <span key={`activity-${goalId}-${idx}-${activityId}`} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                                    {activity?.label || '未知活動'}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        } else {
                          return <p className="text-[#8B7355] text-center py-8">暫無目標</p>;
                        }
                      })()}
                    </div>
                  </div>

                  {/* 在此成長樹的學生 */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      在此成長樹的學生 ({studentsInTree.length})
                    </h3>
                    <div className="bg-[#FFF9F2] p-4 rounded-lg border border-[#EADBC8] max-h-60 overflow-y-auto">
                      {studentsInTree.length > 0 ? (
                        <div className="space-y-2">
                          {studentsInTree.map((student, index) => {
                            // 月齡轉歲數的輔助函數
                            const convertMonthsToAge = (months: number | null): string => {
                              if (!months) return '未設定';
                              if (months < 12) return `${months}個月`;
                              const years = Math.floor(months / 12);
                              const remainingMonths = months % 12;
                              if (remainingMonths === 0) return `${years}歲`;
                              return `${years}歲${remainingMonths}個月`;
                            };

                            return (
                              <div key={student.id} className="flex items-center justify-between p-2 bg-white rounded border border-[#EADBC8]">
                                <div>
                                  <span className="font-medium text-[#4B4036]">{student.full_name || student.nick_name}</span>
                                  {student.student_age && (
                                    <span className="text-sm text-[#8B7355] ml-2">({convertMonthsToAge(student.student_age)})</span>
                                  )}
                                </div>
                                <span className="text-sm text-[#8B7355]">
                                  {student.course_type && student.course_type.trim() !== '' ? student.course_type : '未指定課程'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[#8B7355] text-center py-8">暫無學生在此成長樹</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部按鈕 */}
            <div className="p-6 border-t border-[#EADBC8] flex justify-end">
              <button
                className="px-4 py-2 text-[#4B4036] bg-[#FFF9F2] border border-[#EADBC8] rounded-lg hover:bg-[#EADBC8] transition-colors"
                onClick={closeDetailModal}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
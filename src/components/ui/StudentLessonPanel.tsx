import { format } from 'date-fns';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// 添加動畫樣式
const animationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;



import LessonEditorModal from '@/components/ui/LessonEditorModal';
import { PopupSelect } from '@/components/ui/PopupSelect';
import AIMessageModal from '@/components/ui/AIMessageModal';
import { getSupabaseClient } from '@/lib/supabase';
import { Lesson, CourseType } from '@/types';


interface StudentLessonPanelProps {
  studentId: string;
  studentType?: string; // 添加學生類型參數
  studentName?: string; // 添加學生姓名參數
  contactNumber?: string; // 添加聯絡電話參數
  onCourseUpdate?: () => void; // 課程更新回調
  // 添加更多學生資料參數
  studentData?: any; // 完整的學生資料
}

interface LessonData {
  id: string;
  student_id: string;
  course_type: string | CourseType | null;
  lesson_count: number;
  is_trial: boolean;
  lesson_duration: string | null;
  regular_weekday: number | null;
  lesson_teacher: string | null;
  regular_timeslot: string | null;
  student_oid: string | null;
  lesson_date: string;
  actual_timeslot: string | null;
  lesson_status: string | null;
  full_name: string;
  student_age: number | null;
  package_id: string | null;
  status: string | null;
  notes: string | null;
  next_target: string | null;
  progress_notes: string | null;
  video_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  access_role: string | null;
  remarks: string | null;
}

export default function StudentLessonPanel({ studentId, studentType, studentName, contactNumber, onCourseUpdate, studentData }: StudentLessonPanelProps) {
  const supabase = getSupabaseClient();
  
  // 添加動畫樣式到 head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [visibleCountSelectOpen, setVisibleCountSelectOpen] = useState(false);
  const [tempVisibleCount, setTempVisibleCount] = useState<string>('5');
  const [categoryFilter, setCategoryFilter] = useState<string[]>(['all']);
  const [tempCategoryFilter, setTempCategoryFilter] = useState<string[]>(['all']);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [statusPopupOpen, setStatusPopupOpen] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState<string>('');
  const [form, setForm] = useState<Partial<Lesson>>({});
  const [showCourseTypeSelect, setShowCourseTypeSelect] = useState(false);
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [courseTypeOptions, setCourseTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 排序相關狀態
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // 動畫相關狀態
  const [isCountButtonAnimating, setIsCountButtonAnimating] = useState(false);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);
  
  // AI 訊息相關狀態
  const [showAIMessageModal, setShowAIMessageModal] = useState(false);
  const [selectedStudentsForAI, setSelectedStudentsForAI] = useState<any[]>([]);
  const [selectedLessonForAI, setSelectedLessonForAI] = useState<any>(null);
  
  // 添加防抖機制
  const lessonsFetchedRef = useRef(false);
  const currentStudentIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    // 如果 studentId 沒有變化且已經載入過，不重複載入
    if (currentStudentIdRef.current === studentId && lessonsFetchedRef.current) return;
    
    // 防止重複載入
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    // 更新當前 studentId
    currentStudentIdRef.current = studentId;
    
    fetchLessons();
  }, [studentId]);

  // 同步 tempCategoryFilter 和 categoryFilter
  useEffect(() => {
    setTempCategoryFilter(categoryFilter);
  }, [categoryFilter]);

  // 監聽課程更新，重新載入課堂資料
  useEffect(() => {
    if (onCourseUpdate) {
      // 重置防抖狀態，強制重新載入
      lessonsFetchedRef.current = false;
      loadingRef.current = false;
      fetchLessons();
    }
  }, [onCourseUpdate]);

  // 排序功能
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 如果點擊的是同一個欄位，切換排序方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果點擊的是新欄位，設置為升序
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 獲取排序圖標
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return (
        <div className="flex flex-col items-center space-y-0.5">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3L3 10h14L10 3z" />
          </svg>
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 17L3 10h14L10 17z" />
          </svg>
        </div>
      );
    }
    return sortDirection === 'asc' ? 
      <svg className="w-5 h-5 text-orange-400 bg-orange-100 rounded-lg p-0.5 shadow-sm" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 3L3 10h14L10 3z" />
      </svg> : 
      <svg className="w-5 h-5 text-orange-400 bg-orange-100 rounded-lg p-0.5 shadow-sm" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 17L3 10h14L10 17z" />
      </svg>;
  };

  // 排序課堂數據
  const sortLessons = (lessonsData: Lesson[]) => {
    if (!sortField) {
      return lessonsData;
    }

    return [...lessonsData].sort((a, b) => {
      let aValue = a[sortField as keyof Lesson];
      let bValue = b[sortField as keyof Lesson];

      // 處理特殊欄位的排序
      switch (sortField) {
        case 'lesson_date':
          // 日期按日期排序
          aValue = aValue ? new Date(aValue as string).getTime() : 0;
          bValue = bValue ? new Date(bValue as string).getTime() : 0;
          break;
        case 'actual_timeslot':
        case 'regular_timeslot':
          // 時間按字符串排序
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
          break;
        case 'course_type':
        case 'lesson_teacher':
        case 'lesson_status':
          // 其他欄位按字符串排序
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
          break;
        default:
          // 其他欄位按字符串排序
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // 獲取排序後的課堂數據
  const sortedLessons = sortLessons(lessons);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError(null); // 清除之前的錯誤
      console.log('🔍 開始載入課堂資料，studentId:', studentId, 'studentType:', studentType);
      
      let lessonsData: any[] = [];
      
      // 根據學生類型決定查詢哪個表
      if (studentType === '試堂' || studentType === 'trial') {
        // 試堂學生：查詢 hanami_trial_students 表
        console.log('📋 查詢試堂學生課堂資料...');
        const { data, error } = await supabase
          .from('hanami_trial_students')
          .select('*')
          .eq('id', studentId)
          .not('lesson_date', 'is', null); // 只查詢有課堂日期的記錄
        
        if (error) {
          console.error('❌ 查詢試堂學生課堂資料失敗:', error);
          setError(error.message);
          return;
        }
        
        // 將試堂學生資料轉換為課堂格式
        lessonsData = (data || []).map((trialStudent: any) => ({
          id: trialStudent.id,
          student_id: trialStudent.id,
          lesson_date: trialStudent.lesson_date,
          course_type: trialStudent.course_type,
          actual_timeslot: trialStudent.actual_timeslot,
          regular_timeslot: trialStudent.regular_timeslot,
          lesson_teacher: trialStudent.student_teacher,
          lesson_status: '試堂', // 試堂學生的狀態
          lesson_duration: trialStudent.lesson_duration,
          full_name: trialStudent.full_name,
          lesson_count: 1,
          is_trial: true,
          // 其他必要欄位
          package_id: null,
          status: null,
          notes: null,
          next_target: null,
          progress_notes: null,
          video_url: null,
          created_at: trialStudent.created_at,
          updated_at: trialStudent.updated_at,
          access_role: trialStudent.access_role,
          remarks: trialStudent.trial_remarks,
          student_oid: trialStudent.student_oid,
          regular_weekday: trialStudent.regular_weekday,
          lesson_activities: null,
        })) as Lesson[];
        
        console.log('✅ 試堂學生課堂資料載入完成，共', lessonsData.length, '筆記錄');
      } else {
        // 常規學生：查詢 hanami_student_lesson 表
        console.log('📋 查詢常規學生課堂資料...');
        const { data, error } = await supabase
          .from('hanami_student_lesson')
          .select('*')
          .eq('student_id', studentId);
        
        if (error) {
          console.error('❌ 查詢常規學生課堂資料失敗:', error);
          if (error.code === 'PGRST116' || error.message.includes('401')) {
            setError('權限不足，無法訪問課堂資料。請聯繫管理員檢查RLS權限設置。');
          } else {
            setError(error.message);
          }
          return;
        }
        
        // 簡化資料處理
        lessonsData = (data || []).map((item: any) => ({
          id: item.id,
          lesson_date: item.lesson_date,
          course_type: item.course_type,
          actual_timeslot: item.actual_timeslot,
          regular_timeslot: item.regular_timeslot,
          lesson_teacher: item.lesson_teacher,
          lesson_status: item.lesson_status,
          lesson_count: 1,
          is_trial: false,
          // 其他必要欄位
          student_id: item.student_id,
          lesson_duration: item.lesson_duration,
          full_name: item.full_name,
          package_id: item.package_id,
          status: item.status,
          notes: item.notes,
          next_target: item.next_target,
          progress_notes: item.progress_notes,
          video_url: item.video_url,
          created_at: item.created_at,
          updated_at: item.updated_at,
          access_role: item.access_role,
          remarks: item.remarks,
          student_oid: item.student_oid,
          regular_weekday: item.regular_weekday,
          lesson_activities: item.lesson_activities,
        })) as Lesson[];
        
        console.log('✅ 常規學生課堂資料載入完成，共', lessonsData.length, '筆記錄');
      }
      
      console.log('📊 課堂資料載入結果:', { 
        dataCount: lessonsData.length, 
        error: '無錯誤',
        studentId,
        studentType,
      });
      
      setLessons(lessonsData);
      lessonsFetchedRef.current = true;
      loadingRef.current = false;
    } catch (err) {
      console.error('❌ 載入課堂資料失敗：', err);
      setError(err instanceof Error ? err.message : '未知錯誤');
      loadingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // 當 studentId 變化時重置防抖狀態
  useEffect(() => {
    if (currentStudentIdRef.current !== studentId) {
      lessonsFetchedRef.current = false;
      loadingRef.current = false;
    }
  }, [studentId]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('hanami_student_lesson')
        .delete()
        .in('id', selected);

      if (error) {
        console.error('刪除課堂記錄失敗：', error);
        toast.error('刪除課堂記錄失敗，請稍後再試');
        return;
      }

      toast.success('課堂記錄已成功刪除');
      setSelected([]);
      await fetchLessons();
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      console.error('刪除課堂記錄時發生錯誤：', err);
      toast.error('刪除課堂記錄失敗，請稍後再試');
    }
  };

  const handleEdit = (lesson: Lesson) => {
    handleStatusPopupClose();
    setEditingLesson(lesson);
    setIsModalOpen(true);
  };

  const handleVisibleCountConfirm = () => {
    let parsed: number;
    let successMessage = '';
    
    if (tempVisibleCount === 'all') {
      parsed = lessons.length;
      successMessage = `已設定顯示全部 ${parsed} 筆課堂記錄（按日期舊到新排序）`;
      // 當選擇顯示全部時，自動設置為按日期升序（舊到新）
      setSortField('lesson_date');
      setSortDirection('asc');
    } else {
      parsed = parseInt(tempVisibleCount);
      if (isNaN(parsed) || parsed < 1) {
        parsed = 5;
      }
      successMessage = `已設定顯示 ${parsed} 筆課堂記錄`;
    }
    
    setVisibleCount(parsed);
    setVisibleCountSelectOpen(false);
    
    // 添加成功提示動畫
    setIsCountButtonAnimating(true);
    setShowSuccessIndicator(true);
    setTimeout(() => {
      setIsCountButtonAnimating(false);
      setShowSuccessIndicator(false);
    }, 1000);
    
    // 顯示成功提示
    toast.success(successMessage, {
      duration: 2000,
      style: {
        background: '#FDE6B8',
        color: '#4B4036',
        border: '1px solid #FCD58B',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  };

  const handleVisibleCountCancel = () => {
    setTempVisibleCount(visibleCount >= lessons.length ? 'all' : String(visibleCount));
    setVisibleCountSelectOpen(false);
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const filteredLessons = sortedLessons.filter((lesson) => {
    if (categoryFilter.includes('all')) return true;

    const lessonDateStr = format(new Date(lesson.lesson_date), 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // 檢查日期和狀態類別
    const dateMatches =
      (categoryFilter.includes('upcoming') && lessonDateStr > todayStr) ||
      (categoryFilter.includes('past') && lessonDateStr < todayStr) ||
      (categoryFilter.includes('today') && lessonDateStr === todayStr);

    const statusMatches =
      (categoryFilter.includes('sick') && lesson.lesson_status === '請假') ||
      (categoryFilter.includes('makeup') && lesson.lesson_status === '補課') ||
      (categoryFilter.includes('absent') && lesson.lesson_status === '缺席');

    return dateMatches || statusMatches;
  });

  // 欄位整理工具，僅保留允許的欄位
  const filterLessonData = (data: Partial<Lesson>): Lesson => {
    const allowedKeys = [
      'id',
      'student_id',
      'package_id',
      'lesson_date',
      'regular_timeslot',
      'actual_timeslot',
      'lesson_status',
      'status',
      'course_type',
      'lesson_duration',
      'regular_weekday',
      'full_name',
      'lesson_teacher',
      'notes',
      'progress_notes',
      'next_target',
      'video_url',
      'remarks',
      'created_at',
      'updated_at',
      'access_role',
      'student_oid',
      'lesson_count',
      'is_trial',
    ];
    const filtered: any = {};
    allowedKeys.forEach((key) => {
      filtered[key] = (data as any)[key] ?? (key === 'student_id' || key === 'course_type' ? '' : null);
    });
    return filtered as Lesson;
  };

  // 新增/更新課堂處理函式
  const handleAddLesson = async (newLesson: Lesson) => {
    // 1. 從 Supabase 取得學生資料
    let studentData = null;
    try {
      const { data } = await supabase
        .from('Hanami_Students')
        .select('student_oid, regular_weekday, full_name')
        .eq('id', newLesson.student_id)
        .single();
      studentData = data;
    } catch (e) {
      // 可視情況處理錯誤
      studentData = null;
    }

    const lessonId = editingLesson ? editingLesson.id : uuidv4();
    const resolvedCourseType =
      typeof newLesson.course_type === 'object' && newLesson.course_type
        ? newLesson.course_type.name
        : newLesson.course_type || '';

    // 自動設置 lesson_duration
    const autoLessonDuration =
      resolvedCourseType === '鋼琴'
        ? '00:45:00'
        : resolvedCourseType === '音樂專注力'
          ? '01:00:00'
          : null;

    // 只在 newLesson 沒有提供時才用 studentData/自動推算
    const dbLessonData = {
      id: lessonId,
      student_id: newLesson.student_id,
      package_id: newLesson.package_id || null,
      lesson_date: newLesson.lesson_date,
      regular_timeslot: newLesson.regular_timeslot ?? '',
      actual_timeslot: newLesson.actual_timeslot || null,
      lesson_status: newLesson.lesson_status || null,
      status: (newLesson.status && ['attended', 'absent', 'makeup', 'cancelled', 'sick_leave', 'personal_leave'].includes(newLesson.status)
        ? newLesson.status 
        : null) as ('attended' | 'absent' | 'makeup' | 'cancelled' | 'sick_leave' | 'personal_leave' | null),
      course_type: resolvedCourseType,
      lesson_duration: newLesson.lesson_duration || autoLessonDuration,
      regular_weekday: newLesson.regular_weekday !== null && newLesson.regular_weekday !== undefined ? String(newLesson.regular_weekday) : (studentData?.regular_weekday !== undefined && studentData?.regular_weekday !== null ? String(studentData.regular_weekday) : null),
      full_name: newLesson.full_name || studentData?.full_name || '未設定',
      lesson_teacher: newLesson.lesson_teacher || null,
      notes: newLesson.notes || '',
      progress_notes: newLesson.progress_notes || null,
      next_target: newLesson.next_target || '',
      video_url: newLesson.video_url || null,
      created_at: editingLesson?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      access_role: 'admin',
      student_oid: newLesson.student_oid || studentData?.student_oid || studentId,
      lesson_count: newLesson.lesson_count ?? 0,
      is_trial: newLesson.is_trial ?? false,
    };

    const requiredFields = ['student_id', 'lesson_date', 'course_type', 'regular_timeslot', 'regular_weekday', 'lesson_teacher'] as const;
    const missingFields = requiredFields.filter(field => !(field in dbLessonData) || !dbLessonData[field]);

    if (missingFields.length > 0) {
      toast.error(`請填寫必填欄位：${missingFields.join(', ')}`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('hanami_student_lesson')
        .upsert([dbLessonData], { onConflict: 'id' });

      if (error) {
        console.error('Error saving lesson:', error);
        toast.error('儲存失敗');
        return;
      }

      if (data) {
        toast.success('儲存成功');
        await fetchLessons();
        setIsModalOpen(false);
        setEditingLesson(null);
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('儲存失敗');
    }
  };

  // Add a function to handle status button click
  const handleStatusClick = (lessonId: string, currentStatus: string | null) => {
    if (isModalOpen) return; // Don't show status popup if modal is open
    setTempStatus(currentStatus || '');
    setStatusPopupOpen(lessonId);
  };

  // Add a function to handle status popup close
  const handleStatusPopupClose = () => {
    setStatusPopupOpen(null);
    setTempStatus('');
  };

  const handleStatusChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setTempStatus(value);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      handleStatusPopupClose();
    }
  }, [isModalOpen]);

  // 匯出CSV功能
  const exportToCSV = () => {
    // 檢查是否有選中的課堂
    if (selected.length === 0) {
      toast.error('請先選擇要匯出的課堂記錄');
      return;
    }

    // 只匯出選中的課堂
    const selectedLessons = filteredLessons.filter(lesson => selected.includes(lesson.id));
    
    const headers = ['日期', '課堂', '上課時間'];
    const csvData = selectedLessons.map(lesson => [
      format(new Date(lesson.lesson_date), 'yyyy/MM/dd'),
      typeof lesson.course_type === 'string' ? lesson.course_type : '',
      lesson.actual_timeslot || lesson.regular_timeslot || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${studentName || '學生'}_課堂記錄_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`已匯出 ${selectedLessons.length} 筆課堂記錄`);
  };

  // 複製到WhatsApp功能
  const copyToWhatsApp = () => {
    // 檢查是否有選中的課堂
    if (selected.length === 0) {
      toast.error('請先選擇要複製的課堂記錄');
      return;
    }

    // 只複製選中的課堂
    const selectedLessons = filteredLessons.filter(lesson => selected.includes(lesson.id));

    const studentInfo = `${studentName || '學生'} 課堂記錄\n`;
    const lessonRecords = selectedLessons.map(lesson => {
      const date = format(new Date(lesson.lesson_date), 'yyyy/MM/dd');
      const courseType = typeof lesson.course_type === 'string' ? lesson.course_type : '';
      const timeSlot = lesson.actual_timeslot || lesson.regular_timeslot || '';
      
      return `${date} - ${courseType} - ${timeSlot}`;
    }).join('\n');

    const fullText = studentInfo + lessonRecords;

    navigator.clipboard.writeText(fullText).then(() => {
      toast.success(`已複製 ${selectedLessons.length} 筆課堂記錄到剪貼簿`);
    }).catch(() => {
      // 如果剪貼簿API不可用，使用傳統方法
      const textArea = document.createElement('textarea');
      textArea.value = fullText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(`已複製 ${selectedLessons.length} 筆課堂記錄到剪貼簿`);
    });
  };

  // WhatsApp功能
  const sendToWhatsApp = () => {
    // 檢查是否有聯絡電話
    if (!contactNumber) {
      toast.error('此學生沒有聯絡電話，請先複製課堂記錄，然後手動發送WhatsApp');
      return;
    }

    // 檢查是否有選中的課堂
    if (selected.length === 0) {
      toast.error('請先選擇要發送的課堂記錄');
      return;
    }

    // 只發送選中的課堂
    const selectedLessons = filteredLessons.filter(lesson => selected.includes(lesson.id));

    const studentInfo = `${studentName || '學生'} 課堂記錄\n`;
    const lessonRecords = selectedLessons.map(lesson => {
      const date = format(new Date(lesson.lesson_date), 'yyyy/MM/dd');
      const courseType = typeof lesson.course_type === 'string' ? lesson.course_type : '';
      const timeSlot = lesson.actual_timeslot || lesson.regular_timeslot || '';
      
      return `${date} - ${courseType} - ${timeSlot}`;
    }).join('\n');

    const message = encodeURIComponent(studentInfo + lessonRecords);
    
    // 處理電話號碼格式（移除所有非數字字符）
    const cleanPhoneNumber = contactNumber.replace(/\D/g, '');
    
    // 如果是香港電話號碼（8位數），加上852區號
    const formattedPhoneNumber = cleanPhoneNumber.length === 8 ? `852${cleanPhoneNumber}` : cleanPhoneNumber;
    
    const whatsappUrl = `https://wa.me/${formattedPhoneNumber}?text=${message}`;
    
    // 在新視窗中開啟WhatsApp
    window.open(whatsappUrl, '_blank');
    
    toast.success(`已開啟WhatsApp，準備發送 ${selectedLessons.length} 筆課堂記錄`);
  };

  return (
    <div className="w-full px-4">
      <div className="bg-[#FFFDF8] p-6 rounded-xl shadow-inner max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#4B4036]">課堂情況</h2>
          <div className="flex gap-2 overflow-x-auto flex-nowrap py-2 px-1 scrollbar-hide">
            <button
              onClick={exportToCSV}
              className="flex flex-col items-center min-w-[48px] px-2 py-1 bg-[#F8F5EC] rounded-xl shadow hover:bg-[#FDE6B8] transition"
              title="匯出CSV"
            >
              <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 16v-8m0 8l-3-3m3 3l3-3" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="text-[11px] text-[#4B4036]">匯出</span>
            </button>
            <button
              onClick={copyToWhatsApp}
              className="flex flex-col items-center min-w-[48px] px-2 py-1 bg-[#F8F5EC] rounded-xl shadow hover:bg-[#FDE6B8] transition"
              title="複製課堂記錄"
            >
              <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span className="text-[11px] text-[#4B4036]">複製</span>
            </button>
            <button
              onClick={() => {
                // 使用傳入的完整學生資料，如果沒有則使用基本資料
                const aiStudentData = studentData || {
                  id: studentId,
                  full_name: studentName || '學生',
                  contact_number: contactNumber || '',
                  course_type: lessons[0]?.course_type || '',
                  student_type: studentType || '',
                  // 添加其他必要的學生資料
                  student_age: null,
                  student_dob: null,
                  gender: null,
                  student_email: null,
                  parent_email: null,
                  address: null,
                  school: null,
                  student_teacher: lessons[0]?.lesson_teacher || '',
                  regular_weekday: lessons[0]?.regular_weekday || null,
                  regular_timeslot: lessons[0]?.regular_timeslot || '',
                  lesson_date: lessons[0]?.lesson_date || '',
                  lesson_duration: lessons[0]?.lesson_duration || '',
                  actual_timeslot: lessons[0]?.actual_timeslot || '',
                  duration_months: null,
                  remaining_lessons: null,
                  ongoing_lessons: null,
                  upcoming_lessons: null,
                  health_notes: null,
                  student_preference: null,
                  student_remarks: null,
                  trial_status: null,
                  trial_remarks: null,
                  student_oid: lessons[0]?.student_oid || '',
                  access_role: lessons[0]?.access_role || '',
                };
                
                // 確保學生資料有正確的 ID 用於查詢課堂資料
                if (studentData && studentData.id) {
                  aiStudentData.id = studentData.id;
                }
                
                // 處理選中的課堂資料
                let selectedLessonData = null;
                
                if (selected.length > 0) {
                  // 用戶選中了課堂，獲取所有選中的課堂
                  const selectedLessons = lessons.filter(lesson => selected.includes(lesson.id));
                  if (selectedLessons.length > 0) {
                    selectedLessonData = {
                      lessons: selectedLessons.map(lesson => ({
                        lesson_date: lesson.lesson_date,
                        course_type: lesson.course_type,
                        actual_timeslot: lesson.actual_timeslot,
                        lesson_teacher: lesson.lesson_teacher,
                        lesson_status: lesson.lesson_status,
                        lesson_duration: lesson.lesson_duration
                      })),
                      count: selectedLessons.length
                    };
                  }
                } else {
                  // 如果沒有選中課堂，自動使用下一堂課
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const futureLessons = lessons.filter(lesson => new Date(lesson.lesson_date) >= today);
                  if (futureLessons.length > 0) {
                    const targetLesson = futureLessons[0]; // 取第一堂未來課堂
                    selectedLessonData = {
                      lessons: [{
                        lesson_date: targetLesson.lesson_date,
                        course_type: targetLesson.course_type,
                        actual_timeslot: targetLesson.actual_timeslot,
                        lesson_teacher: targetLesson.lesson_teacher,
                        lesson_status: targetLesson.lesson_status,
                        lesson_duration: targetLesson.lesson_duration
                      }],
                      count: 1
                    };
                  }
                }
                
                setSelectedStudentsForAI([aiStudentData]);
                setSelectedLessonForAI(selectedLessonData);
                setShowAIMessageModal(true);
              }}
              className="flex flex-col items-center min-w-[48px] px-2 py-1 bg-[#F8F5EC] rounded-xl shadow hover:bg-[#FDE6B8] transition"
              title="發送AI訊息"
            >
              <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 12h8M12 8v8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] text-[#4B4036]">AI訊息</span>
            </button>
            <button
              onClick={fetchLessons}
              className="flex flex-col items-center min-w-[48px] px-2 py-1 bg-[#F8F5EC] rounded-xl shadow hover:bg-[#FDE6B8] transition"
              title="刷新"
            >
              <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1 1 19 5.635" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] text-[#4B4036]">刷新</span>
            </button>
            <button
              onClick={() => setCategorySelectOpen(true)}
              className={`flex flex-col items-center min-w-[48px] px-2 py-1 rounded-xl shadow transition ${
                categoryFilter.includes('all') 
                  ? 'bg-[#F8F5EC] hover:bg-[#FDE6B8]' 
                  : 'bg-[#FDE6B8] hover:bg-[#FCD58B] border-2 border-[#FCD58B]'
              }`}
              title={`類別${categoryFilter.includes('all') ? '' : ` (${categoryFilter.length} 項)`}`}
            >
              <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8M12 8v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] text-[#4B4036]">
                {categoryFilter.includes('all') ? '類別' : `${categoryFilter.length}項`}
              </span>
            </button>
            <button
              onClick={() => setVisibleCountSelectOpen(true)}
              className={`flex flex-col items-center min-w-[48px] px-2 py-1 rounded-xl shadow transition relative ${
                isCountButtonAnimating ? 'animate-pulse scale-105 bg-[#FDE6B8] border-[#FCD58B] shadow-lg' : 'bg-[#F8F5EC] hover:bg-[#FDE6B8]'
              } ${showSuccessIndicator ? 'bg-green-50 border-green-300' : ''}`}
              title={`顯示筆數 (${visibleCount >= lessons.length ? '全部' : visibleCount} 筆)`}
            >
              <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <path d="M8 12h8M12 8v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] text-[#4B4036]">
                {visibleCount >= lessons.length ? '全部' : visibleCount}
              </span>
              {showSuccessIndicator && (
                <svg className="w-4 h-4 text-green-500 animate-bounce absolute -top-2 -right-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            )}
            </button>
          </div>
        </div>
      
        {/* 載入狀態 */}
        {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FCD58B] mx-auto" />
            <p className="mt-2 text-[#2B3A3B] text-sm">載入課堂資料中...</p>
          </div>
        </div>
        )}
      
        {/* 錯誤狀態 */}
        {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" fillRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">載入課堂資料失敗</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
        )}
      
        {/* 無資料狀態 */}
        {!loading && !error && lessons.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" fillRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">暫無課堂資料</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>此學生目前沒有任何課堂記錄</p>
              </div>
            </div>
          </div>
        </div>
        )}
      
        {/* 過濾狀態顯示 */}
        {!loading && !error && lessons.length > 0 && !categoryFilter.includes('all') && (
          <div className="mb-4 p-3 bg-[#FDE6B8] rounded-lg border border-[#FCD58B]">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#4B4036]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              <span className="text-[#4B4036] font-medium">已過濾：</span>
              <div className="flex flex-wrap gap-2">
                {categoryFilter.map((category) => (
                  <span key={category} className="text-sm bg-[#FCD58B] px-2 py-1 rounded-full text-[#4B4036]">
                    {category}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setCategoryFilter(['all'])}
                className="text-sm text-[#4B4036] underline hover:text-[#7A6A52] ml-2"
              >
                清除過濾
              </button>
          </div>
        </div>
        )}
      
        {/* 課堂資料表格 */}
        {!loading && !error && lessons.length > 0 && (
        <div className="overflow-x-auto">
                          <table className="w-full min-w-max text-[#4B4036]">
            <thead>
              <tr className="border-b border-[#E9E2D6]">
                <th>
                  <input
                    className="form-checkbox w-4 h-4 text-[#4B4036] accent-[#CBBFA4]"
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) setSelected(filteredLessons.slice(0, visibleCount).map(l => l.id));
                      else setSelected([]);
                    }}
                  />
                </th>
                <th 
                  className="text-[15px] font-medium px-2 py-2 text-left cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                  onClick={() => handleSort('lesson_date')}
                >
                  <div className="flex items-center gap-1">
                    日期
                    {getSortIcon('lesson_date')}
                  </div>
                </th>
                <th 
                  className="text-[15px] font-medium px-2 py-2 text-left cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                  onClick={() => handleSort('course_type')}
                >
                  <div className="flex items-center gap-1">
                    課堂
                    {getSortIcon('course_type')}
                  </div>
                </th>
                <th 
                  className="text-[15px] font-medium px-2 py-2 text-left cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                  onClick={() => handleSort('actual_timeslot')}
                >
                  <div className="flex items-center gap-1">
                    上課時間
                    {getSortIcon('actual_timeslot')}
                  </div>
                </th>
                <th 
                  className="text-[15px] font-medium px-2 py-2 text-left cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                  onClick={() => handleSort('lesson_teacher')}
                >
                  <div className="flex items-center gap-1">
                    負責老師
                    {getSortIcon('lesson_teacher')}
                  </div>
                </th>
                <th 
                  className="text-[15px] font-medium px-2 py-2 text-left cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                  onClick={() => handleSort('lesson_status')}
                >
                  <div className="flex items-center gap-1">
                    出席狀況
                    {getSortIcon('lesson_status')}
                  </div>
                </th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {filteredLessons.slice(0, visibleCount).map((lesson, index) => (
                <tr 
                  key={lesson.id} 
                  className="border-b border-[#F3EAD9] hover:bg-[#FFF8E6] transition-all duration-300"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: showSuccessIndicator ? 'fadeInUp 0.5s ease-out' : 'none'
                  }}
                >
                  <td className="px-2 py-2">
                    <input
                      checked={selected.includes(lesson.id)}
                      className="form-checkbox w-4 h-4 text-[#4B4036] accent-[#CBBFA4]"
                      type="checkbox"
                      onChange={() => toggleSelect(lesson.id)}
                    />
                  </td>
                  <td className="text-[15px] font-medium px-2 py-2">{format(new Date(lesson.lesson_date), 'yyyy/MM/dd')}</td>
                  <td className="text-[15px] font-medium px-2 py-2">{typeof lesson.course_type === 'string' ? lesson.course_type : ''}</td>
                  <td className="text-[15px] font-medium px-2 py-2">{lesson.actual_timeslot || lesson.regular_timeslot}</td>
                  <td className="text-[15px] font-medium px-2 py-2">{lesson.lesson_teacher}</td>
                  <td className="text-[15px] font-medium px-2 py-2">
                    {format(new Date(lesson.lesson_date), 'yyyy-MM-dd') === todayStr ? (
                      <>
                        <button
                          className="underline text-sm"
                          onClick={() => handleStatusClick(lesson.id, lesson.lesson_status)}
                        >
                          {lesson.lesson_status || '-'}
                        </button>
                        {statusPopupOpen === lesson.id && !isModalOpen && (
                          <PopupSelect
                            mode="multi"
                            options={[
                              { label: '出席', value: '出席' },
                              { label: '缺席', value: '缺席' },
                              { label: '病假', value: '病假' },
                              { label: '事假', value: '事假' },
                            ]}
                            selected={tempStatus}
                            title="選擇出席狀況"
                            onCancel={handleStatusPopupClose}
                            onChange={handleStatusChange}
                            onConfirm={async () => {
                              await supabase
                                .from('hanami_student_lesson')
                                .update({ lesson_status: tempStatus })
                                .eq('id', lesson.id);
                              await fetchLessons();
                              handleStatusPopupClose();
                            }}
                          />
                        )}
                      </>
                    ) : format(new Date(lesson.lesson_date), 'yyyy-MM-dd') > todayStr ? (
                      '-'
                    ) : (
                      lesson.lesson_status || '-'
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      className="text-[#4B4036] underline underline-offset-2 hover:text-[#7A6A52] text-sm"
                      onClick={() => handleEdit(lesson)}
                    >
                      編輯
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        
        {/* 記錄數量顯示 */}
        {!loading && !error && lessons.length > 0 && (
          <div className="mt-4 text-sm text-[#4B4036] text-center">
            <span>
              顯示 {Math.min(visibleCount, filteredLessons.length)} / {filteredLessons.length} 筆記錄
              {!categoryFilter.includes('all') && ` (已過濾 ${lessons.length - filteredLessons.length} 筆)`}
            </span>
          </div>
        )}
        
        <div className="flex gap-3 mt-4">
          <button
            className="rounded-full px-6 py-2 bg-[#F8F5EC] text-[#4B4036] text-[15px] font-semibold shadow-md hover:ring-1 hover:ring-[#CBBFA4] transition"
            onClick={() => {
              setEditingLesson(null);
              setIsModalOpen(true);
            }}
          >
            新增課堂
          </button>
          {selected.length > 0 && (
          <>
            <button
              className="rounded-full px-6 py-2 bg-[#F8F5EC] text-[#4B4036] text-[15px] font-semibold shadow-md hover:ring-1 hover:ring-[#CBBFA4] transition"
              onClick={() => {
                setSelected([]);
                const checkbox = document.querySelector<HTMLInputElement>('th input[type="checkbox"]');
                if (checkbox) checkbox.checked = false;
              }}
            >
              清除選擇
            </button>
            <button
              className="rounded-full px-6 py-2 bg-[#F8F5EC] text-[#4B4036] text-[15px] font-semibold shadow-md hover:ring-1 hover:ring-[#CBBFA4] transition"
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              刪除
            </button>
          </>
          )}
        </div>
        <LessonEditorModal
          lesson={editingLesson}
          mode={editingLesson ? 'edit' : 'add'}
          open={isModalOpen}
          studentId={studentId}
          onClose={() => {
            setStatusPopupOpen(null);
            setIsModalOpen(false);
            setEditingLesson(null);
          }}
          onSaved={() => {
            fetchLessons();
          }}
        />
        {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-white/80 z-50"
          onClick={() => setIsDeleteConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[#4B4036] text-base mb-4">確定要刪除選取的課堂記錄嗎？</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm rounded-full bg-[#F0ECE1] text-[#4B4036] hover:ring-1 hover:ring-[#CBBFA4]"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 text-sm rounded-full bg-[#FBEAE5] text-[#4B4036] hover:ring-1 hover:ring-[#CBBFA4]"
                onClick={async () => {
                  setIsDeleteConfirmOpen(false);
                  await confirmDelete();
                }}
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
        )}
        
        {/* 類別選擇彈窗 */}
        {categorySelectOpen && (
          <PopupSelect
            title="選擇課堂類別"
            options={[
              { label: '全部', value: 'all' },
              { label: '未上課堂', value: 'upcoming' },
              { label: '過往課堂', value: 'past' },
              { label: '今日課堂', value: 'today' },
              { label: '請假', value: 'sick' },
              { label: '補課', value: 'makeup' },
              { label: '缺席', value: 'absent' },
            ]}
            selected={tempCategoryFilter}
            onChange={(value) => setTempCategoryFilter(Array.isArray(value) ? value : [value])}
            onConfirm={() => {
              setCategoryFilter(tempCategoryFilter);
              setCategorySelectOpen(false);
            }}
            onCancel={() => {
              setTempCategoryFilter(categoryFilter);
              setCategorySelectOpen(false);
            }}
            mode="multi"
          />
        )}
        
        {/* 顯示筆數選擇彈窗 */}
        {visibleCountSelectOpen && (
          <PopupSelect
            title="選擇顯示筆數"
            options={[
              { label: '5 筆', value: '5' },
              { label: '10 筆', value: '10' },
              { label: '20 筆', value: '20' },
              { label: '50 筆', value: '50' },
              { label: '全部', value: 'all' },
            ]}
            selected={tempVisibleCount}
            onChange={(value) => setTempVisibleCount(Array.isArray(value) ? value[0] : value)}
            onConfirm={handleVisibleCountConfirm}
            onCancel={handleVisibleCountCancel}
            mode="single"
          />
        )}
        
        {/* AI 訊息模態框 */}
        {showAIMessageModal && selectedStudentsForAI.length > 0 && (
          <AIMessageModal
            isOpen={showAIMessageModal}
            onClose={() => {
              setShowAIMessageModal(false);
              setSelectedStudentsForAI([]);
              setSelectedLessonForAI(null);
            }}
            students={selectedStudentsForAI}
            selectedLesson={selectedLessonForAI}
          />
        )}
      </div>
    </div>
  );
}

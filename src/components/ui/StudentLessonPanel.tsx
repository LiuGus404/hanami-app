import { format } from 'date-fns';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';



import LessonEditorModal from '@/components/ui/LessonEditorModal';
import { PopupSelect } from '@/components/ui/PopupSelect';
import { getSupabaseClient } from '@/lib/supabase';
import { Lesson, CourseType } from '@/types';


interface StudentLessonPanelProps {
  studentId: string;
  studentType?: string; // 添加學生類型參數
  studentName?: string; // 添加學生姓名參數
  contactNumber?: string; // 添加聯絡電話參數
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

export default function StudentLessonPanel({ studentId, studentType, studentName, contactNumber }: StudentLessonPanelProps) {
  const supabase = getSupabaseClient();
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
    if (tempVisibleCount === 'all') {
      parsed = lessons.length;
    } else {
      parsed = parseInt(tempVisibleCount);
      if (isNaN(parsed) || parsed < 1) {
        parsed = 5;
      }
    }
    setVisibleCount(parsed);
    setVisibleCountSelectOpen(false);
  };

  const handleVisibleCountCancel = () => {
    setTempVisibleCount(visibleCount >= lessons.length ? 'all' : String(visibleCount));
    setVisibleCountSelectOpen(false);
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const filteredLessons = sortedLessons.filter((lesson) => {
    if (categoryFilter.includes('all')) return true;

    const lessonDateStr = format(new Date(lesson.lesson_date), 'yyyy-MM-dd');
    const dateMatches =
      (categoryFilter.includes('upcoming') && lessonDateStr >= todayStr) ||
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
    const selectedLessons = sortedLessons.filter(lesson => selected.includes(lesson.id));
    
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
    const selectedLessons = sortedLessons.filter(lesson => selected.includes(lesson.id));

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
      toast.error('此學生沒有聯絡電話，無法發送WhatsApp');
      return;
    }

    // 檢查是否有選中的課堂
    if (selected.length === 0) {
      toast.error('請先選擇要發送的課堂記錄');
      return;
    }

    // 只發送選中的課堂
    const selectedLessons = sortedLessons.filter(lesson => selected.includes(lesson.id));

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
          <div className="flex items-center gap-3">
            {/* 匯出CSV按鈕 */}
            <button
              className="border border-[#DDD2BA] rounded-md px-3 py-1 text-sm text-[#4B4036] bg-white hover:bg-[#F8F5EC] transition-colors flex items-center gap-1"
              title="匯出選中的課堂記錄為CSV檔案"
              onClick={exportToCSV}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" fillRule="evenodd" />
              </svg>
              匯出CSV
            </button>
          
            {/* 複製按鈕 */}
            <button
              className="border border-[#DDD2BA] rounded-md px-3 py-1 text-sm text-[#4B4036] bg-white hover:bg-[#F8F5EC] transition-colors flex items-center gap-1"
              title="複製選中的課堂記錄到剪貼簿"
              onClick={copyToWhatsApp}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              複製
            </button>
          
            {/* WhatsApp按鈕 */}
            <button
              className="border border-[#DDD2BA] rounded-md px-3 py-1 text-sm text-[#4B4036] bg-white hover:bg-[#F8F5EC] transition-colors flex items-center gap-1"
              title="發送選中的課堂記錄到WhatsApp"
              onClick={sendToWhatsApp}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
              WhatsApp
            </button>
          
            <button
              className="border border-[#DDD2BA] rounded-md px-2 py-1 text-sm text-[#4B4036] bg-white"
              onClick={() => {
                fetchLessons();
                alert('刷新成功');
              }}
            >
              刷新
            </button>
            <button
              className="border border-[#DDD2BA] rounded-md px-2 py-1 text-sm text-[#4B4036] bg-white"
              onClick={() => setCategorySelectOpen(true)}
            >
              類別
            </button>
            {categorySelectOpen && (
            <PopupSelect
              mode="multi"
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
              title="類別"
              onCancel={() => {
                setTempCategoryFilter(categoryFilter);
                setCategorySelectOpen(false);
              }}
              onChange={(selected) => {
                if (selected.length === 0 || selected.includes('all')) {
                  setTempCategoryFilter(['all']);
                } else {
                  setTempCategoryFilter(selected as string[]);
                }
              }}
              onConfirm={() => {
                setCategoryFilter(tempCategoryFilter);
                setCategorySelectOpen(false);
              }}
            />
            )}
            <button
              className="border border-[#DDD2BA] rounded-md px-2 py-1 text-sm text-[#4B4036] bg-white"
              onClick={() => setVisibleCountSelectOpen(true)}
            >
              顯示筆數：{visibleCount === lessons.length ? '全部' : visibleCount}
            </button>
            {visibleCountSelectOpen && (
            <PopupSelect
              mode="multi"
              options={[
                { label: '5 筆', value: '5' },
                { label: '10 筆', value: '10' },
                { label: '15 筆', value: '15' },
                { label: '20 筆', value: '20' },
                { label: '全部', value: 'all' },
              ]}
              selected={tempVisibleCount}
              title="顯示筆數"
              onCancel={handleVisibleCountCancel}
              onChange={(selected) => {
                if (typeof selected === 'string') {
                  setTempVisibleCount(selected);
                } else if (Array.isArray(selected) && selected.length > 0) {
                  setTempVisibleCount(String(selected[0]));
                }
              }}
              onConfirm={handleVisibleCountConfirm}
            />
            )}
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
      
        {/* 課堂資料表格 */}
        {!loading && !error && lessons.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[#4B4036]">
            <thead>
              <tr className="border-b border-[#E9E2D6]">
                <th>
                  <input
                    className="form-checkbox w-4 h-4 text-[#4B4036] accent-[#CBBFA4]"
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) setSelected(sortedLessons.slice(0, visibleCount).map(l => l.id));
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
              {sortedLessons.slice(0, visibleCount).map((lesson) => (
                <tr key={lesson.id} className="border-b border-[#F3EAD9] hover:bg-[#FFF8E6]">
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
      </div>
    </div>
  );
}

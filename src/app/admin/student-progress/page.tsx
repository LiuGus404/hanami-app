'use client';

import { motion } from 'framer-motion';
import { BookOpen, CalendarClock, Star, LayoutGrid, List, ChevronLeft, ChevronRight, Settings2, Trash2, UserX, RotateCcw, Play, Target, FileText, Plus, CheckCircle, XCircle, Send, Brain, Edit, BarChart3, TreePine, TrendingUp, Gamepad2, FileText as FileTextIcon, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

import BackButton from '@/components/ui/BackButton';
import HanamiButton from '@/components/ui/HanamiButton';
import HanamiCard from '@/components/ui/HanamiCard';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { StudentProgress } from '@/types';

export default function StudentProgressPage() {
  const [progressRecords, setProgressRecords] = useState<StudentProgress[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<StudentProgress[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLessonType, setSelectedLessonType] = useState<string[]>([]);
  const [lessonTypeDropdownOpen, setLessonTypeDropdownOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  // 排序相關狀態
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  // 添加防抖機制
  const dataFetchedRef = useRef(false);
  const loadingRef = useRef(false);


  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StudentProgress | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');





  useEffect(() => {
    // 如果正在載入或沒有用戶，不執行
    if (userLoading || !user) return;
    
    // 如果用戶沒有權限，重定向
    if (!['admin', 'manager'].includes(user.role)) {
      router.push('/');
      return;
    }

    // 如果已經載入過數據，不重複載入
    if (dataFetchedRef.current) return;
    
    // 防止重複載入
    if (loadingRef.current) return;
    loadingRef.current = true;

    fetchProgressData();
  }, [user, userLoading, router]);

  // 提取資料載入函數
  const fetchProgressData = async () => {
    try {
      setIsLoading(true);
      
      // 獲取進度記錄，包含學生和課堂資料
      const { data: progressData, error: progressError } = await supabase
        .from('hanami_student_lesson')
        .select('*')
        .order('created_at', { ascending: false });

      if (progressError) {
        console.error('Error fetching progress data:', progressError);
        return;
      }

      // 直接使用資料庫中的課堂類型值，不進行映射
      const mappedProgress = (progressData || []).map((item: any) => ({
        id: item.id,
        student_id: item.student_id ?? null,
        lesson_id: null,
        lesson_date: item.lesson_date ?? null,
        course_type: item.course_type ?? null,
        lesson_type: item.lesson_status ?? null,
        duration_minutes: null,
        progress_notes: item.progress_notes ?? null,
        next_goal: item.next_target ?? null,
        video_url: item.video_url ?? null,
        created_at: item.created_at,
        updated_at: item.updated_at ?? null,
        review_status: 'pending' as const,
        review_notes: null,
        reviewed_by: null,
        reviewed_at: null,
        is_sent: false,
        sent_at: null,
        ai_processed: false,
        ai_processed_at: null,
        ai_feedback: null,
        ai_suggestions: null,
        student: {
          full_name: item.full_name,
          student_oid: item.student_oid,
          course_type: item.course_type,
          student_type: item.student_type,
        },
        lesson: undefined,
      }));
      setProgressRecords(mappedProgress);
      dataFetchedRef.current = true;
      loadingRef.current = false;
    } catch (error) {
      console.error('Error in fetchProgressData:', error);
      loadingRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  // 當用戶變化時重置防抖狀態
  useEffect(() => {
    if (user) {
      dataFetchedRef.current = false;
      loadingRef.current = false;
    }
  }, [user]);

  // 篩選邏輯
  useEffect(() => {
    let filtered = [...progressRecords];

    // 姓名搜尋
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.student?.full_name?.toLowerCase().includes(searchLower) ||
        record.student?.student_oid?.toLowerCase().includes(searchLower),
      );
    }

    // 課程類型篩選
    if (selectedLessonType.length > 0) {
      filtered = filtered.filter(record => 
        record.lesson_type && selectedLessonType.includes(record.lesson_type),
      );
    }

    // 日期範圍篩選
    if (dateRange.start) {
      filtered = filtered.filter(record => 
        record.lesson_date && record.lesson_date >= dateRange.start,
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(record => 
        record.lesson_date && record.lesson_date <= dateRange.end,
      );
    }

    setFilteredRecords(filtered);
    setCurrentPage(1); // 重置到第一頁
  }, [progressRecords, searchTerm, selectedLessonType, dateRange]);

  // 排序功能
  const sortRecords = (records: StudentProgress[]) => {
    if (!sortField) return records;

    return records.sort((a, b) => {
      let aValue: any = a[sortField as keyof StudentProgress];
      let bValue: any = b[sortField as keyof StudentProgress];

      // 處理特殊欄位的排序
      switch (sortField) {
        case 'duration_minutes':
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
          break;
        case 'lesson_date':
        case 'created_at':
        case 'updated_at':
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
          break;
        case 'student_name':
          aValue = a.student?.full_name || '';
          bValue = b.student?.full_name || '';
          break;
        default:
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

  // 排序功能
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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

  const toggleRecord = (id: string) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id],
    );
  };

  // 課堂類型選項 - 使用固定的中文選項
  const lessonTypeOptions = [
    { label: '正常課', value: '正常課' },
    { label: '補課', value: '補課' },
    { label: '評估課', value: '評估課' },
    { label: '考試課', value: '考試課' },
    { label: '比賽課', value: '比賽課' },
    { label: '拍片課', value: '拍片課' },
  ];

  // 獲取課堂類型顯示名稱
  const getLessonTypeLabel = (type: string | null) => {
    // 課堂類型直接顯示中文值，不需要映射
    return type || '未分類';
  };

  // 獲取課程和課堂類型組合顯示名稱
  const getCourseAndLessonTypeLabel = (courseType: string | null, lessonType: string | null) => {
    const course = courseType || '未分類';
    const lesson = lessonType || '未分類';
    return `${course}（${lesson}）`;
  };

  // 計算總頁數
  const sortedRecords = sortRecords([...filteredRecords]);
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  
  // 確保當前頁數不超過總頁數
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // 刪除進度記錄
  const handleDeleteRecords = async () => {
    if (!selectedRecords.length) return;
    
    if (!confirm(`確定要刪除選中的 ${selectedRecords.length} 筆進度記錄嗎？此操作無法復原。`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('hanami_student_lesson')
        .delete()
        .in('id', selectedRecords);

      if (error) {
        console.error('Error deleting progress records:', error);
        alert('刪除失敗，請稍後再試');
        return;
      }

      // 更新本地狀態
      setProgressRecords(prev => prev.filter(record => !selectedRecords.includes(record.id)));
      setSelectedRecords([]);
      alert('刪除成功');
    } catch (error) {
      console.error('Error:', error);
      alert('刪除失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 新增學生進度記錄
  const handleAddProgress = async (formData: any) => {
    try {
      if (!formData.course_type || !formData.lesson_type) {
        alert('課程類型與課堂類型皆為必填');
        return;
      }
      const { error } = await supabase
        .from('hanami_student_lesson')
        .insert([{
          student_id: formData.student_id,
          lesson_date: formData.lesson_date,
          course_type: formData.course_type,
          lesson_status: formData.lesson_type,
          progress_notes: formData.progress_notes,
          next_target: formData.next_goal,
          video_url: formData.video_url,
        }]);
      if (error) {
        console.error('新增進度記錄失敗:', error);
        alert(`新增失敗: ${error.message}`);
        return;
      }
      alert('進度記錄新增成功！');
      setShowAddModal(false);
      fetchProgressData();
    } catch (error) {
      console.error('新增進度記錄失敗:', error);
      alert(`新增失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 編輯學生進度記錄
  const handleEditProgress = async (formData: any) => {
    if (!selectedRecord) return;
    try {
      if (!formData.course_type || !formData.lesson_type) {
        alert('課程類型與課堂類型皆為必填');
        return;
      }
      const { error } = await supabase
        .from('hanami_student_lesson')
        .update({
          student_id: formData.student_id,
          lesson_date: formData.lesson_date,
          course_type: formData.course_type,
          lesson_status: formData.lesson_type,
          progress_notes: formData.progress_notes,
          next_target: formData.next_goal,
          video_url: formData.video_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRecord.id);
      if (error) {
        console.error('編輯進度記錄失敗:', error);
        alert(`編輯失敗: ${error.message}`);
        return;
      }
      alert('進度記錄編輯成功！');
      setShowEditModal(false);
      setSelectedRecord(null);
      fetchProgressData();
    } catch (error) {
      console.error('編輯進度記錄失敗:', error);
      alert(`編輯失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 審核進度記錄
  const handleReviewProgress = async () => {
    if (!selectedRecord) return;

    try {
      const currentUser = await supabase.auth.getUser();
      const reviewerId = currentUser.data.user?.id;

      const { error } = await supabase
        .from('hanami_student_lesson')
        .update({
          status: reviewStatus === 'approved' ? 'attended' : 'absent',
          notes: reviewNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRecord.id);

      if (error) {
        console.error('審核失敗:', error);
        alert(`審核失敗: ${error.message}`);
        return;
      }

      alert('審核完成！');
      setShowReviewModal(false);
      setSelectedRecord(null);
      setReviewNotes('');
      fetchProgressData();
    } catch (error) {
      console.error('審核失敗:', error);
      alert(`審核失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 標記為已發送
  const handleMarkAsSent = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('hanami_student_lesson')
        .update({
          remarks: '已發送',
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId);

      if (error) {
        console.error('標記發送失敗:', error);
        alert(`操作失敗: ${error.message}`);
        return;
      }

      alert('已標記為發送！');
      fetchProgressData();
    } catch (error) {
      console.error('標記發送失敗:', error);
      alert(`操作失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 標記為AI已處理
  const handleMarkAsAiProcessed = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('hanami_student_lesson')
        .update({
          remarks: 'AI已處理',
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId);

      if (error) {
        console.error('標記AI處理失敗:', error);
        alert(`操作失敗: ${error.message}`);
        return;
      }

      alert('已標記為AI處理！');
      fetchProgressData();
    } catch (error) {
      console.error('標記AI處理失敗:', error);
      alert(`操作失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 批量操作
  const handleBulkAction = async (action: 'approve' | 'reject' | 'mark_sent' | 'mark_ai_processed') => {
    if (selectedRecords.length === 0) {
      alert('請選擇要操作的記錄');
      return;
    }

    try {
      const currentUser = await supabase.auth.getUser();
      const reviewerId = currentUser.data.user?.id;

      let updateData: any = {};

      switch (action) {
        case 'approve':
          updateData = {
            review_status: 'approved',
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
          };
          break;
        case 'reject':
          updateData = {
            review_status: 'rejected',
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
          };
          break;
        case 'mark_sent':
          updateData = {
            is_sent: true,
            sent_at: new Date().toISOString(),
          };
          break;
        case 'mark_ai_processed':
          updateData = {
            ai_processed: true,
            ai_processed_at: new Date().toISOString(),
          };
          break;
      }

      const { error } = await supabase
        .from('hanami_student_lesson')
        .update(updateData)
        .in('id', selectedRecords);

      if (error) {
        console.error('批量操作失敗:', error);
        alert(`操作失敗: ${error.message}`);
        return;
      }

      alert(`批量操作完成！共處理 ${selectedRecords.length} 筆記錄`);
      setSelectedRecords([]);
      fetchProgressData();
    } catch (error) {
      console.error('批量操作失敗:', error);
      alert(`操作失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 獲取狀態徽章
  const getStatusBadge = (status: string, type: 'review' | 'sent' | 'ai') => {
    const configs: Record<string, Record<string, { color: string; text: string }>> = {
      review: {
        pending: { color: 'bg-yellow-100 text-yellow-800', text: '待審核' },
        approved: { color: 'bg-green-100 text-green-800', text: '已通過' },
        rejected: { color: 'bg-red-100 text-red-800', text: '已拒絕' },
      },
      sent: {
        true: { color: 'bg-green-100 text-green-800', text: '已發送' },
        false: { color: 'bg-gray-100 text-gray-800', text: '未發送' },
      },
      ai: {
        true: { color: 'bg-blue-100 text-blue-800', text: 'AI已處理' },
        false: { color: 'bg-gray-100 text-gray-800', text: 'AI未處理' },
      },
    };

    const config = configs[type][status] || { color: 'bg-gray-100 text-gray-800', text: '未知' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-6">
          <BackButton href="/admin" label="返回管理面板" />
          <h1 className="text-2xl font-bold text-[#2B3A3B] mb-2">學生進度管理</h1>
          <p className="text-[#87704e]">查看和管理所有學生的學習進度記錄</p>
        </div>

        {/* 學生進度管理導航按鈕區域 */}
        <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/dashboard'}
            >
              <BarChart3 className="w-4 h-4" />
              進度儀表板
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/growth-trees'}
            >
              <TreePine className="w-4 h-4" />
              成長樹管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/abilities'}
            >
              <TrendingUp className="w-4 h-4" />
              發展能力圖卡
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/activities'}
            >
              <Gamepad2 className="w-4 h-4" />
              教學活動管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#A64B2A] text-white hover:bg-[#8B3A1F] transition-colors"
              onClick={() => window.location.href = '/admin/student-progress'}
            >
              <FileTextIcon className="w-4 h-4" />
              進度記錄管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/students'}
            >
              <Users className="w-4 h-4" />
              返回學生管理
            </button>
          </div>
        </div>

        {/* 主要操作按鈕區域 */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <button
                className="bg-[#A64B2A] text-white px-4 py-2 rounded-lg hover:bg-[#8B3A1F] transition-colors flex items-center gap-2"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4" />
                <span>加入學生記錄</span>
              </button>
              
              {selectedRecords.length > 0 && (
                <div className="flex gap-2">
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    onClick={() => handleBulkAction('approve')}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>批量通過</span>
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    onClick={() => handleBulkAction('reject')}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>批量拒絕</span>
                  </button>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    onClick={() => handleBulkAction('mark_sent')}
                  >
                    <Send className="w-4 h-4" />
                    <span>標記發送</span>
                  </button>
                  <button
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    onClick={() => handleBulkAction('mark_ai_processed')}
                  >
                    <Brain className="w-4 h-4" />
                    <span>標記AI處理</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="text-sm text-[#2B3A3B]">
              已選擇 {selectedRecords.length} 筆記錄
            </div>
          </div>
        </div>

        {/* 操作按鈕區域 */}
        {selectedRecords.length > 0 && (
          <div className="mb-4 p-4 bg-white rounded-xl border border-[#EADBC8] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#2B3A3B]">
                  已選中 {selectedRecords.length} 筆記錄
                </span>
                <button
                  className="text-xs text-[#A68A64] hover:text-[#8B7355] underline"
                  onClick={() => setSelectedRecords([])}
                >
                  取消選擇
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  className="hanami-btn-danger flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  onClick={handleDeleteRecords}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>刪除記錄</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 篩選和搜尋區域 */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            {/* 搜尋 */}
            <div className="flex-1 min-w-64">
              <input
                className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg text-[#2B3A3B] placeholder-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                placeholder="搜尋學生姓名或編號..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 課程類型篩選 */}
            <div className="relative">
              <button
                className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B]"
                onClick={() => setLessonTypeDropdownOpen(true)}
              >
                課程類型
                {selectedLessonType.length > 0 && (
                  <span className="ml-2 bg-[#A68A64] text-white text-xs px-2 py-1 rounded-full">
                    {selectedLessonType.length}
                  </span>
                )}
              </button>
              {lessonTypeDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-50 min-w-48">
                  <div className="p-2">
                    {lessonTypeOptions.map((option) => (
                      <label key={option.value} className="flex items-center p-2 hover:bg-[#FFF9F2] rounded cursor-pointer">
                        <input
                          checked={selectedLessonType.includes(option.value)}
                          className="mr-2"
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLessonType([...selectedLessonType, option.value]);
                            } else {
                              setSelectedLessonType(selectedLessonType.filter(type => type !== option.value));
                            }
                          }}
                        />
                        <span className="text-sm text-[#2B3A3B]">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="border-t border-[#EADBC8] p-2 flex gap-2">
                    <button
                      className="text-xs text-[#A68A64] hover:text-[#8B7355] underline"
                      onClick={() => setSelectedLessonType([])}
                    >
                      清除
                    </button>
                    <button
                      className="text-xs bg-[#A68A64] text-white px-2 py-1 rounded hover:bg-[#8B7355]"
                      onClick={() => setLessonTypeDropdownOpen(false)}
                    >
                      確定
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 日期範圍篩選 */}
            <div className="flex gap-2 items-center">
              <input
                className="px-3 py-2 border border-[#EADBC8] rounded-lg text-sm text-[#2B3A3B]"
                placeholder="開始日期"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
              <span className="text-[#A68A64]">至</span>
              <input
                className="px-3 py-2 border border-[#EADBC8] rounded-lg text-sm text-[#2B3A3B]"
                placeholder="結束日期"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>

            {/* 顯示模式切換 */}
            <button
              className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B] flex items-center gap-2"
              onClick={() => setDisplayMode(displayMode === 'grid' ? 'list' : 'grid')}
            >
              {displayMode === 'grid' ? (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  <span>圖卡顯示</span>
                </>
              ) : (
                <>
                  <List className="w-4 h-4" />
                  <span>列表顯示</span>
                </>
              )}
            </button>

            {/* 清除篩選條件 */}
            {(searchTerm || selectedLessonType.length > 0 || dateRange.start || dateRange.end) && (
              <button
                className="hanami-btn-danger text-sm px-4 py-2 text-[#A64B2A]"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLessonType([]);
                  setDateRange({ start: '', end: '' });
                }}
              >
                清除條件
              </button>
            )}
          </div>
        </div>

        {/* 統計信息 */}
        <div className="mb-4 p-4 bg-white rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="flex flex-wrap gap-6 text-sm text-[#2B3A3B]">
            <div>
              <span className="font-semibold">總記錄數：</span>
              <span className="text-[#A68A64]">{progressRecords.length}</span>
            </div>
            <div>
              <span className="font-semibold">篩選結果：</span>
              <span className="text-[#A68A64]">{filteredRecords.length}</span>
            </div>
            <div>
              <span className="font-semibold">總時長：</span>
              <span className="text-[#A68A64]">
                {filteredRecords.reduce((total, record) => total + (record.duration_minutes || 0), 0)} 分鐘
              </span>
            </div>
          </div>
        </div>

        {/* 分頁控制 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#2B3A3B]">每頁顯示：</span>
            <select
              className="border border-[#EADBC8] rounded px-2 py-1 text-sm"
              value={pageSize === Infinity ? 'all' : pageSize.toString()}
              onChange={(e) => {
                setPageSize(e.target.value === 'all' ? Infinity : Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="all">全部</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {sortedRecords.length > 0 && (
              <>
                <button
                  className={`p-2 rounded-full ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-[#2B3A3B] hover:bg-[#FFF9F2]'
                  }`}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-[#2B3A3B]">
                  第 {currentPage} 頁，共 {totalPages} 頁
                </span>
                <button
                  className={`p-2 rounded-full ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-[#2B3A3B] hover:bg-[#FFF9F2]'
                  }`}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            {sortedRecords.length === 0 && (
              <span className="text-sm text-[#2B3A3B]">
                沒有符合條件的記錄
              </span>
            )}
          </div>
        </div>

        {/* 載入狀態 */}
        {isLoading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64] mx-auto" />
            <p className="mt-4 text-[#2B3A3B]">載入中...</p>
          </div>
        )}

        {/* 進度記錄列表 */}
        {!isLoading && (
          displayMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedRecords
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((record) => (
                  <motion.div
                    key={record.id}
                    animate={{
                      scale: selectedRecords.includes(record.id) ? 1.03 : 1,
                      boxShadow: selectedRecords.includes(record.id)
                        ? '0 4px 20px rgba(252, 213, 139, 0.4)'
                        : 'none',
                    }}
                    className="cursor-pointer relative"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleRecord(record.id)}
                  >
                    <div className="bg-white rounded-xl border border-[#EADBC8] p-4 shadow-sm hover:shadow-md transition-shadow">
                      {selectedRecords.includes(record.id) && (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute top-2 right-2"
                          exit={{ opacity: 0, y: -10 }}
                          initial={{ opacity: 0, y: -10 }}
                        >
                          <img alt="選取" className="w-8 h-8" src="/leaf-sprout.png" />
                        </motion.div>
                      )}
                      
                      <div className="mb-3">
                        <h3 className="font-semibold text-[#2B3A3B] text-lg">
                          {record.student?.full_name || '未知學生'}
                        </h3>
                        <p className="text-sm text-[#A68A64]">
                          {record.student?.student_oid || '無編號'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarClock className="w-4 h-4 text-[#A68A64]" />
                          <span className="text-[#2B3A3B]">
                            {record.lesson_date ? new Date(record.lesson_date).toLocaleDateString('zh-HK') : '未設定日期'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="w-4 h-4 text-[#A68A64]" />
                          <span className="text-[#2B3A3B]">
                            {getCourseAndLessonTypeLabel(record.course_type, record.lesson_type)}
                          </span>
                        </div>

                        {record.duration_minutes && (
                          <div className="flex items-center gap-2 text-sm">
                            <Play className="w-4 h-4 text-[#A68A64]" />
                            <span className="text-[#2B3A3B]">
                              {record.duration_minutes} 分鐘
                            </span>
                          </div>
                        )}

                        {record.next_goal && (
                          <div className="flex items-center gap-2 text-sm">
                            <Target className="w-4 h-4 text-[#A68A64]" />
                            <span className="text-[#2B3A3B] text-xs">
                              {record.next_goal.length > 30 ? `${record.next_goal.substring(0, 30)}...` : record.next_goal}
                            </span>
                          </div>
                        )}

                        {record.progress_notes && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-[#A68A64]" />
                            <span className="text-[#2B3A3B] text-xs">
                              {record.progress_notes.length > 30 ? `${record.progress_notes.substring(0, 30)}...` : record.progress_notes}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#EADBC8] flex justify-between items-center">
                        <p className="text-xs text-[#A68A64]">
                          建立時間：{new Date(record.created_at).toLocaleString('zh-HK')}
                        </p>
                        <button
                          className="text-[#A64B2A] hover:text-[#8B3A1F] transition-colors p-1"
                          title="編輯"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#EADBC8] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FFF9F2] border-b border-[#EADBC8]">
                    <th className="w-12 p-3 text-left text-sm font-medium text-[#2B3A3B]">
                      <input
                        checked={selectedRecords.length === sortedRecords.length}
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecords(sortedRecords.map(r => r.id));
                          } else {
                            setSelectedRecords([]);
                          }
                        }}
                      />
                    </th>
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('student_name')}
                    >
                      <div className="flex items-center gap-1">
                        學生姓名
                        {getSortIcon('student_name')}
                      </div>
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">學生編號</th>
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('lesson_date')}
                    >
                      <div className="flex items-center gap-1">
                        課程日期
                        {getSortIcon('lesson_date')}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('lesson_type')}
                    >
                      <div className="flex items-center gap-1">
                        課程類型
                        {getSortIcon('lesson_type')}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('duration_minutes')}
                    >
                      <div className="flex items-center gap-1">
                        時長
                        {getSortIcon('duration_minutes')}
                      </div>
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">下個目標</th>
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">進度備註</th>
                    <th 
                      className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition-colors"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center gap-1">
                        建立時間
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((record) => (
                      <tr
                        key={record.id}
                        className={`border-b border-[#EADBC8] hover:bg-[#FFF9F2] cursor-pointer ${
                          selectedRecords.includes(record.id) ? 'bg-[#FFF9F2]' : ''
                        }`}
                        onClick={() => toggleRecord(record.id)}
                      >
                        <td className="p-3">
                          <input
                            checked={selectedRecords.includes(record.id)}
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRecords([...selectedRecords, record.id]);
                              } else {
                                setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-3 text-sm text-[#2B3A3B]">
                          {record.student?.full_name || '未知學生'}
                        </td>
                        <td className="p-3 text-sm text-[#2B3A3B]">
                          {record.student?.student_oid || '—'}
                        </td>
                        <td className="p-3 text-sm text-[#2B3A3B]">
                          {record.lesson_date ? new Date(record.lesson_date).toLocaleDateString('zh-HK') : '—'}
                        </td>
                        <td className="p-3 text-sm text-[#2B3A3B]">
                          {getCourseAndLessonTypeLabel(record.course_type, record.lesson_type)}
                        </td>
                        <td className="p-3 text-sm text-[#2B3A3B]">
                          {record.duration_minutes ? `${record.duration_minutes} 分鐘` : '—'}
                        </td>
                        <td className="p-3 text-sm text-[#2B3A3B] max-w-xs truncate">
                          {record.next_goal || '—'}
                        </td>
                        <td className="p-3 text-sm text-[#2B3A3B] max-w-xs truncate">
                          {record.progress_notes || '—'}
                        </td>
                        <td className="p-3 text-sm text-[#2B3A3B]">
                          {new Date(record.created_at).toLocaleString('zh-HK')}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              className="text-[#A64B2A] hover:text-[#8B3A1F] transition-colors p-1"
                              title="編輯"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecord(record);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* 新增記錄模態框 */}
        {showAddModal && (
          <AddProgressModal
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddProgress}
          />
        )}

        {/* 編輯記錄模態框 */}
        {showEditModal && selectedRecord && (
          <EditProgressModal
            record={selectedRecord}
            onClose={() => {
              setShowEditModal(false);
              setSelectedRecord(null);
            }}
            onSubmit={handleEditProgress}
          />
        )}

        {/* 審核模態框 */}
        {showReviewModal && selectedRecord && (
          <ReviewProgressModal
            record={selectedRecord}
            reviewNotes={reviewNotes}
            reviewStatus={reviewStatus}
            setReviewNotes={setReviewNotes}
            setReviewStatus={setReviewStatus}
            onClose={() => {
              setShowReviewModal(false);
              setSelectedRecord(null);
              setReviewNotes('');
            }}
            onSubmit={handleReviewProgress}
          />
        )}
      </div>
    </div>
  );
}

// 新增記錄模態框元件
function AddProgressModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    student_id: '',
    lesson_id: '',
    lesson_date: '',
    course_type: '',
    lesson_type: '正常課',
    progress_notes: '',
    next_goal: '',
    video_url: '',
  });
  const [students, setStudents] = useState<Array<{ id: string; full_name: string; student_oid: string | null }>>([]);
  const [lessons, setLessons] = useState<Array<{ id: string; lesson_date: string; actual_timeslot: string | null; lesson_duration: string | null }>>([]);
  const [courseTypes, setCourseTypes] = useState<Array<{ id: string; name: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showLessonDropdown, setShowLessonDropdown] = useState(false);
  const [showCourseTypeDropdown, setShowCourseTypeDropdown] = useState(false);
  const [showLessonTypeDropdown, setShowLessonTypeDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [lessonSearch, setLessonSearch] = useState('');
  const [manualLesson, setManualLesson] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');

  // 載入學生資料
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, student_oid')
          .order('full_name');
        
        if (error) {
          console.error('載入學生資料失敗:', error);
          return;
        }
        
        setStudents(data || []);
      } catch (error) {
        console.error('載入學生資料失敗:', error);
      }
    };

    fetchStudents();
  }, []);

  // 載入課程類型
  useEffect(() => {
    const fetchCourseTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('Hanami_CourseTypes')
          .select('id, name')
          .eq('status', true)
          .order('created_at', { ascending: true });
        if (error) {
          console.error('載入課程類型失敗:', error);
          return;
        }
        setCourseTypes(data || []);
      } catch (error) {
        console.error('載入課程類型失敗:', error);
      }
    };
    fetchCourseTypes();
  }, []); // 載入課堂資料
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const { data, error } = await supabase
          .from('hanami_student_lesson')
          .select('id, lesson_date, actual_timeslot, lesson_duration')
          .order('lesson_date', { ascending: false })
          .limit(50); // 限制載入最近50筆課堂
        
        if (error) {
          console.error('載入課堂資料失敗:', error);
          return;
        }
        
        setLessons(data || []);
      } catch (error) {
        console.error('載入課堂資料失敗:', error);
      }
    };

    fetchLessons();
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = { ...formData };
      if (manualLesson) {
        submitData.lesson_id = '';
        submitData.lesson_date = manualDate ? `${manualDate}${manualTime ? `T${manualTime}` : ''}` : '';
      }
      if (!submitData.course_type || !submitData.lesson_type) {
        alert('課程類型與課堂類型皆為必填');
        setLoading(false);
        return;
      }
      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.student_oid?.toLowerCase().includes(studentSearch.toLowerCase()),
  );
  const filteredLessons = lessons.filter(lesson =>
    lesson.lesson_date.includes(lessonSearch) ||
    lesson.actual_timeslot?.includes(lessonSearch),
  );
  const selectedStudent = students.find(s => s.id === formData.student_id);
  const selectedLesson = lessons.find(l => l.id === formData.lesson_id);
  const selectedCourseType = courseTypes.find(t => t.name === formData.course_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col">
        {/* 標題欄 */}
        <div className="bg-[#FFF9F2] px-6 py-4 border-b border-[#EADBC8]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2B3A3B]">新增學生進度記錄</h2>
            <button
              className="text-[#A68A64] hover:text-[#8B7355] transition-colors"
              onClick={onClose}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </button>
          </div>
        </div>
        {/* 表單內容 - 可滾動 */}
        <div className="flex-1 overflow-y-auto">
          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            {/* 選擇學生 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">選擇學生</label>
              <div className="relative">
                <button
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="button"
                  onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                >
                  {selectedStudent ? (
                    <div>
                      <div className="font-medium text-[#2B3A3B]">{selectedStudent.full_name}</div>
                      <div className="text-sm text-[#A68A64]">{selectedStudent.student_oid}</div>
                    </div>
                  ) : (
                    <span className="text-[#A68A64]">請選擇學生</span>
                  )}
                </button>
                {showStudentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-[#EADBC8]">
                      <input
                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                        placeholder="搜尋學生..."
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, student_id: student.id });
                            setShowStudentDropdown(false);
                            setStudentSearch('');
                          }}
                        >
                          <div className="font-medium text-[#2B3A3B]">{student.full_name}</div>
                          <div className="text-sm text-[#A68A64]">{student.student_oid}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* 選擇課堂 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">選擇課堂</label>
              <div className="relative">
                <button
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="button"
                  onClick={() => setShowLessonDropdown(!showLessonDropdown)}
                >
                  {manualLesson ? (
                    <span className="text-[#A68A64]">手動輸入課堂日期</span>
                  ) : selectedLesson ? (
                    <div>
                      <div className="font-medium text-[#2B3A3B]">
                        {new Date(selectedLesson.lesson_date).toLocaleDateString('zh-TW')}
                      </div>
                      <div className="text-sm text-[#A68A64]">
                        {selectedLesson.actual_timeslot && `${selectedLesson.actual_timeslot}`}
                        {selectedLesson.lesson_duration && ` (${selectedLesson.lesson_duration}分鐘)`}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#A68A64]">請選擇課堂</span>
                  )}
                </button>
                {showLessonDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-[#EADBC8]">
                      <input
                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                        placeholder="搜尋課堂日期..."
                        type="text"
                        value={lessonSearch}
                        onChange={(e) => setLessonSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredLessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, lesson_id: lesson.id, lesson_date: lesson.lesson_date });
                            setManualLesson(false);
                            setShowLessonDropdown(false);
                            setLessonSearch('');
                          }}
                        >
                          <div className="font-medium text-[#2B3A3B]">
                            {new Date(lesson.lesson_date).toLocaleDateString('zh-TW')}
                          </div>
                          <div className="text-sm text-[#A68A64]">
                            {lesson.actual_timeslot && `${lesson.actual_timeslot}`}
                            {lesson.lesson_duration && ` (${lesson.lesson_duration}分鐘)`}
                          </div>
                        </button>
                      ))}
                      <button
                        className="w-full px-4 py-3 text-left bg-[#FFF9F2] hover:bg-[#FDE6B8] border-t border-[#EADBC8] font-medium text-[#A64B2A]"
                        type="button"
                        onClick={() => {
                          setManualLesson(true);
                          setFormData({ ...formData, lesson_id: '', lesson_date: '' });
                          setShowLessonDropdown(false);
                        }}
                      >
                        手動輸入課堂日期
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {manualLesson && (
                <div className="flex gap-2 mt-2">
                  <input
                    className="flex-1 px-3 py-2 border border-[#EADBC8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                    type="date"
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                  />
                  <input
                    className="flex-1 px-3 py-2 border border-[#EADBC8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                    type="time"
                    value={manualTime}
                    onChange={e => setManualTime(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* 課程類型 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">課程類型</label>
              <div className="relative">
                <button
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="button"
                  onClick={() => setShowCourseTypeDropdown(!showCourseTypeDropdown)}
                >
                  {formData.course_type ? (
                    <span className="font-medium text-[#2B3A3B]">{formData.course_type}</span>
                  ) : (
                    <span className="text-[#A68A64]">請選擇課程類型</span>
                  )}
                </button>
                {showCourseTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="max-h-48 overflow-y-auto">
                      {courseTypes.map((type) => (
                        <button
                          key={type.id}
                          className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, course_type: type.name || '' });
                            setShowCourseTypeDropdown(false);
                          }}
                        >
                          <span className="font-medium text-[#2B3A3B]">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 課堂類型 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">課堂類型</label>
              <div className="relative">
                <button
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="button"
                  onClick={() => setShowLessonTypeDropdown(!showLessonTypeDropdown)}
                >
                  {formData.lesson_type ? (
                    <span className="font-medium text-[#2B3A3B]">{formData.lesson_type}</span>
                  ) : (
                    <span className="text-[#A68A64]">請選擇課堂類型</span>
                  )}
                </button>
                {showLessonTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="max-h-48 overflow-y-auto">
                      {(['正常課', '比賽課', '評估課', '補課', '考試課', '拍片課'] as Exclude<StudentProgress['lesson_type'], null>[]).map((type) => (
                        <button
                          key={type}
                          className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, lesson_type: type });
                            setShowLessonTypeDropdown(false);
                          }}
                        >
                          <span className="font-medium text-[#2B3A3B]">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 進度筆記 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">進度筆記</label>
              <textarea
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A] resize-none"
                placeholder="請描述學生的學習進度和表現..."
                rows={4}
                value={formData.progress_notes}
                onChange={e => setFormData({ ...formData, progress_notes: e.target.value })}
              />
            </div>
            {/* 下一個目標 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">下一個目標</label>
              <input
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                placeholder="請設定下一個學習目標..."
                type="text"
                value={formData.next_goal}
                onChange={e => setFormData({ ...formData, next_goal: e.target.value })}
              />
            </div>
            {/* 影片連結 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">影片連結（選填）</label>
              <input
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                placeholder="https://..."
                type="url"
                value={formData.video_url}
                onChange={e => setFormData({ ...formData, video_url: e.target.value })}
              />
            </div>
            {/* 按鈕區域 */}
            <div className="flex gap-3 pt-4">
              <button
                className="flex-1 px-4 py-3 text-[#A68A64] border border-[#EADBC8] rounded-lg hover:bg-[#FFF9F2] transition-colors"
                type="button"
                onClick={onClose}
              >
                取消
              </button>
              <button
                className="flex-1 px-4 py-3 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !formData.student_id || !formData.course_type || !formData.lesson_type || (!formData.lesson_id && !manualLesson) || (manualLesson && !manualDate)}
                type="submit"
              >
                {loading ? '新增中...' : '新增記錄'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 審核模態框元件
function ReviewProgressModal({ 
  record, 
  onClose, 
  onSubmit, 
  reviewNotes, 
  setReviewNotes, 
  reviewStatus, 
  setReviewStatus, 
}: { 
  record: StudentProgress
  onClose: () => void
  onSubmit: () => void
  reviewNotes: string
  setReviewNotes: (notes: string) => void
  reviewStatus: 'approved' | 'rejected'
  setReviewStatus: (status: 'approved' | 'rejected') => void
}) {
  // 重新宣告，確保作用域可用
  function getCourseAndLessonTypeLabel(courseType: string | null, lessonType: string | null) {
    const course = courseType || '未分類';
    const lesson = lessonType || '未分類';
    return `${course}（${lesson}）`;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">審核進度記錄</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">學生</label>
            <div className="text-sm text-gray-900">{record.student?.full_name || '未知學生'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">課程類型</label>
            <div className="text-sm text-gray-900">{getCourseAndLessonTypeLabel(record.course_type, record.lesson_type)}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">進度筆記</label>
            <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{record.progress_notes || '無'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">審核結果</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as 'approved' | 'rejected')}
            >
              <option value="approved">通過</option>
              <option value="rejected">拒絕</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">審核備註</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="請輸入審核備註..."
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              type="button"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className="px-4 py-2 bg-[#A64B2A] text-white rounded-md hover:bg-[#8B3A1F]"
              onClick={onSubmit}
            >
              確認審核
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 編輯記錄模態框元件
function EditProgressModal({ 
  record, 
  onClose, 
  onSubmit, 
}: { 
  record: StudentProgress
  onClose: () => void
  onSubmit: (data: any) => void
}) {
  const [formData, setFormData] = useState<{
    student_id: string;
    lesson_id: string;
    lesson_date: string;
    course_type: string;
    lesson_type: StudentProgress['lesson_type'];
    progress_notes: string;
    next_goal: string;
    video_url: string;
  }>({
    student_id: record.student_id || '',
    lesson_id: record.lesson_id || '',
    lesson_date: record.lesson_date ? record.lesson_date.split('T')[0] : '',
    course_type: record.course_type || '',
    lesson_type: record.lesson_type || '正常課',
    progress_notes: record.progress_notes || '',
    next_goal: record.next_goal || '',
    video_url: record.video_url || '',
  });
  const [students, setStudents] = useState<Array<{ id: string; full_name: string; student_oid: string | null }>>([]);
  const [lessons, setLessons] = useState<Array<{ id: string; lesson_date: string; actual_timeslot: string | null; lesson_duration: string | null }>>([]);
  const [courseTypes, setCourseTypes] = useState<Array<{ id: string; name: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showLessonDropdown, setShowLessonDropdown] = useState(false);
  const [showCourseTypeDropdown, setShowCourseTypeDropdown] = useState(false);
  const [showLessonTypeDropdown, setShowLessonTypeDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [lessonSearch, setLessonSearch] = useState('');
  const [manualLesson, setManualLesson] = useState(!record.lesson_id);
  const [manualDate, setManualDate] = useState(record.lesson_date ? record.lesson_date.split('T')[0] : '');
  const [manualTime, setManualTime] = useState(record.lesson_date && record.lesson_date.includes('T') ? record.lesson_date.split('T')[1] : '');

  // 載入學生資料
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, student_oid')
          .order('full_name');
        
        if (error) {
          console.error('載入學生資料失敗:', error);
          return;
        }
        
        setStudents(data || []);
      } catch (error) {
        console.error('載入學生資料失敗:', error);
      }
    };

    fetchStudents();
  }, []);

  // 載入課程類型
  useEffect(() => {
    const fetchCourseTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('Hanami_CourseTypes')
          .select('id, name')
          .eq('status', true)
          .order('created_at', { ascending: true });
        if (error) {
          console.error('載入課程類型失敗:', error);
          return;
        }
        setCourseTypes(data || []);
      } catch (error) {
        console.error('載入課程類型失敗:', error);
      }
    };
    fetchCourseTypes();
  }, []);

  // 載入課堂資料
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const { data, error } = await supabase
          .from('hanami_student_lesson')
          .select('id, lesson_date, actual_timeslot, lesson_duration')
          .order('lesson_date', { ascending: false })
          .limit(50); // 限制載入最近50筆課堂
        
        if (error) {
          console.error('載入課堂資料失敗:', error);
          return;
        }
        
        setLessons(data || []);
      } catch (error) {
        console.error('載入課堂資料失敗:', error);
      }
    };

    fetchLessons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = { ...formData };
      if (manualLesson) {
        submitData.lesson_id = '';
        submitData.lesson_date = manualDate ? `${manualDate}${manualTime ? `T${manualTime}` : ''}` : '';
      }
      if (!submitData.course_type || !submitData.lesson_type) {
        alert('課程類型與課堂類型皆為必填');
        setLoading(false);
        return;
      }
      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.student_oid?.toLowerCase().includes(studentSearch.toLowerCase()),
  );
  const filteredLessons = lessons.filter(lesson =>
    lesson.lesson_date.includes(lessonSearch) ||
    lesson.actual_timeslot?.includes(lessonSearch),
  );
  const selectedStudent = students.find(s => s.id === formData.student_id);
  const selectedLesson = lessons.find(l => l.id === formData.lesson_id);
  const selectedCourseType = courseTypes.find(t => t.name === formData.course_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col">
        {/* 標題欄 */}
        <div className="bg-[#FFF9F2] px-6 py-4 border-b border-[#EADBC8]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2B3A3B]">編輯學生進度記錄</h2>
            <button
              className="text-[#A68A64] hover:text-[#8B7355] transition-colors"
              onClick={onClose}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </button>
          </div>
        </div>
        {/* 表單內容 - 可滾動 */}
        <div className="flex-1 overflow-y-auto">
          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            {/* 選擇學生 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">選擇學生</label>
              <div className="relative">
                <button
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="button"
                  onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                >
                  {selectedStudent ? (
                    <div>
                      <div className="font-medium text-[#2B3A3B]">{selectedStudent.full_name}</div>
                      <div className="text-sm text-[#A68A64]">{selectedStudent.student_oid}</div>
                    </div>
                  ) : (
                    <span className="text-[#A68A64]">請選擇學生</span>
                  )}
                </button>
                {showStudentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-[#EADBC8]">
                      <input
                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                        placeholder="搜尋學生..."
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, student_id: student.id });
                            setShowStudentDropdown(false);
                            setStudentSearch('');
                          }}
                        >
                          <div className="font-medium text-[#2B3A3B]">{student.full_name}</div>
                          <div className="text-sm text-[#A68A64]">{student.student_oid}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 選擇課堂 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">選擇課堂</label>
              <div className="relative">
                <button
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="button"
                  onClick={() => setShowLessonDropdown(!showLessonDropdown)}
                >
                  {manualLesson ? (
                    <span className="text-[#A68A64]">手動輸入課堂日期</span>
                  ) : selectedLesson ? (
                    <div>
                      <div className="font-medium text-[#2B3A3B]">
                        {new Date(selectedLesson.lesson_date).toLocaleDateString('zh-HK')}
                      </div>
                      <div className="text-sm text-[#A68A64]">
                        {selectedLesson.actual_timeslot || '未設定時間'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#A68A64]">請選擇課堂</span>
                  )}
                </button>
                {showLessonDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-[#EADBC8]">
                      <input
                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                        placeholder="搜尋課堂..."
                        type="text"
                        value={lessonSearch}
                        onChange={(e) => setLessonSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredLessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, lesson_id: lesson.id, lesson_date: lesson.lesson_date });
                            setShowLessonDropdown(false);
                            setLessonSearch('');
                          }}
                        >
                          <div className="font-medium text-[#2B3A3B]">
                            {new Date(lesson.lesson_date).toLocaleDateString('zh-HK')}
                          </div>
                          <div className="text-sm text-[#A68A64]">
                            {lesson.actual_timeslot || '未設定時間'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-2">
                  <label className="flex items-center">
                    <input
                      checked={manualLesson}
                      className="mr-2"
                      type="checkbox"
                      onChange={(e) => setManualLesson(e.target.checked)}
                    />
                    <span className="text-sm text-[#2B3A3B]">手動輸入課堂日期</span>
                  </label>
                </div>
                {manualLesson && (
                  <div className="flex gap-2 mt-2">
                    <input
                      className="flex-1 px-3 py-2 border border-[#EADBC8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                      type="date"
                      value={manualDate}
                      onChange={e => setManualDate(e.target.value)}
                    />
                    <input
                      className="flex-1 px-3 py-2 border border-[#EADBC8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                      type="time"
                      value={manualTime}
                      onChange={e => setManualTime(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 課程類型 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">課程類型</label>
              <div className="relative">
                <button
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="button"
                  onClick={() => setShowCourseTypeDropdown(!showCourseTypeDropdown)}
                >
                  {formData.course_type ? (
                    <span className="font-medium text-[#2B3A3B]">{formData.course_type}</span>
                  ) : (
                    <span className="text-[#A68A64]">請選擇課程類型</span>
                  )}
                </button>
                {showCourseTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="max-h-48 overflow-y-auto">
                      {courseTypes.map((type) => (
                        <button
                          key={type.id}
                          className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, course_type: type.name || '' });
                            setShowCourseTypeDropdown(false);
                          }}
                        >
                          <span className="font-medium text-[#2B3A3B]">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 課堂類型 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">課堂類型</label>
              <div className="relative">
                <button
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="button"
                  onClick={() => setShowLessonTypeDropdown(!showLessonTypeDropdown)}
                >
                  {formData.lesson_type ? (
                    <span className="font-medium text-[#2B3A3B]">{formData.lesson_type}</span>
                  ) : (
                    <span className="text-[#A68A64]">請選擇課堂類型</span>
                  )}
                </button>
                {showLessonTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="max-h-48 overflow-y-auto">
                      {(['正常課', '比賽課', '評估課', '補課', '考試課', '拍片課'] as Exclude<StudentProgress['lesson_type'], null>[]).map((type) => (
                        <button
                          key={type}
                          className="w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0"
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, lesson_type: type });
                            setShowLessonTypeDropdown(false);
                          }}
                        >
                          <span className="font-medium text-[#2B3A3B]">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 進度筆記 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">進度筆記</label>
              <textarea
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A] resize-none"
                placeholder="請描述學生的學習進度和表現..."
                rows={4}
                value={formData.progress_notes}
                onChange={e => setFormData({ ...formData, progress_notes: e.target.value })}
              />
            </div>

            {/* 下一個目標 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">下一個目標</label>
              <input
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                placeholder="請設定下一個學習目標..."
                type="text"
                value={formData.next_goal}
                onChange={e => setFormData({ ...formData, next_goal: e.target.value })}
              />
            </div>

            {/* 影片連結 */}
            <div>
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">影片連結（選填）</label>
              <input
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                placeholder="https://..."
                type="url"
                value={formData.video_url}
                onChange={e => setFormData({ ...formData, video_url: e.target.value })}
              />
            </div>

            {/* 按鈕區域 */}
            <div className="flex gap-3 pt-4">
              <button
                className="flex-1 px-4 py-3 text-[#A68A64] border border-[#EADBC8] rounded-lg hover:bg-[#FFF9F2] transition-colors"
                type="button"
                onClick={onClose}
              >
                取消
              </button>
              <button
                className="flex-1 px-4 py-3 bg-[#A64B2A] text-white rounded-lg hover:bg-[#8B3A1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !formData.student_id || !formData.course_type || !formData.lesson_type || (!formData.lesson_id && !manualLesson) || (manualLesson && !manualDate)}
                type="submit"
              >
                {loading ? '新增中...' : '新增記錄'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 輔助函數
function getLessonTypeLabel(type: string | null) {
  const lessonTypeOptions = [
    { label: '鋼琴', value: '正常課' },
    { label: '音樂專注力', value: '比賽課' },
    { label: '樂理', value: '評估課' },
    { label: '練習', value: '補課' },
  ];
  const option = lessonTypeOptions.find(opt => opt.value === type);
  return option ? option.label : type || '未分類';
} 
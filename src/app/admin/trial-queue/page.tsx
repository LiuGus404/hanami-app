'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { PopupSelect } from '@/components/ui/PopupSelect'; // 新增引入 PopupSelect
import { supabase } from '@/lib/supabase';

// 欄目設計參考 LessonAvailabilityDashboard
const columns = [
  { label: '姓名', key: 'full_name' },
  { label: '出生日期', key: 'student_dob' },
  { label: '年齡', key: 'student_age' },
  { label: '聯絡電話', key: 'phone_no' },
  { label: '偏好時段', key: 'prefer_time' },
  { label: '備註', key: 'notes' },
  { label: '登記時間', key: 'created_at' },
];

// 狀態選項
const statusOptions = [
  { value: '舊學生', label: '舊學生' },
  { value: '未試堂', label: '未試堂' },
  { value: '已試堂', label: '已試堂' },
];

function formatAge(months: number | null | undefined): string {
  if (!months || isNaN(months)) return '';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0 && m === 0) return '';
  if (y === 0) return `${m}月`;
  if (m === 0) return `${y}歲`;
  return `${y}歲${m}月`;
}

export default function TrialQueueListPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [showWeekFilter, setShowWeekFilter] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [showCourseFilter, setShowCourseFilter] = useState(false);
  const [courseTypes, setCourseTypes] = useState<string[]>([]);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [customStatus, setCustomStatus] = useState('');

  const [showPageSizePopup, setShowPageSizePopup] = useState(false);
  const [tempPageSize, setTempPageSize] = useState(pageSize === Infinity ? 'all' : pageSize.toString());

  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  // 載入課程類型
  useEffect(() => {
    const loadCourseTypes = async () => {
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .select('name')
        .eq('status', true)
        .order('name');
      if (!error && data) {
        setCourseTypes(data.map((c: any) => c.name).filter(Boolean));
      }
    };
    loadCourseTypes();
  }, []);

  // 星期選項
  const weekOptions = [
    { value: 0, label: '星期日' },
    { value: 1, label: '星期一' },
    { value: 2, label: '星期二' },
    { value: 3, label: '星期三' },
    { value: 4, label: '星期四' },
    { value: 5, label: '星期五' },
    { value: 6, label: '星期六' },
    { value: -1, label: '未分類' }, // 未分類選項
  ];

  // 狀態選項自動彙整（含自定義）
  const allStatusOptions = Array.from(
    new Set([
      ...queue.map(stu => stu.status).filter(Boolean),
      ...statusOptions.map(opt => opt.value),
    ]),
  );
  if (!allStatusOptions.includes('未分類')) allStatusOptions.push('未分類');

  // 更新狀態
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('hanami_trial_queue')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) {
        alert(`更新狀態失敗：${error.message}`);
        return;
      }
      
      // 更新本地狀態
      setQueue(prev => prev.map(student => 
        student.id === id ? { ...student, status: newStatus } : student,
      ));
      
      setEditingStatus(null);
      setCustomStatus('');
    } catch (err) {
      console.error('更新狀態錯誤:', err);
      alert('更新狀態時發生錯誤');
    }
  };

  // 開始編輯狀態
  const startEditStatus = (id: string, currentStatus: string) => {
    setEditingStatus(id);
    setCustomStatus(currentStatus || '');
  };

  // 取消編輯狀態
  const cancelEditStatus = () => {
    setEditingStatus(null);
    setCustomStatus('');
  };

  // 切換課程選擇
  const toggleCourse = (course: string) => {
    setSelectedCourses(prev => 
      prev.includes(course) 
        ? prev.filter(c => c !== course)
        : [...prev, course],
    );
    setCurrentPage(1);
  };

  // 清除所有課程篩選
  const clearCourseFilter = () => {
    setSelectedCourses([]);
    setCurrentPage(1);
  };

  // 切換星期選擇
  const toggleWeek = (week: number) => {
    setSelectedWeeks(prev => 
      prev.includes(week) 
        ? prev.filter(w => w !== week)
        : [...prev, week],
    );
    setCurrentPage(1);
  };

  // 清除所有星期篩選
  const clearWeekFilter = () => {
    setSelectedWeeks([]);
    setCurrentPage(1);
  };

  // 切換狀態選擇
  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status],
    );
    setCurrentPage(1);
  };
  // 清除狀態篩選
  const clearStatusFilter = () => {
    setSelectedStatus([]);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedQueue = [...queue].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    if (sortField === 'created_at' || sortField === 'student_dob') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (sortField === 'student_age') {
      // 處理年齡排序：將年月格式轉換為月齡進行比較
      const getAgeInMonths = (age: any) => {
        if (!age) return 0;
        if (typeof age === 'number') return age; // 如果已經是月齡，直接使用
        if (typeof age === 'string') {
          const match = age.match(/(\d+)Y(\d+)M/);
          if (match) {
            const years = parseInt(match[1]);
            const months = parseInt(match[2]);
            return years * 12 + months;
          }
          // 如果只有月數
          const monthMatch = age.match(/(\d+)M/);
          if (monthMatch) {
            return parseInt(monthMatch[1]);
          }
          // 如果只有年數
          const yearMatch = age.match(/(\d+)Y/);
          if (yearMatch) {
            return parseInt(yearMatch[1]) * 12;
          }
        }
        return 0;
      };
      aValue = getAgeInMonths(aValue);
      bValue = getAgeInMonths(bValue);
    }
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // 星期篩選
  const weekFilteredQueue = selectedWeeks.length === 0 
    ? sortedQueue 
    : sortedQueue.filter(student => {
      // 檢查是否選擇了未分類
      if (selectedWeeks.includes(-1)) {
        // 如果選擇了未分類，檢查學生是否有 prefer_time 或 prefer_time.week 為空
        if (!student.prefer_time) return true;
          
        let prefer = student.prefer_time;
        if (typeof prefer === 'string') {
          try {
            prefer = JSON.parse(prefer);
          } catch (e) {
            return true; // JSON 解析失敗也算未分類
          }
        }
          
        if (typeof prefer === 'object' && prefer !== null) {
          if (!prefer.week || !Array.isArray(prefer.week) || prefer.week.length === 0) {
            return true; // 沒有 week 陣列或陣列為空算未分類
          }
        }
      }
        
      // 檢查是否有選擇其他星期
      const otherWeeks = selectedWeeks.filter(w => w !== -1);
      if (otherWeeks.length === 0) {
        return selectedWeeks.includes(-1); // 只選擇了未分類
      }
        
      if (!student.prefer_time) return false;
        
      let prefer = student.prefer_time;
      if (typeof prefer === 'string') {
        try {
          prefer = JSON.parse(prefer);
        } catch (e) {
          return false;
        }
      }
        
      if (typeof prefer === 'object' && prefer !== null && Array.isArray(prefer.week)) {
        return prefer.week.some((week: any) => otherWeeks.includes(week));
      }
        
      return false;
    });

  // 課程篩選
  const courseFilteredQueue = selectedCourses.length === 0
    ? weekFilteredQueue
    : weekFilteredQueue.filter(student => {
      // 檢查是否選擇了未分類
      if (selectedCourses.includes('未分類')) {
        // 如果選擇了未分類，檢查學生是否有 course_types 或 course_types 為空
        if (!student.course_types) return true;
          
        let courses = student.course_types;
        if (typeof courses === 'string') {
          try {
            courses = JSON.parse(courses);
          } catch (e) {
            return true; // JSON 解析失敗也算未分類
          }
        }
          
        if (Array.isArray(courses)) {
          if (courses.length === 0) {
            return true; // 陣列為空算未分類
          }
        } else {
          return true; // 不是陣列也算未分類
        }
      }
        
      // 檢查是否有選擇其他課程
      const otherCourses = selectedCourses.filter(c => c !== '未分類');
      if (otherCourses.length === 0) {
        return selectedCourses.includes('未分類'); // 只選擇了未分類
      }
        
      if (!student.course_types) return false;
        
      let courses = student.course_types;
      if (typeof courses === 'string') {
        try {
          courses = JSON.parse(courses);
        } catch (e) {
          return false;
        }
      }
        
      if (Array.isArray(courses)) {
        return courses.some(course => otherCourses.includes(course));
      }
        
      return false;
    });

  // 狀態篩選
  const statusFilteredQueue = selectedStatus.length === 0
    ? courseFilteredQueue
    : courseFilteredQueue.filter(student => {
      if (selectedStatus.includes('未分類')) {
        if (!student.status || student.status === '') return true;
      }
      const otherStatus = selectedStatus.filter(s => s !== '未分類');
      if (otherStatus.length === 0) return selectedStatus.includes('未分類');
      return otherStatus.includes(student.status);
    });

  const filteredQueue = statusFilteredQueue;

  const total = filteredQueue.length;
  const totalPages = pageSize === Infinity ? 1 : Math.ceil(total / pageSize);
  const pagedQueue =
    pageSize === Infinity
      ? filteredQueue
      : filteredQueue.slice((currentPage - 1) * pageSize, currentPage * pageSize);
      
  console.log('🔍 過濾後筆數:', filteredQueue.length);
  console.log('🔍 分頁後筆數:', pagedQueue.length);
  console.log('🔍 目前頁數:', currentPage, '每頁筆數:', pageSize);

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      setError(null);
      const { data: allData, error: allError } = await supabase
        .from('hanami_trial_queue')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('🔍 查詢到的總資料筆數:', allData?.length || 0);
      
      if (allError) {
        setError(allError.message);
        setLoading(false);
        return;
      }
      
      setQueue(allData || []);
      setLoading(false);
    };
    fetchQueue();
  }, []);

  // 刪除輪候學生
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`確定要刪除輪候學生「${name}」嗎？此操作無法復原。`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('hanami_trial_queue')
        .delete()
        .eq('id', id);
      
      if (error) {
        alert(`刪除失敗：${error.message}`);
        return;
      }
      
      alert('刪除成功！');
      // 重新載入資料
      const { data: allData, error: allError } = await supabase
        .from('hanami_trial_queue')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allError) {
        setError(allError.message);
        return;
      }
      
      setQueue(allData || []);
    } catch (err) {
      console.error('刪除錯誤:', err);
      alert('刪除時發生錯誤');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold text-[#4B4036]">輪候中學生列表</h2>
          <Image alt="icon" height={32} src="/rabbit.png" width={32} />
          <a
            className="ml-4 px-4 py-2 rounded-full bg-[#FFD59A] text-[#4B4036] font-semibold shadow hover:bg-[#FFB84C] transition-colors text-sm md:text-base"
            href="/admin/add-trial-students"
          >
            新增輪候學生
          </a>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <input
            className="w-full sm:w-64 border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]"
            placeholder="搜尋學生姓名"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="flex items-center gap-2">
            {/* 星期篩選按鈕 */}
            <div className="relative">
              <button
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  selectedWeeks.length > 0
                    ? 'bg-[#FDE6B8] text-[#4B4036] border-[#EADBC8]'
                    : 'bg-white text-[#4B4036] border-[#EADBC8] hover:bg-[#FFF9F2]'
                }`}
                onClick={() => setShowWeekFilter(!showWeekFilter)}
              >
                星期篩選 {selectedWeeks.length > 0 && `(${selectedWeeks.length})`}
              </button>
              
              {showWeekFilter && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 min-w-[200px]">
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-[#4B4036]">選擇星期</span>
                      {selectedWeeks.length > 0 && (
                        <button
                          className="text-xs text-[#87704e] hover:text-[#4B4036]"
                          onClick={clearWeekFilter}
                        >
                          清除
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {weekOptions.map(week => (
                        <label key={week.value} className="flex items-center cursor-pointer">
                          <input
                            checked={selectedWeeks.includes(week.value)}
                            className="mr-2"
                            type="checkbox"
                            onChange={() => toggleWeek(week.value)}
                          />
                          <span className="text-sm text-[#4B4036]">{week.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 課程篩選按鈕 */}
            <div className="relative">
              <button
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  selectedCourses.length > 0
                    ? 'bg-[#FDE6B8] text-[#4B4036] border-[#EADBC8]'
                    : 'bg-white text-[#4B4036] border-[#EADBC8] hover:bg-[#FFF9F2]'
                }`}
                onClick={() => setShowCourseFilter(!showCourseFilter)}
              >
                課程篩選 {selectedCourses.length > 0 && `(${selectedCourses.length})`}
              </button>
              
              {showCourseFilter && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 min-w-[200px]">
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-[#4B4036]">選擇課程</span>
                      {selectedCourses.length > 0 && (
                        <button
                          className="text-xs text-[#87704e] hover:text-[#4B4036]"
                          onClick={clearCourseFilter}
                        >
                          清除
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {courseTypes.map(course => (
                        <label key={course} className="flex items-center cursor-pointer">
                          <input
                            checked={selectedCourses.includes(course)}
                            className="mr-2"
                            type="checkbox"
                            onChange={() => toggleCourse(course)}
                          />
                          <span className="text-sm text-[#4B4036]">{course}</span>
                        </label>
                      ))}
                      <label className="flex items-center cursor-pointer">
                        <input
                          checked={selectedCourses.includes('未分類')}
                          className="mr-2"
                          type="checkbox"
                          onChange={() => toggleCourse('未分類')}
                        />
                        <span className="text-sm text-[#4B4036]">未分類</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* 狀態篩選按鈕 */}
            <div className="relative">
              <button
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  selectedStatus.length > 0
                    ? 'bg-[#FDE6B8] text-[#4B4036] border-[#EADBC8]'
                    : 'bg-white text-[#4B4036] border-[#EADBC8] hover:bg-[#FFF9F2]'
                }`}
                onClick={() => setShowStatusFilter(!showStatusFilter)}
              >
                狀態篩選 {selectedStatus.length > 0 && `(${selectedStatus.length})`}
              </button>
              {showStatusFilter && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 min-w-[200px]">
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-[#4B4036]">選擇狀態</span>
                      {selectedStatus.length > 0 && (
                        <button
                          className="text-xs text-[#87704e] hover:text-[#4B4036]"
                          onClick={clearStatusFilter}
                        >
                          清除
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {allStatusOptions.map(status => (
                        <label key={status} className="flex items-center cursor-pointer">
                          <input
                            checked={selectedStatus.includes(status)}
                            className="mr-2"
                            type="checkbox"
                            onChange={() => toggleStatus(status)}
                          />
                          <span className="text-sm text-[#4B4036]">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <span className="text-sm text-[#2B3A3B]">每頁顯示：</span>
              <button
                className="border border-[#EADBC8] rounded-full px-3 py-1 text-sm bg-white"
                onClick={() => setShowPageSizePopup(true)}
              >
                {pageSize === Infinity ? '全部' : pageSize}
              </button>
              {showPageSizePopup && (
                <PopupSelect
                  mode="single"
                  options={[
                    { label: '20', value: '20' },
                    { label: '50', value: '50' },
                    { label: '100', value: '100' },
                    { label: '全部', value: 'all' },
                  ]}
                  selected={tempPageSize}
                  title="每頁顯示"
                  onCancel={() => setShowPageSizePopup(false)}
                  onChange={(v: string | string[]) => setTempPageSize(Array.isArray(v) ? v[0] : v)}
                  onConfirm={() => {
                    setPageSize(tempPageSize === 'all' ? Infinity : Number(tempPageSize));
                    setCurrentPage(1);
                    setShowPageSizePopup(false);
                  }}
                />
              )}
              <span className="text-sm text-[#2B3A3B] ml-2">
                第 {currentPage} 頁，共 {totalPages} 頁
              </span>
              <button
                className={`px-2 py-1 rounded-full ml-1 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-[#2B3A3B] hover:bg-[#FFF9F2]'}`}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                &lt;
              </button>
              <button
                className={`px-2 py-1 rounded-full ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-[#2B3A3B] hover:bg-[#FFF9F2]'}`}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-[#4B4036] text-center py-10">載入中...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-10">⚠️ {error}</div>
        ) : (
          <div className="mt-6 overflow-x-auto w-full">
            <table className="min-w-[800px] w-full border-collapse bg-white rounded-lg shadow-md text-sm md:text-base">
              <thead>
                <tr className="bg-[#FFF9F2] border-b border-[#EADBC8]">
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">#</th>
                  <th 
                    className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition"
                    onClick={() => handleSort('full_name')}
                  >
                    姓名 {sortField === 'full_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition"
                    onClick={() => handleSort('student_dob')}
                  >
                    出生日期 {sortField === 'student_dob' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition"
                    onClick={() => handleSort('student_age')}
                  >
                    年齡 {sortField === 'student_age' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition"
                    onClick={() => handleSort('phone_no')}
                  >
                    聯絡電話 {sortField === 'phone_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">偏好時段</th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">課程</th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">備註</th>
                  <th 
                    className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition"
                    onClick={() => handleSort('status')}
                  >
                    狀態 {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="p-3 text-left text-sm font-medium text-[#2B3A3B] cursor-pointer hover:bg-[#FDE6B8] transition"
                    onClick={() => handleSort('created_at')}
                  >
                    登記時間 {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-[#2B3A3B]">操作</th>
                </tr>
              </thead>
              <tbody>
                {pagedQueue.length === 0 ? (
                  <tr>
                    <td className="text-center text-[#87704e] py-8" colSpan={10}>
                      暫無輪候學生
                    </td>
                  </tr>
                ) : (
                  pagedQueue.map((stu: any, idx: number) => (
                    <tr key={stu.id} className="border-b border-[#EADBC8] hover:bg-[#FFF9F2]">
                      <td className="p-3 text-sm text-[#2B3A3B]">{pageSize === Infinity ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{stu.full_name || ''}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{stu.student_dob ? new Date(stu.student_dob).toLocaleDateString('zh-HK') : ''}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{
                        (() => {
                          if (!stu.student_age) return '';
                          
                          // 如果是數字（月齡），轉換為年月格式
                          if (typeof stu.student_age === 'number') {
                            const years = Math.floor(stu.student_age / 12);
                            const months = stu.student_age % 12;
                            if (years === 0 && months === 0) return '';
                            if (years === 0) return `${months}M`;
                            if (months === 0) return `${years}Y`;
                            return `${years}Y${months}M`;
                          }
                          
                          // 如果已經是字串格式，直接顯示
                          return stu.student_age;
                        })()
                      }
                      </td>
                      <td className="p-3 text-sm text-[#2B3A3B]">
                        {stu.phone_no || ''}
                        {stu.phone_no && (
                          <a
                            className="ml-2 inline-block"
                            href={`https://wa.me/852${stu.phone_no.replace(/\s/g, '')}`}
                            rel="noopener noreferrer"
                            target="_blank"
                            title="開啟 WhatsApp 聊天"
                          >
                            <svg 
                              className="text-green-500 hover:text-green-600 transition-colors" 
                              fill="currentColor" 
                              height="16" 
                              viewBox="0 0 24 24"
                              width="16"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                            </svg>
                          </a>
                        )}
                      </td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{
                        (() => {
                          if (!stu.prefer_time) return '';
                          let prefer = stu.prefer_time;
                          if (typeof prefer === 'string') {
                            try {
                              const parsed = JSON.parse(prefer);
                              prefer = parsed;
                            } catch (e) {
                              return prefer;
                            }
                          }
                          if (typeof prefer === 'object' && prefer !== null) {
                            const weekMap = ['日', '一', '二', '三', '四', '五', '六'];
                            const week = Array.isArray(prefer.week) 
                              ? prefer.week.map((w: number) => weekMap[w] || w).join('、')
                              : '';
                            
                            let range = '';
                            if (Array.isArray(prefer.range) && prefer.range.length > 0) {
                              range = prefer.range.join('、');
                            } else if (prefer.range === null || prefer.range === undefined) {
                              range = '未指定時段';
                            } else {
                              range = prefer.range;
                            }
                            
                            return `星期：${week || '未指定'} | 時段：${range}`;
                          }
                          return '';
                        })()
                      }
                      </td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{
                        (() => {
                          if (!stu.course_types) return '';
                          
                          let courses = stu.course_types;
                          if (typeof courses === 'string') {
                            try {
                              courses = JSON.parse(courses);
                            } catch (e) {
                              return '';
                            }
                          }
                          
                          if (Array.isArray(courses)) {
                            return courses.join('、');
                          }
                          
                          return '';
                        })()
                      }
                      </td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{stu.notes || ''}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">
                        {editingStatus === stu.id ? (
                          <div className="flex flex-col gap-2 bg-[#FFF9F2] p-2 rounded-lg border border-[#EADBC8]">
                            <div className="text-xs text-[#87704e] mb-1">選擇預設狀態：</div>
                            <div className="flex flex-wrap gap-1">
                              {statusOptions.map(option => (
                                <button
                                  key={option.value}
                                  className="px-3 py-1 text-xs rounded-full bg-[#FFD59A] text-[#4B4036] hover:bg-[#FDE6B8] border border-[#EADBC8] transition-colors font-medium"
                                  onClick={() => handleStatusUpdate(stu.id, option.value)}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            <div className="text-xs text-[#87704e] mt-2 mb-1">或輸入自定義狀態：</div>
                            <div className="flex gap-1">
                              <input
                                className="flex-1 px-3 py-1 text-xs border border-[#EADBC8] rounded-full bg-white focus:outline-none focus:border-[#FFB84C] transition-colors"
                                placeholder="輸入自定義狀態"
                                type="text"
                                value={customStatus}
                                onChange={(e) => setCustomStatus(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleStatusUpdate(stu.id, customStatus)}
                              />
                              <button
                                className="px-3 py-1 text-xs rounded-full bg-[#FFB84C] text-white hover:bg-[#FFA726] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                                disabled={!customStatus.trim()}
                                onClick={() => handleStatusUpdate(stu.id, customStatus)}
                              >
                                確定
                              </button>
                              <button
                                className="px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 transition-colors font-medium"
                                onClick={cancelEditStatus}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-[#FDE6B8] px-2 py-1 rounded transition border border-dashed border-[#EADBC8] hover:border-[#FFB84C] group relative"
                            title="點擊編輯狀態"
                            onClick={() => startEditStatus(stu.id, stu.status || '')}
                          >
                            <span className="text-[#4B4036]">{stu.status || '未設定'}</span>
                            <svg 
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-[#87704e] opacity-0 group-hover:opacity-100 transition-opacity" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm text-[#2B3A3B]">{stu.created_at ? stu.created_at.replace('T', ' ').slice(0, 16) : ''}</td>
                      <td className="p-3 text-sm text-[#2B3A3B]">
                        <button
                          className="px-3 py-1 rounded bg-[#FFD59A] text-[#4B4036] font-semibold hover:bg-[#FDE6B8] border border-[#EADBC8] transition mr-2"
                          onClick={() => window.location.href = `/admin/add-trial-students?id=${stu.id}`}
                        >
                          編輯
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-200 text-red-700 font-semibold hover:bg-red-300 border border-red-300 transition"
                          onClick={() => handleDelete(stu.id, stu.full_name || '未命名')}
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-sm text-gray-600 mt-2">顯示學生數：{total}</div>
      </div>
    </div>
  );
} 
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BookOpen, CalendarClock, Star, LayoutGrid, List, ChevronLeft, ChevronRight, Settings2, Trash2, UserX, RotateCcw, Play, Target, FileText } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import BackButton from '@/components/ui/BackButton'

interface StudentProgress {
  id: string
  student_id: string | null
  lesson_id: string | null
  lesson_date: string | null
  lesson_type: 'piano' | 'music_focus' | 'theory' | 'practice' | null
  duration_minutes: number | null
  progress_notes: string | null
  next_goal: string | null
  video_url: string | null
  created_at: string
  updated_at: string | null
  // 關聯的學生資料
  student?: {
    full_name: string
    student_oid: string | null
    course_type: string | null
    student_type: string | null
  }
  // 關聯的課堂資料
  lesson?: {
    lesson_date: string
    actual_timeslot: string | null
    lesson_teacher: string | null
  }
}

export default function StudentProgressPage() {
  const [progressRecords, setProgressRecords] = useState<StudentProgress[]>([])
  const [filteredRecords, setFilteredRecords] = useState<StudentProgress[]>([])
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid')
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLessonType, setSelectedLessonType] = useState<string[]>([])
  const [lessonTypeDropdownOpen, setLessonTypeDropdownOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  })

  // 排序相關狀態
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const router = useRouter()
  const { user, loading: userLoading } = useUser()

  // 添加防抖機制
  const dataFetchedRef = useRef(false)
  const loadingRef = useRef(false)

  useEffect(() => {
    // 如果正在載入或沒有用戶，不執行
    if (userLoading || !user) return
    
    // 如果用戶沒有權限，重定向
    if (!['admin', 'manager'].includes(user.role)) {
      router.push('/')
      return
    }

    // 如果已經載入過數據，不重複載入
    if (dataFetchedRef.current) return
    
    // 防止重複載入
    if (loadingRef.current) return
    loadingRef.current = true

    const fetchProgressData = async () => {
      try {
        setIsLoading(true)
        
        // 獲取進度記錄，包含學生和課堂資料
        const { data: progressData, error: progressError } = await supabase
          .from('hanami_student_progress')
          .select(`
            *,
            student:Hanami_Students(
              full_name,
              student_oid,
              course_type,
              student_type
            ),
            lesson:hanami_student_lesson(
              lesson_date,
              actual_timeslot,
              lesson_teacher
            )
          `)
          .order('created_at', { ascending: false })

        if (progressError) {
          console.error('Error fetching progress data:', progressError)
          return
        }

        // 將 lesson_type 中文轉英文
        const lessonTypeMap: Record<string, StudentProgress['lesson_type']> = {
          '正常課': 'piano',
          '補課': 'practice',
          '評估課': 'theory',
          '考試課': 'theory',
          '比賽課': 'music_focus',
          '拍片課': 'music_focus',
        }
        const mappedData = (progressData || []).map((item: any) => ({
          ...item,
          lesson_type: item.lesson_type ? lessonTypeMap[item.lesson_type] ?? null : null,
        }))

        setProgressRecords(mappedData)
        dataFetchedRef.current = true
        loadingRef.current = false
      } catch (error) {
        console.error('Error in fetchProgressData:', error)
        loadingRef.current = false
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgressData()
  }, [user, userLoading, router])

  // 當用戶變化時重置防抖狀態
  useEffect(() => {
    if (user) {
      dataFetchedRef.current = false
      loadingRef.current = false
    }
  }, [user])

  // 篩選邏輯
  useEffect(() => {
    let filtered = [...progressRecords]

    // 姓名搜尋
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(record => 
        record.student?.full_name?.toLowerCase().includes(searchLower) ||
        record.student?.student_oid?.toLowerCase().includes(searchLower)
      )
    }

    // 課程類型篩選
    if (selectedLessonType.length > 0) {
      filtered = filtered.filter(record => 
        record.lesson_type && selectedLessonType.includes(record.lesson_type)
      )
    }

    // 日期範圍篩選
    if (dateRange.start) {
      filtered = filtered.filter(record => 
        record.lesson_date && record.lesson_date >= dateRange.start
      )
    }
    if (dateRange.end) {
      filtered = filtered.filter(record => 
        record.lesson_date && record.lesson_date <= dateRange.end
      )
    }

    setFilteredRecords(filtered)
    setCurrentPage(1) // 重置到第一頁
  }, [progressRecords, searchTerm, selectedLessonType, dateRange])

  // 排序功能
  const sortRecords = (records: StudentProgress[]) => {
    if (!sortField) return records

    return records.sort((a, b) => {
      let aValue: any = a[sortField as keyof StudentProgress]
      let bValue: any = b[sortField as keyof StudentProgress]

      // 處理特殊欄位的排序
      switch (sortField) {
        case 'duration_minutes':
          aValue = Number(aValue) || 0
          bValue = Number(bValue) || 0
          break
        case 'lesson_date':
        case 'created_at':
        case 'updated_at':
          aValue = aValue ? new Date(aValue).getTime() : 0
          bValue = bValue ? new Date(bValue).getTime() : 0
          break
        case 'student_name':
          aValue = a.student?.full_name || ''
          bValue = b.student?.full_name || ''
          break
        default:
          aValue = String(aValue || '').toLowerCase()
          bValue = String(bValue || '').toLowerCase()
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  // 排序功能
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

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
      )
    }
    return sortDirection === 'asc' ? 
      <svg className="w-5 h-5 text-orange-400 bg-orange-100 rounded-lg p-0.5 shadow-sm" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 3L3 10h14L10 3z" />
      </svg> : 
      <svg className="w-5 h-5 text-orange-400 bg-orange-100 rounded-lg p-0.5 shadow-sm" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 17L3 10h14L10 17z" />
      </svg>
  }

  const toggleRecord = (id: string) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    )
  }

  // 課程類型選項
  const lessonTypeOptions = [
    { label: '鋼琴', value: 'piano' },
    { label: '音樂專注力', value: 'music_focus' },
    { label: '樂理', value: 'theory' },
    { label: '練習', value: 'practice' },
  ]

  // 獲取課程類型顯示名稱
  const getLessonTypeLabel = (type: string | null) => {
    const option = lessonTypeOptions.find(opt => opt.value === type)
    return option ? option.label : type || '未分類'
  }

  // 計算總頁數
  const sortedRecords = sortRecords([...filteredRecords])
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(sortedRecords.length / pageSize))
  
  // 確保當前頁數不超過總頁數
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  // 刪除進度記錄
  const handleDeleteRecords = async () => {
    if (!selectedRecords.length) return
    
    if (!confirm(`確定要刪除選中的 ${selectedRecords.length} 筆進度記錄嗎？此操作無法復原。`)) {
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('hanami_student_progress')
        .delete()
        .in('id', selectedRecords)

      if (error) {
        console.error('Error deleting progress records:', error)
        alert('刪除失敗，請稍後再試')
        return
      }

      // 更新本地狀態
      setProgressRecords(prev => prev.filter(record => !selectedRecords.includes(record.id)))
      setSelectedRecords([])
      alert('刪除成功')
    } catch (error) {
      console.error('Error:', error)
      alert('刪除失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-6">
          <BackButton href="/admin" label="返回管理面板" />
          <h1 className="text-2xl font-bold text-[#2B3A3B] mb-2">學生進度管理</h1>
          <p className="text-[#87704e]">查看和管理所有學生的學習進度記錄</p>
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
                  onClick={() => setSelectedRecords([])}
                  className="text-xs text-[#A68A64] hover:text-[#8B7355] underline"
                >
                  取消選擇
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteRecords}
                  disabled={isLoading}
                  className="hanami-btn-danger flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                type="text"
                placeholder="搜尋學生姓名或編號..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg text-[#2B3A3B] placeholder-[#A68A64] focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              />
            </div>

            {/* 課程類型篩選 */}
            <div className="relative">
              <button
                onClick={() => setLessonTypeDropdownOpen(true)}
                className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B]"
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
                          type="checkbox"
                          checked={selectedLessonType.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLessonType([...selectedLessonType, option.value])
                            } else {
                              setSelectedLessonType(selectedLessonType.filter(type => type !== option.value))
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-[#2B3A3B]">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="border-t border-[#EADBC8] p-2 flex gap-2">
                    <button
                      onClick={() => setSelectedLessonType([])}
                      className="text-xs text-[#A68A64] hover:text-[#8B7355] underline"
                    >
                      清除
                    </button>
                    <button
                      onClick={() => setLessonTypeDropdownOpen(false)}
                      className="text-xs bg-[#A68A64] text-white px-2 py-1 rounded hover:bg-[#8B7355]"
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
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-[#EADBC8] rounded-lg text-sm text-[#2B3A3B]"
                placeholder="開始日期"
              />
              <span className="text-[#A68A64]">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-[#EADBC8] rounded-lg text-sm text-[#2B3A3B]"
                placeholder="結束日期"
              />
            </div>

            {/* 顯示模式切換 */}
            <button
              onClick={() => setDisplayMode(displayMode === 'grid' ? 'list' : 'grid')}
              className="hanami-btn-soft text-sm px-4 py-2 text-[#2B3A3B] flex items-center gap-2"
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
                onClick={() => {
                  setSearchTerm('')
                  setSelectedLessonType([])
                  setDateRange({ start: '', end: '' })
                }}
                className="hanami-btn-danger text-sm px-4 py-2 text-[#A64B2A]"
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
              value={pageSize === Infinity ? 'all' : pageSize.toString()}
              onChange={(e) => {
                setPageSize(e.target.value === 'all' ? Infinity : Number(e.target.value))
                setCurrentPage(1)
              }}
              className="border border-[#EADBC8] rounded px-2 py-1 text-sm"
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
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-full ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-[#2B3A3B] hover:bg-[#FFF9F2]'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-[#2B3A3B]">
                  第 {currentPage} 頁，共 {totalPages} 頁
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-full ${
                    currentPage === totalPages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-[#2B3A3B] hover:bg-[#FFF9F2]'
                  }`}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64] mx-auto"></div>
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
                    initial={false}
                    animate={{
                      scale: selectedRecords.includes(record.id) ? 1.03 : 1,
                      boxShadow: selectedRecords.includes(record.id)
                        ? '0 4px 20px rgba(252, 213, 139, 0.4)'
                        : 'none',
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="cursor-pointer relative"
                    onClick={() => toggleRecord(record.id)}
                  >
                    <div className="bg-white rounded-xl border border-[#EADBC8] p-4 shadow-sm hover:shadow-md transition-shadow">
                      {selectedRecords.includes(record.id) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-2 right-2"
                        >
                          <img src="/icons/leaf-sprout.png" alt="選取" className="w-8 h-8" />
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
                            {getLessonTypeLabel(record.lesson_type)}
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

                      <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                        <p className="text-xs text-[#A68A64]">
                          建立時間：{new Date(record.created_at).toLocaleString('zh-HK')}
                        </p>
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
                        type="checkbox"
                        checked={selectedRecords.length === sortedRecords.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecords(sortedRecords.map(r => r.id))
                          } else {
                            setSelectedRecords([])
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
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRecords([...selectedRecords, record.id])
                              } else {
                                setSelectedRecords(selectedRecords.filter(id => id !== record.id))
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
                          {getLessonTypeLabel(record.lesson_type)}
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
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
} 
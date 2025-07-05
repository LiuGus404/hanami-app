'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface ClassType {
  id: string
  name: string | null
  status: boolean | null
  created_at: string
}

interface ScheduleSlot {
  id: string
  teacher_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  created_at?: string
  updated_at?: string
}

export default function ClassManagementPanel() {
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 排序相關狀態
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // 新增班別狀態
  const [showAddClass, setShowAddClass] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  
  // 編輯班別狀態
  const [showEditClass, setShowEditClass] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassType | null>(null)
  const [editClassName, setEditClassName] = useState('')
  
  // 新增時段狀態
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [newSlot, setNewSlot] = useState({
    teacher_id: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    created_at: '',
    updated_at: ''
  })
  
  // 編輯時段狀態
  const [showEditSlot, setShowEditSlot] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null)
  const [editSlot, setEditSlot] = useState({
    teacher_id: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    created_at: '',
    updated_at: ''
  })
  
  // 批量操作狀態
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  useEffect(() => {
    fetchData()
  }, [])

  // 排序功能
  const handleSort = (field: string) => {
    if (sortField === field) {
      // 如果點擊的是同一個欄位，切換排序方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // 如果點擊的是新欄位，設置為升序
      setSortField(field)
      setSortDirection('asc')
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

  // 排序時段數據
  const sortScheduleSlots = (slots: ScheduleSlot[]) => {
    if (!sortField) {
      return slots
    }
    return [...slots].sort((a, b) => {
      let aValue = a[sortField as keyof ScheduleSlot]
      let bValue = b[sortField as keyof ScheduleSlot]
      // 僅針對現有欄位排序
      aValue = String(aValue || '').toLowerCase()
      bValue = String(bValue || '').toLowerCase()
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  // 獲取排序後的時段數據
  const sortedScheduleSlots = sortScheduleSlots(scheduleSlots)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 取得班別資料
      const { data: classData, error: classError } = await supabase
        .from('Hanami_CourseTypes')
        .select('*')
        .order('name')
      
      console.log('🔍 班別資料查詢結果:', { classData, classError })
      
      if (classError) throw classError
      
      // 取得時段資料
      const { data: slotData, error: slotError } = await supabase
        .from('hanami_teacher_schedule')
        .select('*')
        .order('weekday')
        .order('timeslot')
      
      console.log('🔍 時段資料查詢結果:', { slotData, slotError })
      
      if (slotError) throw slotError
      
      setClassTypes(classData || [])
      setScheduleSlots(slotData || [])
      
      console.log('✅ 資料載入完成:', {
        班別數量: classData?.length || 0,
        時段數量: slotData?.length || 0
      })
    } catch (err: any) {
      console.error('❌ 資料載入失敗:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      alert('請輸入班別名稱')
      return
    }
    
    try {
      const { error } = await supabase
        .from('Hanami_CourseTypes')
        .insert({
          name: newClassName.trim(),
          status: true
        })
      
      if (error) throw error
      
      setNewClassName('')
      setShowAddClass(false)
      await fetchData()
      alert('班別新增成功！')
    } catch (err: any) {
      alert('新增失敗：' + err.message)
    }
  }

  const handleAddSlot = async () => {
    if (!newSlot.teacher_id || !newSlot.scheduled_date || !newSlot.start_time || !newSlot.end_time) {
      alert('請完整填寫所有欄位')
      return
    }
    try {
      const { error } = await supabase
        .from('hanami_teacher_schedule')
        .insert({
          teacher_id: newSlot.teacher_id,
          scheduled_date: newSlot.scheduled_date,
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          created_at: new Date().toISOString()
        })
      if (error) throw error
      setNewSlot({
        teacher_id: '',
        scheduled_date: '',
        start_time: '',
        end_time: '',
        created_at: '',
        updated_at: ''
      })
      setShowAddSlot(false)
      await fetchData()
      alert('時段新增成功！')
    } catch (err: any) {
      alert('新增失敗：' + err.message)
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (!confirm('確定要刪除此班別嗎？')) return
    
    try {
      const { error } = await supabase
        .from('Hanami_CourseTypes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      await fetchData()
      alert('班別刪除成功！')
    } catch (err: any) {
      alert('刪除失敗：' + err.message)
    }
  }

  const handleEditClass = (classType: ClassType) => {
    setEditingClass(classType)
    setEditClassName(classType.name || '')
    setShowEditClass(true)
  }

  const handleUpdateClass = async () => {
    console.log('🔍 準備更新班別:', { editingClass, editClassName })
    
    if (!editingClass) {
      alert('編輯班別資料遺失，請重新選擇')
      return
    }
    
    if (!editClassName.trim()) {
      alert('請輸入班別名稱')
      return
    }
    
    try {
      const updateData = { name: editClassName.trim() }
      console.log('🔍 更新資料:', updateData)
      
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .update(updateData)
        .eq('id', editingClass.id)
        .select()
      
      console.log('🔍 更新結果:', { data, error })
      
      if (error) {
        console.error('❌ 更新失敗:', error)
        throw error
      }
      
      console.log('✅ 更新成功:', data)
      
      setEditClassName('')
      setEditingClass(null)
      setShowEditClass(false)
      await fetchData()
      alert('班別更新成功！')
    } catch (err: any) {
      console.error('❌ 更新時發生錯誤:', err)
      alert('更新失敗：' + (err.message || '未知錯誤'))
    }
  }

  const handleToggleClassStatus = async (classType: ClassType) => {
    try {
      const { error } = await supabase
        .from('Hanami_CourseTypes')
        .update({ status: !classType.status })
        .eq('id', classType.id)
      
      if (error) throw error
      
      await fetchData()
      alert(`班別已${!classType.status ? '啟用' : '停用'}！`)
    } catch (err: any) {
      alert('狀態更新失敗：' + err.message)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('確定要刪除此時段嗎？')) return
    
    try {
      const { error } = await supabase
        .from('hanami_teacher_schedule')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      await fetchData()
      alert('時段刪除成功！')
    } catch (err: any) {
      alert('刪除失敗：' + err.message)
    }
  }

  const handleEditSlot = (slot: ScheduleSlot) => {
    setEditingSlot(slot)
    setEditSlot({
      teacher_id: slot.teacher_id,
      scheduled_date: slot.scheduled_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      created_at: slot.created_at || '',
      updated_at: slot.updated_at || ''
    })
    setShowEditSlot(true)
  }

  const handleCloseEditClass = () => {
    setShowEditClass(false)
    setEditingClass(null)
    setEditClassName('')
  }

  const handleCloseEditSlot = () => {
    setShowEditSlot(false)
    setEditingSlot(null)
    setEditSlot({
      teacher_id: '',
      scheduled_date: '',
      start_time: '',
      end_time: '',
      created_at: '',
      updated_at: ''
    })
  }

  const handleUpdateSlot = async () => {
    if (!editingSlot) {
      alert('編輯時段資料遺失，請重新選擇')
      return
    }
    if (!editSlot.teacher_id || !editSlot.scheduled_date || !editSlot.start_time || !editSlot.end_time) {
      alert('請完整填寫所有欄位')
      return
    }
    try {
      const updateData = {
        teacher_id: editSlot.teacher_id,
        scheduled_date: editSlot.scheduled_date,
        start_time: editSlot.start_time,
        end_time: editSlot.end_time,
        updated_at: new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('hanami_teacher_schedule')
        .update(updateData)
        .eq('id', editingSlot.id)
      if (error) throw error
      setShowEditSlot(false)
      setEditingSlot(null)
      await fetchData()
      alert('時段更新成功！')
    } catch (err: any) {
      alert('更新失敗：' + err.message)
    }
  }

  const handleCopySlot = (slot: ScheduleSlot) => {
    setNewSlot({
      teacher_id: slot.teacher_id,
      scheduled_date: slot.scheduled_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      created_at: slot.created_at || '',
      updated_at: slot.updated_at || ''
    })
    setShowAddSlot(true)
  }

  const handleSelectSlot = (id: string) => {
    setSelectedSlots(prev => 
      prev.includes(id) 
        ? prev.filter(slotId => slotId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSlots([])
      setSelectAll(false)
    } else {
      setSelectedSlots(scheduleSlots.map(slot => slot.id))
      setSelectAll(true)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedSlots.length === 0) {
      alert('請選擇要刪除的時段')
      return
    }
    
    if (!confirm(`確定要刪除選中的 ${selectedSlots.length} 個時段嗎？`)) return
    
    try {
      const { error } = await supabase
        .from('hanami_teacher_schedule')
        .delete()
        .in('id', selectedSlots)
      
      if (error) throw error
      
      setSelectedSlots([])
      setSelectAll(false)
      await fetchData()
      alert('批量刪除成功！')
    } catch (err: any) {
      alert('批量刪除失敗：' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-[#4B4036]">載入中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        ⚠️ {error}
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* 班別管理 */}
      <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#4B4036] flex items-center gap-2">
            <Image src="/icons/book-elephant.PNG" alt="class" width={24} height={24} />
            班別管理
          </h3>
          <button
            onClick={() => setShowAddClass(true)}
            className="bg-[#4B4036] hover:bg-[#3A3329] text-white px-4 py-2 rounded-full text-sm transition-colors"
          >
            新增班別
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {classTypes.map((classType) => (
            <div key={classType.id} className="flex items-center justify-between p-3 bg-white border border-[#EADBC8] rounded-lg">
              <div>
                <div className="font-medium text-[#4B4036]">{classType.name}</div>
                <div className="text-xs text-[#87704e]">
                  {classType.status ? '啟用' : '停用'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleClassStatus(classType)}
                  className={`px-2 py-1 text-xs rounded ${
                    classType.status 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {classType.status ? '停用' : '啟用'}
                </button>
                <button
                  onClick={() => handleEditClass(classType)}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  編輯
                </button>
                <button
                  onClick={() => handleDeleteClass(classType.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 時段管理 */}
      <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#4B4036] flex items-center gap-2">
            <Image src="/icons/clock.PNG" alt="time" width={24} height={24} />
            時段管理
          </h3>
          <div className="flex items-center gap-2">
            {selectedSlots.length > 0 && (
              <button
                onClick={handleBatchDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                批量刪除 ({selectedSlots.length})
              </button>
            )}
            <button
              onClick={() => setShowAddSlot(true)}
              className="bg-[#4B4036] hover:bg-[#3A3329] text-white px-4 py-2 rounded-full text-sm transition-colors"
            >
              新增時段
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EADBC8]">
                <th className="text-left p-2">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-[#4B4036] accent-[#CBBFA4]"
                  />
                </th>
                <th className="text-left p-2">老師ID</th>
                <th className="text-left p-2">日期</th>
                <th className="text-left p-2">開始時間</th>
                <th className="text-left p-2">結束時間</th>
                <th className="text-left p-2">建立時間</th>
                <th className="text-left p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedScheduleSlots.map((slot) => (
                <tr key={slot.id} className="border-b border-[#EADBC8]">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedSlots.includes(slot.id)}
                      onChange={() => handleSelectSlot(slot.id)}
                      className="w-4 h-4 text-[#4B4036] accent-[#CBBFA4]"
                    />
                  </td>
                  <td className="p-2">{slot.teacher_id}</td>
                  <td className="p-2">{slot.scheduled_date}</td>
                  <td className="p-2">{slot.start_time}</td>
                  <td className="p-2">{slot.end_time}</td>
                  <td className="p-2">{slot.created_at || ''}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopySlot(slot)}
                        className="text-green-500 hover:text-green-700 text-sm"
                        title="複製此時段"
                      >
                        複製
                      </button>
                      <button
                        onClick={() => handleEditSlot(slot)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增班別彈窗 */}
      {showAddClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-bold mb-4">新增班別</h3>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="請輸入班別名稱"
              className="w-full p-2 border border-[#EADBC8] rounded mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAddClass(false)}
                className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded"
              >
                取消
              </button>
              <button
                onClick={handleAddClass}
                className="px-4 py-2 bg-[#4B4036] text-white rounded"
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯班別彈窗 */}
      {showEditClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-bold mb-4">編輯班別</h3>
            <input
              type="text"
              value={editClassName}
              onChange={(e) => setEditClassName(e.target.value)}
              placeholder="請輸入班別名稱"
              className="w-full p-2 border border-[#EADBC8] rounded mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCloseEditClass}
                className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded"
              >
                取消
              </button>
              <button
                onClick={handleUpdateClass}
                className="px-4 py-2 bg-[#4B4036] text-white rounded"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增時段彈窗 */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">新增時段</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">老師ID</label>
                <input type="text" value={newSlot.teacher_id} onChange={e => setNewSlot({...newSlot, teacher_id: e.target.value})} className="w-full p-2 border border-[#EADBC8] rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">日期</label>
                <input type="date" value={newSlot.scheduled_date} onChange={e => setNewSlot({...newSlot, scheduled_date: e.target.value})} className="w-full p-2 border border-[#EADBC8] rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">開始時間</label>
                <input type="time" value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})} className="w-full p-2 border border-[#EADBC8] rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">結束時間</label>
                <input type="time" value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})} className="w-full p-2 border border-[#EADBC8] rounded" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setShowAddSlot(false)} className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded">取消</button>
              <button onClick={handleAddSlot} className="px-4 py-2 bg-[#4B4036] text-white rounded">新增</button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯時段彈窗 */}
      {showEditSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">編輯時段</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">老師ID</label>
                <input type="text" value={editSlot.teacher_id} onChange={e => setEditSlot({...editSlot, teacher_id: e.target.value})} className="w-full p-2 border border-[#EADBC8] rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">日期</label>
                <input type="date" value={editSlot.scheduled_date} onChange={e => setEditSlot({...editSlot, scheduled_date: e.target.value})} className="w-full p-2 border border-[#EADBC8] rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">開始時間</label>
                <input type="time" value={editSlot.start_time} onChange={e => setEditSlot({...editSlot, start_time: e.target.value})} className="w-full p-2 border border-[#EADBC8] rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">結束時間</label>
                <input type="time" value={editSlot.end_time} onChange={e => setEditSlot({...editSlot, end_time: e.target.value})} className="w-full p-2 border border-[#EADBC8] rounded" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={handleCloseEditSlot} className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded">取消</button>
              <button onClick={handleUpdateSlot} className="px-4 py-2 bg-[#4B4036] text-white rounded">更新</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
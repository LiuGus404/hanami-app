'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface ClassType {
  id: string
  name: string
  status: boolean
  created_at: string
}

interface ScheduleSlot {
  id: string
  weekday: number
  timeslot: string
  max_students: number
  duration: string
  course_type: string
  assigned_teachers: string
}

export default function ClassManagementPanel() {
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
    weekday: 1,
    timeslot: '09:00',
    max_students: 4,
    duration: '00:45',
    course_type: '',
    assigned_teachers: ''
  })
  
  // 編輯時段狀態
  const [showEditSlot, setShowEditSlot] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null)
  const [editSlot, setEditSlot] = useState({
    weekday: 1,
    timeslot: '09:00',
    max_students: 4,
    duration: '00:45',
    course_type: '',
    assigned_teachers: ''
  })
  
  // 批量操作狀態
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  useEffect(() => {
    fetchData()
  }, [])

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
        .from('hanami_schedule')
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
    if (!newSlot.course_type.trim()) {
      alert('請選擇班別')
      return
    }
    
    try {
      const { error } = await supabase
        .from('hanami_schedule')
        .insert({
          weekday: newSlot.weekday,
          timeslot: newSlot.timeslot,
          max_students: newSlot.max_students,
          duration: newSlot.duration,
          course_type: newSlot.course_type,
          assigned_teachers: newSlot.assigned_teachers || null
        })
      
      if (error) throw error
      
      setNewSlot({
        weekday: 1,
        timeslot: '09:00',
        max_students: 4,
        duration: '00:45',
        course_type: '',
        assigned_teachers: ''
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
    setEditClassName(classType.name)
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
        .from('hanami_schedule')
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
    console.log('🔍 編輯時段:', slot)
    console.log('🔍 可用班別:', classTypes)
    setEditingSlot(slot)
    setEditSlot({
      weekday: slot.weekday,
      timeslot: slot.timeslot,
      max_students: slot.max_students,
      duration: slot.duration,
      course_type: slot.course_type,
      assigned_teachers: slot.assigned_teachers || ''
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
      weekday: 1,
      timeslot: '09:00',
      max_students: 4,
      duration: '00:45',
      course_type: '',
      assigned_teachers: ''
    })
  }

  const handleUpdateSlot = async () => {
    console.log('🔍 準備更新時段:', { editingSlot, editSlot })
    
    if (!editingSlot) {
      alert('編輯時段資料遺失，請重新選擇')
      return
    }
    
    if (!editSlot.course_type.trim()) {
      alert('請選擇班別')
      return
    }
    
    try {
      const updateData = {
        weekday: editSlot.weekday,
        timeslot: editSlot.timeslot,
        max_students: editSlot.max_students,
        duration: editSlot.duration,
        course_type: editSlot.course_type,
        assigned_teachers: editSlot.assigned_teachers || null
      }
      
      console.log('🔍 更新資料:', updateData)
      
      const { data, error } = await supabase
        .from('hanami_schedule')
        .update(updateData)
        .eq('id', editingSlot.id)
        .select()
      
      console.log('🔍 更新結果:', { data, error })
      
      if (error) {
        console.error('❌ 更新失敗:', error)
        throw error
      }
      
      console.log('✅ 更新成功:', data)
      
      setEditSlot({
        weekday: 1,
        timeslot: '09:00',
        max_students: 4,
        duration: '00:45',
        course_type: '',
        assigned_teachers: ''
      })
      setEditingSlot(null)
      setShowEditSlot(false)
      await fetchData()
      alert('時段更新成功！')
    } catch (err: any) {
      console.error('❌ 更新時發生錯誤:', err)
      alert('更新失敗：' + (err.message || '未知錯誤'))
    }
  }

  const handleCopySlot = (slot: ScheduleSlot) => {
    setNewSlot({
      weekday: slot.weekday,
      timeslot: slot.timeslot,
      max_students: slot.max_students,
      duration: slot.duration,
      course_type: slot.course_type,
      assigned_teachers: slot.assigned_teachers || ''
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
        .from('hanami_schedule')
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
                <th className="text-left p-2">星期</th>
                <th className="text-left p-2">時間</th>
                <th className="text-left p-2">班別</th>
                <th className="text-left p-2">人數上限</th>
                <th className="text-left p-2">時長</th>
                <th className="text-left p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {scheduleSlots.map((slot) => (
                <tr key={slot.id} className="border-b border-[#EADBC8]">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedSlots.includes(slot.id)}
                      onChange={() => handleSelectSlot(slot.id)}
                      className="w-4 h-4 text-[#4B4036] accent-[#CBBFA4]"
                    />
                  </td>
                  <td className="p-2">{weekdays[slot.weekday]}</td>
                  <td className="p-2">{slot.timeslot}</td>
                  <td className="p-2">{slot.course_type}</td>
                  <td className="p-2">{slot.max_students}</td>
                  <td className="p-2">{slot.duration}</td>
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
                <label className="block text-sm font-medium mb-1">星期</label>
                <select
                  value={newSlot.weekday}
                  onChange={(e) => setNewSlot({...newSlot, weekday: parseInt(e.target.value)})}
                  className="w-full p-2 border border-[#EADBC8] rounded"
                >
                  {weekdays.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">時間</label>
                <input
                  type="time"
                  value={newSlot.timeslot}
                  onChange={(e) => setNewSlot({...newSlot, timeslot: e.target.value})}
                  className="w-full p-2 border border-[#EADBC8] rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">班別</label>
                <select
                  value={newSlot.course_type}
                  onChange={(e) => setNewSlot({...newSlot, course_type: e.target.value})}
                  className="w-full p-2 border border-[#EADBC8] rounded"
                >
                  <option value="">請選擇班別</option>
                  {classTypes.map((classType) => (
                    <option key={classType.id} value={classType.name}>{classType.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">人數上限</label>
                <input
                  type="number"
                  value={newSlot.max_students}
                  onChange={(e) => setNewSlot({...newSlot, max_students: parseInt(e.target.value)})}
                  min="1"
                  max="20"
                  className="w-full p-2 border border-[#EADBC8] rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">時長</label>
                <select
                  value={newSlot.duration}
                  onChange={(e) => setNewSlot({...newSlot, duration: e.target.value})}
                  className="w-full p-2 border border-[#EADBC8] rounded"
                >
                  <option value="00:45">45分鐘</option>
                  <option value="01:00">60分鐘</option>
                  <option value="01:30">90分鐘</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">負責老師（選填）</label>
                <input
                  type="text"
                  value={newSlot.assigned_teachers}
                  onChange={(e) => setNewSlot({...newSlot, assigned_teachers: e.target.value})}
                  placeholder="請輸入老師姓名"
                  className="w-full p-2 border border-[#EADBC8] rounded"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowAddSlot(false)}
                className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded"
              >
                取消
              </button>
              <button
                onClick={handleAddSlot}
                className="px-4 py-2 bg-[#4B4036] text-white rounded"
              >
                新增
              </button>
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
                <label className="block text-sm font-medium mb-1">星期</label>
                <select
                  value={editSlot.weekday}
                  onChange={(e) => setEditSlot({...editSlot, weekday: parseInt(e.target.value)})}
                  className="w-full p-2 border border-[#EADBC8] rounded"
                >
                  {weekdays.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">時間</label>
                <input
                  type="time"
                  value={editSlot.timeslot}
                  onChange={(e) => setEditSlot({...editSlot, timeslot: e.target.value})}
                  className="w-full p-2 border border-[#EADBC8] rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">班別</label>
                <select
                  value={editSlot.course_type}
                  onChange={(e) => setEditSlot({...editSlot, course_type: e.target.value})}
                  className="w-full p-2 border border-[#EADBC8] rounded"
                >
                  <option value="">請選擇班別</option>
                  {classTypes.map((classType) => (
                    <option key={classType.id} value={classType.name}>{classType.name}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  當前選擇: {editSlot.course_type || '未選擇'}
                </div>
                <div className="text-xs text-gray-500">
                  可用班別: {classTypes.map(c => c.name).join(', ') || '無可用班別'}
                </div>
                {classTypes.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">
                    ⚠️ 沒有可用的班別，請先新增班別
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">人數上限</label>
                <input
                  type="number"
                  value={editSlot.max_students}
                  onChange={(e) => setEditSlot({...editSlot, max_students: parseInt(e.target.value)})}
                  min="1"
                  max="20"
                  className="w-full p-2 border border-[#EADBC8] rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">時長</label>
                <select
                  value={editSlot.duration}
                  onChange={(e) => setEditSlot({...editSlot, duration: e.target.value})}
                  className="w-full p-2 border border-[#EADBC8] rounded"
                >
                  <option value="00:45">45分鐘</option>
                  <option value="01:00">60分鐘</option>
                  <option value="01:30">90分鐘</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">負責老師（選填）</label>
                <input
                  type="text"
                  value={editSlot.assigned_teachers}
                  onChange={(e) => setEditSlot({...editSlot, assigned_teachers: e.target.value})}
                  placeholder="請輸入老師姓名"
                  className="w-full p-2 border border-[#EADBC8] rounded"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={handleCloseEditSlot}
                className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded"
              >
                取消
              </button>
              <button
                onClick={handleUpdateSlot}
                className="px-4 py-2 bg-[#4B4036] text-white rounded"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
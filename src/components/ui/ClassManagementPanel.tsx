'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';

import { PopupSelect } from '@/components/ui/PopupSelect';
import TimePicker from '@/components/ui/TimePicker';
import { supabase } from '@/lib/supabase';

interface ClassType {
  id: string
  name: string | null
  status: boolean | null
  created_at: string
}

interface ScheduleSlot {
  id: string
  weekday: number | null
  timeslot: string | null
  max_students: number | null
  assigned_teachers: string | null
  created_at: string
  updated_at: string | null
  course_type: string | null
  duration: string | null
}

export default function ClassManagementPanel() {
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 排序相關狀態
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // 新增班別狀態
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  // 編輯班別狀態
  const [showEditClass, setShowEditClass] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassType | null>(null);
  const [editClassName, setEditClassName] = useState('');
  
  const [courseTypes, setCourseTypes] = useState<{id: string, name: string}[]>([]);

  // 新增課堂空缺狀態
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<ScheduleSlot>>({
    weekday: 1,
    timeslot: '09:00:00',
    max_students: 10,
    assigned_teachers: '',
    course_type: '',
    duration: '01:00:00',
  });

  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  const [editSlot, setEditSlot] = useState<Partial<ScheduleSlot>>({});

  const [showEditSlot, setShowEditSlot] = useState(false);

  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const [selectAll, setSelectAll] = useState(false);

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  const [teachers, setTeachers] = useState<any[]>([]);

  const [showWeekdaySelect, setShowWeekdaySelect] = useState(false);

  const [showTeacherSelect, setShowTeacherSelect] = useState(false);

  const [showCourseTypeSelect, setShowCourseTypeSelect] = useState(false);

  const [showEditWeekdaySelect, setShowEditWeekdaySelect] = useState(false);

  const [showEditTeacherSelect, setShowEditTeacherSelect] = useState(false);

  const [showEditCourseTypeSelect, setShowEditCourseTypeSelect] = useState(false);

  useEffect(() => {
    fetchData();
    fetchCourseTypes();
  }, []);

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



  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 取得班別資料
      const { data: classData, error: classError } = await supabase
        .from('Hanami_CourseTypes')
        .select('*')
        .order('name');
      
      console.log('🔍 班別資料查詢結果:', { classData, classError });
      
      if (classError) throw classError;
      
      setClassTypes(classData || []);
      
      console.log('✅ 資料載入完成:', {
        班別數量: classData?.length || 0,
      });
    } catch (err: any) {
      console.error('❌ 資料載入失敗:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      alert('請輸入班別名稱');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('Hanami_CourseTypes')
        .insert({
          name: newClassName.trim(),
          status: true,
        });
      
      if (error) throw error;
      
      setNewClassName('');
      setShowAddClass(false);
      await fetchData();
      alert('班別新增成功！');
    } catch (err: any) {
      alert(`新增失敗：${err.message}`);
    }
  };

  const handleAddSlot = async () => {
    if (!newSlot.weekday || !newSlot.timeslot) {
      alert('請填寫完整資訊');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('hanami_schedule')
        .insert({
          weekday: newSlot.weekday ?? 1,
          timeslot: newSlot.timeslot || '09:00:00',
          max_students: newSlot.max_students ?? 10,
          assigned_teachers: newSlot.assigned_teachers || null,
          course_type: newSlot.course_type || null,
          duration: newSlot.duration || null,
        });
      
      if (error) throw error;
      
      setNewSlot({
        weekday: 1,
        timeslot: '09:00:00',
        max_students: 10,
        assigned_teachers: '',
        course_type: '',
        duration: '01:00:00',
      });
      setShowAddSlot(false);
      await fetchData();
      alert('課堂空缺情況新增成功！');
    } catch (err: any) {
      alert(`新增失敗：${err.message}`);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('確定要刪除此班別嗎？')) return;
    
    try {
      const { error } = await supabase
        .from('Hanami_CourseTypes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchData();
      alert('班別刪除成功！');
    } catch (err: any) {
      alert(`刪除失敗：${err.message}`);
    }
  };

  const handleEditClass = (classType: ClassType) => {
    setEditingClass(classType);
    setEditClassName(classType.name || '');
    setShowEditClass(true);
  };

  const handleUpdateClass = async () => {
    console.log('🔍 準備更新班別:', { editingClass, editClassName });
    
    if (!editingClass) {
      alert('編輯班別資料遺失，請重新選擇');
      return;
    }
    
    if (!editClassName.trim()) {
      alert('請輸入班別名稱');
      return;
    }
    
    try {
      const updateData = { name: editClassName.trim() };
      console.log('🔍 更新資料:', updateData);
      
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .update(updateData)
        .eq('id', editingClass.id)
        .select();
      
      console.log('🔍 更新結果:', { data, error });
      
      if (error) {
        console.error('❌ 更新失敗:', error);
        throw error;
      }
      
      console.log('✅ 更新成功:', data);
      
      setEditClassName('');
      setEditingClass(null);
      setShowEditClass(false);
      await fetchData();
      alert('班別更新成功！');
    } catch (err: any) {
      console.error('❌ 更新時發生錯誤:', err);
      alert(`更新失敗：${err.message || '未知錯誤'}`);
    }
  };

  const handleToggleClassStatus = async (classType: ClassType) => {
    try {
      const { error } = await supabase
        .from('Hanami_CourseTypes')
        .update({ status: !classType.status })
        .eq('id', classType.id);
      
      if (error) throw error;
      
      await fetchData();
      alert(`班別已${!classType.status ? '啟用' : '停用'}！`);
    } catch (err: any) {
      alert(`狀態更新失敗：${err.message}`);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('確定要刪除此課堂空缺情況嗎？')) return;
    
    try {
      const { error } = await supabase
        .from('hanami_schedule')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchData();
      alert('課堂空缺情況刪除成功！');
    } catch (err: any) {
      alert(`刪除失敗：${err.message}`);
    }
  };

  const handleEditSlot = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setEditSlot({
      weekday: slot.weekday !== null ? slot.weekday : 1,
      timeslot: slot.timeslot || '09:00:00',
      max_students: slot.max_students ?? 10,
      assigned_teachers: slot.assigned_teachers || '',
      course_type: slot.course_type || '',
      duration: slot.duration || '01:00:00',
    });
    setShowEditSlot(true);
  };

  const handleCloseEditClass = () => {
    setShowEditClass(false);
    setEditingClass(null);
    setEditClassName('');
  };

  const handleCloseEditSlot = () => {
    setShowEditSlot(false);
    setEditingSlot(null);
    setEditSlot({});
  };

  const handleUpdateSlot = async () => {
    if (!editingSlot || !editSlot.weekday || !editSlot.timeslot) {
      alert('請填寫完整資訊');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('hanami_schedule')
        .update({
          weekday: editSlot.weekday,
          timeslot: editSlot.timeslot,
          max_students: editSlot.max_students ?? 10,
          assigned_teachers: editSlot.assigned_teachers || null,
          course_type: editSlot.course_type || null,
          duration: editSlot.duration || null,
        })
        .eq('id', editingSlot.id);
      
      if (error) throw error;
      
      setShowEditSlot(false);
      setEditingSlot(null);
      setEditSlot({});
      await fetchData();
      alert('課堂空缺情況更新成功！');
    } catch (err: any) {
      alert(`更新失敗：${err.message}`);
    }
  };

  const handleCopySlot = (slot: ScheduleSlot) => {
    setNewSlot({
      weekday: slot.weekday !== null ? slot.weekday : 1,
      timeslot: slot.timeslot || '09:00:00',
      max_students: slot.max_students ?? 10,
      assigned_teachers: slot.assigned_teachers || '',
      course_type: slot.course_type || '',
      duration: slot.duration || '01:00:00',
    });
    setShowAddSlot(true);
  };

  const handleSelectSlot = (id: string) => {
    setSelectedSlots(prev => 
      prev.includes(id) 
        ? prev.filter(slotId => slotId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSlots([]);
      setSelectAll(false);
    } else {
      setSelectedSlots(scheduleSlots.map(slot => slot.id));
      setSelectAll(true);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedSlots.length === 0) {
      alert('請選擇要刪除的課堂空缺情況');
      return;
    }
    
    if (!confirm(`確定要刪除選中的 ${selectedSlots.length} 個課堂空缺情況嗎？`)) return;
    
    try {
      const { error } = await supabase
        .from('hanami_schedule')
        .delete()
        .in('id', selectedSlots);
      
      if (error) throw error;
      
      setSelectedSlots([]);
      setSelectAll(false);
      await fetchData();
      alert('批量刪除課堂空缺情況成功！');
    } catch (err: any) {
      alert(`批量刪除課堂空缺情況失敗：${err.message}`);
    }
  };

  const fetchCourseTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name')
        .eq('status', true)
        .order('name');

      if (error) {
        console.error('Error fetching course types:', error);
        return;
      }

      setCourseTypes((data || []).map(item => ({ ...item, name: item.name || '' })));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname')
        .eq('teacher_status', 'active')
        .order('teacher_nickname');

      if (error) {
        console.error('Error fetching teachers:', error);
        return;
      }

      setTeachers(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-[#4B4036]">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* 班別管理 */}
      <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#4B4036] flex items-center gap-2">
            <Image alt="class" height={24} src="/icons/book-elephant.PNG" width={24} />
            班別管理
          </h3>
          <button
            className="bg-[#4B4036] hover:bg-[#3A3329] text-white px-4 py-2 rounded-full text-sm transition-colors"
            onClick={() => setShowAddClass(true)}
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
                  className={`px-2 py-1 text-xs rounded ${
                    classType.status 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => handleToggleClassStatus(classType)}
                >
                  {classType.status ? '停用' : '啟用'}
                </button>
                <button
                  className="text-blue-500 hover:text-blue-700 text-sm"
                  onClick={() => handleEditClass(classType)}
                >
                  編輯
                </button>
                <button
                  className="text-red-500 hover:text-red-700 text-sm"
                  onClick={() => handleDeleteClass(classType.id)}
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* 新增班別彈窗 */}
      {showAddClass && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-bold mb-4">新增班別</h3>
            <input
              className="w-full p-2 border border-[#EADBC8] rounded mb-4"
              placeholder="請輸入班別名稱"
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded"
                onClick={() => setShowAddClass(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-[#4B4036] text-white rounded"
                onClick={handleAddClass}
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
              className="w-full p-2 border border-[#EADBC8] rounded mb-4"
              placeholder="請輸入班別名稱"
              type="text"
              value={editClassName}
              onChange={(e) => setEditClassName(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded"
                onClick={handleCloseEditClass}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-[#4B4036] text-white rounded"
                onClick={handleUpdateClass}
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增課堂空缺情況彈窗 */}
      {showAddSlot && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto shadow-xl border border-[#EADBC8]">
            <h3 className="text-lg font-bold mb-4">新增課堂空缺情況</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">星期</label>
                <button
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  onClick={() => setShowWeekdaySelect(true)}
                >
                  {newSlot.weekday === 1 ? '星期一' :
                    newSlot.weekday === 2 ? '星期二' :
                      newSlot.weekday === 3 ? '星期三' :
                        newSlot.weekday === 4 ? '星期四' :
                          newSlot.weekday === 5 ? '星期五' :
                            newSlot.weekday === 6 ? '星期六' :
                              newSlot.weekday === 0 ? '星期日' : '請選擇星期'}
                </button>
                {showWeekdaySelect && (
                  <PopupSelect
                    mode="single"
                    options={[
                      { label: '星期一', value: '1' },
                      { label: '星期二', value: '2' },
                      { label: '星期三', value: '3' },
                      { label: '星期四', value: '4' },
                      { label: '星期五', value: '5' },
                      { label: '星期六', value: '6' },
                      { label: '星期日', value: '0' },
                    ]}
                    selected={(newSlot.weekday ?? 1).toString()}
                    title="選擇星期"
                    onCancel={() => setShowWeekdaySelect(false)}
                    onChange={(value) => setNewSlot({ ...newSlot, weekday: parseInt(value as string) })}
                    onConfirm={() => setShowWeekdaySelect(false)}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">課堂空缺情況</label>
                <TimePicker
                  value={newSlot.timeslot?.slice(0, 5) || '09:00'}
                  onChange={(time) => setNewSlot({ ...newSlot, timeslot: `${time}:00` })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">最大學生數</label>
                <input 
                  className="w-full p-2 border border-[#EADBC8] rounded bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64]" 
                  type="number" 
                  value={newSlot.max_students ?? 10} 
                  onChange={e => setNewSlot({ ...newSlot, max_students: parseInt(e.target.value) })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">指派老師</label>
                <button
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  onClick={() => setShowTeacherSelect(true)}
                >
                  {newSlot.assigned_teachers || '請選擇老師'}
                </button>
                {showTeacherSelect && (
                  <PopupSelect
                    mode="single"
                    options={teachers.map(teacher => ({ label: teacher.teacher_nickname, value: teacher.teacher_nickname }))}
                    selected={newSlot.assigned_teachers || ''}
                    title="選擇老師"
                    onCancel={() => setShowTeacherSelect(false)}
                    onChange={(value) => setNewSlot({ ...newSlot, assigned_teachers: value as string })}
                    onConfirm={() => setShowTeacherSelect(false)}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">課程類型</label>
                <button
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  onClick={() => setShowCourseTypeSelect(true)}
                >
                  {courseTypes.find(type => type.id === newSlot.course_type)?.name || '請選擇課程類型'}
                </button>
                {showCourseTypeSelect && (
                  <PopupSelect
                    mode="single"
                    options={courseTypes.map(type => ({ label: type.name || '', value: type.id }))}
                    selected={newSlot.course_type || ''}
                    title="選擇課程類型"
                    onCancel={() => setShowCourseTypeSelect(false)}
                    onChange={(value) => setNewSlot({ ...newSlot, course_type: value as string })}
                    onConfirm={() => setShowCourseTypeSelect(false)}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">時長</label>
                <TimePicker
                  value={newSlot.duration?.slice(0, 5) || '01:00'}
                  onChange={(time) => setNewSlot({ ...newSlot, duration: `${time}:00` })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded" onClick={() => setShowAddSlot(false)}>取消</button>
              <button className="px-4 py-2 bg-[#4B4036] text-white rounded" onClick={handleAddSlot}>新增</button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯課堂空缺情況彈窗 */}
      {showEditSlot && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto shadow-xl border border-[#EADBC8]">
            <h3 className="text-lg font-bold mb-4">編輯課堂空缺情況</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">星期</label>
                <button
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  onClick={() => setShowEditWeekdaySelect(true)}
                >
                  {editSlot.weekday === 1 ? '星期一' :
                    editSlot.weekday === 2 ? '星期二' :
                      editSlot.weekday === 3 ? '星期三' :
                        editSlot.weekday === 4 ? '星期四' :
                          editSlot.weekday === 5 ? '星期五' :
                            editSlot.weekday === 6 ? '星期六' :
                              editSlot.weekday === 0 ? '星期日' : '請選擇星期'}
                </button>
                {showEditWeekdaySelect && (
                  <PopupSelect
                    mode="single"
                    options={[
                      { label: '星期一', value: '1' },
                      { label: '星期二', value: '2' },
                      { label: '星期三', value: '3' },
                      { label: '星期四', value: '4' },
                      { label: '星期五', value: '5' },
                      { label: '星期六', value: '6' },
                      { label: '星期日', value: '0' },
                    ]}
                    selected={editSlot.weekday?.toString() || '1'}
                    title="選擇星期"
                    onCancel={() => setShowEditWeekdaySelect(false)}
                    onChange={(value) => setEditSlot({ ...editSlot, weekday: parseInt(value as string) })}
                    onConfirm={() => setShowEditWeekdaySelect(false)}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">課堂空缺情況</label>
                <TimePicker
                  value={editSlot.timeslot?.slice(0, 5) || '09:00'}
                  onChange={(time) => setEditSlot({ ...editSlot, timeslot: `${time}:00` })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">最大學生數</label>
                <input 
                  className="w-full p-2 border border-[#EADBC8] rounded bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64]" 
                  type="number" 
                  value={editSlot.max_students ?? 10} 
                  onChange={e => setEditSlot({ ...editSlot, max_students: parseInt(e.target.value) })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">指派老師</label>
                <button
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  onClick={() => setShowEditTeacherSelect(true)}
                >
                  {editSlot.assigned_teachers || '請選擇老師'}
                </button>
                {showEditTeacherSelect && (
                  <PopupSelect
                    mode="single"
                    options={teachers.map(teacher => ({ label: teacher.teacher_nickname, value: teacher.teacher_nickname }))}
                    selected={editSlot.assigned_teachers || ''}
                    title="選擇老師"
                    onCancel={() => setShowEditTeacherSelect(false)}
                    onChange={(value) => setEditSlot({ ...editSlot, assigned_teachers: value as string })}
                    onConfirm={() => setShowEditTeacherSelect(false)}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">課程類型</label>
                <button
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  onClick={() => setShowEditCourseTypeSelect(true)}
                >
                  {courseTypes.find(type => type.id === editSlot.course_type)?.name || '請選擇課程類型'}
                </button>
                {showEditCourseTypeSelect && (
                  <PopupSelect
                    mode="single"
                    options={courseTypes.map(type => ({ label: type.name || '', value: type.id }))}
                    selected={editSlot.course_type || ''}
                    title="選擇課程類型"
                    onCancel={() => setShowEditCourseTypeSelect(false)}
                    onChange={(value) => setEditSlot({ ...editSlot, course_type: value as string })}
                    onConfirm={() => setShowEditCourseTypeSelect(false)}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">時長</label>
                <TimePicker
                  value={editSlot.duration?.slice(0, 5) || '01:00'}
                  onChange={(time) => setEditSlot({ ...editSlot, duration: `${time}:00` })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded" onClick={handleCloseEditSlot}>取消</button>
              <button className="px-4 py-2 bg-[#4B4036] text-white rounded" onClick={handleUpdateSlot}>更新</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
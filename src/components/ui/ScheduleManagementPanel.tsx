'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';

import { PopupSelect } from './PopupSelect';
import TimePicker from './TimePicker';

import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { useOrganization } from '@/contexts/OrganizationContext';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

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

interface ClassType {
  id: string
  name: string | null
  status: boolean | null
  created_at: string
}

interface Teacher {
  id: string
  teacher_nickname: string | null
}

export default function ScheduleManagementPanel() {
  const { user } = useUser();
  const { currentOrganization } = useOrganization();
  const effectiveOrgId = useMemo(
    () => currentOrganization?.id || user?.organization?.id || null,
    [currentOrganization?.id, user?.organization?.id]
  );
  const validOrgId = useMemo(
    () => (effectiveOrgId && UUID_REGEX.test(effectiveOrgId) ? effectiveOrgId : null),
    [effectiveOrgId]
  );
  const hasValidOrg = Boolean(validOrgId);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [courseTypes, setCourseTypes] = useState<ClassType[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('weekday');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // 新增課堂時段
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState<Partial<ScheduleSlot>>({
    weekday: 1,
    timeslot: '09:00:00',
    max_students: 10,
    assigned_teachers: '',
    course_type: '',
    duration: '01:00:00',
  });

  // 編輯課堂時段
  const [showEditSlot, setShowEditSlot] = useState(false);
  const [editSlot, setEditSlot] = useState<Partial<ScheduleSlot>>({});

  // 選擇器狀態
  const [showWeekdaySelect, setShowWeekdaySelect] = useState(false);
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [showCourseTypeSelect, setShowCourseTypeSelect] = useState(false);
  const [showEditWeekdaySelect, setShowEditWeekdaySelect] = useState(false);
  const [showEditTeacherSelect, setShowEditTeacherSelect] = useState(false);
  const [showEditCourseTypeSelect, setShowEditCourseTypeSelect] = useState(false);

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

  const sortScheduleSlots = (slots: ScheduleSlot[]) => {
    return [...slots].sort((a, b) => {
      let aVal: any = a[sortField as keyof ScheduleSlot];
      let bVal: any = b[sortField as keyof ScheduleSlot];

      if (sortField === 'weekday') {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else if (sortField === 'timeslot') {
        aVal = aVal || '';
        bVal = bVal || '';
      } else if (sortField === 'max_students') {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else {
        aVal = aVal || '';
        bVal = bVal || '';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const fetchData = async () => {
    if (!hasValidOrg) {
      setScheduleSlots([]);
      setCourseTypes([]);
      setTeachers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 取得課堂時段
      const { data: slotData, error: slotError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('org_id', validOrgId as string)
        .order('weekday')
        .order('timeslot');
      
      console.log('🔍 課堂空缺情況資料查詢結果:', { slotData, slotError });
      
      if (slotError) throw slotError;

      // 取得課程資料
      const { data: classData, error: classError } = await supabase
        .from('Hanami_CourseTypes')
        .select('*')
        .eq('org_id', validOrgId as string)
        .order('name');
      
      if (classError) throw classError;

      // 取得教師資料
      const { data: teacherData, error: teacherError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname')
        .eq('org_id', validOrgId as string)
        .order('teacher_nickname');
      
      if (teacherError) throw teacherError;

      setScheduleSlots((slotData || []).map(slot => ({
        ...slot,
        created_at: slot.created_at || '',
        updated_at: slot.updated_at || '',
      })));
      setCourseTypes(classData || []);
      setTeachers(teacherData || []);

      console.log('✅ 資料載入完成:', {
        課堂學生數量: slotData?.length || 0,
        課程類型: classData?.length || 0,
        教師數量: teacherData?.length || 0,
      });
    } catch (err: any) {
      console.error('❌ 載入資料失敗:', err);
      alert(`載入資料失敗：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再新增課堂時段');
      return;
    }
    try {
      const { error } = await supabase
        .from('hanami_schedule')
        .insert([{ 
          ...newSlot,
          org_id: validOrgId,
          weekday: newSlot.weekday ?? 1,
          timeslot: newSlot.timeslot || '09:00:00',
          max_students: newSlot.max_students ?? 10,
          assigned_teachers: newSlot.assigned_teachers || null,
          course_type: newSlot.course_type || null,
          duration: newSlot.duration || null,
        }]);
      
      if (error) throw error;
      
      setShowAddSlot(false);
      setNewSlot({
        weekday: 1,
        timeslot: '09:00:00',
        max_students: 10,
        assigned_teachers: '',
        course_type: '',
        duration: '01:00:00',
      });
      await fetchData();
      alert('課堂時段新增成功！');
    } catch (err: any) {
      alert(`新增失敗：${err.message}`);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('確定要刪除此課堂嗎？')) return;
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再刪除課堂時段');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('hanami_schedule')
        .delete()
        .eq('id', id)
        .eq('org_id', validOrgId as string);
      
      if (error) throw error;
      
      await fetchData();
      alert('課堂時段刪除成功！');
    } catch (err: any) {
      alert(`刪除失敗：${err.message}`);
    }
  };

  const handleEditSlot = (slot: ScheduleSlot) => {
    setEditSlot(slot);
    setShowEditSlot(true);
  };

  const handleCloseEditSlot = () => {
    setEditSlot({});
    setShowEditSlot(false);
  };

  const handleUpdateSlot = async () => {
    if (!hasValidOrg || !editSlot.id) {
      alert('請先創建屬於您的機構後再更新課堂時段');
      return;
    }
    try {
      const { error } = await supabase
        .from('hanami_schedule')
        .update({
          ...editSlot,
          weekday: editSlot.weekday ?? 1,
          timeslot: editSlot.timeslot || '09:00:00',
          max_students: editSlot.max_students ?? 10,
          assigned_teachers: editSlot.assigned_teachers || null,
          course_type: editSlot.course_type || null,
          duration: editSlot.duration || null,
        })
        .eq('id', editSlot.id!)
        .eq('org_id', validOrgId as string);
      
      if (error) throw error;
      
      setEditSlot({});
      setShowEditSlot(false);
      await fetchData();
      alert('課堂時段更新成功！');
    } catch (err: any) {
      alert(`更新失敗：${err.message}`);
    }
  };

  const handleCopySlot = (slot: ScheduleSlot) => {
    const { id, created_at, updated_at, ...copyData } = slot;
    setNewSlot(copyData);
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
      alert('請選擇要刪除的課堂時段');
      return;
    }
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再刪除課堂時段');
      return;
    }
    
    if (!confirm(`確定要刪除選中的 ${selectedSlots.length} 個課堂時段況嗎？`)) return;
    
    try {
      const { error } = await supabase
        .from('hanami_schedule')
        .delete()
        .in('id', selectedSlots)
        .eq('org_id', validOrgId as string);
      
      if (error) throw error;
      
      setSelectedSlots([]);
      setSelectAll(false);
      await fetchData();
      alert('批量刪除課堂時段成功！');
    } catch (err: any) {
      alert(`批量刪除課堂時段失敗：${err.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hasValidOrg, validOrgId]);

  const sortedScheduleSlots = sortScheduleSlots(scheduleSlots);

  const [showCourseList, setShowCourseList] = useState(false);
  const [courses, setCourses] = useState<ClassType[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourseName, setEditingCourseName] = useState('');

  const fetchCourses = async () => {
    if (!hasValidOrg) {
      setCourses([]);
      return;
    }
    const { data, error } = await supabase
      .from('Hanami_CourseTypes')
      .select('*')
      .eq('org_id', validOrgId as string)
      .order('created_at');
    if (!error) setCourses(data || []);
  };

  useEffect(() => { fetchCourses(); }, [hasValidOrg, validOrgId]);

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) return;
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再新增課程');
      return;
    }
    const { error } = await supabase
      .from('Hanami_CourseTypes')
      .insert({ name: newCourseName.trim(), status: true, org_id: validOrgId });
    if (!error) {
      setNewCourseName('');
      fetchCourses();
    }
  };

  const handleEditCourse = (id: string, name: string) => {
    setEditingCourseId(id);
    setEditingCourseName(name);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourseId || !editingCourseName.trim()) return;
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再更新課程');
      return;
    }
    const { error } = await supabase
      .from('Hanami_CourseTypes')
      .update({ name: editingCourseName.trim() })
      .eq('id', editingCourseId)
      .eq('org_id', validOrgId as string);
    if (!error) {
      setEditingCourseId(null);
      setEditingCourseName('');
      fetchCourses();
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('確定要刪除此課程？')) return;
    if (!hasValidOrg) {
      alert('請先創建屬於您的機構後再刪除課程');
      return;
    }
    const { error } = await supabase
      .from('Hanami_CourseTypes')
      .delete()
      .eq('id', id)
      .eq('org_id', validOrgId as string);
    if (!error) fetchCourses();
  };

  if (!hasValidOrg) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-[#4B4036] bg-[#FFFDF7] border border-[#EADBC8] px-6 py-4 rounded-xl">
          請先創建屬於您的機構，並建立課程與課堂資料。
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-[#4B4036]">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 課程管理區塊 */}
      <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#4B4036] flex items-center gap-2">
            <Image alt="課程" height={24} src="/icons/book-elephant.PNG" width={24} />
            課程管理
          </h3>
          <button
            className="bg-[#A68A64] hover:bg-[#8f7350] text-white px-4 py-2 rounded-full text-sm transition-colors"
            onClick={() => setShowCourseList(v => !v)}
          >
            {showCourseList ? '收起課程' : '展開課程'}
          </button>
        </div>
        {showCourseList && (
          <div className="space-y-2">
            {courses.map(course => (
              <div key={course.id} className="flex items-center gap-2 border-b border-[#EADBC8] py-2">
                {editingCourseId === course.id ? (
                  <>
                    <input
                      className="w-full p-2 border border-[#EADBC8] rounded bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64]"
                      value={editingCourseName}
                      onChange={e => setEditingCourseName(e.target.value)}
                    />
                    <button className="px-4 py-2 bg-[#A68A64] hover:bg-[#8f7350] text-white rounded" onClick={handleUpdateCourse}>儲存</button>
                    <button className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded" onClick={() => setEditingCourseId(null)}>取消</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-[#4B4036]">{course.name}</span>
                    <button className="text-blue-500 hover:text-blue-700 text-sm" onClick={() => handleEditCourse(course.id, course.name || '')}>編輯</button>
                    <button className="text-red-500 hover:text-red-700 text-sm" onClick={() => handleDeleteCourse(course.id)}>刪除</button>
                  </>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <input
                className="w-full p-2 border border-[#EADBC8] rounded bg-white text-[#4B4036] focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64]"
                placeholder="新增課程名稱"
                value={newCourseName}
                onChange={e => setNewCourseName(e.target.value)}
              />
              <button className="px-4 py-2 bg-[#A68A64] hover:bg-[#8f7350] text-white rounded" onClick={handleAddCourse}>新增</button>
            </div>
          </div>
        )}
      </div>
      {/* 課堂空缺情況管理 */}
      <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#4B4036] flex items-center gap-2">
            <Image alt="time" height={24} src="/icons/clock.PNG" width={24} />
            課堂管理
          </h3>
          <div className="flex items-center gap-2">
            {selectedSlots.length > 0 && (
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                onClick={handleBatchDelete}
              >
                批量刪除 ({selectedSlots.length})
              </button>
            )}
            <button
              className="bg-[#A68A64] hover:bg-[#8f7350] text-white px-4 py-2 rounded-full text-sm transition-colors"
              onClick={() => setShowAddSlot(true)}
            >
              新增課堂時段
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
                          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-[#EADBC8]">
                <th className="text-left p-2">
                  <input
                    checked={selectAll}
                    className="w-4 h-4 text-[#4B4036] accent-[#CBBFA4]"
                    type="checkbox"
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="text-left p-2 cursor-pointer" onClick={() => handleSort('weekday')}>
                  <div className="flex items-center gap-1">
                    星期
                    {getSortIcon('weekday')}
                  </div>
                </th>
                <th className="text-left p-2 cursor-pointer" onClick={() => handleSort('timeslot')}>
                  <div className="flex items-center gap-1">
                    課堂時段
                    {getSortIcon('timeslot')}
                  </div>
                </th>
                <th className="text-left p-2 cursor-pointer" onClick={() => handleSort('max_students')}>
                  <div className="flex items-center gap-1">
                    最大學生數
                    {getSortIcon('max_students')}
                  </div>
                </th>
                <th className="text-left p-2 cursor-pointer" onClick={() => handleSort('assigned_teachers')}>
                  <div className="flex items-center gap-1">
                    指派老師
                    {getSortIcon('assigned_teachers')}
                  </div>
                </th>
                <th className="text-left p-2 cursor-pointer" onClick={() => handleSort('course_type')}>
                  <div className="flex items-center gap-1">
                    課程類型
                    {getSortIcon('course_type')}
                  </div>
                </th>
                <th className="text-left p-2 cursor-pointer" onClick={() => handleSort('duration')}>
                  <div className="flex items-center gap-1">
                    時長
                    {getSortIcon('duration')}
                  </div>
                </th>
                <th className="text-left p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedScheduleSlots.map((slot) => (
                <tr key={slot.id} className="border-b border-[#EADBC8]">
                  <td className="p-2">
                    <input
                      checked={selectedSlots.includes(slot.id)}
                      className="w-4 h-4 text-[#4B4036] accent-[#CBBFA4]"
                      type="checkbox"
                      onChange={() => handleSelectSlot(slot.id)}
                    />
                  </td>
                  <td className="p-2">{weekdays[slot.weekday || 0]}</td>
                  <td className="p-2">{slot.timeslot?.slice(0, 5)}</td>
                  <td className="p-2">{slot.max_students}</td>
                  <td className="p-2">{slot.assigned_teachers || '-'}</td>
                  <td className="px-4 py-2 text-center">
                    {courseTypes.find(type => type.id === slot.course_type)?.name || slot.course_type || '-'}
                  </td>
                  <td className="p-2">{slot.duration?.slice(0, 5) || '-'}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <button
                        className="text-green-500 hover:text-green-700 text-sm"
                        title="複製此課堂空缺情況"
                        onClick={() => handleCopySlot(slot)}
                      >
                        複製
                      </button>
                      <button
                        className="text-blue-500 hover:text-blue-700 text-sm"
                        onClick={() => handleEditSlot(slot)}
                      >
                        編輯
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 text-sm"
                        onClick={() => handleDeleteSlot(slot.id)}
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

      {/* 新增課堂時段彈窗 */}
      {showAddSlot && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto shadow-xl border border-[#EADBC8]">
            <h3 className="text-lg font-bold mb-4">新增課堂時段</h3>
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
                    selected={newSlot.weekday?.toString() || '1'}
                    title="選擇星期"
                    onCancel={() => setShowWeekdaySelect(false)}
                    onChange={(value) => setNewSlot({ ...newSlot, weekday: parseInt(value as string) })}
                    onConfirm={() => setShowWeekdaySelect(false)}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">課堂時段</label>
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
                    options={teachers.map(teacher => ({ label: teacher.teacher_nickname || '', value: teacher.teacher_nickname || '' }))}
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
              <button className="px-4 py-2 bg-[#A68A64] hover:bg-[#8f7350] text-white rounded" onClick={handleAddSlot}>新增</button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯課堂空缺情況彈窗 */}
      {showEditSlot && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(255,255,255,0.7)' }}>
          <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-y-auto shadow-xl border border-[#EADBC8]">
            <h3 className="text-lg font-bold mb-4">編輯課堂時段</h3>
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
                <label className="block text-sm font-medium mb-1">課堂情況</label>
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
                    options={teachers.map(teacher => ({ label: teacher.teacher_nickname || '', value: teacher.teacher_nickname || '' }))}
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
              <button className="px-4 py-2 bg-[#A68A64] hover:bg-[#8f7350] text-white rounded" onClick={handleUpdateSlot}>更新</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
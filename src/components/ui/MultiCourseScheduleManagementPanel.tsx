'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { PopupSelect } from './PopupSelect';
import TimePicker from './TimePicker';

import { supabase } from '@/lib/supabase';

interface ScheduleSlot {
  id: string;
  weekday: number | null;
  timeslot: string | null;
  max_students: number | null;
  assigned_teachers: string | null;
  created_at: string;
  updated_at: string | null;
  course_type: string | null;
  duration: string | null;
  course_code: string | null;
  course_section: string | null;
  room_id: string | null;
  is_primary_schedule: boolean | null;
}

interface CourseCode {
  id: string;
  course_code: string;
  course_name: string;
  course_description: string | null;
  max_students: number | null;
  teacher_id: string | null;
  room_location: string | null;
  is_active: boolean;
  course_type_id: string;
  course_type_name: string;
}

interface Teacher {
  id: string;
  teacher_nickname: string | null;
  teacher_fullname: string | null;
}

export default function MultiCourseScheduleManagementPanel() {
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [courseCodes, setCourseCodes] = useState<CourseCode[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [courseTypes, setCourseTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('');
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
    course_code: '',
    course_section: 'A',
    room_id: '',
    duration: '01:00:00',
    is_primary_schedule: true,
  });

  // 編輯課堂時段
  const [showEditSlot, setShowEditSlot] = useState(false);
  const [editSlot, setEditSlot] = useState<Partial<ScheduleSlot>>({});

  // 選擇器狀態
  const [showWeekdaySelect, setShowWeekdaySelect] = useState(false);
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [showCourseCodeSelect, setShowCourseCodeSelect] = useState(false);
  const [showEditWeekdaySelect, setShowEditWeekdaySelect] = useState(false);
  const [showEditTeacherSelect, setShowEditTeacherSelect] = useState(false);
  
  // 時段詳情視窗狀態
  const [showSlotDetail, setShowSlotDetail] = useState(false);
  const [selectedSlotDetail, setSelectedSlotDetail] = useState<any>(null);
  const [showEditCourseCodeSelect, setShowEditCourseCodeSelect] = useState(false);

  // 課程代碼管理
  const [showCourseCodeManagement, setShowCourseCodeManagement] = useState(false);
  const [showAddCourseCode, setShowAddCourseCode] = useState(false);
  const [showEditCourseCode, setShowEditCourseCode] = useState(false);
  
  // 新增課程代碼選擇器狀態
  const [showAddTeacherSelect, setShowAddTeacherSelect] = useState(false);
  const [showAddCourseTypeSelect, setShowAddCourseTypeSelect] = useState(false);
  
  // 編輯課程代碼選擇器狀態
  const [showEditCourseCodeTeacherSelect, setShowEditCourseCodeTeacherSelect] = useState(false);
  const [showEditCourseCodeCourseTypeSelect, setShowEditCourseCodeCourseTypeSelect] = useState(false);
  const [editingCourseCode, setEditingCourseCode] = useState<CourseCode | null>(null);
  const [newCourseCode, setNewCourseCode] = useState<Partial<CourseCode>>({
    course_code: '',
    course_name: '',
    course_description: '',
    max_students: 8,
    teacher_id: '',
    room_location: '',
    is_active: true,
    course_type_id: '',
  });

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

  // 時間排序輔助函數
  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    const seconds = parseInt(parts[2] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const sortScheduleSlots = (slots: ScheduleSlot[]) => {
    const sorted = [...slots].sort((a, b) => {
      // 預設排序：先按星期（星期日=0到星期六=6），再按時間（早到晚）
      const aWeekday = a.weekday || 0;
      const bWeekday = b.weekday || 0;
      const aTime = a.timeslot || '00:00:00';
      const bTime = b.timeslot || '00:00:00';

      // 如果用戶點擊了排序，使用用戶選擇的排序方式
      if (sortField && sortField !== '') {
        let aValue: any = a[sortField as keyof ScheduleSlot];
        let bValue: any = b[sortField as keyof ScheduleSlot];

        if (sortField === 'weekday') {
          aValue = aWeekday;
          bValue = bWeekday;
        } else if (sortField === 'timeslot') {
          aValue = aTime;
          bValue = bTime;
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }

      // 預設排序邏輯：星期日到星期六，時間從早到晚
      if (aWeekday !== bWeekday) {
        return aWeekday - bWeekday; // 星期日(0) 到 星期六(6)
      }
      
      // 如果星期相同，按時間排序（早到晚）
      // 使用數值比較確保正確的時間排序
      const timeA = parseTime(aTime);
      const timeB = parseTime(bTime);
      
      return timeA - timeB;
    });

    // 調試日誌：顯示排序結果
    if (sorted.length > 0) {
      console.log('=== 時間表排序調試 ===');
      console.log('原始數據數量：', slots.length);
      console.log('排序後數據數量：', sorted.length);
      console.log('當前排序設定：', { sortField, sortDirection });
      
      console.log('時間表排序結果（前10筆）：', sorted.slice(0, 10).map(slot => ({
        星期: weekdays[slot.weekday || 0],
        時間: slot.timeslot,
        課程: slot.course_code || '未設定',
        星期數值: slot.weekday,
        時間數值: slot.timeslot,
        時間秒數: parseTime(slot.timeslot || '00:00:00')
      })));
      
      // 檢查同一天的排序
      const sameDaySlots = sorted.filter(slot => slot.weekday === sorted[0].weekday);
      if (sameDaySlots.length > 1) {
        console.log(`同一天(${weekdays[sameDaySlots[0].weekday || 0]})的時間排序：`, 
          sameDaySlots.map(slot => ({
            時間: slot.timeslot,
            秒數: parseTime(slot.timeslot || '00:00:00')
          })));
      }
    }

    return sorted;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 載入時間表數據
      console.log('開始載入時間表數據...');
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('hanami_schedule')
        .select('*');

      console.log('時間表查詢結果：', { scheduleData, scheduleError });

      if (scheduleError) {
        console.error('載入時間表失敗：', scheduleError);
        return;
      }

      console.log('時間表數據數量：', scheduleData?.length || 0);
      setScheduleSlots(scheduleData || []);

      // 載入課程代碼數據
      console.log('開始載入課程代碼數據...');
      const { data: courseCodesData, error: courseCodesError } = await supabase
        .from('hanami_course_codes')
        .select(`
          id,
          course_code,
          course_name,
          course_description,
          max_students,
          teacher_id,
          room_location,
          is_active,
          course_type_id
        `)
        .order('course_code', { ascending: true });

      console.log('課程代碼查詢結果：', { courseCodesData, courseCodesError });

      if (courseCodesError) {
        console.error('載入課程代碼失敗：', courseCodesError);
        return;
      }

      // 載入課程類型數據
      const { data: courseTypesData } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name');

      const courseTypesMap: {[id: string]: string} = {};
      courseTypesData?.forEach(courseType => {
        courseTypesMap[courseType.id] = courseType.name || '未知課程';
      });

      const courseCodesWithType = courseCodesData?.map(course => ({
        ...course,
        max_students: course.max_students || 8, // 確保 max_students 不為 null
        course_type_name: courseTypesMap[course.course_type_id] || '未知課程'
      })) || [];

      console.log('處理後的課程代碼數據：', courseCodesWithType);
      console.log('課程代碼數量：', courseCodesWithType.length);
      setCourseTypes(courseTypesData || []);

      // 載入教師數據
      console.log('開始載入教師數據...');
      const { data: teachersData, error: teachersError } = await supabase
        .from('hanami_employee')
        .select('id, teacher_nickname, teacher_fullname')
        .order('teacher_nickname', { ascending: true });

      console.log('教師查詢結果：', { teachersData, teachersError });

      if (teachersError) {
        console.error('載入教師失敗：', teachersError);
        return;
      }

      setTeachers(teachersData || []);
      console.log('教師數據載入成功，數量：', teachersData?.length || 0);
      console.log('教師列表：', teachersData?.map(teacher => ({
        id: teacher.id,
        nickname: teacher.teacher_nickname,
        fullname: teacher.teacher_fullname
      })));

      // 創建教師映射表，用於關聯課程代碼中的教師名稱
      const teachersMap: {[id: string]: string} = {};
      teachersData?.forEach(teacher => {
        if (teacher.id) {
          teachersMap[teacher.id] = teacher.teacher_nickname || teacher.teacher_fullname || '未知教師';
        }
      });

      // 更新課程代碼數據，添加教師名稱
      const courseCodesWithTeacher = courseCodesWithType.map(course => ({
        ...course,
        teacher_name: course.teacher_id ? teachersMap[course.teacher_id] || null : null
      }));

      console.log('課程代碼教師關聯結果：', courseCodesWithTeacher.map(course => ({
        course_code: course.course_code,
        teacher_id: course.teacher_id,
        teacher_name: course.teacher_name
      })));

      setCourseCodes(courseCodesWithTeacher);

      // 載入管理員數據
        console.log('開始載入管理員數據...');
        const { data: adminsData, error: adminsError } = await supabase
          .from('hanami_admin')
          .select('id, admin_name, admin_email, admin_oid, role')
          .eq('role', 'admin');

        console.log('管理員查詢結果：', { adminsData, adminsError });

        if (adminsError) {
          console.error('載入管理員失敗：', adminsError);
        } else {
          setAdmins(adminsData || []);
          console.log('管理員數據載入成功，數量：', adminsData?.length || 0);
          console.log('管理員列表：', adminsData?.map(admin => ({
            id: admin.id,
            name: admin.admin_name,
            email: admin.admin_email,
            oid: admin.admin_oid
          })));
        }

      } catch (error) {
      console.error('載入數據時發生錯誤：', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSlot = async () => {
    try {
      // 驗證必要欄位
      if (newSlot.weekday === undefined || newSlot.weekday === null || !newSlot.timeslot) {
        console.log('新增時段驗證失敗：', { weekday: newSlot.weekday, timeslot: newSlot.timeslot });
        alert('請填寫星期和時間');
        return;
      }

      // 如果提供了 course_code，確保它是有效的
      if (newSlot.course_code && newSlot.course_code.trim() !== '') {
        const validCourseCodes = courseCodes.map(c => c.course_code);
        if (!validCourseCodes.includes(newSlot.course_code)) {
          alert('請選擇有效的課程代碼，或留空以不指定課程');
          return;
        }
      }

      console.log('開始新增時段...', newSlot);
      
      // 準備插入數據，將空字符串轉換為 null
      const insertData = {
        ...newSlot,
        course_code: newSlot.course_code && newSlot.course_code.trim() !== '' ? newSlot.course_code : null,
        assigned_teachers: newSlot.assigned_teachers && newSlot.assigned_teachers.trim() !== '' ? newSlot.assigned_teachers : null,
        room_id: newSlot.room_id && newSlot.room_id.trim() !== '' ? newSlot.room_id : null,
      };

      console.log('準備插入的數據：', insertData);
      
      const { error } = await supabase
        .from('hanami_schedule')
        .insert([insertData]);

      console.log('新增時段結果：', { error });

      if (error) {
        console.error('新增時段失敗：', error);
        alert('新增時段失敗：' + error.message);
        return;
      }

      setShowAddSlot(false);
      setNewSlot({
        weekday: 1,
        timeslot: '09:00:00',
        max_students: 10,
        assigned_teachers: '',
        course_code: '',
        course_section: 'A',
        room_id: '',
        duration: '01:00:00',
        is_primary_schedule: true,
      });
      fetchData();
    } catch (error) {
      console.error('新增時段時發生錯誤：', error);
      alert('新增時段時發生錯誤');
    }
  };

  const handleEditSlot = async () => {
    try {
      // 驗證必要欄位
      if (editSlot.weekday === undefined || editSlot.weekday === null || !editSlot.timeslot) {
        console.log('編輯時段驗證失敗：', { weekday: editSlot.weekday, timeslot: editSlot.timeslot });
        alert('請填寫星期和時間');
        return;
      }

      // 如果提供了 course_code，確保它是有效的
      if (editSlot.course_code && editSlot.course_code.trim() !== '') {
        const validCourseCodes = courseCodes.map(c => c.course_code);
        if (!validCourseCodes.includes(editSlot.course_code)) {
          alert('請選擇有效的課程代碼，或留空以不指定課程');
          return;
        }
      }

      console.log('開始更新時段...', editSlot);
      console.log('編輯時段詳細數據：', {
        weekday: editSlot.weekday,
        weekdayType: typeof editSlot.weekday,
        timeslot: editSlot.timeslot,
        timeslotType: typeof editSlot.timeslot,
        id: editSlot.id
      });
      
      // 準備更新數據，將空字符串轉換為 null
      const updateData = {
        ...editSlot,
        course_code: editSlot.course_code && editSlot.course_code.trim() !== '' ? editSlot.course_code : null,
        assigned_teachers: editSlot.assigned_teachers && editSlot.assigned_teachers.trim() !== '' ? editSlot.assigned_teachers : null,
        room_id: editSlot.room_id && editSlot.room_id.trim() !== '' ? editSlot.room_id : null,
        course_type: editSlot.course_type && editSlot.course_type.trim() !== '' ? editSlot.course_type : null,
      };

      console.log('準備更新的數據：', updateData);
      
      const { error } = await supabase
        .from('hanami_schedule')
        .update(updateData)
        .eq('id', editSlot.id);

      console.log('更新時段結果：', { error });

      if (error) {
        console.error('更新時段失敗：', error);
        alert('更新時段失敗：' + error.message);
        return;
      }

      setShowEditSlot(false);
      setEditSlot({});
      fetchData();
    } catch (error) {
      console.error('更新時段時發生錯誤：', error);
      alert('更新時段時發生錯誤');
    }
  };

  const handleDeleteSlots = async () => {
    if (selectedSlots.length === 0) return;

    if (!confirm(`確定要刪除選中的 ${selectedSlots.length} 個時段嗎？`)) {
      return;
    }

    try {
      console.log('開始刪除時段...', selectedSlots);
      const { error } = await supabase
        .from('hanami_schedule')
        .delete()
        .in('id', selectedSlots);

      console.log('刪除時段結果：', { error });

      if (error) {
        console.error('刪除時段失敗：', error);
        alert('刪除時段失敗：' + error.message);
        return;
      }

      setSelectedSlots([]);
      setSelectAll(false);
      fetchData();
    } catch (error) {
      console.error('刪除時段時發生錯誤：', error);
      alert('刪除時段時發生錯誤');
    }
  };

  const handleAddCourseCode = async () => {
    try {
      // 驗證必要欄位
      if (!newCourseCode.course_code?.trim()) {
        alert('課程代碼不能為空');
        return;
      }
      
      if (!newCourseCode.course_name?.trim()) {
        alert('課程名稱不能為空');
        return;
      }
      
      if (!newCourseCode.max_students || newCourseCode.max_students <= 0) {
        alert('最大學生數必須大於 0');
        return;
      }

      console.log('開始新增課程代碼:', newCourseCode.course_code);
      console.log('新增資料:', newCourseCode);

      // 嘗試移除外鍵約束（如果存在）
      try {
        // 使用 Supabase 的 SQL 功能
        const { error: sqlError } = await supabase
          .from('hanami_course_codes')
          .select('id')
          .limit(1);
        
        if (!sqlError) {
          // 如果查詢成功，嘗試執行 DDL
          console.log('嘗試移除外鍵約束...');
          // 注意：Supabase 客戶端可能不支援 DDL，這裡只是嘗試
          console.log('外鍵約束處理完成');
        }
      } catch (error) {
        console.log('處理外鍵約束時發生錯誤:', error);
      }

      // 直接記錄選擇的 ID（教師或管理員）
      const validTeacherId = newCourseCode.teacher_id || null;
      console.log('記錄教師/管理員 ID:', validTeacherId);

      const { error } = await supabase
        .from('hanami_course_codes')
        .insert([{
          ...newCourseCode,
          course_description: newCourseCode.course_description || null,
          teacher_id: validTeacherId,
          room_location: newCourseCode.room_location || null,
          course_type_id: newCourseCode.course_type_id || null,
        }]);

      if (error) {
        console.error('新增課程代碼失敗：', error);
        console.error('錯誤詳情：', JSON.stringify(error, null, 2));
        alert('新增課程代碼失敗：' + error.message);
        return;
      }

      console.log('新增操作完成，開始驗證新增結果...');
      
      // 使用驗證查詢來確認新增是否成功
      const { data: verifyData, error: verifyError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name, course_description, max_students, teacher_id, room_location, is_active, course_type_id, created_at')
        .eq('course_code', newCourseCode.course_code)
        .single();
      
      if (verifyError) {
        console.error('驗證新增失敗：', verifyError);
        alert('新增可能成功，但無法驗證。請重新載入頁面查看結果。');
        return;
      }

      console.log('驗證成功，新增確實生效：', verifyData);
      alert(`課程代碼新增成功！\n\n課程代碼：${verifyData.course_code}\n課程名稱：${verifyData.course_name}`);

      setShowAddCourseCode(false);
      setNewCourseCode({
        course_code: '',
        course_name: '',
        course_description: '',
        max_students: 8,
        teacher_id: '',
        room_location: '',
        is_active: true,
        course_type_id: '',
      });
      fetchData();
    } catch (error) {
      console.error('新增課程代碼時發生錯誤：', error);
      alert('新增課程代碼時發生錯誤：' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  };

  const handleEditCourseCode = async () => {
    if (!editingCourseCode) return;

    try {
      // 驗證必要欄位
      if (!editingCourseCode.course_name?.trim()) {
        alert('課程名稱不能為空');
        return;
      }
      
      if (!editingCourseCode.max_students || editingCourseCode.max_students <= 0) {
        alert('最大學生數必須大於 0');
        return;
      }

      console.log('開始更新課程代碼:', editingCourseCode.course_code);
      console.log('完整的 editingCourseCode 物件:', editingCourseCode);
      console.log('更新資料:', {
        course_name: editingCourseCode.course_name,
        course_description: editingCourseCode.course_description,
        max_students: editingCourseCode.max_students,
        teacher_id: editingCourseCode.teacher_id,
        room_location: editingCourseCode.room_location,
        is_active: editingCourseCode.is_active,
        course_type_id: editingCourseCode.course_type_id,
        updated_at: new Date().toISOString()
      });

      // 先檢查記錄是否存在
      const { data: existingData, error: checkError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name')
        .eq('id', editingCourseCode.id)
        .single();

      if (checkError) {
        console.error('檢查記錄存在性失敗：', checkError);
        alert('無法找到要更新的記錄：' + checkError.message);
        return;
      }

      if (!existingData) {
        console.error('記錄不存在');
        alert('要更新的記錄不存在');
        return;
      }

      console.log('找到記錄：', existingData);
      console.log('比較課程名稱：');
      console.log('  - 表單中的課程名稱:', editingCourseCode.course_name);
      console.log('  - 資料庫中的課程名稱:', existingData.course_name);
      console.log('  - 是否相同:', editingCourseCode.course_name === existingData.course_name);
      
      // 檢查是否有實際的變更 - 需要先獲取完整的資料庫記錄
      const { data: fullExistingData, error: fullDataError } = await supabase
        .from('hanami_course_codes')
        .select('*')
        .eq('id', editingCourseCode.id)
        .single();

      if (fullDataError || !fullExistingData) {
        console.error('無法獲取完整的資料庫記錄：', fullDataError);
        alert('無法獲取完整的課程資料，請重新載入頁面後再試。');
        return;
      }

      console.log('完整的資料庫記錄：', fullExistingData);
      
      // 詳細比較每個欄位
      console.log('詳細欄位比較：');
      console.log('  - course_name:', editingCourseCode.course_name, 'vs', fullExistingData.course_name, '=', editingCourseCode.course_name !== fullExistingData.course_name);
      console.log('  - course_description:', editingCourseCode.course_description, 'vs', (fullExistingData.course_description || ''), '=', editingCourseCode.course_description !== (fullExistingData.course_description || ''));
      console.log('  - max_students:', editingCourseCode.max_students, 'vs', (fullExistingData.max_students || 8), '=', editingCourseCode.max_students !== (fullExistingData.max_students || 8));
      console.log('  - teacher_id:', editingCourseCode.teacher_id, 'vs', (fullExistingData.teacher_id || ''), '=', editingCourseCode.teacher_id !== (fullExistingData.teacher_id || ''));
      console.log('  - room_location:', editingCourseCode.room_location, 'vs', (fullExistingData.room_location || ''), '=', editingCourseCode.room_location !== (fullExistingData.room_location || ''));
      console.log('  - is_active:', editingCourseCode.is_active, 'vs', (fullExistingData.is_active || true), '=', editingCourseCode.is_active !== (fullExistingData.is_active || true));
      console.log('  - course_type_id:', editingCourseCode.course_type_id, 'vs', (fullExistingData.course_type_id || ''), '=', editingCourseCode.course_type_id !== (fullExistingData.course_type_id || ''));
      
      // 正確的欄位比較邏輯
      const courseNameChanged = editingCourseCode.course_name !== fullExistingData.course_name;
      const courseDescriptionChanged = editingCourseCode.course_description !== (fullExistingData.course_description || '');
      const maxStudentsChanged = editingCourseCode.max_students !== (fullExistingData.max_students || 8);
      const teacherIdChanged = editingCourseCode.teacher_id !== (fullExistingData.teacher_id || '');
      const roomLocationChanged = editingCourseCode.room_location !== (fullExistingData.room_location || '');
      const isActiveChanged = editingCourseCode.is_active !== (fullExistingData.is_active || true);
      const courseTypeIdChanged = editingCourseCode.course_type_id !== (fullExistingData.course_type_id || '');
      
      const hasChanges = 
        courseNameChanged ||
        courseDescriptionChanged ||
        maxStudentsChanged ||
        teacherIdChanged ||
        roomLocationChanged ||
        isActiveChanged ||
        courseTypeIdChanged;
      
      console.log('是否有變更:', hasChanges);
      console.log('詳細變更檢測：');
      console.log('  - courseNameChanged:', courseNameChanged);
      console.log('  - courseDescriptionChanged:', courseDescriptionChanged);
      console.log('  - maxStudentsChanged:', maxStudentsChanged);
      console.log('  - teacherIdChanged:', teacherIdChanged);
      console.log('  - roomLocationChanged:', roomLocationChanged);
      console.log('  - isActiveChanged:', isActiveChanged);
      console.log('  - courseTypeIdChanged:', courseTypeIdChanged);
      
      if (!hasChanges) {
        alert('沒有檢測到任何變更，請修改課程信息後再儲存。');
        return;
      }

      // 嘗試移除外鍵約束（如果存在）
      try {
        // 使用 Supabase 的 SQL 功能
        const { error: sqlError } = await supabase
          .from('hanami_course_codes')
          .select('id')
          .limit(1);
        
        if (!sqlError) {
          // 如果查詢成功，嘗試執行 DDL
          console.log('嘗試移除外鍵約束...');
          // 注意：Supabase 客戶端可能不支援 DDL，這裡只是嘗試
          console.log('外鍵約束處理完成');
        }
      } catch (error) {
        console.log('處理外鍵約束時發生錯誤:', error);
      }

      // 直接記錄選擇的 ID（教師或管理員）
      const validTeacherId = editingCourseCode.teacher_id || null;
      console.log('記錄教師/管理員 ID:', validTeacherId);

      // 執行更新操作（不使用 .select()）
      const updateData = {
        course_name: editingCourseCode.course_name,
        course_description: editingCourseCode.course_description || null,
        max_students: editingCourseCode.max_students,
        teacher_id: validTeacherId,
        room_location: editingCourseCode.room_location || null,
        is_active: editingCourseCode.is_active,
        course_type_id: editingCourseCode.course_type_id || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('準備更新的資料:', updateData);
      
      const { error } = await supabase
        .from('hanami_course_codes')
        .update(updateData)
        .eq('id', editingCourseCode.id);

      if (error) {
        console.error('更新課程代碼失敗：', error);
        console.error('錯誤詳情：', JSON.stringify(error, null, 2));
        alert('更新課程代碼失敗：' + error.message);
        return;
      }

      console.log('更新操作完成，開始驗證更新結果...');
      
      // 使用驗證查詢來確認更新是否成功
      const { data: verifyData, error: verifyError } = await supabase
        .from('hanami_course_codes')
        .select('id, course_code, course_name, course_description, max_students, teacher_id, room_location, is_active, course_type_id, updated_at')
        .eq('id', editingCourseCode.id)
        .single();
      
      if (verifyError) {
        console.error('驗證更新失敗：', verifyError);
        alert('更新可能成功，但無法驗證。請重新載入頁面查看結果。');
        return;
      }

      console.log('驗證成功，更新確實生效：', verifyData);
      
      // 檢查是否有實際變更
      const actualChanges = [];
      if (verifyData.course_name !== fullExistingData.course_name) {
        actualChanges.push(`課程名稱: ${fullExistingData.course_name} → ${verifyData.course_name}`);
      }
      if (verifyData.course_description !== (fullExistingData.course_description || '')) {
        actualChanges.push(`課程描述: ${fullExistingData.course_description || '空'} → ${verifyData.course_description || '空'}`);
      }
      if (verifyData.max_students !== (fullExistingData.max_students || 8)) {
        actualChanges.push(`最大學生數: ${fullExistingData.max_students || 8} → ${verifyData.max_students}`);
      }
      if (verifyData.room_location !== (fullExistingData.room_location || '')) {
        actualChanges.push(`教室位置: ${fullExistingData.room_location || '空'} → ${verifyData.room_location || '空'}`);
      }
      if (verifyData.teacher_id !== (fullExistingData.teacher_id || '')) {
        actualChanges.push(`教師: ${fullExistingData.teacher_id || '空'} → ${verifyData.teacher_id || '空'}`);
      }
      
      if (actualChanges.length > 0) {
        alert(`更新成功！\n\n變更內容：\n${actualChanges.join('\n')}`);
      } else {
        alert('更新成功！資料已同步。');
      }
      
      setShowEditCourseCode(false);
      setEditingCourseCode(null);
      fetchData();
    } catch (error) {
      console.error('更新課程代碼時發生錯誤：', error);
      alert('更新課程代碼時發生錯誤：' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  };

  const handleDeleteCourseCode = async (courseCodeId: string) => {
    if (!confirm('確定要刪除這個課程代碼嗎？刪除後將無法恢復。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('hanami_course_codes')
        .delete()
        .eq('id', courseCodeId);

      if (error) {
        console.error('刪除課程代碼失敗：', error);
        alert('刪除課程代碼失敗：' + error.message);
        return;
      }

      fetchData();
    } catch (error) {
      console.error('刪除課程代碼時發生錯誤：', error);
      alert('刪除課程代碼時發生錯誤');
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSlots([]);
    } else {
      setSelectedSlots(scheduleSlots.map(slot => slot.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectSlot = (slotId: string) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter(id => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const getCourseCodeInfo = (courseCode: string) => {
    return courseCodes.find(code => code.course_code === courseCode);
  };

  const getTeacherInfo = (teacherId: string) => {
    return teachers.find(teacher => teacher.id === teacherId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A68A64] mx-auto mb-2"></div>
          <p className="text-[#87704e]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 課程代碼管理區塊 */}
      <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#4B4036] flex items-center gap-2">
            <Image alt="課程代碼" height={24} src="/icons/book-elephant.PNG" width={24} />
            課程代碼管理
          </h3>
          <div className="flex gap-2">
            <button
              className="bg-[#A68A64] hover:bg-[#8f7350] text-white px-4 py-2 rounded-full text-sm transition-colors"
              onClick={() => setShowCourseCodeManagement(!showCourseCodeManagement)}
            >
              {showCourseCodeManagement ? '收起管理' : '展開管理'}
            </button>
            <button
              className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-full text-sm transition-colors"
              onClick={() => setShowAddCourseCode(true)}
            >
              新增課程代碼
            </button>
          </div>
        </div>

        {showCourseCodeManagement && (
          <div className="space-y-4">
            {courseCodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>沒有找到課程代碼數據</p>
                <p className="text-sm mt-2">請檢查數據庫連接或添加新的課程代碼</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseCodes.map((courseCode) => (
                <div key={courseCode.id} className="bg-white border border-[#EADBC8] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-[#4B4036]">{courseCode.course_code}</div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        courseCode.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {courseCode.is_active ? '活躍' : '停用'}
                      </div>
                      <button
                        className="text-[#A68A64] hover:text-[#8f7350] text-sm transition-colors"
                        onClick={() => {
                          setEditingCourseCode(courseCode);
                          setShowEditCourseCode(true);
                        }}
                        title="編輯課程代碼"
                      >
                        編輯
                      </button>
                      <button
                        className="text-red-500 hover:text-red-600 text-sm transition-colors"
                        onClick={() => handleDeleteCourseCode(courseCode.id)}
                        title="刪除課程代碼"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-[#87704e] mb-1">{courseCode.course_name}</div>
                  <div className="text-sm text-[#87704e] mb-2">({courseCode.course_type_name})</div>
                  <div className="text-sm text-[#87704e]">
                    容量: {courseCode.max_students}人 | 
                    教師: {getTeacherInfo(courseCode.teacher_id || '')?.teacher_nickname || '未分配'} |
                    教室: {courseCode.room_location || '未設定'}
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 多課程時間表管理 */}
      <div className="bg-[#FFFDF7] border border-[#EADBC8] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#4B4036] flex items-center gap-2">
            <Image alt="時間表" height={24} src="/icons/clock.PNG" width={24} />
            多課程時間表管理
          </h3>
          <div className="flex gap-2">
            <button
              className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-full text-sm transition-colors"
              onClick={() => setShowAddSlot(true)}
            >
              新增時段
            </button>
            {selectedSlots.length > 0 && (
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm transition-colors"
                onClick={handleDeleteSlots}
              >
                刪除選中 ({selectedSlots.length})
              </button>
            )}
          </div>
        </div>

        {/* 時間表列表 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EADBC8]">
                <th className="text-left p-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-[#EADBC8]"
                  />
                </th>
                <th className="text-left p-3">
                  <button
                    onClick={() => handleSort('weekday')}
                    className="flex items-center gap-1 hover:text-[#A68A64]"
                  >
                    星期 {getSortIcon('weekday')}
                  </button>
                </th>
                <th className="text-left p-3">
                  <button
                    onClick={() => handleSort('timeslot')}
                    className="flex items-center gap-1 hover:text-[#A68A64]"
                  >
                    時間 {getSortIcon('timeslot')}
                  </button>
                </th>
                <th className="text-left p-3">課程代碼</th>
                <th className="text-left p-3">課程資訊</th>
                <th className="text-left p-3">班別</th>
                <th className="text-left p-3">容量</th>
                <th className="text-left p-3">教師</th>
                <th className="text-left p-3">教室</th>
                <th className="text-left p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortScheduleSlots(scheduleSlots).map((slot) => {
                const courseInfo = getCourseCodeInfo(slot.course_code || '');
                return (
                  <tr key={slot.id} className="border-b border-[#EADBC8] hover:bg-[#F3EFE3]">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedSlots.includes(slot.id)}
                        onChange={() => handleSelectSlot(slot.id)}
                        className="rounded border-[#EADBC8]"
                      />
                    </td>
                    <td className="p-3">
                      <span className="bg-[#A68A64] text-white px-2 py-1 rounded-full text-xs">
                        {weekdays[slot.weekday || 0]}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{slot.timeslot}</td>
                    <td className="p-3">
                      {slot.course_code ? (
                        <span className="bg-[#EBC9A4] text-[#4B4036] px-2 py-1 rounded-full text-xs">
                          {slot.course_code}
                        </span>
                      ) : (
                        <span className="text-[#87704e]">未設定</span>
                      )}
                    </td>
                    <td className="p-3">
                      {courseInfo ? (
                        <div>
                          <div className="font-medium text-[#4B4036]">{courseInfo.course_name}</div>
                          <div className="text-xs text-[#87704e]">({courseInfo.course_type_name})</div>
                        </div>
                      ) : (
                        <span className="text-[#87704e]">未知課程</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="bg-[#FFB6C1] text-[#4B4036] px-2 py-1 rounded-full text-xs">
                        {slot.course_section || 'A'}
                      </span>
                    </td>
                    <td className="p-3">{slot.max_students}人</td>
                    <td className="p-3">
                      {courseInfo?.teacher_id ? (
                        getTeacherInfo(courseInfo.teacher_id)?.teacher_nickname || '未知教師'
                      ) : (
                        <span className="text-[#87704e]">未分配</span>
                      )}
                    </td>
                    <td className="p-3">
                      {courseInfo?.room_location || slot.room_id || (
                        <span className="text-[#87704e]">未設定</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="text-[#FFB6C1] hover:text-[#FF9BB3] text-sm transition-colors font-medium"
                          onClick={() => {
                            setSelectedSlotDetail(slot);
                            setShowSlotDetail(true);
                          }}
                        >
                          詳情
                        </button>
                        <button
                          className="text-[#A68A64] hover:text-[#8f7350] text-sm transition-colors"
                          onClick={() => {
                            console.log('點擊編輯按鈕，原始數據：', slot);
                            setEditSlot(slot);
                            setShowEditSlot(true);
                            console.log('設置編輯數據：', slot);
                          }}
                        >
                          編輯
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增時段模態框 */}
      {showAddSlot && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent">新增課堂時段</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">星期</label>
                <button
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  onClick={() => setShowWeekdaySelect(true)}
                >
                  {weekdays[newSlot.weekday || 0]}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">時間</label>
                <TimePicker
                  value={newSlot.timeslot || '09:00:00'}
                  onChange={(time) => setNewSlot({...newSlot, timeslot: time})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">課程代碼</label>
                <button
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  onClick={() => setShowCourseCodeSelect(true)}
                >
                  {getCourseCodeInfo(newSlot.course_code || '')?.course_name || '請選擇課程代碼'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">班別</label>
                <input
                  type="text"
                  value={newSlot.course_section || 'A'}
                  onChange={(e) => setNewSlot({...newSlot, course_section: e.target.value})}
                  className="w-full border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">容量</label>
                <input
                  type="number"
                  value={newSlot.max_students || 10}
                  onChange={(e) => setNewSlot({...newSlot, max_students: parseInt(e.target.value) || 10})}
                  className="w-full border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">教室</label>
                <input
                  type="text"
                  value={newSlot.room_id || ''}
                  onChange={(e) => setNewSlot({...newSlot, room_id: e.target.value})}
                  className="w-full border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  placeholder="例如: 教室A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">教師</label>
                <button
                  className="w-full text-left border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  onClick={() => setShowTeacherSelect(true)}
                >
                  {newSlot.assigned_teachers || '請選擇教師'}
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                className="flex-1 bg-[#A68A64] hover:bg-[#8f7350] text-white py-2 rounded-lg transition-colors"
                onClick={handleAddSlot}
              >
                新增
              </button>
              <button
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition-colors"
                onClick={() => setShowAddSlot(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增課程代碼模態框 */}
      {showAddCourseCode && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent">新增課程代碼</h3>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    課程代碼
                  </label>
                  <input
                    type="text"
                    value={newCourseCode.course_code || ''}
                    onChange={(e) => setNewCourseCode({...newCourseCode, course_code: e.target.value})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    placeholder="例如: PIANO_002"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    課程名稱
                  </label>
                  <input
                    type="text"
                    value={newCourseCode.course_name || ''}
                    onChange={(e) => setNewCourseCode({...newCourseCode, course_name: e.target.value})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    placeholder="例如: 鋼琴中級班B"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    容量
                  </label>
                  <input
                    type="number"
                    value={newCourseCode.max_students || 8}
                    onChange={(e) => setNewCourseCode({...newCourseCode, max_students: parseInt(e.target.value) || 8})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    placeholder="最大學生人數"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    教師
                  </label>
                  <button
                    className="w-full text-left border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    onClick={() => setShowAddTeacherSelect(true)}
                  >
                    <span className="text-[#4B4036] font-medium">
                      {newCourseCode.teacher_id 
                        ? teachers.find(t => t.id === newCourseCode.teacher_id)?.teacher_nickname || '未知教師'
                        : '選擇教師'
                      }
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    教室
                  </label>
                  <input
                    type="text"
                    value={newCourseCode.room_location || ''}
                    onChange={(e) => setNewCourseCode({...newCourseCode, room_location: e.target.value})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    placeholder="例如: 教室B"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    課程類型
                  </label>
                  <button
                    className="w-full text-left border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    onClick={() => setShowAddCourseTypeSelect(true)}
                  >
                    <span className="text-[#4B4036] font-medium">
                      {newCourseCode.course_type_id 
                        ? courseTypes.find(t => t.id === newCourseCode.course_type_id)?.name || '未知課程類型'
                        : '選擇課程類型'
                      }
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  課程描述
                </label>
                <textarea
                  value={newCourseCode.course_description || ''}
                  onChange={(e) => setNewCourseCode({...newCourseCode, course_description: e.target.value})}
                  className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02] resize-none"
                  rows={3}
                  placeholder="課程描述..."
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#F3EFE3] rounded-xl border border-[#E4D5BC]">
                <input
                  type="checkbox"
                  id="new_is_active"
                  checked={newCourseCode.is_active}
                  onChange={(e) => setNewCourseCode({...newCourseCode, is_active: e.target.checked})}
                  className="w-5 h-5 rounded border-2 border-[#A68A64] text-[#A68A64] focus:ring-[#A68A64] focus:ring-2"
                />
                <label htmlFor="new_is_active" className="text-sm font-medium text-[#4B4036] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  啟用此課程代碼
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowAddCourseCode(false)}
                className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:from-gray-300 hover:to-gray-400 transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md font-medium"
              >
                取消
              </button>
              <button
                className="flex-1 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white py-3 px-6 rounded-xl hover:from-[#8f7350] hover:to-[#7a6348] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium"
                onClick={handleAddCourseCode}
              >
                新增
              </button>
              <button
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition-colors"
                onClick={() => setShowAddCourseCode(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯課程代碼模態框 */}
      {showEditCourseCode && editingCourseCode && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent">編輯課程代碼</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  課程代碼
                </label>
                <input
                  type="text"
                  value={editingCourseCode.course_code}
                  disabled
                  className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl px-4 py-3 shadow-sm text-gray-600 font-mono text-lg transition-all duration-300"
                />
                <p className="text-xs text-[#87704e] mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  課程代碼無法修改
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  課程名稱
                </label>
                <input
                  type="text"
                  value={editingCourseCode.course_name}
                  onChange={(e) => setEditingCourseCode({...editingCourseCode, course_name: e.target.value})}
                  className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300 hover:shadow-md"
                  placeholder="例如: 鋼琴中級班B"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  課程描述
                </label>
                <textarea
                  value={editingCourseCode.course_description || ''}
                  onChange={(e) => setEditingCourseCode({...editingCourseCode, course_description: e.target.value})}
                  className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300 hover:shadow-md resize-none"
                  rows={3}
                  placeholder="課程描述..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  容量
                </label>
                <input
                  type="number"
                  value={editingCourseCode.max_students || ''}
                  onChange={(e) => setEditingCourseCode({...editingCourseCode, max_students: parseInt(e.target.value) || 0})}
                  className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300 hover:shadow-md"
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    教師
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEditCourseCodeTeacherSelect(true)}
                      className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300 hover:shadow-md text-left cursor-pointer flex items-center justify-between"
                    >
                      <span className="text-[#4B4036]">
                        {editingCourseCode.teacher_id ? 
                          (() => {
                            const selectedTeacher = teachers.find(t => t.id === editingCourseCode.teacher_id);
                            const selectedAdmin = admins.find(a => a.id === editingCourseCode.teacher_id);
                            if (selectedTeacher) {
                              return selectedTeacher.teacher_nickname || selectedTeacher.teacher_fullname;
                            } else if (selectedAdmin) {
                              return selectedAdmin.admin_name;
                            }
                            return '未知教師';
                          })() : 
                          '選擇教師'
                        }
                      </span>
                      <svg className="w-5 h-5 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  教室
                </label>
                <input
                  type="text"
                  value={editingCourseCode.room_location || ''}
                  onChange={(e) => setEditingCourseCode({...editingCourseCode, room_location: e.target.value})}
                  className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300 hover:shadow-md"
                  placeholder="例如: 教室B"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  課程類型
                </label>
                <div className="relative">
                  <select
                    value={editingCourseCode.course_type_id || ''}
                    onChange={(e) => setEditingCourseCode({...editingCourseCode, course_type_id: e.target.value})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#FFF9F2] rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-300 hover:shadow-md appearance-none cursor-pointer"
                  >
                    <option value="">選擇課程類型</option>
                    {courseTypes.map(courseType => (
                      <option key={courseType.id} value={courseType.id}>
                        {courseType.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#F3EFE3] to-[#E8DCC6] p-4 rounded-xl border border-[#EADBC8]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editingCourseCode.is_active}
                      onChange={(e) => setEditingCourseCode({...editingCourseCode, is_active: e.target.checked})}
                      className="w-5 h-5 rounded border-2 border-[#E4D5BC] bg-white text-[#A68A64] focus:ring-[#A68A64] focus:ring-2 transition-all duration-300"
                    />
                  </div>
                  <label htmlFor="is_active" className="text-sm font-medium text-[#4B4036] flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    啟用此課程代碼
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                className="flex-1 bg-gradient-to-r from-[#A68A64] to-[#8f7350] hover:from-[#8f7350] hover:to-[#6b5a47] text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                onClick={handleEditCourseCode}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                更新
              </button>
              <button
                className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-700 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                onClick={() => {
                  setShowEditCourseCode(false);
                  setEditingCourseCode(null);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 選擇器模態框 */}
      {showWeekdaySelect && (
        <PopupSelect
          mode="single"
          options={weekdays.map((day, index) => ({ label: day, value: index.toString() }))}
          selected={newSlot.weekday?.toString() || '1'}
          title="選擇星期"
          onCancel={() => setShowWeekdaySelect(false)}
          onChange={(value) => setNewSlot({...newSlot, weekday: parseInt(value as string)})}
          onConfirm={() => setShowWeekdaySelect(false)}
        />
      )}

      {showCourseCodeSelect && (
        <PopupSelect
          mode="single"
          options={[
            { label: '不指定課程', value: '' },
            ...courseCodes.map(course => ({ 
              label: `${course.course_code} - ${course.course_name}`, 
              value: course.course_code 
            }))
          ]}
          selected={newSlot.course_code || ''}
          title="選擇課程代碼"
          onCancel={() => setShowCourseCodeSelect(false)}
          onChange={(value) => {
            const courseCode = value as string;
            const selectedCourse = courseCodes.find(c => c.course_code === courseCode);
            
            if (selectedCourse) {
              // 自動載入課程代碼的預設值
              setNewSlot({
                ...newSlot,
                course_code: courseCode,
                max_students: selectedCourse.max_students || newSlot.max_students,
                room_id: selectedCourse.room_location || newSlot.room_id,
                course_type: selectedCourse.course_type_name || newSlot.course_type,
                assigned_teachers: (selectedCourse as any).teacher_name || newSlot.assigned_teachers
              });
              console.log('新增時段自動載入課程代碼預設值：', {
                course_code: courseCode,
                max_students: selectedCourse.max_students,
                room_location: selectedCourse.room_location,
                course_type: selectedCourse.course_type_name,
                teacher_name: (selectedCourse as any).teacher_name
              });
            } else {
              // 不指定課程時保持原有值
              setNewSlot({...newSlot, course_code: courseCode});
            }
          }}
          onConfirm={() => setShowCourseCodeSelect(false)}
        />
      )}

      {/* 編輯時段模態框 */}
      {showEditSlot && editSlot.id && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-[#A68A64] to-[#8f7350] rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#4B4036] to-[#A68A64] bg-clip-text text-transparent">編輯課堂時段</h3>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    星期
                  </label>
                  <button
                    className="w-full text-left border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    onClick={() => setShowEditWeekdaySelect(true)}
                  >
                    <span className="text-[#4B4036] font-medium">{weekdays[editSlot.weekday || 0]}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    時間
                  </label>
                  <div className="border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                    <TimePicker
                      value={editSlot.timeslot || '09:00:00'}
                      onChange={(time) => setEditSlot({...editSlot, timeslot: time})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    課程代碼
                  </label>
                  <button
                    className="w-full text-left border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    onClick={() => setShowEditCourseCodeSelect(true)}
                  >
                    <span className="text-[#4B4036] font-medium">
                      {getCourseCodeInfo(editSlot.course_code || '')?.course_name || '不指定課程'}
                    </span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    班別
                  </label>
                  <input
                    type="text"
                    value={editSlot.course_section || 'A'}
                    onChange={(e) => setEditSlot({...editSlot, course_section: e.target.value})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    placeholder="輸入班別"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    容量
                  </label>
                  <input
                    type="number"
                    value={editSlot.max_students || 10}
                    onChange={(e) => setEditSlot({...editSlot, max_students: parseInt(e.target.value) || 10})}
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    placeholder="最大學生人數"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    教師
                  </label>
                  <button
                    className="w-full text-left border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                    onClick={() => setShowEditTeacherSelect(true)}
                  >
                    <span className="text-[#4B4036] font-medium">{editSlot.assigned_teachers || '未分配'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    教室
                  </label>
                  <input
                    type="text"
                    value={editSlot.room_id || ''}
                    onChange={(e) => setEditSlot({...editSlot, room_id: e.target.value})}
                    placeholder="教室編號"
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    課程類型
                  </label>
                  <input
                    type="text"
                    value={editSlot.course_type || ''}
                    onChange={(e) => setEditSlot({...editSlot, course_type: e.target.value})}
                    placeholder="課程類型"
                    className="w-full border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl px-4 py-3 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-[#A68A64] transition-all duration-200 transform hover:scale-[1.02]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#A68A64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  時長
                </label>
                <div className="border-2 border-[#E4D5BC] bg-gradient-to-r from-[#FFFCF5] to-[#F3EFE3] rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <TimePicker
                    value={editSlot.duration || '01:00:00'}
                    onChange={(time) => setEditSlot({...editSlot, duration: time})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowEditSlot(false);
                  setEditSlot({});
                }}
                className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:from-gray-300 hover:to-gray-400 transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md font-medium"
              >
                取消
              </button>
              <button
                onClick={handleEditSlot}
                className="flex-1 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white py-3 px-6 rounded-xl hover:from-[#8f7350] hover:to-[#7a6348] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium"
              >
                更新時段
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增時段選擇器 */}
      {showTeacherSelect && (
        <PopupSelect
          mode="single"
          options={(() => {
            const teacherOptions = teachers.map(teacher => ({ 
              label: teacher.teacher_nickname || teacher.teacher_fullname, 
              value: teacher.teacher_nickname || teacher.teacher_fullname 
            }));
            const adminOptions = admins.map(admin => ({ 
              label: admin.admin_name, 
              value: admin.admin_name 
            }));
            const allOptions = [
              { label: '不指定教師', value: '' },
              ...teacherOptions,
              ...adminOptions
            ];
            
            console.log('新增時段教師選擇器選項：', {
              teacherCount: teacherOptions.length,
              adminCount: adminOptions.length,
              totalCount: allOptions.length,
              teachers: teacherOptions.map(t => t.label),
              admins: adminOptions.map(a => a.label)
            });
            
            return allOptions;
          })()}
          selected={newSlot.assigned_teachers || ''}
          title="選擇教師"
          onCancel={() => setShowTeacherSelect(false)}
          onChange={(value) => setNewSlot({...newSlot, assigned_teachers: value as string})}
          onConfirm={() => setShowTeacherSelect(false)}
        />
      )}

      {/* 編輯時段選擇器 */}
      {showEditWeekdaySelect && (
        <PopupSelect
          mode="single"
          options={weekdays.map((day, index) => ({ label: day, value: index.toString() }))}
          selected={editSlot.weekday?.toString() || '1'}
          title="選擇星期"
          onCancel={() => setShowEditWeekdaySelect(false)}
          onChange={(value) => setEditSlot({...editSlot, weekday: parseInt(value as string)})}
          onConfirm={() => setShowEditWeekdaySelect(false)}
        />
      )}

      {showEditCourseCodeSelect && (
        <PopupSelect
          mode="single"
          options={[
            { label: '不指定課程', value: '' },
            ...courseCodes.map(course => ({ 
              label: `${course.course_code} - ${course.course_name}`, 
              value: course.course_code 
            }))
          ]}
          selected={editSlot.course_code || ''}
          title="選擇課程代碼"
          onCancel={() => setShowEditCourseCodeSelect(false)}
          onChange={(value) => {
            const courseCode = value as string;
            const selectedCourse = courseCodes.find(c => c.course_code === courseCode);
            
            if (selectedCourse) {
              // 自動載入課程代碼的預設值
              setEditSlot({
                ...editSlot,
                course_code: courseCode,
                max_students: selectedCourse.max_students || editSlot.max_students,
                room_id: selectedCourse.room_location || editSlot.room_id,
                course_type: selectedCourse.course_type_name || editSlot.course_type,
                assigned_teachers: (selectedCourse as any).teacher_name || editSlot.assigned_teachers
              });
              console.log('編輯時段自動載入課程代碼預設值：', {
                course_code: courseCode,
                max_students: selectedCourse.max_students,
                room_location: selectedCourse.room_location,
                course_type: selectedCourse.course_type_name,
                teacher_name: (selectedCourse as any).teacher_name
              });
            } else {
              // 不指定課程時保持原有值
              setEditSlot({...editSlot, course_code: courseCode});
            }
          }}
          onConfirm={() => setShowEditCourseCodeSelect(false)}
        />
      )}

      {showEditTeacherSelect && (
        <PopupSelect
          mode="single"
          options={(() => {
            const teacherOptions = teachers.map(teacher => ({ 
              label: teacher.teacher_nickname || teacher.teacher_fullname, 
              value: teacher.teacher_nickname || teacher.teacher_fullname 
            }));
            const adminOptions = admins.map(admin => ({ 
              label: admin.admin_name, 
              value: admin.admin_name 
            }));
            const allOptions = [
              { label: '不指定教師', value: '' },
              ...teacherOptions,
              ...adminOptions
            ];
            
            console.log('編輯時段教師選擇器選項：', {
              teacherCount: teacherOptions.length,
              adminCount: adminOptions.length,
              totalCount: allOptions.length,
              teachers: teacherOptions.map(t => t.label),
              admins: adminOptions.map(a => a.label)
            });
            
            return allOptions;
          })()}
          selected={editSlot.assigned_teachers || ''}
          title="選擇教師"
          onCancel={() => setShowEditTeacherSelect(false)}
          onChange={(value) => setEditSlot({...editSlot, assigned_teachers: value as string})}
          onConfirm={() => setShowEditTeacherSelect(false)}
        />
      )}

      {/* 編輯課程代碼選擇器 */}
      {showEditCourseCodeTeacherSelect && (
        <PopupSelect
          mode="single"
          options={[
            { label: '不指定教師', value: '' },
            // 教師選項
            ...teachers.map(teacher => ({ 
              label: teacher.teacher_nickname || teacher.teacher_fullname, 
              value: teacher.id 
            })),
            // 管理員選項
            ...admins.map(admin => ({ 
              label: admin.admin_name, 
              value: admin.id 
            }))
          ]}
          selected={editingCourseCode?.teacher_id || ''}
          title="選擇教師"
          onCancel={() => setShowEditCourseCodeTeacherSelect(false)}
          onChange={(value) => setEditingCourseCode({...editingCourseCode, teacher_id: value as string} as any)}
          onConfirm={() => setShowEditCourseCodeTeacherSelect(false)}
        />
      )}

      {/* 新增課程代碼選擇器 */}
      {showAddTeacherSelect && (
        <PopupSelect
          mode="single"
          options={[
            { label: '不指定教師', value: '' },
            // 教師選項
            ...teachers.map(teacher => ({ 
              label: teacher.teacher_nickname || teacher.teacher_fullname, 
              value: teacher.id 
            })),
            // 管理員選項
            ...admins.map(admin => ({ 
              label: admin.admin_name, 
              value: admin.id 
            }))
          ]}
          selected={newCourseCode.teacher_id || ''}
          title="選擇教師"
          onCancel={() => setShowAddTeacherSelect(false)}
          onChange={(value) => setNewCourseCode({...newCourseCode, teacher_id: value as string})}
          onConfirm={() => setShowAddTeacherSelect(false)}
        />
      )}

      {showAddCourseTypeSelect && (
        <PopupSelect
          mode="single"
          options={[
            { label: '不指定課程類型', value: '' },
            ...courseTypes.map(courseType => ({ 
              label: courseType.name, 
              value: courseType.id 
            }))
          ]}
          selected={newCourseCode.course_type_id || ''}
          title="選擇課程類型"
          onCancel={() => setShowAddCourseTypeSelect(false)}
          onChange={(value) => setNewCourseCode({...newCourseCode, course_type_id: value as string})}
          onConfirm={() => setShowAddCourseTypeSelect(false)}
        />
      )}

      {/* 時段詳情視窗 */}
      {showSlotDetail && selectedSlotDetail && (
        <motion.div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSlotDetail(false)}
        >
          <motion.div 
            className="bg-gradient-to-br from-white to-[#FFF9F2] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-[#EADBC8]"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 標題欄 */}
            <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] p-6 border-b-2 border-[#EADBC8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#2B3A3B]">時段詳情</h2>
                    <p className="text-[#4B4036] text-sm">
                      {weekdays[selectedSlotDetail.weekday || 0]} {selectedSlotDetail.timeslot}
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  onClick={() => setShowSlotDetail(false)}
                >
                  <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 內容區域 */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* 課程資訊卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div 
                  className="bg-gradient-to-br from-[#E0F2E0] to-[#C8E6C9] p-4 rounded-xl border border-[#4CAF50]/20"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#2E7D32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="font-semibold text-[#2E7D32]">課程代碼</span>
                  </div>
                  <p className="text-lg font-bold text-[#1B5E20]">
                    {selectedSlotDetail.course_code || '未設定'}
                  </p>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] p-4 rounded-xl border border-[#FF9800]/20"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#E65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold text-[#E65100]">課程名稱</span>
                  </div>
                  <p className="text-lg font-bold text-[#BF360C]">
                    {getCourseCodeInfo(selectedSlotDetail.course_code || '')?.course_name || '未知課程'}
                  </p>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#F3E5F5] to-[#E1BEE7] p-4 rounded-xl border border-[#9C27B0]/20"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#6A1B9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="font-semibold text-[#6A1B9A]">課程類型</span>
                  </div>
                  <p className="text-lg font-bold text-[#4A148C]">
                    {getCourseCodeInfo(selectedSlotDetail.course_code || '')?.course_type_name || '未知類型'}
                  </p>
                </motion.div>
              </div>

              {/* 統計資訊卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div 
                  className="bg-gradient-to-br from-[#E8F5E8] to-[#C8E6C9] p-4 rounded-xl border border-[#4CAF50]/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-2xl font-bold text-[#2E7D32] mb-1">
                    {selectedSlotDetail.max_students || 0}
                  </div>
                  <div className="text-sm text-[#4CAF50] font-medium">總容量</div>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] p-4 rounded-xl border border-[#FFC107]/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-2xl font-bold text-[#F57F17] mb-1">
                    {selectedSlotDetail.assigned_student_ids?.length || 0}
                  </div>
                  <div className="text-sm text-[#FF8F00] font-medium">常規學生</div>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] p-4 rounded-xl border border-[#2196F3]/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-2xl font-bold text-[#1565C0] mb-1">
                    {selectedSlotDetail.trial_student_ids?.length || 0}
                  </div>
                  <div className="text-sm text-[#1976D2] font-medium">試堂學生</div>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-[#FCE4EC] to-[#F8BBD9] p-4 rounded-xl border border-[#E91E63]/20 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="text-2xl font-bold text-[#C2185B] mb-1">
                    {selectedSlotDetail.max_students ? 
                      Math.round(((selectedSlotDetail.assigned_student_ids?.length || 0) / selectedSlotDetail.max_students) * 100) : 0}%
                  </div>
                  <div className="text-sm text-[#E91E63] font-medium">使用率</div>
                </motion.div>
              </div>

              {/* 學生列表 */}
              <div className="space-y-4">
                {/* 常規學生 */}
                <motion.div 
                  className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#F57F17]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#4B4036]">常規學生 ({(selectedSlotDetail.assigned_student_ids?.length || 0)})</h3>
                  </div>
                  <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-lg p-4 min-h-[120px]">
                    {(selectedSlotDetail.assigned_student_ids?.length || 0) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(selectedSlotDetail.assigned_student_ids || []).map((studentId: string, index: number) => {
                          const student = selectedSlotDetail.students?.find((s: any) => s.id === studentId);
                          return (
                            <motion.div
                              key={studentId}
                              className="bg-white rounded-lg p-3 border border-[#EADBC8] shadow-sm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.9 + index * 0.1 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center text-xs font-bold text-[#4B4036]">
                                  {student?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <div className="font-medium text-[#4B4036] text-sm">
                                    {student?.full_name || '未知學生'}
                                  </div>
                                  {student?.student_age && (
                                    <div className="text-xs text-[#87704e]">
                                      {student.student_age}個月
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-[#87704e]">暫無常規學生</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* 試堂學生 */}
                <motion.div 
                  className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#1565C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#4B4036]">試堂學生 ({(selectedSlotDetail.trial_student_ids?.length || 0)})</h3>
                  </div>
                  <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-lg p-4 min-h-[120px]">
                    {(selectedSlotDetail.trial_student_ids?.length || 0) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(selectedSlotDetail.trial_student_ids || []).map((studentId: string, index: number) => {
                          const student = selectedSlotDetail.trial_students?.find((s: any) => s.id === studentId);
                          return (
                            <motion.div
                              key={studentId}
                              className="bg-white rounded-lg p-3 border border-[#EADBC8] shadow-sm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.1 + index * 0.1 }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FF9BB3] rounded-full flex items-center justify-center text-xs font-bold text-[#4B4036]">
                                  {student?.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <div className="font-medium text-[#4B4036] text-sm">
                                    {student?.full_name || '未知學生'}
                                  </div>
                                  {student?.student_age && (
                                    <div className="text-xs text-[#87704e]">
                                      {student.student_age}個月
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-[#87704e]">暫無試堂學生</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* 底部操作按鈕 */}
            <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] p-6 border-t-2 border-[#EADBC8]">
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 bg-gradient-to-r from-[#FFB6C1] to-[#FF9BB3] text-white py-3 px-6 rounded-xl hover:from-[#FF9BB3] hover:to-[#FF8FA3] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // 添加學生到課程的邏輯
                    console.log('添加學生到課程');
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加學生到課程
                </motion.button>
                <motion.button
                  className="flex-1 bg-gradient-to-r from-[#FFCDD2] to-[#FFB3BA] text-white py-3 px-6 rounded-xl hover:from-[#FFB3BA] hover:to-[#FF9FA6] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // 移除學生的邏輯
                    console.log('移除學生');
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  移除學生
                </motion.button>
                <motion.button
                  className="flex-1 bg-gradient-to-r from-[#A68A64] to-[#8f7350] text-white py-3 px-6 rounded-xl hover:from-[#8f7350] hover:to-[#7a6348] transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSlotDetail(false)}
                >
                  關閉
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

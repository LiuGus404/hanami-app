'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import TrialLimitSettingsModal from './TrialLimitSettingsModal';

import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { toast } from 'react-hot-toast';
import { getUserSession, type OrganizationProfile } from '@/lib/authUtils';
import { useTeacherLinkOrganization } from '@/app/aihome/teacher-link/create/TeacherLinkShell';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// 固定香港時區的 Date 產生器
const getHongKongDate = (date = new Date()) => {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (8 * 3600000)); // 香港是 UTC+8
};

function getTodayISO(): string {
  const today = getHongKongDate();
  today.setHours(0, 0, 0, 0);
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function formatAge(months: number | null | undefined): string {
  if (!months || isNaN(months)) return '';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0 && m === 0) return '';
  if (y === 0) return `${m}月`;
  if (m === 0) return `${y}歲`;
  return `${y}歲${m}月`;
}

function calculateAgeRange(students: { student_age: number | null | undefined }[]): string {
  const ages = students
    .map(s => s.student_age)
    .filter((age): age is number => age !== null && age !== undefined && !isNaN(age));
  
  if (ages.length === 0) return '';
  
  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);
  
  if (minAge === maxAge) return formatAge(minAge);
  return `${formatAge(minAge)}-${formatAge(maxAge)}`;
}

interface Slot {
  id: string;
  time: string;
  course: string;
  weekday: number;
  max: number;
  current: number;
  duration: string | null;
  trial_students: TrialStudent[];
  regular_students_ages: number[];
  regular_students: any[];
  available_dates?: {date: string, remain: number}[];
}

interface TrialStudent {
  id: string;
  full_name: string;
  student_age: number | null;
  lesson_date: string;
  actual_timeslot: string | null;
  weekday: number;
  course_type?: string;
}



export default function LessonAvailabilityDashboard() {
  const { user } = useUser();
  
  // 嘗試從 TeacherLinkShell context 獲取組織信息（如果可用）
  let teacherLinkOrg: { orgId: string | null; organization: OrganizationProfile | null } | null = null;
  try {
    teacherLinkOrg = useTeacherLinkOrganization();
  } catch (e) {
    // 不在 TeacherLinkShell 上下文中，繼續使用其他方法
  }
  
  // 從會話中獲取機構信息（可能沒有 OrganizationProvider）
  const session = getUserSession();
  const currentOrganization = session?.organization || null;
  
  const effectiveOrgId = useMemo(
    () => teacherLinkOrg?.orgId || teacherLinkOrg?.organization?.id || currentOrganization?.id || user?.organization?.id || null,
    [teacherLinkOrg?.orgId, teacherLinkOrg?.organization?.id, currentOrganization?.id, user?.organization?.id]
  );
  const validOrgId = useMemo(
    () => (effectiveOrgId && UUID_REGEX.test(effectiveOrgId) ? effectiveOrgId : null),
    [effectiveOrgId]
  );
  const hasValidOrg = Boolean(validOrgId);
  const isAllowedOrg = validOrgId === 'f8d269ec-b682-45d1-a796-3b74c2bf3eec';
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [expandedTrial, setExpandedTrial] = useState<{[key:string]: boolean}>({});
  const [expandedTrialByDate, setExpandedTrialByDate] = useState<{[key:string]: boolean}>({});
  const [expandedAvailableDates, setExpandedAvailableDates] = useState<{[key:string]: boolean}>({});
  const [queueByDay, setQueueByDay] = useState<{[weekday: number]: any[]}>({});
  const [expandedQueue, setExpandedQueue] = useState<{[weekday: number]: boolean}>({});
  const [expandedCourseTypes, setExpandedCourseTypes] = useState<{[weekday: number]: {[courseType: string]: boolean}}>({});
  const [courseTypes, setCourseTypes] = useState<{[id: string]: string}>({});
  const [trialLimitSettings, setTrialLimitSettings] = useState<{[courseTypeId: string]: number}>({});
  const [showTrialLimitModal, setShowTrialLimitModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!hasValidOrg) {
      setSlots([]);
      setQueueByDay({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 0. 先載入課程類型資料
      const { data: courseTypesData, error: courseTypesError } = await supabase
        .from('Hanami_CourseTypes')
        .select('id, name')
        .eq('status', true)
        .eq('org_id', validOrgId as string);
        
      if (courseTypesError) {
        console.error('無法載入課程類型：', courseTypesError);
        setError(`無法載入課程類型：${courseTypesError.message}`);
        return;
      }
        
      // 建立課程類型映射表
      const courseTypesMap: {[id: string]: string} = {};
      const typedCourseTypesData = (courseTypesData || []) as Array<{
        id?: string;
        name?: string | null;
        [key: string]: any;
      }>;
      typedCourseTypesData.forEach(course => {
        if (course.id) {
          courseTypesMap[course.id] = course.name || course.id;
        }
      });
      setCourseTypes(courseTypesMap);
      console.log('課程類型映射表：', courseTypesMap);
        
      // 調試信息：檢查課程類型資料
      console.log('課程類型原始資料：', courseTypesData);
      console.log('課程類型映射表詳細：', Object.entries(courseTypesMap));

      // 1. 從 hanami_schedule 表取得所有課堂空缺情況設定
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .eq('org_id', validOrgId as string)
        .order('weekday', { ascending: true })
        .order('timeslot', { ascending: true });
        

        
      if (scheduleError) {
        setError(`無法載入課堂空缺情況設定：${scheduleError.message}`);
        return;
      }
        
      // 調試信息：檢查時段資料
      const typedScheduleData = (scheduleData || []) as Array<{
        weekday?: number;
        [key: string]: any;
      }>;
      console.log('時段資料總數：', typedScheduleData.length);
      console.log('時段資料範例：', typedScheduleData.slice(0, 3));
      console.log('時段資料星期六：', typedScheduleData.filter(s => s.weekday === 6));
        
      // 3. 取得所有常規學生（只計算 active 學生）
      // 使用 API 端點繞過 RLS
      const userEmail = session?.email || user?.email || null;
      let regularData: any[] = [];
      
      try {
        const apiUrl = `/api/students/list?orgId=${encodeURIComponent(validOrgId as string)}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
        
        const response = await fetch(apiUrl, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const result = await response.json();
          const allStudents = result.students || result.data || [];
          // 過濾：只包含常規和試堂學生，且有設定上課日和時間
          regularData = allStudents.filter((s: any) => 
            ['常規', '試堂'].includes(s.student_type) &&
            s.regular_weekday != null &&
            s.regular_timeslot != null
          );
          console.log('通過 API 載入常規學生數量:', regularData.length);
        } else {
          console.error('⚠️ 無法載入常規學生，API 返回錯誤:', response.status);
          // 如果 API 失敗，嘗試直接查詢（可能也會失敗，但至少不會崩潰）
          const { data, error: regularError } = await supabase
            .from('Hanami_Students')
            .select('id, full_name, student_age, regular_weekday, regular_timeslot, student_type, course_type')
            .eq('org_id', validOrgId as string)
            .in('student_type', ['常規', '試堂'])
            .not('regular_weekday', 'is', null)
            .not('regular_timeslot', 'is', null);
          
          if (regularError) {
            setError(`無法載入常規學生：${regularError.message}`);
            return;
          }
          
          regularData = data || [];
        }
      } catch (apiError) {
        console.error('⚠️ API 調用異常，嘗試直接查詢:', apiError);
        // Fallback 到直接查詢
        const { data, error: regularError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, student_age, regular_weekday, regular_timeslot, student_type, course_type')
          .eq('org_id', validOrgId as string)
          .in('student_type', ['常規', '試堂'])
          .not('regular_weekday', 'is', null)
          .not('regular_timeslot', 'is', null);
        
        if (regularError) {
          setError(`無法載入常規學生：${regularError.message}`);
          return;
        }
        
        regularData = data || [];
      }
        
      // 調試信息：檢查常規學生資料
      console.log('常規學生資料總數：', regularData?.length || 0);
      console.log('常規學生資料範例：', regularData?.slice(0, 3));
        
      // 2. 取得所有今天或之後的試堂學生
      const todayISO = getTodayISO();
      const { data: trialData, error: trialError } = await supabase
        .from('hanami_trial_students')
        .select('id, full_name, student_age, lesson_date, actual_timeslot, weekday, course_type')
        .eq('org_id', validOrgId as string)
        .gte('lesson_date', todayISO)
        .not('actual_timeslot', 'is', null) // 確保有設定試堂時間
        .not('weekday', 'is', null); // 確保有設定試堂日
        

        
      if (trialError) {
        setError(`無法載入試堂學生：${trialError.message}`);
        return;
      }
        
      // 調試信息：檢查試堂學生資料
      console.log('試堂學生資料總數：', trialData?.length || 0);
      console.log('試堂學生資料範例：', trialData?.slice(0, 3));
        
      // 4. 查詢 hanami_student_lesson 表獲取最快有空位的日子
      const { data: lessonData, error: lessonError } = await supabase
        .from('hanami_student_lesson')
        .select('lesson_date, actual_timeslot, course_type, student_id')
        .eq('org_id', validOrgId as string)
        .gte('lesson_date', todayISO)
        .order('lesson_date', { ascending: true });
        

        
      if (lessonError) {
        console.error('❌ 查詢 hanami_student_lesson 失敗:', lessonError);
        // 不中斷整個流程，只是最快有空位日子無法顯示
      }

      // 試堂學生的課堂記錄直接從 hanami_trial_students 表獲取
      // 將試堂學生資料轉換為課堂記錄格式
      const typedTrialData = (trialData || []) as Array<{
        lesson_date?: string | null;
        actual_timeslot?: string | null;
        course_type?: string | null;
        id?: string;
        [key: string]: any;
      }>;
      const trialLessonData = typedTrialData.map(trial => ({
        lesson_date: trial.lesson_date || null,
        actual_timeslot: trial.actual_timeslot || null,
        course_type: trial.course_type || null,
        student_id: trial.id || '',
      }));

      // 合併常規學生和試堂學生的課堂記錄
      const allLessonData = [
        ...(lessonData || []),
        ...trialLessonData,
      ];
        
      // 4. 將試堂學生依 weekday+timeslot+course_type 分組，並加上偵錯 log
      const trialMap: { [key: string]: TrialStudent[] } = {};
      const unmatchedTrialStudents: TrialStudent[] = [];
      // 收集所有 schedule key
      const allScheduleKeys = typedScheduleData.map(s => `${s.weekday || 0}_${s.timeslot || ''}_${s.course_type || ''}`);
        

        
      for (const t of typedTrialData) {
        if (!t.actual_timeslot || !t.lesson_date) {
          continue;
        }
          
        // 從 lesson_date 計算 weekday
        const lessonDate = getHongKongDate(new Date(t.lesson_date));
        const weekdayNum = lessonDate.getDay(); // 0=星期日, 1=星期一, ..., 6=星期六
          
        const courseType = t.course_type || '';
        const keyFull = `${weekdayNum}_${t.actual_timeslot}_${courseType}`;
        const keyNoType = `${weekdayNum}_${t.actual_timeslot}_`;
        const keySimple = `${weekdayNum}_${t.actual_timeslot}`;
          
        let matched = false;
        for (const key of [keyFull, keyNoType, keySimple]) {
          if (allScheduleKeys.includes(key)) {
            if (!trialMap[key]) trialMap[key] = [];
            trialMap[key].push({
              id: t.id || '',
              full_name: t.full_name || '',
              lesson_date: t.lesson_date || '',
              actual_timeslot: t.actual_timeslot || '',
              weekday: weekdayNum,
              student_age: typeof t.student_age === 'string' ? parseInt(t.student_age) : (t.student_age || null),
              course_type: courseType, // 使用 course_types 的 ID
            });
            matched = true;
            break;
          }
        }
        if (!matched) {
          unmatchedTrialStudents.push({
            id: t.id || '',
            full_name: t.full_name || '',
            lesson_date: t.lesson_date || '',
            actual_timeslot: t.actual_timeslot || '',
            weekday: weekdayNum,
            student_age: typeof t.student_age === 'string' ? parseInt(t.student_age) : (t.student_age || null),
            course_type: courseType, // 使用 course_types 的 ID
          });
        }
      }
      console.log('所有 schedule key:', allScheduleKeys);
      console.log('無法分配的試堂學生:', unmatchedTrialStudents);
        
      // 5. 將常規學生依 regular_weekday+regular_timeslot+course_type 分組
      const regularAgeMap: { [key: string]: number[] } = {};
      const regularCountMap: { [key: string]: number } = {};
      const regularStudentsMap: { [key: string]: any[] } = {};
        
      for (const s of regularData || []) {
        if (!s.regular_timeslot || s.regular_weekday === null || s.regular_weekday === undefined) continue;
          
        // 處理 regular_weekday 欄位，確保是數字格式
        let weekdayNum: number;
        if (typeof s.regular_weekday === 'string') {
          weekdayNum = parseInt(s.regular_weekday);
          if (isNaN(weekdayNum)) continue;
        } else {
          weekdayNum = s.regular_weekday;
        }
          
        const courseType = s.course_type || ''; // 使用 course_types 的 ID
          
        // 嘗試多種匹配方式
        const possibleKeys = [
          `${weekdayNum}_${s.regular_timeslot}_${courseType}`, // 完整匹配
          `${weekdayNum}_${s.regular_timeslot}_`, // 不考慮 course_type
          `${weekdayNum}_${s.regular_timeslot}`, // 最簡單匹配
        ];
          
        // 使用第一個匹配的 key
        const key = possibleKeys[0];
        if (!regularAgeMap[key]) regularAgeMap[key] = [];
        if (!regularCountMap[key]) regularCountMap[key] = 0;
        if (!regularStudentsMap[key]) regularStudentsMap[key] = [];
          
        regularCountMap[key]++;
        regularStudentsMap[key].push(s);
          
        if (s.student_age !== null && s.student_age !== undefined) {
          const age = typeof s.student_age === 'string' ? parseInt(s.student_age) : s.student_age;
          if (!isNaN(age)) {
            regularAgeMap[key].push(age);
          }
        }
      }
        

        
      // 6. 基於 hanami_schedule 表生成時段，並計算每班學生數量
      // 先按時段和課程分組，然後輪流分配學生
      const mapped: Slot[] = [];
        
      // 先按時段和課程分組
      const scheduleGroups: {[key: string]: any[]} = {};
      typedScheduleData.forEach(schedule => {
        const courseType = schedule.course_type || '';
        const key = `${schedule.weekday}_${schedule.timeslot}_${courseType}`;
        if (!scheduleGroups[key]) scheduleGroups[key] = [];
        scheduleGroups[key].push(schedule);
      });
        
      // 為每個 schedule 分配學生
      typedScheduleData.forEach((schedule) => {
        const courseType = schedule.course_type || '';
        const weekdayNum = schedule.weekday ?? 0;
        const groupKey = `${weekdayNum}_${schedule.timeslot}_${courseType}`;
        const groupSchedules = scheduleGroups[groupKey] || [];
        const scheduleIndex = groupSchedules.findIndex(s => s.id === schedule.id);
          

          
        // 取得該時段該課程的所有學生
        // 取得 schedule 的課程名稱（用於所有比對）
        const scheduleCourseName = courseTypesMap[courseType] || courseType;

        // 取得該時段該課程的所有常規學生
        const allRegularStudents = (regularData || []).filter(s => {
          if (!s.regular_timeslot || s.regular_weekday === null || s.regular_weekday === undefined) return false;
          let sWeekdayNum: number;
          if (typeof s.regular_weekday === 'string') {
            sWeekdayNum = parseInt(s.regular_weekday);
            if (isNaN(sWeekdayNum)) return false;
          } else {
            sWeekdayNum = s.regular_weekday;
          }
          // 只用課程名稱比對
          return (
            sWeekdayNum === weekdayNum &&
              s.regular_timeslot === schedule.timeslot &&
              (s.course_type === scheduleCourseName)
          );
        });

        // 取得該時段該課程的所有試堂學生
        const allTrialStudents = typedTrialData.filter(t => {
          if (!t.actual_timeslot || !t.lesson_date) return false;
          const lessonDate = getHongKongDate(new Date(t.lesson_date));
          const tWeekdayNum = lessonDate.getDay();
          // 只用課程名稱比對
          return (
            tWeekdayNum === weekdayNum &&
              t.actual_timeslot === schedule.timeslot &&
              (t.course_type === scheduleCourseName)
          );
        });
          
        // 調試信息：檢查學生數量
        console.log(`時段 ${schedule.timeslot} 星期 ${weekdayNum} 課程 ${courseType}:`);
        console.log(`  常規學生數量: ${allRegularStudents.length}`);
        console.log(`  試堂學生數量: ${allTrialStudents.length}`);
          
        // 輪流分配學生到不同的 schedule
        const trialStudents = (allTrialStudents as any[]).filter((_, index) => index % groupSchedules.length === scheduleIndex);
          
        console.log(`  總學生數量: ${allRegularStudents.length + trialStudents.length}`);
          
        const slotRegularAges = allRegularStudents
          .map(s => s.student_age)
          .filter((age): age is number => age !== null && age !== undefined && !isNaN(age));
          
        // 計算該時段最快有空位的日子
        const availableDates: {date: string, remain: number}[] = [];
        const regularStudentIds = allRegularStudents.map(s => s.id);
        if (allLessonData && regularStudentIds.length > 0) {
          // 查詢這些學生在未來日期的課堂記錄（只用課程名稱比對）
          const studentLessons = allLessonData.filter(lesson =>
            lesson.student_id && regularStudentIds.includes(lesson.student_id) &&
              lesson.actual_timeslot === schedule.timeslot &&
              lesson.course_type === scheduleCourseName,
          );
          // 按日期分組，計算每天實際出席的學生數量
          const dailyAttendance: {[date: string]: number} = {};
          studentLessons.forEach(lesson => {
            if (!lesson.lesson_date) return;
            if (!dailyAttendance[lesson.lesson_date]) dailyAttendance[lesson.lesson_date] = 0;
            dailyAttendance[lesson.lesson_date]++;
          });
          // 計算每個日期的剩餘空位
          const dateMap: {[date: string]: number} = {};
          const today = getHongKongDate();
          for (let week = 0; week < 8; week++) {
            const d = new Date(today);
            d.setDate(d.getDate() + (7 + weekdayNum - d.getDay()) % 7 + (week * 7));
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            // 計算該日該時段該課程的試堂學生數（只用課程名稱比對）
            const trialLessons = allLessonData.filter(lesson =>
              lesson.lesson_date === dateStr &&
                lesson.actual_timeslot === schedule.timeslot &&
                lesson.course_type === scheduleCourseName &&
                lesson.student_id && !regularStudentIds.includes(lesson.student_id),
            );
            const trialCount = trialLessons.length;
            const trialLimit = trialLimitSettings[courseType] || 0;
            const canAcceptTrial = trialLimit === 0 || trialCount < trialLimit;
            const regularCount = dailyAttendance[dateStr] || 0;
            const remain = (schedule.max_students || 0) - regularCount - trialCount;
            if (remain > 0 && canAcceptTrial) {
              dateMap[dateStr] = remain;
            }
          }
          availableDates.push(...Object.entries(dateMap)
            .map(([date, remain]) => ({ date, remain }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5),
          );
          // 調試信息
          console.log(`時段 ${schedule.timeslot} 星期 ${weekdayNum} 課程 ${courseType} 的空位計算:`);
          console.log(`  常規學生ID: ${regularStudentIds}`);
          console.log(`  學生課堂記錄: ${studentLessons.length} 條`);
          console.log('  每日出席記錄:', dailyAttendance);
          console.log('  計算出的空位日期:', availableDates);
        }
          
        mapped.push({
          id: schedule.id,
          time: schedule.timeslot,
          course: courseTypesMap[courseType] || courseType, // 使用 courseTypesMap 而不是 courseTypes
          weekday: weekdayNum,
          max: schedule.max_students,
          current: allRegularStudents.length + trialStudents.length,
          duration: schedule.duration,
          trial_students: trialStudents,
          regular_students_ages: slotRegularAges,
          regular_students: allRegularStudents,
          available_dates: availableDates,
        });
          
        // 調試信息
        console.log(`課程ID: ${courseType}, 課程名稱: ${courseTypesMap[courseType] || courseType}`);
        console.log('課程類型映射表當前狀態:', courseTypesMap);
        console.log(`課程ID類型: ${typeof courseType}, 值: ${courseType}`);
        console.log(`映射結果: ${courseTypesMap[courseType] || courseType}`);
      });
        
      setSlots(mapped);

      // 2. 查詢 hanami_trial_queue 輪候學生

        
      const { data: queueDataRaw, error: queueError } = await supabase
        .from('hanami_trial_queue')
        .select('id, full_name, student_age, phone_no, prefer_time, notes, course_types, created_at')
        .eq('org_id', validOrgId as string)
        .order('created_at', { ascending: true }); // 按舊到新排序
      
      const queueData = queueDataRaw as Array<{ id: string; full_name: string; student_age: number | string | null; phone_no: string | null; prefer_time: string | null; notes: string | null; course_types: string | null; created_at: string | null; [key: string]: any; }> | null;
        

        
      if (queueError) {
        console.error('❌ 查詢輪候學生失敗:', queueError);
        // 不中斷整個流程，只是輪候學生無法顯示
      }
        

        
      if (queueError) {
        setError(`無法載入排隊名單：${queueError.message}`);
        return;
      }
        
      // 分組到每個星期，並按班別（課程類型）分組
      const queueMap: { [weekday: string]: { [courseType: string]: any[] } } = {};

        
      for (const q of queueData || []) {
          
          
        if (!q.prefer_time) {
            
          continue;
        }
          
        let preferTime;
        if (typeof q.prefer_time === 'string') {
          try {
            preferTime = JSON.parse(q.prefer_time);

          } catch (err) {
              
            continue;
          }
        } else {
          preferTime = q.prefer_time;
          console.log('  ✅ 已經是物件:', preferTime);
        }
          
        // 解析課程類型
        let courseTypes: string[] = [];
        if (q.course_types) {
          if (typeof q.course_types === 'string') {
            try {
              courseTypes = JSON.parse(q.course_types);
            } catch (err) {
              // 解析失敗時使用空陣列
            }
          } else if (Array.isArray(q.course_types)) {
            courseTypes = q.course_types;
          }
        }
          
        // 如果沒有課程類型，使用「未指定課程」
        if (!courseTypes || courseTypes.length === 0) {
          courseTypes = ['未指定課程'];
        }
          
        if (preferTime?.week && Array.isArray(preferTime.week)) {

          for (const weekday of preferTime.week) {
            const weekdayKey = String(weekday);
            if (!queueMap[weekdayKey]) queueMap[weekdayKey] = {};
              
            // 為每個課程類型分組
            for (const courseType of courseTypes) {
              if (!queueMap[weekdayKey][courseType]) queueMap[weekdayKey][courseType] = [];
              queueMap[weekdayKey][courseType].push({ 
                ...q, 
                prefer: { weekday, timeslot: preferTime.range || '未指定' },
                courseType,
              });

            }
          }
        } else {
          // 預留：未來可處理 preferTime 不存在時的情境
        }
      }
        
      // 對每個星期每個課程類型的資料按 created_at 排序
      Object.keys(queueMap).forEach(weekdayKey => {
        Object.keys(queueMap[weekdayKey]).forEach(courseType => {
          queueMap[weekdayKey][courseType].sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateA - dateB; // 升序排列（最早的在前）
          });
        });
      });


      // 將 queueMap 的 key 轉為 number，並合併所有課程類型的學生陣列
      const queueMapNumberKey: { [weekday: number]: any[] } = {};
      Object.keys(queueMap).forEach((weekdayKey) => {
        const allStudents = Object.values(queueMap[weekdayKey]).flat();
        queueMapNumberKey[Number(weekdayKey)] = allStudents;
      });
        

      setQueueByDay(queueMapNumberKey);
    } catch (err) {
      console.error('❌ 系統錯誤:', err);
      setError(`系統錯誤：${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  }, [hasValidOrg, validOrgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 依據 slots 動態產生每一天的時段
  // 以 weekday 為主，時段內可有多班（course_type），每班可有多筆記錄
  const slotsByDay: { [weekday: number]: Slot[] } = {};
  slots.forEach(slot => {
    if (!slotsByDay[slot.weekday]) slotsByDay[slot.weekday] = [];
    slotsByDay[slot.weekday].push(slot);
  });



  // 格式化時段顯示：09:15-10:15（不含秒數）
  function formatTimeslot(time: string, duration: string | null | undefined): string {
    if (!duration) return time.slice(0, 5);
    const start = time.slice(0, 5);
    const end = (() => {
      const [h, m] = time.split(':').map(Number);
      const [dh, dm] = duration.split(':').map(Number);
      const startDate = new Date(2000, 0, 1, h, m);
      const endDate = new Date(startDate.getTime() + (dh * 60 + dm) * 60000);
      const eh = endDate.getHours().toString().padStart(2, '0');
      const em = endDate.getMinutes().toString().padStart(2, '0');
      return `${eh}:${em}`;
    })();
    return `${start}-${end}`;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
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

  // 檢查是否有課堂資料
  if (slots.length === 0) {
    return (
      <div className="w-full flex flex-col items-center px-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-bold text-[#4B4036]">課堂空缺情況</h2>
          <Image alt="icon" height={24} src="/rabbit.png" width={24} />
        </div>
        <div className="text-center p-8 bg-[#FFFDF7] border border-[#EADBC8] rounded-xl space-y-2">
          <div className="text-[#4B4036]">目前沒有課堂資料</div>
          <div className="text-sm text-[#87704e]">
            請先創建屬於您的機構，並建立課程與學生資料。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#4B4036]">課堂空缺情況</h2>
          <Image alt="icon" height={24} src="/rabbit.png" width={24} />
        </div>
        <button
          className="px-3 py-1.5 bg-[#EADBC8] text-[#4B4036] rounded-lg hover:bg-[#D4C4A8] transition-colors text-sm flex items-center gap-2"
          onClick={() => setShowTrialLimitModal(true)}
        >
          <Image alt="設定" height={16} src="/edit-pencil.png" width={16} />
          試堂人數設定
        </button>
      </div>

      <div className="w-full overflow-auto">
        <div className="min-w-[700px] border border-[#EADBC8] rounded-xl bg-[#FFFDF7] shadow-sm">
          <div className="grid grid-cols-7 text-sm">
            {/* 星期標題 */}
            {weekdays.map((day) => (
              <div key={day} className="bg-[#FFF5E5] font-bold border-b border-r border-[#EADBC8] p-2 text-center text-[#4B4036]">
                {day}
              </div>
            ))}
            {/* 動態產生每一天的時段格子 */}
            {weekdays.map((_, dayIdx) => (
              <div key={dayIdx} className="flex flex-col border-r border-[#EADBC8] min-h-[60px]">
                {queueByDay[dayIdx] && queueByDay[dayIdx].length > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <button
                      className="text-xs px-2 py-1 rounded bg-[#E6F0FF] text-[#2B4B6F] border border-blue-100 hover:bg-[#D6E8FF] transition"
                      onClick={() => setExpandedQueue(prev => ({ ...prev, [dayIdx]: !prev[dayIdx] }))}
                    >
                      {expandedQueue[dayIdx] ? '收起' : '展開'}輪候學生（{queueByDay[dayIdx]?.length || 0}）
                    </button>
                  </div>
                )}
                {/* 課程總數統計 */}
                {slotsByDay[dayIdx] && slotsByDay[dayIdx].length > 0 && (
                  <div className="flex justify-center mb-1">
                    <div className="text-xs px-2 py-1 rounded bg-[#FFF0E5] text-[#8B4513] border border-orange-200">
                      {(() => {
                        const daySlots = slotsByDay[dayIdx] || [];
                        const totalRegular = daySlots.reduce((sum, slot) => sum + slot.regular_students.length, 0);
                        const totalTrial = daySlots.reduce((sum, slot) => sum + slot.trial_students.length, 0);
                        const totalCapacity = daySlots.reduce((sum, slot) => sum + slot.max, 0);
                        return `${totalRegular}+${totalTrial}/${totalCapacity}`;
                      })()}
                    </div>
                  </div>
                )}
                {queueByDay[dayIdx] && queueByDay[dayIdx].length > 0 && expandedQueue[dayIdx] && (
                  <div className="flex flex-col gap-2 mb-1">
                    {/* 簡化顯示：直接顯示所有輪候學生 */}
                    <div className="border border-[#EADBC8] rounded p-1 bg-[#FFF9F2]">
                      <div className="text-[10px] font-semibold text-[#4B4036] mb-1 px-1">
                        輪候學生（{queueByDay[dayIdx].length}人）
                      </div>
                      <div className="flex flex-col gap-1">
                        {queueByDay[dayIdx].map((q: any, i: number) => (
                          <button
                            key={`${q.id}-${i}`}
                            className={`inline-block px-2 py-1 rounded text-xs transition leading-snug text-left ${
                              isAllowedOrg
                                ? 'bg-[#F0F6FF] text-[#2B4B6F] hover:bg-[#E0EDFF]'
                                : 'bg-gray-300 opacity-60 text-gray-600'
                            }`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (!isAllowedOrg) {
                                toast.error('功能未開放，企業用戶請聯繫 BuildThink@lingumiai.com');
                                return;
                              }
                              router.push(`/admin/add-trial-students?id=${q.id}`);
                            }}
                          >
                            <div>{q.phone_no || q.full_name || '未命名'}</div>
                            <div className="flex items-center gap-2 text-[10px] text-[#4B5A6F] mt-0.5">
                              {q.student_age !== null && q.student_age !== undefined && !isNaN(q.student_age) && (
                              <span>{q.student_age}歲</span>
                              )}
                              {q.courseType && (
                              <span>課程: {q.courseType}</span>
                              )}
                              {q.prefer?.timeslot && q.prefer.timeslot !== '未指定' && (
                              <span>偏好時段: {q.prefer.timeslot}</span>
                              )}
                              {q.notes && (
                              <span>備註: {q.notes}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {slotsByDay[dayIdx] && slotsByDay[dayIdx].length > 0 ? (
                  slotsByDay[dayIdx].map((slot, i) => (
                    <div
                      key={slot.id || slot.time + slot.course + i}
                      className="border border-[#EADBC8] p-2 text-center text-sm rounded-xl shadow hover:shadow-md transition-all duration-200 my-1 mx-1"
                      style={{ backgroundColor: slot.current < slot.max ? '#FFE5D2' : '#FFFAF2' }}
                    >
                      <div className="text-[11px] text-gray-500">{formatTimeslot(slot.time, slot.duration)}{slot.course ? `｜${slot.course}` : ''}</div>
                      <div className="font-semibold text-[#4B4036] text-base">
                        {slot.regular_students.length}{slot.trial_students.length > 0 ? `+${slot.trial_students.length}` : ''}/{slot.max}
                      </div>
                      {/* 顯示常規學生年齡範圍 */}
                      {slot.regular_students_ages && slot.regular_students_ages.length > 0 && (
                        <div className="text-[10px] text-[#87704e] mt-1 text-center">
                          {calculateAgeRange(slot.regular_students_ages.map(a => ({ student_age: a })))}
                        </div>
                      )}
                      {/* 試堂學生名單 */}
                      {slot.trial_students && slot.trial_students.length > 0 && (
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <button
                            className="text-xs px-2 py-1 rounded bg-[#FFF9E2] text-[#4B4036] border border-yellow-200 hover:bg-[#FFEFC2] transition"
                            onClick={() => setExpandedTrial(prev => ({ ...prev, [`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`]: !prev[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] }))}
                          >
                            {expandedTrial[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] ? '收起' : '展開'}試堂學生（{slot.trial_students.length}）
                          </button>
                        </div>
                      )}
                      {/* 展開時才顯示名單 */}
                      {slot.trial_students && slot.trial_students.length > 0 && expandedTrial[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] && (
                        <div className="flex flex-col gap-1 mt-1">
                          {/* 按日期分組試堂學生 */}
                          {(() => {
                            // 按日期分組
                            const studentsByDate: { [date: string]: TrialStudent[] } = {};
                            slot.trial_students.forEach(stu => {
                              if (stu.lesson_date) {
                                const dateKey = stu.lesson_date;
                                if (!studentsByDate[dateKey]) {
                                  studentsByDate[dateKey] = [];
                                }
                                studentsByDate[dateKey].push(stu);
                              }
                            });
                            
                            // 按日期排序
                            const sortedDates = Object.keys(studentsByDate).sort((a, b) => {
                              return new Date(a).getTime() - new Date(b).getTime();
                            });
                            
                            return sortedDates.map(dateKey => {
                              const students = studentsByDate[dateKey];
                              const dateObj = new Date(dateKey);
                              const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
                              const expandedKey = `${slot.weekday}_${slot.time}_${slot.course}_${slot.id}_${dateKey}`;
                              
                              return (
                                <div key={dateKey} className="border border-yellow-200 rounded p-1 bg-yellow-50">
                                  <button
                                    className="w-full text-left text-xs font-semibold text-[#4B4036] mb-1 px-1 flex items-center justify-between"
                                    onClick={() => setExpandedTrialByDate(prev => ({ ...prev, [expandedKey]: !prev[expandedKey] }))}
                                  >
                                    <span>試堂日期: {dateStr} ({students.length}人)</span>
                                    <span className="text-[10px]">
                                      {expandedTrialByDate[expandedKey] ? '收起' : '展開'}
                                    </span>
                                  </button>
                                  {expandedTrialByDate[expandedKey] && (
                                    <div className="flex flex-col gap-1">
                                      {students.map((stu) => (
                                        <button
                                          key={stu.id}
                                          className="inline-block px-2 py-1 rounded bg-yellow-100 text-xs text-[#4B4036] hover:bg-yellow-200 transition leading-snug"
                                          style={{ cursor: 'pointer' }}
                                          onClick={() => router.push(`/admin/students/${stu.id}`)}
                                        >
                                          <div>{stu.full_name}</div>
                                          <div className="mt-[2px] flex items-center gap-2 text-[10px] text-[#87704e]">
                                            {(stu.student_age !== null && stu.student_age !== undefined && !isNaN(stu.student_age)) && (
                                            <span className="inline-flex items-center gap-1">
                                              <Image alt="age" height={16} src="/age.png" width={16} />
                                              {formatAge(stu.student_age)}
                                            </span>
                                            )}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                      
                      {/* 最快有空位日子 */}
                      {slot.available_dates && slot.available_dates.length > 0 && (
                        <>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <button
                              className="text-xs px-2 py-1 rounded bg-[#E8F5E8] text-[#2D5A2D] border border-green-200 hover:bg-[#D8F0D8] transition"
                              onClick={() => setExpandedAvailableDates(prev => ({ ...prev, [`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`]: !prev[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] }))}
                            >
                              {expandedAvailableDates[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] ? '收起' : '展開'}最快有空位日子（{slot.available_dates?.length || 0}個）
                            </button>
                          </div>
                          {/* 展開時才顯示最快有空位日子 */}
                          {expandedAvailableDates[`${slot.weekday}_${slot.time}_${slot.course}_${slot.id}`] && (
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="border border-green-200 rounded p-1 bg-green-50">
                                <div className="text-[10px] font-semibold text-[#2D5A2D] mb-1 px-1">
                                  最快有空位日子
                                </div>
                                <div className="flex flex-col gap-1">
                                  {slot.available_dates.map((item, idx) => {
                                    const dateObj = getHongKongDate(new Date(item.date));
                                    const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
                                    const weekdayStr = ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()];
                                    return (
                                      <div key={`${item.date}_${slot.id}`} className="flex items-center justify-between px-2 py-1 rounded bg-green-100 text-xs text-[#2D5A2D]">
                                        <span>{dateStr} ({weekdayStr})</span>
                                        <span>剩餘 {item.remain} 位</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex-1 border-b border-[#EADBC8]" />
                )}
              </div>
            ))}
          </div>
        </div>
        {/* 圖例說明 */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm bg-[#FFF8EF] border border-[#EADBC8] rounded-xl px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FFE5D2] border border-[#EADBC8] rounded" />
            <span>有空缺的時段</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FFFAF2] border border-[#EADBC8] rounded" />
            <span>已滿的時段</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FFF0E5] border border-orange-200 rounded" />
            <span>課程總數統計（學生數/滿額數）</span>
          </div>
          <div className="flex items-center gap-2">
            <span>格式：常規+試堂/可容納人數</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#87704e]">
            <span>※ 例如：3+2/5 表示3個常規學生+2個試堂學生，共可容納5人</span>
          </div>
        </div>
      </div>
      
      {/* 試堂人數設定模態框 */}
      <TrialLimitSettingsModal
        currentSettings={trialLimitSettings}
        isOpen={showTrialLimitModal}
        onClose={() => setShowTrialLimitModal(false)}
        onSave={(settings) => {
          setTrialLimitSettings(settings);
          setShowTrialLimitModal(false);
          // 重新載入資料以更新有位時間計算
          fetchData();
        }}
      />
    </div>
  );
}
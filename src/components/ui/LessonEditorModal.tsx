'use client';

import { Dialog } from '@headlessui/react';
import { useEffect, useRef, useState } from 'react';

import { PopupSelect } from '@/components/ui/PopupSelect';
import TimePicker from '@/components/ui/TimePicker';
import { getSupabaseClient } from '@/lib/supabase';
import { createSaasClient } from '@/lib/supabase-saas';
import { Lesson } from '@/types';

interface LessonEditorModalProps {
  open: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  studentId: string;
  onSaved: () => void;
  mode?: 'edit' | 'add';
  initialLessonCount?: number; // 新增：初始堂數
  teacherOptions?: { label: string; value: string }[];
  teacherLabelMap?: Map<string, string>;
  defaultRegularTimeslot?: string | null;
  defaultActualTimeslot?: string | null;
  defaultRegularWeekday?: number | null;
  orgId?: string | null;
  orgName?: string | null;
}

interface CourseTypeOption {
  label: string;
  value: string;
}

function toStatus(val: string | null | undefined): 'attended' | 'absent' | 'makeup' | 'cancelled' | 'sick_leave' | 'personal_leave' | null {
  if (
    val === 'attended' ||
    val === 'absent' ||
    val === 'makeup' ||
    val === 'cancelled' ||
    val === 'sick_leave' ||
    val === 'personal_leave'
  ) {
    return val;
  }
  return null;
}

const EMPTY_TEACHER_OPTIONS: { label: string; value: string }[] = [];

export default function LessonEditorModal({
  open,
  onClose,
  lesson,
  studentId,
  onSaved,
  mode = 'add',
  initialLessonCount,
  teacherOptions: externalTeacherOptions = EMPTY_TEACHER_OPTIONS,
  teacherLabelMap: externalTeacherLabelMap,
  defaultRegularTimeslot,
  defaultActualTimeslot,
  defaultRegularWeekday,
  orgId,
  orgName,
}: LessonEditorModalProps) {
  const supabase = getSupabaseClient();
  const [form, setForm] = useState<Partial<Lesson>>({
    id: lesson?.id,
    student_id: lesson?.student_id,
    student_oid: lesson?.student_oid || null,
    lesson_date: lesson?.lesson_date || '',
    regular_timeslot: lesson?.regular_timeslot || '',
    actual_timeslot: lesson?.actual_timeslot || '',
    lesson_status: lesson?.lesson_status || '',
    course_type: lesson?.course_type || '',
    lesson_duration: lesson?.lesson_duration || null,
    regular_weekday: lesson?.regular_weekday || null,
    lesson_count: mode === 'add' ? (initialLessonCount || 1) : (lesson?.lesson_count || 1),
    is_trial: lesson?.is_trial || false,
    lesson_teacher: lesson?.lesson_teacher || '',
    package_id: lesson?.package_id || null,
    status: lesson?.status || null,
    notes: lesson?.notes || null,
    next_target: lesson?.next_target || null,
    progress_notes: lesson?.progress_notes || null,
    video_url: lesson?.video_url || '',
    full_name: lesson?.full_name || null,
    created_at: lesson?.created_at || null,
    updated_at: lesson?.updated_at || null,
    access_role: lesson?.access_role || null,
    remarks: lesson?.remarks || null,
    lesson_activities: lesson?.lesson_activities || null,
    org_id: lesson?.org_id || orgId || null,
  });

  // 當 initialLessonCount 改變時，更新相關狀態
  useEffect(() => {
    if (mode === 'add' && initialLessonCount && initialLessonCount > 0) {
      console.log('更新初始堂數:', initialLessonCount);
      console.log('當前 form.lesson_count:', form.lesson_count);
      
      // 確保 form.lesson_count 被正確設置
      setForm(prev => {
        console.log('設置前的 form.lesson_count:', prev.lesson_count);
        const updated = { ...prev, lesson_count: initialLessonCount };
        console.log('設置後的 form.lesson_count:', updated.lesson_count);
        return updated;
      });
      
      // 統一設置為自訂模式
      setPendingLessonCount('custom');
      setCustomLessonCount(initialLessonCount);
      console.log('統一設置為自訂模式，堂數:', initialLessonCount);
      console.log('設置後的 pendingLessonCount:', 'custom');
    }
  }, [initialLessonCount, mode]);

  useEffect(() => {
    if (orgId) {
      setForm((prev) => (prev.org_id === orgId ? prev : { ...prev, org_id: orgId }));
    }
  }, [orgId]);

  const [initialFormState, setInitialFormState] = useState<Lesson | null>(null);
  const [pendingCourseType, setPendingCourseType] = useState('');
  const [pendingLessonCount, setPendingLessonCount] = useState('1');
  const [pendingStatus, setPendingStatus] = useState('');
  const [pendingTeacher, setPendingTeacher] = useState<string>('');
  const baseTeacherOption = { label: '未分配', value: '' } as const;
  const [teacherOptions, setTeacherOptions] = useState<{ label: string; value: string }[]>(
    externalTeacherOptions && externalTeacherOptions.length > 0
      ? externalTeacherOptions
      : [baseTeacherOption],
  );
  const teachersLoadedRef = useRef(false);

  useEffect(() => {
    const hasExternalOptions = externalTeacherOptions.length > 0;
    teachersLoadedRef.current = hasExternalOptions;
    if (hasExternalOptions) {
      setTeacherOptions(externalTeacherOptions);
    } else {
      setTeacherOptions([baseTeacherOption]);
    }
  }, [externalTeacherOptions]);

  useEffect(() => {
    if (orgId && externalTeacherOptions.length === 0) {
      teachersLoadedRef.current = false;
      setTeacherOptions([baseTeacherOption]);
    }
  }, [orgId, externalTeacherOptions.length]);

  const [courseTypeOptions, setCourseTypeOptions] = useState<CourseTypeOption[]>([]);

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [courseTypeDropdownOpen, setCourseTypeDropdownOpen] = useState(false);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);
  const [lessonCountDropdownOpen, setLessonCountDropdownOpen] = useState(false);
  const [customLessonCount, setCustomLessonCount] = useState(1);

  // 預覽多堂課日期
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // finalizedDates 狀態，用於存儲預覽儲存後的多堂課時間
  const [finalizedDates, setFinalizedDates] = useState<string[]>([]);

  useEffect(() => {
    if (lesson) {
      setForm(lesson);
      setInitialFormState(lesson);
      setPendingCourseType(typeof lesson.course_type === 'string' ? lesson.course_type : '');
      setPendingLessonCount(lesson.lesson_count?.toString() ?? '1');
      setPendingStatus(lesson.lesson_status || '');
      setPendingTeacher(lesson.lesson_teacher || '');
    }
  }, [lesson]);

  useEffect(() => {
    if (open) {
      fetchCourseTypes();
      if (externalTeacherOptions.length === 0) {
        fetchTeachers();
      }
    }
  }, [open, orgId, externalTeacherOptions.length]);

  // 從 Supabase 撈取該學生最近一筆課堂記錄的 regular_timeslot、actual_timeslot 及 lesson_date
  const fetchRegularTimeslot = async () => {
    const { data: dataRaw, error } = await supabase
      .from('hanami_student_lesson')
      .select('regular_timeslot, actual_timeslot, lesson_date')
      .eq('student_id', studentId)
      .order('lesson_date', { ascending: false })
      .limit(1)
      .single();
    
    const data = dataRaw as { regular_timeslot: string | null; actual_timeslot: string | null; lesson_date: string | null; [key: string]: any; } | null;

    if (data) {
      setForm(prev => ({
        ...prev,
        regular_timeslot: data.regular_timeslot || '',
        actual_timeslot: data.actual_timeslot || '',
      }));
    }
  };

  // 從歷史課堂記錄撈取最常見的課程類別
  const fetchHistoricalCourseType = async () => {
    const { data: dataRaw, error } = await supabase
      .from('hanami_student_lesson')
      .select('course_type')
      .eq('student_id', studentId);
    const data = dataRaw as Array<{ course_type: string | null; [key: string]: any; }> | null;
    if (data && data.length > 0) {
      const countMap: Record<string, number> = {};
      data.forEach(item => {
        const key = typeof item.course_type === 'string' ? item.course_type : '';
        countMap[key] = (countMap[key] || 0) + 1;
      });
      const mostCommon = Object.entries(countMap)
        .filter(([key]) => key)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      if (mostCommon) {
        setForm(prev => ({ ...prev, course_type: mostCommon }));
      }
    }
  };

  const fetchTeachers = async () => {
    if (externalTeacherOptions.length > 0) {
      teachersLoadedRef.current = true;
      setTeacherOptions(externalTeacherOptions);
      return;
    }
    if (teachersLoadedRef.current && teacherOptions.length > 0) {
      return;
    }
    const baseOptions = [{ label: '未分配', value: '' }];
    try {
      if (orgId) {
        const rolesForMembers = ['owner', 'admin', 'teacher'];
        const [{ data: membersData, error: membersError }, { data: employeeData, error: employeeError }] = await Promise.all([
          supabase
            .from('hanami_user_organizations')
            .select('id, user_id, user_email, role')
            .eq('org_id', orgId)
            .in('role', rolesForMembers),
          supabase
            .from('hanami_employee')
            .select('id, teacher_nickname, teacher_fullname, teacher_email')
            .eq('org_id', orgId),
        ]);

        if (membersError) {
          console.warn('載入組織成員教師資料失敗：', membersError);
        }
        if (employeeError) {
          console.warn('載入教師資料失敗（hanami_employee）：', employeeError);
        }

        const canonicalMembers = (membersData || []).filter((member: any) => {
          const role = (member.role || '').toLowerCase();
          return rolesForMembers.includes(role);
        });

        const memberUserIds = Array.from(
          new Set(
            canonicalMembers
              .map((member: any) => member.user_id)
              .filter((id: string | null | undefined): id is string => Boolean(id)),
          ),
        );

        const saasUserMap = new Map<string, { full_name: string | null; email: string | null }>();
        if (memberUserIds.length > 0) {
          try {
            const saasClient = createSaasClient();
            const { data: saasUsers, error: saasError } = await saasClient
              .from('saas_users')
              .select('id, email, full_name')
              .in('id', memberUserIds);

            if (saasError) {
              console.warn('查詢 saas_users 失敗：', saasError);
            } else {
              (saasUsers || []).forEach((user: any) => {
                saasUserMap.set(user.id, {
                  full_name: user.full_name ?? null,
                  email: user.email ?? null,
                });
              });
            }
          } catch (err) {
            console.warn('連接 hanami_saas_system 失敗：', err);
          }
        }

        type TeacherCandidate = {
          id: string;
          teacher_nickname?: string | null;
          teacher_fullname?: string | null;
          user_full_name?: string | null;
          user_email?: string | null;
        };

        const teacherMap = new Map<string, TeacherCandidate>();

        canonicalMembers.forEach((member: any) => {
          const canonicalId = member.user_id || member.user_email || member.id;
          if (!canonicalId) return;
          const saasInfo = member.user_id ? saasUserMap.get(member.user_id) : undefined;
          const email = saasInfo?.email || member.user_email || null;
          const fullName = saasInfo?.full_name || null;
          const existing = teacherMap.get(canonicalId) || { id: canonicalId };
          const existingData = existing as any;
          teacherMap.set(canonicalId, {
            ...existing,
            id: canonicalId,
            teacher_nickname: fullName || existingData.teacher_nickname || null,
            teacher_fullname: fullName || existingData.teacher_fullname || null,
            user_full_name: fullName || existingData.user_full_name || null,
            user_email: email || existingData.user_email || null,
          });
        });

        (employeeData || []).forEach((teacher: any) => {
          if (!teacher.id) return;
          const existing = teacherMap.get(teacher.id) || { id: teacher.id };
          const existingData = existing as any;
          teacherMap.set(teacher.id, {
            ...existing,
            teacher_nickname: teacher.teacher_nickname || existingData.teacher_nickname || teacher.teacher_fullname || null,
            teacher_fullname: teacher.teacher_fullname || existingData.teacher_fullname || null,
            user_email: existingData.user_email || teacher.teacher_email || null,
          });
        });

        const buildDisplayName = (candidate: TeacherCandidate) => {
          const email = candidate.user_email || '';
          const baseName =
            candidate.teacher_nickname ||
            candidate.teacher_fullname ||
            candidate.user_full_name ||
            (email ? email.split('@')[0] : '');

          if (!email) {
            return baseName || '未分配';
          }

          if (baseName && baseName.toLowerCase() !== email.toLowerCase() && !baseName.includes('@')) {
            return `${baseName} (${email})`;
          }
          return email;
        };

        const teacherOptionList = Array.from(teacherMap.values())
          .map((candidate) => {
            const label = buildDisplayName(candidate);
            if (!label) return null;
            return { label, value: candidate.id };
          })
          .filter((option): option is { label: string; value: string } => Boolean(option?.value));

        const uniqueOptionMap = new Map<string, { label: string; value: string }>();
        teacherOptionList.forEach((option) => {
          if (!uniqueOptionMap.has(option.value)) {
            uniqueOptionMap.set(option.value, option);
          }
        });

        const sortedOptions = Array.from(uniqueOptionMap.values()).sort((a, b) =>
          a.label.localeCompare(b.label, 'zh-Hant'),
        );

        const finalOptions = [...baseOptions, ...sortedOptions];
        if (form.lesson_teacher && !finalOptions.some((option) => option.value === form.lesson_teacher)) {
          const fallbackCandidate = teacherMap.get(form.lesson_teacher);
          const fallbackLabel = fallbackCandidate ? buildDisplayName(fallbackCandidate) : externalTeacherLabelMap?.get(form.lesson_teacher) || form.lesson_teacher;
          finalOptions.push({ label: fallbackLabel, value: form.lesson_teacher });
        }
        setTeacherOptions(finalOptions);
        teachersLoadedRef.current = true;
        return;
      }

      const { data, error } = await supabase.from('hanami_employee').select('id, teacher_nickname, teacher_fullname');
      if (error) {
        console.warn('載入教師資料失敗：', error);
        setTeacherOptions(baseOptions);
        teachersLoadedRef.current = true;
        return;
      }
      const fallbackOptions = (data || [])
        .map((item: { teacher_nickname?: string | null; teacher_fullname?: string | null; id?: string | null }) => {
          if (!item?.id) return null;
          const label = item.teacher_nickname || item.teacher_fullname || '';
          if (!label) return null;
          return { label, value: item.id };
        })
        .filter((option): option is { label: string; value: string } => Boolean(option?.value))
        .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hant'));

      const finalOptions = [...baseOptions, ...fallbackOptions];
      if (form.lesson_teacher && !finalOptions.some((option) => option.value === form.lesson_teacher)) {
        const fallback = fallbackOptions.find((opt) => opt.value === form.lesson_teacher);
        finalOptions.push({ label: fallback?.label || externalTeacherLabelMap?.get(form.lesson_teacher) || form.lesson_teacher, value: form.lesson_teacher });
      }
      setTeacherOptions(finalOptions);
      teachersLoadedRef.current = true;
    } catch (error) {
      console.error('載入教師選項時發生錯誤：', error);
      const options = [...baseOptions];
      if (form.lesson_teacher && !options.some((option) => option.value === form.lesson_teacher)) {
        options.push({ label: externalTeacherLabelMap?.get(form.lesson_teacher) || form.lesson_teacher, value: form.lesson_teacher });
      }
      setTeacherOptions(options);
      teachersLoadedRef.current = true;
    }
  };

  useEffect(() => {
    if (open && studentId && !lesson) {
      const today = new Date().toISOString().split('T')[0];
      const defaultForm: Lesson = {
        id: '',
        student_id: '',
        lesson_date: today,
        regular_timeslot: defaultRegularTimeslot || '',
        actual_timeslot: defaultActualTimeslot || '',
        course_type: '',
        lesson_status: '',
        lesson_teacher: '',
        progress_notes: '',
        video_url: '',
        lesson_count: initialLessonCount || 1,
        lesson_duration: null,
        regular_weekday: defaultRegularWeekday ?? null,
        is_trial: false,
        package_id: null,
        status: null,
        notes: null,
        next_target: null,
        full_name: null,
        created_at: null,
        updated_at: null,
        access_role: null,
        remarks: null,
        student_oid: null,
        org_id: orgId || null,
      };
      setForm(defaultForm);
      setInitialFormState(defaultForm);
      if (!defaultRegularTimeslot) {
        fetchRegularTimeslot();
      }
      fetchHistoricalCourseType();
      fetchCourseTypeFromStudent();
    }
  }, [open, studentId, lesson, defaultRegularTimeslot, defaultRegularWeekday, defaultActualTimeslot]);

  const fetchCourseTypes = async () => {
    try {
      let query = supabase.from('Hanami_CourseTypes').select('*').order('name', { ascending: true });
      if (orgId) {
        query = query.eq('org_id', orgId);
      }
      const { data, error } = await query;
      if (error) {
        console.warn('載入課程類型失敗：', error);
        setCourseTypeOptions([]);
        return;
      }
      const options = (data || []).map((item: { name: string | null }) => ({
        label: item.name || '',
        value: item.name || '',
      }));
      setCourseTypeOptions(options);
    } catch (err) {
      console.error('載入課程類型時發生錯誤：', err);
      setCourseTypeOptions([]);
    }
  };

  const fetchCourseTypeFromStudent = async () => {
    const { data: dataRaw, error } = await supabase
      .from('Hanami_Students')
      .select('course_type')
      .eq('id', studentId)
      .single();
    
    const data = dataRaw as { course_type: string | null; [key: string]: any; } | null;

    if (data?.course_type) {
      setForm((prev) => ({
        ...prev,
        course_type: data.course_type,
      }));
    }
  };

  useEffect(() => {
    if (form.lesson_count && form.lesson_count > 0) {
      const baseDate = form.lesson_date ? new Date(form.lesson_date) : new Date();
      const previews = Array.from({ length: form.lesson_count }, (_, i) => {
        const newDate = new Date(baseDate);
        newDate.setDate(baseDate.getDate() + 7 * i);
        const formattedTime = form.regular_timeslot ? to24Hour(form.regular_timeslot) : '未設定時間';
        return `${newDate.toISOString().split('T')[0]} ${formattedTime}`;
      });
      setPreviewDates(previews);
    } else {
      setPreviewDates([]);
    }
  }, [form.lesson_count, form.lesson_date, form.regular_timeslot]);

  const to24Hour = (timeStr: string) => {
    const date = new Date(`1970-01-01T${timeStr}`);
    return date.toTimeString().slice(0, 5);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if ((name === 'regular_timeslot' || name === 'actual_timeslot') && value) {
      setForm({ ...form, [name]: to24Hour(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async () => {
    try {
      // 驗證必填欄位
      if (!form.lesson_date) {
        alert('請選擇課堂日期');
        return;
      }

      // 1. 從 Supabase 取得學生資料
      let studentData: { student_oid: string | null; regular_weekday: number | null; full_name: string | null; org_id: string | null; [key: string]: any; } | null = null;
      try {
        const { data } = await supabase
          .from('Hanami_Students')
          .select('student_oid, regular_weekday, full_name, org_id')
          .eq('id', studentId)
          .single();
        studentData = data as { student_oid: string | null; regular_weekday: number | null; full_name: string | null; org_id: string | null; [key: string]: any; } | null;
      } catch (e) {
        console.error('Error fetching student data:', e);
      }

      const resolvedOrgId =
        (orgId && orgId !== '' ? orgId : null) ||
        (typeof form.org_id === 'string' && form.org_id ? form.org_id : null) ||
        (studentData?.org_id ?? null);

      if (!resolvedOrgId) {
        alert('無法確認機構 ID，請先建立或選擇機構後再新增課堂。');
        return;
      }

      if (form.org_id !== resolvedOrgId) {
        setForm((prev) => ({ ...prev, org_id: resolvedOrgId }));
      }

      // 自動設置 lesson_duration
      const autoLessonDuration =
        form.course_type === '鋼琴'
          ? '00:45:00'
          : form.course_type === '音樂專注力'
            ? '01:00:00'
            : null;

      // 準備 payload，型別全部正確
      const payload = {
        student_id: studentId,
        student_oid: studentData?.student_oid ?? null,
        full_name: studentData?.full_name ?? '',
        lesson_date: form.lesson_date,
        regular_timeslot: form.regular_timeslot ?? '',
        actual_timeslot: form.actual_timeslot ?? '',
        course_type: typeof form.course_type === 'string' ? form.course_type : (form.course_type && typeof form.course_type === 'object' && 'name' in form.course_type ? String((form.course_type as { name: string }).name) : ''),
        lesson_status: form.lesson_status ?? '',
        lesson_teacher: form.lesson_teacher ?? '',
        progress_notes: form.progress_notes ?? '',
        video_url: form.video_url ?? '',
        lesson_duration: autoLessonDuration,
        regular_weekday: studentData?.regular_weekday !== undefined && studentData?.regular_weekday !== null ? String(studentData.regular_weekday) : null,
        package_id: form.package_id && form.package_id !== '' ? form.package_id : null,
        status: toStatus(form.status),
        notes: form.notes ?? null,
        next_target: form.next_target ?? null,
        created_at: form.created_at || new Date().toISOString(),
        updated_at: form.updated_at || new Date().toISOString(),
        access_role: form.access_role ?? null,
        remarks: form.remarks ?? null,
        lesson_activities: form.lesson_activities ?? null,
        org_id: resolvedOrgId,
      };

      if (lesson) {
        const updatePayload = {
          ...payload,
          id: lesson.id, // 只在更新時包含id
        };
        
        // hanami_student_lesson table type may not be fully defined
        const { error } = await ((supabase as any)
          .from('hanami_student_lesson')
          .update(updatePayload)
          .eq('id', lesson.id));
        
        if (error) {
          console.error('Error updating lesson:', error);
          alert(`更新課堂記錄失敗，請稍後再試\n${error.message}`);
          return;
        }
        alert(
          '課堂已成功更新！\n' +
          `日期：${payload.lesson_date}\n` +
          `時間：${payload.actual_timeslot || payload.regular_timeslot}`,
        );
      } else {
        // 新增多堂課的情況
        if ((form.lesson_count ?? 1) > 1) {
          const nowISOString = new Date().toISOString();
          const newLessons = previewDates.map(dt => ({
            student_id: studentId,
            student_oid: (!studentData?.student_oid || studentData.student_oid === '') ? null : studentData.student_oid,
            full_name: studentData?.full_name ?? '',
            lesson_date: dt.split(' ')[0],
            regular_timeslot: dt.split(' ')[1],
            actual_timeslot: dt.split(' ')[1],
            course_type: typeof form.course_type === 'string' ? form.course_type : (form.course_type && typeof form.course_type === 'object' && 'name' in form.course_type ? String((form.course_type as { name: string }).name) : ''),
            lesson_status: form.lesson_status ?? '',
            lesson_teacher: form.lesson_teacher ?? '',
            progress_notes: form.progress_notes ?? '',
            video_url: form.video_url ?? '',
            lesson_duration: autoLessonDuration,
            regular_weekday: studentData?.regular_weekday !== undefined && studentData?.regular_weekday !== null ? String(studentData.regular_weekday) : null,
            package_id: (!form.package_id || form.package_id === '') ? null : form.package_id,
            status: toStatus(form.status),
            notes: form.notes ?? null,
            next_target: form.next_target ?? null,
            created_at: nowISOString,
            updated_at: nowISOString,
            access_role: form.access_role ?? null,
            remarks: form.remarks ?? null,
            lesson_activities: form.lesson_activities ?? null,
            org_id: resolvedOrgId,
          }));
          // hanami_student_lesson table type may not be fully defined
          const { data, error } = await ((supabase as any)
            .from('hanami_student_lesson')
            .insert(newLessons)
            .select());
          if (error) {
            console.error('Error inserting multiple lessons:', error);
            alert(`新增多堂課記錄失敗，請稍後再試\n${error.message}`);
            return;
          }
          if (data) {
            const summary = (data as Array<{ lesson_date: string; actual_timeslot: string | null; regular_timeslot: string | null; [key: string]: any; }>)
              .map((d: { lesson_date: string; actual_timeslot: string | null; regular_timeslot: string | null; [key: string]: any; }) => `日期：${d.lesson_date} 時間：${d.actual_timeslot || d.regular_timeslot}`)
              .join('\n');
            alert(`課堂已成功新增！\n${summary}`);
          }
        } else {
          // 新增單堂課
          const nowISOString = new Date().toISOString();
          const singlePayload = {
            ...payload,
            created_at: nowISOString,
            updated_at: nowISOString,
            org_id: resolvedOrgId,
          };
          // hanami_student_lesson table type may not be fully defined
          const { data, error } = await ((supabase as any)
            .from('hanami_student_lesson')
            .insert(singlePayload)
            .select());
          if (error) {
            console.error('Error inserting single lesson:', error);
            alert(`新增課堂記錄失敗，請稍後再試\n${error.message}`);
            return;
          }
          if (data && data[0]) {
            alert(
              '課堂已成功新增！\n' +
              `日期：${data[0].lesson_date}\n` +
              `時間：${data[0].actual_timeslot || data[0].regular_timeslot}`,
            );
          }
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Unexpected error during save:', err);
      alert(`儲存失敗，請稍後再試\n${err instanceof Error ? err.message : ''}`);
    }
  };

  const handleCancel = () => {
    setForm(initialFormState || {});
    onClose();
  };

  const handleLessonCountChange = (value: string) => {
    const count = parseInt(value) || 0;
    setForm(prev => ({ ...prev, lesson_count: count }));
    
    if (count > 0) {
      const previews = Array.from({ length: count }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i * 7);
        return date.toISOString().split('T')[0];
      });
      setPreviewDates(previews);
    } else {
      setPreviewDates([]);
    }
  };

  // handlePreviewDateChange/handlePreviewTimeChange 放在這裡
  const handlePreviewDateChange = (index: number, newDate: string) => {
    setPreviewDates(prev => {
      const copy = [...prev];
      const [, time] = copy[index].split(' ');
      copy[index] = `${newDate} ${time}`;
      return copy;
    });
  };
  const handlePreviewTimeChange = (index: number, newTime: string) => {
    setPreviewDates(prev => {
      const copy = [...prev];
      const [date] = copy[index].split(' ');
      copy[index] = `${date} ${newTime}`;
      return copy;
    });
  };

  const handleDelete = async () => {
    if (lesson?.id) {
      await supabase.from('hanami_student_lesson').delete().eq('id', lesson.id);
      onSaved();
      onClose();
    }
  };

  const normalizedPropOrgId =
    typeof orgId === 'string' && orgId.trim() !== '' ? orgId.trim() : undefined;
  const normalizedFormOrgId =
    typeof form.org_id === 'string' && form.org_id.trim() !== '' ? form.org_id.trim() : undefined;
  const displayOrgId = normalizedPropOrgId ?? normalizedFormOrgId ?? '';
  const displayOrgName =
    typeof orgName === 'string' && orgName.trim() !== ''
      ? orgName.trim()
      : '未設定';

  if (!open) return null;

  return (
    <Dialog
      className="fixed z-10 inset-0 overflow-y-auto"
      open={open}
      onClose={handleCancel}
    >
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <Dialog.Panel className="bg-[#FFFDF8] p-6 rounded-2xl shadow-xl w-full max-w-md border border-[#F3EAD9]">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-bold">
                {lesson ? '編輯課堂記錄' : (
                  <div className="flex items-center gap-2">
                    <span>新增課堂記錄</span>
                    {mode === 'add' && initialLessonCount && initialLessonCount > 0 && (
                      <div className="relative">
                        <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] px-3 py-1 rounded-full text-sm font-semibold shadow-md border border-[#F3EAD9] animate-pulse">
                          待安排 {initialLessonCount} 堂
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFB6C1] rounded-full animate-bounce"></div>
                      </div>
                    )}
                  </div>
                )}
              </Dialog.Title>
            {(form.lesson_count ?? 1) > 1 && (
              <button
                className="text-sm text-[#4B4036] underline hover:text-[#2B3A3B]"
                onClick={() => setShowPreview((prev) => !prev)}
              >
                {showPreview ? '隱藏預覽' : '預覽課堂時間'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-[#EADBC8] bg-[#FFF9F2] px-4 py-3 text-sm text-[#4B4036] shadow-sm">
              <div className="font-semibold text-[#2B3A3B]">機構資訊</div>
              <div className="mt-1 text-[#8A7C70]">名稱：{displayOrgName}</div>
              <div className="mt-0.5 text-[#8A7C70]">
                ID：{displayOrgId || '尚未設定'}
              </div>
            </div>
            <div className="mb-3">
              <button
                className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] text-left bg-white"
                onClick={() => {
                  setPendingCourseType(typeof form.course_type === 'string' ? form.course_type : '');
                  setCourseTypeDropdownOpen(true);
                }}
              >
                {form.course_type ? `課堂類別：${form.course_type}` : '請選擇課堂類別'}
              </button>
              {courseTypeDropdownOpen && (
                <PopupSelect
                  mode="single"
                  options={courseTypeOptions}
                  selected={pendingCourseType}
                  title="選擇課堂類別"
                  onCancel={() => setCourseTypeDropdownOpen(false)}
                  onChange={(val) => setPendingCourseType(Array.isArray(val) ? val[0] : val || '')}
                  onConfirm={() => {
                    setForm({ ...form, course_type: pendingCourseType });
                    setCourseTypeDropdownOpen(false);
                  }}
                />
              )}
            </div>
            {mode === 'add' && (
              <div className="mb-3">
                <button
                  className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] text-left bg-white"
                  onClick={() => {
                    console.log('點擊堂數選擇器，當前 pendingLessonCount:', pendingLessonCount);
                    console.log('當前 form.lesson_count:', form.lesson_count);
                    setLessonCountDropdownOpen(true);
                    // 不要覆蓋 pendingLessonCount，保持當前的值
                    // setPendingLessonCount(form.lesson_count?.toString() || '1');
                  }}
                >
                  新增堂數：{form.lesson_count || initialLessonCount || 1} 堂
                </button>
                {lessonCountDropdownOpen && (
                  <PopupSelect
                    mode="single"
                    options={[
                      { label: '1 堂', value: '1' },
                      { label: '4 堂', value: '4' },
                      { label: '8 堂', value: '8' },
                      { label: '12 堂', value: '12' },
                      { label: '16 堂', value: '16' },
                      { label: '自訂', value: 'custom' },
                    ]}
                    selected={pendingLessonCount}
                    title="選擇堂數"
                    onCancel={() => setLessonCountDropdownOpen(false)}
                    onChange={(val) => setPendingLessonCount(Array.isArray(val) ? val[0] : val || '')}
                    onConfirm={() => {
                      setForm({
                        ...form,
                        lesson_count: pendingLessonCount === 'custom' ? customLessonCount : Number(pendingLessonCount),
                      });
                      setLessonCountDropdownOpen(false);
                    }}
                  />
                )}
                {pendingLessonCount === 'custom' && (
                  <input
                    className="mt-2 w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B]"
                    placeholder="請輸入自訂堂數"
                    type="number"
                    value={customLessonCount}
                    onChange={(e) => setCustomLessonCount(Number(e.target.value))}
                  />
                )}
              </div>
            )}
            <input className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]" name="lesson_date" type="date" value={form.lesson_date || ''} onChange={handleChange} />
            {form.lesson_count === 1 ? (
              <div className="flex flex-col gap-1">
                <label className="text-sm text-[#4B4036]">常規時間（不可修改）</label>
                <input
                  readOnly
                  className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] bg-gray-100 cursor-not-allowed"
                  type="time"
                  value={form.regular_timeslot || ''}
                />
              </div>
            ) : (
              <>
                <TimePicker
                  label="常規時間"
                  value={form.regular_timeslot || ''}
                  onChange={(val) => setForm({ ...form, regular_timeslot: val })}
                />
                {(form.lesson_count ?? 1) > 1 && previewDates.length > 0 && (
                  <div className="mt-2 text-sm text-[#4B4036] space-y-1">
                    <p className="font-semibold">課堂日期時間</p>
                    {previewDates.map((d, i) => (
                      <div key={i}>{d}</div>
                    ))}
                  </div>
                )}
              </>
            )}
            {form.lesson_count === 1 && (
              <TimePicker
                label="實際時間"
                value={form.actual_timeslot || ''}
                onChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    actual_timeslot: val,
                    regular_timeslot: val,
                  }))
                }
              />
            )}
            {form.lesson_count === 1 && (
              <>
                <div className="mb-3">
                  <button
                    className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] text-left bg-white"
                    onClick={() => {
                      setPendingStatus(form.lesson_status || '');
                      setStatusDropdownOpen(true);
                    }}
                  >
                    {form.lesson_status ? `出席狀況：${form.lesson_status}` : '請選擇出席狀況'}
                  </button>
                  {statusDropdownOpen && (
                    <PopupSelect
                      mode="single"
                      options={[
                        { label: '出席', value: 'attended' },
                        { label: '缺席', value: 'absent' },
                        { label: '補堂', value: 'makeup' },
                        { label: '病假', value: 'sick_leave' },
                        { label: '事假', value: 'personal_leave' },
                      ]}
                      selected={pendingStatus}
                      title="選擇出席狀況"
                      onCancel={() => setStatusDropdownOpen(false)}
                      onChange={(val) => setPendingStatus(Array.isArray(val) ? val[0] : val || '')}
                      onConfirm={() => {
                        setForm({ ...form, lesson_status: pendingStatus });
                        setStatusDropdownOpen(false);
                      }}
                    />
                  )}
                </div>
              </>
            )}
            <div className="mb-3">
              <button
                className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] text-left bg-white"
                onClick={() => {
                  if (!teachersLoadedRef.current) {
                    fetchTeachers();
                  }
                  setPendingTeacher(form.lesson_teacher || '');
                  setTeacherDropdownOpen(true);
                }}
              >
                {form.lesson_teacher
                  ? `負責老師：${externalTeacherLabelMap?.get(form.lesson_teacher) || teacherOptions.find((opt) => opt.value === form.lesson_teacher)?.label || form.lesson_teacher}`
                  : '請選擇負責老師'}
              </button>
              {teacherDropdownOpen && (
                <PopupSelect
                  mode="single"
                  options={teacherOptions}
                  selected={pendingTeacher}
                  title="選擇負責老師"
                  onCancel={() => setTeacherDropdownOpen(false)}
                  onChange={(val) => setPendingTeacher(Array.isArray(val) ? (val[0] as string) : ((val as string) || ''))}
                  onConfirm={() => {
                    setForm({ ...form, lesson_teacher: pendingTeacher || null });
                    setTeacherDropdownOpen(false);
                  }}
                />
              )}
            </div>
            <textarea className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]" name="progress_notes" placeholder="備註" value={form.progress_notes || ''} onChange={handleChange} />
            <input className="w-full border border-[#EADBC8] rounded-full px-4 py-2 text-sm text-[#2B3A3B] placeholder-[#aaa]" name="video_url" placeholder="影片連結" type="text" value={form.video_url || ''} onChange={handleChange} />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button className="hanami-btn-soft px-4 py-2 text-sm text-[#A68A64]" onClick={handleCancel}>取消</button>
            <button className="hanami-btn px-4 py-2 text-sm text-[#2B3A3B]" onClick={handleSubmit}>儲存</button>
            {mode === 'edit' && lesson && (
              <button
                className="px-4 py-2 border border-red-200 text-sm text-red-600 bg-white rounded-full hover:bg-red-50"
                onClick={handleDelete}
              >
                刪除
              </button>
            )}
          </div>
        </Dialog.Panel>
      </div>
      {/* Overlay Preview Dialog */}
      
      {showPreview && (
        <Dialog className="fixed z-50 inset-0 overflow-y-auto" open={true} onClose={() => setShowPreview(false)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <Dialog.Panel className="bg-[#FFFDF8] p-6 rounded-2xl shadow-xl w-full max-w-md border border-[#F3EAD9]">
              <Dialog.Title className="text-lg font-bold mb-2">預覽課堂時間</Dialog.Title>
              {previewDates.length > 0 ? (
                <>
                  <p className="text-sm font-semibold text-[#4B4036] mb-1">課堂時間</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#4B4036]">
                    {previewDates.map((d, i) => {
                      const [dateStr, timeStr] = d.split(' ');
                      return (
                        <li key={i} className="flex items-center gap-2 mb-2">
                          <input
                            className="border border-[#EADBC8] rounded px-2 py-1"
                            type="date"
                            value={dateStr}
                            onChange={e => handlePreviewDateChange(i, e.target.value)}
                          />
                          <TimePicker
                            label=""
                            value={timeStr}
                            onChange={val => handlePreviewTimeChange(i, val)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-gray-500">尚無可預覽的課堂時間。</p>
              )}
              {/* 新增重設/關閉/儲存按鈕區塊 */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  className="px-4 py-2 border border-[#EADBC8] text-sm text-[#A68A64] bg-white rounded-full hover:bg-[#f7f3ec]"
                  onClick={() => {
                    // 重設為原始時間
                    const baseDate = form.lesson_date ? new Date(form.lesson_date) : new Date();
                    if ((form.lesson_count ?? 1) > 0) {
                      const previews = Array.from({ length: form.lesson_count ?? 1 }, (_, i) => {
                        const newDate = new Date(baseDate);
                        newDate.setDate(newDate.getDate() + 7 * i);
                        const formattedTime = form.regular_timeslot ? to24Hour(form.regular_timeslot) : '未設定時間';
                        return `${newDate.toISOString().split('T')[0]} ${formattedTime}`;
                      });
                      setPreviewDates(previews);
                    }
                  }}
                >
                  重設
                </button>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 border border-[#EADBC8] text-sm text-[#A68A64] bg-white rounded-full hover:bg-[#f7f3ec]"
                    onClick={() => {
                      // Restore previewDates to the previously finalized state, not changing lesson_count
                      const restoredPreviews = finalizedDates.length > 0
                        ? [...finalizedDates]
                        : Array.from({ length: form.lesson_count ?? 1 }, (_, i) => {
                          const newDate = new Date(form.lesson_date || new Date());
                          newDate.setDate(newDate.getDate() + 7 * i);
                          const formattedTime = form.regular_timeslot || '未設定時間';
                          return `${newDate.toISOString().split('T')[0]} ${formattedTime}`;
                        });
                      setPreviewDates(restoredPreviews);
                      setShowPreview(false);
                    }}
                  >
                    取消
                  </button>
                  <button
                    className="px-4 py-2 bg-[#EBC9A4] text-sm text-[#2B3A3B] rounded-full hover:bg-[#e5ba8e]"
                    onClick={() => {
                      // 儲存預覽的所有日期到 finalizedDates
                      setFinalizedDates(previewDates);
                      setShowPreview(false);
                      // 若是單堂課，將第一筆同步到 form
                      if (form.lesson_count === 1 && previewDates.length > 0) {
                        const [date, time] = previewDates[0].split(' ');
                        setForm(prev => ({
                          ...prev,
                          lesson_date: date,
                          regular_timeslot: time,
                          actual_timeslot: time,
                        }));
                      }
                    }}
                  >
                    儲存
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
}
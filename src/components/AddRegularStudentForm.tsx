'use client';

import { useState, useEffect, useMemo } from 'react';
import { Puzzle, BookOpen, StickyNote } from 'lucide-react';

import { PopupSelect } from '@/components/ui/PopupSelect';
import TimePicker from '@/components/ui/TimePicker';
import { supabase } from '@/lib/supabase';
import { createSaasClient } from '@/lib/supabase-saas';
import { useSearchParams } from 'next/navigation';

interface AddRegularStudentFormProps {
  redirectPath?: string;
  orgId?: string | null;
  orgName?: string | null;
}

// UUID 生成函數（兼容性版本）
const generateUUID = () => {
  // 優先使用 crypto.randomUUID（如果支援）
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback：使用 Math.random 生成 UUID v4 格式
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function AddRegularStudentForm({
  redirectPath = '/admin/students',
  orgId = null,
  orgName = null,
}: AddRegularStudentFormProps) {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: generateUUID(),
    student_oid: generateUUID().slice(0, 8),
    full_name: '',
    nick_name: '',
    gender: '',
    contact_number: '',
    student_dob: '',
    student_age: '',
    parent_email: '',
    health_notes: '沒有',
    student_preference: '',
    address: '',
    school: '',
    course_type: '',
    regular_weekday: '',
    regular_timeslot: '',
    student_type: '常規',
    student_teacher: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    access_role: 'admin',
    student_email: '',
    student_password: generateUUID().slice(0, 8),
    trial_date: '',
    trial_time: '',
    student_remarks: '',
    trial_remarks: '',
    // 可選: 可加入 duration_months, remaining_lessons 若有需要
  });

  useEffect(() => {
    if (typeParam === 'trial') {
      setFormData(prev => ({ ...prev, student_type: '試堂' }));
    } else if (typeParam === 'regular') {
      setFormData(prev => ({ ...prev, student_type: '常規' }));
    }
  }, [typeParam]);

  const [showPopup, setShowPopup] = useState<{ field: string, open: boolean }>({ field: '', open: false });
  const [popupSelected, setPopupSelected] = useState('');

  // 選項 state
  const genderOptions = [
    { label: '男', value: '男' },
    { label: '女', value: '女' },
  ];
  const studentTypeOptions = [
    { label: '常規', value: '常規' },
    { label: '試堂', value: '試堂' },
  ];
  const WEEKDAY_LABEL_MAP: Record<string, string> = {
    '1': '星期一',
    '2': '星期二',
    '3': '星期三',
    '4': '星期四',
    '5': '星期五',
    '6': '星期六',
    '0': '星期日',
  };
  const weekdayOptions = [
    { label: '星期一', value: '1' },
    { label: '星期二', value: '2' },
    { label: '星期三', value: '3' },
    { label: '星期四', value: '4' },
    { label: '星期五', value: '5' },
    { label: '星期六', value: '6' },
    { label: '星期日', value: '0' },
  ];
  const [courseOptions, setCourseOptions] = useState<{ label: string, value: string }[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<{ label: string; value: string }[]>([
    { label: '未分配', value: '' },
  ]);
  const [scheduleOptions, setScheduleOptions] = useState<Array<{
    id: string;
    weekday: number | null;
    timeslot: string | null;
    course_code: string | null;
    course_type: string | null;
    assigned_teachers: string | null;
  }>>([]);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const teacherLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    teacherOptions.forEach((opt) => {
      map.set(opt.value ?? '', opt.label);
    });
    return map;
  }, [teacherOptions]);

  const resolveTeacherName = (teacherValue: string | null) => {
    if (teacherValue === '') return '未分配';
    if (!teacherValue) return '未分配';
    return teacherLabelMap.get(teacherValue) ?? '未分配';
  };

  const teacherButtonLabel = useMemo(() => {
    const value = formData.student_teacher;
    if (!value) {
      return selectedScheduleIds.length > 0 ? '未分配' : '請選擇';
    }
    if (value === '') return '未分配';
    return teacherLabelMap.get(value) ?? '未分配';
  }, [formData.student_teacher, selectedScheduleIds.length, teacherLabelMap]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      student_email: `${prev.student_oid}@hanami.com`,
      updated_at: new Date().toISOString(),
    }));
  }, [formData.student_dob, formData.student_oid]);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!orgId || !formData.course_type || !formData.regular_weekday) {
        setScheduleLoading(false);
        setScheduleOptions([]);
        setSelectedScheduleIds([]);
        return;
      }

      setScheduleLoading(true);
      try {
        const weekdayNumber = parseInt(formData.regular_weekday, 10);
        const { data, error } = await supabase
          .from('hanami_schedule')
          .select('id, weekday, timeslot, course_code, course_type, assigned_teachers')
          .eq('org_id', orgId)
          .eq('weekday', isNaN(weekdayNumber) ? formData.regular_weekday : weekdayNumber)
          .eq('course_type', formData.course_type)
          .order('timeslot', { ascending: true });

        if (error) {
          console.error('載入時間表選項失敗：', error);
          setScheduleOptions([]);
          return;
        }

        setScheduleOptions(data || []);
        setSelectedScheduleIds([]);
      } catch (err) {
        console.error('取得時間表選項發生錯誤：', err);
        setScheduleOptions([]);
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchSchedules();
  }, [orgId, formData.course_type, formData.regular_weekday]);

  // fetch options for course_type and teacher
  useEffect(() => {
    let cancelled = false;
    const rolesForMembers = ['owner', 'admin', 'teacher'];

    const loadOptions = async () => {
      try {
        let courseQuery = supabase.from('Hanami_CourseTypes').select('name');
        let employeeQuery = supabase.from('hanami_employee').select('id, teacher_nickname, teacher_fullname');
        let memberQuery = supabase
          .from('hanami_user_organizations')
          .select('id, user_id, user_email, role')
          .in('role', rolesForMembers);

        if (orgId) {
          courseQuery = courseQuery.eq('org_id', orgId);
          employeeQuery = employeeQuery.eq('org_id', orgId);
          memberQuery = memberQuery.eq('org_id', orgId);
        }

        const [
          { data: courseData, error: courseError },
          { data: employeeData, error: employeeError },
          { data: memberData, error: memberError }
        ] = await Promise.all([courseQuery, employeeQuery, memberQuery]);

        if (courseError) throw courseError;
        if (employeeError) throw employeeError;
        if (memberError) throw memberError;
        if (cancelled) return;

        setCourseOptions(
          (courseData || []).map((item: { name: string | null }) => ({
            label: item?.name || '',
            value: item?.name || '',
          })),
        );

        const canonicalMembers = (memberData || []).filter((member: any) => {
          const role = (member.role || '').toLowerCase();
          return rolesForMembers.includes(role);
        });

        const memberUserIds = Array.from(
          new Set(
            canonicalMembers
              .map((member: any) => member.user_id)
              .filter((id: string | null | undefined): id is string => Boolean(id))
          )
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
              console.warn('載入 saas_users 失敗：', saasError);
            } else {
              (saasUsers || []).forEach((user: any) => {
                saasUserMap.set(user.id, {
                  full_name: user.full_name ?? null,
                  email: user.email ?? null,
                });
              });
            }
          } catch (error) {
            console.warn('連接 hanami_saas_system 失敗：', error);
          }
        }

        const teacherMap = new Map<string, { label: string; value: string }>();

        canonicalMembers.forEach((member: any) => {
          const canonicalId = member.user_id || member.user_email || member.id;
          if (!canonicalId) return;
          const saasInfo = member.user_id ? saasUserMap.get(member.user_id) : undefined;
          const email = saasInfo?.email || member.user_email || null;
          const displayName =
            (saasInfo?.full_name || '') ||
            (member.user_email ? member.user_email.split('@')[0] : '') ||
            '未命名教師';
          teacherMap.set(canonicalId, {
            value: canonicalId,
            label: displayName,
          });
          if (email) {
            teacherMap.set(email, {
              value: canonicalId,
              label: displayName,
            });
          }
        });

        (employeeData || []).forEach((teacher: any) => {
          if (!teacher.id) return;
          if (teacherMap.has(teacher.id)) return;
          const displayName =
            teacher.teacher_nickname ||
            teacher.teacher_fullname ||
            '未命名教師';
          teacherMap.set(teacher.id, {
            value: teacher.id,
            label: displayName,
          });
        });

        const teacherList = Array.from(
          new Map(
            Array.from(teacherMap.values()).map((entry) => [entry.value, entry]),
          ).values(),
        ).sort((a, b) => a.label.localeCompare(b.label, 'zh-Hant'));

        setTeacherOptions([{ label: '未分配', value: '' }, ...teacherList]);
      } catch (error) {
        if (!cancelled) {
          console.error('載入課程或老師資料發生錯誤：', error);
          setCourseOptions([]);
          setTeacherOptions([{ label: '未分配', value: '' }]);
        }
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePopupOpen = (field: string) => {
    setPopupSelected(formData[field as keyof typeof formData] || '');
    setShowPopup({ field, open: true });
  };

  const handlePopupConfirm = () => {
    setFormData(prev => ({ ...prev, [showPopup.field]: popupSelected }));
    setShowPopup({ field: '', open: false });
  };

  const handlePopupCancel = () => {
    setShowPopup({ field: '', open: false });
  };

  const handleScheduleToggle = (scheduleId: string) => {
    setSelectedScheduleIds((prev) => {
      const isSelected = prev.includes(scheduleId);
      const next = isSelected ? prev.filter((id) => id !== scheduleId) : [...prev, scheduleId];

      if (!isSelected) {
        const matched = scheduleOptions.find((option) => option.id === scheduleId);
        if (matched) {
          setFormData((prevForm) => ({
            ...prevForm,
            regular_timeslot: matched.timeslot || prevForm.regular_timeslot,
            student_teacher: matched.assigned_teachers ?? prevForm.student_teacher,
          }));
        }
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // 必填欄位檢查
    const missingFields = [];
    if (!formData.full_name) missingFields.push('姓名');
    if (!formData.gender) missingFields.push('性別');
    if (!formData.student_dob && !formData.student_age) missingFields.push('出生日期或年齡');
    if (!formData.course_type) missingFields.push('課程類型');
    if (!formData.student_type) missingFields.push('學生類型');
    // 常規學生必填
    if (formData.student_type === '常規') {
      if (!formData.regular_weekday) missingFields.push('固定上課星期數');
      if (!formData.regular_timeslot) missingFields.push('固定上課時段');
    }
    // 試堂學生必填
    if (formData.student_type === '試堂') {
      if (!formData.trial_date) missingFields.push('試堂日期');
      if (!formData.trial_time) missingFields.push('試堂時間');
    }

    if (missingFields.length > 0) {
      alert(`請填寫以下必填欄目：\n${missingFields.join('、')}`);
      setLoading(false);
      return;
    }
    try {
      let table: 'Hanami_Students' | 'hanami_trial_students' = 'Hanami_Students';
      let payload;
      if (formData.student_type === '試堂') {
        table = 'hanami_trial_students';
        const weekdayNumber = formData.trial_date
          ? new Date(`${formData.trial_date}T00:00:00`).getDay().toString()
          : '';
        payload = {
          id: formData.id,
          student_oid: formData.student_oid,
          full_name: formData.full_name,
          nick_name: formData.nick_name,
          gender: formData.gender,
          contact_number: formData.contact_number,
          student_dob: formData.student_dob || null,
          student_age: formData.student_age === '' ? null : parseInt(formData.student_age),
          parent_email: formData.parent_email,
          health_notes: formData.health_notes,
          student_preference: formData.student_preference,
          address: formData.address,
          school: formData.school,
          course_type: formData.course_type,
          student_type: formData.student_type,
          student_teacher: formData.student_teacher,
          created_at: formData.created_at,
          updated_at: formData.updated_at,
          access_role: formData.access_role,
          student_email: formData.student_email,
          student_password: formData.student_password,
          ...(orgId ? { org_id: orgId } : {}),
          lesson_date: formData.trial_date || null,
          actual_timeslot: formData.trial_time || null,
          trial_remarks: formData.trial_remarks || '',
          weekday: weekdayNumber,
          regular_weekday: weekdayNumber,
          confirmed_payment: true // 在 teacher-link 中新增的試堂學生，支付已確認
        };
      } else {
        payload = {
          id: formData.id,
          student_oid: formData.student_oid,
          full_name: formData.full_name,
          nick_name: formData.nick_name,
          gender: formData.gender,
          contact_number: formData.contact_number,
          student_dob: formData.student_dob || null,
          student_age: formData.student_age === '' ? null : parseInt(formData.student_age),
          parent_email: formData.parent_email,
          health_notes: formData.health_notes,
          student_preference: formData.student_preference,
          address: formData.address,
          school: formData.school,
          course_type: formData.course_type,
          regular_weekday: formData.regular_weekday,
          regular_timeslot: formData.regular_timeslot,
          student_type: formData.student_type,
          student_teacher: formData.student_teacher,
          created_at: formData.created_at,
          updated_at: formData.updated_at,
          access_role: formData.access_role,
          student_email: formData.student_email,
          student_password: formData.student_password,
          student_remarks: formData.student_remarks || '',
          ...(orgId ? { org_id: orgId } : {}),
        };
      }
      
      // 使用 API 路由創建/更新學生（繞過 RLS）
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentData: payload,
          orgId: orgId || null,
          table: table,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || '新增或更新失敗';
        console.error('❌ 創建學生失敗:', result);
        alert(`新增或更新失敗：${errorMessage}`);
      } else {
        alert(`${formData.student_type === '試堂' ? '試堂學生' : '常規學生'}已成功新增或更新！`);
        window.location.href = redirectPath;
        setFormData({
          id: generateUUID(),
          student_oid: generateUUID().slice(0, 8),
          full_name: '',
          nick_name: '',
          gender: '',
          contact_number: '',
          student_dob: '',
          student_age: '',
          parent_email: '',
          health_notes: '沒有',
          student_preference: '',
          address: '',
          school: '',
          course_type: '',
          regular_weekday: '',
          regular_timeslot: '',
          student_type: '常規',
          student_teacher: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          access_role: 'admin',
          student_email: '',
          student_password: generateUUID().slice(0, 8),
          trial_date: '',
          trial_time: '',
          student_remarks: '',
          trial_remarks: '',
        });
      }
    } catch (err) {
      alert('系統錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showPopup.open && (
        <PopupSelect
          mode="single"
          options={
            showPopup.field === 'gender' ? genderOptions :
              showPopup.field === 'course_type' ? courseOptions :
                showPopup.field === 'regular_weekday' ? weekdayOptions :
                  showPopup.field === 'student_type' ? studentTypeOptions :
                    showPopup.field === 'student_teacher' ? teacherOptions :
                      []
          }
          selected={popupSelected}
          title={
            showPopup.field === 'gender' ? '選擇性別' :
              showPopup.field === 'course_type' ? '選擇課程' :
                showPopup.field === 'regular_weekday' ? '選擇星期數' :
                  showPopup.field === 'student_type' ? '選擇學生類型' :
                    showPopup.field === 'student_teacher' ? '選擇老師' :
                      '選擇時段'
          }
          onCancel={handlePopupCancel}
          onChange={(value: string | string[]) => setPopupSelected(Array.isArray(value) ? value[0] ?? '' : value ?? '')}
          onConfirm={handlePopupConfirm}
        />
      )}
      <form className="bg-[#FFFDF8] p-6 rounded-2xl shadow-xl space-y-6 max-w-lg mx-auto" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold text-center text-[#4B4036]">
          {formData.student_type === '試堂' ? '新增試堂學生' : '新增常規學生'}
        </h2>

        {/* 🧩 基本資料與聯絡資訊 */}
        <fieldset className="space-y-3">
          <legend className="flex items-center gap-2 font-semibold text-[#4B4036]">
            <Puzzle className="h-5 w-5 text-[#D48347]" />
            基本資料與聯絡資訊
          </legend>
          {orgId && (
            <div className="w-full mb-3">
              <label className="block mb-1 text-sm font-medium text-[#4B4036]">機構資訊</label>
              <div className="rounded-lg border border-[#EADBC8] bg-[#FFF4DF] px-3 py-2 text-[#2B3A3B] shadow-sm">
                <div className="font-semibold text-sm">
                  {orgName?.trim() || '未命名機構'}
                </div>
                <div className="mt-1 text-xs text-[#8A7C70] break-all">
                  ID：{orgId}
                </div>
              </div>
            </div>
          )}
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">學生ID</label>
            <div className="bg-gray-100 px-3 py-2 w-full rounded-lg">{formData.id}</div>
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">學生8位ID</label>
            <div className="bg-gray-100 px-3 py-2 w-full rounded-lg">{formData.student_oid}</div>
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">姓名（必填）</label>
            <input
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              name="full_name"
              value={formData.full_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
            />
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">暱稱</label>
            <input
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              name="nick_name"
              value={formData.nick_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
            />
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">性別（必填）</label>
            <button
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full text-left shadow-sm"
              type="button"
              onClick={() => handlePopupOpen('gender')}
            >
              {formData.gender || '請選擇'}
            </button>
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">家長聯絡電話</label>
            <input
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              name="contact_number"
              value={formData.contact_number}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
            />
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">生日</label>
            <input
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              name="student_dob"
              type="date"
              value={formData.student_dob}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
            />
          </div>
          <div className="w-full mb-3 flex items-center gap-2">
            <div className="flex-1">
              <label className="block mb-1 text-sm font-medium text-[#4B4036]">年齡</label>
              <input
                className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                name="student_age"
                value={formData.student_age}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
              />
            </div>
            <button
              className="px-3 py-1 bg-[#A68A64] text-white rounded hover:bg-[#91765a] text-sm"
              type="button"
              onClick={() => {
                if (formData.student_dob) {
                  const birthDate = new Date(formData.student_dob);
                  const age = new Date().getFullYear() - birthDate.getFullYear();
                  setFormData(prev => ({ ...prev, student_age: age.toString() }));
                } else {
                  alert('請先輸入生日再計算年齡');
                }
              }}
            >
              計算
            </button>
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">家長Email</label>
            <input
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              name="parent_email"
              value={formData.parent_email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
            />
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">健康/過敏備註</label>
            <input
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              name="health_notes"
              value={formData.health_notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
            />
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">學生偏好</label>
            <input
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              name="student_preference"
              value={formData.student_preference}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
            />
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">地址</label>
            <input
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              name="address"
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
            />
          </div>
          <div className="w-full mb-3">
            <label className="block mb-1 text-sm font-medium text-[#4B4036]">就讀學校</label>
            <input
              className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
              name="school"
              value={formData.school}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
            />
          </div>
        </fieldset>

        {/* 📚 學習狀態與課程資訊 */}
        <fieldset className="space-y-3">
          <legend className="flex items-center gap-2 font-semibold text-[#4B4036]">
            <BookOpen className="h-5 w-5 text-[#D48347]" />
            學習狀態與課程資訊
          </legend>
          {/* --- 試堂學生欄目 --- */}
          {formData.student_type === '試堂' ? (
            <>
              {/* 課程（可修改，PopupSelect） */}
              <div className="w-full mb-3">
                <label className="block mb-1 text-sm font-medium text-[#4B4036]">課程</label>
                <button
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full text-left shadow-sm"
                  type="button"
                  onClick={() => handlePopupOpen('course_type')}
                >
                  {formData.course_type || '請選擇'}
                </button>
              </div>
              {/* 類別（可修改，PopupSelect） */}
              <div className="w-full mb-3">
                <label className="block mb-1 text-sm font-medium text-[#4B4036]">類別</label>
                <button
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full text-left shadow-sm"
                  type="button"
                  onClick={() => handlePopupOpen('student_type')}
                >
                  {formData.student_type || '請選擇'}
                </button>
              </div>
              {/* 試堂日期（可修改） */}
              <div className="w-full mb-3">
                <label className="block mb-1 text-sm font-medium text-[#4B4036]">試堂日期</label>
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  name="trial_date"
                  type="date"
                  value={formData.trial_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
                />
              </div>
              {/* 試堂時間（可修改） */}
              <div className="w-full mb-3">
                <label className="block mb-1 text-sm font-medium text-[#4B4036]">試堂時間</label>
                <input
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A68A64]"
                  name="trial_time"
                  type="time"
                  value={formData.trial_time}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
                />
              </div>
              {/* 負責老師（可修改，PopupSelect） */}
              <div className="w-full mb-3">
                <label className="block mb-1 text-sm font-medium text-[#4B4036]">負責老師</label>
                <button
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full text-left shadow-sm"
                  type="button"
                  onClick={() => handlePopupOpen('student_teacher')}
                >
                  {teacherButtonLabel}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 常規學生原本欄位 */}
              <div className="w-full mb-3">
                <label className="block mb-1 text-sm font-medium text-[#4B4036]">課程類型（必填）</label>
                <button
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full text-left shadow-sm"
                  type="button"
                  onClick={() => handlePopupOpen('course_type')}
                >
                  {formData.course_type || '請選擇'}
                </button>
              </div>
              <div className="w-full mb-3">
                <label className="block mb-1 text-sm font-medium text-[#4B4036]">固定上課星期數（必填）</label>
                <button
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full text-left shadow-sm"
                  type="button"
                  onClick={() => handlePopupOpen('regular_weekday')}
                >
                  {formData.regular_weekday ? WEEKDAY_LABEL_MAP[formData.regular_weekday] ?? '請選擇' : '請選擇'}
                </button>
              </div>
              <div className="w-full mb-3">
                <TimePicker
                  label="固定上課時段（必填）"
                  value={formData.regular_timeslot}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, regular_timeslot: val }))
                  }
                />
              </div>
              {(formData.course_type && formData.regular_weekday) && (
                <div className="w-full mb-3">
                  <div className="rounded-2xl border border-[#EADBC8] bg-white/80 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#4B4036]">套用既有多課程時間表</p>
                        <p className="text-xs text-[#8A7C70] mt-1">
                          您可以勾選既有的課堂時段快速載入資料，也可以自行修改。
                        </p>
                      </div>
                      {scheduleLoading && (
                        <span className="text-xs text-[#A68A64]">載入中...</span>
                      )}
                    </div>

                    {!scheduleLoading && scheduleOptions.length === 0 && (
                      <div className="mt-3 rounded-xl bg-[#FFF9F2] px-4 py-3 text-xs text-[#8A7C70]">
                        尚未建立符合條件的時間表，您可以手動輸入時段。
                      </div>
                    )}

                    {!scheduleLoading && scheduleOptions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {scheduleOptions.map((schedule) => {
                          const isChecked = selectedScheduleIds.includes(schedule.id);
                          const weekdayLabel = schedule.weekday !== null
                            ? WEEKDAY_LABEL_MAP[String(schedule.weekday)] || '星期'
                            : '星期';
                          return (
                            <label
                              key={schedule.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition hover:shadow-sm ${
                                isChecked
                                  ? 'border-[#F59BB5] bg-gradient-to-r from-[#FFF4DF] via-[#FFE8F4] to-[#FFF6E6]'
                                  : 'border-[#F1E4D3] bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-[#EADBC8] text-[#F59BB5] focus:ring-[#F59BB5]"
                                checked={isChecked}
                                onChange={() => handleScheduleToggle(schedule.id)}
                              />
                              <div className="flex flex-col gap-1 text-[#4B4036]">
                                <span className="font-semibold">
                                  {weekdayLabel} · {schedule.timeslot || '未設定'}
                                </span>
                                <span className="text-xs text-[#8A7C70]">
                                  課程代碼：{schedule.course_code || '未設定'} · 教師：{resolveTeacherName(schedule.assigned_teachers)}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="w-full mb-3">
                <label className="block mb-1 text-sm font-medium text-[#4B4036]">學生類型（常規/試堂）</label>
                <button
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full text-left shadow-sm"
                  type="button"
                  onClick={() => handlePopupOpen('student_type')}
                >
                  {formData.student_type || '請選擇'}
                </button>
              </div>
              <div className="w-full mb-3">
                <label className="block mb-1 text-sm font-medium text-[#4B4036]">指派老師</label>
                <button
                  className="border border-[#E4D5BC] bg-[#FFFCF5] rounded-lg px-3 py-2 w-full text-left shadow-sm"
                  type="button"
                  onClick={() => handlePopupOpen('student_teacher')}
                >
                  {teacherButtonLabel}
                </button>
              </div>
            </>
          )}
        </fieldset>

        {/* 備註（可修改，輸入框） */}
        <div className="w-full mb-3">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-[#4B4036]">
            <StickyNote className="h-4 w-4 text-[#D48347]" />
            備註
          </label>
          <textarea
            className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A68A64] focus:border-transparent"
            name={formData.student_type === '試堂' ? 'trial_remarks' : 'student_remarks'}
            placeholder="請輸入備註..."
            rows={3}
            value={formData.student_type === '試堂' ? formData.trial_remarks : formData.student_remarks}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange({
              target: {
                name: e.target.name,
                value: e.target.value,
              },
            } as React.ChangeEvent<HTMLInputElement>)}
          />
        </div>

        <div className="flex justify-between mt-4">
          <button
            className="px-6 py-2 bg-white border border-[#EADBC8] rounded-full text-[#4B4036] hover:bg-[#f7f3ec]"
            type="button"
            onClick={() => window.history.back()}
          >
            取消
          </button>
          <button
            className="px-6 py-2 bg-white border border-[#EADBC8] rounded-full text-[#4B4036] hover:bg-[#f7f3ec]"
            type="button"
            onClick={() => {
              setFormData({
                id: generateUUID(),
                student_oid: generateUUID().slice(0, 8),
                full_name: '',
                nick_name: '',
                gender: '',
                contact_number: '',
                student_dob: '',
                student_age: '',
                parent_email: '',
                health_notes: '沒有',
                student_preference: '',
                address: '',
                school: '',
                course_type: '',
                regular_weekday: '',
                regular_timeslot: '',
                student_type: '常規',
                student_teacher: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                access_role: 'admin',
                student_email: '',
                student_password: generateUUID().slice(0, 8),
                trial_date: '',
                trial_time: '',
                student_remarks: '',
                trial_remarks: '',
              });
            }}
          >
            重設
          </button>
          <button
            className="px-6 py-2 bg-[#EBC9A4] text-[#2B3A3B] rounded-full hover:bg-[#e5ba8e]"
            disabled={loading}
            type="submit"
          >
            {loading ? '新增中...' : '新增學生'}
          </button>
        </div>
      </form>
    </>
  );
}
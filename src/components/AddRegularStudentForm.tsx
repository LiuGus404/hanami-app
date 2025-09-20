'use client';

import { useState, useEffect } from 'react';

import { PopupSelect } from '@/components/ui/PopupSelect';
import TimePicker from '@/components/ui/TimePicker';
import { supabase } from '@/lib/supabase';
import { CourseType, Teacher } from '@/types';
import { useSearchParams } from 'next/navigation';

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

export default function AddRegularStudentForm() {
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
  const weekdayOptions = [
    { label: 'Mon', value: '1' },
    { label: 'Tue', value: '2' },
    { label: 'Wed', value: '3' },
    { label: 'Thu', value: '4' },
    { label: 'Fri', value: '5' },
    { label: 'Sat', value: '6' },
    { label: 'Sun', value: '0' },
  ];
  const [courseOptions, setCourseOptions] = useState<{ label: string, value: string }[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<{ label: string, value: string }[]>([]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      student_email: `${prev.student_oid}@hanami.com`,
      updated_at: new Date().toISOString(),
    }));
  }, [formData.student_dob, formData.student_oid]);

  // fetch options for course_type and teacher
  useEffect(() => {
    // fetch Hanami_CourseTypes
    supabase.from('Hanami_CourseTypes').select('name').then(({ data }) => {
      if (data) {
        setCourseOptions(data.map((item: { name: string | null }) => ({ label: item.name || '', value: item.name || '' })));
      }
    });
    // fetch hanami_employee
    supabase.from('hanami_employee').select('teacher_nickname').then(({ data }) => {
      if (data) {
        setTeacherOptions([
          { label: '未分配', value: '未分配' },
          ...data.map((item: { teacher_nickname: string }) => ({ label: item.teacher_nickname, value: item.teacher_nickname })),
        ]);
      }
    });
  }, []);

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
          ? (new Date(`${formData.trial_date}T00:00:00+08:00`)).getUTCDay().toString()
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
          lesson_date: formData.trial_date || null,
          actual_timeslot: formData.trial_time || null,
          trial_remarks: formData.trial_remarks || '',
          weekday: weekdayNumber,
          regular_weekday: weekdayNumber,
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
        };
      }
      
      // 先檢查是否已存在
      const { data: existingData } = await supabase
        .from(table)
        .select('id')
        .eq('id', formData.id)
        .single();

      let error;
      if (existingData) {
        // 如果存在，則更新
        const { error: updateError } = await supabase
          .from(table)
          .update(payload)
          .eq('id', formData.id);
        error = updateError;
      } else {
        // 如果不存在，則插入
        const { error: insertError } = await supabase
          .from(table)
          .insert([payload]);
        error = insertError;
      }

      if (error) {
        alert(`新增或更新失敗：${error.message}`);
      } else {
        alert(`${formData.student_type === '試堂' ? '試堂學生' : '常規學生'}已成功新增或更新！`);
        window.location.href = '/admin/students';
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
        {/* 一鍵填入測試資料按鈕 */}
        <div className="flex justify-center mb-2">
          <button
            className="px-4 py-1 bg-[#EBC9A4] text-[#2B3A3B] rounded-full hover:bg-[#e5ba8e] text-sm"
            type="button"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                full_name: '測試學生',
                nick_name: '小測',
                gender: '女',
                contact_number: '98765432',
                student_dob: '2018-05-01',
                student_age: '6',
                parent_email: 'parent@example.com',
                health_notes: '無',
                student_preference: '喜歡畫畫',
                address: '九龍測試路1號',
                school: '測試小學',
                course_type: courseOptions[0]?.value || '鋼琴',
                regular_weekday: '2',
                regular_timeslot: '15:00',
                student_type: '常規',
                student_teacher: teacherOptions[0]?.value || '未分配',
                student_remarks: '這是測試用學生',
                trial_remarks: '',
              }));
            }}
          >
            一鍵填入測試資料
          </button>
        </div>

        {/* 🧩 基本資料與聯絡資訊 */}
        <fieldset className="space-y-3">
          <legend className="font-semibold">🧩 基本資料與聯絡資訊</legend>
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
          <legend className="font-semibold">📚 學習狀態與課程資訊</legend>
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
                  {formData.student_teacher || '請選擇'}
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
                  {formData.regular_weekday || '請選擇'}
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
                  {formData.student_teacher || '請選擇'}
                </button>
              </div>
            </>
          )}
        </fieldset>

        {/* 備註（可修改，輸入框） */}
        <div className="w-full mb-3">
          <label className="block mb-1 text-sm font-medium text-[#4B4036]">備註</label>
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
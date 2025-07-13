import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect } from 'react';

import { PopupSelect } from '@/components/ui/PopupSelect';
import { Teacher } from '@/types';

interface TeacherFormData {
  id: string;
  teacher_fullname: string;
  teacher_nickname: string;
  teacher_role: string | null;
  teacher_status: string | null;
  teacher_email: string | null;
  teacher_phone: string | null;
  teacher_address: string | null;
  teacher_gender: string | null;
  teacher_dob: string | null;
  teacher_hsalary: number | null;
  teacher_msalary: number | null;
  teacher_background: string | null;
  teacher_bankid: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface TeacherBasicInfoProps {
  teacher: Teacher;
  onSave: (teacher: Teacher) => void;
}

export default function TeacherBasicInfo({ teacher, onSave }: TeacherBasicInfoProps) {
  const [formData, setFormData] = useState<TeacherFormData>({
    id: teacher.id,
    teacher_fullname: teacher.teacher_fullname,
    teacher_nickname: teacher.teacher_nickname,
    teacher_role: teacher.teacher_role,
    teacher_status: teacher.teacher_status,
    teacher_email: teacher.teacher_email,
    teacher_phone: teacher.teacher_phone,
    teacher_address: teacher.teacher_address,
    teacher_gender: teacher.teacher_gender,
    teacher_dob: teacher.teacher_dob,
    teacher_hsalary: teacher.teacher_hsalary,
    teacher_msalary: teacher.teacher_msalary,
    teacher_background: teacher.teacher_background,
    teacher_bankid: teacher.teacher_bankid,
    created_at: teacher.created_at,
    updated_at: teacher.updated_at,
  });

  const requiredFields: (keyof TeacherFormData)[] = ['teacher_fullname', 'teacher_nickname'];
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const handleChange = (field: keyof TeacherFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      alert(`請填寫必填欄位：${missingFields.join(', ')}`);
      return;
    }

    const allowedFields: (keyof Teacher)[] = [
      'teacher_fullname',
      'teacher_nickname',
      'teacher_role',
      'teacher_status',
      'teacher_email',
      'teacher_phone',
      'teacher_address',
      'teacher_dob',
      'teacher_hsalary',
      'teacher_msalary',
      'teacher_background',
      'teacher_bankid',
    ];

    const updateData: any = {};
    allowedFields.forEach((key) => {
      let value = formData[key];
      if (typeof value === 'string' && value.trim() === '') value = null;
      if ((key === 'teacher_hsalary' || key === 'teacher_msalary') && value !== null && value !== undefined) {
        value = Number(value);
        if (isNaN(value)) value = null;
      }
      updateData[key] = value;
    });

    console.log('updateData', updateData);

    try {
      const { error } = await supabase
        .from('hanami_employee')
        .update(updateData)
        .eq('id', teacher.id);

      if (error) throw error;
      onSave({ ...teacher, ...updateData });
    } catch (err) {
      console.error('Error updating teacher:', err);
      alert('更新老師資料時發生錯誤');
    }
  };

  console.log('SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SUPABASE_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center gap-4 mb-6">
        <img
          alt="頭像"
          className="w-24 h-24 rounded-full border border-[#EADBC8]"
          src={'/teacher.png'}
        />
        <div>
          <h2 className="text-xl font-semibold">
            {formData.teacher_fullname || '未命名'}
          </h2>
          <p className="text-gray-600">{formData.teacher_nickname}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">老師身份</label>
          <PopupSelect
            options={[
              { label: '全職', value: 'full-time' },
              { label: '兼職', value: 'part-time' },
            ]}
            selected={formData.teacher_role || ''}
            title="老師身份"
            onChange={(value) => handleChange('teacher_role', value as string)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">在職狀態</label>
          <PopupSelect
            options={[
              { label: '在職', value: 'active' },
              { label: '離職', value: 'inactive' },
            ]}
            selected={formData.teacher_status || ''}
            title="在職狀態"
            onChange={(value) => handleChange('teacher_status', value as string)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">電子郵件</label>
          <input
            className="w-full px-3 py-2 border rounded-lg"
            type="email"
            value={formData.teacher_email || ''}
            onChange={(e) => handleChange('teacher_email', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">電話</label>
          <input
            className="w-full px-3 py-2 border rounded-lg"
            type="tel"
            value={formData.teacher_phone || ''}
            onChange={(e) => handleChange('teacher_phone', e.target.value)}
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">地址</label>
          <input
            className="w-full px-3 py-2 border rounded-lg"
            type="text"
            value={formData.teacher_address || ''}
            onChange={(e) => handleChange('teacher_address', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">時薪</label>
          <input
            className="w-full px-3 py-2 border rounded-lg"
            type="number"
            value={formData.teacher_hsalary || ''}
            onChange={(e) => handleChange('teacher_hsalary', e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">月薪</label>
          <input
            className="w-full px-3 py-2 border rounded-lg"
            type="number"
            value={formData.teacher_msalary || ''}
            onChange={(e) => handleChange('teacher_msalary', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
          onClick={handleSubmit}
        >
          儲存
        </button>
      </div>
    </div>
  );
}

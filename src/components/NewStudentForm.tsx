import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const NewStudentForm: React.FC = () => {
  const [form, setForm] = useState({
    full_name: '',
    gender: '',
    student_dob: '',
    student_age: '',
    school: '',
    contact_numb: '',
    parent_email: '',
    address: '',
    health_notes: '',
    student_type: '',
    student_teacher: '',
    course_type: '',
    student_prefe: '',
    started_date: '',
    duration_month: '',
    regular_weekday: '',
    regular_timeslot: '',
    remaining_less: '',
    ongoing_lesso: '',
    upcoming_less: '',
  });

  useEffect(() => {
    if (form.student_dob) {
      const birthDate = new Date(form.student_dob);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      setForm(prev => ({ ...prev, student_age: age.toString() }));
    }
  }, [form.student_dob]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.gender || !form.student_dob) {
      alert('請填寫完整必填欄位');
      return;
    }
    const { error } = await supabase.from('Hanami_Students').insert([form]);
    if (error) {
      alert(`儲存失敗：${error.message}`);
    } else {
      alert('儲存成功！');
      setForm({
        full_name: '',
        gender: '',
        student_dob: '',
        student_age: '',
        school: '',
        contact_numb: '',
        parent_email: '',
        address: '',
        health_notes: '',
        student_type: '',
        student_teacher: '',
        course_type: '',
        student_prefe: '',
        started_date: '',
        duration_month: '',
        regular_weekday: '',
        regular_timeslot: '',
        remaining_less: '',
        ongoing_lesso: '',
        upcoming_less: '',
      });
    }
  };

  return (
    <form className="bg-[#FFFDF8] p-6 rounded-2xl shadow-xl space-y-3 max-w-lg mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold text-center text-[#4B4036]">新增學生</h2>

      <input required className="input" name="full_name" placeholder="學生姓名" value={form.full_name} onChange={handleChange} />
      <div className="flex gap-2">
        <label><input name="gender" type="radio" value="男" onChange={handleChange} /> 男</label>
        <label><input name="gender" type="radio" value="女" onChange={handleChange} /> 女</label>
        <label><input name="gender" type="radio" value="其他" onChange={handleChange} /> 其他</label>
      </div>
      <input required className="input" name="student_dob" type="date" value={form.student_dob} onChange={handleChange} />
      <input readOnly className="input bg-gray-100" name="student_age" value={form.student_age} />
      <input className="input" name="school" placeholder="學校" value={form.school} onChange={handleChange} />

      <input className="input" name="contact_numb" placeholder="聯絡電話" value={form.contact_numb} onChange={handleChange} />
      <input className="input" name="parent_email" placeholder="家長電郵" value={form.parent_email} onChange={handleChange} />
      <input className="input" name="address" placeholder="地址" value={form.address} onChange={handleChange} />
      <textarea 
        className="input" 
        name="health_notes" 
        placeholder="健康備註" 
        value={form.health_notes} 
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>)} 
      />

      <input className="input" name="student_type" placeholder="學生類型 (常規/試堂)" value={form.student_type} onChange={handleChange} />
      <input className="input" name="student_teacher" placeholder="負責老師" value={form.student_teacher} onChange={handleChange} />
      <input className="input" name="course_type" placeholder="課程類別" value={form.course_type} onChange={handleChange} />
      <input className="input" name="student_prefe" placeholder="偏好設定" value={form.student_prefe} onChange={handleChange} />
      <input className="input" name="started_date" type="date" value={form.started_date} onChange={handleChange} />

      <input className="input" name="duration_month" placeholder="每堂時長（分鐘）" value={form.duration_month} onChange={handleChange} />
      <input className="input" name="regular_weekday" placeholder="固定上課日" value={form.regular_weekday} onChange={handleChange} />
      <input className="input" name="regular_timeslot" type="time" value={form.regular_timeslot} onChange={handleChange} />
      <input className="input" name="remaining_less" placeholder="剩餘堂數" value={form.remaining_less} onChange={handleChange} />
      <input className="input" name="ongoing_lesso" placeholder="進行中堂數" value={form.ongoing_lesso} onChange={handleChange} />
      <input className="input" name="upcoming_less" placeholder="即將到來堂數" value={form.upcoming_less} onChange={handleChange} />

      <div className="flex justify-between">
        <button className="hanami-btn-soft px-4 py-2 text-[#4B4036]" type="button" onClick={() => window.history.back()}>
          取消
        </button>
        <button className="hanami-btn px-4 py-2 text-[#2B3A3B]" type="submit">
          儲存
        </button>
      </div>
    </form>
  );
};

export default NewStudentForm;
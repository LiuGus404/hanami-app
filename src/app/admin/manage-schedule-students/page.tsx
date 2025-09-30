'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ScheduleStudent {
  id: string;
  weekday: number;
  timeslot: string;
  course_code: string;
  assigned_student_ids: string[];
  student_count: number;
}

interface Student {
  id: string;
  student_oid: string;
  full_name: string;
  student_age: number | null;
  contact_number: string;
  regular_weekday: number;
  regular_timeslot: string;
  course_type: string;
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ManageScheduleStudents() {
  const [schedules, setSchedules] = useState<ScheduleStudent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 載入時段數據
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('hanami_schedule')
        .select('*')
        .not('course_code', 'is', null)
        .order('weekday', { ascending: true })
        .order('timeslot', { ascending: true });

      if (scheduleError) throw scheduleError;

      // 載入學生數據
      const { data: studentData, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('student_type', '常規')
        .order('full_name', { ascending: true });

      if (studentError) throw studentError;

      setSchedules(scheduleData || []);
      setStudents(studentData || []);
    } catch (error) {
      console.error('載入數據失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSelect = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    setSelectedSchedule(scheduleId);
    setSelectedStudents(schedule?.assigned_student_ids || []);
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSaveStudents = async () => {
    if (!selectedSchedule) return;

    try {
      const { error } = await supabase
        .from('hanami_schedule')
        .update({ assigned_student_ids: selectedStudents })
        .eq('id', selectedSchedule);

      if (error) throw error;

      alert('學生分配已保存！');
      fetchData();
    } catch (error) {
      console.error('保存失敗:', error);
      alert('保存失敗');
    }
  };

  const getScheduleStudents = () => {
    if (!selectedSchedule) return [];
    return students.filter(student => 
      selectedStudents.includes(student.id)
    );
  };

  const getAvailableStudents = () => {
    return students.filter(student => 
      !selectedStudents.includes(student.id)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-lg">載入中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">管理時段學生分配</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 時段列表 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">時段列表</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {schedules.map(schedule => (
                <div
                  key={schedule.id}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    selectedSchedule === schedule.id
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => handleScheduleSelect(schedule.id)}
                >
                  <div className="font-medium">
                    {weekdays[schedule.weekday]} {schedule.timeslot}
                  </div>
                  <div className="text-sm text-gray-600">
                    {schedule.course_code}
                  </div>
                  <div className="text-xs text-gray-500">
                    學生: {schedule.assigned_student_ids?.length || 0} 人
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 已分配學生 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              已分配學生 ({getScheduleStudents().length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getScheduleStudents().map(student => (
                <div
                  key={student.id}
                  className="p-3 bg-green-50 border border-green-200 rounded cursor-pointer"
                  onClick={() => handleStudentToggle(student.id)}
                >
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-sm text-gray-600">
                    {student.student_oid} | {student.student_age ? `${student.student_age}歲` : '年齡未設定'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {weekdays[student.regular_weekday]} {student.regular_timeslot} | {student.course_type}
                  </div>
                </div>
              ))}
              {getScheduleStudents().length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  暫無分配的學生
                </div>
              )}
            </div>
          </div>

          {/* 可用學生 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              可用學生 ({getAvailableStudents().length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getAvailableStudents().map(student => (
                <div
                  key={student.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => handleStudentToggle(student.id)}
                >
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-sm text-gray-600">
                    {student.student_oid} | {student.student_age ? `${student.student_age}歲` : '年齡未設定'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {weekdays[student.regular_weekday]} {student.regular_timeslot} | {student.course_type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        {selectedSchedule && (
          <div className="mt-6 flex justify-center gap-4">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              onClick={handleSaveStudents}
            >
              保存學生分配
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
              onClick={() => {
                setSelectedSchedule(null);
                setSelectedStudents([]);
              }}
            >
              取消選擇
            </button>
          </div>
        )}

        {/* 統計信息 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">統計信息</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{schedules.length}</div>
              <div className="text-sm text-gray-600">總時段數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {schedules.filter(s => (s.assigned_student_ids?.length || 0) > 0).length}
              </div>
              <div className="text-sm text-gray-600">有學生的時段</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {schedules.reduce((sum, s) => sum + (s.assigned_student_ids?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">總學生分配數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{students.length}</div>
              <div className="text-sm text-gray-600">總學生數</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

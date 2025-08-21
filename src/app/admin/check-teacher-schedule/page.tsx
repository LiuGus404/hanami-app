'use client';

import { useState, useEffect } from 'react';

interface TeacherScheduleData {
  success: boolean;
  summary: {
    totalSchedules: number;
    recentSchedules: number;
    totalTeachers: number;
    duplicateSchedules: number;
  };
  recentSchedules: any[];
  teachers: any[];
  scheduleByTeacher: Record<string, any[]>;
  duplicateSchedules: any[];
  checkDate: string;
}

export default function CheckTeacherSchedulePage() {
  const [data, setData] = useState<TeacherScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/check-teacher-schedule');
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err) {
      setError('檢查資料時發生錯誤');
      console.error('檢查資料錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-[#FFF9F2] min-h-screen">
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
          <h1 className="text-2xl font-bold mb-4">檢查教師排班資料</h1>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64] mx-auto"></div>
            <p className="mt-4 text-[#4B4036]">正在檢查資料庫狀況...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#FFF9F2] min-h-screen">
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
          <h1 className="text-2xl font-bold mb-4">檢查教師排班資料</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">錯誤: {error}</p>
          </div>
          <button
            onClick={checkData}
            className="px-4 py-2 bg-[#A68A64] text-white rounded-lg hover:bg-[#937654] transition-colors"
          >
            重新檢查
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-[#FFF9F2] min-h-screen">
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
          <h1 className="text-2xl font-bold mb-4">檢查教師排班資料</h1>
          <p>沒有資料</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#FFF9F2] min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#4B4036]">教師排班資料檢查結果</h1>
          <button
            onClick={checkData}
            className="px-4 py-2 bg-[#A68A64] text-white rounded-lg hover:bg-[#937654] transition-colors"
          >
            重新檢查
          </button>
        </div>

        {/* 摘要資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-800">總排班記錄</h3>
            <p className="text-2xl font-bold text-blue-600">{data.summary.totalSchedules}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-800">最近30天排班</h3>
            <p className="text-2xl font-bold text-green-600">{data.summary.recentSchedules}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-bold text-purple-800">教師總數</h3>
            <p className="text-2xl font-bold text-purple-600">{data.summary.totalTeachers}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-bold text-yellow-800">重複排班</h3>
            <p className="text-2xl font-bold text-yellow-600">{data.summary.duplicateSchedules}</p>
          </div>
        </div>

        {/* 最近排班記錄 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 text-[#4B4036]">最近30天排班記錄</h2>
          {data.recentSchedules.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600">沒有找到最近30天的排班記錄</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-[#EADBC8] rounded-lg">
                <thead className="bg-[#FFF9F2]">
                  <tr>
                    <th className="p-3 text-left border-b border-[#EADBC8]">教師ID</th>
                    <th className="p-3 text-left border-b border-[#EADBC8]">教師姓名</th>
                    <th className="p-3 text-left border-b border-[#EADBC8]">排班日期</th>
                    <th className="p-3 text-left border-b border-[#EADBC8]">開始時間</th>
                    <th className="p-3 text-left border-b border-[#EADBC8]">結束時間</th>
                    <th className="p-3 text-left border-b border-[#EADBC8]">創建時間</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSchedules.map((schedule, index) => {
                    const teacher = data.teachers.find(t => t.id === schedule.teacher_id);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-3 border-b border-[#EADBC8]">{schedule.teacher_id}</td>
                        <td className="p-3 border-b border-[#EADBC8]">
                          {teacher ? (teacher.teacher_nickname || teacher.teacher_fullname) : '未知教師'}
                        </td>
                        <td className="p-3 border-b border-[#EADBC8]">{schedule.scheduled_date}</td>
                        <td className="p-3 border-b border-[#EADBC8]">{schedule.start_time}</td>
                        <td className="p-3 border-b border-[#EADBC8]">{schedule.end_time}</td>
                        <td className="p-3 border-b border-[#EADBC8]">
                          {schedule.created_at ? new Date(schedule.created_at).toLocaleString('zh-TW') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 按教師分組的排班統計 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 text-[#4B4036]">各教師排班統計</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.scheduleByTeacher).map(([teacherId, schedules]) => {
              const teacher = data.teachers.find(t => t.id === teacherId);
              return (
                <div key={teacherId} className="bg-[#FFF9F2] border border-[#EADBC8] rounded-lg p-4">
                  <h3 className="font-bold text-[#4B4036] mb-2">
                    {teacher ? (teacher.teacher_nickname || teacher.teacher_fullname) : `教師 ${teacherId}`}
                  </h3>
                  <p className="text-[#A68A64] mb-2">排班次數: {schedules.length}</p>
                  <div className="text-sm text-[#4B4036]">
                    {schedules.slice(0, 3).map((schedule, index) => (
                      <div key={index} className="mb-1">
                        {schedule.scheduled_date} ({schedule.start_time}-{schedule.end_time})
                      </div>
                    ))}
                    {schedules.length > 3 && (
                      <div className="text-[#A68A64]">... 還有 {schedules.length - 3} 筆記錄</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 重複排班記錄 */}
        {data.duplicateSchedules.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 text-[#4B4036] text-red-600">⚠️ 重複排班記錄</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 mb-4">發現以下重複的排班記錄，這可能導致資料不一致：</p>
              <div className="overflow-x-auto">
                <table className="w-full border border-red-200 rounded-lg">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="p-3 text-left border-b border-red-200">教師ID</th>
                      <th className="p-3 text-left border-b border-red-200">排班日期</th>
                      <th className="p-3 text-left border-b border-red-200">開始時間</th>
                      <th className="p-3 text-left border-b border-red-200">結束時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.duplicateSchedules.map((schedule, index) => (
                      <tr key={index} className="hover:bg-red-100">
                        <td className="p-3 border-b border-red-200">{schedule.teacher_id}</td>
                        <td className="p-3 border-b border-red-200">{schedule.scheduled_date}</td>
                        <td className="p-3 border-b border-red-200">{schedule.start_time}</td>
                        <td className="p-3 border-b border-red-200">{schedule.end_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 檢查時間 */}
        <div className="text-sm text-[#A68A64] text-center">
          最後檢查時間: {new Date(data.checkDate).toLocaleString('zh-TW')}
        </div>
      </div>
    </div>
  );
} 
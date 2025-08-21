'use client';

import { useState } from 'react';
import StudentActivitiesPanel from '@/components/ui/StudentActivitiesPanel';

export default function TestStudentActivitiesPage() {
  const [studentId, setStudentId] = useState('550e8400-e29b-41d4-a716-446655440001');
  const [lessonDate, setLessonDate] = useState('2024-12-19');
  const [timeslot, setTimeslot] = useState('09:30:00');
  const [showPanel, setShowPanel] = useState(false);

  const testStudents = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: '測試學生1' },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: '測試學生2' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: '測試學生3' },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">測試學生活動面板</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">測試說明</h2>
        <p className="text-yellow-700 text-sm">
          此頁面用於測試 StudentActivitiesPanel 組件。請確保已經執行了以下 SQL 腳本：
        </p>
        <ul className="text-yellow-700 text-sm mt-2 list-disc list-inside">
          <li>database/hanami_student_lesson_activities.sql</li>
          <li>database/insert_test_student_activities.sql</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">學生 ID</label>
            <select 
              value={studentId} 
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              {testStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.id})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">課程日期</label>
            <input 
              type="date" 
              value={lessonDate} 
              onChange={(e) => setLessonDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">時段</label>
            <input 
              type="text" 
              value={timeslot} 
              onChange={(e) => setTimeslot(e.target.value)}
              placeholder="例如: 09:30:00"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <button
            onClick={() => setShowPanel(true)}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            顯示學生活動面板
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">測試學生列表</h3>
          <div className="space-y-2">
            {testStudents.map(student => (
              <div key={student.id} className="p-3 border border-gray-200 rounded">
                <div className="font-medium">{student.name}</div>
                <div className="text-sm text-gray-500">{student.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPanel && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">學生活動面板</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <StudentActivitiesPanel
              studentId={studentId}
              lessonDate={lessonDate}
              timeslot={timeslot}
            />
          </div>
        </div>
      )}
    </div>
  );
} 
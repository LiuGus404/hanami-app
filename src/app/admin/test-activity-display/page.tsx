'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestActivityDisplay() {
  const [studentId, setStudentId] = useState('db5bc7ad-79a1-4d46-bc56-19ace1c49189');
  const [lessonDate, setLessonDate] = useState('2025-01-07');
  const [timeslot, setTimeslot] = useState('');
  const [activities, setActivities] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testActivityDisplay = async () => {
    setLoading(true);
    try {
      console.log('🧪 測試活動顯示...');
      
      const response = await fetch(
        `/api/student-activities?studentId=${studentId}&lessonDate=${lessonDate}&timeslot=${timeslot}`
      );
      
      if (!response.ok) {
        throw new Error('獲取學生活動失敗');
      }

      const result = await response.json();
      console.log('📊 API 響應:', result);
      
      if (result.success) {
        setActivities(result.data);
      } else {
        throw new Error(result.error || '獲取學生活動失敗');
      }
    } catch (error) {
      console.error('測試失敗:', error);
      alert('測試失敗: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🧪 測試活動顯示</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              學生ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="輸入學生ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              課程日期
            </label>
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              時段 (可選)
            </label>
            <input
              type="text"
              value={timeslot}
              onChange={(e) => setTimeslot(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: 10:00-11:00"
            />
          </div>
        </div>
        
        <button
          onClick={testActivityDisplay}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? '測試中...' : '測試活動顯示'}
        </button>
      </div>

      {activities && (
        <div className="space-y-6">
          {/* 正在學習的活動 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-green-600">
              🎯 正在學習的活動 ({activities.ongoingActivities?.length || 0})
            </h2>
            {activities.ongoingActivities?.length > 0 ? (
              <div className="space-y-3">
                {activities.ongoingActivities.map((activity: any) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {activity.activityName || `活動 ${activity.id.slice(0, 8)}`}
                        </h3>
                        {!activity.activityName && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            ⚠️ 缺少活動資訊
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          進度: {activity.progress || 0}%
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {activity.completionStatus || 'unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>活動ID:</strong> {activity.activityId || 'N/A'}</p>
                      <p><strong>教學活動ID:</strong> {activity.teachingActivityId || 'N/A'}</p>
                      <p><strong>活動類型:</strong> {activity.activityType || '未知類型'}</p>
                      <p><strong>難度:</strong> {activity.difficultyLevel || 1}</p>
                      <p><strong>分配時間:</strong> {activity.assignedAt || 'N/A'}</p>
                      {activity.activityDescription && (
                        <p><strong>描述:</strong> {activity.activityDescription}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">暫無正在學習的活動</p>
              </div>
            )}
          </div>

          {/* 本次課堂活動 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">
              📚 本次課堂活動 ({activities.currentLessonActivities?.length || 0})
            </h2>
            {activities.currentLessonActivities?.length > 0 ? (
              <div className="space-y-3">
                {activities.currentLessonActivities.map((activity: any) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {activity.activityName || `活動 ${activity.id.slice(0, 8)}`}
                        </h3>
                        {!activity.activityName && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            ⚠️ 缺少活動資訊
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          進度: {activity.progress || 0}%
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {activity.completionStatus || 'unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>活動ID:</strong> {activity.activityId || 'N/A'}</p>
                      <p><strong>教學活動ID:</strong> {activity.teachingActivityId || 'N/A'}</p>
                      <p><strong>活動類型:</strong> {activity.activityType || '未知類型'}</p>
                      <p><strong>難度:</strong> {activity.difficultyLevel || 1}</p>
                      <p><strong>分配時間:</strong> {activity.assignedAt || 'N/A'}</p>
                      {activity.activityDescription && (
                        <p><strong>描述:</strong> {activity.activityDescription}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">暫無本次課堂活動</p>
              </div>
            )}
          </div>

          {/* 上次課堂活動 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-600">
              📖 上次課堂活動 ({activities.previousLessonActivities?.length || 0})
            </h2>
            {activities.previousLessonActivities?.length > 0 ? (
              <div className="space-y-3">
                {activities.previousLessonActivities.map((activity: any) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {activity.activityName || `活動 ${activity.id.slice(0, 8)}`}
                        </h3>
                        {!activity.activityName && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            ⚠️ 缺少活動資訊
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          進度: {activity.progress || 0}%
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          {activity.completionStatus || 'unknown'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>活動ID:</strong> {activity.activityId || 'N/A'}</p>
                      <p><strong>教學活動ID:</strong> {activity.teachingActivityId || 'N/A'}</p>
                      <p><strong>活動類型:</strong> {activity.activityType || '未知類型'}</p>
                      <p><strong>難度:</strong> {activity.difficultyLevel || 1}</p>
                      <p><strong>分配時間:</strong> {activity.assignedAt || 'N/A'}</p>
                      {activity.activityDescription && (
                        <p><strong>描述:</strong> {activity.activityDescription}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">暫無上次課堂活動</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

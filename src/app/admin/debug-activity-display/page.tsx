'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugActivityDisplay() {
  const [studentId, setStudentId] = useState('db5bc7ad-79a1-4d46-bc56-19ace1c49189');
  const [debugResults, setDebugResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const debugActivityDisplay = async () => {
    setLoading(true);
    try {
      console.log('🔍 開始調試活動顯示問題...');
      
      // 1. 直接查詢 hanami_student_activities 表
      const { data: studentActivities, error: studentError } = await supabase
        .from('hanami_student_activities')
        .select('*')
        .eq('student_id', studentId)
        .eq('activity_type', 'ongoing');

      console.log('📊 學生活動記錄:', studentActivities);
      console.log('❌ 學生活動查詢錯誤:', studentError);

      // 2. 檢查關聯的教學活動
      const activityIds = studentActivities?.map(a => a.activity_id).filter(Boolean) || [];
      console.log('🎯 活動ID列表:', activityIds);

      const { data: teachingActivities, error: teachingError } = await supabase
        .from('hanami_teaching_activities')
        .select('*')
        .in('id', activityIds);

      console.log('📚 教學活動記錄:', teachingActivities);
      console.log('❌ 教學活動查詢錯誤:', teachingError);

      // 3. 檢查哪些活動ID找不到對應的教學活動
      const foundActivityIds = teachingActivities?.map(t => t.id) || [];
      const missingActivityIds = activityIds.filter(id => !foundActivityIds.includes(id));
      console.log('⚠️ 找不到對應教學活動的ID:', missingActivityIds);

      // 4. 測試完整的關聯查詢
      const { data: fullQuery, error: fullError } = await supabase
        .from('hanami_student_activities')
        .select(`
          id,
          completion_status,
          assigned_at,
          time_spent,
          teacher_notes,
          student_feedback,
          progress,
          activity_id,
          hanami_teaching_activities (
            id,
            activity_name,
            activity_description,
            activity_type,
            difficulty_level,
            duration_minutes,
            materials_needed,
            instructions
          )
        `)
        .eq('student_id', studentId)
        .eq('activity_type', 'ongoing')
        .lt('progress', 100);

      console.log('🔗 完整關聯查詢結果:', fullQuery);
      console.log('❌ 完整關聯查詢錯誤:', fullError);

      // 5. 檢查 progress 欄位的實際值
      const progressAnalysis = studentActivities?.map(activity => ({
        id: activity.id,
        progress: activity.progress,
        progressType: typeof activity.progress,
        isLessThan100: activity.progress < 100,
        completionStatus: activity.completion_status
      }));

      console.log('📈 進度分析:', progressAnalysis);

      setDebugResults({
        studentActivities,
        teachingActivities,
        missingActivityIds,
        fullQuery,
        progressAnalysis,
        errors: {
          studentError,
          teachingError,
          fullError
        }
      });

    } catch (error) {
      console.error('調試過程中發生錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🎯 調試活動顯示問題</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
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
        
        <button
          onClick={debugActivityDisplay}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? '調試中...' : '開始調試'}
        </button>
      </div>

      {debugResults && (
        <div className="space-y-6">
          {/* 學生活動記錄 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📊 學生活動記錄</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Activity ID</th>
                    <th className="px-4 py-2 text-left">Progress</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Assigned At</th>
                  </tr>
                </thead>
                <tbody>
                  {debugResults.studentActivities?.map((activity: any) => (
                    <tr key={activity.id} className="border-b">
                      <td className="px-4 py-2 text-sm">{activity.id}</td>
                      <td className="px-4 py-2 text-sm">{activity.activity_id}</td>
                      <td className="px-4 py-2 text-sm">{activity.progress}</td>
                      <td className="px-4 py-2 text-sm">{activity.completion_status}</td>
                      <td className="px-4 py-2 text-sm">{activity.assigned_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 教學活動記錄 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📚 教學活動記錄</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Activity Name</th>
                    <th className="px-4 py-2 text-left">Activity Type</th>
                    <th className="px-4 py-2 text-left">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {debugResults.teachingActivities?.map((activity: any) => (
                    <tr key={activity.id} className="border-b">
                      <td className="px-4 py-2 text-sm">{activity.id}</td>
                      <td className="px-4 py-2 text-sm">{activity.activity_name}</td>
                      <td className="px-4 py-2 text-sm">{activity.activity_type}</td>
                      <td className="px-4 py-2 text-sm">{activity.difficulty_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 缺失的活動ID */}
          {debugResults.missingActivityIds?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-red-800">⚠️ 找不到對應教學活動的ID</h2>
              <div className="space-y-2">
                {debugResults.missingActivityIds.map((id: string) => (
                  <div key={id} className="bg-red-100 p-2 rounded text-red-800">
                    {id}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 完整關聯查詢結果 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">🔗 完整關聯查詢結果</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Activity Name</th>
                    <th className="px-4 py-2 text-left">Progress</th>
                    <th className="px-4 py-2 text-left">Has Teaching Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {debugResults.fullQuery?.map((activity: any) => (
                    <tr key={activity.id} className="border-b">
                      <td className="px-4 py-2 text-sm">{activity.id}</td>
                      <td className="px-4 py-2 text-sm">
                        {activity.hanami_teaching_activities?.activity_name || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm">{activity.progress}</td>
                      <td className="px-4 py-2 text-sm">
                        {activity.hanami_teaching_activities ? '✅' : '❌'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 進度分析 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📈 進度分析</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Progress</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Is Less Than 100</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {debugResults.progressAnalysis?.map((analysis: any) => (
                    <tr key={analysis.id} className="border-b">
                      <td className="px-4 py-2 text-sm">{analysis.id}</td>
                      <td className="px-4 py-2 text-sm">{analysis.progress}</td>
                      <td className="px-4 py-2 text-sm">{analysis.progressType}</td>
                      <td className="px-4 py-2 text-sm">
                        {analysis.isLessThan100 ? '✅' : '❌'}
                      </td>
                      <td className="px-4 py-2 text-sm">{analysis.completionStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 錯誤信息 */}
          {(debugResults.errors.studentError || debugResults.errors.teachingError || debugResults.errors.fullError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-red-800">❌ 錯誤信息</h2>
              <div className="space-y-4">
                {debugResults.errors.studentError && (
                  <div>
                    <h3 className="font-bold text-red-700">學生活動查詢錯誤:</h3>
                    <pre className="bg-red-100 p-2 rounded text-red-800 text-sm overflow-x-auto">
                      {JSON.stringify(debugResults.errors.studentError, null, 2)}
                    </pre>
                  </div>
                )}
                {debugResults.errors.teachingError && (
                  <div>
                    <h3 className="font-bold text-red-700">教學活動查詢錯誤:</h3>
                    <pre className="bg-red-100 p-2 rounded text-red-800 text-sm overflow-x-auto">
                      {JSON.stringify(debugResults.errors.teachingError, null, 2)}
                    </pre>
                  </div>
                )}
                {debugResults.errors.fullError && (
                  <div>
                    <h3 className="font-bold text-red-700">完整關聯查詢錯誤:</h3>
                    <pre className="bg-red-100 p-2 rounded text-red-800 text-sm overflow-x-auto">
                      {JSON.stringify(debugResults.errors.fullError, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

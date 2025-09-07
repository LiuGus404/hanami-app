'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugStudentIdMismatch() {
  const [studentId, setStudentId] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDebug = async () => {
    if (!studentId.trim()) {
      setError('請輸入學生ID');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // 1. 檢查學生基本資料
      const { data: studentData, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) {
        throw new Error(`學生資料查詢失敗: ${studentError.message}`);
      }

      // 2. 檢查學生活動資料
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('hanami_student_activities')
        .select(`
          id,
          student_id,
          activity_id,
          activity_type,
          completion_status,
          progress,
          assigned_at,
          lesson_date,
          timeslot,
          hanami_teaching_activities!left (
            id,
            activity_name,
            activity_description
          )
        `)
        .eq('student_id', studentId);

      if (activitiesError) {
        throw new Error(`學生活動查詢失敗: ${activitiesError.message}`);
      }

      // 3. 檢查課程記錄
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('hanami_student_lesson')
        .select('*')
        .eq('student_id', studentId)
        .order('lesson_date', { ascending: false })
        .limit(5);

      if (lessonsError) {
        throw new Error(`課程記錄查詢失敗: ${lessonsError.message}`);
      }

      // 4. 檢查課程包
      const { data: packagesData, error: packagesError } = await supabase
        .from('Hanami_Student_Package')
        .select('*')
        .eq('student_id', studentId);

      if (packagesError) {
        throw new Error(`課程包查詢失敗: ${packagesError.message}`);
      }

      setDebugInfo({
        student: studentData,
        activities: activitiesData,
        lessons: lessonsData,
        packages: packagesData,
        summary: {
          totalActivities: activitiesData?.length || 0,
          ongoingActivities: activitiesData?.filter(a => a.activity_type === 'ongoing').length || 0,
          lessonActivities: activitiesData?.filter(a => a.activity_type === 'lesson').length || 0,
          totalLessons: lessonsData?.length || 0,
          totalPackages: packagesData?.length || 0
        }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : '查詢失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#FFFDF8] rounded-xl shadow-lg p-6 border border-[#EADBC8]">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6">🔍 學生ID調試工具</h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              學生ID
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="請輸入學生ID (UUID格式)"
                className="flex-1 px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              />
              <button
                onClick={handleDebug}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50"
              >
                {loading ? '查詢中...' : '開始調試'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {debugInfo && (
            <div className="space-y-6">
              {/* 學生基本資料 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">👤 學生基本資料</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-[#2B3A3B]">姓名:</span>
                    <span className="ml-2 text-[#4B4036]">{debugInfo.student?.full_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#2B3A3B]">暱稱:</span>
                    <span className="ml-2 text-[#4B4036]">{debugInfo.student?.nick_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#2B3A3B]">年齡:</span>
                    <span className="ml-2 text-[#4B4036]">{debugInfo.student?.student_age || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#2B3A3B]">課程類型:</span>
                    <span className="ml-2 text-[#4B4036]">{debugInfo.student?.course_type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#2B3A3B]">學生類型:</span>
                    <span className="ml-2 text-[#4B4036]">{debugInfo.student?.student_type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#2B3A3B]">聯絡電話:</span>
                    <span className="ml-2 text-[#4B4036]">{debugInfo.student?.contact_number || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* 統計摘要 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">📊 統計摘要</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FFD59A]">{debugInfo.summary.totalActivities}</div>
                    <div className="text-sm text-[#2B3A3B]">總活動數</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#EBC9A4]">{debugInfo.summary.ongoingActivities}</div>
                    <div className="text-sm text-[#2B3A3B]">正在學習</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FFB6C1]">{debugInfo.summary.lessonActivities}</div>
                    <div className="text-sm text-[#2B3A3B]">課堂活動</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#A8DADC]">{debugInfo.summary.totalLessons}</div>
                    <div className="text-sm text-[#2B3A3B]">課程記錄</div>
                  </div>
                </div>
              </div>

              {/* 學生活動詳情 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">🎯 學生活動詳情</h2>
                {debugInfo.activities && debugInfo.activities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EADBC8]">
                          <th className="text-left py-2 text-[#2B3A3B]">活動ID</th>
                          <th className="text-left py-2 text-[#2B3A3B]">活動名稱</th>
                          <th className="text-left py-2 text-[#2B3A3B]">類型</th>
                          <th className="text-left py-2 text-[#2B3A3B]">進度</th>
                          <th className="text-left py-2 text-[#2B3A3B]">狀態</th>
                          <th className="text-left py-2 text-[#2B3A3B]">分配時間</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugInfo.activities.map((activity: any, index: number) => (
                          <tr key={activity.id} className="border-b border-[#EADBC8]">
                            <td className="py-2 text-[#4B4036] font-mono text-xs">{activity.id}</td>
                            <td className="py-2 text-[#4B4036]">
                              {activity.hanami_teaching_activities?.activity_name || '無關聯教學活動'}
                            </td>
                            <td className="py-2 text-[#4B4036]">
                              <span className={`px-2 py-1 rounded text-xs ${
                                activity.activity_type === 'ongoing' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {activity.activity_type}
                              </span>
                            </td>
                            <td className="py-2 text-[#4B4036]">{activity.progress || 0}%</td>
                            <td className="py-2 text-[#4B4036]">{activity.completion_status || 'N/A'}</td>
                            <td className="py-2 text-[#4B4036]">
                              {activity.assigned_at ? new Date(activity.assigned_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[#2B3A3B]">沒有找到學生活動記錄</p>
                )}
              </div>

              {/* 最近課程記錄 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">📚 最近課程記錄</h2>
                {debugInfo.lessons && debugInfo.lessons.length > 0 ? (
                  <div className="space-y-2">
                    {debugInfo.lessons.map((lesson: any, index: number) => (
                      <div key={lesson.id} className="p-3 bg-gray-50 rounded border border-[#EADBC8]">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-[#4B4036]">
                              {new Date(lesson.lesson_date).toLocaleDateString()}
                            </span>
                            <span className="ml-2 text-[#2B3A3B]">
                              {lesson.actual_timeslot || lesson.regular_timeslot || 'N/A'}
                            </span>
                          </div>
                          <span className="text-sm text-[#2B3A3B]">
                            {lesson.lesson_status || 'N/A'}
                          </span>
                        </div>
                        {lesson.lesson_teacher && (
                          <div className="text-sm text-[#2B3A3B] mt-1">
                            教師: {lesson.lesson_teacher}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#2B3A3B]">沒有找到課程記錄</p>
                )}
              </div>

              {/* 課程包資訊 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">📦 課程包資訊</h2>
                {debugInfo.packages && debugInfo.packages.length > 0 ? (
                  <div className="space-y-2">
                    {debugInfo.packages.map((pkg: any, index: number) => (
                      <div key={pkg.id} className="p-3 bg-gray-50 rounded border border-[#EADBC8]">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-[#4B4036]">{pkg.course_name}</span>
                            <span className="ml-2 text-[#2B3A3B]">({pkg.package_type})</span>
                          </div>
                          <span className="text-sm text-[#2B3A3B]">
                            {pkg.remaining_lessons}/{pkg.total_lessons} 堂
                          </span>
                        </div>
                        <div className="text-sm text-[#2B3A3B] mt-1">
                          開始日期: {new Date(pkg.start_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#2B3A3B]">沒有找到課程包記錄</p>
                )}
              </div>
            </div>
          )}

          {/* 使用說明 */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-[#4B4036] mb-2">💡 使用說明</h3>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• 輸入學生ID來查看該學生的完整資料</li>
              <li>• 檢查學生活動是否正確關聯到該學生</li>
              <li>• 確認活動資料中的 student_id 是否與輸入的ID匹配</li>
              <li>• 如果發現不匹配，請檢查學生選擇邏輯</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

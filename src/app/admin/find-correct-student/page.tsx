'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FindCorrectStudent() {
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const results: any = {
        targetStudentId: 'db5bc7ad-79a1-4d46-bc56-19ace1c49189',
        currentStudentId: '9f46724b-f7b3-45fc-bc25-b0ae0c74040c',
        students: {
          target: null,
          current: null
        },
        activities: {
          target: [],
          current: []
        }
      };

      // 1. 查詢目標學生（您期望查看的學生）
      const { data: targetStudentData, error: targetStudentError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('id', results.targetStudentId)
        .single();

      if (targetStudentData) {
        results.students.target = targetStudentData;
      }

      // 2. 查詢當前學生（您實際點擊的學生）
      const { data: currentStudentData, error: currentStudentError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('id', results.currentStudentId)
        .single();

      if (currentStudentData) {
        results.students.current = currentStudentData;
      }

      // 3. 查詢目標學生的活動
      const { data: targetActivitiesData, error: targetActivitiesError } = await supabase
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
            activity_description,
            activity_type,
            difficulty_level,
            duration_minutes,
            materials_needed,
            instructions
          )
        `)
        .eq('student_id', results.targetStudentId)
        .eq('activity_type', 'ongoing')
        .order('assigned_at', { ascending: false });

      if (targetActivitiesData) {
        results.activities.target = targetActivitiesData;
      }

      // 4. 查詢當前學生的活動
      const { data: currentActivitiesData, error: currentActivitiesError } = await supabase
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
            activity_description,
            activity_type,
            difficulty_level,
            duration_minutes,
            materials_needed,
            instructions
          )
        `)
        .eq('student_id', results.currentStudentId)
        .eq('activity_type', 'ongoing')
        .order('assigned_at', { ascending: false });

      if (currentActivitiesData) {
        results.activities.current = currentActivitiesData;
      }

      setSearchResults(results);

    } catch (err) {
      setError(err instanceof Error ? err.message : '搜尋失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#FFFDF8] rounded-xl shadow-lg p-6 border border-[#EADBC8]">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6">🔍 找到正確的學生</h1>
          
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="font-semibold text-[#4B4036] mb-2">⚠️ 問題確認</h2>
            <p className="text-sm text-[#2B3A3B] mb-2">
              根據日誌分析，您點擊的學生ID與期望查看活動的學生ID不匹配：
            </p>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• <strong>您點擊的學生ID</strong>: <span className="font-mono bg-gray-100 px-2 py-1 rounded">9f46724b-f7b3-45fc-bc25-b0ae0c74040c</span> (只有1個活動)</li>
              <li>• <strong>您期望查看的學生ID</strong>: <span className="font-mono bg-gray-100 px-2 py-1 rounded">db5bc7ad-79a1-4d46-bc56-19ace1c49189</span> (有9個活動)</li>
            </ul>
          </div>

          <div className="mb-6">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? '搜尋中...' : '搜尋學生資料'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {searchResults && (
            <div className="space-y-6">
              {/* 學生對比 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">👥 學生對比</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 目標學生 */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-[#4B4036] mb-2">🎯 目標學生 (您期望查看的)</h3>
                    {searchResults.students.target ? (
                      <div className="text-sm text-[#2B3A3B] space-y-1">
                        <div><strong>姓名:</strong> {searchResults.students.target.full_name}</div>
                        <div><strong>暱稱:</strong> {searchResults.students.target.nick_name}</div>
                        <div><strong>課程類型:</strong> {searchResults.students.target.course_type}</div>
                        <div><strong>聯絡電話:</strong> {searchResults.students.target.contact_number}</div>
                        <div><strong>ongoing活動數:</strong> {searchResults.activities.target.length}</div>
                      </div>
                    ) : (
                      <p className="text-red-600 text-sm">學生不存在</p>
                    )}
                  </div>

                  {/* 當前學生 */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-[#4B4036] mb-2">📍 當前學生 (您實際點擊的)</h3>
                    {searchResults.students.current ? (
                      <div className="text-sm text-[#2B3A3B] space-y-1">
                        <div><strong>姓名:</strong> {searchResults.students.current.full_name}</div>
                        <div><strong>暱稱:</strong> {searchResults.students.current.nick_name}</div>
                        <div><strong>課程類型:</strong> {searchResults.students.current.course_type}</div>
                        <div><strong>聯絡電話:</strong> {searchResults.students.current.contact_number}</div>
                        <div><strong>ongoing活動數:</strong> {searchResults.activities.current.length}</div>
                      </div>
                    ) : (
                      <p className="text-red-600 text-sm">學生不存在</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 目標學生的活動 */}
              {searchResults.activities.target.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">🎯 目標學生的 Ongoing 活動 ({searchResults.activities.target.length}個)</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EADBC8]">
                          <th className="text-left py-2 text-[#2B3A3B]">活動名稱</th>
                          <th className="text-left py-2 text-[#2B3A3B]">進度</th>
                          <th className="text-left py-2 text-[#2B3A3B]">狀態</th>
                          <th className="text-left py-2 text-[#2B3A3B]">分配時間</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.activities.target.map((activity: any) => (
                          <tr key={activity.id} className="border-b border-[#EADBC8]">
                            <td className="py-2 text-[#4B4036]">
                              {activity.hanami_teaching_activities?.activity_name || '無關聯教學活動'}
                            </td>
                            <td className="py-2 text-[#4B4036]">
                              <span className={`px-2 py-1 rounded text-xs ${
                                activity.progress >= 100 ? 'bg-green-100 text-green-800' :
                                activity.progress > 0 ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {activity.progress || 0}%
                              </span>
                            </td>
                            <td className="py-2 text-[#4B4036]">{activity.completion_status || 'N/A'}</td>
                            <td className="py-2 text-[#4B4036]">
                              {activity.assigned_at ? new Date(activity.assigned_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 當前學生的活動 */}
              {searchResults.activities.current.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">📍 當前學生的 Ongoing 活動 ({searchResults.activities.current.length}個)</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EADBC8]">
                          <th className="text-left py-2 text-[#2B3A3B]">活動名稱</th>
                          <th className="text-left py-2 text-[#2B3A3B]">進度</th>
                          <th className="text-left py-2 text-[#2B3A3B]">狀態</th>
                          <th className="text-left py-2 text-[#2B3A3B]">分配時間</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.activities.current.map((activity: any) => (
                          <tr key={activity.id} className="border-b border-[#EADBC8]">
                            <td className="py-2 text-[#4B4036]">
                              {activity.hanami_teaching_activities?.activity_name || '無關聯教學活動'}
                            </td>
                            <td className="py-2 text-[#4B4036]">
                              <span className={`px-2 py-1 rounded text-xs ${
                                activity.progress >= 100 ? 'bg-green-100 text-green-800' :
                                activity.progress > 0 ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {activity.progress || 0}%
                              </span>
                            </td>
                            <td className="py-2 text-[#4B4036]">{activity.completion_status || 'N/A'}</td>
                            <td className="py-2 text-[#4B4036]">
                              {activity.assigned_at ? new Date(activity.assigned_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 解決方案 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">💡 解決方案</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-[#2B3A3B]">
                      <strong>步驟1:</strong> 在 Hanami 課程表中找到正確的學生
                    </p>
                    <p className="text-xs text-[#2B3A3B] mt-1">
                      尋找姓名為 "{searchResults.students.target?.full_name}" 的學生
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-[#2B3A3B]">
                      <strong>步驟2:</strong> 點擊正確的學生來查看他們的活動
                    </p>
                    <p className="text-xs text-[#2B3A3B] mt-1">
                      這樣您就能看到 {searchResults.activities.target.length} 個 ongoing 活動
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-[#2B3A3B]">
                      <strong>注意:</strong> 確保點擊的是正確的學生，而不是其他學生
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 使用說明 */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-[#4B4036] mb-2">💡 使用說明</h3>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• 此工具幫助您確認學生ID不匹配的問題</li>
              <li>• 顯示您期望查看的學生和實際點擊的學生的對比</li>
              <li>• 提供解決方案來找到正確的學生</li>
              <li>• 確認後，請在 Hanami 中點擊正確的學生</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

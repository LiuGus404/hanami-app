'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FixOngoingActivitiesDisplay() {
  const [studentId, setStudentId] = useState<string>('db5bc7ad-79a1-4d46-bc56-19ace1c49189');
  const [debugResults, setDebugResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDebug = async () => {
    setLoading(true);
    setError(null);
    setDebugResults(null);

    try {
      const results: any = {
        studentId,
        queries: {
          ongoingLessThan100: [],
          ongoingGreaterEqual100: [],
          allOngoing: []
        },
        analysis: {
          totalOngoingActivities: 0,
          activitiesWithProgressLessThan100: 0,
          activitiesWithProgressGreaterEqual100: 0,
          activitiesWithNullProgress: 0,
          issues: []
        }
      };

      // 1. 查詢所有 ongoing 活動（不過濾進度）
      const { data: allOngoingData, error: allOngoingError } = await supabase
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
        .eq('student_id', studentId)
        .eq('activity_type', 'ongoing')
        .order('assigned_at', { ascending: false });

      if (allOngoingError) {
        throw new Error(`查詢所有 ongoing 活動失敗: ${allOngoingError.message}`);
      }

      results.queries.allOngoing = allOngoingData || [];

      // 2. 查詢進度小於 100% 的 ongoing 活動
      const { data: ongoingLessThan100Data, error: ongoingLessThan100Error } = await supabase
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
        .eq('student_id', studentId)
        .eq('activity_type', 'ongoing')
        .lt('progress', 100)
        .order('assigned_at', { ascending: false });

      if (ongoingLessThan100Error) {
        throw new Error(`查詢進度小於100%的ongoing活動失敗: ${ongoingLessThan100Error.message}`);
      }

      results.queries.ongoingLessThan100 = ongoingLessThan100Data || [];

      // 3. 查詢進度大於等於 100% 的 ongoing 活動
      const { data: ongoingGreaterEqual100Data, error: ongoingGreaterEqual100Error } = await supabase
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
        .eq('student_id', studentId)
        .eq('activity_type', 'ongoing')
        .gte('progress', 100)
        .order('assigned_at', { ascending: false });

      if (ongoingGreaterEqual100Error) {
        throw new Error(`查詢進度大於等於100%的ongoing活動失敗: ${ongoingGreaterEqual100Error.message}`);
      }

      results.queries.ongoingGreaterEqual100 = ongoingGreaterEqual100Data || [];

      // 4. 分析結果
      results.analysis.totalOngoingActivities = results.queries.allOngoing.length;
      results.analysis.activitiesWithProgressLessThan100 = results.queries.ongoingLessThan100.length;
      results.analysis.activitiesWithProgressGreaterEqual100 = results.queries.ongoingGreaterEqual100.length;
      results.analysis.activitiesWithNullProgress = results.queries.allOngoing.filter((a: any) => a.progress === null || a.progress === undefined).length;

      // 5. 檢查問題
      if (results.analysis.totalOngoingActivities === 0) {
        results.analysis.issues.push({
          type: 'no_activities',
          message: '該學生沒有任何 ongoing 活動'
        });
      } else {
        if (results.analysis.activitiesWithProgressLessThan100 === 0) {
          results.analysis.issues.push({
            type: 'no_incomplete_activities',
            message: '該學生沒有進度小於100%的ongoing活動，所有活動都已完成'
          });
        }

        if (results.analysis.activitiesWithNullProgress > 0) {
          results.analysis.issues.push({
            type: 'null_progress',
            message: `有 ${results.analysis.activitiesWithNullProgress} 個活動的進度為 null`
          });
        }

        // 檢查是否有活動但沒有關聯的教學活動
        const activitiesWithoutTeachingActivity = results.queries.allOngoing.filter((a: any) => !a.hanami_teaching_activities);
        if (activitiesWithoutTeachingActivity.length > 0) {
          results.analysis.issues.push({
            type: 'missing_teaching_activity',
            message: `有 ${activitiesWithoutTeachingActivity.length} 個活動沒有關聯的教學活動`
          });
        }
      }

      setDebugResults(results);

    } catch (err) {
      setError(err instanceof Error ? err.message : '調試失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleFixProgress = async () => {
    if (!debugResults) return;

    setLoading(true);
    setError(null);

    try {
      // 修復進度為 null 的活動
      const activitiesWithNullProgress = debugResults.queries.allOngoing.filter((a: any) => a.progress === null || a.progress === undefined);
      
      if (activitiesWithNullProgress.length > 0) {
        const updates = activitiesWithNullProgress.map((activity: any) => ({
          id: activity.id,
          progress: 0 // 設置為 0%
        }));

        const { error: updateError } = await supabase
          .from('hanami_student_activities')
          .upsert(updates);

        if (updateError) {
          throw new Error(`更新進度失敗: ${updateError.message}`);
        }

        alert(`成功更新 ${updates.length} 個活動的進度為 0%`);
      } else {
        alert('沒有需要修復的進度問題');
      }

      // 重新調試
      await handleDebug();

    } catch (err) {
      setError(err instanceof Error ? err.message : '修復失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#FFFDF8] rounded-xl shadow-lg p-6 border border-[#EADBC8]">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6">🔧 修復正在學習活動顯示問題</h1>
          
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h2 className="font-semibold text-[#4B4036] mb-2">⚠️ 問題描述</h2>
            <p className="text-sm text-[#2B3A3B] mb-2">
              根據您提供的 SQL 資料，該學生有多個 ongoing 活動，但在 Hanami 中只顯示了一個活動。
            </p>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• 學生ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">db5bc7ad-79a1-4d46-bc56-19ace1c49189</span></li>
              <li>• 活動類型: ongoing</li>
              <li>• 問題: API 過濾邏輯可能過於嚴格</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#4B4036] mb-2">
              學生ID
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="請輸入學生ID"
                className="flex-1 px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              />
              <button
                onClick={handleDebug}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50"
              >
                {loading ? '調試中...' : '開始調試'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {debugResults && (
            <div className="space-y-6">
              {/* 分析摘要 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">📊 分析摘要</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FFD59A]">{debugResults.analysis.totalOngoingActivities}</div>
                    <div className="text-sm text-[#2B3A3B]">總ongoing活動</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#EBC9A4]">{debugResults.analysis.activitiesWithProgressLessThan100}</div>
                    <div className="text-sm text-[#2B3A3B]">進度&lt;100%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FFB6C1]">{debugResults.analysis.activitiesWithProgressGreaterEqual100}</div>
                    <div className="text-sm text-[#2B3A3B]">進度≥100%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#A8DADC]">{debugResults.analysis.activitiesWithNullProgress}</div>
                    <div className="text-sm text-[#2B3A3B]">進度為null</div>
                  </div>
                </div>
              </div>

              {/* 問題列表 */}
              {debugResults.analysis.issues.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">⚠️ 發現的問題</h2>
                  <div className="space-y-2">
                    {debugResults.analysis.issues.map((issue: any, index: number) => (
                      <div key={index} className={`p-3 rounded border ${
                        issue.type === 'no_activities' ? 'bg-red-50 border-red-200 text-red-600' :
                        issue.type === 'no_incomplete_activities' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                        'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>
                        <p className="text-sm">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 所有ongoing活動 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">🎯 所有 Ongoing 活動</h2>
                {debugResults.queries.allOngoing.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EADBC8]">
                          <th className="text-left py-2 text-[#2B3A3B]">活動ID</th>
                          <th className="text-left py-2 text-[#2B3A3B]">活動名稱</th>
                          <th className="text-left py-2 text-[#2B3A3B]">進度</th>
                          <th className="text-left py-2 text-[#2B3A3B]">狀態</th>
                          <th className="text-left py-2 text-[#2B3A3B]">分配時間</th>
                          <th className="text-left py-2 text-[#2B3A3B]">關聯教學活動</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugResults.queries.allOngoing.map((activity: any) => (
                          <tr key={activity.id} className="border-b border-[#EADBC8]">
                            <td className="py-2 text-[#4B4036] font-mono text-xs">{activity.id}</td>
                            <td className="py-2 text-[#4B4036]">
                              {activity.hanami_teaching_activities?.activity_name || '無關聯教學活動'}
                            </td>
                            <td className="py-2 text-[#4B4036]">
                              <span className={`px-2 py-1 rounded text-xs ${
                                activity.progress === null || activity.progress === undefined ? 'bg-red-100 text-red-800' :
                                activity.progress >= 100 ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {activity.progress === null || activity.progress === undefined ? 'null' : `${activity.progress}%`}
                              </span>
                            </td>
                            <td className="py-2 text-[#4B4036]">{activity.completion_status || 'N/A'}</td>
                            <td className="py-2 text-[#4B4036]">
                              {activity.assigned_at ? new Date(activity.assigned_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-2 text-[#4B4036]">
                              {activity.hanami_teaching_activities ? '✅' : '❌'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[#2B3A3B]">沒有找到 ongoing 活動</p>
                )}
              </div>

              {/* 進度小於100%的活動 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">📈 進度小於 100% 的活動 (應該顯示)</h2>
                {debugResults.queries.ongoingLessThan100.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EADBC8]">
                          <th className="text-left py-2 text-[#2B3A3B]">活動ID</th>
                          <th className="text-left py-2 text-[#2B3A3B]">活動名稱</th>
                          <th className="text-left py-2 text-[#2B3A3B]">進度</th>
                          <th className="text-left py-2 text-[#2B3A3B]">狀態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugResults.queries.ongoingLessThan100.map((activity: any) => (
                          <tr key={activity.id} className="border-b border-[#EADBC8]">
                            <td className="py-2 text-[#4B4036] font-mono text-xs">{activity.id}</td>
                            <td className="py-2 text-[#4B4036]">
                              {activity.hanami_teaching_activities?.activity_name || '無關聯教學活動'}
                            </td>
                            <td className="py-2 text-[#4B4036]">{activity.progress}%</td>
                            <td className="py-2 text-[#4B4036]">{activity.completion_status || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[#2B3A3B]">沒有進度小於 100% 的活動</p>
                )}
              </div>

              {/* 修復按鈕 */}
              {debugResults.analysis.activitiesWithNullProgress > 0 && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">🔧 修復工具</h2>
                  <p className="text-sm text-[#2B3A3B] mb-4">
                    發現 {debugResults.analysis.activitiesWithNullProgress} 個活動的進度為 null，這可能導致它們無法正確顯示。
                  </p>
                  <button
                    onClick={handleFixProgress}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? '修復中...' : '修復進度為 null 的活動'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 解決方案 */}
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-[#4B4036] mb-2">💡 解決方案</h3>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• <strong>檢查進度值</strong>: 確保所有活動的 progress 欄位不為 null</li>
              <li>• <strong>修復 null 進度</strong>: 將 null 進度設置為 0%</li>
              <li>• <strong>檢查教學活動關聯</strong>: 確保每個學生活動都有對應的教學活動</li>
              <li>• <strong>驗證 API 查詢</strong>: 確認 API 的過濾邏輯正確</li>
              <li>• <strong>重新載入頁面</strong>: 修復後重新載入學生活動面板</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

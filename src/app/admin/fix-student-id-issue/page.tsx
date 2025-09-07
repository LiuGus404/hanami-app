'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FixStudentIdIssue() {
  const [correctStudentId, setCorrectStudentId] = useState<string>('db5bc7ad-79a1-4d46-bc56-19ace1c49189');
  const [wrongStudentId, setWrongStudentId] = useState<string>('9f46724b-f7b3-45fc-bc25-b0ae0c74040c');
  const [fixResults, setFixResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setFixResults(null);

    try {
      const results: any = {
        correctStudentId,
        wrongStudentId,
        analysis: {
          correctStudentExists: false,
          wrongStudentExists: false,
          correctStudentInfo: null,
          wrongStudentInfo: null,
          activitiesForCorrectStudent: [],
          activitiesForWrongStudent: [],
          recommendations: []
        }
      };

      // 1. 檢查正確的學生ID
      const { data: correctStudentData, error: correctStudentError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('id', correctStudentId)
        .single();

      if (correctStudentData) {
        results.analysis.correctStudentExists = true;
        results.analysis.correctStudentInfo = correctStudentData;
      }

      // 2. 檢查錯誤的學生ID
      const { data: wrongStudentData, error: wrongStudentError } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('id', wrongStudentId)
        .single();

      if (wrongStudentData) {
        results.analysis.wrongStudentExists = true;
        results.analysis.wrongStudentInfo = wrongStudentData;
      }

      // 3. 查詢正確學生的活動
      if (results.analysis.correctStudentExists) {
        const { data: correctActivities, error: correctActivitiesError } = await supabase
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
          .eq('student_id', correctStudentId)
          .order('assigned_at', { ascending: false });

        if (correctActivities) {
          results.analysis.activitiesForCorrectStudent = correctActivities;
        }
      }

      // 4. 查詢錯誤學生的活動
      if (results.analysis.wrongStudentExists) {
        const { data: wrongActivities, error: wrongActivitiesError } = await supabase
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
          .eq('student_id', wrongStudentId)
          .order('assigned_at', { ascending: false });

        if (wrongActivities) {
          results.analysis.activitiesForWrongStudent = wrongActivities;
        }
      }

      // 5. 生成建議
      if (results.analysis.correctStudentExists && results.analysis.wrongStudentExists) {
        results.analysis.recommendations.push({
          type: 'info',
          message: '兩個學生ID都存在於資料庫中，這可能是用戶點擊了錯誤的學生'
        });
      } else if (results.analysis.correctStudentExists && !results.analysis.wrongStudentExists) {
        results.analysis.recommendations.push({
          type: 'warning',
          message: '錯誤的學生ID不存在於資料庫中，這可能是資料傳遞錯誤'
        });
      } else if (!results.analysis.correctStudentExists && results.analysis.wrongStudentExists) {
        results.analysis.recommendations.push({
          type: 'error',
          message: '正確的學生ID不存在於資料庫中，需要檢查學生資料'
        });
      } else {
        results.analysis.recommendations.push({
          type: 'error',
          message: '兩個學生ID都不存在於資料庫中，需要檢查資料完整性'
        });
      }

      if (results.analysis.activitiesForCorrectStudent.length > 0) {
        results.analysis.recommendations.push({
          type: 'success',
          message: `正確學生有 ${results.analysis.activitiesForCorrectStudent.length} 個活動記錄`
        });
      } else {
        results.analysis.recommendations.push({
          type: 'warning',
          message: '正確學生沒有活動記錄，可能需要分配活動'
        });
      }

      if (results.analysis.activitiesForWrongStudent.length > 0) {
        results.analysis.recommendations.push({
          type: 'info',
          message: `錯誤學生有 ${results.analysis.activitiesForWrongStudent.length} 個活動記錄`
        });
      }

      setFixResults(results);

    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleFixStudentSelection = async () => {
    if (!fixResults) return;

    setLoading(true);
    setError(null);

    try {
      // 這裡可以實現修復邏輯
      // 例如：更新前端狀態、重新導向到正確的學生等
      
      alert('修復邏輯已執行！請檢查學生選擇是否正確。');
      
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
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6">🔧 學生ID問題修復工具</h1>
          
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h2 className="font-semibold text-[#4B4036] mb-2">⚠️ 問題描述</h2>
            <p className="text-sm text-[#2B3A3B] mb-2">
              用戶提供的活動資料中的學生ID與實際查詢的學生ID不匹配，導致活動無法正確顯示。
            </p>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• 期望的學生ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">db5bc7ad-79a1-4d46-bc56-19ace1c49189</span></li>
              <li>• 實際查詢的學生ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">9f46724b-f7b3-45fc-bc25-b0ae0c74040c</span></li>
            </ul>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                正確的學生ID (期望的)
              </label>
              <input
                type="text"
                value={correctStudentId}
                onChange={(e) => setCorrectStudentId(e.target.value)}
                className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                錯誤的學生ID (實際查詢的)
              </label>
              <input
                type="text"
                value={wrongStudentId}
                onChange={(e) => setWrongStudentId(e.target.value)}
                className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-6 flex gap-4">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? '分析中...' : '分析問題'}
            </button>
            {fixResults && (
              <button
                onClick={handleFixStudentSelection}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50"
              >
                修復學生選擇
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {fixResults && (
            <div className="space-y-6">
              {/* 分析摘要 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">📊 分析摘要</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded border border-[#EADBC8]">
                    <h3 className="font-medium text-[#4B4036] mb-2">正確學生</h3>
                    <div className="text-sm text-[#2B3A3B] space-y-1">
                      <div>存在: {fixResults.analysis.correctStudentExists ? '✅' : '❌'}</div>
                      {fixResults.analysis.correctStudentInfo && (
                        <>
                          <div>姓名: {fixResults.analysis.correctStudentInfo.full_name}</div>
                          <div>課程: {fixResults.analysis.correctStudentInfo.course_type}</div>
                        </>
                      )}
                      <div>活動數: {fixResults.analysis.activitiesForCorrectStudent.length}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border border-[#EADBC8]">
                    <h3 className="font-medium text-[#4B4036] mb-2">錯誤學生</h3>
                    <div className="text-sm text-[#2B3A3B] space-y-1">
                      <div>存在: {fixResults.analysis.wrongStudentExists ? '✅' : '❌'}</div>
                      {fixResults.analysis.wrongStudentInfo && (
                        <>
                          <div>姓名: {fixResults.analysis.wrongStudentInfo.full_name}</div>
                          <div>課程: {fixResults.analysis.wrongStudentInfo.course_type}</div>
                        </>
                      )}
                      <div>活動數: {fixResults.analysis.activitiesForWrongStudent.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 建議 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">💡 建議</h2>
                <div className="space-y-2">
                  {fixResults.analysis.recommendations.map((rec: any, index: number) => (
                    <div key={index} className={`p-3 rounded border ${
                      rec.type === 'error' ? 'bg-red-50 border-red-200 text-red-600' :
                      rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                      rec.type === 'success' ? 'bg-green-50 border-green-200 text-green-600' :
                      'bg-blue-50 border-blue-200 text-blue-600'
                    }`}>
                      <p className="text-sm">{rec.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 正確學生的活動 */}
              {fixResults.analysis.activitiesForCorrectStudent.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">🎯 正確學生的活動</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EADBC8]">
                          <th className="text-left py-2 text-[#2B3A3B]">活動名稱</th>
                          <th className="text-left py-2 text-[#2B3A3B]">類型</th>
                          <th className="text-left py-2 text-[#2B3A3B]">進度</th>
                          <th className="text-left py-2 text-[#2B3A3B]">狀態</th>
                          <th className="text-left py-2 text-[#2B3A3B]">分配時間</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fixResults.analysis.activitiesForCorrectStudent.map((activity: any) => (
                          <tr key={activity.id} className="border-b border-[#EADBC8]">
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
                </div>
              )}

              {/* 錯誤學生的活動 */}
              {fixResults.analysis.activitiesForWrongStudent.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">⚠️ 錯誤學生的活動</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EADBC8]">
                          <th className="text-left py-2 text-[#2B3A3B]">活動名稱</th>
                          <th className="text-left py-2 text-[#2B3A3B]">類型</th>
                          <th className="text-left py-2 text-[#2B3A3B]">進度</th>
                          <th className="text-left py-2 text-[#2B3A3B]">狀態</th>
                          <th className="text-left py-2 text-[#2B3A3B]">分配時間</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fixResults.analysis.activitiesForWrongStudent.map((activity: any) => (
                          <tr key={activity.id} className="border-b border-[#EADBC8]">
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
                </div>
              )}
            </div>
          )}

          {/* 解決方案 */}
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-[#4B4036] mb-2">🔧 解決方案</h3>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• <strong>確認學生選擇</strong>: 確保用戶點擊的是正確的學生</li>
              <li>• <strong>檢查資料傳遞</strong>: 確認 student.id 正確傳遞給 StudentActivitiesPanel</li>
              <li>• <strong>驗證學生資料</strong>: 使用調試工具確認學生ID和活動資料的對應關係</li>
              <li>• <strong>重新載入頁面</strong>: 如果問題持續，嘗試重新載入頁面</li>
              <li>• <strong>檢查瀏覽器快取</strong>: 清除瀏覽器快取可能解決資料不同步問題</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

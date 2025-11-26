'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function VerifyStudentActivities() {
  const [verificationResults, setVerificationResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 用戶提供的活動資料
  const userProvidedActivities = [
    {
      id: "a14f7402-2e2b-4bef-8ae3-9b1b31b2a189",
      student_id: "db5bc7ad-79a1-4d46-bc56-19ace1c49189",
      activity_id: "a14f7402-2e2b-4bef-8ae3-9b1b31b2a189",
      activity_type: "ongoing",
      completion_status: "in_progress",
      progress: 0,
      assigned_at: "2025-01-19T08:00:00.000Z",
      lesson_date: null,
      timeslot: null,
      hanami_teaching_activities: {
        id: "a14f7402-2e2b-4bef-8ae3-9b1b31b2a189",
        activity_name: "節奏訓練 - 基礎拍子練習",
        activity_description: "透過簡單的拍手和踏步練習，幫助學生建立基本的節奏感。",
        activity_type: "rhythm_training",
        difficulty_level: 1,
        duration_minutes: 15,
        materials_needed: ["節拍器", "鼓"],
        instructions: "1. 先讓學生跟著節拍器拍手\n2. 逐漸加入踏步動作\n3. 練習不同的節奏型態"
      }
    },
    {
      id: "b25f8513-3f3c-5caf-9cf4-0c2c42c3b29a",
      student_id: "db5bc7ad-79a1-4d46-bc56-19ace1c49189",
      activity_id: "b25f8513-3f3c-5caf-9cf4-0c2c42c3b29a",
      activity_type: "ongoing",
      completion_status: "in_progress",
      progress: 0,
      assigned_at: "2025-01-19T08:00:00.000Z",
      lesson_date: null,
      timeslot: null,
      hanami_teaching_activities: {
        id: "b25f8513-3f3c-5caf-9cf4-0c2c42c3b29a",
        activity_name: "音感訓練 - 音高辨識",
        activity_description: "透過聽音遊戲，訓練學生辨識不同音高的能力。",
        activity_type: "pitch_training",
        difficulty_level: 1,
        duration_minutes: 20,
        materials_needed: ["音叉", "鋼琴"],
        instructions: "1. 播放不同音高的音符\n2. 讓學生指出音高變化\n3. 練習唱出聽到的音符"
      }
    },
    {
      id: "c36f9624-4g4d-6dbg-0dg5-1d3d53d4c40b",
      student_id: "db5bc7ad-79a1-4d46-bc56-19ace1c49189",
      activity_id: "c36f9624-4g4d-6dbg-0dg5-1d3d53d4c40b",
      activity_type: "ongoing",
      completion_status: "in_progress",
      progress: 0,
      assigned_at: "2025-01-19T08:00:00.000Z",
      lesson_date: null,
      timeslot: null,
      hanami_teaching_activities: {
        id: "c36f9624-4g4d-6dbg-0dg5-1d3d53d4c40b",
        activity_name: "視譜訓練 - 基礎音符認識",
        activity_description: "透過遊戲化的方式，讓學生認識基本的音符和節拍。",
        activity_type: "sight_reading",
        difficulty_level: 1,
        duration_minutes: 25,
        materials_needed: ["音符卡片", "白板"],
        instructions: "1. 展示不同的音符卡片\n2. 讓學生說出音符名稱\n3. 練習在五線譜上畫音符"
      }
    }
  ];

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setVerificationResults(null);

    try {
      const results: any = {
        studentId: "db5bc7ad-79a1-4d46-bc56-19ace1c49189",
        providedActivities: userProvidedActivities,
        verification: {
          studentExists: false,
          activitiesExist: [],
          studentInfo: null,
          actualActivities: [],
          mismatches: []
        }
      };

      // 1. 檢查學生是否存在
      const { data: studentData, error: studentError } = await (supabase
        .from('Hanami_Students') as any)
        .select('*')
        .eq('id', results.studentId)
        .single();

      if (studentData) {
        results.verification.studentExists = true;
        results.verification.studentInfo = studentData;
      } else {
        results.verification.mismatches.push({
          type: 'student_not_found',
          message: `學生ID ${results.studentId} 不存在於資料庫中`
        });
      }

      // 2. 檢查每個活動是否存在
      for (const activity of userProvidedActivities) {
        const { data: activityData, error: activityError } = await (supabase
          .from('hanami_student_activities') as any)
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
          .eq('id', activity.id)
          .single();

        if (activityData) {
          results.verification.activitiesExist.push({
            provided: activity,
            actual: activityData,
            matches: {
              student_id: activityData.student_id === activity.student_id,
              activity_id: activityData.activity_id === activity.activity_id,
              activity_type: activityData.activity_type === activity.activity_type,
              completion_status: activityData.completion_status === activity.completion_status,
              progress: activityData.progress === activity.progress
            }
          });

          // 檢查不匹配項目
          const matches = results.verification.activitiesExist[results.verification.activitiesExist.length - 1].matches;
          Object.entries(matches).forEach(([key, value]) => {
            if (!value) {
              results.verification.mismatches.push({
                type: 'activity_mismatch',
                activityId: activity.id,
                field: key,
                provided: (activity as any)[key],
                actual: (activityData as any)[key],
                message: `活動 ${activity.id} 的 ${key} 不匹配: 提供值 "${(activity as any)[key]}" vs 實際值 "${(activityData as any)[key]}"`
              });
            }
          });
        } else {
          results.verification.activitiesExist.push({
            provided: activity,
            actual: null,
            matches: null
          });
          results.verification.mismatches.push({
            type: 'activity_not_found',
            activityId: activity.id,
            message: `活動ID ${activity.id} 不存在於資料庫中`
          });
        }
      }

      // 3. 查詢該學生的實際活動
      if (results.verification.studentExists) {
        const { data: actualActivities, error: actualError } = await (supabase
          .from('hanami_student_activities') as any)
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
          .eq('student_id', results.studentId)
          .order('assigned_at', { ascending: false });

        if (actualActivities) {
          results.verification.actualActivities = actualActivities;
        }
      }

      setVerificationResults(results);

    } catch (err) {
      setError(err instanceof Error ? err.message : '驗證失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#FFFDF8] rounded-xl shadow-lg p-6 border border-[#EADBC8]">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6">🔍 學生活動驗證工具</h1>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="font-semibold text-[#4B4036] mb-2">📋 用戶提供的活動資料</h2>
            <p className="text-sm text-[#2B3A3B] mb-2">
              學生ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">db5bc7ad-79a1-4d46-bc56-19ace1c49189</span>
            </p>
            <p className="text-sm text-[#2B3A3B]">
              活動數量: {userProvidedActivities.length} 個
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? '驗證中...' : '開始驗證'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {verificationResults && (
            <div className="space-y-6">
              {/* 驗證摘要 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">📊 驗證摘要</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${verificationResults.verification.studentExists ? 'text-green-600' : 'text-red-600'}`}>
                      {verificationResults.verification.studentExists ? '✅' : '❌'}
                    </div>
                    <div className="text-sm text-[#2B3A3B]">學生存在</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FFD59A]">
                      {verificationResults.verification.activitiesExist.filter((a: any) => a.actual).length}
                    </div>
                    <div className="text-sm text-[#2B3A3B]">活動存在</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#EBC9A4]">
                      {verificationResults.verification.mismatches.length}
                    </div>
                    <div className="text-sm text-[#2B3A3B]">不匹配項目</div>
                  </div>
                </div>
              </div>

              {/* 學生資訊 */}
              {verificationResults.verification.studentInfo && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">👤 學生資訊</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-[#2B3A3B]">姓名:</span>
                      <span className="ml-2 text-[#4B4036]">{verificationResults.verification.studentInfo.full_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#2B3A3B]">暱稱:</span>
                      <span className="ml-2 text-[#4B4036]">{verificationResults.verification.studentInfo.nick_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#2B3A3B]">課程類型:</span>
                      <span className="ml-2 text-[#4B4036]">{verificationResults.verification.studentInfo.course_type}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#2B3A3B]">聯絡電話:</span>
                      <span className="ml-2 text-[#4B4036]">{verificationResults.verification.studentInfo.contact_number}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 活動驗證結果 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">🎯 活動驗證結果</h2>
                <div className="space-y-4">
                  {verificationResults.verification.activitiesExist.map((result: any, index: number) => (
                    <div key={index} className="p-4 border border-[#EADBC8] rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-[#4B4036]">
                          活動 {index + 1}: {result.provided.hanami_teaching_activities.activity_name}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs ${result.actual ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {result.actual ? '存在' : '不存在'}
                        </span>
                      </div>

                      {result.actual && result.matches && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {Object.entries(result.matches).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span className="text-[#2B3A3B]">{key}:</span>
                              <span className={`ml-1 ${value ? 'text-green-600' : 'text-red-600'}`}>
                                {value ? '✓' : '✗'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 不匹配項目 */}
              {verificationResults.verification.mismatches.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">⚠️ 不匹配項目</h2>
                  <div className="space-y-2">
                    {verificationResults.verification.mismatches.map((mismatch: any, index: number) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-red-600 text-sm">{mismatch.message}</p>
                        {mismatch.provided !== undefined && mismatch.actual !== undefined && (
                          <div className="mt-2 text-xs text-red-500">
                            <span>提供值: {JSON.stringify(mismatch.provided)}</span>
                            <span className="mx-2">|</span>
                            <span>實際值: {JSON.stringify(mismatch.actual)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 實際活動列表 */}
              {verificationResults.verification.actualActivities.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">📚 該學生的實際活動</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EADBC8]">
                          <th className="text-left py-2 text-[#2B3A3B]">活動ID</th>
                          <th className="text-left py-2 text-[#2B3A3B]">活動名稱</th>
                          <th className="text-left py-2 text-[#2B3A3B]">類型</th>
                          <th className="text-left py-2 text-[#2B3A3B]">進度</th>
                          <th className="text-left py-2 text-[#2B3A3B]">狀態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verificationResults.verification.actualActivities.map((activity: any) => (
                          <tr key={activity.id} className="border-b border-[#EADBC8]">
                            <td className="py-2 text-[#4B4036] font-mono text-xs">{activity.id}</td>
                            <td className="py-2 text-[#4B4036]">
                              {activity.hanami_teaching_activities?.activity_name || '無關聯教學活動'}
                            </td>
                            <td className="py-2 text-[#4B4036]">
                              <span className={`px-2 py-1 rounded text-xs ${activity.activity_type === 'ongoing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                                }`}>
                                {activity.activity_type}
                              </span>
                            </td>
                            <td className="py-2 text-[#4B4036]">{activity.progress || 0}%</td>
                            <td className="py-2 text-[#4B4036]">{activity.completion_status || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 使用說明 */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-[#4B4036] mb-2">💡 使用說明</h3>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• 此工具驗證用戶提供的活動資料是否與資料庫中的實際資料匹配</li>
              <li>• 檢查學生ID是否存在於資料庫中</li>
              <li>• 驗證每個活動的詳細資訊是否正確</li>
              <li>• 顯示該學生的所有實際活動記錄</li>
              <li>• 如果有不匹配項目，會詳細列出差異</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

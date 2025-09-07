'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FixGrowthTreeActivities() {
  const [studentId, setStudentId] = useState<string>('9f46724b-f7b3-45fc-bc25-b0ae0c74040c');
  const [treeId, setTreeId] = useState<string>('108763d0-b2ff-48e7-82cd-3001cdad0055');
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
        treeId,
        analysis: {
          growthTreeData: null,
          orderedNodes: [],
          studentActivities: [],
          ongoingActivities: [],
          nextAvailableActivity: null,
          issues: []
        }
      };

      // 1. 查詢成長樹資料
      const { data: growthTreeData, error: growthTreeError } = await supabase
        .from('hanami_growth_trees')
        .select('*')
        .eq('id', treeId)
        .single();

      if (growthTreeData) {
        results.analysis.growthTreeData = growthTreeData;
      } else {
        results.analysis.issues.push({
          type: 'growth_tree_not_found',
          message: `成長樹 ${treeId} 不存在`
        });
      }

      // 2. 查詢學生活動
      const { data: studentActivities, error: activitiesError } = await supabase
        .from('hanami_student_activities')
        .select(`
          id,
          student_id,
          tree_id,
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
        .eq('tree_id', treeId);

      if (studentActivities) {
        results.analysis.studentActivities = studentActivities;
        results.analysis.ongoingActivities = studentActivities.filter(a => 
          a.activity_type === 'ongoing' && a.completion_status === 'in_progress'
        );
      }

      // 3. 處理成長樹節點數據
      if (growthTreeData && growthTreeData.nodes) {
        let nodes = growthTreeData.nodes;
        if (typeof nodes === 'string') {
          try {
            nodes = JSON.parse(nodes);
          } catch (parseError) {
            results.analysis.issues.push({
              type: 'parse_error',
              message: '解析成長樹節點 JSON 失敗'
            });
          }
        }

        if (Array.isArray(nodes)) {
          // 過濾並排序節點
          const validNodes = nodes
            .filter((node: any) => node && node.id && node.type)
            .sort((a: any, b: any) => {
              if (a.type === 'start') return -1;
              if (b.type === 'start') return 1;
              return (a.order || 0) - (b.order || 0);
            });

          // 標記節點狀態
          const normalizedNodes = validNodes.map((node: any) => {
            let isCompleted = false;
            let isInProgress = false;

            if (node.type === 'activity' && studentActivities) {
              const activityRecord = studentActivities.find(activity => 
                activity.activity_id === node.activity_id
              );

              if (activityRecord) {
                isCompleted = activityRecord.completion_status === 'completed';
                isInProgress = activityRecord.completion_status === 'in_progress';
              }
            }

            return {
              ...node,
              isCompleted,
              isInProgress,
              isLocked: false
            };
          });

          results.analysis.orderedNodes = normalizedNodes;

          // 4. 分析下一個可用活動
          const activityNodes = normalizedNodes.filter(node => node.type === 'activity');
          const incompleteActivities = activityNodes.filter(node => !node.isCompleted && !node.isLocked);
          
          if (incompleteActivities.length > 0) {
            // 尋找第一個不在進行中的活動
            const ongoingActivityIds = results.analysis.ongoingActivities.map((activity: any) => activity.activity_id);
            const nextAvailableActivity = incompleteActivities.find(node => 
              !ongoingActivityIds.includes(node.activity_id)
            );
            
            if (nextAvailableActivity) {
              results.analysis.nextAvailableActivity = nextAvailableActivity;
            } else {
              results.analysis.issues.push({
                type: 'no_available_activity',
                message: '所有未完成的活動都已經在進行中'
              });
            }
          } else {
            results.analysis.issues.push({
              type: 'all_completed',
              message: '所有活動都已完成'
            });
          }
        }
      }

      // 5. 檢查問題
      if (results.analysis.ongoingActivities.length === 0) {
        results.analysis.issues.push({
          type: 'no_ongoing_activities',
          message: '該學生沒有正在進行的活動'
        });
      }

      if (results.analysis.orderedNodes.length === 0) {
        results.analysis.issues.push({
          type: 'no_nodes',
          message: '成長樹沒有有效的節點'
        });
      }

      setDebugResults(results);

    } catch (err) {
      setError(err instanceof Error ? err.message : '調試失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#FFFDF8] rounded-xl shadow-lg p-6 border border-[#EADBC8]">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6">🌳 修復成長樹活動顯示問題</h1>
          
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h2 className="font-semibold text-[#4B4036] mb-2">⚠️ 問題描述</h2>
            <p className="text-sm text-[#2B3A3B] mb-2">
              成長樹系統顯示有4個正在進行的活動，但實際只顯示1個活動。這是成長樹學習路徑管理的問題。
            </p>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• 成長樹ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">108763d0-b2ff-48e7-82cd-3001cdad0055</span></li>
              <li>• 學生ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">9f46724b-f7b3-45fc-bc25-b0ae0c74040c</span></li>
              <li>• 問題: 成長樹活動與實際顯示的活動不匹配</li>
            </ul>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                學生ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                成長樹ID
              </label>
              <input
                type="text"
                value={treeId}
                onChange={(e) => setTreeId(e.target.value)}
                className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={handleDebug}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50"
            >
              {loading ? '調試中...' : '開始調試'}
            </button>
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
                    <div className="text-2xl font-bold text-[#FFD59A]">{debugResults.analysis.orderedNodes.length}</div>
                    <div className="text-sm text-[#2B3A3B]">總節點數</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#EBC9A4]">{debugResults.analysis.studentActivities.length}</div>
                    <div className="text-sm text-[#2B3A3B]">學生活動</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#FFB6C1]">{debugResults.analysis.ongoingActivities.length}</div>
                    <div className="text-sm text-[#2B3A3B]">正在進行</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#A8DADC]">{debugResults.analysis.issues.length}</div>
                    <div className="text-sm text-[#2B3A3B]">問題數</div>
                  </div>
                </div>
              </div>

              {/* 成長樹資訊 */}
              {debugResults.analysis.growthTreeData && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">🌳 成長樹資訊</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-[#2B3A3B]">名稱:</span>
                      <span className="ml-2 text-[#4B4036]">{debugResults.analysis.growthTreeData.tree_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#2B3A3B]">狀態:</span>
                      <span className="ml-2 text-[#4B4036]">{debugResults.analysis.growthTreeData.status}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#2B3A3B]">開始日期:</span>
                      <span className="ml-2 text-[#4B4036]">{debugResults.analysis.growthTreeData.start_date}</span>
                    </div>
                    <div>
                      <span className="font-medium text-[#2B3A3B]">節點數:</span>
                      <span className="ml-2 text-[#4B4036]">{debugResults.analysis.orderedNodes.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 正在進行的活動 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">🎯 正在進行的活動 ({debugResults.analysis.ongoingActivities.length}個)</h2>
                {debugResults.analysis.ongoingActivities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EADBC8]">
                          <th className="text-left py-2 text-[#2B3A3B]">活動ID</th>
                          <th className="text-left py-2 text-[#2B3A3B]">活動名稱</th>
                          <th className="text-left py-2 text-[#2B3A3B]">進度</th>
                          <th className="text-left py-2 text-[#2B3A3B]">狀態</th>
                          <th className="text-left py-2 text-[#2B3A3B]">分配時間</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugResults.analysis.ongoingActivities.map((activity: any) => (
                          <tr key={activity.id} className="border-b border-[#EADBC8]">
                            <td className="py-2 text-[#4B4036] font-mono text-xs">{activity.activity_id}</td>
                            <td className="py-2 text-[#4B4036]">
                              {activity.hanami_teaching_activities?.activity_name || '無關聯教學活動'}
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
                  <p className="text-[#2B3A3B]">沒有正在進行的活動</p>
                )}
              </div>

              {/* 下一個可用活動 */}
              {debugResults.analysis.nextAvailableActivity && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">🎯 下一個可用活動</h2>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm text-[#2B3A3B] space-y-1">
                      <div><strong>活動ID:</strong> {debugResults.analysis.nextAvailableActivity.activity_id}</div>
                      <div><strong>活動名稱:</strong> {debugResults.analysis.nextAvailableActivity.title}</div>
                      <div><strong>節點類型:</strong> {debugResults.analysis.nextAvailableActivity.type}</div>
                      <div><strong>順序:</strong> {debugResults.analysis.nextAvailableActivity.order}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 問題列表 */}
              {debugResults.analysis.issues.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                  <h2 className="text-lg font-semibold text-[#4B4036] mb-3">⚠️ 發現的問題</h2>
                  <div className="space-y-2">
                    {debugResults.analysis.issues.map((issue: any, index: number) => (
                      <div key={index} className={`p-3 rounded border ${
                        issue.type === 'growth_tree_not_found' ? 'bg-red-50 border-red-200 text-red-600' :
                        issue.type === 'no_ongoing_activities' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                        'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>
                        <p className="text-sm">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 節點詳情 */}
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <h2 className="text-lg font-semibold text-[#4B4036] mb-3">🌳 成長樹節點詳情</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#EADBC8]">
                        <th className="text-left py-2 text-[#2B3A3B]">節點ID</th>
                        <th className="text-left py-2 text-[#2B3A3B]">類型</th>
                        <th className="text-left py-2 text-[#2B3A3B]">標題</th>
                        <th className="text-left py-2 text-[#2B3A3B]">順序</th>
                        <th className="text-left py-2 text-[#2B3A3B]">狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugResults.analysis.orderedNodes.slice(0, 10).map((node: any) => (
                        <tr key={node.id} className="border-b border-[#EADBC8]">
                          <td className="py-2 text-[#4B4036] font-mono text-xs">{node.id}</td>
                          <td className="py-2 text-[#4B4036]">
                            <span className={`px-2 py-1 rounded text-xs ${
                              node.type === 'start' ? 'bg-green-100 text-green-800' :
                              node.type === 'activity' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {node.type}
                            </span>
                          </td>
                          <td className="py-2 text-[#4B4036]">{node.title || 'N/A'}</td>
                          <td className="py-2 text-[#4B4036]">{node.order || 'N/A'}</td>
                          <td className="py-2 text-[#4B4036]">
                            <div className="flex gap-1">
                              {node.isCompleted && <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">已完成</span>}
                              {node.isInProgress && <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">進行中</span>}
                              {!node.isCompleted && !node.isInProgress && <span className="px-1 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">未開始</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {debugResults.analysis.orderedNodes.length > 10 && (
                  <p className="text-sm text-[#2B3A3B] mt-2">
                    顯示前10個節點，總共 {debugResults.analysis.orderedNodes.length} 個節點
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 解決方案 */}
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-[#4B4036] mb-2">💡 解決方案</h3>
            <ul className="text-sm text-[#2B3A3B] space-y-1">
              <li>• <strong>檢查成長樹資料</strong>: 確認成長樹節點數據是否正確</li>
              <li>• <strong>驗證學生活動</strong>: 確認學生活動記錄與成長樹節點匹配</li>
              <li>• <strong>修復活動狀態</strong>: 確保正在進行的活動狀態正確</li>
              <li>• <strong>重新載入頁面</strong>: 修復後重新載入學生活動面板</li>
              <li>• <strong>檢查API查詢</strong>: 確認API正確查詢成長樹相關活動</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

export default function QuickCheckSchedulePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkData();
  }, []);

  const checkData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const backupData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fix-teacher-schedule-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup_current_data' }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        alert(`✅ 備份成功！共備份 ${result.backupData.length} 筆記錄`);
        checkData(); // 重新檢查資料
      }
    } catch (err) {
      setError('備份資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-[#FFF9F2] min-h-screen">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
          <h1 className="text-2xl font-bold mb-4">快速檢查教師排班狀況</h1>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64] mx-auto"></div>
            <p className="mt-4 text-[#4B4036]">正在檢查資料庫...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#FFF9F2] min-h-screen">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
          <h1 className="text-2xl font-bold mb-4">快速檢查教師排班狀況</h1>
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
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
          <h1 className="text-2xl font-bold mb-4">快速檢查教師排班狀況</h1>
          <p>沒有資料</p>
        </div>
      </div>
    );
  }

  const { summary, recentSchedules } = data;

  return (
    <div className="p-6 bg-[#FFF9F2] min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#4B4036]">教師排班狀況檢查</h1>
          <div className="flex gap-2">
            <button
              onClick={checkData}
              className="px-4 py-2 bg-[#A68A64] text-white rounded-lg hover:bg-[#937654] transition-colors"
            >
              重新檢查
            </button>
            <button
              onClick={backupData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              備份資料
            </button>
          </div>
        </div>

        {/* 狀況摘要 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${summary.totalSchedules > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className="font-bold text-sm">總排班記錄</h3>
            <p className={`text-2xl font-bold ${summary.totalSchedules > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.totalSchedules}
            </p>
          </div>
          <div className={`p-4 rounded-lg border ${summary.recentSchedules > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <h3 className="font-bold text-sm">最近30天</h3>
            <p className={`text-2xl font-bold ${summary.recentSchedules > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
              {summary.recentSchedules}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <h3 className="font-bold text-sm">教師總數</h3>
            <p className="text-2xl font-bold text-blue-600">{summary.totalTeachers}</p>
          </div>
          <div className={`p-4 rounded-lg border ${summary.duplicateSchedules > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <h3 className="font-bold text-sm">重複記錄</h3>
            <p className={`text-2xl font-bold ${summary.duplicateSchedules > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.duplicateSchedules}
            </p>
          </div>
        </div>

        {/* 狀況評估 */}
        <div className="mb-6">
          {summary.totalSchedules === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ 嚴重問題</h3>
              <p className="text-red-700 mb-2">沒有找到任何排班記錄，資料可能已完全遺失。</p>
              <p className="text-red-700">建議立即：</p>
              <ul className="list-disc list-inside text-red-700 ml-4">
                <li>檢查是否有備份資料</li>
                <li>聯繫系統管理員</li>
                <li>重新建立排班記錄</li>
              </ul>
            </div>
          ) : summary.recentSchedules === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">⚠️ 需要注意</h3>
              <p className="text-yellow-700 mb-2">最近30天沒有排班記錄，可能是資料遺失或尚未排班。</p>
              <p className="text-yellow-700">建議：</p>
              <ul className="list-disc list-inside text-yellow-700 ml-4">
                <li>檢查歷史排班記錄</li>
                <li>確認是否需要重新排班</li>
                <li>備份現有資料</li>
              </ul>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-800 mb-2">✅ 狀況良好</h3>
              <p className="text-green-700">排班資料狀況正常，有 {summary.recentSchedules} 筆最近的排班記錄。</p>
            </div>
          )}
        </div>

        {/* 最近排班記錄 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 text-[#4B4036]">最近排班記錄</h2>
          {recentSchedules.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600">沒有找到最近30天的排班記錄</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-[#EADBC8] rounded-lg">
                <thead className="bg-[#FFF9F2]">
                  <tr>
                    <th className="p-3 text-left border-b border-[#EADBC8]">教師ID</th>
                    <th className="p-3 text-left border-b border-[#EADBC8]">排班日期</th>
                    <th className="p-3 text-left border-b border-[#EADBC8]">時間</th>
                    <th className="p-3 text-left border-b border-[#EADBC8]">創建時間</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSchedules.slice(0, 10).map((schedule: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3 border-b border-[#EADBC8]">{schedule.teacher_id}</td>
                      <td className="p-3 border-b border-[#EADBC8]">{schedule.scheduled_date}</td>
                      <td className="p-3 border-b border-[#EADBC8]">{schedule.start_time} - {schedule.end_time}</td>
                      <td className="p-3 border-b border-[#EADBC8]">
                        {schedule.created_at ? new Date(schedule.created_at).toLocaleString('zh-TW') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentSchedules.length > 10 && (
                <p className="text-sm text-[#A68A64] mt-2">顯示前10筆記錄，共 {recentSchedules.length} 筆</p>
              )}
            </div>
          )}
        </div>

        {/* 操作建議 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-blue-800 mb-2">📋 下一步操作建議</h3>
          <div className="space-y-2 text-blue-700">
            {summary.totalSchedules === 0 ? (
              <>
                <p>• <strong>立即備份：</strong>點擊「備份資料」按鈕保存當前狀態</p>
                <p>• <strong>檢查備份：</strong>訪問 <code>/admin/fix-teacher-schedule</code> 查看是否有備份</p>
                <p>• <strong>重新排班：</strong>如果沒有備份，需要重新建立排班記錄</p>
              </>
            ) : (
              <>
                <p>• <strong>備份資料：</strong>建議定期備份排班資料</p>
                <p>• <strong>檢查詳細：</strong>訪問 <code>/admin/check-teacher-schedule</code> 查看完整報告</p>
                <p>• <strong>繼續使用：</strong>系統已修復，可以正常使用排班功能</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
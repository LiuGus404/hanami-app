'use client';

import { useState } from 'react';

interface FixResult {
  success: boolean;
  message: string;
  problem?: {
    description: string;
    location: string;
    impact: string;
  };
  solution?: {
    description: string;
    steps: string[];
  };
  backupData?: any[];
  backupTime?: string;
  restoredCount?: number;
}

export default function FixTeacherSchedulePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backupData, setBackupData] = useState<any[] | null>(null);

  const handleAction = async (action: string, data?: any) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/fix-teacher-schedule-bug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        setResult(result);
        if (result.backupData) {
          setBackupData(result.backupData);
        }
      }
    } catch (err) {
      setError('執行操作時發生錯誤');
      console.error('操作錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromBackup = async () => {
    if (!backupData) {
      setError('沒有備份資料可以還原');
      return;
    }
    
    await handleAction('restore_from_backup', { backupData });
  };

  return (
    <div className="p-6 bg-[#FFF9F2] min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
        <h1 className="text-2xl font-bold mb-6 text-[#4B4036]">教師排班系統修復工具</h1>
        
        {/* 問題說明 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold text-red-800 mb-2">⚠️ 發現的問題</h2>
          <p className="text-red-700 mb-2">
            在教師排班管理的編輯模式中，當保存排班時會意外刪除整個月份的所有教師排班記錄，
            導致其他教師的排班資料丟失。
          </p>
          <p className="text-red-700">
            <strong>影響範圍：</strong>所有教師在當前月份的排班記錄
          </p>
        </div>

        {/* 操作按鈕 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => handleAction('fix_delete_logic')}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '分析中...' : '分析問題'}
          </button>
          
          <button
            onClick={() => handleAction('backup_current_data')}
            disabled={loading}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '備份中...' : '備份當前資料'}
          </button>
          
          <button
            onClick={handleRestoreFromBackup}
            disabled={loading || !backupData}
            className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '還原中...' : '從備份還原'}
          </button>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">錯誤: {error}</p>
          </div>
        )}

        {/* 結果顯示 */}
        {result && (
          <div className="space-y-6">
            {/* 成功訊息 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-800 mb-2">✅ {result.message}</h3>
            </div>

            {/* 問題分析 */}
            {result.problem && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-yellow-800 mb-2">🔍 問題分析</h3>
                <div className="space-y-2 text-yellow-700">
                  <p><strong>問題描述：</strong>{result.problem.description}</p>
                  <p><strong>問題位置：</strong>{result.problem.location}</p>
                  <p><strong>影響範圍：</strong>{result.problem.impact}</p>
                </div>
              </div>
            )}

            {/* 解決方案 */}
            {result.solution && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-blue-800 mb-2">🛠️ 解決方案</h3>
                <p className="text-blue-700 mb-3">{result.solution.description}</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  {result.solution.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* 備份資訊 */}
            {result.backupData && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-purple-800 mb-2">💾 備份資訊</h3>
                <div className="space-y-2 text-purple-700">
                  <p><strong>備份記錄數：</strong>{result.backupData.length} 筆</p>
                  <p><strong>備份時間：</strong>{new Date(result.backupTime || '').toLocaleString('zh-TW')}</p>
                  <p><strong>狀態：</strong>備份完成，可以安全還原</p>
                </div>
              </div>
            )}

            {/* 還原結果 */}
            {result.restoredCount !== undefined && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-green-800 mb-2">🔄 還原結果</h3>
                <p className="text-green-700">
                  <strong>成功還原：</strong>{result.restoredCount} 筆排班記錄
                </p>
              </div>
            )}
          </div>
        )}

        {/* 使用說明 */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">📋 使用說明</h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>1. 分析問題：</strong>點擊「分析問題」按鈕來查看詳細的問題分析</p>
            <p><strong>2. 備份資料：</strong>在進行任何修復前，建議先備份當前資料</p>
            <p><strong>3. 還原資料：</strong>如果資料丟失，可以從備份中還原</p>
            <p><strong>4. 修復完成：</strong>程式碼已修復，不會再出現此問題</p>
          </div>
        </div>

        {/* 預防措施 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-blue-800 mb-2">🛡️ 預防措施</h3>
          <div className="space-y-2 text-blue-700">
            <p>• 已修復編輯模式的刪除邏輯，現在只會刪除特定教師的排班記錄</p>
            <p>• 建議定期備份重要的排班資料</p>
            <p>• 在進行大量排班操作前，請先確認資料已備份</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
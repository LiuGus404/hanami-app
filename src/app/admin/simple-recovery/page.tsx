'use client';

import { useState, useEffect } from 'react';

export default function SimpleRecoveryPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [scheduleCount, setScheduleCount] = useState<number>(0);
  const [lessonCount, setLessonCount] = useState<number>(0);

  useEffect(() => {
    checkCurrentData();
  }, []);

  const checkCurrentData = async () => {
    setLoading(true);
    try {
      // 檢查當前排班記錄
      const scheduleResponse = await fetch('/api/check-teacher-schedule');
      const scheduleData = await scheduleResponse.json();
      
      if (scheduleData.success) {
        setScheduleCount(scheduleData.summary.totalSchedules);
      }

      // 檢查課程記錄
      const lessonResponse = await fetch('/api/check-lesson-data');
      const lessonData = await lessonResponse.json();
      
      if (lessonData.success) {
        setLessonCount(lessonData.totalLessons);
      }

    } catch (err) {
      console.error('檢查資料時發生錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  const backupCurrentData = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
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
        setMessage(`✅ 備份成功！共備份 ${result.backupData.length} 筆記錄`);
        checkCurrentData();
      }
    } catch (err) {
      setError('備份資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const restoreFromBackup = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      // 先獲取備份資料
      const backupResponse = await fetch('/api/fix-teacher-schedule-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup_current_data' }),
      });
      
      const backupResult = await backupResponse.json();
      
      if (backupResult.error) {
        setError(backupResult.error);
        return;
      }

      if (!backupResult.backupData || backupResult.backupData.length === 0) {
        setError('沒有備份資料可以還原');
        return;
      }

      // 還原備份資料
      const restoreResponse = await fetch('/api/fix-teacher-schedule-bug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'restore_from_backup',
          backupData: backupResult.backupData
        }),
      });
      
      const restoreResult = await restoreResponse.json();
      
      if (restoreResult.error) {
        setError(restoreResult.error);
      } else {
        setMessage(`✅ 還原成功！共還原 ${restoreResult.restoredCount} 筆記錄`);
        checkCurrentData();
      }
    } catch (err) {
      setError('還原資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const generateFromLessons = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      // 從課程記錄生成排班
      const response = await fetch('/api/generate-schedule-from-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(`✅ 成功從課程記錄生成 ${result.generatedCount} 筆排班記錄`);
        checkCurrentData();
      }
    } catch (err) {
      setError('從課程記錄生成排班時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#FFF9F2] min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
        <h1 className="text-2xl font-bold mb-6 text-[#4B4036]">教師排班資料恢復工具</h1>

        {/* 當前狀況 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4 text-[#4B4036]">📊 當前資料狀況</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${scheduleCount > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className="font-bold text-sm">排班記錄</h3>
              <p className={`text-2xl font-bold ${scheduleCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {scheduleCount} 筆
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <h3 className="font-bold text-sm">課程記錄</h3>
              <p className="text-2xl font-bold text-blue-600">
                {lessonCount} 筆
              </p>
            </div>
          </div>
        </div>

        {/* 恢復選項 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4 text-[#4B4036]">🔄 恢復選項</h2>
          
          <div className="space-y-4">
            {/* 備份當前資料 */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">💾 備份當前資料</h3>
              <p className="text-blue-700 mb-3">在進行任何恢復操作前，建議先備份當前資料</p>
              <button
                onClick={backupCurrentData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '備份中...' : '備份當前資料'}
              </button>
            </div>

            {/* 從課程記錄生成排班 */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-bold text-green-800 mb-2">📚 從課程記錄生成排班</h3>
              <p className="text-green-700 mb-3">
                根據課程記錄中的教師工作日期，自動生成排班記錄
              </p>
              <button
                onClick={generateFromLessons}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '生成中...' : '從課程記錄生成排班'}
              </button>
            </div>

            {/* 還原備份 */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-bold text-orange-800 mb-2">🔄 還原備份資料</h3>
              <p className="text-orange-700 mb-3">
                如果有備份資料，可以從備份中還原排班記錄
              </p>
              <button
                onClick={restoreFromBackup}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '還原中...' : '還原備份資料'}
              </button>
            </div>
          </div>
        </div>

        {/* 訊息顯示 */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">錯誤: {error}</p>
          </div>
        )}

        {/* 重要提醒 */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ 重要提醒</h3>
          <div className="text-yellow-700 space-y-2">
            <p>• <strong>Supabase備份：</strong>立即聯繫 <a href="https://supabase.com/support" target="_blank" rel="noopener noreferrer" className="underline">Supabase支援</a> 請求恢復資料</p>
            <p>• <strong>備份時效：</strong>Supabase通常保留7-30天的自動備份</p>
            <p>• <strong>操作順序：</strong>建議先備份當前資料，再嘗試恢復</p>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-4">
          <button
            onClick={checkCurrentData}
            className="px-4 py-2 bg-[#A68A64] text-white rounded-lg hover:bg-[#937654] transition-colors"
          >
            重新檢查
          </button>
          <a 
            href="/admin/quick-check-schedule"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回檢查頁面
          </a>
        </div>
      </div>
    </div>
  );
} 
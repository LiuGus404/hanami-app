'use client';

import { useState, useEffect } from 'react';

interface RecoveryData {
  success: boolean;
  currentStatus: {
    totalRecords: number;
    hasData: boolean;
    lastRecord: any;
  };
  recoveryOptions: {
    supabaseBackups: {
      available: boolean;
      description: string;
      contactInfo: string;
      timeWindow: string;
    };
    databaseLogs: {
      available: boolean;
      description: string;
      data: any[];
    };
    relatedData: {
      available: boolean;
      description: string;
      data: any[];
    };
    manualRecovery: {
      available: boolean;
      description: string;
      steps: string[];
    };
  };
  recommendations: Array<{
    priority: string;
    action: string;
    description: string;
    contact?: string;
    data?: any[];
    estimatedTime?: string;
  }>;
  checkTime: string;
}

export default function RecoverTeacherSchedulePage() {
  const [data, setData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecoveryMethod, setSelectedRecoveryMethod] = useState<string>('');

  useEffect(() => {
    checkRecoveryOptions();
  }, []);

  const checkRecoveryOptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-supabase-recovery');
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err) {
      setError('檢查恢復選項時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const generateScheduleFromLessons = async () => {
    if (!data?.recoveryOptions.relatedData.data) {
      alert('沒有課程記錄可以推斷排班');
      return;
    }

    setLoading(true);
    try {
      // 從課程記錄中提取教師工作日期
      const lessonData = data.recoveryOptions.relatedData.data;
      const teacherWorkDates = new Map<string, Set<string>>();

      lessonData.forEach((lesson: any) => {
        if (lesson.lesson_teacher && lesson.lesson_date) {
          if (!teacherWorkDates.has(lesson.lesson_teacher)) {
            teacherWorkDates.set(lesson.lesson_teacher, new Set());
          }
          teacherWorkDates.get(lesson.lesson_teacher)?.add(lesson.lesson_date);
        }
      });

      // 生成排班記錄
      const schedules = [];
      for (const [teacherName, dates] of teacherWorkDates) {
        for (const date of dates) {
          schedules.push({
            teacher_id: teacherName, // 這裡需要轉換為實際的teacher_id
            scheduled_date: date,
            start_time: '09:00',
            end_time: '18:00',
          });
        }
      }

      // 儲存到資料庫
      const response = await fetch('/api/restore-teacher-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore_batch',
          schedules: schedules
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        alert(`還原失敗: ${result.error}`);
      } else {
        alert(`✅ 成功從課程記錄推斷並還原 ${schedules.length} 筆排班記錄`);
        checkRecoveryOptions(); // 重新檢查
      }
    } catch (err) {
      alert('從課程記錄推斷排班時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-[#FFF9F2] min-h-screen">
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
          <h1 className="text-2xl font-bold mb-4">教師排班資料恢復</h1>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64] mx-auto"></div>
            <p className="mt-4 text-[#4B4036]">正在檢查恢復選項...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#FFF9F2] min-h-screen">
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
          <h1 className="text-2xl font-bold mb-4">教師排班資料恢復</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">錯誤: {error}</p>
          </div>
          <button
            onClick={checkRecoveryOptions}
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
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
          <h1 className="text-2xl font-bold mb-4">教師排班資料恢復</h1>
          <p>沒有恢復資料</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#FFF9F2] min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow border border-[#EADBC8]">
        <h1 className="text-2xl font-bold mb-6 text-[#4B4036]">教師排班資料恢復</h1>

        {/* 當前狀況 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 text-[#4B4036]">📊 當前狀況</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${data.currentStatus.hasData ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className="font-bold text-sm">排班記錄數</h3>
              <p className={`text-2xl font-bold ${data.currentStatus.hasData ? 'text-green-600' : 'text-red-600'}`}>
                {data.currentStatus.totalRecords}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <h3 className="font-bold text-sm">最後記錄</h3>
              <p className="text-sm text-blue-600">
                {data.currentStatus.lastRecord ? 
                  new Date(data.currentStatus.lastRecord.created_at).toLocaleString('zh-TW') : 
                  '無記錄'
                }
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
              <h3 className="font-bold text-sm">檢查時間</h3>
              <p className="text-sm text-purple-600">
                {new Date(data.checkTime).toLocaleString('zh-TW')}
              </p>
            </div>
          </div>
        </div>

        {/* 恢復選項 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 text-[#4B4036]">🔄 恢復選項</h2>
          
          {/* Supabase備份 */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">💾 Supabase自動備份</h3>
            <p className="text-blue-700 mb-2">{data.recoveryOptions.supabaseBackups.description}</p>
            <p className="text-blue-700 mb-2">保留時間: {data.recoveryOptions.supabaseBackups.timeWindow}</p>
            <a 
              href={data.recoveryOptions.supabaseBackups.contactInfo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              聯繫Supabase支援
            </a>
          </div>

          {/* 從課程記錄推斷 */}
          {data.recoveryOptions.relatedData.available && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-bold text-green-800 mb-2">📚 從課程記錄推斷</h3>
              <p className="text-green-700 mb-2">{data.recoveryOptions.relatedData.description}</p>
              <p className="text-green-700 mb-2">找到 {data.recoveryOptions.relatedData.data.length} 筆課程記錄</p>
              <button
                onClick={generateScheduleFromLessons}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '處理中...' : '從課程記錄推斷排班'}
              </button>
            </div>
          )}

          {/* 手動恢復 */}
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">✏️ 手動恢復</h3>
            <p className="text-yellow-700 mb-2">{data.recoveryOptions.manualRecovery.description}</p>
            <ol className="list-decimal list-inside text-yellow-700 ml-4 mb-2">
              {data.recoveryOptions.manualRecovery.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <a 
              href="/admin/teachers/teacher-schedule"
              className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              前往排班管理
            </a>
          </div>
        </div>

        {/* 建議操作 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 text-[#4B4036]">💡 建議操作順序</h2>
          <div className="space-y-3">
            {data.recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-bold ${
                      rec.priority === 'high' ? 'text-red-800' :
                      rec.priority === 'medium' ? 'text-yellow-800' :
                      'text-green-800'
                    }`}>
                      {index + 1}. {rec.action}
                    </h3>
                    <p className={`text-sm ${
                      rec.priority === 'high' ? 'text-red-700' :
                      rec.priority === 'medium' ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {rec.description}
                    </p>
                    {rec.estimatedTime && (
                      <p className={`text-xs ${
                        rec.priority === 'high' ? 'text-red-600' :
                        rec.priority === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        預估時間: {rec.estimatedTime}
                      </p>
                    )}
                  </div>
                  {rec.contact && (
                    <a 
                      href={rec.contact}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      聯繫
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 課程記錄預覽 */}
        {data.recoveryOptions.relatedData.data && data.recoveryOptions.relatedData.data.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 text-[#4B4036]">📋 課程記錄預覽</h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-[#EADBC8] rounded-lg">
                <thead className="bg-[#FFF9F2]">
                  <tr>
                    <th className="p-3 text-left border-b border-[#EADBC8]">教師</th>
                    <th className="p-3 text-left border-b border-[#EADBC8]">課程日期</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recoveryOptions.relatedData.data.slice(0, 10).map((lesson: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3 border-b border-[#EADBC8]">{lesson.lesson_teacher}</td>
                      <td className="p-3 border-b border-[#EADBC8]">{lesson.lesson_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.recoveryOptions.relatedData.data.length > 10 && (
                <p className="text-sm text-[#A68A64] mt-2">
                  顯示前10筆記錄，共 {data.recoveryOptions.relatedData.data.length} 筆
                </p>
              )}
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex gap-4">
          <button
            onClick={checkRecoveryOptions}
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
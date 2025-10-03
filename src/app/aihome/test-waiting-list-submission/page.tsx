'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestWaitingListSubmissionPage() {
  const [testData, setTestData] = useState({
    full_name: '測試家長',
    phone_no: '+85212345678',
    school: '測試小學',
    school_schedule: 'morning',
    prefer_time: [1, 3], // 星期一和星期三的數字格式
    notes: '這是測試資料',
    status: 'waiting'
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTestSubmit = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('hanami_trial_queue')
        .insert(testData)
        .select();

      if (error) {
        setResult({ success: false, error: error.message });
      } else {
        setResult({ success: true, data });
      }
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const handleQueryTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('hanami_trial_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        setResult({ success: false, error: error.message });
      } else {
        setResult({ success: true, data });
      }
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : '未知錯誤' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8 text-center">
          等候區註冊測試
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* 測試資料輸入 */}
          <div>
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">測試資料</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">家長姓名</label>
                <input
                  type="text"
                  value={testData.full_name}
                  onChange={(e) => setTestData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:border-[#FFD59A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">電話號碼</label>
                <input
                  type="text"
                  value={testData.phone_no}
                  onChange={(e) => setTestData(prev => ({ ...prev, phone_no: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:border-[#FFD59A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">學校名稱</label>
                <input
                  type="text"
                  value={testData.school}
                  onChange={(e) => setTestData(prev => ({ ...prev, school: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:border-[#FFD59A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">學校時段</label>
                <select
                  value={testData.school_schedule}
                  onChange={(e) => setTestData(prev => ({ ...prev, school_schedule: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:border-[#FFD59A] focus:outline-none"
                >
                  <option value="morning">上午班</option>
                  <option value="afternoon">下午班</option>
                  <option value="fulltime">全日制</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#4B4036] mb-2">偏好時間 (數字格式)</label>
                <input
                  type="text"
                  value={testData.prefer_time.join(', ')}
                  onChange={(e) => {
                    const numbers = e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                    setTestData(prev => ({ ...prev, prefer_time: numbers }));
                  }}
                  className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:border-[#FFD59A] focus:outline-none"
                  placeholder="例如: 0,6 (星期日和星期六)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0=星期日, 1=星期一, 2=星期二, 3=星期三, 4=星期四, 5=星期五, 6=星期六
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#4B4036] mb-2">備註</label>
                <textarea
                  value={testData.notes}
                  onChange={(e) => setTestData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:border-[#FFD59A] focus:outline-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* 測試按鈕 */}
          <div className="flex gap-4">
            <button
              onClick={handleTestSubmit}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? '提交中...' : '測試提交'}
            </button>
            <button
              onClick={handleQueryTest}
              disabled={loading}
              className="px-6 py-3 bg-white text-[#4B4036] border-2 border-[#EADBC8] rounded-lg font-semibold hover:border-[#FFD59A] transition-all duration-200 disabled:opacity-50"
            >
              {loading ? '查詢中...' : '查詢最近記錄'}
            </button>
          </div>

          {/* 結果顯示 */}
          {result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-[#4B4036] mb-2">
                {result.success ? '✅ 成功' : '❌ 失敗'}
              </h3>
              <pre className="text-sm text-gray-700 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* 資料庫表結構說明 */}
          <div className="bg-[#FFF9F2] rounded-lg p-4">
            <h3 className="font-semibold text-[#4B4036] mb-2">資料庫表結構</h3>
            <p className="text-sm text-[#2B3A3B] mb-2">
              表名: <code className="bg-gray-200 px-2 py-1 rounded">hanami_trial_queue</code>
            </p>
            <div className="text-xs text-[#2B3A3B] space-y-1">
              <p>• <code>full_name</code>: 家長姓名</p>
              <p>• <code>phone_no</code>: 電話號碼</p>
              <p>• <code>school</code>: 學校名稱</p>
              <p>• <code>school_schedule</code>: 學校時段 (morning/afternoon/fulltime)</p>
              <p>• <code>prefer_time</code>: 偏好時間 (JSONB)</p>
              <p>• <code>notes</code>: 備註</p>
              <p>• <code>status</code>: 狀態</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

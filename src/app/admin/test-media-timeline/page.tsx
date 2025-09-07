'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function TestMediaTimelinePage() {
  const [studentId, setStudentId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    if (!studentId.trim()) {
      setError('請輸入學生ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/student-media/timeline-simple?studentId=${studentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'API請求失敗');
      }
    } catch (err) {
      setError('網路錯誤: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            媒體時間軸API測試
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                學生ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="請輸入學生ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={testAPI}
              disabled={loading}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '測試中...' : '測試API'}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 font-medium">錯誤:</p>
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 font-medium">API響應成功!</p>
                  <p className="text-green-500">
                    課程數量: {result.data?.totalLessons || 0} | 
                    媒體數量: {result.data?.totalMedia || 0} | 
                    有評估資料: {result.data?.hasAssessment ? '是' : '否'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">完整響應:</h3>
                  <pre className="text-xs text-gray-600 overflow-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

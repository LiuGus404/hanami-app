'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function DebugLearningPathsPage() {
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [courseType, setCourseType] = useState('');
  const [createResult, setCreateResult] = useState<any>(null);

  const runGeneralDebug = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-learning-paths');
      const result = await response.json();
      setDebugResult(result);
      console.log('調試結果:', result);
    } catch (error) {
      console.error('調試失敗:', error);
      toast.error('調試失敗');
    } finally {
      setLoading(false);
    }
  };

  const runCourseTypeDebug = async () => {
    if (!courseType.trim()) {
      toast.error('請輸入課程類型');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/debug-learning-paths', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseType: courseType.trim() }),
      });
      const result = await response.json();
      setDebugResult(result);
      console.log('課程類型調試結果:', result);
    } catch (error) {
      console.error('課程類型調試失敗:', error);
      toast.error('課程類型調試失敗');
    } finally {
      setLoading(false);
    }
  };

  const createTestLearningPath = async () => {
    if (!courseType.trim()) {
      toast.error('請輸入課程類型');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/create-test-learning-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseType: courseType.trim() }),
      });
      const result = await response.json();
      setCreateResult(result);
      console.log('創建結果:', result);
      
      if (result.success) {
        toast.success('測試學習路徑創建成功！');
      } else {
        toast.error(`創建失敗: ${result.error}`);
      }
    } catch (error) {
      console.error('創建失敗:', error);
      toast.error('創建失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">學習路徑調試工具</h1>
      
      <div className="space-y-6">
        {/* 一般調試 */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">一般資料庫調試</h2>
          <button
            onClick={runGeneralDebug}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '調試中...' : '開始調試'}
          </button>
        </div>

        {/* 課程類型調試 */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">特定課程類型調試</h2>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">課程類型名稱</label>
              <input
                type="text"
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                placeholder="例如：鋼琴"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={runCourseTypeDebug}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '調試中...' : '調試課程類型'}
            </button>
            <button
              onClick={createTestLearningPath}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? '創建中...' : '創建測試學習路徑'}
            </button>
          </div>
        </div>

        {/* 調試結果 */}
        {debugResult && (
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">調試結果</h2>
            <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-sm">
                {JSON.stringify(debugResult, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* 創建結果 */}
        {createResult && (
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-4">創建結果</h2>
            <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-sm">
                {JSON.stringify(createResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
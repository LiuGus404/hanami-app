'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function DebugStudentActivitiesPage() {
  const [studentId, setStudentId] = useState('');
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    if (!studentId.trim()) {
      alert('請輸入學生ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/debug-student-activities?studentId=${studentId}`);
      const result = await response.json();
      setDebugResult(result);
    } catch (error) {
      console.error('調試失敗:', error);
      setDebugResult({ success: false, error: '調試失敗' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">調試學生活動</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">學生ID:</label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full p-2 border rounded-lg"
          placeholder="輸入學生ID"
        />
        <button
          onClick={runDebug}
          disabled={loading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '調試中...' : '開始調試'}
        </button>
      </div>

      {debugResult && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">調試結果:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(debugResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

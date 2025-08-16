'use client';

import { useState, useEffect } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function TestMediaLoadingPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testMediaLoading = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('開始診斷媒體載入問題...');
      
      const response = await fetch('/api/debug-media-loading');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '診斷失敗');
      }

      setResults(data.results);
      console.log('診斷完成:', data.results);

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
      console.error('診斷失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">媒體載入診斷</h1>
      
      <HanamiCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">診斷媒體載入問題</h2>
        <HanamiButton
          onClick={testMediaLoading}
          disabled={loading}
          className="w-full"
          variant="primary"
        >
          {loading ? '診斷中...' : '開始診斷'}
        </HanamiButton>
      </HanamiCard>

      {error && (
        <HanamiCard className="p-6 bg-red-50">
          <h2 className="text-xl font-semibold mb-4 text-red-600">錯誤</h2>
          <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
        </HanamiCard>
      )}

      {results && (
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">診斷結果</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">1. 資料庫連接</h3>
              <p>狀態: {results.connection?.success ? '✅ 成功' : '❌ 失敗'}</p>
              {results.connection?.error && (
                <p className="text-red-600">錯誤: {results.connection.error.message}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold">2. 學生資料</h3>
              <p>數量: {results.students?.count || 0}</p>
              {results.students?.error && (
                <p className="text-red-600">錯誤: {results.students.error.message}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold">3. 配額資料</h3>
              <p>數量: {results.quota?.count || 0}</p>
              {results.quota?.error && (
                <p className="text-red-600">錯誤: {results.quota.error.message}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold">4. 媒體資料</h3>
              <p>數量: {results.media?.count || 0}</p>
              {results.media?.error && (
                <p className="text-red-600">錯誤: {results.media.error.message}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold">5. RLS 政策</h3>
              <p>狀態: {results.rls?.error ? '❌ 檢查失敗' : '✅ 檢查完成'}</p>
              {results.rls?.error && (
                <p className="text-red-600">錯誤: {results.rls.error}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold">6. 媒體統計查詢</h3>
              <p>數量: {results.mediaStats?.count || 0}</p>
              <p>學生ID數量: {results.mediaStats?.studentIds?.length || 0}</p>
              {results.mediaStats?.error && (
                <p className="text-red-600">錯誤: {results.mediaStats.error.message || results.mediaStats.error}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold">7. 表結構</h3>
              <p>狀態: {results.schema?.error ? '❌ 檢查失敗' : '✅ 檢查完成'}</p>
              {results.schema?.error && (
                <p className="text-red-600">錯誤: {results.schema.error}</p>
              )}
            </div>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">詳細資料</summary>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96 mt-2">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </HanamiCard>
      )}
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugSupabasePage() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const getDebugInfo = async () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          anonKeyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
        },
        clientInfo: {
          supabaseClient: !!supabase,
          clientType: typeof supabase,
        }
      };

      // 測試不同的查詢方法
      const queries = [
        { name: 'hanami_employee', table: 'hanami_employee' },
        { name: 'Hanami_Students', table: 'Hanami_Students' },
        { name: 'ai_rooms', table: 'ai_rooms' },
        { name: 'ai_roles', table: 'ai_roles' },
        { name: 'saas_users', table: 'saas_users' },
      ];

      info.queryResults = [];

      for (const query of queries) {
        try {
          const { data, error, count } = await supabase
            .from(query.table)
            .select('*', { count: 'exact' })
            .limit(1);

          info.queryResults.push({
            table: query.table,
            success: !error,
            error: error?.message,
            errorCode: error?.code,
            errorDetails: error?.details,
            dataCount: count,
            hasData: data && data.length > 0,
            sampleData: data?.[0] ? Object.keys(data[0]) : null
          });
        } catch (err: any) {
          info.queryResults.push({
            table: query.table,
            success: false,
            error: err.message,
            errorType: typeof err
          });
        }
      }

      // 測試原始 SQL 查詢
      try {
        const { data, error } = await supabase.rpc('version');
        info.sqlTest = {
          success: !error,
          error: error?.message,
          version: data
        };
      } catch (err: any) {
        info.sqlTest = {
          success: false,
          error: err.message
        };
      }

      setDebugInfo(info);
    };

    getDebugInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase 深度診斷</h1>
        
        <div className="grid gap-6">
          {/* 環境資訊 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">環境配置</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(debugInfo.environment, null, 2)}
            </pre>
          </div>

          {/* 客戶端資訊 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">客戶端資訊</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm">
              {JSON.stringify(debugInfo.clientInfo, null, 2)}
            </pre>
          </div>

          {/* 查詢結果 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">表格查詢測試</h2>
            <div className="space-y-4">
              {debugInfo.queryResults?.map((result: any, index: number) => (
                <div 
                  key={index}
                  className={`p-4 rounded border ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-2">{result.table}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>狀態:</strong> {result.success ? '✅ 成功' : '❌ 失敗'}</p>
                      {result.error && <p><strong>錯誤:</strong> {result.error}</p>}
                      {result.errorCode && <p><strong>錯誤代碼:</strong> {result.errorCode}</p>}
                      {result.errorDetails && <p><strong>詳細:</strong> {result.errorDetails}</p>}
                    </div>
                    <div>
                      {result.dataCount !== undefined && <p><strong>記錄數:</strong> {result.dataCount}</p>}
                      {result.hasData && <p><strong>有資料:</strong> 是</p>}
                      {result.sampleData && (
                        <p><strong>欄位:</strong> {result.sampleData.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SQL 測試 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">SQL 功能測試</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm">
              {JSON.stringify(debugInfo.sqlTest, null, 2)}
            </pre>
          </div>

          {/* 完整除錯資訊 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">完整除錯資訊</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">檢查重點:</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• 確認 Supabase URL 是否正確</li>
            <li>• 確認 Anon Key 是否有效</li>
            <li>• 比較成功和失敗的表格差異</li>
            <li>• 檢查錯誤代碼 42P01 (relation does not exist)</li>
            <li>• 確認前端是否連接到正確的資料庫專案</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


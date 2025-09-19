'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabaseConnection() {
  const [connectionInfo, setConnectionInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      const results = [];
      
      // 1. 檢查 Supabase 配置
      results.push({
        test: '環境變數檢查',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已設置' : 'undefined'
      });

      // 2. 測試基本連接
      try {
        const { data, error } = await supabase
          .from('saas_users')
          .select('id')
          .limit(1);
        
        results.push({
          test: '基本 Supabase 連接',
          success: !error,
          error: error?.message,
          data: data?.length || 0
        });
      } catch (err: any) {
        results.push({
          test: '基本 Supabase 連接',
          success: false,
          error: err.message
        });
      }

      // 3. 測試 ai_rooms 表格存在性
      try {
        const { data, error } = await supabase
          .from('ai_rooms')
          .select('id')
          .limit(1);
        
        results.push({
          test: 'ai_rooms 表格測試',
          success: !error,
          error: error?.message,
          code: error?.code,
          data: data?.length || 0
        });
      } catch (err: any) {
        results.push({
          test: 'ai_rooms 表格測試',
          success: false,
          error: err.message
        });
      }

      // 4. 測試其他已知表格
      const knownTables = ['saas_users', 'hanami_employee', 'Hanami_Students'];
      for (const table of knownTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          results.push({
            test: `${table} 表格測試`,
            success: !error,
            error: error?.message,
            data: data?.length || 0
          });
        } catch (err: any) {
          results.push({
            test: `${table} 表格測試`,
            success: false,
            error: err.message
          });
        }
      }

      setTestResults(results);
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Supabase 連接診斷</h1>
        
        <div className="grid gap-6">
          {testResults.map((result, index) => (
            <div 
              key={index}
              className={`p-6 rounded-lg border ${
                result.success === true ? 'bg-green-50 border-green-200' :
                result.success === false ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <h3 className="text-lg font-semibold mb-4">{result.test}</h3>
              
              <div className="space-y-2">
                {result.success !== undefined && (
                  <p className={`font-medium ${
                    result.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    狀態: {result.success ? '✅ 成功' : '❌ 失敗'}
                  </p>
                )}
                
                {result.supabaseUrl && (
                  <p><strong>Supabase URL:</strong> {result.supabaseUrl}</p>
                )}
                
                {result.supabaseAnonKey && (
                  <p><strong>Anon Key:</strong> {result.supabaseAnonKey}</p>
                )}
                
                {result.error && (
                  <p className="text-red-600"><strong>錯誤:</strong> {result.error}</p>
                )}
                
                {result.code && (
                  <p className="text-orange-600"><strong>錯誤代碼:</strong> {result.code}</p>
                )}
                
                {result.data !== undefined && (
                  <p><strong>資料筆數:</strong> {result.data}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">診斷建議:</h3>
          <ul className="text-yellow-700 space-y-1 text-sm">
            <li>• 如果環境變數未定義，請檢查 .env.local 文件</li>
            <li>• 如果 ai_rooms 表格不存在，需要執行 SQL 創建腳本</li>
            <li>• 如果其他表格正常但 ai_rooms 失敗，可能是權限問題</li>
            <li>• 檢查 Supabase 控制台中的表格和 RLS 設置</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


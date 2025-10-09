'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function ScreenshotDebugTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const debugStorage = async () => {
    setLoading(true);
    setResults([]);

    try {
      // 1. 檢查環境變數
      const saasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
      const saasSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY;
      const saasSupabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY;
      
      setResults(prev => [...prev, { 
        step: '環境變數檢查', 
        success: true, 
        details: {
          url: saasSupabaseUrl ? `${saasSupabaseUrl.substring(0, 30)}...` : '未設定',
          hasAnonKey: !!saasSupabaseAnonKey,
          hasServiceKey: !!saasSupabaseServiceKey,
          anonKeyLength: saasSupabaseAnonKey?.length || 0,
          serviceKeyLength: saasSupabaseServiceKey?.length || 0
        }
      }]);

      if (!saasSupabaseUrl || !saasSupabaseServiceKey) {
        throw new Error('環境變數未設定（需要 Service Role Key）');
      }

      // 使用 Service Role Key 來訪問 Storage
      const saasSupabase = createClient(saasSupabaseUrl, saasSupabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // 2. 列出所有可用的 buckets
      setResults(prev => [...prev, { 
        step: '列出所有 buckets', 
        success: true, 
        details: '正在查詢...'
      }]);

      const { data: buckets, error: bucketsError } = await saasSupabase.storage.listBuckets();
      
      if (bucketsError) {
        setResults(prev => [...prev, { 
          step: '列出所有 buckets', 
          success: false, 
          error: bucketsError.message 
        }]);
      } else {
        setResults(prev => [...prev, { 
          step: '列出所有 buckets', 
          success: true, 
          details: {
            count: buckets?.length || 0,
            buckets: buckets?.map(b => ({ name: b.name, public: b.public })) || []
          }
        }]);
      }

      // 3. 檢查 hanami-saas-system bucket 是否存在
      const targetBucket = 'hanami-saas-system';
      const bucketExists = buckets?.some(b => b.name === targetBucket);
      
      setResults(prev => [...prev, { 
        step: '檢查目標 bucket', 
        success: bucketExists, 
        details: {
          targetBucket,
          exists: bucketExists,
          message: bucketExists ? 'Bucket 存在' : 'Bucket 不存在'
        }
      }]);

      if (!bucketExists) {
        setResults(prev => [...prev, { 
          step: '建議', 
          success: false, 
          error: `目標 bucket "${targetBucket}" 不存在。可用的 buckets: ${buckets?.map(b => b.name).join(', ') || '無'}`
        }]);
        return;
      }

      // 4. 嘗試列出 bucket 根目錄（使用不同的方法）
      setResults(prev => [...prev, { 
        step: '列出 bucket 根目錄', 
        success: true, 
        details: '正在查詢...'
      }]);

      const { data: rootItems, error: rootError } = await saasSupabase.storage
        .from(targetBucket)
        .list('', { limit: 100 });

      if (rootError) {
        setResults(prev => [...prev, { 
          step: '列出 bucket 根目錄', 
          success: false, 
          error: rootError.message 
        }]);
      } else {
        setResults(prev => [...prev, { 
          step: '列出 bucket 根目錄', 
          success: true, 
          details: {
            count: rootItems?.length || 0,
            items: rootItems?.map(item => ({ 
              name: item.name, 
              size: item.metadata?.size,
              lastModified: item.updated_at,
              isFolder: !item.metadata?.mimetype
            })) || []
          }
        }]);
      }

      // 5. 檢查是否有其他可能的截圖資料夾
      const possiblePaths = [
        'payment-screenshots',
        'screenshots',
        'payments',
        'images',
        'uploads',
        '2025-10-06',
        '2025-01-06',
        '2024-12-19'
      ];

      for (const path of possiblePaths) {
        const { data: pathItems, error: pathError } = await saasSupabase.storage
          .from(targetBucket)
          .list(path, { limit: 10 });

        if (!pathError && pathItems && pathItems.length > 0) {
          setResults(prev => [...prev, { 
            step: `檢查路徑: ${path}`, 
            success: true, 
            details: {
              count: pathItems.length,
              items: pathItems.map(item => item.name)
            }
          }]);
        }
      }

      // 6. 嘗試上傳一個測試檔案來驗證權限
      setResults(prev => [...prev, { 
        step: '權限測試', 
        success: true, 
        details: '正在測試上傳權限...'
      }]);

      const testContent = new Blob(['test'], { type: 'text/plain' });
      const testFileName = `test-${Date.now()}.txt`;

      const { data: uploadData, error: uploadError } = await saasSupabase.storage
        .from(targetBucket)
        .upload(testFileName, testContent);

      if (uploadError) {
        setResults(prev => [...prev, { 
          step: '權限測試', 
          success: false, 
          error: `上傳失敗: ${uploadError.message}` 
        }]);
      } else {
        setResults(prev => [...prev, { 
          step: '權限測試', 
          success: true, 
          details: {
            message: '上傳成功',
            path: uploadData.path
          }
        }]);

        // 清理測試檔案
        await saasSupabase.storage
          .from(targetBucket)
          .remove([testFileName]);
      }

    } catch (error) {
      setResults(prev => [...prev, { 
        step: '系統錯誤', 
        success: false, 
        error: error instanceof Error ? error.message : '未知錯誤' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-6">
            🔧 Supabase Storage 深度診斷
          </h1>

          <div className="mb-6">
            <button
              onClick={debugStorage}
              disabled={loading}
              className="px-6 py-3 bg-[#4B4036] text-white rounded-lg hover:bg-[#2B3A3B] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '診斷中...' : '開始深度診斷'}
            </button>
          </div>

          <div className="bg-white border border-[#EADBC8] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">
              📋 診斷結果
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 text-sm">尚未開始診斷</p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className={`text-xl ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? '✅' : '❌'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-[#4B4036]">{result.step}</p>
                        {result.error ? (
                          <p className="text-red-600 text-sm mt-1">{result.error}</p>
                        ) : (
                          <div className="mt-2">
                            {typeof result.details === 'string' ? (
                              <p className="text-green-600 text-sm">{result.details}</p>
                            ) : (
                              <pre className="text-green-600 text-xs bg-green-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 說明 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-medium text-blue-800 mb-2">💡 診斷說明</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 檢查環境變數配置</li>
              <li>• 列出所有可用的 Storage buckets</li>
              <li>• 驗證目標 bucket 是否存在</li>
              <li>• 檢查 bucket 根目錄內容</li>
              <li>• 搜尋可能的截圖資料夾</li>
              <li>• 測試上傳權限</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

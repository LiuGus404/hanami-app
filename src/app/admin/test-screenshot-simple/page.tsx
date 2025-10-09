'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

export default function SimpleScreenshotTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const testStorage = async () => {
    setLoading(true);
    setResults([]);
    setScreenshotUrl(null);

    try {
      const saasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
      const saasSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY;
      
      if (!saasSupabaseUrl || !saasSupabaseAnonKey) {
        throw new Error('環境變數未設定');
      }

      const saasSupabase = createClient(saasSupabaseUrl, saasSupabaseAnonKey);
      
      // 1. 列出 bucket 根目錄
      console.log('🔍 列出 hanami-saas-system bucket 根目錄...');
      const { data: rootItems, error: rootError } = await saasSupabase.storage
        .from('hanami-saas-system')
        .list('');

      if (rootError) {
        setResults(prev => [...prev, { step: '根目錄', error: rootError.message }]);
      } else {
        setResults(prev => [...prev, { 
          step: '根目錄', 
          success: true, 
          items: rootItems?.map(item => item.name) || [] 
        }]);
      }

      // 2. 檢查 2025-10-06 資料夾
      console.log('🔍 檢查 2025-10-06 資料夾...');
      const { data: dateFolderItems, error: dateFolderError } = await saasSupabase.storage
        .from('hanami-saas-system')
        .list('2025-10-06');

      if (dateFolderError) {
        setResults(prev => [...prev, { step: '2025-10-06 資料夾', error: dateFolderError.message }]);
      } else {
        setResults(prev => [...prev, { 
          step: '2025-10-06 資料夾', 
          success: true, 
          items: dateFolderItems?.map(item => item.name) || [] 
        }]);
      }

      // 3. 檢查根目錄下的 payment-screenshots 資料夾
      console.log('🔍 檢查根目錄下的 payment-screenshots 資料夾...');
      const { data: screenshotItems, error: screenshotError } = await saasSupabase.storage
        .from('hanami-saas-system')
        .list('payment-screenshots');

      if (screenshotError) {
        setResults(prev => [...prev, { step: 'payment-screenshots 資料夾', error: screenshotError.message }]);
      } else {
        setResults(prev => [...prev, { 
          step: 'payment-screenshots 資料夾', 
          success: true, 
          items: screenshotItems?.map(item => item.name) || [] 
        }]);

        // 4. 如果有檔案，嘗試獲取第一個檔案的 URL
        if (screenshotItems && screenshotItems.length > 0) {
          const firstFile = screenshotItems[0];
          console.log('🔍 嘗試獲取第一個檔案的 URL:', firstFile.name);
          
          const { data: signedUrlData, error: urlError } = await saasSupabase.storage
            .from('hanami-saas-system')
            .createSignedUrl(`payment-screenshots/${firstFile.name}`, 3600);

          if (urlError) {
            setResults(prev => [...prev, { step: '獲取檔案 URL', error: urlError.message }]);
          } else {
            setResults(prev => [...prev, { 
              step: '獲取檔案 URL', 
              success: true, 
              url: signedUrlData.signedUrl 
            }]);
            setScreenshotUrl(signedUrlData.signedUrl);
          }
        }
      }

      // 5. 如果上面沒找到，再檢查 2025-10-06/payment-screenshots 路徑
      if (!screenshotUrl) {
        console.log('🔍 檢查 2025-10-06/payment-screenshots 路徑...');
        const { data: dateScreenshotItems, error: dateScreenshotError } = await saasSupabase.storage
          .from('hanami-saas-system')
          .list('2025-10-06/payment-screenshots');

        if (dateScreenshotError) {
          setResults(prev => [...prev, { step: '2025-10-06/payment-screenshots', error: dateScreenshotError.message }]);
        } else {
          setResults(prev => [...prev, { 
            step: '2025-10-06/payment-screenshots', 
            success: true, 
            items: dateScreenshotItems?.map(item => item.name) || [] 
          }]);

          // 如果有檔案，嘗試獲取第一個檔案的 URL
          if (dateScreenshotItems && dateScreenshotItems.length > 0) {
            const firstFile = dateScreenshotItems[0];
            console.log('🔍 嘗試獲取第一個檔案的 URL:', firstFile.name);
            
            const { data: signedUrlData, error: urlError } = await saasSupabase.storage
              .from('hanami-saas-system')
              .createSignedUrl(`2025-10-06/payment-screenshots/${firstFile.name}`, 3600);

            if (urlError) {
              setResults(prev => [...prev, { step: '獲取檔案 URL (日期路徑)', error: urlError.message }]);
            } else {
              setResults(prev => [...prev, { 
                step: '獲取檔案 URL (日期路徑)', 
                success: true, 
                url: signedUrlData.signedUrl 
              }]);
              setScreenshotUrl(signedUrlData.signedUrl);
            }
          }
        }
      }

    } catch (error) {
      setResults(prev => [...prev, { step: '系統錯誤', error: error instanceof Error ? error.message : '未知錯誤' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-6">
            🔍 簡單截圖測試
          </h1>

          <div className="mb-6">
            <button
              onClick={testStorage}
              disabled={loading}
              className="px-6 py-3 bg-[#4B4036] text-white rounded-lg hover:bg-[#2B3A3B] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '測試中...' : '開始測試 Storage'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 測試結果 */}
            <div className="bg-white border border-[#EADBC8] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-4">
                📋 測試結果
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <p className="text-gray-500 text-sm">尚未開始測試</p>
                ) : (
                  results.map((result, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className={`text-lg ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.success ? '✅' : '❌'}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-[#4B4036]">{result.step}</p>
                          {result.error ? (
                            <p className="text-red-600 text-sm mt-1">{result.error}</p>
                          ) : (
                            <div className="mt-1">
                              {result.items && (
                                <p className="text-green-600 text-sm">
                                  找到 {result.items.length} 個項目: {result.items.join(', ')}
                                </p>
                              )}
                              {result.url && (
                                <p className="text-green-600 text-xs mt-1 break-all">
                                  URL: {result.url}
                                </p>
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

            {/* 截圖顯示 */}
            <div className="bg-white border border-[#EADBC8] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-4">
                📸 截圖顯示
              </h2>
              
              {loading && (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB6C1] mx-auto mb-4"></div>
                    <p className="text-[#2B3A3B]">正在測試...</p>
                  </div>
                </div>
              )}

              {screenshotUrl && (
                <div className="space-y-4">
                  <div className="relative">
                    <Image
                      src={screenshotUrl}
                      alt="付款截圖"
                      width={400}
                      height={300}
                      className="rounded-lg border border-[#EADBC8] shadow-md w-full h-auto"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">
                      ✅ 成功載入截圖！
                    </p>
                  </div>
                </div>
              )}

              {!loading && !screenshotUrl && (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📷</div>
                    <p>點擊「開始測試」來查找截圖</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 說明 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-medium text-blue-800 mb-2">💡 測試說明</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 這個測試會直接檢查 Supabase Storage 的實際結構</li>
              <li>• 會列出 hanami-saas-system bucket 的根目錄內容</li>
              <li>• 檢查 2025-10-06 資料夾是否存在</li>
              <li>• 檢查 payment-screenshots 子資料夾中的檔案</li>
              <li>• 如果找到檔案，會嘗試載入第一個截圖</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

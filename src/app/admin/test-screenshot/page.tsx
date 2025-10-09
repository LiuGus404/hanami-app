'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

export default function TestScreenshotPage() {
  const [studentId, setStudentId] = useState('da95906d-f7b4-47f5-9625-6fbdef11c132');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  const addDebugInfo = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, { timestamp, message, data }]);
    console.log(`[${timestamp}] ${message}`, data || '');
  };

  const testScreenshotRetrieval = async () => {
    setLoading(true);
    setError(null);
    setScreenshotUrl(null);
    setDebugInfo([]);

    try {
      // 使用 hanami-saas-system 的 Supabase 客戶端
      const saasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL;
      const saasSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY;
      
      if (!saasSupabaseUrl || !saasSupabaseAnonKey) {
        throw new Error('SaaS Supabase 環境變數未設定');
      }

      addDebugInfo('🔧 環境變數檢查通過', { 
        url: saasSupabaseUrl.substring(0, 30) + '...',
        hasKey: !!saasSupabaseAnonKey 
      });

      const saasSupabase = createClient(saasSupabaseUrl, saasSupabaseAnonKey);
      addDebugInfo('✅ Supabase 客戶端創建成功');

      // 方法1: 從 payment_records 表查找截圖記錄
      addDebugInfo('🔍 方法1: 從 payment_records 表查找截圖記錄');
      const { data: paymentRecords, error: recordsError } = await saasSupabase
        .from('payment_records')
        .select('screenshot_url, file_name, metadata, created_at')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recordsError) {
        addDebugInfo('❌ 查詢 payment_records 失敗', recordsError);
      } else {
        addDebugInfo('📋 payment_records 查詢結果', { 
          count: paymentRecords?.length || 0,
          records: paymentRecords 
        });
        
        if (paymentRecords && paymentRecords.length > 0) {
          const record = paymentRecords[0];
          if (record.screenshot_url) {
            addDebugInfo('✅ 從 payment_records 找到截圖 URL', record.screenshot_url);
            setScreenshotUrl(record.screenshot_url);
            return;
          }
        }
      }

      // 方法2: 從 storage 查找（修正路徑結構）
      addDebugInfo('🔍 方法2: 從 storage 的 hanami-saas-system bucket 查找');
      
      // 先列出 bucket 根目錄的內容
      const { data: rootItems, error: rootError } = await saasSupabase.storage
        .from('hanami-saas-system')
        .list('');

      if (rootError) {
        addDebugInfo('❌ 獲取根目錄失敗', rootError);
      } else {
        addDebugInfo('📁 根目錄內容', rootItems?.map(f => f.name) || []);
        
        // 尋找日期格式的資料夾
        const dateFolders = rootItems?.filter(item => 
          item.name && item.name.match(/^\d{4}-\d{2}-\d{2}$/)
        ) || [];
        
        addDebugInfo('📅 找到的日期資料夾', dateFolders.map(f => f.name));
        
        // 按日期倒序查找（最新的在前）
        const sortedFolders = dateFolders.sort((a, b) => b.name.localeCompare(a.name));
        
        for (const folder of sortedFolders.slice(0, 5)) { // 只檢查最近5個資料夾
          addDebugInfo(`🔍 檢查日期資料夾: ${folder.name}`);
          
          // 列出日期資料夾中的內容
          const { data: dateFolderItems, error: dateFolderError } = await saasSupabase.storage
            .from('hanami-saas-system')
            .list(folder.name);

          if (dateFolderError) {
            addDebugInfo(`❌ 獲取 ${folder.name} 資料夾內容失敗`, dateFolderError);
            continue;
          }

          addDebugInfo(`📄 ${folder.name} 資料夾中的內容`, dateFolderItems?.map(f => f.name) || []);

          // 尋找 payment-screenshots 子資料夾
          const paymentScreenshotsFolder = dateFolderItems?.find(item => 
            item.name === 'payment-screenshots'
          );

          if (paymentScreenshotsFolder) {
            addDebugInfo(`📁 找到 payment-screenshots 子資料夾在 ${folder.name}`);
            
            // 列出 payment-screenshots 中的檔案
            const { data: screenshotFiles, error: screenshotFilesError } = await saasSupabase.storage
              .from('hanami-saas-system')
              .list(`${folder.name}/payment-screenshots`);

            if (screenshotFilesError) {
              addDebugInfo(`❌ 獲取 payment-screenshots 檔案失敗`, screenshotFilesError);
              continue;
            }

            addDebugInfo(`📸 payment-screenshots 中的檔案`, screenshotFiles?.map(f => f.name) || []);

            // 尋找可能的截圖檔案
            const screenshotFile = screenshotFiles?.find(file => 
              file.name && (
                file.name.includes(studentId) ||
                file.name.includes(studentId.substring(0, 8)) ||
                file.name.toLowerCase().includes('payment') ||
                file.name.toLowerCase().includes('screenshot') ||
                file.name.toLowerCase().includes('截圖')
              )
            );

            if (screenshotFile) {
              addDebugInfo(`✅ 找到截圖檔案: ${folder.name}/payment-screenshots/${screenshotFile.name}`);
              
              const { data, error } = await saasSupabase.storage
                .from('hanami-saas-system')
                .createSignedUrl(`${folder.name}/payment-screenshots/${screenshotFile.name}`, 3600);
              
              if (!error && data) {
                addDebugInfo('✅ 成功創建簽名 URL', data.signedUrl);
                setScreenshotUrl(data.signedUrl);
                return;
              } else {
                addDebugInfo('❌ 創建簽名 URL 失敗', error);
              }
            }
          }
        }
      }

      // 方法3: 列出最近幾天的所有檔案進行調試（修正路徑）
      addDebugInfo('🔍 方法3: 列出最近7天的所有檔案進行調試');
      
      const recentDays = 7;
      const today = new Date();
      
      for (let i = 0; i < recentDays; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        
        try {
          // 檢查日期資料夾是否存在
          const { data: dateFolderItems, error: dateFolderError } = await saasSupabase.storage
            .from('hanami-saas-system')
            .list(dateStr);

          if (!dateFolderError && dateFolderItems) {
            addDebugInfo(`📁 ${dateStr} 資料夾中的內容`, dateFolderItems.map(f => f.name));
            
            // 檢查是否有 payment-screenshots 子資料夾
            const paymentScreenshotsFolder = dateFolderItems.find(item => 
              item.name === 'payment-screenshots'
            );
            
            if (paymentScreenshotsFolder) {
              // 列出 payment-screenshots 中的檔案
              const { data: files, error: filesError } = await saasSupabase.storage
                .from('hanami-saas-system')
                .list(`${dateStr}/payment-screenshots`);

              if (!filesError && files && files.length > 0) {
                addDebugInfo(`📸 ${dateStr}/payment-screenshots 中的檔案`, files.map(f => f.name));
                
                // 尋找任何包含學生 ID 的檔案
                const studentFile = files.find(file => 
                  file.name && file.name.includes(studentId)
                );
                
                if (studentFile) {
                  addDebugInfo(`✅ 在 ${dateStr}/payment-screenshots 找到學生檔案: ${studentFile.name}`);
                  
                  const { data, error } = await saasSupabase.storage
                    .from('hanami-saas-system')
                    .createSignedUrl(`${dateStr}/payment-screenshots/${studentFile.name}`, 3600);
                  
                  if (!error && data) {
                    addDebugInfo('✅ 成功創建簽名 URL', data.signedUrl);
                    setScreenshotUrl(data.signedUrl);
                    return;
                  }
                }
              }
            }
          }
        } catch (error) {
          addDebugInfo(`⏭️ 跳過 ${dateStr} 資料夾（可能不存在）`);
        }
      }

      addDebugInfo(`❌ 學生 ${studentId} 的付款截圖檔案不存在`);
      setError('截圖檔案不存在');

    } catch (error) {
      addDebugInfo('❌ 獲取付款截圖時發生錯誤', error);
      setError(error instanceof Error ? error.message : '系統錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-6">
            🔍 付款截圖獲取測試
          </h1>

          {/* 測試控制 */}
          <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-xl p-6 mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  學生 ID
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent"
                  placeholder="輸入學生 ID"
                />
              </div>
              <button
                onClick={testScreenshotRetrieval}
                disabled={loading}
                className="px-6 py-2 bg-[#4B4036] text-white rounded-lg hover:bg-[#2B3A3B] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '測試中...' : '開始測試'}
              </button>
            </div>
          </div>

          {/* 結果顯示 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 截圖顯示 */}
            <div className="bg-white border border-[#EADBC8] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-4">
                📸 截圖顯示
              </h2>
              
              {loading && (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB6C1] mx-auto mb-4"></div>
                    <p className="text-[#2B3A3B]">正在查找截圖...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-red-600 text-2xl mr-3">❌</div>
                    <div>
                      <h3 className="font-medium text-red-800">載入失敗</h3>
                      <p className="text-red-600 text-sm mt-1">{error}</p>
                    </div>
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
                      ✅ 截圖載入成功！
                    </p>
                    <p className="text-green-600 text-xs mt-1 break-all">
                      URL: {screenshotUrl}
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && !screenshotUrl && (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📷</div>
                    <p>點擊「開始測試」來查找截圖</p>
                  </div>
                </div>
              )}
            </div>

            {/* 調試信息 */}
            <div className="bg-white border border-[#EADBC8] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-4">
                🔧 調試信息
              </h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {debugInfo.length === 0 ? (
                  <p className="text-gray-500 text-sm">尚未開始測試</p>
                ) : (
                  debugInfo.map((info, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 text-xs font-mono">
                          {info.timestamp}
                        </span>
                        <div className="flex-1">
                          <p className="text-[#4B4036] font-medium">{info.message}</p>
                          {info.data && (
                            <pre className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border overflow-x-auto">
                              {JSON.stringify(info.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 使用說明 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-medium text-blue-800 mb-2">💡 使用說明</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• 輸入要測試的學生 ID</li>
              <li>• 點擊「開始測試」查看詳細的查找過程</li>
              <li>• 右側會顯示所有調試信息，幫助診斷問題</li>
              <li>• 如果找到截圖，左側會顯示圖片</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function TestApiConnectionPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      console.log('🔄 測試 API 連接...');
      
      const response = await fetch('/api/test-payme-fps', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('📋 API 測試結果:', result);

      if (result.success) {
        setTestResult(result.data);
      } else {
        setError(result.error || '測試失敗');
      }
    } catch (err) {
      console.error('❌ API 測試錯誤:', err);
      setError(err instanceof Error ? err.message : '連接失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-4">API 連接測試</h1>
          <p className="text-[#2B3A3B]">測試 PAYME FPS 資料庫連接和資料載入</p>
          
          <motion.button
            onClick={testConnection}
            disabled={loading}
            whileHover={!loading ? { scale: 1.05 } : {}}
            whileTap={!loading ? { scale: 0.95 } : {}}
            className="mt-4 flex items-center space-x-2 px-6 py-3 bg-[#FFD59A] text-[#4B4036] rounded-lg font-semibold hover:bg-[#FFD59A]/80 transition-colors mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? '測試中...' : '測試連接'}</span>
          </motion.button>
        </div>

        {/* 載入狀態 */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
            <p className="text-[#4B4036]">正在測試 API 連接...</p>
          </motion.div>
        )}

        {/* 錯誤狀態 */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center space-x-3">
              <XCircleIcon className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">測試失敗</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 成功結果 */}
        {testResult && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 連接狀態 */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">連接成功</h3>
                  <p className="text-sm text-green-700">資料庫連接正常</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">連接狀態:</span>
                  <span className="ml-2 text-green-600">✅ {testResult.connection}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">帳戶數量:</span>
                  <span className="ml-2 text-blue-600">{testResult.accountsCount}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Supabase URL:</span>
                  <span className="ml-2 text-gray-600">{testResult.environment?.supabaseUrl ? '已設置' : '未設置'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Service Key:</span>
                  <span className="ml-2 text-gray-600">{testResult.environment?.hasServiceKey ? '已設置' : '未設置'}</span>
                </div>
              </div>
            </div>

            {/* 機構測試結果 */}
            {testResult.institutionTests && (
              <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm mb-6">
                <h3 className="text-lg font-bold text-[#4B4036] mb-4">機構名稱測試結果</h3>
                <div className="space-y-3">
                  {Object.entries(testResult.institutionTests).map(([institution, result]: [string, any]) => (
                    <div key={institution} className={`p-3 rounded-lg border ${
                      result.found ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{institution}</span>
                        <span className={`text-sm ${result.found ? 'text-green-600' : 'text-gray-500'}`}>
                          {result.found ? `✅ 找到 ${result.count} 個帳戶` : '❌ 未找到'}
                        </span>
                      </div>
                      {result.error && (
                        <p className="text-xs text-red-600 mt-1">錯誤: {result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 帳戶資料 */}
            {testResult.accounts && testResult.accounts.length > 0 ? (
              <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm">
                <h3 className="text-lg font-bold text-[#4B4036] mb-4">帳戶資料</h3>
                <div className="space-y-4">
                  {testResult.accounts.map((account: any, index: number) => (
                    <div key={account.id || index} className="bg-gray-50 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">機構名稱:</span>
                          <span className="ml-2">{account.institution_name}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">主要帳戶:</span>
                          <span className="ml-2">{account.is_primary ? '✅ 是' : '❌ 否'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">PAYME 電話:</span>
                          <span className="ml-2">{account.payme_phone}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">PAYME 名稱:</span>
                          <span className="ml-2">{account.payme_name}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">FPS 電話:</span>
                          <span className="ml-2">{account.fps_phone || '未設置'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">FPS 名稱:</span>
                          <span className="ml-2">{account.fps_name || '未設置'}</span>
                        </div>
                      </div>
                      {account.notes && (
                        <div className="mt-2">
                          <span className="font-medium text-gray-700">備註:</span>
                          <span className="ml-2 text-gray-600">{account.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <InformationCircleIcon className="w-6 h-6 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">沒有找到帳戶資料</h3>
                    <p className="text-sm text-yellow-700">
                      資料庫中沒有找到任何 PAYME FPS 帳戶資料。請執行 SQL 腳本插入資料。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 原始資料 */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">原始回應資料</h4>
              <pre className="text-xs text-gray-600 overflow-auto bg-white p-3 rounded border max-h-96">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}

        {/* 使用說明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#EADBC8]">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">使用說明</h2>
            <div className="space-y-3 text-sm text-[#2B3A3B]">
              <p><strong>1. 測試 API 連接:</strong> 點擊上方按鈕測試資料庫連接</p>
              <p><strong>2. 檢查環境變數:</strong> 確保 NEXT_PUBLIC_SUPABASE_SAAS_URL 和 SUPABASE_SAAS_SERVICE_ROLE_KEY 已設置</p>
              <p><strong>3. 插入資料:</strong> 如果沒有帳戶資料，請執行 docs/quick-insert-payme-data.sql</p>
              <p><strong>4. 檢查支付頁面:</strong> 資料正確後，支付頁面應該會顯示支付資訊</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

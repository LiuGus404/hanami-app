'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParentId } from '@/hooks/useParentId';

export default function TestBindingPage() {
  const router = useRouter();
  const parentId = useParentId();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults(null);

    const results = {
      parentId: parentId,
      tests: [] as Array<{
        name: string;
        status: string;
        message: string;
      }>
    };

    try {
      // 測試 1: 檢查 parentId
      results.tests.push({
        name: '檢查用戶 ID',
        status: parentId ? 'success' : 'error',
        message: parentId ? `用戶 ID: ${parentId}` : '未獲取到用戶 ID'
      });

      // 測試 2: 測試 GET API
      try {
        const getResponse = await fetch(`/api/parent/bind-student?parentId=${parentId}`);
        const getData = await getResponse.json();

        results.tests.push({
          name: '測試 GET API',
          status: getResponse.ok ? 'success' : 'error',
          message: getResponse.ok
            ? `成功獲取 ${getData.bindings?.length || 0} 個綁定記錄`
            : `錯誤: ${getData.error || '未知錯誤'}`
        });
      } catch (error) {
        results.tests.push({
          name: '測試 GET API',
          status: 'error',
          message: `請求失敗: ${error instanceof Error ? error.message : String(error)}`
        });
      }

      // 測試 3: 測試 POST API（不實際創建）
      try {
        const postResponse = await fetch('/api/parent/bind-student', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: 'test-student-id',
            studentName: '測試學生',
            parentId: parentId
          }),
        });
        const postData = await postResponse.json();

        results.tests.push({
          name: '測試 POST API',
          status: postResponse.ok && postData?.success !== false ? 'success' : 'error',
          message: postResponse.ok && postData?.success !== false
            ? 'API 端點正常'
            : `錯誤: ${postData.error || '未知錯誤'}`
        });
      } catch (error) {
        results.tests.push({
          name: '測試 POST API',
          status: 'error',
          message: `請求失敗: ${error instanceof Error ? error.message : String(error)}`
        });
      }

    } catch (error) {
      results.tests.push({
        name: '測試執行',
        status: 'error',
        message: `測試失敗: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] p-8">
      <div className="max-w-4xl mx-auto">
        {/* 頂部導航 */}
        <div className="mb-8">
          <motion.button
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] text-[#2B3A3B] rounded-lg hover:bg-[#EBC9A4] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回首頁</span>
          </motion.button>

          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-[#4B4036]" />
            <h1 className="text-3xl font-bold text-[#4B4036]">綁定系統測試</h1>
          </div>
          <p className="text-[#2B3A3B] mt-2">檢查孩子綁定系統的資料庫連接和 API 狀態</p>
        </div>

        {/* 測試按鈕 */}
        <div className="mb-8">
          <motion.button
            onClick={runTests}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 shadow-lg font-medium disabled:opacity-50"
          >
            {loading ? '測試中...' : '開始測試'}
          </motion.button>
        </div>

        {/* 測試結果 */}
        {testResults && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#4B4036]">測試結果</h2>

            {/* 用戶信息 */}
            <div className="bg-white rounded-lg p-4 shadow-lg border border-[#EADBC8]">
              <h3 className="font-medium text-[#4B4036] mb-2">用戶信息</h3>
              <p className="text-[#2B3A3B]">
                用戶 ID: {testResults.parentId || '未獲取到'}
              </p>
            </div>

            {/* 測試項目 */}
            {testResults.tests.map((test: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-lg p-4 shadow-lg border ${getStatusColor(test.status)}`}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <h3 className="font-medium text-[#4B4036]">{test.name}</h3>
                    <p className="text-[#2B3A3B] text-sm mt-1">{test.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* 建議 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">建議</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• 如果看到「資料庫表尚未創建」錯誤，請在 Supabase 中執行 SQL 腳本</li>
                <li>• 確保在正確的 Supabase 項目（hanami-saas-system）中創建表</li>
                <li>• 檢查 Supabase 客戶端配置是否正確</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

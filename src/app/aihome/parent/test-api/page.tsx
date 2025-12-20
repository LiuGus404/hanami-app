'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParentId } from '@/hooks/useParentId';

export default function TestApiPage() {
  const router = useRouter();
  const parentId = useParentId();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runApiTest = async () => {
    setLoading(true);
    setTestResults(null);

    const results = {
      parentId: parentId,
      timestamp: new Date().toISOString(),
      tests: [] as Array<{
        name: string;
        status: string;
        message: string;
        details: any;
      }>
    };

    try {
      // 測試 1: 檢查 parentId
      results.tests.push({
        name: '檢查用戶 ID',
        status: parentId ? 'success' : 'error',
        message: parentId ? `用戶 ID: ${parentId}` : '未獲取到用戶 ID',
        details: parentId ? { userId: parentId } : null
      });

      if (!parentId) {
        setTestResults(results);
        setLoading(false);
        return;
      }

      // 測試 2: 測試 GET API
      try {
        console.log('測試 GET API...');
        const getResponse = await fetch(`/api/parent/bind-student?parentId=${parentId}`);
        const getData = await getResponse.json();

        results.tests.push({
          name: '測試 GET API',
          status: getResponse.ok ? 'success' : 'error',
          message: getResponse.ok
            ? `成功獲取 ${getData.bindings?.length || 0} 個綁定記錄`
            : `錯誤: ${getData.error || '未知錯誤'}`,
          details: {
            status: getResponse.status,
            data: getData
          }
        });
      } catch (error: any) {
        results.tests.push({
          name: '測試 GET API',
          status: 'error',
          message: `請求失敗: ${error.message}`,
          details: { error: error.message }
        });
      }

      // 測試 3: 測試 POST API（使用測試數據）
      try {
        console.log('測試 POST API...');
        const testStudentData = {
          studentId: 'test-student-' + Date.now(),
          studentName: '測試學生',
          studentOid: 'TEST' + Math.random().toString(36).substr(2, 4).toUpperCase(),
          parentId: parentId,
          institution: 'Hanami Music',
          bindingType: 'parent',
          notes: 'API 測試綁定'
        };

        const postResponse = await fetch('/api/parent/bind-student', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testStudentData),
        });
        const postData = await postResponse.json();

        results.tests.push({
          name: '測試 POST API',
          status: postResponse.ok ? 'success' : 'error',
          message: postResponse.ok
            ? 'API 端點正常，綁定成功'
            : `錯誤: ${postData.error || '未知錯誤'}`,
          details: {
            status: postResponse.status,
            data: postData,
            testData: testStudentData
          }
        });
      } catch (error: any) {
        results.tests.push({
          name: '測試 POST API',
          status: 'error',
          message: `請求失敗: ${error.message}`,
          details: { error: error.message }
        });
      }

      // 測試 4: 再次測試 GET API 查看是否有新記錄
      try {
        console.log('再次測試 GET API...');
        const getResponse2 = await fetch(`/api/parent/bind-student?parentId=${parentId}`);
        const getData2 = await getResponse2.json();

        results.tests.push({
          name: '驗證 GET API（第二次）',
          status: getResponse2.ok ? 'success' : 'error',
          message: getResponse2.ok
            ? `成功獲取 ${getData2.bindings?.length || 0} 個綁定記錄`
            : `錯誤: ${getData2.error || '未知錯誤'}`,
          details: {
            status: getResponse2.status,
            data: getData2
          }
        });
      } catch (error: any) {
        results.tests.push({
          name: '驗證 GET API（第二次）',
          status: 'error',
          message: `請求失敗: ${error.message}`,
          details: { error: error.message }
        });
      }

    } catch (error: any) {
      results.tests.push({
        name: '測試執行',
        status: 'error',
        message: `測試失敗: ${error.message}`,
        details: { error: error.message }
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
            <TestTube className="w-8 h-8 text-[#4B4036]" />
            <h1 className="text-3xl font-bold text-[#4B4036]">API 測試工具</h1>
          </div>
          <p className="text-[#2B3A3B] mt-2">測試孩子綁定 API 的完整功能</p>
        </div>

        {/* 測試按鈕 */}
        <div className="mb-8">
          <motion.button
            onClick={runApiTest}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#2B3A3B] rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 shadow-lg font-medium disabled:opacity-50"
          >
            {loading ? '測試中...' : '開始 API 測試'}
          </motion.button>
        </div>

        {/* 測試結果 */}
        {testResults && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#4B4036]">測試結果</h2>

            {/* 測試信息 */}
            <div className="bg-white rounded-lg p-4 shadow-lg border border-[#EADBC8]">
              <h3 className="font-medium text-[#4B4036] mb-2">測試信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">用戶 ID:</span>
                  <p className="text-[#2B3A3B] break-all">{testResults.parentId || '未獲取到'}</p>
                </div>
                <div>
                  <span className="font-medium">測試時間:</span>
                  <p className="text-[#2B3A3B]">{new Date(testResults.timestamp).toLocaleString()}</p>
                </div>
              </div>
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
                <div className="flex items-start space-x-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <h3 className="font-medium text-[#4B4036]">{test.name}</h3>
                    <p className="text-[#2B3A3B] text-sm mt-1">{test.message}</p>

                    {/* 詳細信息 */}
                    {test.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                          查看詳細信息
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* 總結 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">測試總結</h3>
              <div className="text-blue-700 text-sm space-y-1">
                <p>• 成功測試: {testResults.tests.filter((t: any) => t.status === 'success').length}</p>
                <p>• 失敗測試: {testResults.tests.filter((t: any) => t.status === 'error').length}</p>
                <p>• 總測試數: {testResults.tests.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

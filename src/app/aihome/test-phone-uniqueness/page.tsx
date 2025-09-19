'use client';

import { useState } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function TestPhoneUniquenessPage() {
  const { user } = useSaasAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testPhoneUniqueness = async () => {
    setLoading(true);
    setTestResults([]);

    const testPhones = [
      '+85212345678', // 測試電話1
      '+85287654321', // 測試電話2
      '+85211111111', // 測試電話3
    ];

    const results = [];

    for (const phone of testPhones) {
      try {
        // 測試註冊 API
        const response = await fetch('/api/aihome/auth/register-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
            password: 'TestPassword123!',
            nickname: `測試用戶${Date.now()}`,
            phone: phone,
          }),
        });

        const result = await response.json();
        
        results.push({
          phone,
          status: response.status,
          success: result.success,
          error: result.error,
          message: result.message,
        });

      } catch (error) {
        results.push({
          phone,
          status: 'error',
          success: false,
          error: error instanceof Error ? error.message : '未知錯誤',
        });
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  const checkExistingPhones = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // 這裡可以添加檢查現有電話號碼的邏輯
      const response = await fetch('/api/auth/add-phone-unique-constraint', {
        method: 'GET',
      });

      const result = await response.json();
      
      setTestResults([{
        action: '檢查約束狀態',
        status: response.status,
        success: result.success,
        data: result,
      }]);

    } catch (error) {
      setTestResults([{
        action: '檢查約束狀態',
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
      }]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#EBC9A4] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-6">
            電話號碼唯一性測試
          </h1>

          {user && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                當前用戶: {user.email} (ID: {user.id})
              </p>
              <p className="text-sm text-blue-700">
                電話: {user.phone || '未設置'}
              </p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <button
              onClick={testPhoneUniqueness}
              disabled={loading}
              className="px-6 py-3 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? '測試中...' : '測試電話號碼唯一性'}
            </button>

            <button
              onClick={checkExistingPhones}
              disabled={loading}
              className="px-6 py-3 bg-[#FFB6C1] hover:bg-[#EBC9A4] text-[#4B4036] font-semibold rounded-xl transition-colors disabled:opacity-50 ml-4"
            >
              {loading ? '檢查中...' : '檢查約束狀態'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-[#4B4036]">測試結果</h2>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {result.phone || result.action}
                      </p>
                      <p className="text-sm text-gray-600">
                        狀態: {result.status}
                      </p>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">
                          錯誤: {result.error}
                        </p>
                      )}
                      {result.message && (
                        <p className="text-sm text-green-600 mt-1">
                          訊息: {result.message}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        result.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {result.success ? '成功' : '失敗'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">說明</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 此頁面用於測試電話號碼唯一性檢查功能</li>
              <li>• 測試會嘗試使用相同的電話號碼註冊多個帳戶</li>
              <li>• 如果唯一性檢查正常工作，第二次使用相同電話號碼應該會失敗</li>
              <li>• 請注意：測試會創建真實的測試帳戶</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


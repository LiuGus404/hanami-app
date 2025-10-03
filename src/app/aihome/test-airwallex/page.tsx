'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import toast from 'react-hot-toast';

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  data?: any;
  error?: string;
  details?: any;
}

export default function TestAirwallexPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testAirwallexConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/aihome/payment/test-airwallex');
      const data = await response.json();
      
      setResult(data);
      
      if (data.success) {
        toast.success('Airwallex 連接測試成功！');
      } else {
        toast.error(`Airwallex 連接測試失敗: ${data.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('測試錯誤:', error);
      setResult({
        success: false,
        error: '測試請求失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      });
      toast.error('測試請求失敗');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;
    
    if (result.success) {
      return <CheckCircleIcon className="w-8 h-8 text-green-500" />;
    } else {
      return <XCircleIcon className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (!result) return 'text-gray-600';
    return result.success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* 頁面標題 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            Airwallex 連接測試
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            測試 Airwallex API 連接和認證
          </p>
        </motion.div>

        {/* 測試按鈕 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <HanamiButton
            onClick={testAirwallexConnection}
            disabled={testing}
            size="lg"
            className="flex items-center mx-auto"
          >
            {testing ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                測試中...
              </>
            ) : (
              <>
                <CreditCardIcon className="w-5 h-5 mr-2" />
                測試 Airwallex 連接
              </>
            )}
          </HanamiButton>
        </motion.div>

        {/* 測試結果 */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <HanamiCard className="p-6">
              <div className="flex items-center mb-4">
                {getStatusIcon()}
                <div className="ml-4">
                  <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
                    {result.success ? '連接成功' : '連接失敗'}
                  </h2>
                  {result.status && (
                    <p className="text-sm text-[#2B3A3B]">
                      狀態碼: {result.status} {result.statusText}
                    </p>
                  )}
                </div>
              </div>

              {result.error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-800">錯誤訊息</h3>
                      <p className="text-sm text-red-700 mt-1">{result.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 詳細資訊 */}
              <div className="space-y-4">
                {result.data && (
                  <div>
                    <h3 className="font-medium text-[#4B4036] mb-2">API 回應</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}

                {result.details && (
                  <div>
                    <h3 className="font-medium text-[#4B4036] mb-2">詳細資訊</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}

                {(result as any).request && (
                  <div>
                    <h3 className="font-medium text-[#4B4036] mb-2">請求資訊</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify((result as any).request, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </HanamiCard>
          </motion.div>
        )}

        {/* 故障排除指南 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <HanamiCard className="p-6 bg-blue-50 border border-blue-200">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-6 h-6 text-blue-500 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">故障排除指南</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 檢查 .env.local 中的 AIRWALLEX_API_KEY 和 AIRWALLEX_CLIENT_ID</li>
                  <li>• 確認 API 密鑰是否有效且未過期</li>
                  <li>• 檢查是否使用正確的 API 端點（測試 vs 生產環境）</li>
                  <li>• 確認 API 密鑰有足夠的權限創建支付意圖</li>
                  <li>• 檢查網路連接和防火牆設置</li>
                </ul>
              </div>
            </div>
          </HanamiCard>
        </motion.div>
      </div>
    </div>
  );
}

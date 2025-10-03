'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BugAntIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import toast from 'react-hot-toast';

interface DebugResult {
  success: boolean;
  envCheck?: any;
  apiKeyAnalysis?: any;
  testResults?: any[];
  recommendations?: string[];
  timestamp?: string;
  hongKongTime?: string;
  error?: string;
}

export default function DebugAirwallexPage() {
  const [debugging, setDebugging] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);

  const runDebug = async () => {
    setDebugging(true);
    setResult(null);

    try {
      const response = await fetch('/api/aihome/payment/debug-airwallex');
      const data = await response.json();
      
      setResult(data);
      
      if (data.success) {
        toast.success('找到可用的認證方式！');
      } else {
        toast.error('所有認證方式都失敗，請檢查 API 密鑰');
      }
    } catch (error) {
      console.error('診斷錯誤:', error);
      setResult({
        success: false,
        error: '診斷請求失敗'
      });
      toast.error('診斷請求失敗');
    } finally {
      setDebugging(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircleIcon className="w-5 h-5 text-green-500" /> : 
      <XCircleIcon className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* 頁面標題 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            Airwallex API 診斷工具
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            詳細診斷 Airwallex API 連接和認證問題
          </p>
        </motion.div>

        {/* 診斷按鈕 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <HanamiButton
            onClick={runDebug}
            disabled={debugging}
            size="lg"
            className="flex items-center mx-auto"
          >
            {debugging ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                診斷中...
              </>
            ) : (
              <>
                <BugAntIcon className="w-5 h-5 mr-2" />
                開始診斷
              </>
            )}
          </HanamiButton>
        </motion.div>

        {/* 診斷結果 */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* 總體狀態 */}
            <HanamiCard className="p-6">
              <div className="flex items-center mb-4">
                {getStatusIcon(result.success)}
                <div className="ml-4">
                  <h2 className={`text-xl font-semibold ${getStatusColor(result.success)}`}>
                    {result.success ? '診斷成功' : '診斷失敗'}
                  </h2>
                  {result.timestamp && (
                    <p className="text-sm text-[#2B3A3B]">
                      診斷時間: {result.hongKongTime}
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
            </HanamiCard>

            {/* 環境變數檢查 */}
            {result.envCheck && (
              <HanamiCard className="p-6">
                <h3 className="text-lg font-semibold text-[#4B4036] mb-4">環境變數檢查</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">API Key 存在:</span>
                      <span className={result.envCheck.hasApiKey ? 'text-green-600' : 'text-red-600'}>
                        {result.envCheck.hasApiKey ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">Client ID 存在:</span>
                      <span className={result.envCheck.hasClientId ? 'text-green-600' : 'text-red-600'}>
                        {result.envCheck.hasClientId ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">API URL 存在:</span>
                      <span className={result.envCheck.hasApiUrl ? 'text-green-600' : 'text-red-600'}>
                        {result.envCheck.hasApiUrl ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">API Key 長度:</span>
                      <span className="font-mono text-sm">{result.envCheck.apiKeyLength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">Client ID 長度:</span>
                      <span className="font-mono text-sm">{result.envCheck.clientIdLength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">API Key 前綴:</span>
                      <span className="font-mono text-sm">{result.envCheck.apiKeyPrefix}...</span>
                    </div>
                  </div>
                </div>
              </HanamiCard>
            )}

            {/* API 密鑰分析 */}
            {result.apiKeyAnalysis && (
              <HanamiCard className="p-6">
                <h3 className="text-lg font-semibold text-[#4B4036] mb-4">API 密鑰分析</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">包含 Bearer 前綴:</span>
                      <span className={result.apiKeyAnalysis.startsWithBearer ? 'text-red-600' : 'text-green-600'}>
                        {result.apiKeyAnalysis.startsWithBearer ? '❌ 是' : '✅ 否'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">包含空格:</span>
                      <span className={result.apiKeyAnalysis.containsSpaces ? 'text-red-600' : 'text-green-600'}>
                        {result.apiKeyAnalysis.containsSpaces ? '❌ 是' : '✅ 否'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">Base64 格式:</span>
                      <span className={result.apiKeyAnalysis.isBase64Like ? 'text-green-600' : 'text-yellow-600'}>
                        {result.apiKeyAnalysis.isBase64Like ? '✅ 是' : '⚠️ 否'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">特殊字符:</span>
                      <span className={result.apiKeyAnalysis.hasSpecialChars ? 'text-yellow-600' : 'text-green-600'}>
                        {result.apiKeyAnalysis.hasSpecialChars ? '⚠️ 有' : '✅ 無'}
                      </span>
                    </div>
                  </div>
                </div>
              </HanamiCard>
            )}

            {/* 認證方式測試結果 */}
            {result.testResults && (
              <HanamiCard className="p-6">
                <h3 className="text-lg font-semibold text-[#4B4036] mb-4">認證方式測試結果</h3>
                <div className="space-y-4">
                  {result.testResults.map((test, index) => (
                    <div key={index} className="border border-[#EADBC8] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-[#4B4036]">{test.method}</h4>
                        <div className="flex items-center">
                          {getStatusIcon(test.success)}
                          <span className={`ml-2 text-sm ${getStatusColor(test.success)}`}>
                            {test.success ? '成功' : '失敗'}
                          </span>
                        </div>
                      </div>
                      {test.status && (
                        <p className="text-sm text-[#2B3A3B] mb-2">
                          狀態: {test.status} {test.statusText}
                        </p>
                      )}
                      {test.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-[#4B4036] hover:text-[#2B3A3B]">
                            查看詳細回應
                          </summary>
                          <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </HanamiCard>
            )}

            {/* 建議 */}
            {result.recommendations && (
              <HanamiCard className="p-6 bg-blue-50 border border-blue-200">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-6 h-6 text-blue-500 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-2">診斷建議</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </HanamiCard>
            )}
          </motion.div>
        )}

        {/* 使用說明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          <HanamiCard className="p-6 bg-gray-50 border border-gray-200">
            <div className="flex items-start">
              <ClockIcon className="w-6 h-6 text-gray-500 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">診斷說明</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• 此工具會測試多種 Airwallex API 認證方式</li>
                  <li>• 檢查環境變數和 API 密鑰格式</li>
                  <li>• 提供詳細的錯誤分析和解決建議</li>
                  <li>• 如果所有方式都失敗，請聯繫 Airwallex 技術支援</li>
                </ul>
              </div>
            </div>
          </HanamiCard>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { motion } from 'framer-motion';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface ValidationData {
  validation: ValidationResult;
  report: string;
  timestamp: string;
}

export default function TypeValidationPage() {
  const [validationData, setValidationData] = useState<ValidationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runValidation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/validate-types', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setValidationData(result.data);
      } else {
        setError(result.error?.message || '驗證失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '驗證過程中發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!validationData?.report) return;
    
    const blob = new Blob([validationData.report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hanamiecho-type-validation-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎯 HanamiEcho 型別驗證
          </h1>
          <p className="text-lg text-gray-600">
            驗證 TypeScript 型別定義與實際資料庫結構的一致性
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 控制面板 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <HanamiCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                🔧 驗證控制
              </h2>
              
              <div className="space-y-4">
                <HanamiButton
                  onClick={runValidation}
                  disabled={loading}
                  className="w-full"
                  variant="primary"
                >
                  {loading ? '驗證中...' : '🚀 開始驗證'}
                </HanamiButton>
                
                {validationData && (
                  <HanamiButton
                    onClick={downloadReport}
                    variant="secondary"
                    className="w-full"
                  >
                    📥 下載報告
                  </HanamiButton>
                )}
              </div>
              
              {validationData && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">驗證資訊</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>驗證時間: {new Date(validationData.timestamp).toLocaleString()}</p>
                    <p>狀態: {validationData.validation.isValid ? '✅ 通過' : '❌ 失敗'}</p>
                    <p>錯誤: {validationData.validation.errors.length}</p>
                    <p>警告: {validationData.validation.warnings.length}</p>
                    <p>建議: {validationData.validation.suggestions.length}</p>
                  </div>
                </div>
              )}
            </HanamiCard>
          </motion.div>

          {/* 驗證結果 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <HanamiCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📊 驗證結果
              </h2>
              
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-gray-600">正在驗證型別定義...</span>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-red-800 font-semibold mb-2">❌ 驗證錯誤</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              )}
              
              {validationData && !loading && (
                <div className="space-y-6">
                  {/* 整體狀態 */}
                  <div className={`p-4 rounded-lg ${
                    validationData.validation.isValid 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <h3 className={`font-semibold mb-2 ${
                      validationData.validation.isValid ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {validationData.validation.isValid ? '✅ 驗證通過' : '❌ 驗證失敗'}
                    </h3>
                    <p className={`text-sm ${
                      validationData.validation.isValid ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {validationData.validation.isValid 
                        ? '所有型別定義都與資料庫結構一致'
                        : '發現型別定義與資料庫結構不一致的問題'
                      }
                    </p>
                  </div>
                  
                  {/* 錯誤列表 */}
                  {validationData.validation.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="text-red-800 font-semibold mb-3">
                        ❌ 錯誤 ({validationData.validation.errors.length})
                      </h3>
                      <ul className="space-y-2">
                        {validationData.validation.errors.map((error, index) => (
                          <li key={index} className="text-red-700 text-sm flex items-start">
                            <span className="mr-2">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* 警告列表 */}
                  {validationData.validation.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-yellow-800 font-semibold mb-3">
                        ⚠️ 警告 ({validationData.validation.warnings.length})
                      </h3>
                      <ul className="space-y-2">
                        {validationData.validation.warnings.map((warning, index) => (
                          <li key={index} className="text-yellow-700 text-sm flex items-start">
                            <span className="mr-2">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* 建議列表 */}
                  {validationData.validation.suggestions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-blue-800 font-semibold mb-3">
                        💡 建議 ({validationData.validation.suggestions.length})
                      </h3>
                      <ul className="space-y-2">
                        {validationData.validation.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-blue-700 text-sm flex items-start">
                            <span className="mr-2">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* 成功訊息 */}
                  {validationData.validation.isValid && 
                   validationData.validation.errors.length === 0 && 
                   validationData.validation.warnings.length === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-green-800 font-semibold mb-2">
                        🎉 完美！
                      </h3>
                      <p className="text-green-700 text-sm">
                        所有型別定義都與資料庫結構完全一致，沒有發現任何問題。
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {!validationData && !loading && !error && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    準備開始驗證
                  </h3>
                  <p className="text-gray-500">
                    點擊「開始驗證」按鈕來檢查型別定義與資料庫結構的一致性
                  </p>
                </div>
              )}
            </HanamiCard>
          </motion.div>
        </div>
        
        {/* 詳細報告 */}
        {validationData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6"
          >
            <HanamiCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📋 詳細報告
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {validationData.report}
                </pre>
              </div>
            </HanamiCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}



'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PhoneIcon, 
  LinkIcon, 
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { PaymentInfo } from '@/types/payme-fps';
import { getPrimaryPaymeFpsAccount, formatPaymePhone, generatePaymePaymentInstructions } from '@/lib/paymeFpsUtils';

export default function TestPaymentInfoPage() {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadPaymentInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 測試不同的機構名稱
      const institutions = ['Hanami Music Academy', 'HanamiEcho', 'Hanami'];
      
      for (const institution of institutions) {
        console.log(`嘗試載入機構: ${institution}`);
        const info = await getPrimaryPaymeFpsAccount(institution);
        if (info) {
          console.log(`找到 ${institution} 的支付資訊:`, info);
          setPaymentInfo(info);
          return;
        }
      }
      
      setError('未找到任何支付帳戶資訊');
    } catch (err) {
      console.error('載入支付資訊失敗:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentInfo();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('複製失敗:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-4">支付資訊測試頁面</h1>
          <p className="text-[#2B3A3B]">測試 PAYME FPS 帳戶資訊載入和顯示</p>
          
          <motion.button
            onClick={loadPaymentInfo}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4 flex items-center space-x-2 px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg font-semibold hover:bg-[#FFD59A]/80 transition-colors mx-auto"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>重新載入</span>
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
            <p className="text-[#4B4036]">載入支付資訊中...</p>
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
                <h3 className="font-semibold text-red-800">載入失敗</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 支付資訊顯示 */}
        {paymentInfo && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 成功狀態 */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">支付資訊載入成功</h3>
                  <p className="text-sm text-green-700">已成功獲取 PAYME FPS 帳戶資訊</p>
                </div>
              </div>
            </div>

            {/* 支付資訊卡片 */}
            <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm">
              <h3 className="text-lg font-bold text-[#4B4036] mb-4 flex items-center">
                <PhoneIcon className="w-5 h-5 mr-2 text-green-600" />
                PAYME FPS 支付資訊
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* PAYME 資訊 */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-3">PAYME 帳戶</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">電話號碼:</span>
                      <span className="font-mono text-sm font-medium">{formatPaymePhone(paymentInfo.payme_phone)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">收款人:</span>
                      <span className="text-sm font-medium">{paymentInfo.payme_name}</span>
                    </div>
                    {paymentInfo.payme_link && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">支付連結:</span>
                        <a
                          href={paymentInfo.payme_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center"
                        >
                          <LinkIcon className="w-4 h-4 mr-1" />
                          開啟
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* FPS 資訊 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">FPS 轉數快</h4>
                  {paymentInfo.fps_phone ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">電話號碼:</span>
                        <span className="font-mono text-sm font-medium">{formatPaymePhone(paymentInfo.fps_phone)}</span>
                      </div>
                      {paymentInfo.fps_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">收款人:</span>
                          <span className="text-sm font-medium">{paymentInfo.fps_name}</span>
                        </div>
                      )}
                      {paymentInfo.fps_link && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">支付連結:</span>
                          <a
                            href={paymentInfo.fps_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center"
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            開啟
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">未設置 FPS 帳戶</p>
                  )}
                </div>
              </div>

              {paymentInfo.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">備註:</span> {paymentInfo.notes}
                  </p>
                </div>
              )}

              {/* 複製支付說明按鈕 */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => copyToClipboard(generatePaymePaymentInstructions(paymentInfo))}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg text-sm font-medium hover:bg-[#FFD59A]/80 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>已複製支付說明</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>複製支付說明</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 支付說明預覽 */}
            <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-4 border border-[#EADBC8]">
              <h4 className="font-semibold text-[#4B4036] mb-3">支付說明預覽</h4>
              <div className="bg-white rounded-lg p-4 border border-[#EADBC8]">
                <pre className="text-sm text-[#2B3A3B]/70 whitespace-pre-wrap font-mono">
                  {generatePaymePaymentInstructions(paymentInfo)}
                </pre>
              </div>
            </div>

            {/* 原始資料顯示 */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">原始資料</h4>
              <pre className="text-xs text-gray-600 overflow-auto bg-white p-3 rounded border">
                {JSON.stringify(paymentInfo, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}

        {/* 調試資訊 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#EADBC8]">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">調試資訊</h2>
            <div className="space-y-3 text-sm text-[#2B3A3B]">
              <p><strong>API 端點:</strong> /api/admin/payme-fps-accounts</p>
              <p><strong>查詢參數:</strong> institution_name, active_only=true</p>
              <p><strong>載入狀態:</strong> {loading ? '載入中' : '已完成'}</p>
              <p><strong>錯誤狀態:</strong> {error || '無錯誤'}</p>
              <p><strong>支付資訊狀態:</strong> {paymentInfo ? '已載入' : '未載入'}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

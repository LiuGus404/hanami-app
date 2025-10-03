'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { getPrimaryPaymeFpsAccount, formatPaymePhone } from '@/lib/paymeFpsUtils';
import { PaymentInfo } from '@/types/payme-fps';

export default function TestPaymentInfoDisplayPage() {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  useEffect(() => {
    const loadPaymentInfo = async () => {
      try {
        console.log('🔄 開始載入支付資訊...');
        const info = await getPrimaryPaymeFpsAccount();
        console.log('📋 載入的支付資訊:', info);
        setPaymentInfo(info);
      } catch (error) {
        console.error('❌ 載入支付資訊失敗:', error);
        setError('載入支付資訊失敗');
        // 使用備用資料
        const fallbackInfo: PaymentInfo = {
          payme_phone: '+852-92570768',
          payme_name: 'HanamiEcho',
          payme_link: 'https://payme.hsbc/hanamiecho',
          fps_phone: '+852-98271410',
          fps_name: 'Hanami Music Ltd',
          fps_link: undefined,
          notes: 'HanamiEcho支付帳戶'
        };
        console.log('📋 使用備用支付資訊:', fallbackInfo);
        setPaymentInfo(fallbackInfo);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentInfo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/10 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-lg border border-[#EADBC8]">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A]"></div>
              <span className="ml-2 text-[#4B4036]">載入支付資訊中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/10 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-[#EADBC8]">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6 text-center">
            支付資訊顯示測試
          </h1>

          <div className="space-y-6">
            {/* 支付方法選擇 */}
            <div>
              <h2 className="text-lg font-semibold text-[#4B4036] mb-4">選擇支付方法</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMethod('screenshot')}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    selectedMethod === 'screenshot'
                      ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 shadow-lg'
                      : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600">
                      <CameraIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-[#4B4036] mb-1">上傳付款截圖</h3>
                      <div className="text-sm text-[#2B3A3B]/70">
                        上傳您的PAYME和FPS付款截圖<br />
                        我們將在1工作天內確認付款
                      </div>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMethod('airwallex')}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    selectedMethod === 'airwallex'
                      ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 shadow-lg'
                      : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                      <CreditCardIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-[#4B4036] mb-1">Airwallex 線上支付</h3>
                      <div className="text-sm text-[#2B3A3B]/70">
                        支援信用卡、轉數快、Alipay、WeChat Pay等支付方法<br />
                        手續費為1.5%
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* 支付資訊顯示區域 */}
            {selectedMethod === 'screenshot' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* 支付資訊顯示 */}
                {paymentInfo ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm"
                  >
                    <h3 className="text-lg font-bold text-[#4B4036] mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
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
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
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
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">收款人:</span>
                              <span className="text-sm font-medium">{paymentInfo.fps_name}</span>
                            </div>
                            {paymentInfo.fps_link && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">支付連結:</span>
                                <a
                                  href={paymentInfo.fps_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  開啟
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">暫無 FPS 帳戶資訊</p>
                        )}
                      </div>
                    </div>

                    {/* 備註 */}
                    {paymentInfo.notes && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h5 className="font-semibold text-yellow-800 mb-1">備註</h5>
                        <p className="text-sm text-yellow-700">{paymentInfo.notes}</p>
                      </div>
                    )}

                  </motion.div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <XCircleIcon className="w-5 h-5 text-red-500" />
                      <span className="text-red-700">{error}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600">載入支付資訊中...</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Airwallex 支付資訊 */}
            {selectedMethod === 'airwallex' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm"
              >
                <h3 className="text-lg font-bold text-[#4B4036] mb-4 flex items-center">
                  <CreditCardIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Airwallex 線上支付
                </h3>
                <p className="text-[#2B3A3B] mb-4">
                  支援信用卡、轉數快、Alipay、WeChat Pay等支付方法，手續費為1.5%
                </p>
                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-md transition-all duration-200">
                  前往支付
                </button>
              </motion.div>
            )}

            {/* 調試資訊 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">調試資訊</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>選擇的支付方法:</strong> {selectedMethod || '未選擇'}</p>
                <p><strong>支付資訊載入狀態:</strong> {loading ? '載入中' : paymentInfo ? '已載入' : '載入失敗'}</p>
                <p><strong>錯誤訊息:</strong> {error || '無'}</p>
                {paymentInfo && (
                  <div>
                    <p><strong>支付資訊詳情:</strong></p>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(paymentInfo, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

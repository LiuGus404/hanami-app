'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

export default function TestPaymentFlowPage() {
  const { user, loading } = useSaasAuth();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentData, setPaymentData] = useState<any>(null);

  const handlePaymentSuccess = (data: any) => {
    console.log('🎉 支付成功回調被調用:', data);
    setPaymentStatus('success');
    setPaymentData(data);
    
    // 模擬跳轉到確認提交頁面
    setTimeout(() => {
      alert('🎉 支付成功！現在應該跳轉到確認提交頁面');
    }, 1000);
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ 支付錯誤:', error);
    setPaymentStatus('error');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#4B4036] mb-4">請先登入</h1>
          <p className="text-[#2B3A3B]">您需要登入才能測試支付流程</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-4">支付流程測試</h1>
          <p className="text-[#2B3A3B]">測試支付成功後是否會正確跳轉到確認提交頁面</p>
        </div>

        {/* 支付狀態指示器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#EADBC8]">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">支付狀態</h2>
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                paymentStatus === 'idle' ? 'bg-gray-100 text-gray-600' :
                paymentStatus === 'processing' ? 'bg-blue-100 text-blue-600' :
                paymentStatus === 'success' ? 'bg-green-100 text-green-600' :
                'bg-red-100 text-red-600'
              }`}>
                {paymentStatus === 'idle' && <div className="w-4 h-4 bg-gray-400 rounded-full"></div>}
                {paymentStatus === 'processing' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
                {paymentStatus === 'success' && <CheckCircleIcon className="w-5 h-5" />}
                {paymentStatus === 'error' && <XCircleIcon className="w-5 h-5" />}
                <span className="font-medium">
                  {paymentStatus === 'idle' && '等待支付'}
                  {paymentStatus === 'processing' && '處理中...'}
                  {paymentStatus === 'success' && '支付成功'}
                  {paymentStatus === 'error' && '支付失敗'}
                </span>
              </div>
            </div>
            
            {paymentData && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">支付成功資料：</h3>
                <pre className="text-sm text-green-700 overflow-auto">
                  {JSON.stringify(paymentData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </motion.div>

        {/* 支付方法選擇器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
            amount={168}
            currency="HKD"
            description="測試支付流程 - 試堂報名"
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            user={user}
          />
        </motion.div>

        {/* 測試說明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg border border-[#EADBC8]">
            <h2 className="text-xl font-bold text-[#4B4036] mb-4">測試說明</h2>
            <div className="space-y-3 text-[#2B3A3B]">
              <p>1. 選擇「Airwallex 線上支付」</p>
              <p>2. 點擊「在新視窗中打開 Airwallex 支付」</p>
              <p>3. 在新視窗中完成支付（或取消）</p>
              <p>4. 支付成功後，新視窗會自動關閉</p>
              <p>5. 主頁面會收到支付成功的消息</p>
              <p>6. 狀態會變為「支付成功」並顯示支付資料</p>
              <p>7. 會彈出確認消息，模擬跳轉到確認提交頁面</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function TestPaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const payment_intent_id = searchParams.get('payment_intent_id');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');

    if (payment_intent_id && amount && currency) {
      setPaymentData({
        payment_intent_id,
        amount: parseFloat(amount),
        currency,
        status: 'succeeded'
      });
    }
    setIsLoading(false);
  }, [searchParams]);

  const handlePaymentSuccess = () => {
    // 發送消息給父窗口
    if (window.opener) {
      window.opener.postMessage({
        type: 'PAYMENT_SUCCESS',
        payment_intent_id: paymentData?.payment_intent_id,
        status: 'succeeded',
        amount: paymentData?.amount,
        currency: paymentData?.currency,
        message: '測試支付成功'
      }, window.location.origin);
    }
    window.close();
  };

  const handlePaymentCancel = () => {
    // 發送消息給父窗口
    if (window.opener) {
      window.opener.postMessage({
        type: 'PAYMENT_CANCELLED',
        message: '支付已取消'
      }, window.location.origin);
    }
    window.close();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-[#4B4036] mb-2">
            測試支付頁面
          </h1>
          
          <p className="text-[#2B3A3B] mb-6">
            這是 Airwallex 支付的測試模式頁面
          </p>
        </div>

        {paymentData && (
          <div className="bg-[#FFF9F2] rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-[#4B4036] mb-3">支付詳情</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#2B3A3B]">支付 ID:</span>
                <span className="font-mono text-[#4B4036]">{paymentData.payment_intent_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B3A3B]">金額:</span>
                <span className="font-semibold text-[#4B4036]">
                  {paymentData.currency.toUpperCase()} {paymentData.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B3A3B]">狀態:</span>
                <span className="text-green-600 font-semibold">測試模式</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePaymentSuccess}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg"
          >
            模擬支付成功
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePaymentCancel}
            className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-gray-500 hover:to-gray-600 transition-all duration-200 shadow-lg"
          >
            取消支付
          </motion.button>
        </div>

        <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-800 text-center">
            <strong>注意：</strong>這是測試模式，不會產生真實的支付交易
          </p>
        </div>
      </motion.div>
    </div>
  );
}
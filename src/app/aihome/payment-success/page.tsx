'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    // 從 URL 參數中獲取支付信息
    const paymentIntentId = searchParams.get('payment_intent');
    const status = searchParams.get('status');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    
    if (paymentIntentId) {
      setPaymentData({
        payment_intent_id: paymentIntentId,
        status: status || 'succeeded',
        amount: amount,
        currency: currency
      });
      
      // 通知父窗口支付成功（如果在彈窗中）
      if (window.opener) {
        console.log('🔔 通知父視窗支付成功');
        window.opener.postMessage({
          type: 'PAYMENT_SUCCESS',
          success: true,
          payment_intent_id: paymentIntentId,
          status: status || 'succeeded',
          amount: parseFloat(amount || '0'),
          currency: currency,
          message: '支付成功！'
        }, window.location.origin);
        
        // 延遲關閉視窗，確保消息已發送
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    }
  }, [searchParams]);

  const handleClose = () => {
    if (window.opener) {
      // 如果在彈窗中，關閉視窗
      window.close();
    } else {
      // 如果不在彈窗中，跳轉到定價頁面
      router.push('/aihome/pricing');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full"
      >
        <div className="mb-6 flex justify-center">
          <CheckCircleIcon className="h-24 w-24 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          支付成功！
        </h1>
        
        {paymentData && (
          <div className="space-y-2 mb-6">
            <p className="text-gray-600">
              支付意圖 ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{paymentData.payment_intent_id}</span>
            </p>
            {paymentData.amount && paymentData.currency && (
              <p className="text-gray-600">
                金額: <span className="font-semibold">{paymentData.currency} {paymentData.amount}</span>
              </p>
            )}
            <p className="text-gray-600">
              狀態: <span className="font-semibold text-green-600">{paymentData.status}</span>
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClose}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 shadow-md"
          >
            完成
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/aihome/pricing')}
            className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200 shadow-md"
          >
            返回定價頁面
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
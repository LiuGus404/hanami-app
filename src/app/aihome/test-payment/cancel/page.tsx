'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PaymentCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 通知父視窗支付取消
    if (window.opener) {
      window.opener.postMessage({
        type: 'PAYMENT_CANCELLED',
        data: {
          payment_intent_id: searchParams.get('payment_intent_id'),
          status: 'cancelled'
        }
      }, window.location.origin);
      
      // 3秒後自動關閉視窗
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircleIcon className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-[#4B4036] mb-4">
          支付已取消
        </h1>
        
        <p className="text-[#2B3A3B] mb-6">
          您的付款已被取消，您可以稍後重新嘗試支付。
        </p>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-orange-800">
            如果您需要幫助，請聯繫我們的客服團隊。
          </p>
        </div>

        <div className="space-y-3">
          <motion.button
            onClick={() => window.close()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            關閉視窗
          </motion.button>
          
          <motion.button
            onClick={() => router.push('/aihome/dashboard')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-6 bg-white text-[#4B4036] border-2 border-[#EADBC8] rounded-xl font-bold hover:border-[#FFD59A] transition-all duration-200"
          >
            返回儀表板
          </motion.button>
        </div>

        <p className="text-xs text-[#2B3A3B]/70 mt-4">
          視窗將在 3 秒後自動關閉
        </p>
      </motion.div>
    </div>
  );
}
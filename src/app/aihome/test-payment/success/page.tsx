'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  CheckCircleIcon,
  ArrowLeftIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 從 URL 參數獲取付款資訊
    const payment_intent_id = searchParams.get('payment_intent_id');
    const status = searchParams.get('status');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');

    if (payment_intent_id) {
      setPaymentDetails({
        payment_intent_id,
        status,
        amount,
        currency
      });
    }
    
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] py-12">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* 成功圖標 */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
              付款成功！
            </h1>
            <p className="text-lg text-[#2B3A3B]">
              感謝您的付款，我們已收到您的付款
            </p>
          </div>

          {/* 付款詳情 */}
          {paymentDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <HanamiCard className="p-6">
                <h2 className="text-xl font-semibold text-[#4B4036] mb-4">
                  付款詳情
                </h2>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-[#2B3A3B]">付款 ID:</span>
                    <span className="font-mono text-sm text-[#4B4036]">
                      {paymentDetails.payment_intent_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#2B3A3B]">狀態:</span>
                    <span className="text-[#10B981] font-medium">
                      {paymentDetails.status === 'succeeded' ? '成功' : paymentDetails.status}
                    </span>
                  </div>
                  {paymentDetails.amount && (
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">金額:</span>
                      <span className="font-semibold text-[#4B4036]">
                        {paymentDetails.currency} {paymentDetails.amount}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#2B3A3B]">付款時間:</span>
                    <span className="text-[#4B4036]">
                      {new Date().toLocaleString('zh-TW')}
                    </span>
                  </div>
                </div>
              </HanamiCard>
            </motion.div>
          )}

          {/* 後續步驟 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <HanamiCard className="p-6 bg-[#E0F2E0] border border-[#10B981]">
              <h3 className="text-lg font-semibold text-[#4B4036] mb-3">
                後續步驟
              </h3>
              <ul className="text-left text-[#2B3A3B] space-y-2">
                <li>• 我們將在 1-2 個工作天內處理您的付款</li>
                <li>• 您將收到付款確認郵件</li>
                <li>• 如有任何問題，請聯繫我們的客服</li>
                <li>• 付款記錄已保存在您的帳戶中</li>
              </ul>
            </HanamiCard>
          </motion.div>

          {/* 操作按鈕 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <HanamiButton
              onClick={() => router.push('/aihome/dashboard')}
              size="lg"
              className="flex items-center"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              返回儀表板
            </HanamiButton>
            <HanamiButton
              onClick={() => router.push('/aihome/test-payment')}
              variant="secondary"
              size="lg"
              className="flex items-center"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              再次測試
            </HanamiButton>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}


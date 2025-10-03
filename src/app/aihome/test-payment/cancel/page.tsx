'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  XCircleIcon,
  ArrowLeftIcon,
  HomeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 從 URL 參數獲取付款資訊
    const payment_intent_id = searchParams.get('payment_intent_id');
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (payment_intent_id) {
      setPaymentDetails({
        payment_intent_id,
        status,
        error
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
          {/* 取消圖標 */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-[#EF4444] rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
              付款已取消
            </h1>
            <p className="text-lg text-[#2B3A3B]">
              您的付款已被取消，沒有產生任何費用
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
                    <span className="text-[#EF4444] font-medium">
                      已取消
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#2B3A3B]">取消時間:</span>
                    <span className="text-[#4B4036]">
                      {new Date().toLocaleString('zh-TW')}
                    </span>
                  </div>
                  {paymentDetails.error && (
                    <div className="flex justify-between">
                      <span className="text-[#2B3A3B]">錯誤訊息:</span>
                      <span className="text-[#EF4444] text-sm">
                        {paymentDetails.error}
                      </span>
                    </div>
                  )}
                </div>
              </HanamiCard>
            </motion.div>
          )}

          {/* 取消原因說明 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <HanamiCard className="p-6 bg-[#FFE0E0] border border-[#EF4444]">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-6 h-6 text-[#EF4444] mr-3 mt-1" />
                <div className="text-left">
                  <h3 className="font-semibold text-[#EF4444] mb-2">
                    付款取消原因
                  </h3>
                  <ul className="text-sm text-[#2B3A3B] space-y-1">
                    <li>• 您主動取消了付款流程</li>
                    <li>• 付款過程中發生錯誤</li>
                    <li>• 網路連線問題導致付款中斷</li>
                    <li>• 付款方式驗證失敗</li>
                  </ul>
                </div>
              </div>
            </HanamiCard>
          </motion.div>

          {/* 後續步驟 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-8"
          >
            <HanamiCard className="p-6">
              <h3 className="text-lg font-semibold text-[#4B4036] mb-3">
                您可以：
              </h3>
              <ul className="text-left text-[#2B3A3B] space-y-2">
                <li>• 重新嘗試付款</li>
                <li>• 選擇其他付款方式</li>
                <li>• 聯繫客服尋求協助</li>
                <li>• 稍後再試</li>
              </ul>
            </HanamiCard>
          </motion.div>

          {/* 操作按鈕 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <HanamiButton
              onClick={() => router.push('/aihome/test-payment')}
              size="lg"
              className="flex items-center"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              重新付款
            </HanamiButton>
            <HanamiButton
              onClick={() => router.push('/aihome/dashboard')}
              variant="secondary"
              size="lg"
              className="flex items-center"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              返回儀表板
            </HanamiButton>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}


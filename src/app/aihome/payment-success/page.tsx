'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import HanamiEchoLogo from '@/components/ui/HanamiEchoLogo';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoaded, setIsLoaded] = useState(false);

  const paymentIntent = searchParams.get('payment_intent');
  const planName = searchParams.get('plan_name');
  const amount = searchParams.get('amount');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
    }).format(numPrice);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isLoaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <HanamiEchoLogo size="lg" />
        </div>

        <HanamiCard className="p-8 text-center">
          {/* 成功圖標 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={isLoaded ? { scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckIcon className="w-10 h-10 text-green-600" />
          </motion.div>

          {/* 成功標題 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-2xl font-bold text-[#4B4036] mb-4"
          >
            支付成功！
          </motion.h1>

          {/* 成功描述 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-[#2B3A3B] mb-6"
          >
            感謝您的訂閱！您的 AIHome 服務已激活
          </motion.p>

          {/* 訂閱詳情 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-[#FFF9F2] rounded-lg p-4 mb-6"
          >
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#4B4036]">方案：</span>
                <span className="font-medium text-[#2B3A3B]">
                  {planName || 'AIHome 方案'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4B4036]">金額：</span>
                <span className="font-medium text-[#2B3A3B]">
                  {amount ? formatPrice(amount) : 'HKD 0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4B4036]">狀態：</span>
                <span className="font-medium text-green-600">已激活</span>
              </div>
            </div>
          </motion.div>

          {/* 操作按鈕 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-3"
          >
            <HanamiButton
              onClick={() => router.push('/aihome/dashboard')}
              className="w-full"
              size="lg"
            >
              進入儀表板
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </HanamiButton>
            
            <HanamiButton
              onClick={() => router.push('/aihome/subscription')}
              variant="secondary"
              className="w-full"
            >
              查看訂閱詳情
            </HanamiButton>
          </motion.div>

          {/* 額外信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isLoaded ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-6 pt-6 border-t border-[#EADBC8]"
          >
            <p className="text-sm text-[#2B3A3B]">
              我們已向您的郵箱發送訂閱確認信
            </p>
            {paymentIntent && (
              <p className="text-xs text-[#4B4036] mt-2">
                支付 ID: {paymentIntent}
              </p>
            )}
          </motion.div>
        </HanamiCard>
      </motion.div>
    </div>
  );
}

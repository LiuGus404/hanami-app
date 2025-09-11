'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  CreditCardIcon,
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import HanamiEchoLogo from '@/components/ui/HanamiEchoLogo';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

export default function SubscriptionPage() {
  const { user, loading } = useSaasAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/aihome/api/subscriptions/simple?userId=${user.id}`);
        const data = await response.json();

        if (data.success) {
          setSubscription(data.data.subscription);
          setUsageStats(data.data.usageStats);
        }
      } catch (error) {
        console.error('獲取訂閱信息失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/aihome/auth/login');
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-HK');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      {/* 導航欄 */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <HanamiEchoLogo size="lg" />
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/aihome/dashboard')}
              className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
            >
              儀表板
            </button>
            <button
              onClick={() => router.push('/aihome/pricing')}
              className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
            >
              定價方案
            </button>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 標題 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#4B4036] mb-2">
              訂閱管理
            </h1>
            <p className="text-[#2B3A3B]">
              管理您的 AIHome 訂閱和使用情況
            </p>
          </motion.div>

          {subscription ? (
            <div className="space-y-6">
              {/* 當前訂閱 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <HanamiCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-[#4B4036]">
                      當前訂閱
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscription.status === 'active' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {subscription.status === 'active' ? '已激活' : '試用中'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-[#4B4036] mb-1">方案名稱</p>
                      <p className="text-lg font-semibold text-[#2B3A3B]">
                        {subscription.saas_subscription_plans?.plan_name || '未知方案'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#4B4036] mb-1">計費週期</p>
                      <p className="text-lg font-semibold text-[#2B3A3B]">
                        {subscription.billing_cycle === 'monthly' ? '月付' : '年付'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#4B4036] mb-1">開始日期</p>
                      <p className="text-[#2B3A3B]">
                        {formatDate(subscription.start_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#4B4036] mb-1">結束日期</p>
                      <p className="text-[#2B3A3B]">
                        {formatDate(subscription.end_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <HanamiButton
                      onClick={() => router.push('/aihome/pricing')}
                      variant="secondary"
                    >
                      升級方案
                    </HanamiButton>
                    <HanamiButton
                      onClick={() => router.push('/aihome/dashboard')}
                    >
                      返回儀表板
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </HanamiButton>
                  </div>
                </HanamiCard>
              </motion.div>

              {/* 方案功能 */}
              {subscription.saas_subscription_plans?.features && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <HanamiCard className="p-6">
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-4">
                      方案功能
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(subscription.saas_subscription_plans.features).map(([feature, enabled]) => (
                        <div key={feature} className="flex items-center space-x-3">
                          {enabled ? (
                            <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XMarkIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${enabled ? 'text-[#2B3A3B]' : 'text-gray-500'}`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </HanamiCard>
                </motion.div>
              )}

              {/* 使用統計 */}
              {usageStats.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <HanamiCard className="p-6">
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-4">
                      使用統計
                    </h3>
                    <div className="space-y-3">
                      {usageStats.map((stat, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-[#FFF9F2] rounded-lg">
                          <span className="text-[#4B4036] font-medium">
                            {stat.usage_type}
                          </span>
                          <span className="text-[#2B3A3B]">
                            {stat.current_period_usage || 0} / {stat.total_usage || '∞'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </HanamiCard>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <HanamiCard className="p-8">
                <CreditCardIcon className="w-16 h-16 text-[#4B4036] mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-[#4B4036] mb-2">
                  還沒有訂閱
                </h2>
                <p className="text-[#2B3A3B] mb-6">
                  選擇一個方案開始您的 AIHome 之旅
                </p>
                <HanamiButton
                  onClick={() => router.push('/aihome/pricing')}
                  size="lg"
                >
                  查看方案
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </HanamiButton>
              </HanamiCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

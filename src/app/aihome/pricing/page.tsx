'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  CheckIcon,
  StarIcon,
  SparklesIcon,
  UserGroupIcon,
  AcademicCapIcon,
  HeartIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import HanamiEchoLogo from '@/components/ui/HanamiEchoLogo';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { PaymentModal } from '@/components/saas/payment/PaymentModal';

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_description: string;
  plan_type: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_children: number;
  max_ai_interactions: number;
  max_storage_mb: number;
  max_lesson_plans: number;
  max_memory_entries: number;
  features: Record<string, boolean>;
  is_active: boolean;
  is_popular: boolean;
}

export default function PricingPage() {
  const { user, loading } = useSaasAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);

  // 調試支付模態框狀態
  useEffect(() => {
    console.log('🔄 支付模態框狀態更新:');
    console.log('  - showPaymentModal:', showPaymentModal);
    console.log('  - currentPlan:', currentPlan);
  }, [showPaymentModal, currentPlan]);

  // 獲取訂閱計劃
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/aihome/api/subscription-plans');
        const data = await response.json();
        
        if (data.success) {
          setPlans(data.data);
        } else {
          setError(data.error || '獲取訂閱計劃失敗');
        }
      } catch (error) {
        console.error('獲取訂閱計劃錯誤:', error);
        setError('獲取訂閱計劃失敗');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // 處理訂閱
  const handleSubscribe = async (planId: string) => {
    console.log('🎯 點擊訂閱按鈕，方案ID:', planId);
    console.log('👤 用戶狀態:', user);
    console.log('📋 方案列表:', plans);
    
    if (!user) {
      console.log('❌ 用戶未登入，跳轉到登入頁面');
      router.push('/aihome/auth/login');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    console.log('🔍 找到的方案:', plan);
    
    if (!plan) {
      console.log('❌ 找不到方案');
      return;
    }

    // 檢查用戶是否已有訂閱
    try {
      const response = await fetch(`/aihome/api/subscriptions/simple?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success && data.data.subscription) {
        const currentSubscription = data.data.subscription;
        console.log('📋 用戶現有訂閱:', currentSubscription);
        
        // 如果用戶已有相同方案的訂閱，提示升級
        if (currentSubscription.plan_id === planId) {
          console.log('⚠️ 用戶已有相同方案訂閱');
          alert('您已經訂閱了此方案！');
          return;
        }
        
        // 如果用戶有不同方案的訂閱，允許升級
        console.log('🔄 用戶將升級到新方案');
      }
    } catch (error) {
      console.log('⚠️ 檢查訂閱狀態失敗，繼續支付流程:', error);
    }

    console.log('✅ 設置當前方案和打開支付模態框');
    setCurrentPlan(plan);
    setShowPaymentModal(true);
  };

  // 處理支付成功
  const handlePaymentSuccess = (subscription: any) => {
    setShowPaymentModal(false);
    setCurrentPlan(null);
    router.push('/aihome/subscription');
  };

  // 格式化價格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
    }).format(price);
  };

  // 計算年付折扣
  const getYearlyDiscount = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyTotal = monthlyPrice * 12;
    const discount = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
    return Math.round(discount);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      {/* 導航欄 */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <HanamiEchoLogo size="lg" />
          
          <div className="flex items-center space-x-4">
            {user ? (
              <button
                onClick={() => router.push('/aihome/dashboard')}
                className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
              >
                儀表板
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/aihome/auth/login')}
                  className="text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                >
                  登入
                </button>
                <button
                  onClick={() => router.push('/aihome/auth/register')}
                  className="bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#2B3A3B] px-6 py-2 rounded-full font-medium transition-colors"
                >
                  開始使用
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* 標題區域 */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-[#4B4036] mb-4"
            >
              選擇您的 AIHome 方案
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-[#2B3A3B] mb-8 max-w-2xl mx-auto"
            >
              為您的家庭選擇最適合的智能教育方案
            </motion.p>

            {/* 計費週期切換 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center space-x-4 mb-8"
            >
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-[#4B4036]' : 'text-[#2B3A3B]'}`}>
                月付
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#EADBC8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-[#4B4036]' : 'text-[#2B3A3B]'}`}>
                年付
              </span>
              {billingCycle === 'yearly' && (
                <span className="bg-[#FFD59A] text-[#2B3A3B] px-2 py-1 rounded-full text-xs font-medium">
                  省 20%
                </span>
              )}
            </motion.div>
          </div>

          {/* 方案列表 */}
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
              <p className="text-[#4B4036]">載入方案中...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <HanamiButton onClick={() => window.location.reload()}>
                重新載入
              </HanamiButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map((plan, index) => {
                const isFree = plan.plan_type === 'free';
                const isPopular = plan.is_popular;
                const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
                const discount = billingCycle === 'yearly' ? getYearlyDiscount(plan.price_monthly, plan.price_yearly) : 0;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative"
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-[#FFD59A] text-[#2B3A3B] px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                          <StarIcon className="w-4 h-4" />
                          <span>最受歡迎</span>
                        </div>
                      </div>
                    )}
                    
                    <HanamiCard className={`p-8 h-full ${isPopular ? 'ring-2 ring-[#FFD59A]' : ''}`}>
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-[#4B4036] mb-2">
                          {plan.plan_name}
                        </h3>
                        <p className="text-[#2B3A3B] mb-4">
                          {plan.plan_description}
                        </p>
                        <div className="mb-2">
                          <span className="text-4xl font-bold text-[#FFD59A]">
                            {isFree ? '免費' : formatPrice(price)}
                          </span>
                          {!isFree && (
                            <span className="text-[#4B4036] ml-2">
                              /{billingCycle === 'monthly' ? '月' : '年'}
                            </span>
                          )}
                        </div>
                        {discount > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            年付省 {discount}%
                          </p>
                        )}
                      </div>

                      {/* 功能列表 */}
                      <div className="space-y-3 mb-8">
                        {Object.entries(plan.features).map(([feature, enabled]) => (
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

                      {/* 訂閱按鈕 */}
                      <HanamiButton
                        variant={isPopular ? 'primary' : 'secondary'}
                        size="lg"
                        className="w-full"
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={selectedPlan === plan.id}
                      >
                        {selectedPlan === plan.id ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            處理中...
                          </div>
                        ) : isFree ? (
                          '開始免費體驗'
                        ) : (
                          '選擇方案'
                        )}
                      </HanamiButton>
                    </HanamiCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 支付模態框 */}
      {currentPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setCurrentPlan(null);
          }}
          planId={currentPlan.id}
          planName={currentPlan.plan_name}
          billingCycle={billingCycle}
          price={billingCycle === 'monthly' ? currentPlan.price_monthly : currentPlan.price_yearly}
          currency="HKD"
          userId={user?.id || ''}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

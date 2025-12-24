'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    CheckIcon,
    SparklesIcon,
    RocketLaunchIcon,
    StarIcon,
    ChartBarIcon,
    BoltIcon,
    BuildingOffice2Icon,
    CreditCardIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    CalendarIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// Pricing Plan Definitions (HKD)
const PRICING_PLANS = [
    {
        id: 'seed',
        name: '種子版 (Seed)',
        studentRange: '0 - 10 人',
        monthlyFee: 0,
        yearlyFee: 0,
        icon: SparklesIcon,
        isPopular: false,
        isFree: true,
        color: 'from-green-100 to-emerald-50',
        selectedColor: 'ring-2 ring-green-500 bg-gradient-to-br from-green-50 to-emerald-50',
    },
    {
        id: 'starter',
        name: '起步版 (Starter)',
        studentRange: '11 - 50 人',
        monthlyFee: 188,
        yearlyFee: 1880, // 10 months price (save 2 months)
        icon: RocketLaunchIcon,
        isPopular: false,
        isFree: false,
        color: 'from-blue-100 to-blue-50',
        selectedColor: 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100',
    },
    {
        id: 'growth',
        name: '成長版 (Growth)',
        studentRange: '51 - 100 人',
        monthlyFee: 368,
        yearlyFee: 3680, // 10 months price (save 2 months)
        icon: ChartBarIcon,
        isPopular: true,
        isFree: false,
        color: 'from-amber-100 to-orange-50',
        selectedColor: 'ring-2 ring-amber-500 bg-gradient-to-br from-amber-50 to-orange-100',
    },
    {
        id: 'pro',
        name: '專業版 (Pro)',
        studentRange: '101 - 250 人',
        monthlyFee: 688,
        yearlyFee: 6880, // 10 months price (save 2 months)
        icon: BoltIcon,
        isPopular: false,
        isFree: false,
        color: 'from-purple-100 to-pink-50',
        selectedColor: 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-pink-100',
    },
    {
        id: 'enterprise',
        name: '企業版 (Enterprise)',
        studentRange: '251 - 500 人',
        monthlyFee: 988,
        yearlyFee: 9880, // 10 months price (save 2 months)
        icon: BuildingOffice2Icon,
        isPopular: false,
        isFree: false,
        color: 'from-slate-100 to-gray-50',
        selectedColor: 'ring-2 ring-slate-500 bg-gradient-to-br from-slate-50 to-gray-100',
    },
];

export default function SubscriptionCheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useSaasAuth();

    // State
    const [selectedPlan, setSelectedPlan] = useState<string>('growth');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [autoRenew, setAutoRenew] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Get plan from URL if provided
    useEffect(() => {
        const planFromUrl = searchParams.get('plan');
        if (planFromUrl && PRICING_PLANS.find(p => p.id === planFromUrl)) {
            setSelectedPlan(planFromUrl);
        }
    }, [searchParams]);

    // Get organization info from localStorage
    const getOrgInfo = () => {
        if (typeof window === 'undefined') return { orgId: null, orgName: null };
        try {
            // Try hanami_current_org first (used by TeacherLinkShell)
            const stored = localStorage.getItem('hanami_current_org');
            if (stored) {
                const parsed = JSON.parse(stored);
                return { orgId: parsed.id || null, orgName: parsed.name || null };
            }
            // Fallback to hanami_teacher_link_org
            const fallback = localStorage.getItem('hanami_teacher_link_org');
            if (fallback) {
                const parsed = JSON.parse(fallback);
                return { orgId: parsed.id || null, orgName: parsed.name || null };
            }
        } catch (e) {
            console.error('Error reading org info from localStorage:', e);
        }
        return { orgId: null, orgName: null };
    };

    // Calculate price
    const currentPlan = PRICING_PLANS.find(p => p.id === selectedPlan);
    const price = currentPlan
        ? billingCycle === 'monthly'
            ? currentPlan.monthlyFee
            : currentPlan.yearlyFee
        : 0;
    const originalYearlyPrice = currentPlan ? currentPlan.monthlyFee * 12 : 0;
    const savings = currentPlan ? originalYearlyPrice - (currentPlan.yearlyFee || 0) : 0;

    // Handle checkout
    const handleCheckout = async () => {
        if (!currentPlan) return;

        // Free plan - just redirect
        if (currentPlan.isFree) {
            toast.success('種子版完全免費，您已可以開始使用！');
            router.push('/aihome/teacher-link/create');
            return;
        }

        if (!user) {
            toast.error('請先登入後再購買方案');
            router.push('/aihome/login');
            return;
        }

        setIsLoading(true);

        try {
            const { orgId, orgName } = getOrgInfo();

            if (!orgId) {
                toast.error('請先選擇或創建機構');
                router.push('/aihome/teacher-link/create');
                return;
            }

            // Use new subscription API for proper auto-renew handling
            const subscriptionRequest = {
                plan_id: currentPlan.id,
                plan_name: currentPlan.name,
                amount: price,
                currency: 'HKD',
                billing_cycle: billingCycle,
                auto_renew: autoRenew,
                org_id: orgId,
                user_id: user.id || '',
                customer_email: user.email || '',
                customer_name: user.full_name || user.email || '',
                success_url: `${window.location.origin}/aihome/teacher-link/create/subscription-success?plan=${currentPlan.id}&cycle=${billingCycle}&auto_renew=${autoRenew}`,
                cancel_url: `${window.location.origin}/aihome/teacher-link/create/subscription-checkout?plan=${currentPlan.id}`,
                metadata: {
                    student_limit: currentPlan.studentRange,
                    org_name: orgName || '',
                }
            };

            const response = await fetch('/api/aihome/payment/subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscriptionRequest),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '訂閱創建失敗');
            }

            if (result.checkout_url) {
                // Show different message based on auto-renew
                if (autoRenew) {
                    toast.success('支付頁面已打開，完成付款後將自動設置續費');
                } else {
                    toast.success('支付頁面已打開，請完成付款');
                }

                const paymentWindow = window.open(
                    result.checkout_url,
                    'airwallex_payment',
                    'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
                );

                if (!paymentWindow) {
                    // If popup blocked, redirect in current window
                    window.location.href = result.checkout_url;
                }
            } else {
                throw new Error(result.error || '無法創建支付請求');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error instanceof Error ? error.message : '付款失敗，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6"
                >
                    <Link
                        href="/aihome/teacher-link/create/student-pricing"
                        className="inline-flex items-center gap-2 px-4 py-2 text-[#4B4036] hover:text-[#A64B2A] transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        返回定價頁面
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-[#4B4036] mb-3">
                        選擇您的訂閱方案
                    </h1>
                    <p className="text-[#8B7E74] text-lg">
                        選擇最適合您機構的方案，隨時可以升級或降級
                    </p>
                </motion.div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Plan Selection & Options */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Plan Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-[#EADBC8]"
                        >
                            <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-[#FFD59A]" />
                                選擇方案
                            </h2>
                            <div className="space-y-3">
                                {PRICING_PLANS.map((plan) => (
                                    <motion.button
                                        key={plan.id}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left ${selectedPlan === plan.id
                                            ? plan.selectedColor
                                            : `bg-gradient-to-br ${plan.color} border-transparent hover:border-[#EADBC8]`
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm`}>
                                                    <plan.icon className="w-5 h-5 text-[#4B4036]" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-[#4B4036]">{plan.name}</span>
                                                        {plan.isPopular && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#FFD59A] to-[#FFB6C1] text-[#4B4036] text-xs font-bold rounded-full">
                                                                <StarIcon className="w-3 h-3" />
                                                                最受歡迎
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-[#8B7E74]">{plan.studentRange}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {plan.isFree ? (
                                                    <span className="text-xl font-bold text-green-600">免費</span>
                                                ) : (
                                                    <div>
                                                        <span className="text-xl font-bold text-[#D48347]">
                                                            ${billingCycle === 'monthly' ? plan.monthlyFee : plan.yearlyFee}
                                                        </span>
                                                        <span className="text-sm text-[#8B7E74]">
                                                            /{billingCycle === 'monthly' ? '月' : '年'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {selectedPlan === plan.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                                            >
                                                <CheckIcon className="w-4 h-4 text-white" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Billing Cycle */}
                        {currentPlan && !currentPlan.isFree && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-[#EADBC8]"
                            >
                                <h2 className="text-xl font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-[#FFD59A]" />
                                    付款週期
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`p-4 rounded-2xl border-2 transition-all ${billingCycle === 'monthly'
                                            ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFE3C6]'
                                            : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]'
                                            }`}
                                    >
                                        <div className="font-bold text-[#4B4036] mb-1">月費</div>
                                        <div className="text-2xl font-bold text-[#D48347]">
                                            ${currentPlan.monthlyFee}
                                            <span className="text-sm font-normal text-[#8B7E74]">/月</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setBillingCycle('yearly')}
                                        className={`p-4 rounded-2xl border-2 transition-all relative ${billingCycle === 'yearly'
                                            ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFE3C6]'
                                            : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]'
                                            }`}
                                    >
                                        <div className="absolute -top-3 right-4 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                            省 ${savings}
                                        </div>
                                        <div className="font-bold text-[#4B4036] mb-1">年費</div>
                                        <div className="text-2xl font-bold text-[#D48347]">
                                            ${currentPlan.yearlyFee}
                                            <span className="text-sm font-normal text-[#8B7E74]">/年</span>
                                        </div>
                                        <div className="text-xs text-[#8B7E74] line-through">
                                            原價 ${originalYearlyPrice}
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Auto Renew */}
                        {currentPlan && !currentPlan.isFree && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-[#EADBC8]"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ArrowPathIcon className="w-5 h-5 text-[#FFD59A]" />
                                        <div>
                                            <h2 className="text-lg font-bold text-[#4B4036]">自動續費</h2>
                                            <p className="text-sm text-[#8B7E74]">
                                                {autoRenew
                                                    ? '到期後自動從您的付款方式扣款，確保服務不中斷'
                                                    : '到期前會發送提醒，需要您手動續費'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAutoRenew(!autoRenew)}
                                        className={`relative w-14 h-8 rounded-full transition-colors ${autoRenew ? 'bg-green-500' : 'bg-gray-300'
                                            }`}
                                    >
                                        <motion.div
                                            animate={{ x: autoRenew ? 24 : 4 }}
                                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                                        />
                                    </button>
                                </div>

                                {/* Auto-renew explanation */}
                                <div className={`mt-4 p-4 rounded-xl text-sm ${autoRenew ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                                    {autoRenew ? (
                                        <div className="text-green-700">
                                            <p className="font-semibold mb-1">✓ 自動續費已開啟</p>
                                            <ul className="list-disc list-inside text-xs space-y-1 text-green-600">
                                                <li>您的付款方式將被安全保存</li>
                                                <li>訂閱到期時自動扣款續費</li>
                                                <li>您可以隨時在設置中取消自動續費</li>
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="text-amber-700">
                                            <p className="font-semibold mb-1">⚠ 手動續費模式</p>
                                            <ul className="list-disc list-inside text-xs space-y-1 text-amber-600">
                                                <li>此次為單次付款</li>
                                                <li>訂閱到期前7天會發送提醒</li>
                                                <li>如未及時續費，服務將於到期後暫停</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right: Order Summary */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-br from-[#4B4036] to-[#2C241B] rounded-3xl p-6 shadow-xl text-white sticky top-8"
                        >
                            <h2 className="text-xl font-bold mb-6">訂單摘要</h2>

                            {currentPlan && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-white/20">
                                        <span className="text-white/70">方案</span>
                                        <span className="font-bold">{currentPlan.name}</span>
                                    </div>

                                    <div className="flex justify-between items-center pb-4 border-b border-white/20">
                                        <span className="text-white/70">學生人數</span>
                                        <span>{currentPlan.studentRange}</span>
                                    </div>

                                    {!currentPlan.isFree && (
                                        <>
                                            <div className="flex justify-between items-center pb-4 border-b border-white/20">
                                                <span className="text-white/70">付款週期</span>
                                                <span>{billingCycle === 'monthly' ? '月費' : '年費'}</span>
                                            </div>

                                            <div className="flex justify-between items-center pb-4 border-b border-white/20">
                                                <span className="text-white/70">自動續費</span>
                                                <span>{autoRenew ? '是' : '否'}</span>
                                            </div>

                                            {billingCycle === 'yearly' && savings > 0 && (
                                                <div className="flex justify-between items-center pb-4 border-b border-white/20 text-green-400">
                                                    <span>年費優惠</span>
                                                    <span>-${savings}</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-lg">總計</span>
                                        <div className="text-right">
                                            {currentPlan.isFree ? (
                                                <span className="text-2xl font-bold text-green-400">免費</span>
                                            ) : (
                                                <>
                                                    <span className="text-2xl font-bold">${price}</span>
                                                    <span className="text-white/70">/{billingCycle === 'monthly' ? '月' : '年'}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCheckout}
                                        disabled={isLoading}
                                        className={`w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${currentPlan.isFree
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                                            : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:from-[#EBC9A4] hover:to-[#FFD59A]'
                                            } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                處理中...
                                            </>
                                        ) : currentPlan.isFree ? (
                                            <>
                                                <SparklesIcon className="w-5 h-5" />
                                                立即免費開始
                                            </>
                                        ) : (
                                            <>
                                                下一步 - 前往付款
                                                <ArrowRightIcon className="w-5 h-5" />
                                            </>
                                        )}
                                    </motion.button>

                                    <p className="text-center text-white/50 text-xs mt-4">
                                        <CreditCardIcon className="w-4 h-4 inline mr-1" />
                                        安全支付由 Airwallex 提供
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

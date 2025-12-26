'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCardIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    ArrowUpCircleIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface SubscriptionInfo {
    hasSubscription: boolean;
    plan: {
        id: string;
        name: string;
        maxStudents: number;
        priceMonthly?: number;
        priceYearly?: number;
    };
    status: string;
    billingType: string | null;
    autoRenew: boolean;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    studentCount: number;
    maxStudents: number;
    usagePercent: number;
}

interface OrgSubscriptionInfoPanelProps {
    orgId: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
    active: { label: '使用中', bgClass: 'bg-emerald-100/50', textClass: 'text-emerald-700' },
    past_due: { label: '付款處理中', bgClass: 'bg-amber-100/50', textClass: 'text-amber-700' },
    grace_period: { label: '寬限期', bgClass: 'bg-orange-100/50', textClass: 'text-orange-700' },
    suspended: { label: '已暫停', bgClass: 'bg-red-100/50', textClass: 'text-red-700' },
    cancelled: { label: '已取消', bgClass: 'bg-gray-100/50', textClass: 'text-gray-600' },
};

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '---';
    try {
        return new Date(dateStr).toLocaleDateString('zh-HK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

export default function OrgSubscriptionInfoPanel({ orgId }: OrgSubscriptionInfoPanelProps) {
    const [info, setInfo] = useState<SubscriptionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!orgId) {
            setLoading(false);
            return;
        }

        const fetchInfo = async () => {
            try {
                const res = await fetch(`/api/org-subscription/status?orgId=${orgId}`);
                if (res.ok) {
                    const data = await res.json();
                    setInfo(data);
                }
            } catch (error) {
                console.error('Failed to fetch subscription info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, [orgId]);

    // Handle auto-renew toggle
    const handleAutoRenewToggle = useCallback(async (newValue: boolean) => {
        if (!orgId || !info) return;

        // If turning OFF, show confirmation dialog first
        if (!newValue) {
            setShowCancelConfirm(true);
            return;
        }

        // If turning ON, proceed directly
        await updateAutoRenew(true);
    }, [orgId, info]);

    // Execute the auto-renew update
    const updateAutoRenew = async (newValue: boolean) => {
        if (!orgId) return;

        setIsUpdating(true);
        try {
            const res = await fetch('/api/org-subscription/update-auto-renew', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId, autoRenew: newValue }),
            });

            if (res.ok) {
                setInfo(prev => prev ? { ...prev, autoRenew: newValue } : null);
            } else {
                console.error('Failed to update auto-renew status');
            }
        } catch (error) {
            console.error('Error updating auto-renew:', error);
        } finally {
            setIsUpdating(false);
            setShowCancelConfirm(false);
        }
    };

    // Confirm cancel auto-renew
    const confirmCancelAutoRenew = () => {
        updateAutoRenew(false);
    };

    if (loading) {
        return (
            <div className="p-5 rounded-2xl bg-[#FFF9F2] shadow-[inset_4px_4px_8px_#E6D9C5,inset_-4px_-4px_8px_#FFFFFF] animate-pulse">
                <div className="h-4 w-24 bg-[#E6D9C5] rounded mb-3" />
                <div className="h-6 w-32 bg-[#E6D9C5] rounded" />
            </div>
        );
    }

    if (!info) {
        return null;
    }

    const statusConfig = STATUS_CONFIG[info.status] || STATUS_CONFIG.active;

    // Usage bar color
    const usageColor =
        info.usagePercent >= 90
            ? 'from-red-300 to-red-400'
            : info.usagePercent >= 70
                ? 'from-amber-300 to-amber-400'
                : 'from-emerald-300 to-emerald-400';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-[#FFF9F2] border border-[#EADBC8]/50 shadow-sm relative overflow-hidden group"
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FFD59A]/10 to-transparent rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#FFF9F2] shadow-[inset_2px_2px_4px_#E6D9C5,inset_-2px_-2px_4px_#FFFFFF] flex items-center justify-center">
                            <CreditCardIcon className="w-4 h-4 text-[#FFD59A]" />
                        </div>
                        <span className="text-sm font-bold text-[#4B4036]">訂閱方案</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                        {statusConfig.label}
                    </span>
                </div>

                {/* Plan Name */}
                <div className="mb-4">
                    <h4 className="text-lg font-bold text-[#4B4036]">{info.plan.name}</h4>
                    {!info.hasSubscription && (
                        <p className="text-xs text-[#8B7E74] mt-1">永久免費方案</p>
                    )}
                </div>

                {/* Student Usage - Neumorphic Progress */}
                <div className="p-4 rounded-xl bg-[#FFF9F2] shadow-[inset_3px_3px_6px_#E6D9C5,inset_-3px_-3px_6px_#FFFFFF] mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-[#8B7E74]">
                            <UserGroupIcon className="w-3.5 h-3.5" />
                            學生使用量
                        </div>
                        <span className="text-sm font-bold text-[#4B4036]">
                            {info.studentCount} / {info.maxStudents}
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#FFF9F2] shadow-[inset_1px_1px_3px_#E6D9C5,inset_-1px_-1px_3px_#FFFFFF] overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, info.usagePercent)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full bg-gradient-to-r ${usageColor} rounded-full shadow-sm`}
                        />
                    </div>
                </div>

                {/* Billing Period - only show if has subscription */}
                {info.hasSubscription && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-[#FFF9F2] shadow-[2px_2px_4px_#E6D9C5,-2px_-2px_4px_#FFFFFF]">
                            <div className="flex items-center gap-1 text-[10px] text-[#8B7E74] mb-1">
                                <CalendarDaysIcon className="w-3 h-3" />
                                開始日期
                            </div>
                            <div className="text-xs font-semibold text-[#4B4036]">
                                {formatDate(info.currentPeriodStart)}
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-[#FFF9F2] shadow-[2px_2px_4px_#E6D9C5,-2px_-2px_4px_#FFFFFF]">
                            <div className="flex items-center gap-1 text-[10px] text-[#8B7E74] mb-1">
                                <CalendarDaysIcon className="w-3 h-3" />
                                下次扣款
                            </div>
                            <div className="text-xs font-semibold text-[#4B4036]">
                                {formatDate(info.currentPeriodEnd)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Billing Info with Toggle Switch */}
                {info.hasSubscription && (
                    <div className="flex items-center justify-between text-[10px] text-[#8B7E74] mb-4 px-1">
                        <span>{info.billingType === 'yearly' ? '年繳 (8折)' : '月繳'}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#4B4036] font-medium">自動續費</span>
                            <button
                                onClick={() => handleAutoRenewToggle(!info.autoRenew)}
                                disabled={isUpdating}
                                className={`relative w-10 h-5 rounded-full transition-all duration-300 ease-in-out ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                    } ${info.autoRenew
                                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'
                                        : 'bg-[#E6D9C5] shadow-[inset_2px_2px_4px_#D0C4B0,inset_-2px_-2px_4px_#FFFFFF]'
                                    }`}
                                aria-label={info.autoRenew ? '關閉自動續費' : '開啟自動續費'}
                            >
                                <motion.div
                                    layout
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className={`absolute top-0.5 w-4 h-4 rounded-full shadow-md ${info.autoRenew
                                            ? 'left-[22px] bg-white'
                                            : 'left-0.5 bg-white shadow-[1px_1px_2px_#D0C4B0,-1px_-1px_2px_#FFFFFF]'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Button - Neumorphic Style */}
                <Link href="/aihome/teacher-link/create/student-pricing">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl bg-[#FFF9F2] shadow-[4px_4px_8px_#E6D9C5,-4px_-4px_8px_#FFFFFF] hover:shadow-[6px_6px_12px_#E6D9C5,-6px_-6px_12px_#FFFFFF] active:shadow-[inset_3px_3px_6px_#E6D9C5,inset_-3px_-3px_6px_#FFFFFF] transition-all flex items-center justify-center gap-2 text-sm font-bold text-[#4B4036]"
                    >
                        <ArrowUpCircleIcon className="w-4 h-4 text-[#D48347]" />
                        {info.hasSubscription ? '管理方案' : '升級方案'}
                    </motion.button>
                </Link>
            </div>

            {/* Confirmation Dialog for Cancel Auto-Renew */}
            <AnimatePresence>
                {showCancelConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCancelConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-[#FFF9F2] rounded-2xl p-6 max-w-sm w-full shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                                </div>
                                <h3 className="text-lg font-bold text-[#4B4036]">確認取消自動續費？</h3>
                            </div>

                            <p className="text-sm text-[#8B7E74] mb-6 leading-relaxed">
                                取消自動續費後，您的訂閱將在當前計費週期結束時終止。您仍可在到期前隨時重新開啟自動續費。
                            </p>

                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowCancelConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-[#FFF9F2] shadow-[3px_3px_6px_#E6D9C5,-3px_-3px_6px_#FFFFFF] text-sm font-semibold text-[#4B4036] transition-all hover:shadow-[4px_4px_8px_#E6D9C5,-4px_-4px_8px_#FFFFFF]"
                                >
                                    取消
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={confirmCancelAutoRenew}
                                    disabled={isUpdating}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-400 to-red-500 text-white text-sm font-semibold shadow-md transition-all hover:from-red-500 hover:to-red-600 disabled:opacity-50"
                                >
                                    {isUpdating ? '處理中...' : '確認取消'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    CreditCardIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    ArrowUpCircleIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
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

                {/* Billing Info */}
                {info.hasSubscription && (
                    <div className="flex items-center justify-between text-[10px] text-[#8B7E74] mb-4 px-1">
                        <span>{info.billingType === 'yearly' ? '年繳 (8折)' : '月繳'}</span>
                        <span>自動續費：{info.autoRenew ? '開啟' : '關閉'}</span>
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
        </motion.div>
    );
}

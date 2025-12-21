'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { UserGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SubscriptionStatus {
    hasSubscription: boolean;
    plan: {
        id: string;
        name: string;
        maxStudents: number;
    };
    status: string;
    studentCount: number;
    maxStudents: number;
    canAddStudents: boolean;
    canEditStudents: boolean;
    usagePercent: number;
}

interface OrgSubscriptionBadgeProps {
    orgId: string | null;
}

export default function OrgSubscriptionBadge({ orgId }: OrgSubscriptionBadgeProps) {
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) {
            setLoading(false);
            return;
        }

        const fetchStatus = async () => {
            try {
                const res = await fetch(`/api/org-subscription/status?orgId=${orgId}`);
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);
                }
            } catch (error) {
                console.error('Failed to fetch subscription status:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [orgId]);

    if (loading || !status) {
        return (
            <div className="px-3 py-1 bg-[#F5F0EB] rounded-full animate-pulse">
                <div className="h-4 w-20 bg-[#E8DFD5] rounded"></div>
            </div>
        );
    }

    // Status color based on subscription status
    const statusColors = {
        active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        past_due: 'bg-amber-100 text-amber-700 border-amber-200',
        grace_period: 'bg-orange-100 text-orange-700 border-orange-200',
        suspended: 'bg-red-100 text-red-700 border-red-200',
        cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
    };

    const colorClass = statusColors[status.status as keyof typeof statusColors] || statusColors.active;

    // Usage bar color
    const usageColor = status.usagePercent >= 90
        ? 'bg-red-400'
        : status.usagePercent >= 70
            ? 'bg-amber-400'
            : 'bg-emerald-400';

    const showWarning = status.status !== 'active' || status.usagePercent >= 90;

    return (
        <Link href="/aihome/teacher-link/create/student-pricing">
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${colorClass}`}
            >
                {showWarning ? (
                    <ExclamationTriangleIcon className="w-4 h-4" />
                ) : (
                    <UserGroupIcon className="w-4 h-4" />
                )}

                <span className="text-xs font-medium whitespace-nowrap">
                    {status.plan.name.split(' ')[0]}
                </span>

                <div className="flex items-center gap-1">
                    <span className="text-xs font-bold">
                        {status.studentCount}/{status.maxStudents}
                    </span>

                    {/* Mini usage bar */}
                    <div className="w-8 h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, status.usagePercent)}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full ${usageColor} rounded-full`}
                        />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

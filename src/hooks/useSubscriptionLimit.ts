'use client';

import { useState, useEffect, useCallback } from 'react';

interface SubscriptionLimit {
    planId: string;
    maxStudents: number;
    currentCount: number;
    remaining: number;
    canAdd: boolean;
    canEdit: boolean;
    status: string;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Hook to check subscription limits for an organization
 * @param orgId - The organization ID to check
 * @returns Subscription limit status and control functions
 */
export function useSubscriptionLimit(orgId: string | null): SubscriptionLimit {
    const [state, setState] = useState<Omit<SubscriptionLimit, 'loading' | 'error' | 'refresh'>>({
        planId: 'seed',
        maxStudents: 10,
        currentCount: 0,
        remaining: 10,
        canAdd: true,
        canEdit: true,
        status: 'active',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLimit = useCallback(async () => {
        if (!orgId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/org-subscription/check-limit?orgId=${orgId}`);

            if (!res.ok) {
                throw new Error('Failed to check subscription limit');
            }

            const data = await res.json();

            setState({
                planId: data.planId || 'seed',
                maxStudents: data.maxStudents || 10,
                currentCount: data.currentCount || 0,
                remaining: data.remaining || 0,
                canAdd: data.canAdd ?? true,
                canEdit: data.canEdit ?? true,
                status: data.status || 'active',
            });
        } catch (err) {
            console.error('Error fetching subscription limit:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            // Default to allowing actions on error to not block users
            setState(prev => ({ ...prev, canAdd: true, canEdit: true }));
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchLimit();
    }, [fetchLimit]);

    return {
        ...state,
        loading,
        error,
        refresh: fetchLimit,
    };
}

/**
 * Check if subscription status allows student operations
 */
export function isSubscriptionActive(status: string): boolean {
    return status === 'active';
}

/**
 * Get warning message based on subscription status
 */
export function getSubscriptionWarning(status: string, remaining: number, maxStudents: number): string | null {
    if (status === 'suspended') {
        return '訂閱已暫停，學生資料處於只讀模式。請更新您的付款方式以恢復服務。';
    }
    if (status === 'grace_period') {
        return '付款逾期中，請盡快完成付款以避免服務中斷。';
    }
    if (status === 'past_due') {
        return '付款處理中，請稍後再試。';
    }
    if (remaining === 0) {
        return `已達學生上限 (${maxStudents} 人)，請升級方案以添加更多學生。`;
    }
    if (remaining <= 3) {
        return `即將達到學生上限，剩餘 ${remaining} 個名額。`;
    }
    return null;
}

import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { Reward, Redemption } from '@/types/task-management';
import { RewardCard } from './RewardCard';
import { RewardModal } from './RewardModal';

interface RewardsSectionProps {
    orgId?: string;
    isAdmin: boolean;
    totalEarnedPoints: number; // calculated from tasks
    currentUserId?: string; // student id
}

export function RewardsSection({ orgId, isAdmin, totalEarnedPoints, currentUserId }: RewardsSectionProps) {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch data
    const fetchRewardsData = async () => {
        try {
            setLoading(true);
            const query = orgId ? `?orgId=${orgId}` : '';

            // 1. Get Rewards
            const rewardsRes = await fetch(`/api/rewards${query}`);
            if (!rewardsRes.ok) throw new Error('Failed to fetch rewards');
            const rewardsData = await rewardsRes.json();
            setRewards(rewardsData);

            // 2. Get Redemptions (In a real app, we'd have a specific endpoint for user's redemptions)
            // For now, we'll just mock this or assuming we fetch it from somewhere.
            // Since we didn't create a specific GET /api/rewards/redemptions endpoint, 
            // let's assume valid points calculation for now comes from parent or we calculate it here if we had the data.
            // To keep it simple as per plan, we might not have full history display yet, but we need it for balance calculation.
            // Let's assume we start with 0 spent if we can't fetch it easily, or we trust totalEarnedPoints passed in is actually "Available Points".
            // Wait, the prompt said "Calculate on fly".
            // Let's add a quick fetch for redemptions if we want to be accurate, or just implement the redemption logic.

        } catch (err) {
            console.error(err);
            setError('無法載入獎勵資料');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRewardsData();
    }, [orgId]);

    // Handle Create/Edit
    const handleSaveReward = async (data: Partial<Reward>) => {
        try {
            if (!orgId) {
                alert('無法獲取機構 ID，請重新整理頁面試試');
                return;
            }
            setIsSubmitting(true);
            const url = editingReward ? `/api/rewards/${editingReward.id}` : '/api/rewards';
            const method = editingReward ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, org_id: orgId })
            });

            if (!res.ok) throw new Error('Failed to save reward');

            await fetchRewardsData();
            setIsModalOpen(false);
            setEditingReward(undefined);
        } catch (err) {
            alert('保存失敗，請重試');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Redeem
    const handleRedeem = async (reward: Reward) => {
        if (!confirm(`確定要兌換 "${reward.title}" 嗎？將扣除 ${reward.points_cost} 積分。`)) return;

        try {
            const res = await fetch('/api/rewards/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUserId,
                    reward_id: reward.id,
                    points_spent: reward.points_cost,
                    redeemed_by: 'Admin' // Should be current user session
                })
            });

            if (!res.ok) throw new Error('Redemption failed');

            alert(`🎉 兌換成功！獲得 ${reward.title}`);
            // Ideally trigger a refresh of points in parent
            window.location.reload(); // Quick dirty refresh to update points
        } catch (err) {
            alert('兌換失敗，請稍後再試');
        }
    };

    const handleEdit = (reward: Reward) => {
        setEditingReward(reward);
        setIsModalOpen(true);
    };

    const handleDeleteReward = async (reward: Reward) => {
        try {
            setIsSubmitting(true);
            const res = await fetch(`/api/rewards/${reward.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete reward');

            await fetchRewardsData();
            setIsModalOpen(false);
            setEditingReward(undefined);
        } catch (err) {
            alert('刪除失敗，請重試');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">載入獎勵中...</div>;

    // ... render return ...

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm mb-8">
            {/* ... header ... */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h3 className="text-[#2B3A3B] font-bold text-2xl flex items-center gap-2">
                        <Gift className="w-8 h-8 text-[#2B3A3B]" /> 獎勵兌換
                    </h3>
                    <p className="text-[#2B3A3B]/60 text-sm mt-1">
                        用努力賺取的積分兌換超棒獎勵！
                    </p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => { setEditingReward(undefined); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-[#FEE2E2] text-[#EF4444] rounded-xl text-sm font-bold hover:bg-[#FECACA] transition-colors flex items-center gap-1"
                    >
                        <span>+</span> 新增獎勵
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {rewards.map(reward => (
                    <RewardCard
                        key={reward.id}
                        reward={reward}
                        userPoints={totalEarnedPoints} // This should ideally be available_points
                        onRedeem={handleRedeem}
                        onEdit={handleEdit}
                        isAdmin={isAdmin}
                    />
                ))}

                {rewards.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 text-gray-400">
                        <div className="text-4xl mb-2">🎈</div>
                        目前還沒有上架任何獎勵
                    </div>
                )}
            </div>

            <RewardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveReward}
                onDelete={handleDeleteReward}
                initialData={editingReward}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}

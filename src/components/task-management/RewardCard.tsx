import React from 'react';
import { Reward } from '@/types/task-management';
import { REWARD_ICONS, DEFAULT_REWARD_ICON } from './RewardIcons';

interface RewardCardProps {
    reward: Reward;
    userPoints: number;
    onRedeem: (reward: Reward) => void;
    onEdit: (reward: Reward) => void;
    isAdmin: boolean;
}

export function RewardCard({ reward, userPoints, onRedeem, onEdit, isAdmin }: RewardCardProps) {
    const canAfford = userPoints >= reward.points_cost;
    const IconComponent = REWARD_ICONS[reward.icon || DEFAULT_REWARD_ICON] || REWARD_ICONS[DEFAULT_REWARD_ICON];

    return (
        <div className="group relative bg-white rounded-[2rem] p-5 flex flex-col items-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100 hover:border-[#FFD59A]/50 overflow-hidden">

            {/* Background Decoration */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#FFF8ED] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Admin Edit Button */}
            {isAdmin && (
                <button
                    onClick={() => onEdit(reward)}
                    className="absolute top-3 right-3 z-10 p-2 text-gray-400 hover:text-[#2B3A3B] hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    title="編輯獎勵"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
            )}

            {/* Icon Container */}
            <div className="relative z-10 w-20 h-20 rounded-full bg-[#FFF5E6] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm group-hover:shadow-md ring-4 ring-white">
                <IconComponent className="w-10 h-10 text-[#F59E0B]" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h4 className="relative z-10 font-bold text-[#2B3A3B] text-center text-lg leading-tight mb-2 line-clamp-2 min-h-[2.5rem] w-full px-2" title={reward.title}>
                {reward.title}
            </h4>

            {/* Price Tag */}
            <div className="relative z-10 flex items-center justify-center gap-1.5 bg-[#FFF8ED] px-4 py-1.5 rounded-full mb-5 group-hover:bg-[#FFEDD5] transition-colors">
                <span className="text-xl">💎</span>
                <span className="font-extrabold text-[#F59E0B] text-lg tracking-tight">{reward.points_cost}</span>
            </div>

            {/* Redeem Button */}
            <button
                onClick={() => onRedeem(reward)}
                disabled={!canAfford && !isAdmin}
                className={`
                    relative z-10 w-full py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2
                    ${canAfford || isAdmin
                        ? 'bg-[#FFD59A] text-[#2B3A3B] hover:bg-[#FFE4BC] active:scale-95 shadow-lg shadow-[#FFD59A]/20 hover:shadow-[#FFD59A]/30'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                `}
            >
                {canAfford ? (
                    <>
                        <span>立即兌換</span>
                        <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </>
                ) : (
                    '積分不足'
                )}
            </button>
        </div>
    );
}

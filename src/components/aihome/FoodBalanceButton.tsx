'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    UserCircleIcon,
    CpuChipIcon,
    AcademicCapIcon,
    PaintBrushIcon
} from '@heroicons/react/24/outline';
import { Sparkles } from 'lucide-react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useFoodDisplay } from '@/hooks/useFoodDisplay';

export default function FoodBalanceButton() {
    const router = useRouter();
    const { user } = useSaasAuth();

    // Food Display Hook
    const {
        foodBalance,
        fetchFoodInfo,
        foodHistory,
        showFoodHistory,
        toggleFoodHistory
    } = useFoodDisplay(user?.id);

    // Auto refresh food info when user is available
    useEffect(() => {
        if (user?.id) fetchFoodInfo();
    }, [user?.id, fetchFoodInfo]);

    return (
        <div className="relative mx-2">
            <motion.button
                onClick={toggleFoodHistory}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-[#FFD59A] rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
                <img src="/apple-icon.svg" alt="食量" className="w-4 h-4" />
                <span className="text-sm font-bold text-[#4B4036]">{foodBalance}</span>
            </motion.button>

            <AnimatePresence>
                {showFoodHistory && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute top-12 right-0 w-80 bg-white rounded-3xl shadow-xl border border-[#EADBC8]/50 p-4 z-50 overflow-hidden"
                    >
                        {/* 1. Account Status Card */}
                        <div className={`relative overflow-hidden rounded-2xl p-5 mb-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] ${user?.subscription_plan_id === 'starter' ? 'bg-gradient-to-br from-blue-100 to-blue-50' :
                            user?.subscription_plan_id === 'plus' ? 'bg-gradient-to-br from-amber-100 to-orange-50' :
                                user?.subscription_plan_id === 'pro' ? 'bg-gradient-to-br from-purple-100 to-pink-50' :
                                    'bg-white border border-[#EADBC8]/30'
                            }`}>
                            {/* Soft Background BLOBS */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FFD59A]/20 blur-2xl rounded-full pointer-events-none" />
                            <div className="absolute top-10 -left-10 w-24 h-24 bg-[#FFB6C1]/10 blur-xl rounded-full pointer-events-none" />

                            <div className="relative z-10 flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] font-bold text-[#8C7A6B] tracking-widest uppercase mb-1">當前計劃</div>
                                    <div className="text-3xl font-bold text-[#4B4036] leading-none tracking-tight">
                                        {(!user?.subscription_plan_id || user.subscription_plan_id.toLowerCase() === 'free') ? (
                                            <div className="flex flex-col gap-1">
                                                <span>Free</span>
                                                <span className="text-[10px] text-[#8C7A6B] font-medium tracking-normal">3 食量/ L1 查詢</span>
                                            </div>
                                        ) : (
                                            user.subscription_plan_id.charAt(0).toUpperCase() + user.subscription_plan_id.slice(1)
                                        )}
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-sm">
                                    <img src="/apple-icon.svg" alt="icon" className="w-5 h-5 opacity-80" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Buy Button */}
                        <div className="mb-5">
                            <motion.button
                                onClick={() => router.push('/aihome/pricing')}
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative w-full h-11 rounded-full bg-white flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_12px_rgba(75,64,54,0.08)] hover:shadow-[0_8px_20px_rgba(212,131,71,0.25)] border border-[#EADBC8]/30"
                            >
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-1.5 bg-[#FFD59A] blur-md opacity-40 group-hover:opacity-70 transition-opacity rounded-full" />
                                <Sparkles className="w-4 h-4 text-[#D48347]" />
                                <span className="text-xs font-bold text-[#4B4036] tracking-wide">升級方案</span>
                            </motion.button>
                        </div>

                        {/* 3. Recent Records List */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <div className="h-px flex-1 bg-[#EADBC8]/50" />
                                <span className="text-[10px] font-bold text-[#8C7A6B]/70">最近 5 次紀錄</span>
                                <div className="h-px flex-1 bg-[#EADBC8]/50" />
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {foodHistory.length === 0 ? (
                                    <div className="text-center text-xs text-gray-400 py-4">尚無記錄</div>
                                ) : (
                                    foodHistory.map((record: any) => {
                                        let characterName = '未知';
                                        let Icon = UserCircleIcon;
                                        let iconColor = 'text-gray-400';
                                        let bgColor = 'bg-gray-100';

                                        const roleId = record.ai_messages?.role_instances?.role_id || record.ai_messages?.role_id;

                                        if (roleId) {
                                            if (roleId.includes('hibi')) {
                                                characterName = '希希';
                                                Icon = CpuChipIcon;
                                                iconColor = 'text-orange-500';
                                                bgColor = 'bg-orange-50';
                                            } else if (roleId.includes('mori')) {
                                                characterName = '墨墨';
                                                Icon = AcademicCapIcon;
                                                iconColor = 'text-amber-600';
                                                bgColor = 'bg-amber-50';
                                            } else if (roleId.includes('pico')) {
                                                characterName = '皮可';
                                                Icon = PaintBrushIcon;
                                                iconColor = 'text-blue-500';
                                                bgColor = 'bg-blue-50';
                                            }
                                        } else if (record.description) {
                                            const desc = record.description.toLowerCase();
                                            if (desc.includes('hibi') || desc.includes('希希')) {
                                                characterName = '希希';
                                                Icon = CpuChipIcon;
                                                iconColor = 'text-orange-500';
                                                bgColor = 'bg-orange-50';
                                            } else if (desc.includes('mori') || desc.includes('墨墨')) {
                                                characterName = '墨墨';
                                                Icon = AcademicCapIcon;
                                                iconColor = 'text-amber-600';
                                                bgColor = 'bg-amber-50';
                                            } else if (desc.includes('pico') || desc.includes('皮可')) {
                                                characterName = '皮可';
                                                Icon = PaintBrushIcon;
                                                iconColor = 'text-blue-500';
                                                bgColor = 'bg-blue-50';
                                            }
                                        }

                                        return (
                                            <div key={record.id} className="flex justify-between items-center text-xs p-2.5 bg-[#F8F5EC]/50 rounded-xl hover:bg-[#F8F5EC] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
                                                        <Icon className={`w-4 h-4 ${iconColor}`} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[#4B4036] flex items-center gap-1.5">
                                                            {characterName} Use
                                                        </span>
                                                        <span className="text-[10px] text-[#8C7A6B]">{new Date(record.created_at).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 font-bold text-[#4B4036]">
                                                    <img src="/apple-icon.svg" alt="食量" className="w-3.5 h-3.5" />
                                                    <span>{record.amount > 0 ? '+' : ''}{record.amount}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

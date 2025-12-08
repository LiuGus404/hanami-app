'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    Bars3Icon,
    ChatBubbleLeftRightIcon,
    ChartBarIcon,
    PlusIcon,
    CpuChipIcon,
    SparklesIcon,
    PuzzlePieceIcon,
    Cog6ToothIcon,
    ArrowLeftIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSaasSupabaseClient } from '@/lib/supabase';
import MindBlockBuilder from '@/components/mind-block/MindBlockBuilder';

export default function MindBuilderPage() {
    const router = useRouter();
    const { user, loading } = useSaasAuth();
    const supabase = getSaasSupabaseClient();
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/auth/login');
        }
    };
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const activeView = 'mind'; // Force active view for styling

    const handleTabClick = (tabId: string) => {
        if (tabId === 'mind') return;
        // Navigate back to main companions page with the selected view
        // In a real app, we might want to use query params or context
        router.push('/aihome/ai-companions');
    };

    return (
        <div className="min-h-screen bg-[#FFF9F2] relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#4B4036 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            <AppSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                currentPath="/aihome/mind-builder"
            />

            {/* 頂部導航欄 */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                            {/* 選單按鈕 */}
                            <motion.button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40 flex-shrink-0"
                                title={sidebarOpen ? "關閉選單" : "開啟選單"}
                            >
                                <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4B4036]" />
                            </motion.button>

                            <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0">
                                <Image
                                    src="/@hanami.png"
                                    alt="HanamiEcho Logo"
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                {/* 桌面版：顯示完整標題 */}
                                <div className="hidden sm:block">
                                    <h1 className="text-xl font-bold text-[#4B4036]">HanamiEcho</h1>
                                    <p className="text-sm text-[#2B3A3B]">您的AI工作和學習夥伴</p>
                                </div>

                                {/* 移動端：只顯示 "AI 伙伴" */}
                                <div className="block sm:hidden">
                                    <h1 className="text-lg font-bold text-[#4B4036]">
                                        AI 伙伴
                                    </h1>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">


                            {/* 桌面版：顯示完整的視圖切換 */}


                            {/* 移動端/平板：合併按鈕 + 下拉菜單 */}
                            {/* 統一的下拉菜單 (桌面 + 移動端) */}
                            <UnifiedRightContent user={user} onLogout={handleLogout} />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col h-[calc(100vh-64px)] relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Back Button */}
                <div className="mb-4">
                    <button
                        onClick={() => router.push('/aihome/ai-companions?view=mind')}
                        className="flex items-center space-x-2 text-[#4B4036]/60 hover:text-[#4B4036] transition-colors group"
                    >
                        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">返回思維積木</span>
                    </button>
                </div>
                <MindBlockBuilder />
            </main>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    SparklesIcon,
    HeartIcon,
    UserGroupIcon,
    AcademicCapIcon,
    HomeIcon,
    UserIcon,
    CpuChipIcon,
    BeakerIcon,
    RocketLaunchIcon,
    GlobeAltIcon,
    PuzzlePieceIcon,
} from '@heroicons/react/24/outline';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import LuLuCharacterSimpleBlink from '@/components/3d/LuLuCharacterSimpleBlink';
import AppSidebar from '@/components/AppSidebar';
import UnifiedNavbar from '@/components/UnifiedNavbar';
import MobileBottomNavigation from '@/components/ui/MobileBottomNavigation';

// Feature Card Component (matching landing page)
const FeatureCard = ({ title, description, icon: Icon, delay = 0, className = '' }: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    delay?: number;
    className?: string;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`pastel-card ${className} p-6 flex flex-col items-center text-center cursor-pointer`}
    >
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm">
            <Icon className="w-7 h-7 text-[#FFAB91]" />
        </div>
        <h3 className="text-lg font-bold text-[#4A4A4A] mb-2">{title}</h3>
        <p className="text-sm text-[#7A7A7A]">{description}</p>
    </motion.div>
);

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading, logout } = useSaasAuth();
    const [isLoaded, setIsLoaded] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/aihome/auth/login');
        } catch (error) {
            console.error('登出失敗:', error);
            router.push('/aihome/auth/login');
        }
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/aihome/auth/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
                    <p className="text-[#4B4036]">載入中...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // 核心 AI 功能 - 使用 pastel card 風格
    const coreAIFeatures = [
        {
            icon: SparklesIcon,
            title: 'AI 工作伙伴',
            description: '讓 AI 解決你工作/日常/教學的問題',
            color: 'pastel-card-peach',
            href: '/aihome/ai-companions'
        },
        {
            icon: AcademicCapIcon,
            title: '學習陪伴',
            description: '與老師安排學習路徑，陪伴學習和成長',
            color: 'pastel-card-mint',
            href: '/aihome/course-activities'
        },
        {
            icon: HeartIcon,
            title: '情感支持',
            description: '與你互動，給予溫暖的陪伴與溝通',
            color: 'pastel-card-lavender',
            href: '/aihome/emotional-support'
        },
        {
            icon: UserGroupIcon,
            title: '個性化記憶',
            description: '根據您的需求定制專屬 AI 角色',
            color: 'pastel-card-sky',
            href: '/aihome/memory-bank'
        }
    ];

    // 快速導航
    const quickNav = [
        { icon: HomeIcon, label: '首頁', href: '/' },
        { icon: CpuChipIcon, label: '換腦工房', href: '/aihome/ai-companions' },
        { icon: UserGroupIcon, label: '用戶連結', href: '/aihome/parent/bound-students' },
        { icon: BeakerIcon, label: '遊樂場', href: '/aihome/playground' },
        { icon: AcademicCapIcon, label: '管理者連結', href: '/aihome/teacher-link' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] relative overflow-hidden">
            {/* Organic Blob Decorations */}
            <div className="organic-blob w-[400px] h-[400px] bg-[#FFD59A]/30 top-[-10%] right-[-10%]" />
            <div className="organic-blob w-[300px] h-[300px] bg-[#C084FC]/20 bottom-[20%] left-[-5%]" style={{ animationDelay: '5s' }} />

            <div className="flex relative z-10">
                {/* 側邊欄選單 */}
                <AppSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    currentPath="/aihome/dashboard"
                />

                {/* 主內容區域 */}
                <div className="flex-1 flex flex-col">
                    <UnifiedNavbar
                        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                        user={user}
                        onLogout={handleLogout}
                        onLogin={() => router.push('/aihome/auth/login')}
                        onRegister={() => router.push('/aihome/auth/register')}
                        customRightContent={<UnifiedRightContent user={user} onLogout={handleLogout} />}
                    />

                    {/* 主內容區域 */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 min-h-full pb-24 md:pb-8">
                        {/* 歡迎區域 with Blinking Doll */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-12"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-[#4B4036] text-sm font-bold mb-6"
                            >
                                <SparklesIcon className="w-4 h-4 text-[#FFD59A]" />
                                <span>歡迎回來，{user?.full_name || user?.email?.split('@')[0] || '用戶'}！</span>
                            </motion.div>

                            <h1 className="text-4xl lg:text-5xl font-bold text-[#4B4036] mb-4">
                                HanamiEcho 控制台
                            </h1>
                            <p className="text-lg text-[#6B5D52] max-w-2xl mx-auto mb-8">
                                您的智能 AI 助手，為兒童和成人提供個性化的協作體驗和情感支持
                            </p>

                            {/* Blinking Doll */}
                            <div className="flex justify-center mb-8">
                                <div className="relative w-[280px] h-[280px]">
                                    <LuLuCharacterSimpleBlink />
                                </div>
                            </div>
                        </motion.div>

                        {/* 快速導航 - 3D Button Style */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mb-12"
                        >
                            <div className="flex flex-wrap justify-center gap-4">
                                {quickNav.map((item, index) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
                                        transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                    >
                                        <Link href={item.href}>
                                            <button className="btn-3d flex items-center gap-2 text-sm">
                                                <item.icon className="w-5 h-5" />
                                                <span>{item.label}</span>
                                            </button>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNavigation />
        </div>
    );
}
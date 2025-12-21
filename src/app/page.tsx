'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import LuLuCharacterSimpleBlink from '@/components/3d/LuLuCharacterSimpleBlink';
import {
    BeakerIcon,
    AcademicCapIcon,
    UserGroupIcon,
    SparklesIcon,
    CpuChipIcon,
    GlobeAltIcon,
    RocketLaunchIcon,
    PuzzlePieceIcon,
    ChartBarIcon,
    ClipboardIcon,
    CurrencyDollarIcon,
    DevicePhoneMobileIcon,
    CalendarDaysIcon,
    ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import { OrganizationProvider } from '@/contexts/OrganizationContext';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import AppSidebar from '@/components/AppSidebar';
import UnifiedNavbar from '@/components/UnifiedNavbar';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import MobileBottomNavigation from '@/components/ui/MobileBottomNavigation';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import PhysicsParticleSystem from '@/components/ui/PhysicsParticleSystem';

// --- Components ---

const ParticleBackground = ({ type = 'air-clock' }: { type?: 'air-clock' | 'growth-tree' | 'mind-switch' }) => {
    // Detect mobile for reduced particle count
    const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR
    const [particles, setParticles] = useState<any[]>([]);

    // Colors based on type
    const colors = {
        'air-clock': ['#E0F2FE', '#BAE6FD', '#7DD3FC'], // Light blues / Air
        'growth-tree': ['#D1FAE5', '#6EE7B7', '#34D399'], // Greens / Growth
        'mind-switch': ['#F3E8FF', '#D8B4FE', '#C084FC'], // Purples / Brain
    }[type] || ['#FFFFFF'];

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Reduce particle count on mobile for better performance
        const count = isMobile ? 10 : 30;
        const newParticles = Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 1,
            duration: Math.random() * 10 + 10,
            delay: Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)]
        }));
        setParticles(newParticles);
    }, [isMobile, type]);

    // Skip rendering on mobile for even better performance
    if (isMobile) return null;

    if (particles.length === 0) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full opacity-30"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        x: [0, Math.random() * 50 - 25, 0],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: p.delay
                    }}
                />
            ))}
        </div>
    );
};

const ClientSideParticles = () => {
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        setParticles([...Array(5)].map((_, i) => ({
            id: i,
            width: Math.random() * 50 + 10 + 'px',
            height: Math.random() * 50 + 10 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDuration: Math.random() * 5 + 5 + 's',
            animationDelay: Math.random() * 5 + 's'
        })));
    }, []);

    if (particles.length === 0) return null;

    return (
        <>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute bg-[#818CF8]/30 rounded-full animate-float"
                    style={{
                        width: p.width,
                        height: p.height,
                        left: p.left,
                        top: p.top,
                        animationDuration: p.animationDuration,
                        animationDelay: p.animationDelay
                    }}
                />
            ))}
        </>
    );
};

const Section = ({
    children,
    className = "",
    id = "",
    particleType
}: {
    children: React.ReactNode;
    className?: string;
    id?: string;
    particleType?: 'air-clock' | 'growth-tree' | 'mind-switch';
}) => {
    return (
        <section id={id} className={`relative min-h-screen w-full flex flex-col items-center justify-center p-6 ${className}`}>
            {particleType && <ParticleBackground type={particleType} />}
            <div className="relative z-10 w-full max-w-7xl">
                {children}
            </div>
        </section>
    );
};

const FeatureCard = ({ title, description, icon: Icon, delay = 0, className = "" }: any) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
            className={`pastel-card ${className}`}
        >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFAB91] to-[#FFD1AA] flex items-center justify-center mb-4 text-white">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#4A4A4A] mb-2">{title}</h3>
            <p className="text-[#7A7A7A]">{description}</p>
        </motion.div>
    );
}

// --- Main Page ---

export default function LandingPage() {
    // Scroll container ref for framer-motion scroll tracking
    const mainRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ container: mainRef });
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

    // Mobile detection for performance optimization
    const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR

    // Navigation State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useSaasAuth();
    const router = useRouter();

    // Detect mobile on mount
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/aihome/auth/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <OrganizationProvider>
            <MusicPlayerProvider>
                <div className="h-screen overflow-hidden bg-[#FFF8F0]">
                    <div className="flex h-full">
                        {/* Sidebar */}
                        <AppSidebar
                            isOpen={sidebarOpen}
                            onClose={() => setSidebarOpen(false)}
                            currentPath="/"
                        />

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                            <main ref={mainRef} className="flex-1 overflow-y-auto scrollbar-hide">
                                {/* Top Navbar - Sticky inside scrollable area */}
                                <UnifiedNavbar
                                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                                    user={user}
                                    onLogout={handleLogout}
                                    onLogin={() => router.push('/aihome/auth/login')}
                                    onRegister={() => router.push('/aihome/auth/register')}
                                    customRightContent={<UnifiedRightContent user={user} onLogout={handleLogout} />}
                                />
                                <div className="flex flex-col font-sans">
                                    {/* --- Header Section --- */}
                                    <section className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] overflow-hidden">
                                        {/* Organic Blob Decorations */}
                                        <div className="organic-blob w-[400px] h-[400px] bg-[#FFD59A]/50 top-[-10%] left-[-10%]" />
                                        <div className="organic-blob w-[300px] h-[300px] bg-[#EBC9A4]/40 top-[20%] right-[-5%]" style={{ animationDelay: '5s' }} />
                                        <div className="organic-blob w-[250px] h-[250px] bg-[#A67C52]/30 bottom-[10%] left-[5%]" style={{ animationDelay: '10s' }} />

                                        <motion.div
                                            style={isMobile ? {} : { opacity, scale }}
                                            className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 max-w-7xl"
                                        >
                                            {/* Text Content */}
                                            <div className="flex-1 text-center lg:text-left space-y-8">
                                                <motion.div
                                                    initial={{ opacity: 0, x: -50 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.8 }}
                                                >
                                                    <h1 className="text-6xl lg:text-8xl font-black tracking-tight text-[#4B4036] mb-4">
                                                        Hanami<span className="text-[#A67C52]">Echo</span>
                                                    </h1>
                                                    <p className="text-xl lg:text-2xl font-medium text-[#6B5D52]">
                                                        從管理到教學，我們一起用 AI <span className="text-[#A67C52] font-bold">重新定義教育</span>。
                                                    </p>
                                                    <p className="text-lg font-medium text-[#8B7E74] italic tracking-wide mt-2">
                                                        Built by educator for educators
                                                    </p>
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.8, delay: 0.2 }}
                                                    className="flex flex-wrap gap-4 justify-center lg:justify-start"
                                                >
                                                    <Link href="/aihome/auth/login">
                                                        <button className="btn-3d btn-3d-accent text-lg">
                                                            開始體驗
                                                        </button>
                                                    </Link>
                                                    <button className="btn-3d text-lg">
                                                        了解更多
                                                    </button>
                                                </motion.div>
                                            </div>

                                            {/* Blinking Doll */}
                                            <div className="flex-1 flex justify-center items-center relative h-[500px] w-full max-w-[500px]">
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.8, delay: 0.1 }}
                                                    className="relative z-20"
                                                >
                                                    <div className="absolute inset-0 bg-[#FFD59A]/30 blur-[100px] rounded-full scale-110 -z-10" />
                                                    <LuLuCharacterSimpleBlink size="xxl" />
                                                </motion.div>
                                            </div>
                                        </motion.div>

                                        {/* Scroll Indicator */}
                                        <motion.div
                                            animate={{ y: [0, 10, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#7A7A7A]/50"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-sm tracking-widest uppercase">Scroll</span>
                                                <div className="w-[1px] h-12 bg-gradient-to-b from-[#7A7A7A]/0 via-[#7A7A7A]/50 to-[#7A7A7A]/0" />
                                            </div>
                                        </motion.div>
                                    </section>

                                    {/* Fog Transition */}
                                    <div className="fog-divider" />

                                    {/* --- Student & Teacher Management --- */}
                                    <section className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#FFFDF8] via-[#FFF9F2] to-[#F8F5EC] overflow-hidden">
                                        {/* Organic Blob Decorations */}
                                        <div className="organic-blob w-[350px] h-[350px] bg-[#34D399]/30 top-[10%] right-[-10%]" />
                                        <div className="organic-blob w-[200px] h-[200px] bg-[#FFD59A]/40 bottom-[20%] left-[-5%]" style={{ animationDelay: '7s' }} />

                                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                                            <div className="flex flex-col items-center text-center mb-16">
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-[#34D399] text-sm font-bold mb-4"
                                                >
                                                    <UserGroupIcon className="w-4 h-4" />
                                                    <span>智能校園管理</span>
                                                </motion.div>
                                                <h2 className="text-4xl lg:text-5xl font-bold text-[#4B4036] mb-6">教育者的AI管理系統</h2>
                                                <p className="max-w-2xl text-lg text-[#6B5D52]">
                                                    讓數據成為成長的養分。透過視覺化的成長樹，直觀地記錄每一個學習里程碑。
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                                                <FeatureCard
                                                    title="學習進度記錄"
                                                    description="獨創成長樹系統，將抽象的學習數據轉化為可視化的成長過程，讓進步看得見。"
                                                    icon={ChartBarIcon}
                                                    delay={0.1}
                                                    className="pastel-card-mint"
                                                />
                                                <FeatureCard
                                                    title="課堂與考勤"
                                                    description="智能化的請假與課堂管理系統，自動化處理繁瑣行政，讓老師專注教學。"
                                                    icon={ClipboardIcon}
                                                    delay={0.2}
                                                    className="pastel-card-peach"
                                                />
                                                <FeatureCard
                                                    title="財政與收生"
                                                    description="一站式管理學費收支與新生入學流程，清晰透明的財務報表。"
                                                    icon={CurrencyDollarIcon}
                                                    delay={0.3}
                                                    className="pastel-card-sky"
                                                />
                                                <FeatureCard
                                                    title="家長連結 App"
                                                    description="家長可用的 App 查看孩子進度和請假系統。"
                                                    icon={DevicePhoneMobileIcon}
                                                    delay={0.4}
                                                    className="pastel-card-lavender"
                                                />
                                                <FeatureCard
                                                    title="多角色 AI 協助"
                                                    description="專屬多角色 AI 團隊，全方位為您提供教學與行政協助。"
                                                    icon={ChatBubbleBottomCenterTextIcon}
                                                    delay={0.5}
                                                    className="pastel-card-mint"
                                                />
                                                <FeatureCard
                                                    title="員工排班管理"
                                                    description="智能化的員工排班與管理功能，輕鬆調度人力資源。"
                                                    icon={CalendarDaysIcon}
                                                    delay={0.6}
                                                    className="pastel-card-peach"
                                                />
                                            </div>


                                            {/* Entry Button */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                className="mt-12 text-center"
                                            >
                                                <Link href="/aihome/teacher-link">
                                                    <button className="btn-3d btn-3d-accent text-lg">
                                                        進入管理系統 →
                                                    </button>
                                                </Link>
                                            </motion.div>
                                        </div>
                                    </section>

                                    {/* Fog Transition */}
                                    <div className="fog-divider" />

                                    {/* --- MindSwitch Workshop --- */}
                                    <section className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#F8F5EC] via-[#FFFDF8] to-[#FFF9F2] overflow-hidden">
                                        {/* Organic Blob Decorations */}
                                        <div className="organic-blob w-[400px] h-[400px] bg-[#C084FC]/30 top-[-5%] left-[-15%]" />
                                        <div className="organic-blob w-[300px] h-[300px] bg-[#FFD59A]/40 bottom-[5%] right-[-10%]" style={{ animationDelay: '8s' }} />

                                        <div className="flex flex-col lg:flex-row items-center gap-16 max-w-7xl relative z-10">
                                            <div className="flex-1 space-y-8">
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                >
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-[#7E22CE] text-sm font-bold mb-4">
                                                        <CpuChipIcon className="w-4 h-4" />
                                                        <span>MindSwitch 換腦工房</span>
                                                    </div>
                                                    <h2 className="text-4xl lg:text-5xl font-bold text-[#4B4036] mb-6">一鍵切換您的 AI 思考模式</h2>
                                                    <p className="text-lg text-[#6B5D52] mb-8 leading-relaxed">
                                                        解鎖地表最強 AI 算力。無論是邏輯推理、創意發想還是程式編寫，MindSwitch 都能隨時為您切換最適合的「大腦」。
                                                    </p>

                                                    <div className="flex flex-wrap gap-4 mb-8">
                                                        {[
                                                            { name: 'ChatGPT', color: 'bg-[#6A9A8B] shadow-[#4E7A6D]' },
                                                            { name: 'Gemini', color: 'bg-[#4E8CCF] shadow-[#3A6FA3]' },
                                                            { name: 'Claude', color: 'bg-[#D97757] shadow-[#B05B3F]' },
                                                            { name: 'Grok', color: 'bg-[#333333] shadow-[#000000]' },
                                                            { name: 'Deepseek', color: 'bg-[#4B6CC1] shadow-[#355299]' },
                                                            { name: 'Qwen', color: 'bg-[#6D4CC4] shadow-[#523696]' },
                                                        ].map((model) => (
                                                            <span
                                                                key={model.name}
                                                                className={`px-6 py-3 rounded-2xl text-white font-bold text-sm tracking-wide shadow-[0_4px_0] ${model.color} transform active:translate-y-1 active:shadow-none transition-all cursor-default select-none border-b-4 border-black/10`}
                                                            >
                                                                {model.name}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="pastel-card pastel-card-lavender flex items-start gap-4">
                                                            <div className="p-2 bg-white rounded-xl text-[#9C27B0]"><PuzzlePieceIcon className="w-6 h-6" /></div>
                                                            <div>
                                                                <h4 className="font-bold text-[#4A4A4A]">思維積木</h4>
                                                                <p className="text-sm text-[#7A7A7A]">模組化構建思考流程</p>
                                                            </div>
                                                        </div>
                                                        <div className="pastel-card pastel-card-peach flex items-start gap-4">
                                                            <div className="p-2 bg-white rounded-xl text-[#FF9800]"><UserGroupIcon className="w-6 h-6" /></div>
                                                            <div>
                                                                <h4 className="font-bold text-[#4A4A4A]">多角色協作</h4>
                                                                <p className="text-sm text-[#7A7A7A]">專屬 AI 團隊同時工作</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            <div className="flex-1 relative">
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    whileInView={{ opacity: 1, scale: 1 }}
                                                    viewport={{ once: true }}
                                                    className="relative z-10 grid grid-cols-2 gap-4"
                                                >
                                                    {/* Decorative Abstract UI Blocks representing Mind Blocks */}
                                                    <div className="col-span-2 h-40 bg-gradient-to-r from-[#D8B4FE] to-[#FFAB91] rounded-3xl shadow-lg opacity-90 animate-float" />
                                                    <div className="h-40 bg-gradient-to-br from-[#B3E5FC] to-[#A5D6A7] rounded-3xl shadow-lg opacity-90 animate-float" style={{ animationDelay: '1s' }} />
                                                    <div className="h-40 bg-gradient-to-bl from-[#FFECD2] to-[#FFD1AA] rounded-3xl shadow-lg opacity-90 animate-float" style={{ animationDelay: '2s' }} />
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Entry Button - Centered */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            className="mt-12 flex justify-center relative z-10"
                                        >
                                            <Link href="/aihome/ai-companions">
                                                <button className="btn-3d btn-3d-accent text-lg">
                                                    一鍵換腦 →
                                                </button>
                                            </Link>
                                        </motion.div>
                                    </section>

                                    {/* Fog Transition */}
                                    <div className="fog-divider" />

                                    {/* --- Parent Connection --- */}
                                    <section className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] overflow-hidden">
                                        {/* Organic Blob Decorations */}
                                        <div className="organic-blob w-[300px] h-[300px] bg-[#FFD59A]/50 top-[5%] left-[10%]" style={{ animationDelay: '3s' }} />
                                        <div className="organic-blob w-[400px] h-[400px] bg-[#EBC9A4]/40 bottom-[-10%] right-[-5%]" style={{ animationDelay: '12s' }} />

                                        <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                            >
                                                <h2 className="text-4xl lg:text-5xl font-bold text-[#4B4036] mb-6">用戶連結，查看學習和成長</h2>
                                                <p className="text-lg text-[#6B5D52]">
                                                    打破隔閡，利用 AI 前沿科技解決學習難題，讓您隨時掌握每一個學習和成長瞬間。
                                                </p>
                                            </motion.div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full relative z-10">
                                            {[
                                                { title: '即時進度', icon: RocketLaunchIcon, desc: '隨時查看孩子的學習軌跡與成果', color: 'peach' },
                                                { title: '成長輔助', icon: SparklesIcon, desc: 'AI 輔助分析，提供個性化建議', color: 'mint' },
                                                { title: '問題解決', icon: GlobeAltIcon, desc: '結合前沿科技，解決成長痛點', color: 'sky' }
                                            ].map((item, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    whileInView={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    viewport={{ once: true }}
                                                    className={`pastel-card pastel-card-${item.color} flex flex-col items-center text-center p-8`}
                                                >
                                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[#FFAB91] mb-6 shadow-sm">
                                                        <item.icon className="w-8 h-8" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-[#4A4A4A] mb-3">{item.title}</h3>
                                                    <p className="text-[#7A7A7A]">{item.desc}</p>
                                                </motion.div>
                                            ))}
                                        </div>


                                        {/* Entry Button */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            className="w-full mt-12 flex justify-center relative z-10"
                                        >
                                            <Link href="/aihome/parent/bound-students">
                                                <button className="btn-3d btn-3d-accent text-lg">
                                                    用戶入口 →
                                                </button>
                                            </Link>
                                        </motion.div>
                                    </section>

                                    {/* --- Course Platform & AI Lab --- */}
                                    <section className="relative min-h-[80vh] w-full flex flex-col items-center justify-center p-6 bg-[#4B4036] text-white overflow-hidden">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-6xl relative z-10">
                                            <motion.div
                                                initial={{ opacity: 0, x: -50 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                className="pastel-card pastel-card-peach p-12 relative overflow-hidden group"
                                            >
                                                <div className="relative z-10">
                                                    <AcademicCapIcon className="w-12 h-12 text-[#FFAB91] mb-6" />
                                                    <h3 className="text-3xl font-bold mb-4 text-[#4A4A4A]">課程平台</h3>
                                                    <p className="text-[#7A7A7A] text-lg mb-8">
                                                        匯聚優質教育資源，持續更新的多元化課程體系。
                                                    </p>
                                                    <Link href="/aihome/course-activities">
                                                        <button className="btn-3d btn-3d-accent text-sm">
                                                            進入課程 →
                                                        </button>
                                                    </Link>
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, x: 50 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                className="pastel-card pastel-card-lavender p-12 relative overflow-hidden group"
                                            >
                                                <div className="relative z-10">
                                                    <BeakerIcon className="w-12 h-12 text-[#9C27B0] mb-6" />
                                                    <h3 className="text-3xl font-bold mb-4 text-[#4A4A4A]">AI 實驗室</h3>
                                                    <p className="text-[#7A7A7A] text-lg mb-8">
                                                        探索未知的教育邊界，孵化未來的教學工具。
                                                    </p>
                                                    <Link href="/aihome/playground">
                                                        <button className="btn-3d btn-3d-purple text-sm">
                                                            立即試玩 →
                                                        </button>
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        </div>

                                        <div className="mt-24 text-center text-white/40 text-sm">
                                            © 2025 HanamiEcho. All rights reserved.
                                        </div>
                                    </section>
                                </div>
                                {/* Mobile Bottom Navigation - Injected at bottom of main content if needed, strictly speaking it's fixed */}
                                <MobileBottomNavigation />
                            </main>
                        </div>
                    </div>
                </div>
            </MusicPlayerProvider>
        </OrganizationProvider>
    );
}

// Missing icons helper


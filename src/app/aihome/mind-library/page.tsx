'use client';

import { useState, useEffect } from 'react';
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
    MagnifyingGlassIcon,
    ArrowLeftIcon,
    Square2StackIcon,
    CubeIcon
} from '@heroicons/react/24/outline';
import AppSidebar from '@/components/AppSidebar';
import MindBlockCard from '@/components/mind-block/MindBlockCard';
import { MindBlock } from '@/types/mind-block';
import { getSaasSupabaseClient } from '@/lib/supabase';

export default function MindLibraryPage() {
    const router = useRouter();
    const supabase = getSaasSupabaseClient();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showMobileDropdown, setShowMobileDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const activeView = 'mind'; // Force active view for styling

    // Library State
    const [activeTab, setActiveTab] = useState<'composition' | 'block'>('composition');
    const [blocks, setBlocks] = useState<MindBlock[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Blocks
    useEffect(() => {
        const fetchBlocks = async () => {
            setLoading(true);
            try {
                let query = supabase
                    .from('mind_blocks' as any)
                    .select('*')
                    .eq('is_public', true)
                    .order('likes_count', { ascending: false });

                if (activeTab === 'composition') {
                    query = query.eq('category', 'Composition');
                } else {
                    query = query.eq('is_template', true);
                }

                const { data, error } = await query;

                if (error) {
                    console.error('Error fetching blocks:', error);
                } else {
                    setBlocks((data as any) || []);
                }
            } catch (e) {
                console.error('Exception fetching blocks:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchBlocks();
    }, [activeTab]);

    const handleTabClick = (tabId: string) => {
        if (tabId === 'mind') return;
        router.push('/aihome/ai-companions?view=' + tabId);
    };

    const handleFork = (block: MindBlock) => {
        console.log('Forking block:', block.title);
        // If it's a composition, load it into the builder
        if (activeTab === 'composition') {
            // For now, just load it. In future, we might want to clone it first.
            router.push(`/aihome/mind-builder?compositionId=${block.id}`);
        } else {
            // For single block, maybe copy to clipboard or add to user's library?
            // Current builder doesn't support "adding single block from library" via URL yet easily without context.
            // Let's just alert for now or maybe open builder with it?
            alert('單一積木引用功能即將推出！');
        }
    };

    const filteredBlocks = blocks.filter(block =>
        block.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (block.description && block.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
                currentPath="/aihome/mind-library"
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
                            <div className="hidden md:flex items-center space-x-4">
                                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-xl p-1">
                                    {[
                                        { id: 'chat', label: '聊天室', icon: ChatBubbleLeftRightIcon },
                                        { id: 'roles', label: '角色', icon: CpuChipIcon },
                                        { id: 'mind', label: '思維積木', icon: PuzzlePieceIcon },
                                        { id: 'memory', label: '記憶', icon: SparklesIcon },
                                        { id: 'stats', label: '統計', icon: ChartBarIcon }
                                    ].map((tab) => (
                                        <motion.button
                                            key={tab.id}
                                            onClick={() => handleTabClick(tab.id)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${activeView === tab.id
                                                ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-lg'
                                                : 'text-[#4B4036] hover:bg-[#FFD59A]/20'
                                                }`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            <span>{tab.label}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* 移動端/平板：合併按鈕 + 下拉菜單 */}
                            <div className="flex md:hidden items-center space-x-2 relative">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowMobileDropdown(!showMobileDropdown)}
                                    className="relative flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                                >
                                    <motion.div
                                        animate={{
                                            rotate: showMobileDropdown ? 180 : 0
                                        }}
                                        transition={{
                                            duration: 0.3,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        <Cog6ToothIcon className="w-5 h-5" />
                                    </motion.div>
                                    <span className="text-sm font-medium">選單</span>
                                </motion.button>

                                <AnimatePresence>
                                    {showMobileDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                            className="absolute top-12 right-0 bg-white rounded-xl shadow-xl border border-[#EADBC8]/20 p-2 min-w-[180px] z-50"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {[
                                                { id: 'chat', label: '聊天室', icon: ChatBubbleLeftRightIcon },
                                                { id: 'roles', label: '角色', icon: CpuChipIcon },
                                                { id: 'mind', label: '思維積木', icon: PuzzlePieceIcon },
                                                { id: 'memory', label: '記憶', icon: SparklesIcon },
                                                { id: 'stats', label: '統計', icon: ChartBarIcon }
                                            ].map((tab) => (
                                                <motion.button
                                                    key={tab.id}
                                                    whileHover={{ backgroundColor: "#FFFBEB" }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        handleTabClick(tab.id);
                                                        setShowMobileDropdown(false);
                                                    }}
                                                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${activeView === tab.id
                                                        ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white'
                                                        : 'text-[#4B4036]'
                                                        }`}
                                                >
                                                    <tab.icon className="w-5 h-5" />
                                                    <span className="text-sm font-medium">{tab.label}</span>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/aihome/ai-companions?view=mind')}
                        className="flex items-center space-x-2 text-[#4B4036]/60 hover:text-[#4B4036] transition-colors group"
                    >
                        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">返回思維積木</span>
                    </button>
                </div>

                {/* Header Section */}
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-[#4B4036] mb-3 tracking-tight">
                        思維積木庫
                    </h1>
                    <p className="text-lg text-[#4B4036]/60 max-w-2xl mx-auto mb-8">
                        探索社群分享的智慧結晶，一鍵 Remix 打造您的專屬 AI 助手
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-xl mx-auto group mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative bg-white rounded-2xl shadow-lg border border-[#EADBC8] flex items-center p-2 transition-transform transform group-hover:-translate-y-0.5">
                            <MagnifyingGlassIcon className="w-6 h-6 text-[#4B4036]/40 ml-3" />
                            <input
                                type="text"
                                placeholder="搜尋積木、作者或標籤..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-transparent border-none text-[#4B4036] placeholder-[#4B4036]/30 focus:ring-0 text-base font-medium"
                            />
                            <button className="px-6 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all transform hover:scale-105 active:scale-95">
                                搜尋
                            </button>
                        </div>
                    </div>

                    {/* Type Tabs */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-[#EADBC8] flex gap-1">
                            <button
                                onClick={() => setActiveTab('composition')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'composition'
                                    ? 'bg-white text-[#4B4036] shadow-sm border border-[#EADBC8]'
                                    : 'text-[#4B4036]/60 hover:bg-white/50'
                                    }`}
                            >
                                <Square2StackIcon className="w-5 h-5" />
                                精選組合
                            </button>
                            <button
                                onClick={() => setActiveTab('block')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${activeTab === 'block'
                                    ? 'bg-white text-[#4B4036] shadow-sm border border-[#EADBC8]'
                                    : 'text-[#4B4036]/60 hover:bg-white/50'
                                    }`}
                            >
                                <CubeIcon className="w-5 h-5" />
                                單一積木
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs (Optional - kept for future use or removed if not needed for now) */}
                {/* <div className="flex flex-col items-center space-y-4 mb-8"> ... </div> */}

                {/* Grid */}
                <div className="pb-20 px-1">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A]"></div>
                        </div>
                    ) : filteredBlocks.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <PuzzlePieceIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">沒有找到相關的{activeTab === 'composition' ? '組合' : '積木'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredBlocks.map(block => (
                                <div key={block.id} className="h-[280px]">
                                    <MindBlockCard
                                        block={block}
                                        onFork={handleFork}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

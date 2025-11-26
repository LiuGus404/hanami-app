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
    TrashIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSaasSupabaseClient } from '@/lib/supabase';

export default function MyMindLibraryPage() {
    const router = useRouter();
    const { user, loading } = useSaasAuth();
    const supabase = getSaasSupabaseClient();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showMobileDropdown, setShowMobileDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const activeView = 'mind'; // Force active view for styling
    const [myCompositions, setMyCompositions] = useState<any[]>([]);
    const [loadingCompositions, setLoadingCompositions] = useState(true);

    // Fetch user's compositions
    useEffect(() => {
        const fetchCompositions = async () => {
            if (!user?.id) return;
            setLoadingCompositions(true);
            try {
                const { data, error } = await supabase
                    .from('mind_blocks' as any)
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('category', 'Composition')
                    .order('updated_at', { ascending: false });

                if (error) {
                    console.error('Error fetching compositions:', error);
                } else {
                    setMyCompositions(data || []);
                }
            } catch (e) {
                console.error('Exception fetching compositions:', e);
            } finally {
                setLoadingCompositions(false);
            }
        };

        if (!loading && user) {
            fetchCompositions();
        }
    }, [user, loading]);

    const handleTabClick = (tabId: string) => {
        if (tabId === 'mind') return;
        router.push('/aihome/ai-companions?view=' + tabId);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('確定要刪除此組合嗎？')) {
            const { error } = await supabase
                .from('mind_blocks' as any)
                .delete()
                .eq('id', id);

            if (error) {
                alert('刪除失敗');
            } else {
                setMyCompositions(myCompositions.filter(c => c.id !== id));
            }
        }
    };

    const filteredCompositions = myCompositions.filter(comp =>
        comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (comp.description && comp.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
                currentPath="/aihome/my-mind-library"
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
                        我的積木庫
                    </h1>
                    <p className="text-lg text-[#4B4036]/60 max-w-2xl mx-auto mb-8">
                        管理您儲存的思維積木組合，隨時載入並繼續編輯
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-xl mx-auto group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#A78BFA] to-[#FFD59A] rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative bg-white rounded-2xl shadow-lg border border-[#EADBC8] flex items-center p-2 transition-transform transform group-hover:-translate-y-0.5">
                            <MagnifyingGlassIcon className="w-6 h-6 text-[#4B4036]/40 ml-3" />
                            <input
                                type="text"
                                placeholder="搜尋我的積木..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-transparent border-none text-[#4B4036] placeholder-[#4B4036]/30 focus:ring-0 text-base font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="pb-20 px-1">
                    {loadingCompositions ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A78BFA]"></div>
                        </div>
                    ) : filteredCompositions.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <PuzzlePieceIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">您還沒有儲存任何積木組合</p>
                            <button
                                onClick={() => router.push('/aihome/mind-builder')}
                                className="mt-4 px-6 py-2 bg-[#FFD59A] text-[#4B4036] rounded-xl font-bold hover:bg-[#FFC56D] transition-colors"
                            >
                                去創建一個？
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredCompositions.map((comp) => (
                                <motion.div
                                    key={comp.id}
                                    whileHover={{ y: -5 }}
                                    className="bg-white rounded-2xl border border-[#EADBC8] overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col h-[280px]"
                                >
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#A78BFA]/10 flex items-center justify-center text-2xl">
                                                🧩
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(comp.id, e)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="刪除"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <h3 className="text-xl font-bold text-[#4B4036] mb-2 line-clamp-1">{comp.title}</h3>
                                        <p className="text-[#4B4036]/60 text-sm line-clamp-3 mb-4">
                                            {comp.description || '無描述'}
                                        </p>
                                        <div className="text-xs text-[#4B4036]/40">
                                            更新於: {new Date(comp.updated_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-[#EADBC8] bg-[#FFF9F2]/30">
                                        <button
                                            onClick={() => router.push(`/aihome/mind-builder?compositionId=${comp.id}`)}
                                            className="w-full py-2 bg-[#A78BFA] text-white rounded-xl font-bold hover:bg-[#8B5CF6] transition-colors shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <PuzzlePieceIcon className="w-4 h-4" />
                                            載入
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

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
    CubeIcon,
    UserIcon,
    PaintBrushIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    LightBulbIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowPathIcon,
    HeartIcon
} from '@heroicons/react/24/outline';
import AppSidebar from '@/components/AppSidebar';
import { MindBlock, MindBlockType } from '@/types/mind-block';
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
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

    // 積木類型標籤映射
    const blockTypeLabels: Record<MindBlockType, string> = {
        'role': '角色',
        'style': '風格',
        'context': '背景',
        'rule': '規則',
        'task': '任務',
        'variable': '變數',
        'search': '搜尋',
        'reason': '推理',
        'output': '輸出'
    };

    // 積木類型圖標和顏色配置
    const blockTypeConfig: Record<string, { icon: any; color: string; bg: string; borderColor: string }> = {
        'role': { 
            icon: UserIcon, 
            color: 'text-purple-600', 
            bg: 'bg-purple-100', 
            borderColor: 'border-purple-300' 
        },
        'style': { 
            icon: PaintBrushIcon, 
            color: 'text-pink-600', 
            bg: 'bg-pink-100', 
            borderColor: 'border-pink-300' 
        },
        'context': { 
            icon: DocumentTextIcon, 
            color: 'text-blue-600', 
            bg: 'bg-blue-100', 
            borderColor: 'border-blue-300' 
        },
        'rule': { 
            icon: ExclamationTriangleIcon, 
            color: 'text-red-600', 
            bg: 'bg-red-100', 
            borderColor: 'border-red-300' 
        },
        'task': { 
            icon: CubeIcon, 
            color: 'text-amber-600', 
            bg: 'bg-amber-100', 
            borderColor: 'border-amber-300' 
        },
        'search': { 
            icon: MagnifyingGlassIcon, 
            color: 'text-cyan-600', 
            bg: 'bg-cyan-100', 
            borderColor: 'border-cyan-300' 
        },
        'reason': { 
            icon: LightBulbIcon, 
            color: 'text-yellow-600', 
            bg: 'bg-yellow-100', 
            borderColor: 'border-yellow-300' 
        },
        'variable': { 
            icon: PuzzlePieceIcon, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-100', 
            borderColor: 'border-indigo-300' 
        },
        'output': { 
            icon: SparklesIcon, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-100', 
            borderColor: 'border-emerald-300' 
        }
    };

    // 獲取組合中的積木類型列表
    const getBlockTypesFromComposition = (composition: any): string[] => {
        if (!composition.content_json?.blocks || !Array.isArray(composition.content_json.blocks)) {
            return [];
        }
        const types = composition.content_json.blocks.map((block: any) => block.type).filter(Boolean);
        return Array.from(new Set(types)); // 去重
    };

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

    const handleLoad = (block: MindBlock) => {
        console.log('載入積木:', block.title);
        // 無論是組合還是單一積木，都載入到 builder
        router.push(`/aihome/mind-builder?compositionId=${block.id}`);
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
                                思維積木組合
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
                            {filteredBlocks.map((item) => {
                                const isComposition = activeTab === 'composition';
                                const blockTypes = isComposition 
                                    ? getBlockTypesFromComposition(item)
                                    : item.block_type ? [item.block_type] : [];

                                return (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ y: -5 }}
                                        className="group relative h-full"
                                    >
                                        <div className="absolute inset-0 bg-white/40 rounded-2xl transform translate-y-2 translate-x-0 transition-transform group-hover:translate-y-3 border border-[#EADBC8]"></div>
                                        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-[#EADBC8] p-5 h-full flex flex-col transition-transform transform group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-[#FFD59A]">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF9F2] to-[#FFF0D4] flex items-center justify-center border border-[#EADBC8] shadow-sm group-hover:shadow-md transition-all flex-shrink-0">
                                                        {isComposition ? (
                                                            <Square2StackIcon className="w-6 h-6 text-[#4B4036]" />
                                                        ) : (
                                                            <CubeIcon className="w-6 h-6 text-[#4B4036]" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FFB6C1]/20 to-[#FFD59A]/20 text-[#4B4036] border border-[#EADBC8]">
                                                                {isComposition ? '組合' : '積木'}
                                                            </span>
                                                            {item.is_official && (
                                                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white">
                                                                    官方
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="font-bold text-[#4B4036] text-lg leading-tight group-hover:text-[#FFB6C1] transition-colors line-clamp-1">
                                                            {item.title}
                                                        </h3>
                                                        <div className="flex items-center text-xs text-[#4B4036]/60 mt-1">
                                                            <UserIcon className="w-3.5 h-3.5 mr-1.5" />
                                                            <span>{item.user_id === 'system' ? '官方' : `用戶 ${item.user_id.substring(0, 8)}`}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Block Visualization - 顯示積木拼接圖示 */}
                                            {blockTypes.length > 0 && (
                                                <div className="mb-6 flex-1 flex items-center justify-center min-h-[100px]">
                                                    <div className="flex items-center gap-3 flex-wrap justify-center">
                                                        {blockTypes.map((type, idx) => {
                                                            const config = blockTypeConfig[type] || {
                                                                icon: PuzzlePieceIcon,
                                                                color: 'text-gray-600',
                                                                bg: 'bg-gray-100',
                                                                borderColor: 'border-gray-300'
                                                            };
                                                            const Icon = config.icon;
                                                            const typeLabel = blockTypeLabels[type as MindBlockType] || type;
                                                            return (
                                                                <motion.div
                                                                    key={idx}
                                                                    initial={{ scale: 0, rotate: -180 }}
                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                    transition={{
                                                                        delay: idx * 0.1,
                                                                        type: "spring",
                                                                        stiffness: 200,
                                                                        damping: 15
                                                                    }}
                                                                    whileHover={{ 
                                                                        scale: 1.05,
                                                                        zIndex: 10
                                                                    }}
                                                                    className="flex flex-col items-center gap-2"
                                                                >
                                                                    <div
                                                                        className={`
                                                                            relative w-14 h-14 rounded-xl 
                                                                            ${config.bg} ${config.color} 
                                                                            border-2 ${config.borderColor}
                                                                            flex items-center justify-center
                                                                            shadow-md hover:shadow-xl
                                                                            transition-all duration-200
                                                                            cursor-default
                                                                        `}
                                                                    >
                                                                        <Icon className="w-7 h-7" />
                                                                        {/* 拼接連接點 */}
                                                                        {idx < blockTypes.length - 1 && (
                                                                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#EADBC8] rounded-full border-2 border-white shadow-sm"></div>
                                                                        )}
                                                                    </div>
                                                                    {/* 積木名稱 */}
                                                                    <span className={`text-xs font-semibold ${config.color} text-center`}>
                                                                        {typeLabel}
                                                                    </span>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 單一積木的描述 - 可展開/收起 */}
                                            {!isComposition && item.description && (
                                                <div className="mb-4">
                                                    <div className="text-sm text-[#4B4036]/70 leading-relaxed">
                                                        {expandedDescriptions[item.id] ? (
                                                            <span>{item.description}</span>
                                                        ) : (
                                                            <span>
                                                                {item.description.length > 100 
                                                                    ? `${item.description.substring(0, 100)}...` 
                                                                    : item.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.description.length > 100 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedDescriptions(prev => ({
                                                                    ...prev,
                                                                    [item.id]: !prev[item.id]
                                                                }));
                                                            }}
                                                            className="mt-2 flex items-center gap-1 text-xs font-medium text-[#4B4036]/60 hover:text-[#FFB6C1] transition-colors group"
                                                        >
                                                            <span>{expandedDescriptions[item.id] ? '收起' : '展開'}</span>
                                                            <motion.div
                                                                animate={{ rotate: expandedDescriptions[item.id] ? 180 : 0 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                <ChevronDownIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                            </motion.div>
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="mt-auto pt-4 border-t border-dashed border-[#EADBC8] flex items-center justify-between">
                                                <div className="flex items-center space-x-4 text-xs font-semibold text-[#4B4036]/50">
                                                    <div className="flex items-center hover:text-red-400 transition-colors">
                                                        <HeartIcon className="w-4 h-4 mr-1.5" />
                                                        {item.likes_count || 0}
                                                    </div>
                                                    <div className="flex items-center hover:text-blue-400 transition-colors">
                                                        <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                                                        {item.usage_count || 0}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLoad(item);
                                                    }}
                                                    className="flex items-center px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white text-xs font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all shadow-md active:scale-95"
                                                >
                                                    <PuzzlePieceIcon className="w-3.5 h-3.5 mr-2" />
                                                    載入積木
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

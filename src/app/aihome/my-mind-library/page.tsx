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
    XMarkIcon,
    Square2StackIcon,
    CubeIcon,
    UserIcon,
    PaintBrushIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    LightBulbIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PencilIcon,
    CheckIcon,
    UserGroupIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { MindBlockType, MindBlock } from '@/types/mind-block';
import MindBlockDetailModal from '@/components/mind-block/MindBlockDetailModal';

export default function MyMindLibraryPage() {
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
    const [showMobileDropdown, setShowMobileDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const activeView = 'mind'; // Force active view for styling
    const [activeTab, setActiveTab] = useState<'composition' | 'block'>('composition');
    const [myCompositions, setMyCompositions] = useState<any[]>([]);
    const [myBlocks, setMyBlocks] = useState<any[]>([]);
    const [loadingCompositions, setLoadingCompositions] = useState(true);
    const [loadingBlocks, setLoadingBlocks] = useState(true);
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [selectedBlock, setSelectedBlock] = useState<MindBlock | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

        if (!loading && user && activeTab === 'composition') {
            fetchCompositions();
        }
    }, [user, loading, activeTab]);

    // Fetch user's single blocks
    useEffect(() => {
        const fetchBlocks = async () => {
            if (!user?.id) return;
            setLoadingBlocks(true);
            try {
                const { data, error } = await supabase
                    .from('mind_blocks' as any)
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_template', true)
                    .order('updated_at', { ascending: false });

                if (error) {
                    console.error('Error fetching blocks:', error);
                } else {
                    setMyBlocks(data || []);
                }
            } catch (e) {
                console.error('Exception fetching blocks:', e);
            } finally {
                setLoadingBlocks(false);
            }
        };

        if (!loading && user && activeTab === 'block') {
            fetchBlocks();
        }
    }, [user, loading, activeTab]);

    const handleTabClick = (tabId: string) => {
        if (tabId === 'mind') return;
        router.push('/aihome/ai-companions?view=' + tabId);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const itemType = activeTab === 'composition' ? '組合' : '積木';
        if (confirm(`確定要刪除此${itemType}嗎？`)) {
            const { error } = await supabase
                .from('mind_blocks' as any)
                .delete()
                .eq('id', id);

            if (error) {
                alert('刪除失敗');
            } else {
                if (activeTab === 'composition') {
                    setMyCompositions(myCompositions.filter(c => c.id !== id));
                } else {
                    setMyBlocks(myBlocks.filter(b => b.id !== id));
                }
            }
        }
    };

    const handleStartEdit = (item: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingItem(item.id);
        setEditTitle(item.title || '');
        setEditDescription(item.description || '');
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setEditTitle('');
        setEditDescription('');
    };

    const handleSaveEdit = async (item: any) => {
        if (!editTitle.trim()) {
            alert('名稱不能為空');
            return;
        }

        const updateData: any = {
            title: editTitle.trim(),
            updated_at: new Date().toISOString()
        };

        // 如果是单一积木，也可以更新描述
        if (activeTab === 'block' && editDescription !== undefined) {
            updateData.description = editDescription.trim() || null;
        }

        const { error } = await supabase
            .from('mind_blocks' as any)
            .update(updateData)
            .eq('id', item.id);

        if (error) {
            console.error('更新失敗:', error);
            alert('更新失敗，請稍後再試');
        } else {
            // 更新本地狀態
            if (activeTab === 'composition') {
                setMyCompositions(myCompositions.map(c =>
                    c.id === item.id ? { ...c, title: editTitle.trim() } : c
                ));
            } else {
                setMyBlocks(myBlocks.map(b =>
                    b.id === item.id ? { ...b, title: editTitle.trim(), description: editDescription.trim() || null } : b
                ));
            }
            setEditingItem(null);
            setEditTitle('');
            setEditDescription('');
        }
    };

    const handleOpenDetail = (item: any) => {
        // Convert item to MindBlock format if needed, or just pass it if compatible
        // The item structure from DB should be compatible with MindBlock interface
        setSelectedBlock(item);
        setIsDetailModalOpen(true);
    };

    const handleLoadBlock = (block: MindBlock) => {
        router.push(`/aihome/mind-builder?compositionId=${block.id}`);
    };

    const filteredCompositions = myCompositions.filter(comp =>
        comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (comp.description && comp.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredBlocks = myBlocks.filter(block =>
        block.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (block.description && block.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isLoading = activeTab === 'composition' ? loadingCompositions : loadingBlocks;
    const displayItems = activeTab === 'composition' ? filteredCompositions : filteredBlocks;

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


                            {/* 移動端/平板：合併按鈕 + 下拉菜單 */}
                            {/* 統一的下拉菜單 (桌面 + 移動端) */}
                            <UnifiedRightContent user={user} onLogout={handleLogout} />
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
                    {/* Tab Switch */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex bg-white/80 backdrop-blur-sm p-1 rounded-2xl border-2 border-[#EADBC8] shadow-lg">
                            <motion.button
                                onClick={() => router.push('/aihome/my-mind-library')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all min-w-[140px] justify-center"
                            >
                                <motion.div
                                    layoutId="mindLibraryTab"
                                    className="absolute inset-0 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-xl shadow-md"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                                <UserIcon className="w-5 h-5 relative z-10 text-white" />
                                <span className="relative z-10 text-white">我的積木庫</span>
                            </motion.button>
                            <motion.button
                                onClick={() => router.push('/aihome/mind-library')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#4B4036]/60 hover:text-[#4B4036] transition-all min-w-[140px] justify-center"
                            >
                                <UserGroupIcon className="w-5 h-5" />
                                <span>社群積木</span>
                            </motion.button>
                        </div>
                    </div>

                    <p className="text-lg text-[#4B4036]/60 max-w-2xl mx-auto mb-8">
                        管理您儲存的思維積木組合，隨時載入並繼續編輯
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-xl mx-auto group mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative bg-white rounded-2xl shadow-lg border border-[#EADBC8] flex items-center p-2 transition-transform transform group-hover:-translate-y-0.5">
                            <MagnifyingGlassIcon className="w-6 h-6 text-[#4B4036]/40 ml-3" />
                            <input
                                type="text"
                                placeholder="搜尋我的積木..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-transparent border-none text-[#4B4036] placeholder-[#4B4036]/30 focus:ring-0 text-base font-medium"
                            />
                            <button className="p-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center">
                                <MagnifyingGlassIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Action Bar - Create Button & Type Tabs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                        {/* Create Button */}
                        <motion.button
                            onClick={() => router.push('/aihome/mind-builder')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                            title="創建新積木"
                        >
                            <PlusIcon className="w-6 h-6" />
                        </motion.button>

                        {/* Type Tabs */}
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

                {/* Grid */}
                <div className="pb-20 px-1">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A]"></div>
                        </div>
                    ) : displayItems.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <PuzzlePieceIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">您還沒有儲存任何{activeTab === 'composition' ? '積木組合' : '單一積木'}</p>
                            <button
                                onClick={() => router.push('/aihome/mind-builder')}
                                className="mt-4 px-6 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-bold hover:shadow-lg transition-all"
                            >
                                去創建一個？
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {displayItems.map((item) => {
                                const isComposition = activeTab === 'composition';
                                const blockTypes = isComposition
                                    ? getBlockTypesFromComposition(item)
                                    : item.block_type ? [item.block_type] : [];

                                return (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ y: -5 }}
                                        className="group relative h-full cursor-pointer"
                                        onClick={() => handleOpenDetail(item)}
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
                                                            <div className="text-xs text-[#4B4036]/40">
                                                                {new Date(item.updated_at).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        {editingItem === item.id ? (
                                                            <input
                                                                type="text"
                                                                value={editTitle}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => setEditTitle(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleSaveEdit(item);
                                                                    } else if (e.key === 'Escape') {
                                                                        handleCancelEdit();
                                                                    }
                                                                }}
                                                                className="w-full px-2 py-1 text-lg font-bold text-[#4B4036] bg-white border-2 border-[#FFD59A] rounded-lg focus:outline-none focus:border-[#FFB6C1]"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <h3 className="font-bold text-[#4B4036] text-lg leading-tight group-hover:text-[#FFB6C1] transition-colors line-clamp-1">
                                                                {item.title}
                                                            </h3>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {editingItem === item.id ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSaveEdit(item);
                                                                }}
                                                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                                                                title="儲存"
                                                            >
                                                                <CheckIcon className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancelEdit();
                                                                }}
                                                                className="p-2 text-[#4B4036]/50 hover:text-[#4B4036] hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
                                                                title="取消"
                                                            >
                                                                <XMarkIcon className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={(e) => handleStartEdit(item, e)}
                                                                className="p-2 text-[#4B4036]/30 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                                                                title="編輯"
                                                            >
                                                                <PencilIcon className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDelete(item.id, e)}
                                                                className="p-2 text-[#4B4036]/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                                title="刪除"
                                                            >
                                                                <TrashIcon className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
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
                                            {!isComposition && (
                                                <div className="mb-4">
                                                    {editingItem === item.id ? (
                                                        <textarea
                                                            value={editDescription}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => setEditDescription(e.target.value)}
                                                            placeholder="輸入描述..."
                                                            className="w-full px-3 py-2 text-sm text-[#4B4036] bg-white border-2 border-[#FFD59A] rounded-lg focus:outline-none focus:border-[#FFB6C1] resize-none"
                                                            rows={3}
                                                        />
                                                    ) : item.description ? (
                                                        <>
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
                                                        </>
                                                    ) : (
                                                        <div className="text-sm text-[#4B4036]/40 italic">
                                                            暫無描述
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="mt-auto pt-4 border-t border-dashed border-[#EADBC8] space-y-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/aihome/mind-builder?compositionId=${item.id}`);
                                                    }}
                                                    className="w-full py-2.5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <PuzzlePieceIcon className="w-4 h-4" />
                                                    載入積木
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/aihome/mind-builder?compositionId=${item.id}&edit=true`);
                                                    }}
                                                    className="w-full py-2 bg-white border-2 border-[#FFD59A] text-[#4B4036] rounded-xl font-semibold transition-all hover:bg-[#FFD59A]/10 hover:border-[#FFB6C1] flex items-center justify-center gap-2"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                    編輯內容
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

            <MindBlockDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                block={selectedBlock}
                onLoadBlock={handleLoadBlock}
            />
        </div>
    );
}

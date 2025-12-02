import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
    XMarkIcon, 
    MagnifyingGlassIcon, 
    CubeIcon, 
    ArrowTopRightOnSquareIcon, 
    UserIcon, 
    PaintBrushIcon, 
    ClipboardDocumentIcon,
    GlobeAltIcon,
    ExclamationCircleIcon,
    CodeBracketIcon,
    LightBulbIcon,
    ArrowRightIcon,
    DocumentTextIcon,
    CheckIcon,
    FolderIcon
} from '@heroicons/react/24/outline';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { MindBlock, MindBlockType } from '@/types/mind-block';
import { RoleInstance } from '@/types/ai-companion';
import MindBlockDetailModal from '@/components/mind-block/MindBlockDetailModal';

interface BlockSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (block: MindBlock) => void;
    slotType: 'role' | 'style' | 'task';
    roleInstanceId?: string; // 可選，用於設置預設值時不需要
}

export function BlockSelectionModal({
    isOpen,
    onClose,
    onSelect,
    slotType,
    roleInstanceId
}: BlockSelectionModalProps) {
    const router = useRouter();
    const [blocks, setBlocks] = useState<MindBlock[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'my' | 'community'>('my');
    const [selectedBlock, setSelectedBlock] = useState<MindBlock | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadBlocks();
        }
    }, [isOpen, activeTab, slotType]);

    const loadBlocks = async () => {
        setLoading(true);
        try {
            const supabase = getSaasSupabaseClient();
            const { data: { user } } = await supabase.auth.getUser();

            let query = supabase
                .from('mind_blocks' as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (activeTab === 'my') {
                if (user?.id) {
                    query = query.eq('user_id', user.id);
                }
            } else {
                query = query.eq('is_public', true);
            }

            // Filter by type if possible (assuming we have a type field or tag)
            // For now, we fetch all and maybe filter client side if needed, 
            // but ideally we should have a 'block_type' column.
            // Based on previous files, 'block_type' exists in MindBlock interface.
            // Let's try to filter by it if it matches our slot types.
            // Note: MindBlockType includes 'role', 'style', 'task'.

            // query = query.eq('block_type', slotType); 
            // Commented out because we might want to allow mixing types or the column might be empty for old blocks.

            const { data, error } = await query;

            if (error) throw error;
            setBlocks((data as unknown as MindBlock[]) || []);
        } catch (error) {
            console.error('Failed to load blocks:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBlocks = blocks.filter(block =>
        block.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 類型配置映射
    const typeConfigMap: Record<MindBlockType, { label: string; icon: any; color: string }> = {
        role: { label: '角色', icon: UserIcon, color: 'purple' },
        style: { label: '風格', icon: PaintBrushIcon, color: 'pink' },
        task: { label: '任務', icon: ClipboardDocumentIcon, color: 'orange' },
        context: { label: '上下文', icon: GlobeAltIcon, color: 'blue' },
        rule: { label: '規則', icon: ExclamationCircleIcon, color: 'red' },
        variable: { label: '變數', icon: CodeBracketIcon, color: 'indigo' },
        search: { label: '搜尋', icon: MagnifyingGlassIcon, color: 'teal' },
        reason: { label: '推理', icon: LightBulbIcon, color: 'yellow' },
        output: { label: '輸出', icon: ArrowRightIcon, color: 'green' }
    };

    // 自訂類型的預設配置
    const getCustomTypeConfig = (type: string, block?: MindBlock): { label: string; icon: any; color: string } => {
        // 使用積木的 icon 和 color（如果有的話），否則使用預設值
        return {
            label: type.charAt(0).toUpperCase() + type.slice(1), // 首字母大寫
            icon: CubeIcon, // 預設使用 CubeIcon
            color: 'gray' // 預設使用灰色
        };
    };

    // 解析積木包含的所有類型（包括自訂類型）
    const parseBlockTypes = (block: MindBlock): Array<{ type: string; isCustom: boolean }> => {
        try {
            const types = new Map<string, boolean>(); // Map<type, isCustom>
            const foundTypes: string[] = [];
            
            // 方法1: 檢查 block_type 字段（單一類型積木）
            if (block.block_type) {
                const isCustom = !typeConfigMap[block.block_type as MindBlockType];
                types.set(block.block_type, isCustom);
                foundTypes.push(`block_type: ${block.block_type}`);
            }
            
            // 方法2: 解析 content_json（複合積木）
            const contentJson = block.content_json;
            if (contentJson && contentJson.blocks && Array.isArray(contentJson.blocks)) {
                const traverse = (blocks: any[]) => {
                    blocks.forEach((b: any) => {
                        if (b.type) {
                            foundTypes.push(`content_json: ${b.type}`);
                            const isCustom = !typeConfigMap[b.type as MindBlockType];
                            types.set(b.type, isCustom);
                        }
                        if (b.children && Array.isArray(b.children)) {
                            traverse(b.children);
                        }
                    });
                };
                traverse(contentJson.blocks);
            } else {
                console.log('🔍 [BlockSelectionModal] 積木無有效 content_json:', block.id, block.title, 'block_type:', block.block_type);
            }

            // 轉換為數組並排序
            const typeArray = Array.from(types.entries()).map(([type, isCustom]) => ({ type, isCustom }));
            
            // 按照優先順序排序（標準類型優先，然後是自訂類型）
            const priorityOrder: string[] = ['role', 'style', 'task'];
            const sortedTypes = typeArray.sort((a, b) => {
                const aIsCustom = a.isCustom;
                const bIsCustom = b.isCustom;
                
                // 標準類型優先於自訂類型
                if (!aIsCustom && bIsCustom) return -1;
                if (aIsCustom && !bIsCustom) return 1;
                
                // 都是標準類型，按優先順序排序
                if (!aIsCustom && !bIsCustom) {
                    const aIndex = priorityOrder.indexOf(a.type);
                    const bIndex = priorityOrder.indexOf(b.type);
                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                }
                
                // 都按字母順序排序
                return a.type.localeCompare(b.type);
            });

            console.log('🔍 [BlockSelectionModal] 積木:', block.title, '找到的類型:', sortedTypes.map(t => `${t.type}${t.isCustom ? '(自訂)' : ''}`), '原始類型:', foundTypes);

            return sortedTypes;
        } catch (error) {
            console.error('❌ [BlockSelectionModal] 解析積木類型失敗:', error, '積木:', block.title);
            return [];
        }
    };

    // 獲取顏色樣式類名
    const getColorClasses = (color: string) => {
        const colorMap: Record<string, { bg: string; border: string; text: string }> = {
            purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-600' },
            pink: { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-600' },
            orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600' },
            blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600' },
            red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600' },
            indigo: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-600' },
            teal: { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-600' },
            yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-600' },
            green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-600' },
            gray: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600' }
        };
        return colorMap[color] || colorMap.gray;
    };

    // 積木類型卡片組件
    const BlockTypeCards = ({ block }: { block: MindBlock }) => {
        const types = parseBlockTypes(block);
        
        // 如果沒有任何類型，不顯示
        if (types.length === 0) {
            return null;
        }

        // 如果超過5個類型，只顯示前5個，其餘用數字顯示
        const maxVisible = 5;
        const visibleTypes = types.slice(0, maxVisible);
        const remainingCount = types.length > maxVisible ? types.length - maxVisible : 0;

        return (
            <div className="flex items-center mt-2 relative">
                {visibleTypes.map((typeInfo, index) => {
                    const { type, isCustom } = typeInfo;
                    
                    // 獲取配置：標準類型從 typeConfigMap，自訂類型使用 getCustomTypeConfig
                    const config = isCustom 
                        ? getCustomTypeConfig(type, block)
                        : typeConfigMap[type as MindBlockType];
                    
                    // 防禦性檢查：如果配置不存在，跳過
                    if (!config) {
                        console.warn('⚠️ [BlockSelectionModal] 類型配置不存在:', type, '積木:', block.title);
                        return null;
                    }
                    
                    const colors = getColorClasses(config.color);
                    const Icon = config.icon;

                    return (
                        <React.Fragment key={type}>
                            {index > 0 && (
                                <div className="w-1 h-1 rounded-full bg-gray-300 mx-0.5 relative" 
                                     style={{ top: '20px' }}
                                />
                            )}
                            <div className="flex flex-col items-center gap-0.5 opacity-100">
                                <div
                                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center shadow-sm transition-all ${colors.bg} ${colors.border}`}
                                >
                                    <Icon className={`w-5 h-5 ${colors.text}`} />
                                </div>
                                <span className={`text-[9px] font-semibold ${colors.text} leading-tight`}>
                                    {config.label}
                                </span>
                            </div>
                        </React.Fragment>
                    );
                })}
                
                {/* 如果有多餘的類型，顯示數字卡片 */}
                {remainingCount > 0 && (
                    <>
                        {visibleTypes.length > 0 && (
                            <div className="w-1 h-1 rounded-full bg-gray-300 mx-0.5 relative" 
                                 style={{ top: '20px' }}
                            />
                        )}
                        <div className="flex flex-col items-center gap-0.5 opacity-100">
                            <div className="w-10 h-10 rounded-lg border-2 flex items-center justify-center shadow-sm transition-all bg-gray-50 border-gray-300">
                                <span className="text-[10px] font-bold text-gray-600">
                                    +{remainingCount}
                                </span>
                            </div>
                            <span className="text-[9px] font-semibold text-gray-600 leading-tight">
                                更多
                            </span>
                        </div>
                    </>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#FFF5EB] to-white">
                    <div>
                        <h3 className="text-lg font-bold text-[#4B4036]">
                            選擇{slotType === 'role' ? '角色' : slotType === 'style' ? '風格' : '任務'}積木
                        </h3>
                        <p className="text-xs text-[#4B4036]/60">
                            為您的 AI 夥伴裝備新的思維能力
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
                    </button>
                </div>

                {/* Tabs & Search */}
                <div className="p-4 border-b border-gray-100 space-y-4">
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my'
                                ? 'bg-[#FFD59A] text-[#4B4036]'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            我的積木
                        </button>
                        <button
                            onClick={() => setActiveTab('community')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'community'
                                ? 'bg-[#FFD59A] text-[#4B4036]'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            社群積木
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={() => {
                                onClose();
                                router.push('/aihome/my-mind-library');
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-[#4B4036] bg-white border border-[#EADBC8] hover:bg-[#FFF9F2] hover:border-[#FFD59A] transition-all flex items-center gap-2"
                        >
                            <FolderIcon className="w-4 h-4" />
                            我的積木庫
                        </button>
                    </div>

                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="搜尋積木..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Block List */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="w-8 h-8 border-4 border-[#FFD59A] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredBlocks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredBlocks.map((block) => (
                                <motion.button
                                    key={block.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setSelectedBlock(block);
                                        setIsDetailModalOpen(true);
                                    }}
                                    className="text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-[#FFD59A] hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#FFF5EB] flex items-center justify-center flex-shrink-0 group-hover:bg-[#FFD59A] transition-colors">
                                            <CubeIcon className="w-6 h-6 text-[#4B4036]" />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div>
                                                <h4 className="font-bold text-[#4B4036] text-sm line-clamp-1">
                                                    {block.title}
                                                </h4>
                                                {/* 顯示積木類型卡片而非文字描述 */}
                                                <BlockTypeCards block={block} />
                                            </div>

                                            {/* 操作按鈕組 */}
                                            <div className="flex items-center gap-2 mt-2">
                                                {/* 選擇按鈕 */}
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelect(block);
                                                        onClose();
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#FFB6C1] text-[11px] font-semibold text-[#4B4036] bg-gradient-to-r from-[#FFB6C1]/20 to-[#FFD59A]/20 hover:from-[#FFB6C1]/30 hover:to-[#FFD59A]/30 hover:border-[#FFB6C1] transition-all cursor-pointer"
                                                >
                                                    <CheckIcon className="w-3.5 h-3.5" />
                                                    <span>選擇</span>
                                                </div>
                                                {/* 編輯按鈕 */}
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (typeof window === 'undefined') return;
                                                        const ok = window.confirm('即將前往積木建構器編輯此積木，目前聊天室輸入內容不會自動保存，確定要跳轉嗎？');
                                                        if (!ok) return;
                                                        const url = `/aihome/mind-builder?compositionId=${encodeURIComponent(block.id)}`;
                                                        window.open(url, '_blank');
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#FFD59A]/70 text-[11px] text-[#4B4036] bg-[#FFF9F2] hover:bg-[#FFD59A]/20 hover:border-[#FFD59A] transition-all cursor-pointer"
                                                >
                                                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                                    <span>編輯</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <CubeIcon className="w-12 h-12 mb-2 opacity-20" />
                            <p>沒有找到相關積木</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* 詳細資料模態框（帶選擇按鈕） */}
            <MindBlockDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedBlock(null);
                }}
                block={selectedBlock}
                onSelect={(block) => {
                    // 選擇積木並關閉所有模態框
                    onSelect(block);
                    setIsDetailModalOpen(false);
                    setSelectedBlock(null);
                    onClose(); // 關閉選擇模態框
                }}
                onLoadBlock={(block) => {
                    // 當點擊"載入到建構器"時，關閉詳細資料模態框
                    setIsDetailModalOpen(false);
                    setSelectedBlock(null);
                    // 這裡可以選擇是否要關閉選擇模態框
                    // onClose();
                }}
            />
        </div>
    );
}

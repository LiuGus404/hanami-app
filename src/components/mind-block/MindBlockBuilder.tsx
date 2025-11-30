'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    PlusIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    LightBulbIcon,
    ChatBubbleBottomCenterTextIcon,
    XMarkIcon,
    SparklesIcon,
    PuzzlePieceIcon,
    UserIcon,
    PaintBrushIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    CubeIcon,
    EyeIcon,
    ClipboardDocumentIcon,
    BookOpenIcon,
    BeakerIcon,
    ArrowDownOnSquareIcon,
    CheckIcon,
    GlobeAltIcon,
    LockClosedIcon,
    PencilIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { MindBlockNode, MindBlockType } from '@/types/mind-block';
import { createSaasClient } from '@/lib/supabase-saas';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

// Initial Demo Data
const initialBlocks: MindBlockNode[] = [
    {
        id: '1',
        type: 'role',
        params: {
            content: '你是一位資深的美食評論家，擁有20年的米其林餐廳評鑑經驗。',
            label: '美食家角色'
        }
    },
    {
        id: '2',
        type: 'style',
        params: {
            content: '請使用毒舌、幽默且帶點諷刺的語氣。多使用台灣網路流行語。',
            label: '毒舌風格'
        }
    },
    {
        id: '3',
        type: 'task',
        params: {
            content: '評論這家餐廳：路邊攤臭豆腐，味道很臭但排隊很長。',
            label: '評論任務'
        }
    },
];

const DEFAULT_BLOCK_TYPES: { type: string; label: string; icon: any; color: string; bg: string }[] = [
    { type: 'role', label: '角色', icon: UserIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
    { type: 'style', label: '風格', icon: PaintBrushIcon, color: 'text-pink-500', bg: 'bg-pink-50' },
    { type: 'context', label: '背景', icon: DocumentTextIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
    { type: 'rule', label: '規則', icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-50' },
    { type: 'task', label: '任務', icon: CubeIcon, color: 'text-amber-500', bg: 'bg-amber-50' },
    // Legacy / Flow types
    { type: 'search', label: '搜尋', icon: MagnifyingGlassIcon, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { type: 'reason', label: '推理', icon: LightBulbIcon, color: 'text-yellow-500', bg: 'bg-yellow-50' },
];

const COLOR_PALETTE = [
    { name: 'Purple', color: 'text-purple-500', bg: 'bg-purple-50' },
    { name: 'Pink', color: 'text-pink-500', bg: 'bg-pink-50' },
    { name: 'Blue', color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Red', color: 'text-red-500', bg: 'bg-red-50' },
    { name: 'Amber', color: 'text-amber-500', bg: 'bg-amber-50' },
    { name: 'Green', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { name: 'Gray', color: 'text-slate-500', bg: 'bg-slate-50' },
];

export default function MindBlockBuilder() {
    const supabase = createSaasClient();
    const searchParams = useSearchParams();
    const [blocks, setBlocks] = useState<MindBlockNode[]>(initialBlocks);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [pendingBlock, setPendingBlock] = useState<MindBlockNode | null>(null); // New state for draft block
    const [showPreview, setShowPreview] = useState(true);
    const [showLibrary, setShowLibrary] = useState(false);
    const [compiledPrompt, setCompiledPrompt] = useState('');

    // Custom Types State
    const [customTypes, setCustomTypes] = useState<any[]>([]);
    const [isCreatingType, setIsCreatingType] = useState(false);
    const [newTypeData, setNewTypeData] = useState({ name: '', color: 'text-gray-500', bg: 'bg-gray-50' });

    // Saved Templates State
    const [savedTemplates, setSavedTemplates] = useState<(MindBlockNode & { isPublic?: boolean })[]>([]);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null); // Track if we are updating an existing template
    const [savePrivacy, setSavePrivacy] = useState<'private' | 'public'>('private');

    const { user: currentUser } = useSaasAuth();

    const allBlockTypes = [...DEFAULT_BLOCK_TYPES, ...customTypes];

    // Fetch templates on load or when user changes
    useEffect(() => {
        let mounted = true;

        const fetchTemplates = async (userId: string) => {
            console.log('MindBlockBuilder: Fetching templates for user:', userId);
            const { data, error } = await supabase
                .from('mind_blocks' as any)
                .select('*')
                .eq('is_template', true)
                .or(`is_public.eq.true,user_id.eq.${userId}`);

            if (error) {
                console.error('MindBlockBuilder: Error fetching templates:', error);
            }

            if (data && mounted) {
                console.log('MindBlockBuilder: Fetched templates count:', data.length);
                const loadedTemplates = data.map((item: any) => ({
                    id: item.id,
                    type: item.block_type as MindBlockType,
                    params: {
                        ...item.content_json.params,
                        label: item.title,
                        customColor: item.color === '#FFD59A' ? undefined : item.color
                    },
                    isPublic: item.is_public
                }));
                setSavedTemplates(loadedTemplates);
            }
        };

        const init = async () => {
            try {
                if (currentUser) {
                    console.log('MindBlockBuilder: Current user present:', currentUser.id);
                    const { data: { session }, error } = await supabase.auth.getSession();

                    if (error) {
                        console.error('MindBlockBuilder: Error getting session:', error);
                    }

                    console.log('MindBlockBuilder: Session check:', session ? 'Session found' : 'No session');

                    if (session) {
                        fetchTemplates(currentUser.id);
                    } else {
                        console.log('MindBlockBuilder: No session yet, waiting for auth change...');
                    }
                } else {
                    console.log('MindBlockBuilder: No current user');
                }
            } catch (e) {
                console.error('MindBlockBuilder: Exception in init:', e);
            }
        };

        init();

        // Listen for auth changes to retry fetch if session was missing
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('MindBlockBuilder: Auth state change:', event, session ? 'Session present' : 'No session');
            if (session && currentUser && mounted) {
                fetchTemplates(currentUser.id);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [currentUser]);

    const refreshLibrary = async () => {
        if (!currentUser) return;
        const { data, error } = await supabase
            .from('mind_blocks' as any)
            .select('*')
            .eq('is_template', true)
            .or(`is_public.eq.true,user_id.eq.${currentUser.id}`);

        if (data) {
            const loadedTemplates = data.map((item: any) => ({
                id: item.id,
                type: item.block_type as MindBlockType,
                params: {
                    ...item.content_json.params,
                    label: item.title,
                    customColor: item.color === '#FFD59A' ? undefined : item.color
                },
                isPublic: item.is_public
            }));
            setSavedTemplates(loadedTemplates);
            alert('積木庫已更新');
        }
    };

    // Load composition from URL if present
    useEffect(() => {
        const compositionId = searchParams.get('compositionId');
        if (compositionId) {
            const loadComposition = async () => {
                const { data, error } = await supabase
                    .from('mind_blocks' as any)
                    .select('*')
                    .eq('id', compositionId)
                    .single();

                if (error) {
                    console.error('Error loading composition:', error);
                    alert('載入組合失敗');
                } else if (data && (data as any).content_json && (data as any).content_json.blocks) {
                    setBlocks((data as any).content_json.blocks);
                    // Optionally set the title or other metadata if you have state for it
                }
            };
            loadComposition();
        }
    }, [searchParams]);

    // Compile blocks to prompt whenever blocks change
    useEffect(() => {
        const compile = () => {
            return blocks.map(block => {
                const content = block.params.content || block.params.query || block.params.prompt || '';
                // Simple XML-like tagging for structure
                if (block.type === 'role') return `<role>\n${content}\n</role>`;
                if (block.type === 'style') return `<style>\n${content}\n</style>`;
                if (block.type === 'context') return `<context>\n${content}\n</context>`;
                if (block.type === 'rule') return `<rule>\n${content}\n</rule>`;
                if (block.type === 'task') return `<task>\n${content}\n</task>`;

                // Check if it's a custom type
                const customType = customTypes.find(t => t.type === block.type);
                if (customType) {
                    return `<${customType.type}>\n${content}\n</${customType.type}>`;
                }

                // Fallback for others
                return `[${block.type.toUpperCase()}]: ${content}`;
            }).join('\n\n');
        };
        setCompiledPrompt(compile());
    }, [blocks, customTypes]);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        // Handle drag from Library to Canvas
        if (result.source.droppableId === 'library-list' && result.destination.droppableId === 'mind-blocks') {
            const type = result.draggableId.split('lib-')[1] as MindBlockType;
            addBlock(type);
            return;
        }

        // Handle reordering within Canvas
        if (result.source.droppableId === 'mind-blocks' && result.destination.droppableId === 'mind-blocks') {
            const items = Array.from(blocks);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);
            setBlocks(items);
        }
    };

    const addBlock = (type: string) => {
        const newBlock: MindBlockNode = {
            id: Math.random().toString(36).substr(2, 9),
            type: type as MindBlockType,
            params: { content: '', label: '' }
        };
        // Instead of adding directly, set as pending
        setPendingBlock(newBlock);
        setEditingBlockId(newBlock.id); // Open editor for it
    };

    const addTemplateToCanvas = (template: MindBlockNode) => {
        const newBlock: MindBlockNode = {
            ...template,
            id: Math.random().toString(36).substr(2, 9), // New ID
        };
        // Instead of adding directly, set as pending
        setPendingBlock(newBlock);
        setEditingBlockId(newBlock.id); // Open editor for it
    };

    const confirmAddBlock = () => {
        if (pendingBlock) {
            setBlocks([...blocks, pendingBlock]);
            setPendingBlock(null);
            setEditingBlockId(null);
        }
    };

    const cancelAddBlock = () => {
        setPendingBlock(null);
        setEditingBlockId(null);
        setEditingTemplateId(null); // Clear template editing state
        setIsSavingTemplate(false);
    };

    const updateBlockParams = (id: string, key: string, value: any) => {
        // Check if updating pending block
        if (pendingBlock && pendingBlock.id === id) {
            setPendingBlock({ ...pendingBlock, params: { ...pendingBlock.params, [key]: value } });
        } else {
            setBlocks(blocks.map(b =>
                b.id === id ? { ...b, params: { ...b.params, [key]: value } } : b
            ));
        }
    };

    const createCustomType = () => {
        if (!newTypeData.name) return;
        const newType = {
            type: newTypeData.name,
            label: newTypeData.name,
            icon: BeakerIcon, // Default icon for custom types
            color: 'text-indigo-500',
            bg: 'bg-indigo-50'
        };
        setCustomTypes([...customTypes, newType]);
        setIsCreatingType(false);
        setNewTypeData({ name: '', color: 'text-gray-500', bg: 'bg-gray-50' });
    };

    // Determine which block is being edited (could be pending or existing)
    const editingBlock = pendingBlock || blocks.find(b => b.id === editingBlockId);

    const initiateSaveTemplate = () => {
        setIsSavingTemplate(true);
    };

    const handleEditTemplate = (template: MindBlockNode, e: React.MouseEvent) => {
        e.stopPropagation();
        // Load template into pending block for editing
        const newBlock: MindBlockNode = {
            ...template,
            id: Math.random().toString(36).substr(2, 9), // Temp ID for editor
        };
        setPendingBlock(newBlock);
        setEditingBlockId(newBlock.id);
        setEditingTemplateId(template.id); // Track the original template ID (UUID)
        setSavePrivacy((template as any).isPublic ? 'public' : 'private');
        setShowLibrary(false); // Close library to focus on editor
    };

    const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('確定要刪除這個積木嗎？此動作無法復原。')) return;

        // Optimistic update
        setSavedTemplates(savedTemplates.filter(t => t.id !== templateId));

        const { error } = await supabase
            .from('mind_blocks')
            .delete()
            .eq('id', templateId);

        if (error) {
            console.error('Error deleting template:', error);
            alert('刪除失敗');
            // Revert would go here
        }
    };

    const confirmSaveTemplate = async () => {
        if (!editingBlock || !currentUser) {
            if (!currentUser) alert('請先登入以儲存積木！');
            return;
        }

        const label = editingBlock.params.label || `${editingBlock.type} Template`;
        const isPublic = savePrivacy === 'public';

        // Optimistic UI update
        const newTemplate = {
            ...editingBlock,
            id: editingTemplateId || editingBlock.id, // Use existing ID if updating
            params: { ...editingBlock.params, label },
            isPublic
        };

        if (editingTemplateId) {
            setSavedTemplates(savedTemplates.map(t => t.id === editingTemplateId ? newTemplate : t));
        } else {
            setSavedTemplates([...savedTemplates, newTemplate]);
        }

        setIsSavingTemplate(false);
        setEditingTemplateId(null); // Clear editing state
        setShowLibrary(true);

        // Persist to Supabase
        try {
            const payload = {
                user_id: currentUser.id,
                title: label,
                description: editingBlock.params.content?.substring(0, 100) || '',
                color: editingBlock.params.customColor || '#FFD59A',
                content_json: editingBlock, // Store full block structure
                block_type: editingBlock.type,
                is_template: true,
                is_public: isPublic,
                category: 'Custom', // Default category
                tags: editingBlock.params.tags ? editingBlock.params.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []
            } as any;

            let error;
            if (editingTemplateId) {
                // Update existing
                const { error: updateError } = await (supabase.from('mind_blocks') as any)
                    .update(payload)
                    .eq('id', editingTemplateId);
                error = updateError;
            } else {
                // Insert new
                const { error: insertError } = await (supabase.from('mind_blocks') as any)
                    .insert(payload);
                error = insertError;
            }

            if (error) {
                console.error('Error saving template:', error);
                alert('儲存失敗，請稍後再試。');
            } else {
                alert(editingTemplateId ? '積木已更新！' : '已成功同步至雲端！');
            }
        } catch (e) {
            console.error('Exception saving template:', e);
        }
    };

    const handleSave = async () => {
        if (!currentUser) {
            alert('請先登入以儲存積木！');
            return;
        }

        const name = prompt('請為此思維積木組合命名：', '我的思維積木');
        if (!name) return;

        try {
            const { error } = await (supabase.from('mind_blocks') as any).insert({
                user_id: currentUser.id,
                title: name,
                description: compiledPrompt.substring(0, 100) + '...',
                content_json: { blocks }, // Store the array of blocks
                is_template: false, // This is a composition, not a single block template
                is_public: false,
                category: 'Composition'
            });

            if (error) {
                console.error('Error saving composition:', error);
                alert('儲存失敗：' + error.message);
            } else {
                alert('思維積木組合已儲存！');
            }
        } catch (e) {
            console.error('Exception saving composition:', e);
            alert('儲存時發生錯誤');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(compiledPrompt);
        alert('Prompt copied to clipboard!');
    };

    // Set default preview state based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setShowPreview(false);
            } else {
                setShowPreview(true);
            }
        };

        // Set initial state
        handleResize();

        // Optional: Listen for resize if we want dynamic behavior
        // window.addEventListener('resize', handleResize);
        // return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-full gap-6 relative">
            {/* Library Drawer (Left Side) */}
            <AnimatePresence>
                {showLibrary && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="absolute md:relative h-full left-0 bg-white rounded-xl border border-[#EADBC8] shadow-sm flex flex-col overflow-hidden z-30 md:z-20"
                    >
                        <div className="p-4 border-b border-[#EADBC8] bg-[#FFF9F2]/30 flex items-center justify-between">
                            <h3 className="font-bold text-[#4B4036] flex items-center gap-2">
                                <BookOpenIcon className="w-5 h-5 text-amber-500" />
                                積木庫
                            </h3>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={refreshLibrary}
                                    className="p-1 hover:bg-[#EADBC8]/20 rounded-full text-[#4B4036]/60 hover:text-[#4B4036]"
                                    title="重新整理"
                                >
                                    <ArrowPathIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setShowLibrary(false)}
                                    className="p-1 hover:bg-[#EADBC8]/20 rounded-full"
                                >
                                    <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-b border-[#EADBC8]">
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-[#4B4036]/40" />
                                <input
                                    type="text"
                                    placeholder="搜尋積木..."
                                    className="w-full pl-9 pr-4 py-2 bg-[#FFF9F2] border border-[#EADBC8] rounded-xl text-sm focus:border-[#FFD59A] focus:ring-0"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Saved Templates Section */}
                            {savedTemplates.length > 0 && (
                                <div>
                                    <div className="text-xs font-bold text-[#4B4036]/40 uppercase tracking-wider mb-2">我的自訂積木</div>
                                    <div className="space-y-2">
                                        {savedTemplates.map((template, index) => {
                                            const typeDef = allBlockTypes.find(t => t.type === template.type) || allBlockTypes[0];
                                            // Use custom color if available, else default
                                            const customColorDef = template.params.customColor
                                                ? COLOR_PALETTE.find(c => c.name === template.params.customColor)
                                                : null;

                                            const bgClass = customColorDef ? customColorDef.bg : typeDef.bg;
                                            const colorClass = customColorDef ? customColorDef.color : typeDef.color;

                                            return (
                                                <div key={index} className="w-full p-3 rounded-xl border border-[#EADBC8] bg-white group hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgClass} ${colorClass}`}>
                                                            <typeDef.icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="font-bold text-[#4B4036] text-sm truncate">{template.params.label}</div>
                                                                {template.isPublic ? (
                                                                    <GlobeAltIcon className="w-3 h-3 text-blue-400" title="公開" />
                                                                ) : (
                                                                    <LockClosedIcon className="w-3 h-3 text-slate-400" title="私人" />
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-[#4B4036]/50 truncate">{template.type}</div>
                                                        </div>

                                                        {/* Edit/Delete Actions */}
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => handleEditTemplate(template, e)}
                                                                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                                title="編輯"
                                                            >
                                                                <PencilIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteTemplate(template.id, e)}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="刪除"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => addTemplateToCanvas(template)}
                                                        className="w-full py-1.5 bg-[#FFF9F2] text-[#4B4036] text-xs font-bold rounded-lg hover:bg-[#FFD59A] hover:text-white transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <PlusIcon className="w-3 h-3" />
                                                        加入
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Default Blocks Section */}
                            <div>
                                <div className="text-xs font-bold text-[#4B4036]/40 uppercase tracking-wider mb-2">基礎積木</div>
                                <div className="space-y-2">
                                    {allBlockTypes.map((t) => (
                                        <button
                                            key={t.type}
                                            onClick={() => addBlock(t.type)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border border-[#EADBC8] hover:border-[#FFD59A] hover:shadow-sm transition-all bg-white group text-left`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.bg} ${t.color}`}>
                                                <t.icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-[#4B4036] text-sm group-hover:text-amber-600 transition-colors">
                                                {t.label}
                                            </span>
                                            <PlusIcon className="w-4 h-4 ml-auto text-[#4B4036]/20 group-hover:text-amber-500" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Builder Area */}
            <div className="flex-1 flex flex-col h-full bg-[#FFF9F2] p-4 rounded-xl relative border border-[#EADBC8] shadow-sm z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowLibrary(!showLibrary)}
                            className={`p-2 rounded-xl transition-colors flex items-center gap-2 font-bold text-sm ${showLibrary ? 'bg-[#FFD59A] text-[#4B4036]' : 'bg-white text-[#4B4036] border border-[#EADBC8]'}`}
                        >
                            <BookOpenIcon className="w-5 h-5" />
                            <span className="hidden md:inline">{!showLibrary && "打開積木庫"}</span>
                        </button>
                        <h1 className="text-2xl font-bold text-[#4B4036] hidden md:block">思維積木構建器</h1>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`p-2 rounded-xl transition-colors ${showPreview ? 'bg-[#FFD59A] text-[#4B4036]' : 'bg-white text-[#4B4036]/60 border border-[#EADBC8]'}`}
                            title="切換預覽"
                        >
                            <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                        >
                            儲存
                        </button>
                    </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="mind-blocks">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex-1 overflow-y-auto space-y-3 pb-20 px-2"
                            >
                                {blocks.map((block, index) => {
                                    const typeDef = allBlockTypes.find(t => t.type === block.type) || allBlockTypes[0];
                                    const Icon = typeDef.icon;

                                    // Use custom color if available
                                    const customColorDef = block.params.customColor
                                        ? COLOR_PALETTE.find(c => c.name === block.params.customColor)
                                        : null;

                                    const bgClass = customColorDef ? customColorDef.bg : typeDef.bg;
                                    const colorClass = customColorDef ? customColorDef.color : typeDef.color;

                                    return (
                                        <Draggable key={block.id} draggableId={block.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                        zIndex: snapshot.isDragging ? 100 : 1,
                                                    }}
                                                    className={`relative group transition-all ${snapshot.isDragging ? 'scale-105 rotate-1' : ''}`}
                                                >
                                                    <div
                                                        className={`
                                                            relative bg-white rounded-xl border-2 
                                                            ${block.id === editingBlockId ? 'border-[#FFD59A] ring-4 ring-[#FFD59A]/20' : 'border-[#EADBC8]'}
                                                            shadow-sm hover:shadow-md transition-all
                                                            flex items-stretch overflow-hidden
                                                        `}
                                                        onClick={() => setEditingBlockId(block.id)}
                                                    >
                                                        {/* Color Strip */}
                                                        <div className={`w-2 flex-shrink-0 ${bgClass.replace('bg-', 'bg-').replace('50', '400')}`}></div>

                                                        <div className="flex-1 p-4 flex items-center gap-4">
                                                            {/* Icon */}
                                                            <div className={`
                                                                w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner
                                                                ${bgClass} ${colorClass}
                                                            `}>
                                                                <Icon className="w-6 h-6" />
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${bgClass} ${colorClass}`}>
                                                                        {typeDef.label}
                                                                    </span>
                                                                    {block.params.label && (
                                                                        <span className="text-xs text-[#4B4036]/40 font-medium">
                                                                            {block.params.label}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h3 className="font-bold text-[#4B4036] truncate text-sm">
                                                                    {block.params.content || block.params.query || block.params.prompt || '點擊編輯內容...'}
                                                                </h3>
                                                            </div>

                                                            {/* Actions */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setBlocks(blocks.filter(b => b.id !== block.id));
                                                                }}
                                                                className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <TrashIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}

                                {/* Add Block Button */}
                                <div className="pt-6 pb-4 flex justify-center">
                                    <button
                                        onClick={() => addBlock('task')}
                                        className="flex items-center px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                    >
                                        <PlusIcon className="w-5 h-5 mr-2" />
                                        添加積木
                                    </button>
                                </div>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                {/* Bottom Sheet Editor */}
                <AnimatePresence>
                    {editingBlock && (
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-[#EADBC8] z-50 max-h-[80%] flex flex-col"
                        >
                            <div className="p-4 border-b border-[#EADBC8] flex items-center justify-between bg-[#FFF9F2]/50 rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-[#4B4036]">
                                        {pendingBlock ? '新增積木' : '編輯積木'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        if (pendingBlock) cancelAddBlock();
                                        else setEditingBlockId(null);
                                        setIsSavingTemplate(false); // Reset save state
                                        setEditingTemplateId(null); // Clear template editing
                                    }}
                                    className="p-2 hover:bg-[#EADBC8]/20 rounded-full transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6">
                                {/* Type Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#4B4036]">積木類型</label>
                                    <div className="flex flex-wrap gap-2">
                                        {allBlockTypes.map(t => (
                                            <button
                                                key={t.type}
                                                onClick={() => {
                                                    if (pendingBlock) {
                                                        setPendingBlock({ ...pendingBlock, type: t.type as MindBlockType });
                                                    } else {
                                                        setBlocks(blocks.map(b =>
                                                            b.id === editingBlock.id ? { ...b, type: t.type as MindBlockType } : b
                                                        ));
                                                    }
                                                }}
                                                className={`
                                                    py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center gap-2
                                                    ${editingBlock.type === t.type
                                                        ? `${t.bg} ${t.color.replace('text-', 'border-')} border-opacity-50`
                                                        : 'bg-white border-[#EADBC8] text-[#4B4036]/60 hover:border-[#FFD59A]'}
                                                `}
                                            >
                                                <t.icon className="w-4 h-4" />
                                                {t.label}
                                            </button>
                                        ))}

                                        {/* Create Custom Type Button */}
                                        <button
                                            onClick={() => setIsCreatingType(true)}
                                            className="py-2 px-3 rounded-xl border-2 border-dashed border-[#EADBC8] text-xs font-bold text-[#4B4036]/60 hover:border-[#FFD59A] hover:text-[#4B4036] transition-all flex items-center gap-2"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            自訂類型
                                        </button>
                                    </div>

                                    {/* Custom Type Creator */}
                                    {isCreatingType && (
                                        <div className="mt-3 p-4 bg-[#FFF9F2] rounded-xl border border-[#EADBC8] space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="輸入類型名稱 (如: 魔法)"
                                                    value={newTypeData.name}
                                                    onChange={(e) => setNewTypeData({ ...newTypeData, name: e.target.value })}
                                                    className="flex-1 px-3 py-2 bg-white border border-[#EADBC8] rounded-lg text-sm"
                                                />
                                                <button
                                                    onClick={createCustomType}
                                                    className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg text-sm font-bold"
                                                >
                                                    建立
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Color Picker */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#4B4036]">外觀顏色</label>
                                    <div className="flex gap-2">
                                        {COLOR_PALETTE.map(c => (
                                            <button
                                                key={c.name}
                                                onClick={() => updateBlockParams(editingBlock.id, 'customColor', c.name)}
                                                className={`
                                                    w-8 h-8 rounded-full border-2 transition-all
                                                    ${c.bg} ${c.color.replace('text-', 'border-')}
                                                    ${editingBlock.params.customColor === c.name ? 'ring-2 ring-offset-2 ring-[#FFD59A] scale-110' : 'hover:scale-105'}
                                                `}
                                                title={c.name}
                                            />
                                        ))}
                                        {/* Reset Color */}
                                        <button
                                            onClick={() => updateBlockParams(editingBlock.id, 'customColor', undefined)}
                                            className="w-8 h-8 rounded-full border-2 border-[#EADBC8] bg-white flex items-center justify-center text-[#4B4036]/40 hover:text-[#4B4036] hover:border-[#FFD59A]"
                                            title="預設顏色"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Label Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#4B4036]">
                                        標題 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editingBlock.params.label || ''}
                                        onChange={(e) => updateBlockParams(editingBlock.id, 'label', e.target.value)}
                                        placeholder="例如：美食家角色"
                                        className="w-full px-4 py-2 bg-[#FFF9F2] border border-[#EADBC8] rounded-xl focus:border-[#FFD59A] focus:ring-0 text-[#4B4036]"
                                    />
                                </div>



                                {/* Content Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#4B4036]">內容</label>
                                    <textarea
                                        value={editingBlock.params.content || editingBlock.params.query || editingBlock.params.prompt || ''}
                                        onChange={(e) => updateBlockParams(editingBlock.id, 'content', e.target.value)}
                                        placeholder="輸入此積木的詳細指令..."
                                        className="w-full p-4 bg-[#FFF9F2] border-2 border-[#EADBC8] rounded-xl focus:border-[#FFD59A] focus:ring-0 text-[#4B4036] min-h-[120px] resize-none font-medium"
                                    />
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-4 border-t border-[#EADBC8] flex flex-col gap-3">
                                    {/* Save Template Confirmation Area */}
                                    {isSavingTemplate && (
                                        <div className="p-4 bg-[#FFF9F2] rounded-xl border border-[#EADBC8] space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-[#4B4036]">儲存設定</h4>
                                                <button onClick={() => setIsSavingTemplate(false)} className="text-[#4B4036]/40 hover:text-[#4B4036]">
                                                    <XMarkIcon className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSavePrivacy('private')}
                                                    className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 text-sm font-bold transition-all ${savePrivacy === 'private' ? 'bg-white border-[#FFD59A] text-[#4B4036] shadow-sm' : 'border-transparent text-[#4B4036]/40 hover:bg-white/50'}`}
                                                >
                                                    <LockClosedIcon className="w-4 h-4" />
                                                    私人
                                                </button>
                                                <button
                                                    onClick={() => setSavePrivacy('public')}
                                                    className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 text-sm font-bold transition-all ${savePrivacy === 'public' ? 'bg-white border-blue-300 text-blue-600 shadow-sm' : 'border-transparent text-[#4B4036]/40 hover:bg-white/50'}`}
                                                >
                                                    <GlobeAltIcon className="w-4 h-4" />
                                                    公開
                                                </button>
                                            </div>

                                            <button
                                                onClick={confirmSaveTemplate}
                                                className="w-full py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg font-bold hover:bg-[#FFC56D] transition-colors"
                                            >
                                                {editingTemplateId ? '確認更新' : '確認儲存'}
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3">
                                        {!isSavingTemplate && (
                                            <button
                                                onClick={initiateSaveTemplate}
                                                className="w-full py-2 bg-white border border-[#FFD59A] text-[#FFD59A] rounded-xl font-bold hover:bg-[#FFF9F2] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ArrowDownOnSquareIcon className="w-5 h-5" />
                                                {editingTemplateId ? '更新積木' : '儲存為積木模板'}
                                            </button>
                                        )}

                                        <div className="flex gap-3">
                                            {pendingBlock ? (
                                                <>
                                                    <button
                                                        onClick={cancelAddBlock}
                                                        className="flex-1 py-3 bg-white border border-[#EADBC8] text-[#4B4036] rounded-xl font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
                                                    >
                                                        取消
                                                    </button>
                                                    <button
                                                        onClick={confirmAddBlock}
                                                        className="flex-1 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <PlusIcon className="w-5 h-5" />
                                                        加入畫布
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingBlockId(null)}
                                                    className="w-full py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                                >
                                                    完成編輯
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Live Preview Panel */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="absolute md:relative h-full right-0 bg-white rounded-xl border border-[#EADBC8] shadow-sm flex flex-col overflow-hidden z-30 md:z-10"
                    >
                        <div className="p-4 border-b border-[#EADBC8] bg-[#FFF9F2]/30 flex items-center justify-between">
                            <h3 className="font-bold text-[#4B4036] flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-amber-500" />
                                即時預覽
                            </h3>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={copyToClipboard}
                                    className="p-1.5 hover:bg-[#EADBC8]/20 rounded-lg text-[#4B4036]/60 hover:text-[#4B4036] transition-colors"
                                    title="複製 Prompt"
                                >
                                    <ClipboardDocumentIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-1.5 hover:bg-[#EADBC8]/20 rounded-lg text-[#4B4036]/60 hover:text-[#4B4036] transition-colors md:hidden"
                                    title="關閉預覽"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto bg-[#FAFAFA]">
                            <pre className="whitespace-pre-wrap text-sm text-[#4B4036] font-mono leading-relaxed">
                                {compiledPrompt}
                            </pre>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

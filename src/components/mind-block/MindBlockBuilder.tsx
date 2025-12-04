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
import { getSaasSupabaseClient } from '@/lib/supabase';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { RoleEquipmentPanel } from './RoleEquipmentPanel';

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
    const supabase = getSaasSupabaseClient();
    const searchParams = useSearchParams();
    const [blocks, setBlocks] = useState<MindBlockNode[]>(initialBlocks);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [pendingBlock, setPendingBlock] = useState<MindBlockNode | null>(null); // New state for draft block
    const [showPreview, setShowPreview] = useState(true);
    const [showLibrary, setShowLibrary] = useState(false);
    const [compiledPrompt, setCompiledPrompt] = useState('');
    const [isSavingComposition, setIsSavingComposition] = useState(false);
    const [compositionMetadata, setCompositionMetadata] = useState({
        title: '我的思維積木',
        description: '',
        isPublic: false
    });

    // Custom Types State
    const [customTypes, setCustomTypes] = useState<any[]>([]);
    const [isCreatingType, setIsCreatingType] = useState(false);
    const [newTypeData, setNewTypeData] = useState({ name: '', color: 'text-gray-500', bg: 'bg-gray-50' });
    const [templateDescription, setTemplateDescription] = useState('');

    // Saved Templates State
    const [savedTemplates, setSavedTemplates] = useState<(MindBlockNode & { isPublic?: boolean })[]>([]);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null); // Track if we are updating an existing template
    const [savePrivacy, setSavePrivacy] = useState<'private' | 'public'>('private');

    const { user: currentUser, loading: authLoading } = useSaasAuth();

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
                    isPublic: item.is_public,
                    description: item.description // Load description
                }));
                setSavedTemplates(loadedTemplates);
            }
        };

        if (!authLoading && currentUser) {
            fetchTemplates(currentUser.id);
        }

        return () => {
            mounted = false;
        };
    }, [currentUser, authLoading]);

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

    const [isLoading, setIsLoading] = useState(false);
    const [showRoleEquipment, setShowRoleEquipment] = useState(false);
    const compositionId = searchParams.get('compositionId');

    // Load composition from URL if present
    useEffect(() => {
        console.log('🔍 MindBlockBuilder: compositionId from URL:', compositionId);

        // Remove authLoading check to prevent blocking
        // if (authLoading) {
        //     console.log('⏳ 等待認證狀態載入...');
        //     return;
        // }

        if (compositionId) {
            setIsLoading(true);
            setBlocks([]); // Clear default blocks while loading

            const loadComposition = async () => {
                console.log('🔍 開始載入積木，ID:', compositionId);

                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timed out')), 15000) // Increased to 15s
                );

                try {
                    // Race between the fetch and the timeout
                    const { data: rawData, error } = await Promise.race([
                        supabase
                            .from('mind_blocks' as any)
                            .select('*')
                            .eq('id', compositionId)
                            .maybeSingle(),
                        timeoutPromise.then(() => ({ data: null, error: { message: 'Timeout' } }))
                    ]) as any;

                    const data = rawData as any;

                    if (error) {
                        console.error('❌ 載入積木失敗:', error);
                        // Don't alert immediately, show error in UI or just log
                        // alert(`載入積木失敗: ${error.message}`);
                        // setBlocks(initialBlocks); 
                        setIsLoading(false); // Stop loading spinner
                        return;
                    }

                    if (!data) {
                        console.error('❌ 找不到該積木，ID:', compositionId);
                        alert('找不到該積木');
                        setBlocks(initialBlocks);
                        setIsLoading(false);
                        return;
                    }

                    console.log('📦 載入的積木數據:', {
                        id: data.id,
                        title: data.title,
                        category: data.category,
                        is_template: data.is_template,
                        block_type: data.block_type,
                        is_public: data.is_public,
                        content_json_keys: data.content_json ? Object.keys(data.content_json) : null,
                        has_blocks: data.content_json?.blocks ? 'yes' : 'no',
                        blocks_count: data.content_json?.blocks?.length || 0
                    });

                    // 設置當前編輯的積木 ID 和公開狀態
                    setEditingTemplateId(data.id);
                    setSavePrivacy(data.is_public ? 'public' : 'private');
                    console.log('✅ 設置編輯狀態:', { id: data.id, is_public: data.is_public, privacy: data.is_public ? 'public' : 'private' });

                    // 檢查是組合還是單一積木
                    const isComposition = data.category === 'Composition' || (data.content_json && data.content_json.blocks && Array.isArray(data.content_json.blocks));
                    const isSingleBlock = data.is_template === true || data.block_type;

                    console.log('🔍 判斷結果:', { isComposition, isSingleBlock });

                    if (isComposition && data.content_json?.blocks) {
                        // 組合：直接使用 blocks 數組，但重新生成 ID 以避免重複
                        console.log('✅ 載入組合，積木數量:', data.content_json.blocks.length);
                        const blocksWithNewIds = data.content_json.blocks.map((b: any) => ({
                            ...b,
                            id: Math.random().toString(36).substr(2, 9)
                        }));
                        setBlocks(blocksWithNewIds);
                    } else if (isSingleBlock && data.block_type) {
                        // 單一積木：從 block_type 和 content_json 構建積木節點
                        console.log('✅ 載入單一積木，類型:', data.block_type);
                        console.log('📦 content_json:', data.content_json);

                        // 處理不同的 content_json 結構
                        let blockParams: any = {};

                        if (data.content_json) {
                            // 如果 content_json 有 params
                            if (data.content_json.params) {
                                blockParams = { ...data.content_json.params };
                            }
                            // 如果 content_json 本身就是 params
                            else if (data.content_json.content || data.content_json.query || data.content_json.prompt) {
                                blockParams = { ...data.content_json };
                            }
                            // 如果 content_json 是完整的積木節點
                            else if (data.content_json.type && data.content_json.params) {
                                blockParams = { ...data.content_json.params };
                            }
                        }

                        const singleBlock: MindBlockNode = {
                            id: data.id || `block-${Date.now()}`,
                            type: data.block_type as MindBlockType,
                            params: {
                                ...blockParams,
                                content: blockParams.content || blockParams.query || blockParams.prompt || '',
                                label: data.title,
                                customColor: data.color === '#FFD59A' ? undefined : data.color
                            }
                        };

                        console.log('✅ 構建的積木節點:', singleBlock);
                        setBlocks([singleBlock]);
                    } else if (data.content_json) {
                        // 嘗試其他可能的數據結構
                        // 如果 content_json 本身就是一個積木節點
                        if (data.content_json.type && data.content_json.params) {
                            console.log('✅ 載入積木（直接結構）');
                            setBlocks([data.content_json as MindBlockNode]);
                        } else if (Array.isArray(data.content_json)) {
                            // 如果 content_json 直接是數組
                            console.log('✅ 載入積木（數組結構）');
                            setBlocks(data.content_json);
                        } else {
                            console.warn('⚠️ 無法識別的積木結構:', data);
                            console.warn('⚠️ content_json:', JSON.stringify(data.content_json, null, 2));
                            alert('無法載入該積木，數據結構不正確。請檢查控制台日誌。');
                            setBlocks(initialBlocks);
                        }
                    } else {
                        console.warn('⚠️ 積木沒有 content_json:', data);
                        alert('無法載入該積木，缺少內容數據');
                        setBlocks(initialBlocks);
                    }
                } catch (e) {
                    console.error('❌ 載入積木時發生異常:', e);
                    alert(`載入積木時發生錯誤: ${e instanceof Error ? e.message : String(e)}`);
                    setBlocks(initialBlocks);
                } finally {
                    setIsLoading(false);
                }
            };
            loadComposition();
        } else {
            console.log('ℹ️ 沒有 compositionId 參數，使用默認積木');
            // Ensure we have defaults if no ID
            if (blocks.length === 0) setBlocks(initialBlocks);
        }
    }, [compositionId]); // Removed authLoading dependency

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
        setTemplateDescription((template as any).description || ''); // Load description
        setShowLibrary(false); // Close library to focus on editor
    };

    const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('確定要刪除這個積木嗎？此動作無法復原。')) return;

        // Optimistic update
        setSavedTemplates(savedTemplates.filter(t => t.id !== templateId));

        const { error } = await supabase
            .from('mind_blocks' as any)
            .delete()
            .eq('id', templateId);

        if (error) {
            console.error('Error deleting template:', error);
            alert('刪除失敗');
            // Revert would go here
        }
    };

    const toggleTemplatePrivacy = async (template: MindBlockNode, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;

        const newPrivacy = !(template as any).isPublic;
        const action = newPrivacy ? '公開' : '私人';

        if (!confirm(`確定要將此積木設為${action}嗎？`)) return;

        // Optimistic update
        setSavedTemplates(savedTemplates.map(t =>
            t.id === template.id ? { ...t, isPublic: newPrivacy } : t
        ));

        const { error } = await supabase
            .from('mind_blocks' as any)
            .update({ is_public: newPrivacy })
            .eq('id', template.id);

        if (error) {
            console.error('Error updating privacy:', error);
            alert('更新失敗');
            // Revert
            setSavedTemplates(savedTemplates.map(t =>
                t.id === template.id ? { ...t, isPublic: !newPrivacy } : t
            ));
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
                description: templateDescription, // Use user input description
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
                const { error: updateError } = await supabase
                    .from('mind_blocks' as any)
                    .update(payload)
                    .eq('id', editingTemplateId);
                error = updateError;
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from('mind_blocks' as any)
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

        if (editingTemplateId) {
            // 從數據庫獲取現有標題和描述
            const { data } = await supabase
                .from('mind_blocks' as any)
                .select('title, description, is_public')
                .eq('id', editingTemplateId)
                .single();

            if (data) {
                setCompositionMetadata({
                    title: (data as any).title || '我的思維積木',
                    description: (data as any).description || '',
                    isPublic: (data as any).is_public || false
                });
            }
        } else {
            setCompositionMetadata({
                title: '我的思維積木',
                description: '',
                isPublic: false
            });
        }

        setIsSavingComposition(true);
    };

    const confirmSaveComposition = async () => {
        if (!compositionMetadata.title.trim()) {
            alert('請輸入標題');
            return;
        }

        try {
            const payload = {
                user_id: currentUser!.id,
                title: compositionMetadata.title,
                description: compositionMetadata.description,
                content_json: { blocks }, // Store the array of blocks
                is_template: false, // This is a composition, not a single block template
                is_public: compositionMetadata.isPublic,
                category: 'Composition',
                updated_at: new Date().toISOString()
            };

            let error;
            if (editingTemplateId) {
                // 更新現有組合
                const { error: updateError } = await supabase
                    .from('mind_blocks' as any)
                    .update(payload)
                    .eq('id', editingTemplateId);
                error = updateError;
            } else {
                // 創建新組合
                const { error: insertError } = await supabase
                    .from('mind_blocks' as any)
                    .insert(payload);
                error = insertError;
            }

            if (error) {
                console.error('Error saving composition:', error);
                alert('儲存失敗：' + error.message);
            } else {
                alert(editingTemplateId ? '思維積木組合已更新！' : '思維積木組合已儲存！');
                // 清除編輯狀態
                setEditingTemplateId(null);
                setIsSavingComposition(false);
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

    const [isMobile, setIsMobile] = useState(false);

    // Set default preview state and check mobile
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setShowPreview(false);
            } else {
                setShowPreview(true);
            }
        };

        // Set initial state
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-full md:gap-6 relative flex-col md:flex-row">
            {/* Library Drawer (Left Side) */}
            <AnimatePresence>
                {showLibrary && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: isMobile ? '100%' : 280, opacity: 1 }}
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
                                    onClick={() => {
                                        // Create new template
                                        const newBlock: MindBlockNode = {
                                            id: Math.random().toString(36).substr(2, 9),
                                            type: 'role', // Default type
                                            params: { content: '', label: '新積木' }
                                        };
                                        setPendingBlock(newBlock);
                                        setEditingBlockId(newBlock.id);
                                        setEditingTemplateId(null); // New template
                                        setIsSavingTemplate(true); // Directly into save mode (which is effectively edit mode for templates)
                                        setShowLibrary(false);
                                    }}
                                    className="p-1 hover:bg-[#EADBC8]/20 rounded-full text-[#4B4036]/60 hover:text-[#4B4036]"
                                    title="新增積木"
                                >
                                    <PlusIcon className="w-5 h-5" />
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

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
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
                                                <div key={index} className="w-full relative group">
                                                    <div
                                                        className={`
                                                            relative bg-white rounded-xl border-2 border-[#EADBC8]
                                                            hover:border-[#FFD59A] hover:shadow-md transition-all
                                                            flex items-stretch overflow-hidden cursor-pointer
                                                        `}
                                                        onClick={() => addTemplateToCanvas(template)}
                                                    >
                                                        {/* Color Strip */}
                                                        <div className={`w-2 flex-shrink-0 ${bgClass.replace('bg-', 'bg-').replace('50', '400')}`}></div>

                                                        <div className="flex-1 p-3 flex items-center gap-3 min-w-0">
                                                            {/* Icon */}
                                                            <div className={`
                                                                w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center
                                                                ${bgClass} ${colorClass}
                                                            `}>
                                                                <typeDef.icon className="w-5 h-5" />
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className={`
                                                                        text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full
                                                                        ${bgClass} ${colorClass}
                                                                    `}>
                                                                        {typeDef.label}
                                                                    </span>

                                                                    {/* Privacy Toggle */}
                                                                    <button
                                                                        onClick={(e) => toggleTemplatePrivacy(template, e)}
                                                                        className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                                                                        title={template.isPublic ? "點擊切換為私人" : "點擊切換為公開"}
                                                                    >
                                                                        {template.isPublic ? (
                                                                            <GlobeAltIcon className="w-3 h-3 text-blue-400" />
                                                                        ) : (
                                                                            <LockClosedIcon className="w-3 h-3 text-slate-400" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                                <div className="font-bold text-[#4B4036] text-sm truncate">
                                                                    {template.params.label}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Edit/Delete Actions - In Flow */}
                                                        <div className="flex items-center gap-1 px-2 border-l border-[#EADBC8]/50">
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

                                                        {/* Add Button (Visual Cue) */}
                                                        <div className="flex items-center justify-center px-3 border-l border-[#EADBC8] bg-[#FFF9F2]/30 text-[#4B4036]/40 group-hover:text-[#4B4036] group-hover:bg-[#FFD59A]/20 transition-colors flex-shrink-0">
                                                            <PlusIcon className="w-5 h-5" />
                                                        </div>
                                                    </div>

                                                    {/* 快速装备到角色按钮 */}
                                                    <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowRoleEquipment(true);
                                                            }}
                                                            className="px-2 py-1 text-xs bg-[#FFD59A] text-[#4B4036] rounded-lg font-bold hover:bg-[#FFC56D] transition-colors flex items-center gap-1"
                                                            title="装备到角色"
                                                        >
                                                            <UserIcon className="w-3 h-3" />
                                                            装备到角色
                                                        </button>
                                                    </div>
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
            <div className="flex-1 flex flex-col h-full bg-[#FFF9F2] p-2 md:p-4 rounded-lg md:rounded-xl relative border-0 md:border border-[#EADBC8] shadow-sm z-10">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
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

                    <div className="flex items-center gap-4 flex-wrap">
                        {/* 角色裝備按鈕 */}
                        <button
                            onClick={() => setShowRoleEquipment(true)}
                            className="px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                            title="管理角色裝備"
                        >
                            <UserIcon className="w-5 h-5" />
                            <span className="hidden md:inline">角色裝備</span>
                        </button>

                        {/* 公開/私人開關 - 當編輯積木時顯示 */}
                        {editingTemplateId && (
                            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-[#EADBC8]">
                                <span className="text-xs font-semibold text-[#4B4036] whitespace-nowrap">
                                    {savePrivacy === 'private' ? (
                                        <span className="flex items-center gap-1.5">
                                            <LockClosedIcon className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">私人</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-[#FFB6C1]">
                                            <GlobeAltIcon className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">公開</span>
                                        </span>
                                    )}
                                </span>
                                <button
                                    onClick={() => setSavePrivacy(savePrivacy === 'private' ? 'public' : 'private')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2 ${savePrivacy === 'public'
                                        ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A]'
                                        : 'bg-[#EADBC8]'
                                        }`}
                                    role="switch"
                                    aria-checked={savePrivacy === 'public'}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${savePrivacy === 'public' ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        )}

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
                                {editingTemplateId ? '更新' : '儲存'}
                            </button>
                        </div>
                    </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="mind-blocks">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex-1 overflow-y-auto space-y-3 pb-20 px-2 relative"
                            >
                                {isLoading && (
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFD59A]"></div>
                                            <p className="text-[#4B4036] font-bold animate-pulse">載入積木中...</p>
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="mt-2 px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg text-sm font-bold hover:bg-[#FFC56D] transition-colors"
                                            >
                                                重新整理
                                            </button>
                                        </div>
                                    </div>
                                )}
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

                                                        <div className="flex-1 p-3 md:p-4 flex items-center gap-3 md:gap-4">
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
                                                                <h3 className="font-bold text-[#4B4036] text-sm line-clamp-2 whitespace-normal break-words">
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
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-[#EADBC8] z-50 max-h-[90%] md:max-h-[80%] flex flex-col"
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
                                    <div className="flex flex-wrap gap-2">
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

                                            {/* Description Input for Template */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-[#4B4036]">描述</label>
                                                <textarea
                                                    value={templateDescription}
                                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-[#EADBC8] rounded-lg focus:border-[#FFD59A] focus:ring-0 text-[#4B4036] text-sm min-h-[60px] resize-none"
                                                    placeholder="輸入描述..."
                                                />
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
                        animate={{ width: isMobile ? '100%' : 320, opacity: 1 }}
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

            {/* Save Composition Modal */}
            <AnimatePresence>
                {isSavingComposition && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setIsSavingComposition(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-4 border-b border-[#EADBC8] bg-[#FFF9F2]/50 flex items-center justify-between">
                                <h3 className="font-bold text-[#4B4036]">
                                    {editingTemplateId ? '更新思維積木組合' : '儲存思維積木組合'}
                                </h3>
                                <button
                                    onClick={() => setIsSavingComposition(false)}
                                    className="p-2 hover:bg-[#EADBC8]/20 rounded-full transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#4B4036]">標題</label>
                                    <input
                                        type="text"
                                        value={compositionMetadata.title}
                                        onChange={(e) => setCompositionMetadata({ ...compositionMetadata, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-[#FFF9F2] border border-[#EADBC8] rounded-xl focus:border-[#FFD59A] focus:ring-0 text-[#4B4036]"
                                        placeholder="為這個組合取個名字..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#4B4036]">描述 (選填)</label>
                                    <textarea
                                        value={compositionMetadata.description}
                                        onChange={(e) => setCompositionMetadata({ ...compositionMetadata, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-[#FFF9F2] border border-[#EADBC8] rounded-xl focus:border-[#FFD59A] focus:ring-0 text-[#4B4036] min-h-[80px] resize-none"
                                        placeholder="描述這個組合的用途..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#4B4036]">隱私設定</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCompositionMetadata({ ...compositionMetadata, isPublic: false })}
                                            className={`flex-1 py-2 px-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all ${!compositionMetadata.isPublic ? 'bg-white border-[#FFD59A] text-[#4B4036] shadow-sm' : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            <LockClosedIcon className="w-4 h-4" />
                                            私人
                                        </button>
                                        <button
                                            onClick={() => setCompositionMetadata({ ...compositionMetadata, isPublic: true })}
                                            className={`flex-1 py-2 px-3 rounded-xl border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all ${compositionMetadata.isPublic ? 'bg-white border-blue-300 text-blue-600 shadow-sm' : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            <GlobeAltIcon className="w-4 h-4" />
                                            公開
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-[#EADBC8] bg-[#FFF9F2]/30 flex gap-3">
                                <button
                                    onClick={() => setIsSavingComposition(false)}
                                    className="flex-1 py-2 bg-white border border-[#EADBC8] text-[#4B4036] rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={confirmSaveComposition}
                                    className="flex-1 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                >
                                    {editingTemplateId ? '確認更新' : '確認儲存'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 角色裝備面板 */}
            <AnimatePresence>
                {showRoleEquipment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowRoleEquipment(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <RoleEquipmentPanel
                                onClose={() => setShowRoleEquipment(false)}
                                onEquipBlock={(roleId, mindBlockId) => {
                                    console.log('裝備積木:', { roleId, mindBlockId });
                                    // 可以在這裡添加額外的回調邏輯
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AdjustmentsHorizontalIcon,
    XMarkIcon,
    UserIcon,
    PaintBrushIcon,
    ClipboardDocumentListIcon,
    PlusIcon,
    CpuChipIcon,
    PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { RoleInstance } from '@/types/ai-companion';
import { MindBlock } from '@/types/mind-block';
import { TaskPanelContent, TaskPanelContentProps } from './TaskPanelContent';

interface ChatSettingsPanelProps extends TaskPanelContentProps {
    roleInstance?: RoleInstance | null;
    roleInstances?: RoleInstance[];
    onUpdateRole: (updates: Partial<RoleInstance>) => Promise<void>;
    onUpdateRoleInstance: (roleId: string, updates: Partial<RoleInstance>) => Promise<void>;
    className?: string;
    onClose?: () => void;
}

type SlotType = 'role' | 'style' | 'task';

interface EquippedBlocks {
    role?: MindBlock;
    style?: MindBlock;
    task?: MindBlock;
}

export function ChatSettingsPanel({
    roleInstance,
    roleInstances = [],
    onUpdateRole,
    onUpdateRoleInstance,
    className = '',
    onClose,
    ...taskPanelProps
}: ChatSettingsPanelProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [mindSectionExpanded, setMindSectionExpanded] = useState(true);

    // 根據角色名稱 / slug 推斷對應的夥伴 ID（hibi / mori / pico）
    const inferCompanionId = (instance: RoleInstance): 'hibi' | 'mori' | 'pico' | null => {
        const raw =
            instance.role?.slug ||
            instance.role?.name ||
            instance.nickname ||
            '';
        const n = raw.toLowerCase();

        if (n.includes('hibi')) return 'hibi';
        if (n.includes('mori') || n.includes('墨墨')) return 'mori';
        if (n.includes('pico') || n.includes('皮可')) return 'pico';
        return null;
    };

    const handleRemoveBlock = async (targetRoleInstance: RoleInstance, type: SlotType) => {
        setIsUpdating(true);
        try {
            const currentEquippedBlocks = targetRoleInstance.settings?.equipped_blocks || {};
            const newEquippedBlocks = { ...currentEquippedBlocks };
            delete newEquippedBlocks[type];

            // Update settings
            const newSettings = {
                ...targetRoleInstance.settings,
                equipped_blocks: newEquippedBlocks
            };

            // Construct new system prompt based on blocks
            let newSystemPrompt = targetRoleInstance.role?.system_prompt || '';

            // Append blocks
            if (newEquippedBlocks.role) newSystemPrompt += `\n\n[Role Definition]\n${newEquippedBlocks.role.content_json?.blocks?.[0]?.params?.content || ''}`;
            if (newEquippedBlocks.style) newSystemPrompt += `\n\n[Style Guide]\n${newEquippedBlocks.style.content_json?.blocks?.[0]?.params?.content || ''}`;
            if (newEquippedBlocks.task) newSystemPrompt += `\n\n[Current Task]\n${newEquippedBlocks.task.content_json?.blocks?.[0]?.params?.content || ''}`;

            await onUpdateRoleInstance(targetRoleInstance.id, {
                settings: newSettings,
                system_prompt_override: newSystemPrompt
            });
        } catch (error) {
            console.error('Failed to remove block:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const Slot = ({ roleInstance: targetRoleInstance, type, icon: Icon, label, color }: { roleInstance: RoleInstance, type: SlotType, icon: any, label: string, color: string }) => {
        const equippedBlocks: EquippedBlocks = targetRoleInstance.settings?.equipped_blocks || {};
        const block = equippedBlocks[type];

        return (
            <div className="flex-1 min-w-[100px]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {label}
                    </span>
                </div>

                {block ? (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative group p-2 rounded-lg border ${color} bg-white shadow-sm hover:shadow-md transition-all cursor-pointer h-20`}
                        onClick={() => {
                            const event = new CustomEvent('open-block-selector', {
                                detail: { type, roleInstanceId: targetRoleInstance.id }
                            });
                            window.dispatchEvent(event);
                        }}
                    >
                        <div className="flex items-start justify-between h-full">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-xs line-clamp-1">{block.title}</h4>
                                <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-tight">
                                    {block.description || 'No description'}
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveBlock(targetRoleInstance, type);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all absolute top-1 right-1"
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            const event = new CustomEvent('open-block-selector', {
                                detail: { type, roleInstanceId: targetRoleInstance.id }
                            });
                            window.dispatchEvent(event);
                        }}
                        className="w-full h-20 p-2 rounded-lg border border-dashed border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span className="text-[10px] font-medium">裝備</span>
                    </motion.button>
                )}
            </div>
        );
    };

    return (
        <div className={`bg-white/90 backdrop-blur-md border-l border-gray-200 h-full flex flex-col ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-[#4B4036] flex items-center gap-2">
                        <AdjustmentsHorizontalIcon className="w-5 h-5" />
                        設定面板
                    </h2>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* 專案資訊編輯區域 */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[#4B4036] flex items-center space-x-2">
                            <div className="w-4 h-4 bg-purple-400 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <span>專案資訊</span>
                        </h3>

                        {!taskPanelProps.editingProject && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={taskPanelProps.handleStartEditProject}
                                className="flex items-center space-x-1 px-2 py-1 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg text-xs font-medium transition-all shadow-sm"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>編輯</span>
                            </motion.button>
                        )}
                    </div>

                    {taskPanelProps.editingProject ? (
                        /* 編輯模式 */
                        <div className="space-y-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                            <div>
                                <label className="block text-xs font-medium text-[#4B4036] mb-1">專案名稱</label>
                                <input
                                    type="text"
                                    value={taskPanelProps.editProjectName}
                                    onChange={(e) => taskPanelProps.setEditProjectName(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FFB6C1] focus:border-transparent transition-all"
                                    placeholder="輸入專案名稱..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#4B4036] mb-1">專案指引</label>
                                <textarea
                                    value={taskPanelProps.editProjectDescription}
                                    onChange={(e) => taskPanelProps.setEditProjectDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-2 py-1.5 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FFB6C1] focus:border-transparent transition-all resize-none"
                                    placeholder="輸入專案指引..."
                                />
                            </div>

                            <div className="flex space-x-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={taskPanelProps.handleUpdateProject}
                                    className="flex-1 px-3 py-1.5 bg-[#FFB6C1] hover:bg-[#FFB6C1]/80 text-white rounded-md text-xs font-medium transition-all shadow-sm"
                                >
                                    保存
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => taskPanelProps.setEditingProject(false)}
                                    className="flex-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-[#4B4036] rounded-md text-xs font-medium transition-all"
                                >
                                    取消
                                </motion.button>
                            </div>
                        </div>
                    ) : (
                        /* 顯示模式 */
                        <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                            <div className="mb-2">
                                <div className="text-xs font-medium text-purple-700 mb-0.5">專案名稱</div>
                                <div className="text-sm text-[#4B4036] font-semibold">{taskPanelProps.room.title}</div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-purple-700 mb-0.5">專案指引</div>
                                <div className="text-xs text-[#2B3A3B] leading-relaxed">{taskPanelProps.room.description || '暫無指引'}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mind Blocks Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[#4B4036] flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                                <CpuChipIcon className="w-2.5 h-2.5 text-white" />
                            </div>
                            <span>思維積木</span>
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {roleInstances && roleInstances.length > 0 ? (
                            roleInstances.map((instance) => (
                                <div key={instance.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                                    {/* Character Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                {instance.role?.avatar_url ? (
                                                    <img
                                                        src={
                                                            instance.role.avatar_url.includes('Hibi.png')
                                                                ? '/3d-character-backgrounds/studio/Hibi/lulu(front).png'
                                                                : instance.role.avatar_url
                                                        }
                                                        alt={instance.nickname || instance.role.name}
                                                        className="w-8 h-8 rounded-full object-cover border border-white shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-white shadow-sm">
                                                        <UserIcon className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                )}
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${instance.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-xs">
                                                    {instance.nickname || instance.role?.name}
                                                </h4>
                                                <div className="flex items-center gap-1">
                                                    {/* Model pill removed to avoid duplication */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Slots */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Model Slot */}
                                        <div
                                            className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col justify-between min-h-[96px] relative group hover:border-blue-300 transition-all cursor-pointer"
                                            onClick={() => {
                                                const companionId = inferCompanionId(instance);
                                                if (!companionId) return;

                                                const event = new CustomEvent('open-model-selector', {
                                                    detail: { companionId }
                                                });
                                                window.dispatchEvent(event);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                <CpuChipIcon className="w-4 h-4" />
                                                模型芯片
                                            </div>
                                            <div
                                                className="font-bold text-gray-800 text-xs leading-snug break-all line-clamp-2"
                                                title={instance.model_override || instance.role?.default_model || 'GPT-4o'}
                                            >
                                                {(instance.model_override || instance.role?.default_model || 'GPT-4o').length > 28
                                                    ? (instance.model_override || instance.role?.default_model || 'GPT-4o').slice(0, 28) + '...'
                                                    : (instance.model_override || instance.role?.default_model || 'GPT-4o')}
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                                點擊更換模型
                                            </div>
                                        </div>

                                        {/* Mind Block Slot */}
                                        <div
                                            className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col justify-between h-24 relative group hover:border-purple-300 transition-all cursor-pointer"
                                            onClick={() => {
                                                const event = new CustomEvent('open-block-selector', {
                                                    detail: { type: 'role', roleInstanceId: instance.id } // Role slot by default
                                                });
                                                window.dispatchEvent(event);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                <PuzzlePieceIcon className="w-4 h-4" />
                                                思維積木
                                            </div>
                                            {(() => {
                                                const equipped = (instance.settings as any)?.equipped_blocks || {};
                                                const hasEquipped =
                                                    !!equipped.role?.title ||
                                                    !!equipped.style?.title ||
                                                    !!equipped.task?.title;

                                                const title =
                                                    equipped.role?.title ||
                                                    equipped.style?.title ||
                                                    equipped.task?.title ||
                                                    '未裝備';

                                                return (
                                                    <>
                                                        <div className="font-bold text-gray-800 text-sm truncate">
                                                            {title}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500">
                                                            {hasEquipped
                                                                ? '點擊更換或管理思維積木'
                                                                : '目前尚未裝備思維積木，建議先點擊這裡裝備一個 🎯'}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                                                    <PlusIcon className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 思維積木詳細設定展開欄（簡易說明） */}
                                    <div className="mt-3">
                                        <button
                                            onClick={() => setMindSectionExpanded(!mindSectionExpanded)}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-[#4B4036] hover:border-purple-300 transition-all"
                                        >
                                            <span className="flex items-center gap-2">
                                                <PuzzlePieceIcon className="w-4 h-4" />
                                                思維積木設定
                                            </span>
                                            <span className="text-[10px] text-[#4B4036]/50">
                                                {mindSectionExpanded ? '收起' : '展開'}
                                            </span>
                                        </button>
                                        <AnimatePresence>
                                            {mindSectionExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="mt-2 text-[11px] text-[#4B4036]/70 bg-[#FFF9F2] border border-[#EADBC8] rounded-lg p-2"
                                                >
                                                    為角色加上「角色定位、說話風格、當前任務」等思維積木，可以讓 AI 更貼近你的需求。
                                                    點擊上方思維積木卡片，即可打開積木庫並選擇要裝備的積木。
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                <UserIcon className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-xs">暫無角色</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

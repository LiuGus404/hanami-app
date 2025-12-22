import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserIcon,
    PaintBrushIcon,
    ClipboardDocumentListIcon,
    PlusIcon,
    XMarkIcon,
    PencilIcon
} from '@heroicons/react/24/outline';
import { RoleInstance } from '@/types/ai-companion';
import { MindBlock } from '@/types/mind-block';

interface ChatLoadoutPanelProps {
    roleInstance: RoleInstance;
    onUpdateRole: (updates: Partial<RoleInstance>) => Promise<void>;
    className?: string;
    onClose?: () => void;
}

type SlotType = 'role' | 'style' | 'task';

interface EquippedBlocks {
    role?: MindBlock;
    style?: MindBlock;
    task?: MindBlock;
}

export function ChatLoadoutPanel({
    roleInstance,
    onUpdateRole,
    className = '',
    onClose
}: ChatLoadoutPanelProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    // Get equipped blocks from settings or default to empty
    const equippedBlocks: EquippedBlocks = roleInstance.settings?.equipped_blocks || {};

    const handleRemoveBlock = async (type: SlotType) => {
        setIsUpdating(true);
        try {
            const newEquippedBlocks = { ...equippedBlocks };
            delete newEquippedBlocks[type];

            // Update settings
            const newSettings = {
                ...roleInstance.settings,
                equipped_blocks: newEquippedBlocks
            };

            // Re-compile system prompt
            // This logic should ideally be shared or moved to a utility
            // For now, we'll just update the settings and let the backend or a separate effect handle the prompt compilation if needed
            // OR we do it right here:

            // Construct new system prompt based on blocks
            // Base prompt from role definition
            let newSystemPrompt = roleInstance.role?.system_prompt || '';

            // Append blocks
            if (newEquippedBlocks.role) newSystemPrompt += `\n\n[Role Definition]\n${newEquippedBlocks.role.content_json?.blocks?.[0]?.params?.content || ''}`;
            if (newEquippedBlocks.style) newSystemPrompt += `\n\n[Style Guide]\n${newEquippedBlocks.style.content_json?.blocks?.[0]?.params?.content || ''}`;
            if (newEquippedBlocks.task) newSystemPrompt += `\n\n[Current Task]\n${newEquippedBlocks.task.content_json?.blocks?.[0]?.params?.content || ''}`;

            await onUpdateRole({
                settings: newSettings,
                system_prompt_override: newSystemPrompt
            });
        } catch (error) {
            console.error('Failed to remove block:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const Slot = ({ type, icon: Icon, label, color }: { type: SlotType, icon: any, label: string, color: string }) => {
        const block = equippedBlocks[type];

        return (
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {label}
                    </span>
                </div>

                {block ? (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative group p-3 rounded-xl border-2 ${color} bg-white shadow-sm hover:shadow-md transition-all cursor-pointer`}
                        onClick={() => {
                            // TODO: Open modal to replace/edit
                            const event = new CustomEvent('open-block-selector', {
                                detail: { type, roleInstanceId: roleInstance.id }
                            });
                            window.dispatchEvent(event);
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{block.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                    {block.description || 'No description'}
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveBlock(type);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            const event = new CustomEvent('open-block-selector', {
                                detail: { type, roleInstanceId: roleInstance.id }
                            });
                            window.dispatchEvent(event);
                        }}
                        className="w-full p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">裝備{label}</span>
                    </motion.button>
                )}
            </div>
        );
    };

    return (
        <div className={`bg-white border-l border-gray-200 h-full flex flex-col ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {roleInstance.role?.avatar_url ? (
                            <img
                                src={
                                    roleInstance.role.avatar_url.includes('Hibi.png')
                                        ? '/3d-character-backgrounds/studio/Hibi/lulu(front).png'
                                        : roleInstance.role.avatar_url
                                }
                                alt={roleInstance.nickname || roleInstance.role.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                                <UserIcon className="w-5 h-5 text-blue-500" />
                            </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${roleInstance.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">
                            {roleInstance.nickname || roleInstance.role?.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {roleInstance.role?.category || 'AI Assistant'}
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Slots */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        思維積木裝備欄
                    </h4>

                    <Slot
                        type="role"
                        icon={UserIcon}
                        label="角色設定"
                        color="border-blue-100 hover:border-blue-300"
                    />

                    <Slot
                        type="style"
                        icon={PaintBrushIcon}
                        label="風格語氣"
                        color="border-purple-100 hover:border-purple-300"
                    />

                    <Slot
                        type="task"
                        icon={ClipboardDocumentListIcon}
                        label="當前任務"
                        color="border-green-100 hover:border-green-300"
                    />
                </div>

                {/* System Prompt Preview (Optional, for debugging/transparency) */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            最終指令預覽
                        </h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono max-h-40 overflow-y-auto">
                        {roleInstance.system_prompt_override || roleInstance.role?.system_prompt || 'No system prompt'}
                    </div>
                </div>
            </div>
        </div>
    );
}

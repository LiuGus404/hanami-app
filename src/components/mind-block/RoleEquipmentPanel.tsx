'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserIcon,
    CpuChipIcon,
    PuzzlePieceIcon,
    CheckIcon,
    XMarkIcon,
    PlusIcon,
    TrashIcon,
    SparklesIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { createSaasClient } from '@/lib/supabase-saas';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import type { AIRole } from '@/types/ai-companion';
import type { MindBlock } from '@/types/mind-block';
import { toast } from 'react-hot-toast';

interface RoleEquipmentPanelProps {
    onClose: () => void;
    onEquipBlock?: (roleId: string, mindBlockId: string) => void;
}

interface EquippedBlock extends MindBlock {
    equipment_id: string;
    is_active: boolean;
}

export function RoleEquipmentPanel({ onClose, onEquipBlock }: RoleEquipmentPanelProps) {
    const supabase = createSaasClient();
    const { user: currentUser } = useSaasAuth();

    const [roles, setRoles] = useState<AIRole[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<AIRole | null>(null);
    const [equippedBlocks, setEquippedBlocks] = useState<EquippedBlock[]>([]);
    const [availableBlocks, setAvailableBlocks] = useState<MindBlock[]>([]);
    const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
    const [showBlockSelector, setShowBlockSelector] = useState(false);

    // 组件挂载日志
    useEffect(() => {
        console.log('🎯 [角色装备] 面板已打开');
        console.log('🔍 [角色装备] 当前用户:', currentUser ? { id: currentUser.id, email: currentUser.email } : '未登录');
    }, []);

    // 加载所有角色（公开 + 用户自己的）
    useEffect(() => {
        const loadAllRoles = async () => {
            console.log('🔍 [角色装备] useEffect 触发，currentUser:', currentUser ? '已登录' : '未登录');

            if (!currentUser) {
                console.log('🔍 [角色装备] 等待用户登录...');
                // 即使没有用户，也尝试加载公开角色
                setRolesLoading(true);
                try {
                    console.log('🔍 [角色装备] 尝试加载公开角色（无用户）...');
                    const { data: publicRoles, error } = await supabase
                        .from('ai_roles')
                        .select('*')
                        .eq('is_public', true)
                        .order('created_at', { ascending: false });

                    if (error) {
                        console.error('❌ [角色装备] 加载公开角色失败:', error);
                    } else {
                        console.log('✅ [角色装备] 加载公开角色成功，数量:', publicRoles?.length || 0);
                        setRoles((publicRoles || []) as any[]);
                    }
                } catch (error) {
                    console.error('❌ [角色装备] 加载公开角色异常:', error);
                } finally {
                    setRolesLoading(false);
                }
                return;
            }

            console.log('🔍 [角色装备] 开始加载角色，用户 ID:', currentUser.id);
            setRolesLoading(true);

            try {
                // 先尝试获取所有角色（不限制状态）
                console.log('🔍 [角色装备] 查询所有角色...');
                const { data: allRolesData, error: allRolesError } = await supabase
                    .from('ai_roles')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (allRolesError) {
                    console.error('❌ [角色装备] 查询所有角色失败:', allRolesError);
                    // 如果查询所有角色失败，尝试分别查询
                    const [publicRolesResult, userRolesResult] = await Promise.all([
                        supabase
                            .from('ai_roles')
                            .select('*')
                            .eq('is_public', true)
                            .order('usage_count', { ascending: false }),
                        supabase
                            .from('ai_roles')
                            .select('*')
                            .eq('creator_user_id', currentUser.id)
                            .order('created_at', { ascending: false })
                    ]);

                    const publicRoles = (publicRolesResult.data as any[]) || [];
                    const userRoles = (userRolesResult.data as any[]) || [];

                    console.log('🔍 [角色装备] 公开角色数量:', publicRoles.length);
                    console.log('🔍 [角色装备] 用户角色数量:', userRoles.length);

                    if (publicRolesResult.error) {
                        console.warn('⚠️ [角色装备] 加载公开角色失败:', publicRolesResult.error);
                    }
                    if (userRolesResult.error) {
                        console.warn('⚠️ [角色装备] 加载用户角色失败:', userRolesResult.error);
                    }

                    // 合并并去重（基于 id）
                    const allRolesMap = new Map<string, AIRole>();
                    [...publicRoles, ...userRoles].forEach((role: any) => {
                        allRolesMap.set(role.id, role as any);
                    });

                    const allRoles = Array.from(allRolesMap.values()) as any[];
                    console.log('✅ [角色装备] 合并后角色数量:', allRoles.length);
                    setRoles(allRoles);
                } else {
                    // 成功获取所有角色
                    const allRoles = (allRolesData as any[]) || [];
                    console.log('✅ [角色装备] 成功加载所有角色，数量:', allRoles.length);

                    // 过滤：只显示公开角色或用户自己创建的角色
                    const filteredRoles = allRoles.filter((role: any) =>
                        role.is_public === true || role.creator_user_id === currentUser.id
                    );

                    console.log('🔍 [角色装备] 过滤后角色数量:', filteredRoles.length);
                    setRoles(filteredRoles as any[]);
                }
            } catch (error) {
                console.error('❌ [角色装备] 加载角色异常:', error);
                toast.error('加载角色失败，请检查控制台');
            } finally {
                setRolesLoading(false);
            }
        };

        loadAllRoles();
    }, [currentUser, supabase]);

    // 加载已装备的思维积木
    const loadEquippedBlocks = async (roleId: string) => {
        if (!currentUser || !roleId) return;

        setIsLoadingBlocks(true);
        try {
            // 先获取装备记录
            const { data: equipmentData, error: equipmentError } = await (supabase as any)
                .from('role_mind_blocks')
                .select('id, is_active, mind_block_id')
                .eq('role_id', roleId)
                .eq('user_id', currentUser.id)
                .eq('is_active', true);

            if (equipmentError) throw equipmentError;

            if (!equipmentData || equipmentData.length === 0) {
                setEquippedBlocks([]);
                return;
            }

            // 获取所有相关的思维积木
            const mindBlockIds = equipmentData.map((item: any) => item.mind_block_id);
            const { data: blocksData, error: blocksError } = await supabase
                .from('mind_blocks' as any)
                .select('*')
                .in('id', mindBlockIds);

            if (blocksError) throw blocksError;

            // 合并数据
            const blocks = (blocksData || []).map((block: any) => {
                const equipment = (equipmentData as any[]).find((e: any) => e.mind_block_id === block.id);
                return {
                    ...block,
                    equipment_id: equipment?.id || '',
                    is_active: equipment?.is_active || false,
                };
            }) as EquippedBlock[];

            setEquippedBlocks(blocks);
        } catch (error) {
            console.error('加载已装备积木失败:', error);
            toast.error('加载已装备积木失败');
        } finally {
            setIsLoadingBlocks(false);
        }
    };

    // 加载可用的思维积木
    const loadAvailableBlocks = async () => {
        if (!currentUser) return;

        setIsLoadingBlocks(true);
        try {
            const { data, error } = await supabase
                .from('mind_blocks' as any)
                .select('*')
                .or(`is_public.eq.true,user_id.eq.${currentUser.id}`)
                .eq('is_template', true)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setAvailableBlocks((data || []) as any[]);
        } catch (error) {
            console.error('加载可用积木失败:', error);
            toast.error('加载可用积木失败');
        } finally {
            setIsLoadingBlocks(false);
        }
    };

    // 装备思维积木到角色
    const equipBlock = async (mindBlockId: string) => {
        if (!selectedRole || !currentUser) return;

        try {
            // 检查是否已经装备
            const { data: existing } = await (supabase as any)
                .from('role_mind_blocks')
                .select('id')
                .eq('role_id', selectedRole.id)
                .eq('mind_block_id', mindBlockId)
                .eq('user_id', currentUser.id)
                .maybeSingle();

            if (existing) {
                // 如果已存在，激活它
                const { error } = await (supabase as any)
                    .from('role_mind_blocks')
                    .update({ is_active: true })
                    .eq('id', (existing as any).id);

                if (error) throw error;
                toast.success('思维积木已激活');
            } else {
                // 创建新的装备记录
                const { error } = await (supabase as any)
                    .from('role_mind_blocks')
                    .insert({
                        role_id: selectedRole.id,
                        mind_block_id: mindBlockId,
                        user_id: currentUser.id,
                        is_active: true,
                    });

                if (error) throw error;
                toast.success('思维积木已装备');
            }

            // 重新加载已装备的积木
            await loadEquippedBlocks(selectedRole.id);
            setShowBlockSelector(false);
            onEquipBlock?.(selectedRole.id, mindBlockId);
        } catch (error) {
            console.error('装备积木失败:', error);
            toast.error('装备积木失败');
        }
    };

    // 卸载思维积木
    const unequipBlock = async (equipmentId: string) => {
        if (!selectedRole || !currentUser) return;

        if (!confirm('确定要卸载这个思维积木吗？')) return;

        try {
            const { error } = await (supabase as any)
                .from('role_mind_blocks')
                .update({ is_active: false })
                .eq('id', equipmentId);

            if (error) throw error;

            toast.success('思维积木已卸载');
            await loadEquippedBlocks(selectedRole.id);
        } catch (error) {
            console.error('卸载积木失败:', error);
            toast.error('卸载积木失败');
        }
    };

    // 当选择角色时，加载已装备的积木
    useEffect(() => {
        if (selectedRole) {
            loadEquippedBlocks(selectedRole.id);
        } else {
            setEquippedBlocks([]);
        }
    }, [selectedRole, currentUser]);

    // 初始加载可用积木
    useEffect(() => {
        if (showBlockSelector) {
            loadAvailableBlocks();
        }
    }, [showBlockSelector, currentUser]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl border border-[#EADBC8] shadow-lg p-6 space-y-6"
        >
            {/* 标题栏 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-[#4B4036]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#4B4036]">角色装备管理</h3>
                        <p className="text-sm text-[#4B4036]/60">为角色装备思维积木</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#EADBC8]/20 rounded-lg transition-colors"
                >
                    <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
                </button>
            </div>

            {/* 角色选择 */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-[#4B4036]">选择角色</label>
                {rolesLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <ArrowPathIcon className="w-5 h-5 animate-spin text-[#FFD59A]" />
                        <span className="ml-2 text-[#4B4036]/60">加载角色中...</span>
                    </div>
                ) : roles.length === 0 ? (
                    <div className="p-8 text-center bg-[#FFF9F2] rounded-xl border border-[#EADBC8]">
                        <UserIcon className="w-12 h-12 text-[#4B4036]/20 mx-auto mb-3" />
                        <p className="text-sm text-[#4B4036]/60 mb-2">还没有可用的角色</p>
                        <p className="text-xs text-[#4B4036]/40">请先创建角色或等待公开角色加载</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedRole?.id === role.id
                                    ? 'border-[#FFD59A] bg-[#FFF9F2] shadow-sm'
                                    : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {role.avatar_url ? (
                                        <img
                                            src={
                                                role.avatar_url.includes('Hibi.png')
                                                    ? '/3d-character-backgrounds/studio/Hibi/lulu(front).png'
                                                    : role.avatar_url
                                            }
                                            alt={role.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] flex items-center justify-center">
                                            <CpuChipIcon className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[#4B4036] truncate" title={role.name}>
                                            {role.name && role.name.length > 20 ? role.name.substring(0, 20) + '...' : role.name}
                                        </div>
                                        <div className="text-xs text-[#4B4036]/60 truncate" title={role.description || '无描述'}>
                                            {role.description && role.description.length > 30
                                                ? role.description.substring(0, 30) + '...'
                                                : (role.description || '无描述')}
                                        </div>
                                    </div>
                                    {selectedRole?.id === role.id && (
                                        <CheckIcon className="w-5 h-5 text-[#FFD59A] flex-shrink-0" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 角色信息显示 */}
            {selectedRole && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                >
                    {/* 模型信息 */}
                    <div className="p-4 bg-[#FFF9F2] rounded-xl border border-[#EADBC8]">
                        <div className="flex items-center gap-2 mb-3">
                            <CpuChipIcon className="w-5 h-5 text-amber-500" />
                            <span className="font-bold text-[#4B4036]">模型配置</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[#4B4036]/60 flex-shrink-0">默认模型:</span>
                                <span className="font-medium text-[#4B4036] truncate text-right" title={selectedRole.default_model}>
                                    {selectedRole.default_model && selectedRole.default_model.length > 30
                                        ? selectedRole.default_model.substring(0, 30) + '...'
                                        : selectedRole.default_model}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[#4B4036]/60 flex-shrink-0">温度:</span>
                                <span className="font-medium text-[#4B4036]">{selectedRole.temperature}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[#4B4036]/60 flex-shrink-0">最大Token:</span>
                                <span className="font-medium text-[#4B4036]">{selectedRole.max_tokens}</span>
                            </div>
                        </div>
                    </div>

                    {/* 已装备的思维积木 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-[#4B4036] flex items-center gap-2">
                                <PuzzlePieceIcon className="w-4 h-4" />
                                已装备的思维积木
                            </label>
                            <button
                                onClick={() => setShowBlockSelector(true)}
                                className="px-3 py-1.5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-lg text-sm font-bold hover:shadow-md transition-all flex items-center gap-1"
                            >
                                <PlusIcon className="w-4 h-4" />
                                装备积木
                            </button>
                        </div>

                        {isLoadingBlocks ? (
                            <div className="flex items-center justify-center py-8">
                                <ArrowPathIcon className="w-5 h-5 animate-spin text-[#FFD59A]" />
                                <span className="ml-2 text-[#4B4036]/60">加载中...</span>
                            </div>
                        ) : equippedBlocks.length === 0 ? (
                            <div className="p-8 text-center bg-[#FFF9F2] rounded-xl border border-[#EADBC8]">
                                <PuzzlePieceIcon className="w-12 h-12 text-[#4B4036]/20 mx-auto mb-3" />
                                <p className="text-sm text-[#4B4036]/60">还没有装备任何思维积木</p>
                                <button
                                    onClick={() => setShowBlockSelector(true)}
                                    className="mt-3 px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg text-sm font-bold hover:bg-[#FFC56D] transition-colors"
                                >
                                    立即装备
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {equippedBlocks.map((block) => (
                                    <div
                                        key={block.equipment_id}
                                        className="p-4 bg-white rounded-xl border border-[#EADBC8] hover:border-[#FFD59A] transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: block.color || '#FFD59A' }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-[#4B4036] truncate">{block.title}</div>
                                                {block.description && (
                                                    <div className="text-xs text-[#4B4036]/60 truncate">{block.description}</div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => unequipBlock(block.equipment_id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="卸载"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* 积木选择器模态框 */}
            <AnimatePresence>
                {showBlockSelector && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowBlockSelector(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-[#EADBC8] bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] flex items-center justify-between">
                                <h3 className="text-xl font-bold text-[#4B4036] flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5" />
                                    选择思维积木
                                </h3>
                                <button
                                    onClick={() => setShowBlockSelector(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {isLoadingBlocks ? (
                                    <div className="flex items-center justify-center py-12">
                                        <ArrowPathIcon className="w-5 h-5 animate-spin text-[#FFD59A]" />
                                        <span className="ml-2 text-[#4B4036]/60">加载中...</span>
                                    </div>
                                ) : availableBlocks.length === 0 ? (
                                    <div className="text-center py-12">
                                        <PuzzlePieceIcon className="w-16 h-16 text-[#4B4036]/20 mx-auto mb-4" />
                                        <p className="text-[#4B4036]/60">没有可用的思维积木</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {availableBlocks.map((block) => (
                                            <button
                                                key={block.id}
                                                onClick={() => equipBlock(block.id)}
                                                className="p-4 bg-white rounded-xl border border-[#EADBC8] hover:border-[#FFD59A] hover:shadow-md transition-all text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: (block.color || '#FFD59A') + '20' }}
                                                    >
                                                        <PuzzlePieceIcon
                                                            className="w-6 h-6"
                                                            style={{ color: block.color || '#FFD59A' }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-[#4B4036] truncate">{block.title}</div>
                                                        {block.description && (
                                                            <div className="text-xs text-[#4B4036]/60 truncate mt-1">
                                                                {block.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <PlusIcon className="w-5 h-5 text-[#4B4036]/40 group-hover:text-[#FFD59A] transition-colors flex-shrink-0" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}


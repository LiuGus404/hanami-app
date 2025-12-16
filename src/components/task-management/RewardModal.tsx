import React, { useState, useEffect } from 'react';
import { Reward } from '@/types/task-management';
import { REWARD_ICONS, DEFAULT_REWARD_ICON } from './RewardIcons';

interface RewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rewardData: Partial<Reward>) => Promise<void>;
    onDelete?: (reward: Reward) => Promise<void>;
    initialData?: Reward;
    isSubmitting: boolean;
}

export function RewardModal({ isOpen, onClose, onSubmit, onDelete, initialData, isSubmitting }: RewardModalProps) {
    // ... existing state ...
    const [formData, setFormData] = useState({
        title: '',
        points_cost: 100,
        icon: DEFAULT_REWARD_ICON
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                points_cost: initialData.points_cost,
                icon: initialData.icon || DEFAULT_REWARD_ICON
            });
        } else {
            setFormData({
                title: '',
                points_cost: 100,
                icon: DEFAULT_REWARD_ICON
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleDelete = async () => {
        if (initialData && onDelete) {
            if (confirm('確定要刪除此獎勵嗎？此操作無法撤銷。')) {
                await onDelete(initialData);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#2B3A3B]">
                        {initialData ? '編輯獎勵' : '新增獎勵'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">圖示</label>
                        <div className="grid grid-cols-6 gap-2 mb-2 max-h-40 overflow-y-auto p-1 scrollbar-hide">
                            {Object.entries(REWARD_ICONS).map(([name, Icon]) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, icon: name })}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${formData.icon === name
                                            ? 'bg-[#2B3A3B] text-white scale-110 shadow-md ring-2 ring-offset-1 ring-[#2B3A3B]'
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                                        }`}
                                    title={name}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">名稱</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#2B3A3B] focus:ring-2 focus:ring-[#2B3A3B]/20 outline-none transition-all"
                            placeholder="例如：看電視 30 分鐘"
                        />
                    </div>

                    {/* Points Cost */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">所需積分</label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="0"
                                step="10"
                                value={formData.points_cost}
                                onChange={(e) => setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#2B3A3B] focus:ring-2 focus:ring-[#2B3A3B]/20 outline-none transition-all pl-10"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">💎</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        {initialData && onDelete && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                                title="刪除獎勵"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-[#2B3A3B] text-white font-medium hover:bg-[#3D5253] active:scale-95 transition-all shadow-lg shadow-[#2B3A3B]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '處理中...' : (initialData ? '保存修改' : '新增獎勵')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

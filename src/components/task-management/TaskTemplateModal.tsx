'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskTemplate, Task } from '@/types/task-management';

interface TaskTemplateModalProps {
    onSelect: (template: TaskTemplate) => void;
    onEdit: (template: TaskTemplate) => void;
    onClose: () => void;
}

export default function TaskTemplateModal({ onSelect, onEdit, onClose }: TaskTemplateModalProps) {
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tasks/templates');
            if (!response.ok) throw new Error('Failed to fetch templates');
            const data = await response.json();
            setTemplates(data || []);
        } catch (err) {
            console.error('Error:', err);
            setError('無法載入模板');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('確定要刪除此模板嗎？')) return;

        try {
            const response = await fetch(`/api/tasks/templates?id=${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete template');
            setTemplates(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
            alert('刪除失敗');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FFF9F2]">
                    <h3 className="text-xl font-bold text-[#2B3A3B] flex items-center gap-2">
                        <span className="text-2xl">📋</span> 選擇任務模板
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">{error}</div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-4xl mb-3">📭</div>
                            <p>尚無模板，請先創建一個</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {templates.map(template => (
                                <motion.div
                                    key={template.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group relative p-4 rounded-2xl bg-[#FDFBF7] border border-gray-100 hover:border-[#FFD59A] hover:shadow-md cursor-pointer transition-all"
                                    onClick={() => onSelect(template)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-[#2B3A3B] text-lg">{template.name}</h4>
                                            {template.description && <p className="text-sm text-gray-500 mt-1">{template.description}</p>}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(template);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-500 transition-all"
                                                title="編輯模板"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(template.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                                                title="刪除模板"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${template.task_data.priority?.includes('urgent') ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                                            }`}>
                                            {template.task_data.priority ? '有優先級' : '無優先級'}
                                        </span>
                                        {template.task_data.checklist && (template.task_data.checklist as any[]).length > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-500">
                                                {(template.task_data.checklist as any[]).length} 檢查項
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

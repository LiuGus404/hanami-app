'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PhotoIcon,
    ShieldCheckIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

interface PhotoUploadModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function PhotoUploadModal({
    isOpen,
    onConfirm,
    onCancel
}: PhotoUploadModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center"
                style={{
                    background: 'linear-gradient(135deg, rgba(180,180,180,0.4) 0%, rgba(120,120,120,0.6) 100%)'
                }}
                onClick={onCancel}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative max-w-xs mx-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Main Card - Frosted Glass */}
                    <div
                        className="rounded-3xl overflow-hidden"
                        style={{
                            background: 'rgba(255, 255, 255, 0.25)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
                        }}
                    >
                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {/* Icon */}
                            <div className="flex justify-center">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, #F8B4C4 0%, #F5A0B5 100%)',
                                        boxShadow: '0 4px 12px rgba(248, 180, 196, 0.4)'
                                    }}
                                >
                                    <PhotoIcon className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {/* Title */}
                            <div className="text-center">
                                <h3 className="text-[#3A3A3A] font-semibold text-lg">上傳相片裝飾</h3>
                                <p className="text-[#6B6B6B] text-sm mt-1">為聖誕樹添加專屬裝飾</p>
                            </div>

                            {/* Notice Items */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-[#4A4A4A]">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(255, 255, 255, 0.5)' }}
                                    >
                                        <ShieldCheckIcon className="w-4 h-4 text-[#6AA84F]" />
                                    </div>
                                    <span className="text-sm">相片只儲存在您的裝置</span>
                                </div>

                                <div className="flex items-center gap-3 text-[#4A4A4A]">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(255, 255, 255, 0.5)' }}
                                    >
                                        <SparklesIcon className="w-4 h-4 text-[#D4A373]" />
                                    </div>
                                    <span className="text-sm">放大聖誕樹可看到相片</span>
                                </div>
                            </div>

                            {/* Privacy Note */}
                            <div
                                className="rounded-xl p-3 text-xs text-[#5A5A5A]"
                                style={{ background: 'rgba(106, 168, 79, 0.1)' }}
                            >
                                <div className="flex items-start gap-2">
                                    <ShieldCheckIcon className="w-4 h-4 text-[#6AA84F] flex-shrink-0 mt-0.5" />
                                    <span>您的相片不會上傳至伺服器，僅在本地瀏覽器中儲存。清除瀏覽器資料將會刪除相片。</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Buttons - Outside card, pill style */}
                    <div className="flex gap-3 mt-4 px-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 px-6 rounded-full font-medium text-sm text-[#4A4A4A] transition-all"
                            style={{
                                background: 'rgba(255, 255, 255, 0.6)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                            }}
                        >
                            取消
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 px-6 rounded-full font-medium text-sm text-white transition-all flex items-center justify-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #F8B4C4 0%, #F5A0B5 100%)',
                                boxShadow: '0 4px 12px rgba(248, 180, 196, 0.4)'
                            }}
                        >
                            選擇相片
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

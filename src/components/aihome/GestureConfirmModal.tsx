'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HandRaisedIcon,
    VideoCameraIcon,
    LightBulbIcon
} from '@heroicons/react/24/outline';

interface GestureConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function GestureConfirmModal({
    isOpen,
    onConfirm,
    onCancel,
    isLoading
}: GestureConfirmModalProps) {
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
                                        background: 'linear-gradient(135deg, #A7C7E7 0%, #7BB5E0 100%)',
                                        boxShadow: '0 4px 12px rgba(167, 199, 231, 0.4)'
                                    }}
                                >
                                    <HandRaisedIcon className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {/* Title */}
                            <div className="text-center">
                                <h3 className="text-[#3A3A3A] font-semibold text-lg">啟用手勢互動</h3>
                                <p className="text-[#6B6B6B] text-sm mt-1">需要使用相機偵測手勢</p>
                            </div>

                            {/* Notice Items */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-[#4A4A4A]">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(255, 255, 255, 0.5)' }}
                                    >
                                        <VideoCameraIcon className="w-4 h-4 text-[#5A8AC7]" />
                                    </div>
                                    <span className="text-sm">需要相機權限</span>
                                </div>

                                <div className="flex items-center gap-3 text-[#4A4A4A]">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(255, 255, 255, 0.5)' }}
                                    >
                                        <LightBulbIcon className="w-4 h-4 text-[#D4A373]" />
                                    </div>
                                    <span className="text-sm">確保光線充足</span>
                                </div>

                                <div className="flex items-center gap-3 text-[#4A4A4A]">
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'rgba(255, 255, 255, 0.5)' }}
                                    >
                                        <HandRaisedIcon className="w-4 h-4 text-[#6AA84F]" />
                                    </div>
                                    <span className="text-sm">手部保持在畫面內</span>
                                </div>
                            </div>

                            {/* Privacy Note */}
                            <p className="text-center text-[#8A8A8A] text-xs">
                                影像僅在本地處理，不會上傳
                            </p>
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
                            disabled={isLoading}
                            className="flex-1 py-3 px-6 rounded-full font-medium text-sm text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #A7C7E7 0%, #7BB5E0 100%)',
                                boxShadow: '0 4px 12px rgba(167, 199, 231, 0.4)'
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    載入中
                                </>
                            ) : (
                                '啟用'
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

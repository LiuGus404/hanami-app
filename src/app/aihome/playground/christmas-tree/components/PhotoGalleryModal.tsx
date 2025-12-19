'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    TrashIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { PhotoDecoration } from '../hooks/usePhotoDecorations';

interface PhotoGalleryModalProps {
    isOpen: boolean;
    photos: PhotoDecoration[];
    onClose: () => void;
    onDelete: (id: string) => void;
    onAddMore: () => void;
    maxPhotos?: number;
}

export default function PhotoGalleryModal({
    isOpen,
    photos,
    onClose,
    onDelete,
    onAddMore,
    maxPhotos = 10
}: PhotoGalleryModalProps) {
    if (!isOpen) return null;

    const canAddMore = photos.length < maxPhotos;

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
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative max-w-sm w-full mx-4"
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
                        {/* Header */}
                        <div className="p-4 border-b border-white/20 flex justify-between items-center">
                            <h3 className="text-[#3A3A3A] font-semibold text-lg">相片裝飾</h3>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-full hover:bg-white/30 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-[#4A4A4A]" />
                            </button>
                        </div>

                        {/* Photo Grid */}
                        <div className="p-4">
                            <p className="text-sm text-[#6B6B6B] mb-3">
                                已上傳 {photos.length} / {maxPhotos} 張
                            </p>

                            <div className="grid grid-cols-3 gap-3">
                                {/* Existing Photos */}
                                {photos.map((photo) => (
                                    <div key={photo.id} className="relative group aspect-square">
                                        <img
                                            src={photo.dataUrl}
                                            alt="Photo decoration"
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        {/* Delete Button */}
                                        <button
                                            onClick={() => onDelete(photo.id)}
                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add More Button */}
                                {canAddMore && (
                                    <button
                                        onClick={onAddMore}
                                        className="aspect-square rounded-xl border-2 border-dashed border-[#D0D0D0] hover:border-[#F8B4C4] hover:bg-[#F8B4C4]/10 flex flex-col items-center justify-center gap-1 transition-all"
                                    >
                                        <PlusIcon className="w-6 h-6 text-[#9A9A9A]" />
                                        <span className="text-xs text-[#9A9A9A]">新增</span>
                                    </button>
                                )}
                            </div>

                            {photos.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-[#9A9A9A] mb-3">還沒有上傳相片</p>
                                    <button
                                        onClick={onAddMore}
                                        className="px-4 py-2 rounded-full text-sm text-white"
                                        style={{
                                            background: 'linear-gradient(135deg, #F8B4C4 0%, #F5A0B5 100%)'
                                        }}
                                    >
                                        上傳第一張相片
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Close Button */}
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 rounded-full font-medium text-sm text-white transition-all"
                            style={{
                                background: 'linear-gradient(135deg, #F8B4C4 0%, #F5A0B5 100%)',
                                boxShadow: '0 4px 12px rgba(248, 180, 196, 0.4)'
                            }}
                        >
                            完成
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

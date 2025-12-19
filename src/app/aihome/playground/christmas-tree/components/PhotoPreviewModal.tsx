'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PhotoDecoration } from '../hooks/usePhotoDecorations';

interface PhotoPreviewModalProps {
    photo: PhotoDecoration | null;
    onClose: () => void;
    onDelete?: (id: string) => void;
}

export default function PhotoPreviewModal({ photo, onClose, onDelete }: PhotoPreviewModalProps) {
    if (!photo) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Photo container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative max-w-[80vw] max-h-[80vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Decorative border with dominant color */}
                    <div
                        className="absolute -inset-3 rounded-2xl"
                        style={{
                            background: `linear-gradient(135deg, ${photo.dominantColor}40 0%, ${photo.dominantColor}20 100%)`,
                            boxShadow: `0 0 40px ${photo.dominantColor}50`
                        }}
                    />

                    {/* Photo */}
                    <img
                        src={photo.dataUrl}
                        alt="Photo decoration"
                        className="relative rounded-xl max-w-full max-h-[70vh] object-contain shadow-2xl"
                    />

                    {/* Delete button */}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(photo.id);
                                onClose();
                            }}
                            className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            <span className="text-sm">刪除相片</span>
                        </button>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

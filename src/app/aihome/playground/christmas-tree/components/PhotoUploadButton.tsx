'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface PhotoUploadButtonProps {
    onClick: () => void;
    isLoading?: boolean;
    photoCount?: number;
    maxPhotos?: number;
}

export default function PhotoUploadButton({
    onClick,
    isLoading,
    photoCount = 0,
    maxPhotos = 10
}: PhotoUploadButtonProps) {
    const isFull = photoCount >= maxPhotos;

    return (
        <motion.button
            onClick={onClick}
            disabled={isLoading || isFull}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
                relative w-10 h-10 rounded-full shadow-md flex items-center justify-center 
                transition-all duration-300 cursor-pointer border border-white/20
                ${isFull
                    ? 'bg-[#E0E0E0] cursor-not-allowed'
                    : 'bg-[#F8B4C4] hover:bg-[#F5A0B5]'
                }
                ${isLoading ? 'opacity-60' : ''}
            `}
        >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
                <PhotoIcon className="w-5 h-5 text-white" />
            )}

            {/* Photo count badge */}
            {photoCount > 0 && !isLoading && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B8A] rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{photoCount}</span>
                </div>
            )}
        </motion.button>
    );
}

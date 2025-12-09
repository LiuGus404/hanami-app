import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoIcon, CameraIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface ReferenceImagePickerProps {
    onClose: () => void;
    onSelectUpload: () => void;
    onSelectCamera: () => void;
    onFilesSelected?: (files: File[]) => void;
}

export const ReferenceImagePicker: React.FC<ReferenceImagePickerProps> = ({
    onClose,
    onSelectUpload,
    onSelectCamera,
    onFilesSelected
}) => {
    const [isDragging, setIsDragging] = useState(false);

    // Drag handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0 && onFilesSelected) {
                onFilesSelected(files);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-sm overflow-hidden"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Background Gradients & Glass Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9F2]/90 to-[#FFE4E1]/90 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl" />

                {/* Decorative Blobs - Animated */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-32 -right-32 w-64 h-64 bg-[#FFD59A]/20 rounded-full blur-3xl pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#FFB6C1]/20 rounded-full blur-3xl pointer-events-none"
                />

                <div className="relative z-10 p-6 flex flex-col items-center">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/60 hover:bg-white text-[#4B4036] border border-[#EADBC8]/50 shadow-sm transition-all duration-300 transform hover:rotate-90 hover:scale-105 active:scale-95 z-20"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>

                    {/* Drag & Drop Area */}
                    <div
                        className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 bg-white/40 mb-5 relative group cursor-pointer overflow-hidden
                        ${isDragging
                                ? 'border-[#FFB6C1] bg-white/70 scale-[1.02] shadow-[0_0_20px_rgba(255,182,193,0.3)]'
                                : 'border-[#FFD59A] hover:border-[#FFB6C1] hover:bg-white/50 hover:shadow-lg'
                            }`}
                        onClick={onSelectUpload}
                    >
                        {/* Cloud Icon - Floating Animation */}
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className={`p-4 rounded-full bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] shadow-xl text-white transform transition-transform duration-300 group-hover:scale-110 ${isDragging ? 'scale-125' : ''}`}
                        >
                            <CloudArrowUpIcon className="w-10 h-10" />
                        </motion.div>

                        {/* Text */}
                        <div className="text-center space-y-1 z-10">
                            <h3 className="text-lg font-bold tracking-widest text-[#FF9BB3] group-hover:text-[#FF8DA1] transition-colors">
                                {isDragging ? '放開以開始上傳' : '點擊或拖放圖片'}
                            </h3>
                            <p className="text-xs font-medium text-[#FF9BB3]/70 tracking-wide group-hover:text-[#FF9BB3] transition-colors">
                                支援 JPG, PNG, WEBP
                            </p>
                        </div>

                        {/* Hover Overlay Effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {/* Divider with "OR" */}
                    <div className="w-full flex items-center gap-3 mb-5 opacity-60">
                        <div className="h-px bg-gradient-to-r from-transparent via-[#4B4036]/20 to-transparent flex-1" />
                        <span className="text-xs font-medium text-[#4B4036]/60">或是</span>
                        <div className="h-px bg-gradient-to-r from-transparent via-[#4B4036]/20 to-transparent flex-1" />
                    </div>

                    {/* Camera Option - Redesigned to be Distinct */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onSelectCamera}
                        className="w-full relative overflow-hidden group rounded-xl bg-white border border-[#EADBC8] p-1 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD59A]/10 to-[#FFB6C1]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative flex items-center justify-center gap-3 py-3 rounded-lg border border-dashed border-[#EADBC8] group-hover:border-[#FFB6C1] group-hover:bg-white/50 transition-all">
                            <div className="p-2 bg-[#F8F5EC] rounded-full group-hover:bg-[#FFF0F5] transition-colors">
                                <CameraIcon className="w-5 h-5 text-[#8C7A6B] group-hover:text-[#FFB6C1] transition-colors" />
                            </div>
                            <span className="font-bold text-[#4B4036] group-hover:text-[#FF9BB3] transition-colors tracking-wide">
                                拍攝照片
                            </span>
                        </div>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

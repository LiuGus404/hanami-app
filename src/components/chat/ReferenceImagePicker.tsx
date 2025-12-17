import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoIcon, CameraIcon, XMarkIcon, CloudArrowUpIcon, SparklesIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';

interface ReferenceImagePickerProps {
    onClose: () => void;
    onSelectUpload: () => void;
    onSelectCamera: () => void;
    onFilesSelected?: (files: File[]) => void;
    // New props for Vision and Mind Block selectors
    availableModels?: any[];
    currentVisionModelId?: string;
    currentVisionMindBlockTitle?: string;  // ⭐ Changed: Vision-specific mind block
}

export const ReferenceImagePicker: React.FC<ReferenceImagePickerProps> = ({
    onClose,
    onSelectUpload,
    onSelectCamera,
    onFilesSelected,
    availableModels = [],
    currentVisionModelId,
    currentVisionMindBlockTitle  // ⭐ Changed: Vision-specific mind block
}) => {
    console.log('🖼️ [Render] ReferenceImagePicker Rendered');
    const [isDragging, setIsDragging] = useState(false);

    // Helper functions for model display (ported from ChatSettingsPanel)
    const getModelLevel = (model: any) => {
        if (model?.metadata?.level) return model.metadata.level;
        const lowerId = (model?.model_id || '').toLowerCase();
        if (lowerId.includes('flux')) return 'L2';
        if (lowerId.includes('flash') && lowerId.includes('image')) return 'L2';
        if (lowerId.includes('gpt-5') && lowerId.includes('image') && lowerId.includes('mini')) return 'L2';
        if (lowerId.includes('pro') && !lowerId.includes('flux')) return 'L3';
        if (lowerId.includes('flash') || lowerId.includes('mini') || lowerId.includes('lite') || lowerId.includes('haiku')) return 'L1';
        if (lowerId.includes('standard')) return 'L2';
        if (lowerId.includes('gpt-4')) return 'L2';
        return 'L3';
    };

    const getFamilyName = (model: any) => {
        const n = (model?.display_name || '').toLowerCase();
        const i = (model?.model_id || '').toLowerCase();
        if (n.includes('gemini') || i.includes('google')) return 'Gemini';
        if (n.includes('gpt') || n.includes('openai') || i.includes('openai')) return 'ChatGPT';
        if (n.includes('claude') || i.includes('anthropic')) return 'Claude';
        if (n.includes('deepseek')) return 'DeepSeek';
        if (n.includes('grok') || i.includes('x-ai')) return 'Grok';
        if (n.includes('flux')) return 'Flux';
        let label = model?.display_name || model?.model_id?.split('/').pop() || 'Unknown';
        label = label.replace(/^(Google|OpenAI|Anthropic|DeepSeek|xAI)\s+/i, '');
        return label;
    };

    const getVisionModelDisplay = () => {
        let mId = currentVisionModelId;
        if (!mId || mId === '__default__') {
            const adminDef = availableModels?.find((x: any) => x.metadata?.is_system_default_image_input === true);
            if (adminDef) {
                mId = adminDef.model_id;
            } else {
                return 'System Default (L1)';
            }
        }
        const m = availableModels?.find((x: any) => x.model_id === mId);
        if (!m) return mId || 'Unknown';
        const family = getFamilyName(m);
        const level = getModelLevel(m);
        return `${family} ${level ? '(' + level + ')' : ''}`;
    };

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

    const handleOpenVisionSelector = () => {
        // Close the image picker first so the selector modal isn't covered
        onClose();
        const event = new CustomEvent('open-model-selector', {
            detail: { capability: 'image_input' }
        });
        window.dispatchEvent(event);
    };

    const handleOpenBlockSelector = () => {
        // ⭐ Dispatch vision-specific block selector event
        onClose();
        const event = new CustomEvent('open-vision-block-selector', {
            detail: { type: 'vision' }
        });
        window.dispatchEvent(event);
    };

    // ⭐ Reset vision mind block to default
    const handleResetVisionBlock = (e: React.MouseEvent) => {
        e.stopPropagation();  // Prevent opening the selector
        const event = new CustomEvent('reset-vision-block');
        window.dispatchEvent(event);
        onClose();
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
                        className="w-full relative overflow-hidden group rounded-xl bg-white border border-[#EADBC8] p-1 shadow-sm hover:shadow-md transition-all duration-300 mb-4"
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

                    {/* Divider for Assistant Settings */}
                    <div className="w-full flex items-center gap-3 mb-4 opacity-60">
                        <div className="h-px bg-gradient-to-r from-transparent via-[#4B4036]/20 to-transparent flex-1" />
                        <span className="text-xs font-medium text-[#4B4036]/60">圖片分析設定</span>
                        <div className="h-px bg-gradient-to-r from-transparent via-[#4B4036]/20 to-transparent flex-1" />
                    </div>

                    {/* Vision Model & Mind Block Selectors */}
                    <div className="w-full grid grid-cols-2 gap-3">
                        {/* Vision Model Selector */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleOpenVisionSelector}
                            className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col justify-between min-h-[80px] relative group hover:border-orange-300 transition-all cursor-pointer shadow-sm"
                        >
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <SparklesIcon className="w-3.5 h-3.5" />
                                OCR 模型
                            </div>
                            <div className="font-bold text-gray-800 text-xs mt-1 line-clamp-2">
                                {getVisionModelDisplay()}
                            </div>
                            <div className="text-[9px] text-gray-500 mt-1">點擊更換</div>
                        </motion.div>

                        {/* Mind Block Selector */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleOpenBlockSelector}
                            className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col justify-between min-h-[80px] relative group hover:border-purple-300 transition-all cursor-pointer shadow-sm"
                        >
                            {/* Reset button - only show when a block is selected */}
                            {currentVisionMindBlockTitle && (
                                <button
                                    onClick={handleResetVisionBlock}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 z-10"
                                    title="重設為預設描述"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            )}
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <PuzzlePieceIcon className="w-3.5 h-3.5" />
                                Vision 思維積木
                            </div>
                            <div className="font-bold text-gray-800 text-xs mt-1 line-clamp-2">
                                {currentVisionMindBlockTitle || '預設描述'}
                            </div>
                            <div className="text-[9px] text-gray-500 mt-1">點擊更換</div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

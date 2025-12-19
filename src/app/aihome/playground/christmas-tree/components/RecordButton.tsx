'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoCameraIcon, StopIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/solid';

interface RecordButtonProps {
    isRecording: boolean;
    recordingTime: number;
    onStartRecording: () => void;
    onStopRecording: () => void;
    hasRecording: boolean;
    onDownload: () => void;
    onShare?: () => void;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function RecordButton({
    isRecording,
    recordingTime,
    onStartRecording,
    onStopRecording,
    hasRecording,
    onDownload,
    onShare
}: RecordButtonProps) {
    const [showOptions, setShowOptions] = useState(false);

    const handleClick = () => {
        if (isRecording) {
            onStopRecording();
            setShowOptions(true);
        } else if (showOptions) {
            setShowOptions(false);
        } else {
            onStartRecording();
        }
    };

    return (
        <div className="relative">
            {/* Recording time badge */}
            <AnimatePresence>
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-mono whitespace-nowrap"
                    >
                        <span className="animate-pulse mr-1">●</span>
                        {formatTime(recordingTime)}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Options popup */}
            <AnimatePresence>
                {showOptions && !isRecording && hasRecording && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute top-12 right-0 flex flex-col gap-2 p-2 rounded-xl"
                        style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDownload();
                                setShowOptions(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F8B4C4]/20 transition-colors text-sm text-[#4A4A4A]"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            <span>儲存影片</span>
                        </button>
                        {onShare && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShare();
                                    setShowOptions(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F8B4C4]/20 transition-colors text-sm text-[#4A4A4A]"
                            >
                                <ShareIcon className="w-4 h-4" />
                                <span>分享</span>
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onStartRecording();
                                setShowOptions(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F8B4C4]/20 transition-colors text-sm text-[#4A4A4A]"
                        >
                            <VideoCameraIcon className="w-4 h-4" />
                            <span>重新錄製</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main button */}
            <motion.button
                onClick={handleClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                    relative w-10 h-10 rounded-full shadow-md flex items-center justify-center 
                    transition-all duration-300 cursor-pointer border border-white/20
                    ${isRecording
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-[#E8A0B0] hover:bg-[#E090A0]'
                    }
                `}
            >
                {isRecording ? (
                    <StopIcon className="w-5 h-5 text-white" />
                ) : (
                    <VideoCameraIcon className="w-5 h-5 text-white" />
                )}

                {/* Recording indicator */}
                {isRecording && (
                    <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                    />
                )}
            </motion.button>
        </div>
    );
}

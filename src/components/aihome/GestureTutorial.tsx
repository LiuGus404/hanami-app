'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HandRaisedIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    ArrowPathIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

interface GestureTutorialProps {
    isVisible: boolean;
    currentGesture: 'OPEN' | 'CLOSED' | 'UNKNOWN';
}

export default function GestureTutorial({ isVisible, currentGesture }: GestureTutorialProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
            <AnimatePresence mode="wait">
                {isExpanded ? (
                    // Expanded Panel
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-black/60 backdrop-blur-md rounded-2xl p-4 min-w-[280px]"
                    >
                        {/* Header with collapse button */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${currentGesture === 'OPEN'
                                        ? 'bg-green-500/30 text-green-300'
                                        : currentGesture === 'CLOSED'
                                            ? 'bg-amber-500/30 text-amber-300'
                                            : 'bg-white/10 text-white/50'
                                    }`}>
                                    <HandRaisedIcon className="w-5 h-5" />
                                </div>
                                <span className="text-white text-sm font-medium">
                                    {currentGesture === 'OPEN' && '放大模式'}
                                    {currentGesture === 'CLOSED' && '正常大小'}
                                    {currentGesture === 'UNKNOWN' && '偵測中...'}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <ChevronDownIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Gesture Guide */}
                        <div className="space-y-2.5">
                            {/* Open Hand */}
                            <div className="flex items-center gap-3 text-white/80">
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                    <HandRaisedIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-xs">
                                    <div className="font-medium">張開手掌</div>
                                    <div className="text-white/50">放大聖誕樹</div>
                                </div>
                                <ArrowsPointingOutIcon className="w-4 h-4 text-green-400" />
                            </div>

                            {/* Closed Fist */}
                            <div className="flex items-center gap-3 text-white/80">
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                    <div className="w-3.5 h-3.5 rounded-full bg-white/60" />
                                </div>
                                <div className="flex-1 text-xs">
                                    <div className="font-medium">握拳</div>
                                    <div className="text-white/50">恢復原大小</div>
                                </div>
                                <ArrowsPointingInIcon className="w-4 h-4 text-amber-400" />
                            </div>

                            {/* Move Hand */}
                            <div className="flex items-center gap-3 text-white/80">
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                    <ArrowPathIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-xs">
                                    <div className="font-medium">左右移動</div>
                                    <div className="text-white/50">旋轉聖誕樹</div>
                                </div>
                                <div className="flex gap-0.5">
                                    <div className="w-1 h-2.5 bg-blue-400 rounded-full" />
                                    <div className="w-1 h-2.5 bg-blue-400/60 rounded-full" />
                                    <div className="w-1 h-2.5 bg-blue-400/30 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // Collapsed Pill
                    <motion.button
                        key="collapsed"
                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full"
                    >
                        <div className={`p-1 rounded-full ${currentGesture === 'OPEN'
                                ? 'bg-green-500/30 text-green-300'
                                : currentGesture === 'CLOSED'
                                    ? 'bg-amber-500/30 text-amber-300'
                                    : 'bg-white/10 text-white/50'
                            }`}>
                            <HandRaisedIcon className="w-4 h-4" />
                        </div>
                        <span className="text-white text-xs font-medium">
                            {currentGesture === 'OPEN' && '放大模式'}
                            {currentGesture === 'CLOSED' && '正常大小'}
                            {currentGesture === 'UNKNOWN' && '偵測中...'}
                        </span>
                        <ChevronUpIcon className="w-4 h-4 text-white/60" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HandRaisedIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';

interface CarouselGestureTutorialProps {
    isVisible: boolean;
}

export default function CarouselGestureTutorial({ isVisible }: CarouselGestureTutorialProps) {
    const [isExpanded, setIsExpanded] = useState(false);

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
                        className="bg-black/60 backdrop-blur-md rounded-2xl p-4 min-w-[260px]"
                    >
                        {/* Header with collapse button */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
                            <span className="text-white text-sm font-medium">手勢控制</span>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <ChevronDownIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Gesture Guide */}
                        <div className="space-y-2.5">
                            {/* Move Left */}
                            <div className="flex items-center gap-3 text-white/80">
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                    <ChevronLeftIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-xs">
                                    <div className="font-medium">手移向左</div>
                                    <div className="text-white/50">切換下一張卡牌</div>
                                </div>
                            </div>

                            {/* Move Right */}
                            <div className="flex items-center gap-3 text-white/80">
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                    <ChevronRightIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-xs">
                                    <div className="font-medium">手移向右</div>
                                    <div className="text-white/50">切換上一張卡牌</div>
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
                        <div className="p-1 rounded-full bg-blue-500/30 text-blue-300">
                            <HandRaisedIcon className="w-4 h-4" />
                        </div>
                        <span className="text-white text-xs font-medium">手勢控制</span>
                        <ChevronUpIcon className="w-4 h-4 text-white/60" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

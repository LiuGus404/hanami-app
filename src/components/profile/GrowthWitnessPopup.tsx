'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface GrowthWitnessPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GrowthWitnessPopup({ isOpen, onClose }: GrowthWitnessPopupProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#4B4036]/20 backdrop-blur-sm"
                    />

                    {/* Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-md bg-[#FFF9F2] rounded-[2.5rem] p-8 shadow-[20px_20px_60px_#d1c3b1,-20px_-20px_60px_#ffffff] overflow-hidden"
                    >
                        {/* Background Decorations */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FFD59A]/20 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#FFB6C1]/20 to-transparent rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full text-[#8B7E74] hover:bg-[#EADBC8]/30 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Content */}
                        <div className="flex flex-col items-center text-center space-y-6 pt-4 pb-2 relative z-10">

                            {/* Animated Icon Container */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-24 h-24 rounded-full bg-[#FFF9F2] shadow-[inset_6px_6px_12px_#E6D9C5,inset_-6px_-6px_12px_#FFFFFF] flex items-center justify-center relative"
                            >
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        repeatType: "reverse"
                                    }}
                                >
                                    <Sparkles className="w-12 h-12 text-[#FFD59A]" />
                                </motion.div>

                                {/* Floating Hearts Particles */}
                                <motion.div
                                    animate={{ y: [-10, -20], opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                    className="absolute top-2 right-4 text-[#FFB6C1]"
                                >
                                    <Heart className="w-4 h-4 fill-current" />
                                </motion.div>
                                <motion.div
                                    animate={{ y: [-5, -15], opacity: [0, 1, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
                                    className="absolute top-4 left-3 text-[#FFD59A]"
                                >
                                    <Heart className="w-3 h-3 fill-current" />
                                </motion.div>
                            </motion.div>

                            <div className="space-y-2">
                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl font-bold text-[#4B4036]"
                                >
                                    Witness of Growth
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-sm font-medium text-[#D48347] uppercase tracking-widest"
                                >
                                    共同成長的見證者
                                </motion.p>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 }}
                                    className="text-xs font-medium text-[#8B7E74] mt-1"
                                >
                                    HanamiEcho – Your Trusted Growth Companion for Every Child.
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-[#8B7E74] leading-relaxed px-4 text-sm"
                            >
                                <p className="mb-2">Thank you for choosing to accompany us.</p>
                                <p className="mb-2">Your usage drives us forward.</p>
                                <p>Let's grow together.</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 }}
                                className="pt-4"
                            >
                                <div className="px-6 py-2 rounded-full bg-[#FFF9F2] shadow-[4px_4px_8px_#E6D9C5,-4px_-4px_8px_#FFFFFF] text-xs font-bold text-[#4B4036]/50">
                                    Established 2025
                                </div>
                            </motion.div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

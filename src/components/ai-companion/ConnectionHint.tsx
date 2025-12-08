'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ConnectionHintProps {
    isVisible: boolean;
    onDismiss: () => void;
    className?: string; // Allow calling component to position it
}

export default function ConnectionHint({ isVisible, onDismiss, className }: ConnectionHintProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 1 }}
                    className={className || "fixed top-20 right-4 z-50 flex items-start cursor-pointer group"}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDismiss();
                    }}
                >
                    <div className="relative">
                        {/* Speech Bubble */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1.5, type: 'spring' }}
                            className="mt-12 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-tr-none shadow-lg border-2 border-[#EADBC8] max-w-[160px] relative z-20"
                        >
                            <p className="text-xs text-[#4B4036] font-bold leading-relaxed">
                                若是頁面卡住，<br />
                                按這裡刷新試試！
                            </p>
                            {/* Arrow pointing top-right towards the button */}
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-t-2 border-r-2 border-[#EADBC8] transform -rotate-12"></div>
                        </motion.div>

                        {/* Character - Cute Hibi (Positioned to the right of the bubble) */}
                        <div className="absolute -right-24 top-4 w-24 h-24 z-10">
                            <motion.div
                                animate={{
                                    y: [-3, 3, -3],
                                    rotate: [-2, 2, -2],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="w-full h-full"
                            >
                                <Image
                                    src="/3d-character-backgrounds/studio/Hibi/cutehibi.png"
                                    alt="Cute Hibi"
                                    width={100}
                                    height={100}
                                    className="object-contain drop-shadow-xl hover:brightness-110 transition-all"
                                />
                            </motion.div>
                        </div>

                        {/* Bouncing Arrow Pointing Top-Left (Towards Reload Button) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1, x: [-2, -5, -2], y: [0, -3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                            className="absolute -top-5 right-3 z-10"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform -rotate-45">
                                <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="#FF8C42" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaygroundHintProps {
    isVisible: boolean;
    className?: string; // Allow positioning
}

export default function PlaygroundHint({ isVisible, className }: PlaygroundHintProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
                    className={className || "fixed top-20 right-20 z-40 flex items-start pointer-events-none"}
                >
                    <div className="relative">
                        {/* Speech Bubble */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1, type: 'spring' }}
                            className="mr-24 mt-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl rounded-tr-none shadow-lg border-2 border-[#EADBC8] whitespace-nowrap relative z-20"
                        >
                            <p className="text-sm text-[#4B4036] font-bold leading-relaxed">
                                點我開始遊戲！
                            </p>
                            {/* Arrow pointing right towards the button */}
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-t-2 border-r-2 border-[#EADBC8] transform -rotate-12 translate-y-2"></div>
                        </motion.div>

                        {/* Character - Cute Hibi */}
                        <div className="absolute -right-4 top-0 w-20 h-20 z-10">
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
                                    alt="Hint"
                                    width={80}
                                    height={80}
                                    className="object-contain drop-shadow-xl"
                                />
                            </motion.div>
                        </div>


                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

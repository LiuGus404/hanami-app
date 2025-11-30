'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function LoadingScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [sparkles, setSparkles] = useState<Array<{
        width: number;
        height: number;
        left: string;
        top: string;
        animationDelay: number;
        duration: number;
    }>>([]);

    useEffect(() => {
        // Generate sparkles on client side only to avoid hydration mismatch
        const newSparkles = [...Array(6)].map(() => ({
            width: Math.random() * 20 + 10,
            height: Math.random() * 20 + 10,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: Math.random() * 2,
            duration: 3 + Math.random() * 2,
        }));
        setSparkles(newSparkles);

        // 模擬載入時間
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // Wavy Text Animation Variants
    const letterContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.3,
            },
        },
    };

    const letterAnimation = {
        hidden: { y: 20, opacity: 0 },
        show: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring" as const,
                damping: 10,
                stiffness: 100,
            }
        },
    };

    // Jelly Animation for Logo
    const jellyAnimation = {
        scale: [1, 1.25, 0.75, 1.15, 0.95, 1.05, 1],
        transition: {
            duration: 0.8,
            ease: "easeInOut" as const,
            times: [0, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
            repeat: Infinity,
            repeatDelay: 2
        }
    };

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fcf6f2] overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    {/* Floating Sparkles/Petals Background */}
                    {sparkles.map((sparkle, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full opacity-60"
                            style={{
                                width: sparkle.width,
                                height: sparkle.height,
                                background: i % 2 === 0 ? '#FFD59A' : '#FFB6C1',
                                left: sparkle.left,
                                top: sparkle.top,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                x: [0, Math.random() * 20 - 10, 0], // Note: This Math.random is inside animate prop, which runs on client, but better to be safe
                                scale: [1, 1.2, 1],
                                opacity: [0.4, 0.8, 0.4],
                            }}
                            transition={{
                                duration: sparkle.duration,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: sparkle.animationDelay,
                            }}
                        />
                    ))}

                    {/* Logo Container with Jelly Effect */}
                    <motion.div
                        className="relative mb-8"
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                        <motion.div
                            animate={jellyAnimation}
                            className="relative w-32 h-32 md:w-40 md:h-40 z-10"
                        >
                            <Image
                                src="/assets/loading-logo.png"
                                alt="HanamiEcho Logo"
                                fill
                                className="object-contain drop-shadow-lg"
                                priority
                            />
                        </motion.div>

                        {/* Glow Effect */}
                        <motion.div
                            className="absolute inset-0 rounded-full bg-[#FFD59A] opacity-30 blur-2xl -z-10"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>

                    {/* Wavy Text Animation */}
                    <motion.div
                        variants={letterContainer}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col items-center z-10"
                    >
                        <div className="flex overflow-hidden">
                            {"HanamiEcho".split("").map((char, index) => (
                                <motion.span
                                    key={index}
                                    variants={letterAnimation}
                                    className="text-3xl md:text-4xl font-bold tracking-wider font-sans inline-block"
                                    style={{
                                        color: '#4B4036',
                                        textShadow: '2px 2px 0px #FFD59A'
                                    }}
                                    whileHover={{
                                        y: -5,
                                        color: '#FFB6C1',
                                        transition: { duration: 0.2 }
                                    }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            className="text-[#8c7b6e] text-sm tracking-widest mt-2 font-medium bg-white/50 px-4 py-1 rounded-full"
                        >
                            您工作、學習和成長的夥伴
                        </motion.p>
                    </motion.div>

                    {/* Candy Stripe Progress Bar */}
                    <motion.div
                        className="mt-10 w-56 h-3 bg-[#EADBC8] rounded-full overflow-hidden border-2 border-[#fff]"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <motion.div
                            className="h-full relative"
                            style={{
                                background: 'linear-gradient(45deg, #FFD59A 25%, #FFB6C1 25%, #FFB6C1 50%, #FFD59A 50%, #FFD59A 75%, #FFB6C1 75%, #FFB6C1 100%)',
                                backgroundSize: '20px 20px',
                            }}
                            initial={{ width: "0%" }}
                            animate={{
                                width: "100%",
                                backgroundPosition: ["0px 0px", "40px 0px"]
                            }}
                            transition={{
                                width: { duration: 2, ease: "easeInOut", delay: 0.2 },
                                backgroundPosition: { duration: 1, repeat: Infinity, ease: "linear" }
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

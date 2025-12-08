'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ParticleAnalysisEffectProps {
    isVisible: boolean;
    onComplete?: () => void;
}

export default function ParticleAnalysisEffect({ isVisible, onComplete }: ParticleAnalysisEffectProps) {
    if (!isVisible) return null;

    // Generate random particles
    const particles = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // %
        y: Math.random() * 100, // %
        size: Math.random() * 4 + 2,
        delay: Math.random() * 0.5,
    }));

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="relative w-full h-full max-w-lg max-h-lg">
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{
                            opacity: 0,
                            x: `${p.x}vw`,
                            y: `${p.y}vh`,
                            scale: 0
                        }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            x: "50%",
                            y: "50%",
                            scale: [0, 1, 0.5, 0],
                            left: "0%",
                            top: "0%"
                        }}
                        transition={{
                            duration: 2,
                            delay: p.delay,
                            ease: "easeInOut",
                            times: [0, 0.2, 0.8, 1]
                        }}
                        className="absolute rounded-full"
                        style={{
                            width: p.size,
                            height: p.size,
                            backgroundColor: i % 2 === 0 ? '#FFD59A' : '#FFB6C1',
                            boxShadow: `0 0 ${p.size * 2}px ${i % 2 === 0 ? '#FFD59A' : '#FFB6C1'}`,
                        }}
                    />
                ))}

                {/* Central Core */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,213,154,0.6)]">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 border-4 border-[#FFB6C1] border-t-transparent rounded-full"
                        />
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="absolute top-24 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-white font-bold text-lg drop-shadow-md"
                    >
                        Analyzing Image...
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

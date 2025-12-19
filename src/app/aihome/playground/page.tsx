'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { SparklesIcon, PhotoIcon, ChatBubbleBottomCenterTextIcon, CubeTransparentIcon, ChevronLeftIcon, ChevronRightIcon, HomeIcon, Cog6ToothIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import FoodBalanceButton from '@/components/aihome/FoodBalanceButton';
import InteractionToggle from '@/components/aihome/InteractionToggle';
import CarouselGestureTutorial from '@/components/aihome/CarouselGestureTutorial';
import GestureConfirmModal from '@/components/aihome/GestureConfirmModal';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useHandGesture } from '@/hooks/useHandGesture';

// --- PS5-style Sound Effects Utility ---
const createAudioContext = () => {
    if (typeof window !== 'undefined') {
        return new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return null;
};

let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
    if (!audioCtx) audioCtx = createAudioContext();
    return audioCtx;
};

const playGrabSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
};

const playSwipeSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
};

const playDropSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
};

const playBounceSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
};

// --- Types ---
interface Experiment {
    id: string;
    title: string;
    description: string;
    status: 'Live' | 'Coming Soon';
    href?: string;
    thumbnailGradient: string;
    icon: React.ComponentType<any>;
}

// --- Configuration ---
const RADIUS = 350;

// --- Mock Data ---
const experiments: Experiment[] = [
    {
        id: 'christmas-gallery',
        title: "AI魔法畫廊",
        description: "沉浸式粒子聖誕樹體驗，支援手勢與許願互動。",
        status: "Live",
        href: "/aihome/playground/christmas-tree",
        thumbnailGradient: "from-pink-400 to-rose-500",
        icon: SparklesIcon,
    },
    {
        id: 'ai-teacher',
        title: "AI老師",
        description: "智慧個人化教學助手，因材施教的 AI 家教。",
        status: "Coming Soon",
        thumbnailGradient: "from-emerald-400 to-teal-500",
        icon: ChatBubbleBottomCenterTextIcon,
    },
    {
        id: 'ai-storybook',
        title: "AI繪本",
        description: "AI 生成互動故事繪本，讓想像力變成畫面。",
        status: "Coming Soon",
        thumbnailGradient: "from-blue-400 to-purple-500",
        icon: PhotoIcon,
    },
    {
        id: 'ai-pitch-bell',
        title: "AI空氣音鐘",
        description: "揮手演奏的虛擬樂器，將高度轉化為美妙音階。",
        status: "Live",
        href: "/aihome/playground/pitch-bell",
        thumbnailGradient: "from-cyan-400 to-blue-500",
        icon: MusicalNoteIcon,
    },
    {
        id: 'ai-game-cards',
        title: "AI遊戲卡",
        description: "AI 生成專屬遊戲卡牌，打造獨一無二的對戰體驗。",
        status: "Coming Soon",
        thumbnailGradient: "from-orange-400 to-amber-500",
        icon: CubeTransparentIcon,
    }
];

const ANGLE_STEP = 360 / experiments.length;

// --- 3D Card Component ---
const CarouselCard = ({
    item,
    index,
    rotation,
    isActive,
    pullY,
    isGrabbing
}: {
    item: Experiment;
    index: number;
    rotation: any;
    isActive: boolean;
    pullY?: any;
    isGrabbing?: boolean;
}) => {
    const baseAngle = index * ANGLE_STEP;

    const effectiveAngle = useTransform(rotation, (r: number) => {
        const rawAngle = baseAngle + r;
        const normalized = ((rawAngle % 360) + 540) % 360 - 180;
        return normalized;
    });

    // Shake effect when grabbing
    const shakeX = useMotionValue(0);
    const shakeR = useMotionValue(0);

    useEffect(() => {
        if (isActive && isGrabbing) {
            const interval = setInterval(() => {
                shakeX.set((Math.random() - 0.5) * 5); // 5px shake
                shakeR.set((Math.random() - 0.5) * 2); // 2deg shake
            }, 50);
            return () => clearInterval(interval);
        } else {
            shakeX.set(0);
            shakeR.set(0);
            return undefined;
        }
    }, [isActive, isGrabbing, shakeX, shakeR]);

    const transform = useTransform([effectiveAngle, pullY, shakeX, shakeR], ([angle, y, sx, sr]) => {
        // Only apply pullY if active
        const currentY = isActive && y ? y : 0;
        const currentSX = isActive ? sx : 0;
        const currentSR = isActive ? sr : 0;

        return `rotateY(${angle as number + (currentSR as number)}deg) translateZ(${RADIUS}px) translateY(${currentY as number}px) translateX(${currentSX as number}px)`;
    });

    const opacity = useTransform([effectiveAngle, pullY], ([angle, y]) => {
        const abs = Math.abs(angle as number);

        // Fade out if dropped significantly
        if (isActive && (y as number) > 200) return 1 - (((y as number) - 200) / 300);

        if (abs > 110) return 0;
        if (abs > 80) return 1 - ((abs - 80) / 30);
        return 1;
    });

    const brightness = useTransform(effectiveAngle, (angle) => {
        const abs = Math.abs(angle);
        return Math.max(0.65, 1 - (abs / 150));
    });

    const zIndex = useTransform(effectiveAngle, (angle) => {
        return 1000 - Math.abs(Math.round(angle));
    });

    const isLive = item.status === 'Live';
    const Icon = item.icon;

    const CardContent = (
        <div className="group relative w-[280px] h-[400px] md:w-[320px] md:h-[460px] rounded-[40px] bg-white/40 backdrop-blur-xl overflow-hidden flex flex-col select-none backface-hidden ring-1 ring-white/60 transition-all duration-500 border border-white/40 shadow-2xl">

            {/* Icy Texture Overlay */}
            <div className="absolute inset-0 z-0 opacity-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay opacity-20" />

            {/* Grabbing Tension Overlay (Reddish tint when pulling hard) */}
            {isActive && isGrabbing && (
                <div className="absolute inset-0 bg-rose-500/10 z-30 pointer-events-none animate-pulse" />
            )}

            {/* Glossy Reflection Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/20 to-transparent z-0 pointer-events-none" />

            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/60 to-transparent pointer-events-none z-10" />

            {/* Thumbnail / Icon Area */}
            <div className="relative h-[60%] w-full flex items-center justify-center z-20">
                {/* Floating Glow behind icon */}
                <div className={`absolute w-32 h-32 rounded-full blur-[60px] opacity-60 bg-gradient-to-tr ${item.thumbnailGradient}`} />

                {/* 3D Floating Icon */}
                <div className="relative transform transition-all duration-700 group-hover:-translate-y-4 group-hover:scale-110 group-hover:rotate-6">
                    <Icon className="w-28 h-28 text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] opacity-90" />
                    {/* Reflection on icon */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/30 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Status Badge - Minimalist Pill */}
                <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-sm border ${isLive ? 'bg-white/50 text-emerald-800 border-white/60' : 'bg-black/5 text-gray-500 border-white/20'}`}>
                    {item.status}
                </div>
            </div>

            {/* Info Section - Frosted Bottom */}
            <div className="relative flex-1 p-8 flex flex-col items-center text-center z-20">
                <h3 className="text-3xl font-bold text-gray-800/90 mb-3 tracking-tight drop-shadow-sm">{item.title}</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed line-clamp-2 max-w-[85%]">
                    {item.description}
                </p>

                {isLive && (
                    <div className="mt-auto pt-6 flex flex-col items-center">
                        {/* Show "下拉" text when grabbing */}
                        {isActive && isGrabbing && (
                            <span className="text-sm font-bold text-gray-600 mb-2 animate-bounce tracking-widest">下拉</span>
                        )}
                        <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/80 shadow-lg text-gray-800 transition-all duration-500 cursor-pointer ${isActive && isGrabbing ? 'rotate-90 scale-110' : 'group-hover:scale-110 group-hover:rotate-90'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <motion.div
            style={{
                transform,
                opacity,
                zIndex,
                filter: useTransform(brightness, b => `brightness(${b})`),
                transformStyle: 'preserve-3d',
                position: 'absolute',
                left: '50%',
                top: '50%',
                marginLeft: -150,
                marginTop: -220,
            }}
            className="origin-center"
        >
            <div style={{ marginLeft: -10, marginTop: -10 }} className="relative md:ml-0 md:mt-0">
                {/* Real Projected Floor Shadow */}
                {/* Positioned at the bottom, rotated to lie flat on the floor */}
                <motion.div
                    className="absolute -bottom-[60px] left-1/2 w-[90%] h-[40px] bg-black/20 blur-[20px] rounded-[100%] pointer-events-none transition-all duration-500 group-hover:bg-black/30 group-hover:blur-[25px] group-hover:w-[100%]"
                    style={{
                        transform: 'translateX(-50%) rotateX(90deg)',
                        opacity: useTransform(opacity, o => (o as number) * 0.5) // Shadow fades with card
                    }}
                />

                {/* Unified Card Container (No Link wrapper, handled by gesture/mouse drag) */}
                <div className={`block cursor-grab active:cursor-grabbing transition-transform duration-500 ${isActive ? 'hover:translate-y-[-10px]' : ''}`}>
                    {CardContent}
                </div>
            </div>
        </motion.div>
    );
};

export default function PlaygroundHome() {
    const router = useRouter();
    const { user, logout } = useSaasAuth();
    const { gesture, handX, handY, isTracking, startTracking, stopTracking } = useHandGesture();
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // Use MotionValue for reactive animation
    const rotation = useMotionValue(0);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const handleInteractionToggle = useCallback(() => {
        if (isTracking) {
            stopTracking();
        } else {
            setShowConfirmModal(true);
        }
    }, [isTracking, stopTracking]);

    const handleConfirmStart = useCallback(async () => {
        setIsLoading(true);
        try {
            await startTracking();
            setShowConfirmModal(false);
        } finally {
            setIsLoading(false);
        }
    }, [startTracking]);

    // Track drag state
    const dragRef = React.useRef({
        startX: 0,
        startY: 0,
        startRotation: 0,
        isDragging: false,
    });
    const [isMouseGrabbing, setIsMouseGrabbing] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(false);

    const updateIndex = (newRotation: number) => {
        const idx = Math.round(-newRotation / ANGLE_STEP);
        setCurrentIndex(((idx % experiments.length) + experiments.length) % experiments.length);
    };

    const goNext = () => {
        const newRotation = rotation.get() - ANGLE_STEP;
        animate(rotation, newRotation, { type: 'spring', stiffness: 100, damping: 20 });
        updateIndex(newRotation);
    };

    const goPrev = () => {
        const newRotation = rotation.get() + ANGLE_STEP;
        animate(rotation, newRotation, { type: 'spring', stiffness: 100, damping: 20 });
        updateIndex(newRotation);
    };

    // Hand gesture control for carousel
    const lastHandXRef = useRef(0.5);
    const lastHandYRef = useRef(0.5);
    const gestureThrottleRef = useRef(false);
    const selectionThrottleRef = useRef(false);
    const prevGestureRef = useRef<string>('UNKNOWN');
    const pullYMotion = useMotionValue(0); // MotionValue for physics pull

    // Effect to snapshot position when gesture starts (Anchor)
    useEffect(() => {
        if (gesture === 'CLOSED' && prevGestureRef.current !== 'CLOSED') {
            // Just started making a fist -> Set Anchor
            lastHandYRef.current = handY;
        }
        prevGestureRef.current = gesture;
    }, [gesture, handY]);

    // Main Gesture Loop
    useEffect(() => {
        if (!isTracking) {
            lastHandXRef.current = 0.5;
            return;
        }

        // 1. Horizontal Navigation (Swipe)
        const deltaX = handX - lastHandXRef.current;
        const thresholdX = 0.22; // Increased threshold for stability

        // Reset physics if not holding
        if (gesture !== 'CLOSED') {
            animate(pullYMotion, 0, { type: 'spring', stiffness: 300, damping: 25 });
        }

        // Only navigate if NOT holding fist (prevent conflict with pull down)
        if (gesture !== 'CLOSED' && !gestureThrottleRef.current && Math.abs(deltaX) > thresholdX) {
            gestureThrottleRef.current = true;

            if (deltaX > 0) {
                goNext();
                playSwipeSound(); // PS5 swipe
            } else {
                goPrev();
                playSwipeSound(); // PS5 swipe
            }

            setTimeout(() => {
                lastHandXRef.current = handX;
                gestureThrottleRef.current = false;
            }, 500);
        } else if (!gestureThrottleRef.current) {
            // "Trailing Anchor" - slowly follow hand to prevent drift from triggering
            // This acts like a high-pass filter: only fast movements get through.
            lastHandXRef.current += (handX - lastHandXRef.current) * 0.1;
        }

        // 2. Vertical Selection (Pull Down + Closed Fist)
        const deltaY = handY - lastHandYRef.current;
        const thresholdY = 0.15;

        // Visual Pull feedback
        if (gesture === 'CLOSED') {
            const pullPixels = Math.max(0, deltaY * 1500);
            pullYMotion.set(pullPixels);
        }

        // Trigger if: Closed Fist + Moved Down > Threshold + Not throttled
        if (gesture === 'CLOSED' && !selectionThrottleRef.current && deltaY > thresholdY) {
            const currentExp = experiments[currentIndex];

            // Only select if Live
            if (currentExp && currentExp.status === 'Live' && currentExp.href) {
                selectionThrottleRef.current = true;

                // Animate "Drop" (card falls down)
                animate(pullYMotion, 1200, { duration: 0.6, ease: "easeIn" });

                // Navigate
                router.push(currentExp.href);

                setTimeout(() => {
                    selectionThrottleRef.current = false;
                    pullYMotion.set(0);
                }, 2000);
            }
        }
    }, [handX, handY, gesture, isTracking, currentIndex]);


    const handlePointerDown = (e: React.PointerEvent) => {
        dragRef.current.startX = e.clientX;
        dragRef.current.startY = e.clientY;
        dragRef.current.startRotation = rotation.get();
        dragRef.current.isDragging = true;
        setIsMouseGrabbing(true);
        playGrabSound(); // PS5 grab click
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current.isDragging) return;
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        const currentExp = experiments[currentIndex];
        const isLive = currentExp && currentExp.status === 'Live';

        // Determine intent: Horizontal swipe or Vertical pull
        // If pulling down more than swiping sideways, prioritize pull
        if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
            // Vertical Pull (down)
            // Non-live cards: limit pull to ~50px and bounce back
            if (!isLive && deltaY > 50) {
                pullYMotion.set(50 + (deltaY - 50) * 0.1); // Resistance effect
            } else {
                pullYMotion.set(deltaY);
            }
        } else {
            // Horizontal Swipe
            const newRotation = dragRef.current.startRotation + deltaX * 0.3;
            rotation.set(newRotation);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!dragRef.current.isDragging) return;
        dragRef.current.isDragging = false;
        setIsMouseGrabbing(false);

        const deltaY = e.clientY - dragRef.current.startY;
        const pullThreshold = 100; // pixels

        // Check if it was a significant pull down
        if (deltaY > pullThreshold) {
            const currentExp = experiments[currentIndex];
            if (currentExp && currentExp.status === 'Live' && currentExp.href) {
                // Animate Drop & Navigate
                playDropSound(); // PS5 drop swoosh
                animate(pullYMotion, 1200, { duration: 0.5, ease: "easeIn" });
                router.push(currentExp.href);
                return; // Skip snapping
            } else {
                // Non-live card: Show "Coming Soon" message
                playBounceSound(); // PS5 bounce
                setShowComingSoon(true);
                setTimeout(() => setShowComingSoon(false), 2000);
            }
        }

        // Reset pull
        animate(pullYMotion, 0, { type: 'spring', stiffness: 300, damping: 25 });

        // Snap to nearest card (horizontal)
        const current = rotation.get();
        const nearestIndex = Math.round(-current / ANGLE_STEP);
        const snappedRotation = -nearestIndex * ANGLE_STEP;

        // Detect if we actually swiped (changed cards)
        const startIndex = Math.round(-dragRef.current.startRotation / ANGLE_STEP);
        if (nearestIndex !== startIndex) {
            playSwipeSound(); // PS5 swipe whoosh
        }

        animate(rotation, snappedRotation, { type: 'spring', stiffness: 100, damping: 20 });
        updateIndex(snappedRotation);

        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] overflow-hidden flex flex-col select-none">
            {/* Coming Soon Toast */}
            {showComingSoon && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
                    <div className="bg-black/70 text-white px-8 py-5 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce">
                        <p className="text-xl font-bold tracking-widest">功能未開放</p>
                        <p className="text-sm text-gray-300 mt-1 text-center">敬請期待！</p>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="pt-10 px-8 relative z-10 pointer-events-none text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-[#4B4036] inline-flex items-center gap-4 font-serif tracking-widest">
                    <SparklesIcon className="w-8 h-8 md:w-10 md:h-10 text-[#D4A373] animate-pulse" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4B4036] via-[#6B5142] to-[#8C7A6B] drop-shadow-sm">
                        花見 AI 實驗室
                    </span>
                </h1>
                <p className="text-[#8A8A8A] text-lg md:text-xl mt-3 font-light tracking-wide opacity-80 pl-1">
                    探索 3D 互動與創意 AI 小工具
                </p>
            </div>

            {/* Navigation Bar (Interaction, Food, Settings, Home) */}
            <div className="absolute top-8 right-6 z-50 flex items-center space-x-3 pointer-events-auto">
                {/* Interaction Toggle */}
                <InteractionToggle
                    isEnabled={isTracking}
                    onToggle={handleInteractionToggle}
                    isLoading={isLoading}
                />

                {/* Food Balance */}
                <FoodBalanceButton />

                {/* Unified Right Content (Music + Settings Overlay) */}
                <UnifiedRightContent
                    user={user}
                    onLogout={logout}
                    onNavigate={(path) => router.push(`/aihome/${path.replace('view:', '?view=')}`)}
                />

                {/* Home Button */}
                <Link href="/aihome">
                    <div className="w-10 h-10 rounded-full bg-[#A7C7E7] hover:bg-[#8FB8E0] shadow-md flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer group border border-white/20">
                        <HomeIcon className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                </Link>
            </div>

            {/* 3D Scene Wrapper - with touch/drag support */}
            <div
                className="flex-1 relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
                style={{ perspective: '1200px', touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {/* 3D Carousel */}
                <div
                    className="relative w-full h-full flex items-center justify-center"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: `translateZ(-${RADIUS}px)`
                    }}
                >
                    {experiments.map((exp, index) => (
                        <div
                            key={exp.id}
                            style={{
                                position: 'absolute',
                                transformStyle: 'preserve-3d',
                            }}
                        >
                            <CarouselCard
                                item={exp}
                                index={index}
                                rotation={rotation}
                                isActive={index === currentIndex}
                                pullY={pullYMotion}
                                isGrabbing={(gesture === 'CLOSED' || isMouseGrabbing) && index === currentIndex}
                            />
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={goPrev}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all active:scale-95 border border-gray-200"
                    aria-label="Previous"
                >
                    <ChevronLeftIcon className="w-8 h-8 text-[#4B4036]" />
                </button>
                <button
                    onClick={goNext}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all active:scale-95 border border-gray-200"
                    aria-label="Next"
                >
                    <ChevronRightIcon className="w-8 h-8 text-[#4B4036]" />
                </button>
            </div>

            {/* Indicators */}
            <div className="pb-12 flex flex-col items-center space-y-4">
                <div className="flex space-x-2">
                    {experiments.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-[#D4A373]' : 'w-1.5 bg-[#EADBC8]'}`}
                        />
                    ))}
                </div>
                <div className="text-[#D4A373]/50 text-xs font-bold tracking-widest uppercase">
                    Tap arrows to navigate
                </div>
            </div>

            {/* Gesture Tutorial */}
            <CarouselGestureTutorial isVisible={isTracking} />

            {/* Gesture Confirm Modal */}
            <GestureConfirmModal
                isOpen={showConfirmModal}
                onConfirm={handleConfirmStart}
                onCancel={() => setShowConfirmModal(false)}
                isLoading={isLoading}
            />
        </div>
    );
}

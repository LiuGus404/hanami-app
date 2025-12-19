'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeftIcon, HomeIcon, EllipsisVerticalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { MusicalNoteIcon, StarIcon, BellIcon, HeartIcon, HandRaisedIcon } from '@heroicons/react/24/solid';
import InteractionToggle from '@/components/aihome/InteractionToggle';
import GestureConfirmModal from '@/components/aihome/GestureConfirmModal';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useHandGesture } from '@/hooks/useHandGesture';
import PlaygroundHint from './components/PlaygroundHint';
import FoodBalanceButton from '@/components/aihome/FoodBalanceButton';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

// --- Song Data ---

interface SongNote {
    note: string;
    label: string;
}

interface Song {
    id: string;
    title: string;
    notes: SongNote[];
    color: string;
    icon: React.ReactNode;
}

const SONGS: Song[] = [
    {
        id: 'free_mode',
        title: '自由演奏 (Free Mode)',
        color: '#EADBC8', // Beige/Gold
        icon: <MusicalNoteIcon className="w-6 h-6 text-white" />,
        notes: [
            { note: 'C4', label: 'Do' }, { note: 'D4', label: 'Re' }, { note: 'E4', label: 'Mi' },
            { note: 'F4', label: 'Fa' }, { note: 'G4', label: 'Sol' }, { note: 'A4', label: 'La' },
            { note: 'B4', label: 'Ti' }
        ]
    },
    {
        id: 'scale',
        title: 'C Major Scale',
        color: '#A8D0E6', // Pastel Blue
        icon: <MusicalNoteIcon className="w-6 h-6 text-white" />,
        notes: [
            { note: 'C4', label: 'Do' }, { note: 'D4', label: 'Re' }, { note: 'E4', label: 'Mi' },
            { note: 'F4', label: 'Fa' }, { note: 'G4', label: 'Sol' }, { note: 'A4', label: 'La' },
            { note: 'B4', label: 'Ti' }, { note: 'C5', label: 'Do' },
        ]
    },
    {
        id: 'twinkle',
        title: 'Twinkle Twinkle',
        color: '#FFDD59', // Pastel Yellow/Orange
        icon: <StarIcon className="w-6 h-6 text-white" />,
        notes: [
            { note: 'C4', label: 'Do' }, { note: 'C4', label: 'Do' }, { note: 'G4', label: 'Sol' }, { note: 'G4', label: 'Sol' },
            { note: 'A4', label: 'La' }, { note: 'A4', label: 'La' }, { note: 'G4', label: 'Sol' },
            { note: 'F4', label: 'Fa' }, { note: 'F4', label: 'Fa' }, { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' },
            { note: 'D4', label: 'Re' }, { note: 'D4', label: 'Re' }, { note: 'C4', label: 'Do' },
            // Repeat Phrase 2
            { note: 'G4', label: 'Sol' }, { note: 'G4', label: 'Sol' }, { note: 'F4', label: 'Fa' }, { note: 'F4', label: 'Fa' },
            { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' }, { note: 'D4', label: 'Re' },
            { note: 'G4', label: 'Sol' }, { note: 'G4', label: 'Sol' }, { note: 'F4', label: 'Fa' }, { note: 'F4', label: 'Fa' },
            { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' }, { note: 'D4', label: 'Re' },
            // Repeat Phrase 1
            { note: 'C4', label: 'Do' }, { note: 'C4', label: 'Do' }, { note: 'G4', label: 'Sol' }, { note: 'G4', label: 'Sol' },
            { note: 'A4', label: 'La' }, { note: 'A4', label: 'La' }, { note: 'G4', label: 'Sol' },
            { note: 'F4', label: 'Fa' }, { note: 'F4', label: 'Fa' }, { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' },
            { note: 'D4', label: 'Re' }, { note: 'D4', label: 'Re' }, { note: 'C4', label: 'Do' }
        ]
    },
    {
        id: 'jingle',
        title: 'Jingle Bells',
        color: '#FF6B6B', // Pastel Red
        icon: <BellIcon className="w-6 h-6 text-white" />,
        notes: [
            // Chorus
            { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' },
            { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' },
            { note: 'E4', label: 'Mi' }, { note: 'G4', label: 'Sol' }, { note: 'C4', label: 'Do' }, { note: 'D4', label: 'Re' }, { note: 'E4', label: 'Mi' },
            { note: 'F4', label: 'Fa' }, { note: 'F4', label: 'Fa' }, { note: 'F4', label: 'Fa' }, { note: 'F4', label: 'Fa' },
            { note: 'F4', label: 'Fa' }, { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' },
            { note: 'E4', label: 'Mi' }, { note: 'D4', label: 'Re' }, { note: 'D4', label: 'Re' }, { note: 'E4', label: 'Mi' }, { note: 'D4', label: 'Re' }, { note: 'G4', label: 'Sol' },
            // Chorus Repeat (End)
            { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' },
            { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' },
            { note: 'E4', label: 'Mi' }, { note: 'G4', label: 'Sol' }, { note: 'C4', label: 'Do' }, { note: 'D4', label: 'Re' }, { note: 'E4', label: 'Mi' },
            { note: 'F4', label: 'Fa' }, { note: 'F4', label: 'Fa' }, { note: 'F4', label: 'Fa' }, { note: 'F4', label: 'Fa' },
            { note: 'F4', label: 'Fa' }, { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' }, { note: 'E4', label: 'Mi' }, { note: 'G4', label: 'Sol' }, { note: 'G4', label: 'Sol' }, { note: 'F4', label: 'Fa' }, { note: 'D4', label: 'Re' }, { note: 'C4', label: 'Do' }
        ]
    },
    {
        id: 'joy',
        title: 'Joy to the World',
        color: '#E0BBE4', // Pastel Purple
        icon: <HeartIcon className="w-6 h-6 text-white" />,
        notes: [
            { note: 'C5', label: 'Do' }, { note: 'B4', label: 'Ti' }, { note: 'A4', label: 'La' }, { note: 'G4', label: 'Sol' },
            { note: 'F4', label: 'Fa' }, { note: 'E4', label: 'Mi' }, { note: 'D4', label: 'Re' }, { note: 'C4', label: 'Do' },
            { note: 'G4', label: 'Sol' }, { note: 'A4', label: 'La' }, { note: 'A4', label: 'La' }, { note: 'B4', label: 'Ti' },
            { note: 'B4', label: 'Ti' }, { note: 'C5', label: 'Do' },
        ]
    }
];

// Dynamic import for 3D Scene
const PitchBellScene = dynamic(
    () => import('./components/PitchBellScene'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-[#FAFAF9]">
                <div className="text-[#4B4036] text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-[#4B4036]/30 border-t-[#4B4036] rounded-full mx-auto mb-4" />
                    <p className="text-lg">Loading Instruments...</p>
                </div>
            </div>
        )
    }
);

export default function PitchBellPage() {
    const { user, logout } = useSaasAuth();
    const { gesture, handX, handY, isTracking, startTracking, stopTracking } = useHandGesture();
    const { isPlaying: isMusicPlaying, togglePlay } = useMusicPlayer();
    const [isGestureLoading, setIsGestureLoading] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showSongMenu, setShowSongMenu] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentSongId, setCurrentSongId] = useState('scale');
    const [isHintDismissed, setIsHintDismissed] = useState(false);

    // Game Flow States
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false); // "Put hand in front"
    const [countdown, setCountdown] = useState<number | null>(null);

    const currentSong = SONGS.find(s => s.id === currentSongId) || SONGS[0];

    // Pause background music when entering pitch-bell, resume when leaving
    useEffect(() => {
        const wasPlaying = isMusicPlaying;
        if (isMusicPlaying) {
            togglePlay(); // Pause
        }

        return () => {
            // Resume music when leaving (only if it was playing before)
            if (wasPlaying && !isMusicPlaying) {
                togglePlay();
            }
        };
    }, []); // Only run on mount/unmount

    const handleInteractionToggle = useCallback(() => {
        if (isTracking) {
            stopTracking();
            setIsPlaying(false);
            setCountdown(null);
            setIsPreparing(false);
        } else {
            setShowConfirmModal(true);
        }
    }, [isTracking, stopTracking]);

    const handleConfirmStart = useCallback(async () => {
        setIsGestureLoading(true);
        try {
            // 1. Start Camera Immediately
            await startTracking();
            setShowConfirmModal(false);

            // 2. Start Countdown Sequence
            setIsPreparing(true);

            // Show Hand Prompt for 2 seconds
            setTimeout(() => {
                setIsPreparing(false);
                setCountdown(3);

                // Countdown 3 -> 2 -> 1 -> Start
                let count = 3;
                const timer = setInterval(() => {
                    count--;
                    if (count < 1) {
                        clearInterval(timer);
                        setCountdown(null);

                        // 3. Start Game Logic (Hand already tracked, just enable gameplay)
                        setIsPlaying(true);
                    } else {
                        setCountdown(count);
                    }
                }, 1000);
            }, 2000);

        } catch (e) {
            console.error("Failed to start tracking", e);
            // Handle error (maybe show toast or reset state)
        } finally {
            setIsGestureLoading(false);
        }
    }, [startTracking]);

    return (
        <div className="min-h-screen bg-[#FAFAF9] flex flex-col relative overflow-hidden">
            {/* Mobile: Compact Header Row (Title + 3-dot Menu) */}
            <div className="flex sm:hidden items-center justify-between absolute top-4 left-4 right-4 z-50 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                    <Link href="/aihome/playground" className="hover:scale-110 transition-transform">
                        <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-[#EADBC8] shadow-sm flex items-center justify-center hover:bg-white text-[#4B4036]">
                            <ArrowLeftIcon className="w-4 h-4" />
                        </div>
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-[#4B4036] font-serif tracking-wide">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4B4036] via-[#6B5142] to-[#8C7A6B]">
                                空氣彩虹鐘
                            </span>
                        </h1>
                        <p className="text-[#8A8A8A] text-[10px] font-light tracking-wide opacity-80 -mt-0.5">
                            花見AI與孩子的魔法樂章
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Mobile Song Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSongMenu(!showSongMenu)}
                            className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-sm transition-all hover:bg-white/40 text-[#4B4036] font-medium text-xs"
                        >
                            <span className="truncate max-w-[60px]">{currentSong.title.split(' ')[0]}</span>
                            <svg className={`w-3 h-3 opacity-70 transition-transform ${showSongMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {/* Dropdown Menu */}
                        {showSongMenu && (
                            <div className="absolute top-full right-0 mt-2 w-40 py-1 rounded-xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg flex flex-col gap-0.5 p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {SONGS.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            setCurrentSongId(s.id);
                                            setShowSongMenu(false);
                                        }}
                                        className={`text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${currentSongId === s.id
                                            ? 'bg-white/70 text-[#4B4036] font-bold shadow-sm'
                                            : 'hover:bg-white/40 text-[#4B4036]/80'
                                            }`}
                                    >
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                        <span className="truncate">{s.title.split('(')[0].trim()}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <InteractionToggle
                        isEnabled={isTracking}
                        onToggle={handleInteractionToggle}
                        isLoading={isGestureLoading}
                    />
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="w-10 h-10 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-md shadow-md flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer border border-white/40"
                    >
                        {showMobileMenu ? (
                            <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
                        ) : (
                            <EllipsisVerticalIcon className="w-5 h-5 text-[#4B4036]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile: Expandable Control Buttons */}
            {showMobileMenu && (
                <div className="flex sm:hidden flex-wrap justify-center gap-2 z-40 pointer-events-auto absolute top-16 left-4 right-4 bg-white/50 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/40 animate-in fade-in slide-in-from-top-2 duration-200">
                    <UnifiedRightContent
                        user={user}
                        onLogout={logout}
                    />
                    <FoodBalanceButton />
                    <Link href="/aihome">
                        <div className="w-10 h-10 rounded-full bg-[#A7C7E7] hover:bg-[#8FB8E0] shadow-md flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer group border border-white/20">
                            <HomeIcon className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
                        </div>
                    </Link>
                </div>
            )}

            {/* Desktop: Header */}
            <div className="hidden sm:block absolute top-0 left-0 pt-10 px-8 z-10 text-left pointer-events-none">
                <div className="inline-flex items-center gap-4">
                    <Link href="/aihome/playground" className="pointer-events-auto hover:scale-110 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-[#EADBC8] shadow-sm flex items-center justify-center hover:bg-white text-[#4B4036]">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </div>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#4B4036] font-serif tracking-widest">
                            空氣彩虹鐘
                        </h1>
                        <p className="text-[#8A8A8A] text-sm md:text-base font-light tracking-wide opacity-80">
                            花見AI與孩子的魔法樂章
                        </p>
                    </div>
                </div>
            </div>

            {/* Desktop: Navigation Bar (Top Right) */}
            <div className="hidden sm:flex absolute top-8 right-6 z-50 items-center gap-3 pointer-events-auto">
                {/* Song Selection (Frosted Glass Dropdown) */}
                <div className="relative group mr-2">
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-sm transition-all hover:bg-white/40 text-[#4B4036] font-medium min-w-[120px] md:min-w-[160px] justify-between"
                    >
                        <span className="truncate max-w-[80px] md:max-w-[120px]">{currentSong.title}</span>
                        <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute top-full right-0 mt-2 w-48 py-2 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 flex flex-col gap-1 p-1">
                        {SONGS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setCurrentSongId(s.id)}
                                className={`text-left px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${currentSongId === s.id
                                    ? 'bg-white/50 text-[#4B4036] font-bold shadow-sm'
                                    : 'hover:bg-white/30 text-[#4B4036]/80'
                                    }`}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                {s.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <InteractionToggle
                        isEnabled={isTracking}
                        onToggle={handleInteractionToggle}
                        isLoading={isGestureLoading}
                    />
                    <PlaygroundHint
                        isVisible={!isTracking && !showConfirmModal && !isHintDismissed && !isPreparing && countdown === null}
                        className="absolute top-12 -right-4 z-50 w-[240px] pointer-events-none"
                    />
                </div>

                <FoodBalanceButton />

                <UnifiedRightContent
                    user={user}
                    onLogout={logout}
                />

                <Link href="/aihome">
                    <div className="w-10 h-10 rounded-full bg-[#A7C7E7] hover:bg-[#8FB8E0] shadow-md flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer group border border-white/20">
                        <HomeIcon className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                </Link>
            </div>

            {/* 3D Scene */}
            <div className="w-full h-screen">
                <PitchBellScene
                    gesture={gesture}
                    handX={handX}
                    handY={handY}
                    isTracking={isTracking}
                    isPlaying={isPlaying}
                    song={currentSong}
                />
            </div>

            {/* Game Start Overlays */}
            {(isPreparing || countdown !== null) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-sm absolute inset-0" />
                    <div className="relative z-10 flex flex-col items-center justify-center text-white">
                        {isPreparing && (
                            <div className="text-center animate-pulse flex flex-col items-center">
                                <HandRaisedIcon className="w-16 h-16 text-white mb-4" />
                                <h2 className="text-2xl font-bold mb-2">請將手放在鏡頭前</h2>
                                <p className="text-white/80">準備開始...</p>
                            </div>
                        )}

                        {countdown !== null && (
                            <div className="text-center">
                                <div className="text-9xl font-bold animate-ping text-[#FFDD59] drop-shadow-lg">
                                    {countdown}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Gesture Confirm Modal */}
            <GestureConfirmModal
                isOpen={showConfirmModal}
                onConfirm={handleConfirmStart}
                onCancel={() => setShowConfirmModal(false)}
                isLoading={isGestureLoading}
            />



            {/* Click to dismiss overlay (only when hint is visible and not tracking) */}
            {!isTracking && !showConfirmModal && !isHintDismissed && !isPreparing && countdown === null && (
                <div
                    className="absolute inset-0 z-30"
                    onClick={() => setIsHintDismissed(true)}
                />
            )}
        </div>
    );
}

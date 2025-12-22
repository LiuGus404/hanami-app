'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Cog6ToothIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    ForwardIcon,
    BackwardIcon,
    ArrowPathRoundedSquareIcon, // for Loop
    ArrowsRightLeftIcon, // for Shuffle
    MusicalNoteIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightOnRectangleIcon,
    PuzzlePieceIcon,
    UserGroupIcon,
    UsersIcon,
    ArchiveBoxIcon,
    ChartBarIcon,
    UserPlusIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

interface ExtraMenuItem {
    name: string;
    onClick: () => void;
    icon?: ReactNode;
    className?: string;
}

interface UnifiedRightContentProps {
    user: any;
    onLogout: () => void;
    onNavigate?: (key: string) => void;
    extraMenuItems?: ExtraMenuItem[];
}

export default function UnifiedRightContent({ user, onLogout, onNavigate, extraMenuItems }: UnifiedRightContentProps) {
    const router = useRouter();
    const {
        isPlaying,
        togglePlay,
        nextTrack,
        prevTrack,
        volume,
        setVolume,
        isLooping,
        toggleLoop,
        isShuffling,
        toggleShuffle
    } = useMusicPlayer();

    // 獨立控制各個彈出視窗的開關
    const [showMusicPopup, setShowMusicPopup] = useState(false);
    const [showGearDropdown, setShowGearDropdown] = useState(false);

    const handleItemClick = (item: any) => {
        if (item.onClick) {
            item.onClick();
            setShowGearDropdown(false);
        } else if (item.action) {
            if (onNavigate) {
                onNavigate(item.action);
            } else if (item.action.startsWith('view:')) {
                // 如果沒有提供 onNavigate (例如在聊天室中)，則跳轉到 Dashboard 並帶上 view 參數
                const view = item.action.split(':')[1];
                router.push(`/aihome/ai-companions?view=${view}`);
            }
        } else if (item.href) {
            router.push(item.href);
        }
    };

    return (
        <div className="flex items-center space-x-2 relative">
            {/* Music Player Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setShowMusicPopup(!showMusicPopup);
                    setShowGearDropdown(false); // 互斥
                }}
                className={`relative hidden md:flex items-center justify-center p-2 rounded-xl font-medium transition-all ${isPlaying
                    ? 'text-[#8B5E3C] bg-[#EADBC8]/30'
                    : 'text-[#4B4036] hover:bg-black/5'
                    }`}
                title="播放器控制"
            >
                {isPlaying ? (
                    <SpeakerWaveIcon className="w-6 h-6" />
                ) : (
                    <SpeakerXMarkIcon className="w-6 h-6" />
                )}
            </motion.button>

            {/* Gear Menu Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setShowGearDropdown(!showGearDropdown);
                    setShowMusicPopup(false); // 互斥
                }}
                className="relative flex items-center justify-center p-2 text-[#4B4036] hover:bg-black/5 rounded-xl font-medium transition-all"
            >
                <motion.div
                    animate={{ rotate: showGearDropdown ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <Cog6ToothIcon className="w-6 h-6" />
                </motion.div>
            </motion.button>

            {/* Music Player Popup */}
            <AnimatePresence>
                {showMusicPopup && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute top-14 right-12 bg-[#FFFDF8] rounded-2xl shadow-xl border border-[#EADBC8] p-4 min-w-[280px] z-50 backdrop-blur-sm bg-opacity-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4 border-b border-[#EADBC8]/30 pb-2">
                            <h3 className="text-sm font-bold text-[#4B4036] flex items-center">
                                <span className="mr-2"><MusicalNoteIcon className="w-4 h-4 inline-block" /></span> Hanami Lo-Fi
                            </h3>
                            {isPlaying && (
                                <div className="flex space-x-1">
                                    <motion.div
                                        animate={{ height: [4, 12, 6, 14, 8] }}
                                        transition={{ repeat: Infinity, duration: 1.2 }}
                                        className="w-1 bg-[#8B5E3C] rounded-full"
                                    />
                                    <motion.div
                                        animate={{ height: [8, 4, 12, 5, 10] }}
                                        transition={{ repeat: Infinity, duration: 0.9, delay: 0.1 }}
                                        className="w-1 bg-[#8B5E3C] rounded-full"
                                    />
                                    <motion.div
                                        animate={{ height: [6, 10, 5, 12, 4] }}
                                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                                        className="w-1 bg-[#8B5E3C] rounded-full"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col space-y-4">
                            {/* Main Controls: Prev - Play/Pause - Next */}
                            <div className="flex justify-center items-center space-x-6">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={prevTrack}
                                    className="p-2 text-[#8C7A6B] hover:text-[#4B4036] transition-colors"
                                >
                                    <BackwardIcon className="w-6 h-6" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: "#6B5142" }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={togglePlay}
                                    className="p-3 bg-[#4B4036] text-[#FFFDF8] rounded-full shadow-lg"
                                >
                                    {isPlaying ? (
                                        <SpeakerWaveIcon className="w-6 h-6" />
                                    ) : (
                                        <SpeakerXMarkIcon className="w-6 h-6 ml-0.5" />
                                    )}
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={nextTrack}
                                    className="p-2 text-[#8C7A6B] hover:text-[#4B4036] transition-colors"
                                >
                                    <ForwardIcon className="w-6 h-6" />
                                </motion.button>
                            </div>

                            {/* Secondary Controls: Loop & Shuffle */}
                            <div className="flex justify-between items-center px-4">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={toggleLoop}
                                    className={`p-1.5 rounded-lg transition-colors ${isLooping
                                        ? 'bg-[#EADBC8] text-[#4B4036]'
                                        : 'text-[#8C7A6B] hover:bg-[#EADBC8]/30'
                                        }`}
                                    title="循環播放"
                                >
                                    <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                                </motion.button>

                                <div className="text-[10px] text-[#D4C5B5] font-mono">
                                    LO-FI BEATS
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={toggleShuffle}
                                    className={`p-1.5 rounded-lg transition-colors ${isShuffling
                                        ? 'bg-[#EADBC8] text-[#4B4036]'
                                        : 'text-[#8C7A6B] hover:bg-[#EADBC8]/30'
                                        }`}
                                    title="隨機播放"
                                >
                                    <ArrowsRightLeftIcon className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Volume Slider */}
                            <div className="flex items-center space-x-3 px-2 pt-2 border-t border-[#EADBC8]/30">
                                <SpeakerXMarkIcon className="w-4 h-4 text-[#8C7A6B]" />
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-[#EADBC8] rounded-lg appearance-none cursor-pointer accent-[#4B4036]"
                                />
                                <SpeakerWaveIcon className="w-4 h-4 text-[#8C7A6B]" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gear Menu Dropdown */}
            <AnimatePresence>
                {showGearDropdown && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute top-14 right-0 bg-white rounded-xl shadow-xl border border-[#EADBC8]/20 p-2 min-w-[200px] z-50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-2 border-b border-[#EADBC8]/30 mb-1">
                            <div className="font-bold text-[#4B4036] text-sm">HanamiEcho</div>
                            <div className="text-[10px] text-[#8C7A6B]">您的AI工作和學習夥伴</div>
                        </div>

                        {/* Mobile Only: Hanami Lo-Fi Trigger */}
                        <div
                            onClick={() => {
                                setShowMusicPopup(true);
                                setShowGearDropdown(false);
                            }}
                            className="flex md:hidden items-center px-4 py-2 text-sm text-[#8B5E3C] hover:bg-[#FFF9F2] hover:text-[#4B4036] rounded-lg cursor-pointer transition-colors"
                        >
                            <span className="mr-3"><MusicalNoteIcon className="w-4 h-4" /></span>
                            Hanami Lo-Fi
                        </div>

                        {/* Extra Items (Context Specific like Room Settings) */}
                        {extraMenuItems && extraMenuItems.length > 0 && (
                            <>
                                {extraMenuItems.map((item, idx) => (
                                    <div
                                        key={`extra-${idx}`}
                                        onClick={() => handleItemClick(item)}
                                        className={`flex items-center px-4 py-2 text-sm text-[#6B5142] hover:bg-[#FFF9F2] hover:text-[#4B4036] rounded-lg cursor-pointer transition-colors ${item.className || ''}`}
                                    >
                                        {item.icon && <span className="mr-3">{item.icon}</span>}
                                        {item.name}
                                    </div>
                                ))}
                                <div className="border-t border-[#EADBC8]/30 my-1"></div>
                            </>
                        )}

                        {[
                            { name: '思維積木', action: 'view:mind', icon: <PuzzlePieceIcon className="w-4 h-4" /> },
                            { name: '腦力工作台', action: 'view:chat', icon: <UserGroupIcon className="w-4 h-4" /> },
                            { name: '角色', action: 'view:roles', icon: <UsersIcon className="w-4 h-4" /> },
                            { name: '記憶', action: 'view:memory', icon: <ArchiveBoxIcon className="w-4 h-4" /> },
                            { name: '數據面板', action: 'view:stats', icon: <ChartBarIcon className="w-4 h-4" /> },
                        ].map((item) => (
                            <div
                                key={item.name}
                                onClick={() => handleItemClick(item)}
                                className="flex items-center px-4 py-2 text-sm text-[#6B5142] hover:bg-[#FFF9F2] hover:text-[#4B4036] rounded-lg cursor-pointer transition-colors"
                            >
                                <span className="mr-3">{item.icon}</span>
                                {item.name}
                            </div>
                        ))}

                        <div className="border-t border-[#EADBC8]/30 my-1"></div>

                        {user ? (
                            <div
                                onClick={() => {
                                    onLogout();
                                    setShowGearDropdown(false);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-[#E57373] hover:bg-[#FFF9F2] hover:text-[#D32F2F] rounded-lg cursor-pointer transition-colors"
                            >
                                <span className="mr-3"><ArrowRightOnRectangleIcon className="w-4 h-4" /></span> 登出
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-1">
                                <div
                                    onClick={() => {
                                        router.push('/aihome/auth/login');
                                        setShowGearDropdown(false);
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-[#6B5142] hover:bg-[#FFF9F2] hover:text-[#4B4036] rounded-lg cursor-pointer transition-colors"
                                >
                                    <span className="mr-3"><UserIcon className="w-4 h-4" /></span> 登入
                                </div>
                                <div
                                    onClick={() => {
                                        router.push('/aihome/auth/register');
                                        setShowGearDropdown(false);
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-[#6B5142] hover:bg-[#FFF9F2] hover:text-[#4B4036] rounded-lg cursor-pointer transition-colors"
                                >
                                    <span className="mr-3"><UserPlusIcon className="w-4 h-4" /></span> 註冊
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

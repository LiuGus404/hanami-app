'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

// 定義音樂曲目
const LOFI_TRACKS = [
    '/music/chritmassong2.mp3', // Default Christmas song, can add more tracks here
    ...Array.from({ length: 10 }, (_, i) => `/music/lofi-${i + 1}.mp3`)
];

interface MusicPlayerContextType {
    isPlaying: boolean;
    currentTrackIndex: number;
    volume: number;
    isLooping: boolean; // 單曲循環
    isShuffling: boolean; // 隨機播放
    togglePlay: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    setVolume: (vol: number) => void;
    toggleLoop: () => void;
    toggleShuffle: () => void;
    currentTrackSrc: string;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [volume, setVolume] = useState(1 / 3); // 預設音量 33% (1/3)
    const [isLooping, setIsLooping] = useState(true); // 預設單曲循環
    const [isShuffling, setIsShuffling] = useState(false);
    const [playlist, setPlaylist] = useState<string[]>(LOFI_TRACKS); // 實際播放列表 (可能被 shuffle)

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isInitializedRef = useRef(false);

    // 初始化 Audio 和設備偵測 - 只執行一次
    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        if (!audioRef.current) {
            audioRef.current = new Audio(playlist[currentTrackIndex]);
            audioRef.current.volume = volume;
        }

        // 偵測設備類型：如果是桌面版 (寬度 >= 1024px)，嘗試自動播放
        // 注意：瀏覽器可能仍會阻止沒有交互的自動播放
        const isDesktop = window.innerWidth >= 1024;
        if (isDesktop) {
            setIsPlaying(true);
        }
        // 不再設置 setIsPlaying(false)，保持當前狀態

        return () => {
            // 只有在組件真正卸載時才清理
        };
    }, []);

    // 監聽 playlist 變化 (Shuffle)
    useEffect(() => {
        if (isShuffling) {
            const shuffled = [...LOFI_TRACKS].sort(() => Math.random() - 0.5);
            setPlaylist(shuffled);
            // shuffle 後重置 index 到 0，並更新 audio src
            setCurrentTrackIndex(0);
        } else {
            setPlaylist(LOFI_TRACKS);
            // 還原到原始列表，這裡簡化處理，亦可嘗試找到當前歌曲在原始列表的位置
            setCurrentTrackIndex(0);
        }
    }, [isShuffling]);

    // 音頻源更新
    useEffect(() => {
        if (!audioRef.current) return;

        const targetSrc = window.location.origin + playlist[currentTrackIndex];

        // 如果 src 改變了才更新
        if (audioRef.current.src !== targetSrc && !audioRef.current.src.endsWith(playlist[currentTrackIndex])) {
            audioRef.current.src = playlist[currentTrackIndex];
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Play failed:", e));
            }
        }
    }, [currentTrackIndex, playlist]);

    // 播放狀態控制
    useEffect(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.play().catch(e => {
                // Ignore NotAllowedError (autoplay blocked), log others
                if (e.name !== 'NotAllowedError') {
                    console.error("Play failed:", e);
                }
                // If blocked, we sync state to false
                if (e.name === 'NotAllowedError') {
                    setIsPlaying(false);
                }
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);

    // 音量控制
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // 循環與自動下一首
    useEffect(() => {
        if (!audioRef.current) return;

        const handleEnded = () => {
            if (isLooping) {
                audioRef.current!.currentTime = 0;
                audioRef.current!.play();
            } else {
                nextTrack();
            }
        };

        audioRef.current.addEventListener('ended', handleEnded);
        return () => {
            audioRef.current?.removeEventListener('ended', handleEnded);
        };
    }, [isLooping, playlist.length, currentTrackIndex]); // 依賴 isLooping 和 nextTrack 邏輯

    // 核心功能
    const togglePlay = () => setIsPlaying(!isPlaying);

    const nextTrack = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    };

    const prevTrack = () => {
        setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    };

    const toggleLoop = () => setIsLooping(!isLooping);
    const toggleShuffle = () => setIsShuffling(!isShuffling);

    return (
        <MusicPlayerContext.Provider value={{
            isPlaying,
            currentTrackIndex,
            volume,
            isLooping,
            isShuffling,
            togglePlay,
            nextTrack,
            prevTrack,
            setVolume,
            toggleLoop,
            toggleShuffle,
            currentTrackSrc: playlist[currentTrackIndex]
        }}>
            {children}
        </MusicPlayerContext.Provider>
    );
}

export function useMusicPlayer() {
    const context = useContext(MusicPlayerContext);
    if (context === undefined) {
        throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
    }
    return context;
}

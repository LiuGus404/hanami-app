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

// 全局音頻實例，確保整個應用只有一個 Audio 元素
declare global {
    interface Window {
        __HANAMI_AUDIO_INSTANCE__?: HTMLAudioElement;
        __HANAMI_AUDIO_INITIALIZED__?: boolean;
    }
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [volume, setVolume] = useState(1 / 3); // 預設音量 33% (1/3)
    const [isLooping, setIsLooping] = useState(true); // 預設單曲循環
    const [isShuffling, setIsShuffling] = useState(false);
    const [playlist, setPlaylist] = useState<string[]>(LOFI_TRACKS); // 實際播放列表 (可能被 shuffle)

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isInitializedRef = useRef(false);

    // 初始化 Audio 和設備偵測 - 使用全局單例模式
    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        // 使用全局音頻實例，防止多個 Provider 創建多個音頻元素
        if (typeof window !== 'undefined') {
            if (window.__HANAMI_AUDIO_INSTANCE__) {
                // 使用現有的全局音頻實例
                audioRef.current = window.__HANAMI_AUDIO_INSTANCE__;
                console.log('🎵 使用現有的全局音頻實例');
            } else {
                // 創建新的全局音頻實例
                audioRef.current = new Audio(playlist[currentTrackIndex]);
                audioRef.current.volume = volume;
                audioRef.current.loop = true; // 預設啟用單曲循環
                window.__HANAMI_AUDIO_INSTANCE__ = audioRef.current;
                console.log('🎵 創建新的全局音頻實例');
            }
        }

        // 偵測設備類型：如果是桌面版 (寬度 >= 1024px)，嘗試自動播放
        // 注意：瀏覽器可能仍會阻止沒有交互的自動播放
        if (typeof window !== 'undefined') {
            const isDesktop = window.innerWidth >= 1024;
            if (isDesktop && !window.__HANAMI_AUDIO_INITIALIZED__) {
                setIsPlaying(true);
                window.__HANAMI_AUDIO_INITIALIZED__ = true;
            }
        }

        return () => {
            // 不清理全局音頻實例，讓它在頁面導航時保持播放
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
        // 確保使用全局音頻實例
        let audio = audioRef.current;
        if (!audio && typeof window !== 'undefined' && window.__HANAMI_AUDIO_INSTANCE__) {
            audio = window.__HANAMI_AUDIO_INSTANCE__;
            audioRef.current = audio;
        }

        if (audio) {
            audio.volume = volume;
            console.log('🎵 音量設置為:', volume);
        }
    }, [volume]);

    // 循環控制 - 使用 HTML5 Audio 的 loop 屬性
    useEffect(() => {
        // 確保 audioRef.current 已經初始化
        let audio = audioRef.current;
        if (!audio && typeof window !== 'undefined' && window.__HANAMI_AUDIO_INSTANCE__) {
            audio = window.__HANAMI_AUDIO_INSTANCE__;
            audioRef.current = audio;
        }

        if (audio) {
            audio.loop = isLooping;
            console.log('🎵 循環模式設置為:', isLooping);
        }
    }, [isLooping]);

    // 當循環模式關閉時，處理自動播放下一首
    useEffect(() => {
        let audio = audioRef.current;
        if (!audio && typeof window !== 'undefined' && window.__HANAMI_AUDIO_INSTANCE__) {
            audio = window.__HANAMI_AUDIO_INSTANCE__;
            audioRef.current = audio;
        }

        if (!audio) return;

        const handleEnded = () => {
            console.log('🎵 歌曲播放結束，isLooping:', isLooping);
            // 如果是單曲循環模式，HTML5 loop 屬性會自動處理
            // 只有在非循環模式下才需要手動播放下一首
            if (!isLooping) {
                setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
            }
        };

        audio.addEventListener('ended', handleEnded);
        console.log('🎵 已添加 ended 事件監聽器');

        return () => {
            audio?.removeEventListener('ended', handleEnded);
        };
    }, [isLooping, playlist.length]);

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

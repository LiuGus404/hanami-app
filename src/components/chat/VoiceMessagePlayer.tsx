import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

interface VoiceMessagePlayerProps {
    src: string;
    className?: string;
    sender?: 'user' | 'ai';
}

export function VoiceMessagePlayer({ src, className = '', sender = 'user' }: VoiceMessagePlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isError, setIsError] = useState(false); // Added error state
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        const handleLoadedMetadata = () => {
            if (audio.duration && isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
            setIsError(false);
        };

        const handleError = () => {
            console.warn('⚠️ [VoiceMessagePlayer] Audio resource failed to load:', src);
            setIsError(true);
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);
        };
    }, [src]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(err => {
                    console.error('Error playing audio:', err);
                    setIsPlaying(false);
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Generate random bar heights for waveform effect
    const bars = [40, 60, 50, 80, 55, 45, 70, 40, 60, 75, 50, 45, 60, 40, 50, 60, 45, 50];

    return (
        <div className={`flex items-center gap-3 p-2 rounded-2xl min-w-[200px] ${className} ${sender === 'user' ? 'bg-[#FFF0F5]/50' : 'bg-white/50'
            }`}>
            <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

            {/* Play Button */}
            <button
                onClick={togglePlay}
                disabled={isError}
                className={`w-10 h-10 flex items-center justify-center rounded-full shadow-sm transition-all active:scale-95 ${isError
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : sender === 'user'
                            ? 'bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] text-white'
                            : 'bg-white text-[#FFB6C1] border border-[#FFB6C1]'
                    }`}
            >
                {isError ? (
                    <div className="w-5 h-5 flex items-center justify-center font-bold text-xs">!</div>
                ) : isPlaying ? (
                    <PauseIcon className="w-5 h-5" />
                ) : (
                    <PlayIcon className="w-5 h-5 ml-0.5" />
                )}
            </button>

            {/* Waveform Visualization */}
            <div className="flex items-center gap-[2px] h-8 flex-1">
                {bars.map((height, i) => (
                    <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-200 ${isPlaying
                            ? 'animate-pulse'
                            : ''
                            }`}
                        style={{
                            height: `${height}%`,
                            backgroundColor: i / bars.length * 100 < progress
                                ? '#FFB6C1' // Played color
                                : '#EADBC8', // Unplayed color
                            opacity: isPlaying ? 0.8 + Math.random() * 0.2 : 1
                        }}
                    />
                ))}
            </div>

            {/* Time Display */}
            <span className="text-[10px] text-[#8C7A6B] font-medium min-w-[28px] text-right">
                {duration > 0
                    ? (() => {
                        const time = isPlaying && audioRef.current ? audioRef.current.currentTime : duration;
                        const minutes = Math.floor(time / 60);
                        const seconds = Math.floor(time % 60);
                        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    })()
                    : '0:00'
                }
            </span>
        </div>
    );
}

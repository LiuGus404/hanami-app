'use client';

import React, { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeftIcon, HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import FoodBalanceButton from '@/components/aihome/FoodBalanceButton';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import InteractionToggle from '@/components/aihome/InteractionToggle';
import GestureConfirmModal from '@/components/aihome/GestureConfirmModal';
import { useHandGesture } from '@/hooks/useHandGesture';
import PhotoUploadButton from './components/PhotoUploadButton';
import PhotoUploadModal from './components/PhotoUploadModal';
import PhotoGalleryModal from './components/PhotoGalleryModal';
import RecordButton from './components/RecordButton';
import { usePhotoDecorations } from './hooks/usePhotoDecorations';
import { useCanvasRecording } from './hooks/useCanvasRecording';

// Dynamic import with SSR disabled
const ChristmasTreeScene = dynamic(
    () => import('./components/ChristmasTreeScene'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-[#FAFAF9]">
                <div className="text-[#4B4036] text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-[#4B4036]/30 border-t-[#4B4036] rounded-full mx-auto mb-4" />
                    <p className="text-lg">Loading 3D Experience...</p>
                </div>
            </div>
        )
    }
);

export default function ChristmasTreePage() {
    const router = useRouter();
    const { user, logout } = useSaasAuth();
    const { gesture, handX, handY, isTracking, startTracking, stopTracking } = useHandGesture();
    const { photos, isLoading: isPhotoLoading, addPhoto, removePhoto } = usePhotoDecorations();
    const { isRecording, recordingTime, startRecording, stopRecording, downloadRecording } = useCanvasRecording();
    const [isGestureLoading, setIsGestureLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [hasRecording, setHasRecording] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleResetCamera = useCallback(() => {
        setResetKey(prev => prev + 1);
    }, []);

    const handleInteractionToggle = useCallback(() => {
        if (isTracking) {
            stopTracking();
        } else {
            setShowConfirmModal(true);
        }
    }, [isTracking, stopTracking]);

    const handleConfirmStart = useCallback(async () => {
        setIsGestureLoading(true);
        try {
            await startTracking();
            setShowConfirmModal(false);
        } finally {
            setIsGestureLoading(false);
        }
    }, [startTracking]);

    const handlePhotoUploadClick = useCallback(() => {
        setShowPhotoModal(true);
    }, []);

    const handlePhotoModalConfirm = useCallback(() => {
        setShowPhotoModal(false);
        setShowGalleryModal(true);
    }, []);

    const handleAddMorePhotos = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await addPhoto(file);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            // Keep gallery open after upload
            if (!showGalleryModal) {
                setShowGalleryModal(true);
            }
        }
    }, [addPhoto, showGalleryModal]);

    return (
        <div className="w-full h-screen relative overflow-hidden bg-[#FAFAF9]">
            {/* Header - Matching Playground Style */}
            <div className="absolute top-0 left-0 pt-10 px-8 z-10 text-center md:text-left pointer-events-none">
                <div className="inline-flex items-center gap-4">
                    <Link href="/aihome/playground" className="pointer-events-auto hover:scale-110 transition-transform">
                        <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-[#EADBC8] shadow-sm flex items-center justify-center hover:bg-white text-[#4B4036]">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </div>
                    </Link>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-[#4B4036] inline-flex items-center gap-4 font-serif tracking-widest">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4B4036] via-[#6B5142] to-[#8C7A6B] drop-shadow-sm">
                                聖誕許願樹
                            </span>
                        </h1>
                        <p className="text-[#8A8A8A] text-lg md:text-xl mt-1 font-light tracking-wide opacity-80">
                            沉浸式 3D 粒子互動體驗
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Bar - InteractionToggle | FoodBalance | Settings | Home */}
            <div className="absolute top-8 right-6 z-50 flex items-center space-x-3 pointer-events-auto">
                {/* Interaction Toggle */}
                <InteractionToggle
                    isEnabled={isTracking}
                    onToggle={handleInteractionToggle}
                    isLoading={isGestureLoading}
                />

                {/* Reset Camera Button */}
                <button
                    onClick={handleResetCamera}
                    className="w-10 h-10 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-md shadow-md flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer group border border-white/40"
                    title="重置鏡頭"
                >
                    <ArrowPathIcon className="w-5 h-5 text-[#4B4036] group-hover:rotate-180 transition-transform duration-500" />
                </button>

                {/* Record Button */}
                <RecordButton
                    isRecording={isRecording}
                    recordingTime={recordingTime}
                    onStartRecording={startRecording}
                    onStopRecording={async () => {
                        const blob = await stopRecording();
                        if (blob) setHasRecording(true);
                    }}
                    hasRecording={hasRecording}
                    onDownload={downloadRecording}
                />

                {/* Photo Upload */}
                <PhotoUploadButton
                    onClick={handlePhotoUploadClick}
                    isLoading={isPhotoLoading}
                    photoCount={photos.length}
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

            {/* 3D Scene Container */}
            <div className="w-full h-full">
                <ChristmasTreeScene
                    gesture={gesture}
                    handX={handX}
                    handY={handY}
                    isTracking={isTracking}
                    photos={photos}
                    resetKey={resetKey}
                />
            </div>

            {/* Gesture Confirm Modal */}
            <GestureConfirmModal
                isOpen={showConfirmModal}
                onConfirm={handleConfirmStart}
                onCancel={() => setShowConfirmModal(false)}
                isLoading={isGestureLoading}
            />

            {/* Photo Upload Modal */}
            <PhotoUploadModal
                isOpen={showPhotoModal}
                onConfirm={handlePhotoModalConfirm}
                onCancel={() => setShowPhotoModal(false)}
            />

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Photo Gallery Modal */}
            <PhotoGalleryModal
                isOpen={showGalleryModal}
                photos={photos}
                onClose={() => setShowGalleryModal(false)}
                onDelete={removePhoto}
                onAddMore={handleAddMorePhotos}
            />
        </div>
    );
}

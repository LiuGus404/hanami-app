import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, CameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ReferenceCameraModalProps {
    onClose: () => void;
    onCapture: (file: File) => void;
}

export const ReferenceCameraModal: React.FC<ReferenceCameraModalProps> = ({
    onClose,
    onCapture
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // Front or Back camera
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);

    // Initialize Camera
    useEffect(() => {
        let isCancelled = false;

        const initCamera = async () => {
            try {
                // Ensure any previous stream is stopped before starting new
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }

                const constraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                };

                console.log('[Camera] Requesting access...');
                const newStream = await navigator.mediaDevices.getUserMedia(constraints);

                // If effect was cleaned up (component unmounted or dependency changed) while awaiting
                if (isCancelled) {
                    console.log('[Camera] Component unmounted during init, stopping stream immediately.');
                    newStream.getTracks().forEach(track => track.stop());
                    return;
                }

                console.log('[Camera] Stream started');
                streamRef.current = newStream;
                setStream(newStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                }
                setError(null);

                // Check for multiple cameras
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    setHasMultipleCameras(videoDevices.length > 1);
                } catch (e) {
                    console.warn('[Camera] Failed to enumerate devices', e);
                }

            } catch (err) {
                if (isCancelled) return;
                console.error("Camera Error:", err);
                setError('無法存取相機，請檢查權限設定。');
            }
        };

        initCamera();

        return () => {
            console.log('[Camera] Cleaning up stream');
            isCancelled = true;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log('[Camera] Track stopped:', track.label);
                });
                streamRef.current = null;
            }
        };
    }, [facingMode]);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current frame
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Mirror if user facing
            if (facingMode === 'user') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to File
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                    onClose(); // Close modal after capture
                }
            }, 'image/jpeg', 0.95);
        }
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black">
            {/* Fullscreen Video Container */}
            <div className="relative w-full h-full flex flex-col">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                    <h3 className="text-white font-medium">拍攝照片</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Video Feed */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    {error ? (
                        <div className="text-white/80 text-center p-6">
                            <div className="mb-4 text-4xl">📷</div>
                            {error}
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`max-w-full max-h-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                        />
                    )}
                </div>

                {/* Controls Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex items-center justify-center gap-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    {hasMultipleCameras && (
                        <button
                            onClick={switchCamera}
                            className="p-4 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/20"
                        >
                            <ArrowPathIcon className="w-6 h-6" />
                        </button>
                    )}

                    {/* Shutter Button */}
                    <button
                        onClick={handleCapture}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm transition-transform active:scale-95"
                    >
                        <div className="w-16 h-16 rounded-full bg-white" />
                    </button>

                    {/* Placeholder for balance */}
                    {hasMultipleCameras && <div className="w-14" />}
                </div>

                {/* Hidden Canvas for Capture */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
};

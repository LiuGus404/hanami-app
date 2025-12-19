'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type GestureState = 'OPEN' | 'CLOSED' | 'UNKNOWN';

interface UseHandGestureResult {
    gesture: GestureState;
    handX: number; // 0-1, where 0.5 is center
    handY: number; // 0-1, where 0.5 is center
    isTracking: boolean;
    startTracking: () => Promise<void>;
    stopTracking: () => void;
}

// Type definitions for MediaPipe (loaded from CDN)
interface MediaPipeLandmark {
    x: number;
    y: number;
    z: number;
}

interface MediaPipeResults {
    multiHandLandmarks?: MediaPipeLandmark[][];
}

declare global {
    interface Window {
        Hands: any;
        Camera: any;
    }
}

function detectGesture(landmarks: MediaPipeLandmark[]): GestureState {
    const fingertips = [8, 12, 16, 20];
    const knuckles = [6, 10, 14, 18];

    let extendedCount = 0;

    for (let i = 0; i < fingertips.length; i++) {
        const tip = landmarks[fingertips[i]];
        const knuckle = landmarks[knuckles[i]];
        if (tip.y < knuckle.y) extendedCount++;
    }

    const thumbTip = landmarks[4];
    const thumbKnuckle = landmarks[2];
    if (Math.abs(thumbTip.x - thumbKnuckle.x) > 0.05) extendedCount++;

    if (extendedCount >= 4) return 'OPEN';
    if (extendedCount <= 1) return 'CLOSED';
    return 'UNKNOWN';
}

// Load script helper
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export function useHandGesture(): UseHandGestureResult {
    const [gesture, setGesture] = useState<GestureState>('UNKNOWN');
    const [handX, setHandX] = useState(0.5); // Center position
    const [handY, setHandY] = useState(0.5); // Center position
    const [isTracking, setIsTracking] = useState(false);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const handsRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startTracking = useCallback(async () => {
        if (isTracking) return;

        try {
            // Load MediaPipe scripts from CDN
            await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
            await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');

            // Wait for globals to be available
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!window.Hands || !window.Camera) {
                throw new Error('MediaPipe not loaded');
            }

            // Create hidden video element
            const video = document.createElement('video');
            video.style.display = 'none';
            video.setAttribute('playsinline', '');
            document.body.appendChild(video);
            videoRef.current = video;

            // Get camera stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' }
            });
            streamRef.current = stream;
            video.srcObject = stream;
            await video.play();

            // Initialize MediaPipe Hands
            const hands = new window.Hands({
                locateFile: (file: string) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5
            });

            hands.onResults((results: MediaPipeResults) => {
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const landmarks = results.multiHandLandmarks[0];
                    setGesture(detectGesture(landmarks));

                    // Track palm center X position (wrist landmark 0)
                    // Note: Camera is mirrored, so we invert X (1 - x)
                    const palmX = 1 - landmarks[0].x;
                    const palmY = landmarks[0].y;

                    setHandX(palmX);
                    setHandY(palmY);
                } else {
                    setGesture('UNKNOWN');
                }
            });

            handsRef.current = hands;

            // Use Camera utils for frame capture
            const camera = new window.Camera(video, {
                onFrame: async () => {
                    if (videoRef.current && handsRef.current) {
                        await handsRef.current.send({ image: videoRef.current });
                    }
                },
                width: 320,
                height: 240
            });
            await camera.start();
            cameraRef.current = camera;

            setIsTracking(true);

        } catch (error) {
            console.error('Failed to start hand tracking:', error);
            setIsTracking(false);
        }
    }, [isTracking]);

    const stopTracking = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.remove();
            videoRef.current = null;
        }

        handsRef.current = null;
        setIsTracking(false);
        setGesture('UNKNOWN');
        setHandX(0.5);
        setHandY(0.5);
    }, []);

    useEffect(() => {
        return () => { stopTracking(); };
    }, [stopTracking]);

    return { gesture, handX, handY, isTracking, startTracking, stopTracking };
}

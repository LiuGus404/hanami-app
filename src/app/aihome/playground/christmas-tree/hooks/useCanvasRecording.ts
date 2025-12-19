'use client';

import { useState, useRef, useCallback } from 'react';

interface UseCanvasRecordingResult {
    isRecording: boolean;
    recordingTime: number;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<Blob | null>;
    downloadRecording: () => void;
}

export function useCanvasRecording(): UseCanvasRecordingResult {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastBlobRef = useRef<Blob | null>(null);

    const startRecording = useCallback(async () => {
        try {
            // Find the canvas element
            const canvas = document.querySelector('canvas');
            if (!canvas) {
                console.error('Canvas not found');
                return;
            }

            // Get canvas stream
            const stream = canvas.captureStream(30); // 30 FPS

            // Add audio if available (optional, but nice for ambient sounds)
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
            } catch (e) {
                console.log('No audio available, recording video only');
            }

            // Create MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : 'video/webm';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start(100); // Collect data every 100ms
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                resolve(null);
                return;
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                lastBlobRef.current = blob;

                // Stop all tracks
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

                setIsRecording(false);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                resolve(blob);
            };

            mediaRecorderRef.current.stop();
        });
    }, []);

    const downloadRecording = useCallback(() => {
        if (!lastBlobRef.current) return;

        const url = URL.createObjectURL(lastBlobRef.current);
        const a = document.createElement('a');
        a.href = url;
        a.download = `christmas-tree-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    return {
        isRecording,
        recordingTime,
        startRecording,
        stopRecording,
        downloadRecording
    };
}

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PhotoDecoration {
    id: string;
    dataUrl: string;
    dominantColor: string;
    timestamp: number;
}

const STORAGE_KEY = 'hanami_christmas_tree_photos';
const MAX_PHOTOS = 10;

// Vibrant fallback palette
const VIBRANT_PALETTE = [
    '#FF0044', // Red
    '#FFD700', // Gold
    '#0088FF', // Blue
    '#FF6B8A', // Pink
    '#6AA84F', // Green
    '#FF8C00', // Orange
    '#9B59B6', // Purple
];

// Extract most vibrant color from image
function extractDominantColor(img: HTMLImageElement): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return VIBRANT_PALETTE[Math.floor(Math.random() * VIBRANT_PALETTE.length)];

    canvas.width = 50;
    canvas.height = 50;
    ctx.drawImage(img, 0, 0, 50, 50);

    const imageData = ctx.getImageData(0, 0, 50, 50);
    const data = imageData.data;

    // Find the most saturated color
    let bestColor = { r: 255, g: 215, b: 0 }; // Gold fallback
    let bestSaturation = 0;

    for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel for speed
        if (data[i + 3] < 128) continue; // Skip transparent

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const brightness = max / 255;

        // Prefer saturated, bright colors
        const score = saturation * 0.7 + brightness * 0.3;

        if (score > bestSaturation && saturation > 0.2) {
            bestSaturation = score;
            bestColor = { r, g, b };
        }
    }

    // If no saturated color found, use random from palette
    if (bestSaturation < 0.15) {
        return VIBRANT_PALETTE[Math.floor(Math.random() * VIBRANT_PALETTE.length)];
    }

    // Boost the color vibrancy
    const boost = 1.4;
    const r = Math.min(255, Math.round(bestColor.r * boost));
    const g = Math.min(255, Math.round(bestColor.g * boost));
    const b = Math.min(255, Math.round(bestColor.b * boost));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function usePhotoDecorations() {
    const [photos, setPhotos] = useState<PhotoDecoration[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setPhotos(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load photos:', e);
        }
    }, []);

    // Save to localStorage when photos change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
        } catch (e) {
            console.error('Failed to save photos:', e);
        }
    }, [photos]);

    const addPhoto = useCallback(async (file: File): Promise<boolean> => {
        if (photos.length >= MAX_PHOTOS) {
            alert(`最多只能上傳 ${MAX_PHOTOS} 張相片`);
            return false;
        }

        setIsLoading(true);

        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;

                const img = new Image();
                img.onload = () => {
                    // Create circular cropped image
                    const size = 200; // Fixed size for circular crop
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        setIsLoading(false);
                        resolve(false);
                        return;
                    }

                    canvas.width = size;
                    canvas.height = size;

                    // Create circular clipping path
                    ctx.beginPath();
                    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    // Calculate crop to center the image
                    const { width, height } = img;
                    const aspectRatio = width / height;
                    let drawWidth, drawHeight, drawX, drawY;

                    if (aspectRatio > 1) {
                        // Wider than tall - crop sides
                        drawHeight = size;
                        drawWidth = size * aspectRatio;
                        drawX = -(drawWidth - size) / 2;
                        drawY = 0;
                    } else {
                        // Taller than wide - crop top/bottom
                        drawWidth = size;
                        drawHeight = size / aspectRatio;
                        drawX = 0;
                        drawY = -(drawHeight - size) / 2;
                    }

                    // Draw centered and cropped to circle
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                    // Use PNG to preserve transparency
                    const circularDataUrl = canvas.toDataURL('image/png');
                    const dominantColor = extractDominantColor(img);

                    const newPhoto: PhotoDecoration = {
                        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        dataUrl: circularDataUrl,
                        dominantColor,
                        timestamp: Date.now()
                    };

                    setPhotos(prev => [...prev, newPhoto]);
                    setIsLoading(false);
                    resolve(true);
                };

                img.onerror = () => {
                    setIsLoading(false);
                    resolve(false);
                };

                img.src = dataUrl;
            };

            reader.onerror = () => {
                setIsLoading(false);
                resolve(false);
            };

            reader.readAsDataURL(file);
        });
    }, [photos.length]);

    const removePhoto = useCallback((id: string) => {
        setPhotos(prev => prev.filter(p => p.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setPhotos([]);
    }, []);

    return {
        photos,
        isLoading,
        addPhoto,
        removePhoto,
        clearAll,
        canAddMore: photos.length < MAX_PHOTOS
    };
}

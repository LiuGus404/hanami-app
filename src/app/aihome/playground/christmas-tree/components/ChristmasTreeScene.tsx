'use client';

import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import GreenTreeParticles from './GreenTreeParticles';
import StarTopper from './StarTopper';
import SnowParticles from './SnowParticles';
import SceneEffects from './SceneEffects';
import GestureTutorial from './GestureTutorial';
import PhotoOrnaments from './PhotoOrnaments';
import { GestureState } from '@/hooks/useHandGesture';
import { PhotoDecoration } from '../hooks/usePhotoDecorations';

interface ChristmasTreeSceneProps {
    gesture: GestureState;
    handX: number;
    handY?: number;
    isTracking: boolean;
    photos: PhotoDecoration[];
    resetKey?: number;
}

interface InteractiveTreeProps {
    gesture: GestureState;
    handX: number;
    handY?: number;
    isTracking: boolean;
    photos: PhotoDecoration[];
    onScaleChange: (scale: number) => void;
    focusedPhotoIndex: number | null;
    onPhotoClick: (index: number) => void;
    resetKey?: number;
}

// Generate ornament position (same as PhotoOrnaments)
function getOrnamentPosition(index: number, total: number): THREE.Vector3 {
    const height = 5.0;
    const maxRadius = 2.5;
    const y = (index / total) * height * 0.8 + 0.5;
    const coneRadius = maxRadius * (1 - y / height);
    const angle = (index * 2.4) + (index * 0.5);
    const dist = coneRadius * 0.7;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    return new THREE.Vector3(x, y - 2, z); // Offset by group position
}

// Inner component that uses R3F hooks
function InteractiveTree({ gesture, handX, handY = 0.5, isTracking, photos, onScaleChange, focusedPhotoIndex, onPhotoClick, resetKey }: InteractiveTreeProps) {
    const groupRef = useRef<THREE.Group>(null);
    const { camera, gl } = useThree();

    // State for interactions
    const rotationRef = useRef(0);
    const targetRotationRef = useRef(0);
    const scaleRef = useRef(1);
    const targetScaleRef = useRef(1);
    const isDragging = useRef(false);
    const lastMouseX = useRef(0);
    const [currentScale, setCurrentScale] = useState(1);

    // Camera animation state
    const defaultCameraPos = useRef(new THREE.Vector3(0, 0.5, 8));
    const targetCameraPos = useRef(new THREE.Vector3(0, 0.5, 8));
    const cameraAnimating = useRef(false);

    // Update camera target when focused photo changes
    useEffect(() => {
        if (focusedPhotoIndex !== null && photos.length > 0) {
            const pos = getOrnamentPosition(focusedPhotoIndex, photos.length);
            // Position camera in front of the ornament
            targetCameraPos.current.set(pos.x * 0.3, pos.y + 0.5, pos.z + 2);
            cameraAnimating.current = true;
        } else {
            targetCameraPos.current.copy(defaultCameraPos.current);
            cameraAnimating.current = true;
        }
    }, [focusedPhotoIndex, photos.length]);

    // Update target scale based on gesture
    useEffect(() => {
        if (gesture === 'OPEN') {
            targetScaleRef.current = 2.0;
        } else if (gesture === 'CLOSED') {
            targetScaleRef.current = 1.0;
        }
    }, [gesture]);

    // Reset camera when resetKey changes
    useEffect(() => {
        if (resetKey !== undefined && resetKey > 0) {
            // Reset all positions to default
            defaultCameraPos.current.set(0, 0.5, 8);
            targetCameraPos.current.set(0, 0.5, 8);
            camera.position.set(0, 0.5, 8);
            rotationRef.current = 0;
            targetRotationRef.current = 0;
            scaleRef.current = 1;
            targetScaleRef.current = 1;
            if (groupRef.current) {
                groupRef.current.rotation.y = 0;
                groupRef.current.scale.setScalar(1);
            }
        }
    }, [resetKey, camera]);

    // Mouse event handlers
    useEffect(() => {
        const canvas = gl.domElement;

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 0) {
                isDragging.current = true;
                lastMouseX.current = e.clientX;
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current && focusedPhotoIndex === null) {
                const deltaX = e.clientX - lastMouseX.current;
                targetRotationRef.current += deltaX * 0.01;
                lastMouseX.current = e.clientX;
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        const handleWheel = (e: WheelEvent) => {
            if (focusedPhotoIndex !== null) return; // Disable zoom when focused
            e.preventDefault();
            const zoomSpeed = 0.002;
            const newZ = camera.position.z + e.deltaY * zoomSpeed;
            defaultCameraPos.current.z = THREE.MathUtils.clamp(newZ, 4, 15);
            targetCameraPos.current.z = defaultCameraPos.current.z;
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseUp);
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [camera, gl, focusedPhotoIndex]);

    // Animation loop
    useFrame(() => {
        if (!groupRef.current) return;

        // Smooth rotation lerp (disable when focused)
        if (focusedPhotoIndex === null) {
            rotationRef.current += (targetRotationRef.current - rotationRef.current) * 0.1;
            groupRef.current.rotation.y = rotationRef.current;
        }

        // Smooth scale lerp
        scaleRef.current += (targetScaleRef.current - scaleRef.current) * 0.1;
        groupRef.current.scale.setScalar(scaleRef.current);

        // Update current scale for photo ornaments
        if (Math.abs(scaleRef.current - currentScale) > 0.01) {
            setCurrentScale(scaleRef.current);
            onScaleChange(scaleRef.current);
        }

        // Animate camera position
        if (cameraAnimating.current) {
            camera.position.lerp(targetCameraPos.current, 0.08);
            if (camera.position.distanceTo(targetCameraPos.current) < 0.01) {
                cameraAnimating.current = false;
            }
        }

        // Hand gesture rotation control (when tracking and not focused)
        if (isTracking && gesture !== 'UNKNOWN' && focusedPhotoIndex === null) {
            targetRotationRef.current = (handX - 0.5) * Math.PI * 2;

            // Vertical camera movement based on hand Y
            // handY = 0 (top) -> camera at 4 (see top of tree/star)
            // handY = 1 (bottom) -> camera at -2 (see bottom of tree)
            const targetY = 4 - (handY * 6);
            if (!cameraAnimating.current) {
                const currentY = defaultCameraPos.current.y;
                defaultCameraPos.current.y = currentY + (targetY - currentY) * 0.08;
                camera.position.y = defaultCameraPos.current.y;
            }
        } else if (!isDragging.current && focusedPhotoIndex === null) {
            targetRotationRef.current += 0.002;

            // Return to default height when not tracking
            if (!cameraAnimating.current) {
                const targetY = 0.5;
                const currentY = defaultCameraPos.current.y;
                defaultCameraPos.current.y = currentY + (targetY - currentY) * 0.05;
                camera.position.y = defaultCameraPos.current.y;
            }
        }
    });

    const handlePhotoClick = (photo: PhotoDecoration) => {
        const index = photos.findIndex(p => p.id === photo.id);
        onPhotoClick(index);
    };

    return (
        <group ref={groupRef} position={[0, -2, 0]}>
            <GreenTreeParticles count={3000} />
            <PhotoOrnaments photos={photos} currentScale={currentScale} onPhotoClick={handlePhotoClick} />
            <StarTopper />
        </group>
    );
}

export default function ChristmasTreeScene({ gesture, handX, handY, isTracking, photos, resetKey }: ChristmasTreeSceneProps) {
    const [currentScale, setCurrentScale] = useState(1);
    const [focusedPhotoIndex, setFocusedPhotoIndex] = useState<number | null>(null);

    const handlePhotoClick = (index: number) => {
        console.log('Photo clicked:', index);
        if (focusedPhotoIndex === index) {
            // Already focused, zoom out
            setFocusedPhotoIndex(null);
        } else {
            // Zoom to this photo
            setFocusedPhotoIndex(index);
        }
    };

    // Use onPointerMissed to detect clicks on empty space
    const handlePointerMissed = () => {
        console.log('Pointer missed - unfocusing');
        if (focusedPhotoIndex !== null) {
            setFocusedPhotoIndex(null);
        }
    };

    return (
        <div className="w-full h-full relative">
            {/* Gesture Tutorial */}
            <GestureTutorial isVisible={isTracking} currentGesture={gesture} />

            {/* Hint to click again to zoom out */}
            {focusedPhotoIndex !== null && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-white text-sm">
                    點擊任意處返回
                </div>
            )}

            <Canvas className="w-full h-full" dpr={[1, 2]} onPointerMissed={handlePointerMissed}>
                <PerspectiveCamera makeDefault position={[0, 0.5, 8]} fov={50} />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#ffddaa" />
                <pointLight position={[-10, 5, -10]} intensity={0.5} color="#eeaaff" />

                <Suspense fallback={null}>
                    <InteractiveTree
                        gesture={gesture}
                        handX={handX}
                        handY={handY}
                        isTracking={isTracking}
                        photos={photos}
                        onScaleChange={setCurrentScale}
                        focusedPhotoIndex={focusedPhotoIndex}
                        onPhotoClick={handlePhotoClick}
                        resetKey={resetKey}
                    />
                    <SnowParticles count={800} />
                </Suspense>

                <SceneEffects />
            </Canvas>
        </div>
    );
}

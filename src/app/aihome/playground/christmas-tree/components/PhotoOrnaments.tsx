'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { PhotoDecoration } from '../hooks/usePhotoDecorations';

interface PhotoOrnamentsProps {
    photos: PhotoDecoration[];
    currentScale: number;
    onPhotoClick?: (photo: PhotoDecoration) => void;
}

// Generate fixed positions for ornaments on the tree
function generateOrnamentPosition(index: number, total: number): THREE.Vector3 {
    const height = 5.0;
    const maxRadius = 2.5;

    // Distribute evenly up the tree
    const y = (index / total) * height * 0.8 + 0.5;
    const coneRadius = maxRadius * (1 - y / height);

    // Spiral pattern
    const angle = (index * 2.4) + (index * 0.5);
    const dist = coneRadius * 0.7;

    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    return new THREE.Vector3(x, y, z);
}

// Single ornament component - using Sprite for reliable image display
function PhotoOrnament({
    photo,
    position,
    currentScale,
    onClick
}: {
    photo: PhotoDecoration;
    position: THREE.Vector3;
    currentScale: number;
    onClick?: () => void;
}) {
    const spriteRef = useRef<THREE.Sprite>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [hovered, setHovered] = useState(false);
    const floatOffset = useRef(Math.random() * Math.PI * 2);

    // Load texture from data URL using Image element (more reliable)
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const tex = new THREE.Texture(img);
            tex.needsUpdate = true;
            tex.colorSpace = THREE.SRGBColorSpace;
            setTexture(tex);
        };
        img.src = photo.dataUrl;
    }, [photo.dataUrl]);

    // Animation
    useFrame((state) => {
        if (spriteRef.current) {
            // Gentle float
            const time = state.clock.getElapsedTime();
            spriteRef.current.position.y = position.y + Math.sin(time + floatOffset.current) * 0.08;
            // Scale on hover
            const targetScale = hovered ? 0.7 : 0.5;
            const currentScale = spriteRef.current.scale.x;
            const newScale = currentScale + (targetScale - currentScale) * 0.1;
            spriteRef.current.scale.set(newScale, newScale, 1);
        }
    });

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        console.log('Sprite clicked!', photo.id);
        e.stopPropagation();
        if (onClick) {
            onClick();
        }
    };

    // Create material
    const material = useMemo(() => {
        if (texture) {
            return new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: true,
                depthWrite: false
            });
        }
        return new THREE.SpriteMaterial({
            color: 0xFFD700,
            transparent: true
        });
    }, [texture]);

    return (
        <sprite
            ref={spriteRef}
            position={[position.x, position.y, position.z]}
            onClick={handleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            material={material}
            scale={[0.5, 0.5, 1]}
        />
    );
}

// Particle burst around ornament
function OrnamentParticles({ position, color }: { position: THREE.Vector3; color: string }) {
    const pointsRef = useRef<THREE.Points>(null);

    const particleData = useMemo(() => {
        const count = 20;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const col = new THREE.Color(color);

        for (let i = 0; i < count; i++) {
            const radius = 0.2 + Math.random() * 0.1;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = position.x + Math.sin(phi) * Math.cos(theta) * radius;
            positions[i * 3 + 1] = position.y + Math.cos(phi) * radius;
            positions[i * 3 + 2] = position.z + Math.sin(phi) * Math.sin(theta) * radius;

            colors[i * 3] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;
        }

        return { positions, colors };
    }, [position, color]);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleData.positions.length / 3}
                    args={[particleData.positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particleData.colors.length / 3}
                    args={[particleData.colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                vertexColors
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

export default function PhotoOrnaments({ photos, currentScale, onPhotoClick }: PhotoOrnamentsProps) {
    const ornamentPositions = useMemo(() => {
        return photos.map((_, index) => generateOrnamentPosition(index, photos.length));
    }, [photos.length]);

    if (photos.length === 0) return null;

    return (
        <group>
            {photos.map((photo, index) => (
                <group key={photo.id}>
                    <PhotoOrnament
                        photo={photo}
                        position={ornamentPositions[index]}
                        currentScale={currentScale}
                        onClick={() => onPhotoClick?.(photo)}
                    />
                    <OrnamentParticles
                        position={ornamentPositions[index]}
                        color={photo.dominantColor}
                    />
                </group>
            ))}
        </group>
    );
}

'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SnowParticlesProps {
    count?: number;
}

export default function SnowParticles({ count = 1000 }: SnowParticlesProps) {
    const mesh = useRef<THREE.Points>(null);

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Random position in a large cube
            positions[i * 3] = (Math.random() - 0.5) * 20;     // X: -10 to 10
            positions[i * 3 + 1] = Math.random() * 15;           // Y: 0 to 15 (above ground)
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // Z: -10 to 10

            velocities[i] = Math.random() * 0.02 + 0.01; // Fall speed
            sizes[i] = Math.random() * 3 + 1;
        }

        return { positions, velocities, sizes };
    }, [count]);

    useFrame(() => {
        if (!mesh.current) return;
        const positions = mesh.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < count; i++) {
            // Animate Y position (falling)
            positions[i * 3 + 1] -= particles.velocities[i];

            // Reset when below ground
            if (positions[i * 3 + 1] < -2) {
                positions[i * 3 + 1] = 15;
                positions[i * 3] = (Math.random() - 0.5) * 20;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
            }

            // Gentle horizontal drift
            positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.002;
            positions[i * 3 + 2] += Math.cos(Date.now() * 0.001 + i) * 0.002;
        }

        mesh.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.positions.length / 3}
                    array={particles.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={particles.sizes.length}
                    array={particles.sizes}
                    itemSize={1}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.08}
                color="#ffffff"
                transparent
                opacity={0.8}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}

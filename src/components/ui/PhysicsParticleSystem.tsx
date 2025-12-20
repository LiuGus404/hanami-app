'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useSphere, usePlane } from '@react-three/cannon';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

interface PhysicsParticleSystemProps {
    type?: 'air-clock' | 'growth-tree' | 'mind-switch';
    count?: number;
    className?: string;
    mouseInteraction?: boolean;
}

// Helper to get random ranges
const r = (min: number, max: number) => Math.random() * (max - min) + min;

// Individual Particle Component
const Particle = ({
    position,
    color,
    size,
    type
}: {
    position: [number, number, number];
    color: string;
    size: number;
    type: string;
}) => {
    // Physcis body
    const [ref, api] = useSphere(() => ({
        mass: 1,
        position,
        args: [size],
        linearDamping: 0.5,
        angularDamping: 0.5,
        // Material props for bounciness
        material: { friction: 0.1, restitution: 0.8 },
    }));

    // State for original position to return to or flow around
    const originalPos = useRef(new THREE.Vector3(...position));

    // Random offset for floating animation
    const timeOffset = useRef(Math.random() * 100);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Theme-specific behaviors
        if (type === 'air-clock') {
            // Gentle floating + return to original general area
            // Apply a small force towards original position to keep them from drifting away forever
            // interactive force from mouse is handled globally or via separate hook? 
            // Simplified: Just add some noise forces
            api.applyForce(
                [
                    Math.sin(time + timeOffset.current) * 2,
                    Math.cos(time * 0.5 + timeOffset.current) * 2 + (Math.sin(time) * 1), // Slight anti-gravity
                    Math.sin(time * 0.8 + timeOffset.current) * 2
                ],
                [0, 0, 0]
            );
        } else if (type === 'growth-tree') {
            // Upward flow
            api.applyForce([0, 5, 0], [0, 0, 0]); // Constant up force

            // Reset if too high (manual check, simplistic)
            // Note: reading position from api is async/subscription based. 
            // For simple visual effects, we might just let them float off or use a "box" boundary.
        } else if (type === 'mind-switch') {
            // Chaotic / Network
            api.applyForce(
                [
                    Math.sin(time * 2 + timeOffset.current) * 10,
                    Math.cos(time * 2 + timeOffset.current) * 10,
                    Math.sin(time * 2 + timeOffset.current) * 10
                ],
                [0, 0, 0]
            )
        }
    });

    return (
        <mesh ref={ref as any} castShadow receiveShadow>
            {/* Icosahedron for more crystal-like refraction, higher detail */}
            <icosahedronGeometry args={[size, 4]} />
            <meshPhysicalMaterial
                color={color}
                transmission={1.0} // Glass
                opacity={1}
                metalness={0.1}
                roughness={0.05} // Very subtle roughness for "frosted" variation or keep 0 for crystal
                ior={1.5} // Glass Index of Refraction
                thickness={1.5} // Refraction volume
                specularIntensity={1}
                envMapIntensity={1}
                clearcoat={1}
                clearcoatRoughness={0.1}
            />
        </mesh>
    );
};

// Mouse Interactor (Invisible Sphere following mouse)
const MouseInteractor = () => {
    const { viewport, mouse } = useThree();
    const [ref, api] = useSphere(() => ({
        type: 'Kinematic',
        args: [1],
        position: [0, 0, 0]
    }));

    useFrame((state) => {
        // Convert normalized mouse coordinates (-1 to 1) to world coordinates
        const x = (state.mouse.x * viewport.width) / 2;
        const y = (state.mouse.y * viewport.height) / 2;
        api.position.set(x, y, 0);
    });

    return (
        <mesh ref={ref as any} visible={false}>
            <sphereGeometry args={[1]} />
        </mesh>
    );
};

// Boundaries to keep particles on screen
const Boundaries = () => {
    const { viewport } = useThree();
    const width = viewport.width;
    const height = viewport.height;

    // Walls
    usePlane(() => ({ position: [0, -height / 2 - 2, 0], rotation: [-Math.PI / 2, 0, 0] })); // Bottom (Floor)
    usePlane(() => ({ position: [0, height / 2 + 5, 0], rotation: [Math.PI / 2, 0, 0] })); // Top
    usePlane(() => ({ position: [-width / 2 - 2, 0, 0], rotation: [0, Math.PI / 2, 0] })); // Left
    usePlane(() => ({ position: [width / 2 + 2, 0, 0], rotation: [0, -Math.PI / 2, 0] })); // Right
    usePlane(() => ({ position: [0, 0, -5], rotation: [0, 0, 0] })); // Back wall
    usePlane(() => ({ position: [0, 0, 10], rotation: [0, -Math.PI, 0] })); // Front invisible wall to keep in z-range

    return null;
}


const PhysicsParticleSystem = ({
    type = 'air-clock',
    count = 20,
    className = "",
    mouseInteraction = true
}: PhysicsParticleSystemProps) => {

    // Theme Configuration
    const theme = useMemo(() => {
        switch (type) {
            case 'air-clock':
                return {
                    colors: ['#A5F3FC', '#67E8F9', '#22D3EE', '#E0F2FE', '#FFFFFF'], // Cyans/Whites
                    sizes: [0.2, 0.5],
                    gravity: [0, -0.5, 0] as [number, number, number], // Low gravity
                };
            case 'growth-tree':
                return {
                    colors: ['#86EFAC', '#4ADE80', '#22C55E', '#DCFCE7', '#FEF3C7'], // Greens/Golds
                    sizes: [0.3, 0.6],
                    gravity: [0, 1, 0] as [number, number, number], // Reverse gravity (Growth)
                };
            case 'mind-switch':
                return {
                    colors: ['#C084FC', '#A855F7', '#E879F9', '#F3E8FF', '#FFFFFF'], // Purples/Pinks
                    sizes: [0.2, 0.4],
                    gravity: [0, 0, 0] as [number, number, number], // Zero gravity
                };
            default:
                return {
                    colors: ['#CCCCCC'],
                    sizes: [0.5, 0.5],
                    gravity: [0, -9.8, 0] as [number, number, number]
                }
        }
    }, [type]);

    // Generate initial particles
    const particles = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => ({
            position: [r(-5, 5), r(-5, 5), r(-2, 2)] as [number, number, number],
            color: theme.colors[Math.floor(Math.random() * theme.colors.length)],
            size: r(theme.sizes[0], theme.sizes[1]),
        }));
    }, [count, theme]);

    return (
        <div className={`absolute inset-0 pointer-events-none ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 10], fov: 50 }}
                dpr={[1, 2]}
                gl={{ alpha: true, antialias: true }}
            >
                {/* Lights */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color={theme.colors[0]} />
                <Environment preset="city" />

                <Physics gravity={theme.gravity}>
                    {mouseInteraction && <MouseInteractor />}
                    <Boundaries />
                    {particles.map((data, i) => (
                        <Particle
                            key={i}
                            {...data}
                            type={type}
                        />
                    ))}
                </Physics>
            </Canvas>
        </div>
    );
};

export default PhysicsParticleSystem;

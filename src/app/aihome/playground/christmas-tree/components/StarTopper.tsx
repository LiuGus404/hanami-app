'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Shader for starburst particles with glow
const StarburstShader = {
    vertexShader: `
        uniform float uTime;
        attribute float aSize;
        attribute float aRay;
        
        varying float vAlpha;
        varying float vRay;
        
        void main() {
            vec3 pos = position;
            
            // Subtle twinkle effect
            float twinkle = sin(uTime * 3.0 + aRay * 6.28) * 0.15 + 0.85;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Size with distance attenuation
            gl_PointSize = aSize * twinkle * (200.0 / -mvPosition.z);
            
            vAlpha = twinkle;
            vRay = aRay;
        }
    `,
    fragmentShader: `
        varying float vAlpha;
        varying float vRay;
        
        void main() {
            vec2 xy = gl_PointCoord.xy - vec2(0.5);
            float r = length(xy);
            if (r > 0.5) discard;
            
            // Soft glow falloff
            float glow = 1.0 - (r * 2.0);
            glow = pow(glow, 1.2);
            
            // Warm gold to cream gradient
            vec3 color = mix(vec3(1.0, 0.85, 0.4), vec3(1.0, 0.95, 0.8), vRay);
            
            gl_FragColor = vec4(color, glow * vAlpha);
        }
    `
};

export default function StarTopper() {
    const pointsRef = useRef<THREE.Points>(null);
    const shaderRef = useRef<THREE.ShaderMaterial>(null);

    // Generate starburst particle positions
    const particles = useMemo(() => {
        const numRays = 8;
        const particlesPerRay = 12;
        const rayLength = 0.6;

        const count = 1 + (numRays * particlesPerRay); // 1 center + rays

        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const rays = new Float32Array(count);

        // Center particle (larger, brighter)
        positions[0] = 0;
        positions[1] = 0;
        positions[2] = 0;
        sizes[0] = 1.8;
        rays[0] = 0.5;

        let idx = 1;
        for (let ray = 0; ray < numRays; ray++) {
            const angle = (ray * Math.PI * 2) / numRays;

            for (let p = 0; p < particlesPerRay; p++) {
                const progress = (p + 1) / particlesPerRay;
                const dist = progress * rayLength;

                positions[idx * 3] = Math.cos(angle) * dist;
                positions[idx * 3 + 1] = Math.sin(angle) * dist;
                positions[idx * 3 + 2] = 0;

                // Size decreases along the ray
                sizes[idx] = 0.8 * (1.0 - progress * 0.7);
                rays[idx] = progress;

                idx++;
            }
        }

        return { positions, sizes, rays, count };
    }, []);

    useFrame((state) => {
        if (shaderRef.current) {
            shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
        if (pointsRef.current) {
            pointsRef.current.rotation.z += 0.003;
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 }
    }), []);

    return (
        <group position={[0, 5.3, 0]}>
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particles.count}
                        args={[particles.positions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-aSize"
                        count={particles.count}
                        args={[particles.sizes, 1]}
                    />
                    <bufferAttribute
                        attach="attributes-aRay"
                        count={particles.count}
                        args={[particles.rays, 1]}
                    />
                </bufferGeometry>
                <shaderMaterial
                    ref={shaderRef}
                    vertexShader={StarburstShader.vertexShader}
                    fragmentShader={StarburstShader.fragmentShader}
                    uniforms={uniforms}
                    transparent={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Warm glow light */}
            <pointLight
                color="#FFE5B4"
                intensity={1.2}
                distance={2}
                decay={2}
            />
        </group>
    );
}

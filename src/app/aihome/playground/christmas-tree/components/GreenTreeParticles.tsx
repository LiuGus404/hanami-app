'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleShader = {
    vertexShader: `
    uniform float uTime;
    attribute float aScale;
    attribute float aSpeed;
    attribute vec3 aRandom;
    attribute float aIsDecoration;
    attribute vec3 aDecorationColor;
    
    varying vec3 vColor;
    
    void main() {
      vec3 pos = position;
      
      // Floating animation
      pos.y += sin(uTime * aSpeed + aRandom.x * 10.0) * 0.1;
      pos.x += cos(uTime * aSpeed * 0.5 + aRandom.y * 10.0) * 0.05;
      pos.z += sin(uTime * aSpeed * 0.5 + aRandom.z * 10.0) * 0.05;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      float sizeMultiplier = aIsDecoration > 0.5 ? 2.5 : 1.0; // Ornaments are larger
      gl_PointSize = aScale * sizeMultiplier * (300.0 / -mvPosition.z);
      
      // Color logic
      vec3 leafColor = mix(vec3(0.0, 0.4, 0.1), vec3(0.4, 0.8, 0.4), smoothstep(-2.0, 4.0, pos.y));
      
      // Mix between leaf and decoration color
      vColor = mix(leafColor, aDecorationColor, step(0.5, aIsDecoration));
    }
  `,
    fragmentShader: `
    varying vec3 vColor;
    
    void main() {
      // Circular particle
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float r = length(xy);
      if (r > 0.5) discard;
      
      // Soft glow
      float glow = 1.0 - (r * 2.0);
      glow = pow(glow, 1.5);
      
      gl_FragColor = vec4(vColor, glow);
    }
  `
};

interface GreenTreeParticlesProps {
    count?: number;
}

export default function GreenTreeParticles({ count = 2000 }: GreenTreeParticlesProps) {
    const mesh = useRef<THREE.Points>(null);
    const shaderRef = useRef<THREE.ShaderMaterial>(null);

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const scales = new Float32Array(count);
        const speeds = new Float32Array(count);
        const randoms = new Float32Array(count * 3);
        const isDecorations = new Float32Array(count);
        const decorationColors = new Float32Array(count * 3);

        const radius = 2.5;
        const height = 5.0;

        // Palette: Red, Gold, Blue, Silver
        const palette = [
            new THREE.Color('#FF0044'), // Red
            new THREE.Color('#FFD700'), // Gold
            new THREE.Color('#0088FF'), // Blue
            new THREE.Color('#E0E0E0'), // Silver
        ];

        for (let i = 0; i < count; i++) {
            // Cone shape distribution
            const r = Math.random();
            const y = r * height; // 0 to 5
            const coneRadius = radius * (1.0 - r);

            // Spiral distribution
            const angle = (i * 0.5) + Math.random() * Math.PI * 2;
            const dist = Math.sqrt(Math.random()) * coneRadius;

            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            scales[i] = Math.random() * 0.5 + 0.2;
            speeds[i] = Math.random() * 0.5 + 0.5;

            randoms[i * 3] = Math.random();
            randoms[i * 3 + 1] = Math.random();
            randoms[i * 3 + 2] = Math.random();

            // Decoration Logic (5% chance)
            if (Math.random() < 0.05) {
                isDecorations[i] = 1.0;
                const color = palette[Math.floor(Math.random() * palette.length)];
                decorationColors[i * 3] = color.r;
                decorationColors[i * 3 + 1] = color.g;
                decorationColors[i * 3 + 2] = color.b;
            } else {
                isDecorations[i] = 0.0;
                // Default black, won't be used due to mix()
                decorationColors[i * 3] = 0;
            }
        }

        return { positions, scales, speeds, randoms, isDecorations, decorationColors };
    }, [count]);

    useFrame((state) => {
        if (shaderRef.current) {
            shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 }
    }), []);

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particles.positions.length / 3}
                    args={[particles.positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-aScale"
                    count={particles.scales.length}
                    args={[particles.scales, 1]}
                />
                <bufferAttribute
                    attach="attributes-aSpeed"
                    count={particles.speeds.length}
                    args={[particles.speeds, 1]}
                />
                <bufferAttribute
                    attach="attributes-aRandom"
                    count={particles.randoms.length / 3}
                    args={[particles.randoms, 3]}
                />
                <bufferAttribute
                    attach="attributes-aIsDecoration"
                    count={particles.isDecorations.length}
                    args={[particles.isDecorations, 1]}
                />
                <bufferAttribute
                    attach="attributes-aDecorationColor"
                    count={particles.decorationColors.length / 3}
                    args={[particles.decorationColors, 3]}
                />
            </bufferGeometry>
            <shaderMaterial
                ref={shaderRef}
                vertexShader={ParticleShader.vertexShader}
                fragmentShader={ParticleShader.fragmentShader}
                uniforms={uniforms}
                transparent={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

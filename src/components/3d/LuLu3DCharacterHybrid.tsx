'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';

interface LuLu3DCharacterHybridProps {
  position?: [number, number, number];
  scale?: number;
}

export function LuLu3DCharacterHybrid({ 
  position = [0, 0, 0], 
  scale = 1
}: LuLu3DCharacterHybridProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'wave' | 'shake' | 'jump'>('idle');

  // 載入 LuLu 圖片作為紋理
  const luluTexture = useTexture('/lulu.png');

  // 動畫控制
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();

    // 待機動畫 - 輕微呼吸效果
    if (currentAnimation === 'idle') {
      const breatheScale = 1 + Math.sin(time * 2) * 0.02;
      groupRef.current.scale.setScalar(scale * breatheScale);
      
      // 輕微旋轉
      groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
    }

    // 揮手動畫
    if (currentAnimation === 'wave') {
      const waveTime = (time % 2) / 2;
      if (waveTime < 0.5) {
        const waveProgress = waveTime * 2;
        groupRef.current.rotation.z = Math.sin(waveProgress * Math.PI) * 0.2;
      }
    }

    // 搖頭動畫
    if (currentAnimation === 'shake') {
      const shakeTime = (time % 1) / 1;
      if (shakeTime < 0.8) {
        const shakeProgress = shakeTime / 0.8;
        groupRef.current.rotation.z = Math.sin(shakeProgress * Math.PI * 4) * 0.3;
      }
    }

    // 跳起動畫
    if (currentAnimation === 'jump') {
      const jumpTime = (time % 1.5) / 1.5;
      if (jumpTime < 0.6) {
        const jumpProgress = jumpTime / 0.6;
        const jumpHeight = Math.sin(jumpProgress * Math.PI) * 0.4;
        groupRef.current.position.y = position[1] + jumpHeight;
        groupRef.current.scale.setScalar(scale * (1 + jumpProgress * 0.2));
      } else {
        groupRef.current.position.y = position[1];
        groupRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* 主要 LuLu 圖片 */}
      <mesh position={[0, 0, 0.1]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial 
          map={luluTexture} 
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 3D 效果層 */}
      {/* 光環效果 */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <ringGeometry args={[1.1, 1.3, 32]} />
        <meshBasicMaterial 
          color="#FFD59A" 
          transparent={true} 
          opacity={0.4}
        />
      </mesh>
      
      {/* 粒子效果 */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 8) * Math.PI * 2) * 1.5,
            Math.sin((i / 8) * Math.PI * 2) * 1.5,
            0.2
          ]}
        >
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial 
            color="#FFD59A" 
            transparent={true} 
            opacity={0.6}
          />
        </mesh>
      ))}
      
      {/* 陰影 */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent={true} 
          opacity={0.15}
        />
      </mesh>
      
      {/* 背景裝飾 */}
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[1.4, 32]} />
        <meshBasicMaterial 
          color="#FFF9F2" 
          transparent={true} 
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}


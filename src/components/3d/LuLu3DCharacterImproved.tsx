'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface LuLu3DCharacterImprovedProps {
  position?: [number, number, number];
  scale?: number;
}

export function LuLu3DCharacterImproved({ 
  position = [0, 0, 0], 
  scale = 1
}: LuLu3DCharacterImprovedProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'wave' | 'shake' | 'jump'>('idle');

  // 嘗試載入 LuLu 圖片作為紋理
  const luluTexture = useTexture('/lulu.png');

  // 簡化的動畫控制
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();

    // 待機動畫 - 輕微呼吸效果
    if (currentAnimation === 'idle') {
      const breatheScale = 1 + Math.sin(time * 2) * 0.01;
      groupRef.current.scale.setScalar(scale * breatheScale);
    }

    // 跳起動畫
    if (currentAnimation === 'jump') {
      const jumpTime = (time % 1.5) / 1.5;
      if (jumpTime < 0.6) {
        const jumpProgress = jumpTime / 0.6;
        const jumpHeight = Math.sin(jumpProgress * Math.PI) * 0.3;
        groupRef.current.position.y = position[1] + jumpHeight;
      } else {
        groupRef.current.position.y = position[1];
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* 使用 LuLu 圖片作為平面貼圖 */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial 
          map={luluTexture} 
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 添加一些 3D 效果 */}
      {/* 陰影平面 */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent={true} 
          opacity={0.2}
        />
      </mesh>
      
      {/* 背景光環 */}
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial 
          color="#FFD59A" 
          transparent={true} 
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}


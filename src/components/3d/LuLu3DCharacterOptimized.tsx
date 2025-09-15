'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LuLu3DCharacterOptimizedProps {
  position?: [number, number, number];
  scale?: number;
}

export function LuLu3DCharacterOptimized({ 
  position = [0, 0, 0], 
  scale = 1
}: LuLu3DCharacterOptimizedProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'wave' | 'shake' | 'jump'>('idle');

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
      {/* 簡化的 LuLu 3D 角色 */}
      
      {/* 頭部 - 使用更簡單的幾何體 */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 耳朵 */}
      <mesh position={[-0.3, 1.8, 0]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.15, 0.3, 6]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      <mesh position={[0.3, 1.8, 0]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.15, 0.3, 6]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 耳朵尖端 */}
      <mesh position={[-0.3, 1.95, 0]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.08, 0.15, 6]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0.3, 1.95, 0]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.08, 0.15, 6]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* 眼睛 */}
      <mesh position={[-0.15, 1.6, 0.4]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.15, 1.6, 0.4]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* 鼻子 */}
      <mesh position={[0, 1.5, 0.4]}>
        <coneGeometry args={[0.04, 0.08, 6]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* 身體 */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.6, 1, 0.4]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 米色上衣 */}
      <mesh position={[0, 1.1, 0.21]}>
        <boxGeometry args={[0.62, 0.6, 0.02]} />
        <meshStandardMaterial color="#F5F5DC" />
      </mesh>
      
      {/* 藍色吊帶褲 */}
      <mesh position={[0, 0.8, 0.22]}>
        <boxGeometry args={[0.64, 0.4, 0.02]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      
      {/* 吊帶褲肩帶 */}
      <mesh position={[-0.25, 1.2, 0.22]}>
        <boxGeometry args={[0.08, 0.3, 0.02]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      <mesh position={[0.25, 1.2, 0.22]}>
        <boxGeometry args={[0.08, 0.3, 0.02]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      
      {/* 手臂 */}
      <mesh position={[-0.45, 1, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      <mesh position={[0.45, 1, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 手部 */}
      <mesh position={[-0.45, 0.7, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      <mesh position={[0.45, 0.7, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 腿部 */}
      <mesh position={[-0.15, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.6, 8]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      <mesh position={[0.15, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.6, 8]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 條紋襪子 */}
      <mesh position={[-0.15, -0.05, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.25, 8]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      <mesh position={[0.15, -0.05, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.25, 8]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      
      {/* 藍色鞋子 */}
      <mesh position={[-0.15, -0.2, 0]}>
        <boxGeometry args={[0.2, 0.12, 0.3]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      <mesh position={[0.15, -0.2, 0]}>
        <boxGeometry args={[0.2, 0.12, 0.3]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      
      {/* 白色鞋底 */}
      <mesh position={[-0.15, -0.25, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.32]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.15, -0.25, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.32]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* 尾巴 */}
      <mesh position={[0, 0.8, -0.3]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.2, 0.8, 8]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 尾巴尖端 */}
      <mesh position={[0.15, 0.4, -0.5]} rotation={[0, 0, 0.2]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
}



'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface LuLu3DCharacterProps {
  position?: [number, number, number];
  scale?: number;
  onAnimationComplete?: () => void;
}

export function LuLu3DCharacter({ 
  position = [0, 0, 0], 
  scale = 1,
  onAnimationComplete 
}: LuLu3DCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'wave' | 'shake' | 'jump'>('idle');
  const [animationTime, setAnimationTime] = useState(0);

  // 動畫控制
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    setAnimationTime(time);

    // 待機動畫 - 輕微呼吸效果
    if (currentAnimation === 'idle') {
      const breatheScale = 1 + Math.sin(time * 2) * 0.02;
      groupRef.current.scale.setScalar(scale * breatheScale);
    }

    // 揮手動畫
    if (currentAnimation === 'wave') {
      const waveTime = (time % 2) / 2; // 2秒循環
      if (waveTime < 0.5) {
        const waveProgress = waveTime * 2;
        const armRotation = Math.sin(waveProgress * Math.PI) * 0.5;
        // 這裡需要找到右臂的引用來旋轉
      }
    }

    // 搖頭動畫
    if (currentAnimation === 'shake') {
      const shakeTime = (time % 1) / 1; // 1秒循環
      if (shakeTime < 0.8) {
        const shakeProgress = shakeTime / 0.8;
        const headRotation = Math.sin(shakeProgress * Math.PI * 4) * 0.3;
        // 這裡需要找到頭部的引用來旋轉
      }
    }

    // 跳起動畫
    if (currentAnimation === 'jump') {
      const jumpTime = (time % 1.5) / 1.5; // 1.5秒循環
      if (jumpTime < 0.6) {
        const jumpProgress = jumpTime / 0.6;
        const jumpHeight = Math.sin(jumpProgress * Math.PI) * 0.5;
        groupRef.current.position.y = position[1] + jumpHeight;
      } else {
        groupRef.current.position.y = position[1];
      }
    }
  });

  // 開始動畫
  const startAnimation = (animationType: 'wave' | 'shake' | 'jump') => {
    setCurrentAnimation(animationType);
    setTimeout(() => {
      setCurrentAnimation('idle');
      onAnimationComplete?.();
    }, animationType === 'jump' ? 1500 : 1000);
  };

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* LuLu 3D 角色 */}
      
      {/* 頭部 */}
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 耳朵 */}
      <mesh position={[-0.4, 2.2, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      <mesh position={[0.4, 2.2, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 耳朵尖端 */}
      <mesh position={[-0.4, 2.4, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0.4, 2.4, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* 眼睛 */}
      <mesh position={[-0.2, 1.9, 0.5]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.2, 1.9, 0.5]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* 鼻子 */}
      <mesh position={[0, 1.7, 0.5]}>
        <coneGeometry args={[0.05, 0.1, 6]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* 嘴巴 */}
      <mesh position={[0, 1.6, 0.5]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.1, 0.02, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* 身體 */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.6]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 米色上衣 */}
      <mesh position={[0, 1.2, 0.31]}>
        <boxGeometry args={[0.82, 0.8, 0.02]} />
        <meshStandardMaterial color="#F5F5DC" />
      </mesh>
      
      {/* 藍色吊帶褲 */}
      <mesh position={[0, 0.8, 0.32]}>
        <boxGeometry args={[0.84, 0.6, 0.02]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      
      {/* 吊帶褲肩帶 */}
      <mesh position={[-0.3, 1.4, 0.32]}>
        <boxGeometry args={[0.1, 0.4, 0.02]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      <mesh position={[0.3, 1.4, 0.32]}>
        <boxGeometry args={[0.1, 0.4, 0.02]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      
      {/* 吊帶褲口袋 */}
      <mesh position={[0.2, 0.6, 0.33]}>
        <boxGeometry args={[0.15, 0.2, 0.01]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      
      {/* 手臂 */}
      <mesh position={[-0.6, 1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      <mesh position={[0.6, 1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 手部 */}
      <mesh position={[-0.6, 0.8, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      <mesh position={[0.6, 0.8, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 腿部 */}
      <mesh position={[-0.2, 0.2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.8, 16]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      <mesh position={[0.2, 0.2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.8, 16]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 條紋襪子 */}
      <mesh position={[-0.2, -0.1, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.3, 16]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      <mesh position={[0.2, -0.1, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.3, 16]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      
      {/* 藍色鞋子 */}
      <mesh position={[-0.2, -0.3, 0]}>
        <boxGeometry args={[0.25, 0.15, 0.4]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      <mesh position={[0.2, -0.3, 0]}>
        <boxGeometry args={[0.25, 0.15, 0.4]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      
      {/* 白色鞋底 */}
      <mesh position={[-0.2, -0.35, 0]}>
        <boxGeometry args={[0.27, 0.05, 0.42]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.2, -0.35, 0]}>
        <boxGeometry args={[0.27, 0.05, 0.42]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* 尾巴 */}
      <mesh position={[0, 0.8, -0.4]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.3, 1.2, 16]} />
        <meshStandardMaterial color="#F4E4BC" />
      </mesh>
      
      {/* 尾巴尖端 */}
      <mesh position={[0.2, 0.2, -0.8]} rotation={[0, 0, 0.3]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
}

// 導出動畫控制函數
export const LuLuAnimations = {
  wave: 'wave',
  shake: 'shake',
  jump: 'jump'
};



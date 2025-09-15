'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Text, useTexture } from '@react-three/drei';
import { Mesh, Group, Vector3 } from 'three';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// LuLu 角色的 3D 組件
function LuLuModel({ 
  isWaving = false, 
  isShakingHead = false, 
  isJumping = false,
  onAnimationComplete 
}: {
  isWaving?: boolean;
  isShakingHead?: boolean;
  isJumping?: boolean;
  onAnimationComplete?: () => void;
}) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftHandRef = useRef<Group>(null);
  const rightHandRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  
  // 動畫狀態
  const [waveProgress, setWaveProgress] = useState(0);
  const [headShakeProgress, setHeadShakeProgress] = useState(0);
  const [jumpProgress, setJumpProgress] = useState(0);
  
  // 載入 LuLu 的紋理
  const luluTexture = useTexture('/lulu.png');
  
  // 動畫循環
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // 揮手動畫
    if (isWaving && rightHandRef.current) {
      const waveSpeed = 3;
      const waveAmplitude = 0.3;
      rightHandRef.current.rotation.z = Math.sin(time * waveSpeed) * waveAmplitude;
      rightHandRef.current.rotation.x = Math.sin(time * waveSpeed * 0.5) * 0.1;
      
      setWaveProgress((Math.sin(time * waveSpeed) + 1) / 2);
    }
    
    // 搖頭動畫
    if (isShakingHead && headRef.current) {
      const shakeSpeed = 8;
      const shakeAmplitude = 0.2;
      headRef.current.rotation.y = Math.sin(time * shakeSpeed) * shakeAmplitude;
      
      setHeadShakeProgress((Math.sin(time * shakeSpeed) + 1) / 2);
    }
    
    // 跳起動畫
    if (isJumping && groupRef.current) {
      const jumpSpeed = 2;
      const jumpHeight = 0.5;
      const jumpY = Math.abs(Math.sin(time * jumpSpeed)) * jumpHeight;
      groupRef.current.position.y = jumpY;
      
      setJumpProgress((Math.sin(time * jumpSpeed) + 1) / 2);
    }
    
    // 基礎呼吸動畫
    if (bodyRef.current && !isJumping) {
      const breatheSpeed = 1;
      const breatheScale = 1 + Math.sin(time * breatheSpeed) * 0.02;
      bodyRef.current.scale.setScalar(breatheScale);
    }
  });
  
  // 創建 LuLu 的身體部分
  const createLuLuBody = () => {
    return (
      <group ref={groupRef}>
        {/* 身體主體 */}
        <group ref={bodyRef}>
          {/* 頭部 */}
          <group ref={headRef} position={[0, 1.2, 0]}>
            {/* 狐狸頭部 - 使用球體和變形 */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.8, 32, 32]} />
              <meshStandardMaterial 
                color="#F4E4BC" 
                map={luluTexture}
                transparent={true}
              />
            </mesh>
            
            {/* 耳朵 */}
            <mesh position={[-0.4, 0.6, 0]} rotation={[0, 0, -0.3]}>
              <coneGeometry args={[0.3, 0.6, 8]} />
              <meshStandardMaterial color="#FF8C42" />
            </mesh>
            <mesh position={[0.4, 0.6, 0]} rotation={[0, 0, 0.3]}>
              <coneGeometry args={[0.3, 0.6, 8]} />
              <meshStandardMaterial color="#FF8C42" />
            </mesh>
            
            {/* 眼睛 */}
            <mesh position={[-0.25, 0.1, 0.7]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
            <mesh position={[0.25, 0.1, 0.7]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
            
            {/* 鼻子 */}
            <mesh position={[0, -0.1, 0.8]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
            
            {/* 嘴巴 */}
            <mesh position={[0, -0.3, 0.7]} rotation={[0, 0, 0]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
          </group>
          
          {/* 身體 */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1.2, 0.8]} />
            <meshStandardMaterial color="#F4E4BC" />
          </mesh>
          
          {/* 吊帶褲 */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[1.1, 0.8, 0.9]} />
            <meshStandardMaterial color="#4A90E2" />
          </mesh>
          
          {/* 手臂 */}
          <group ref={leftHandRef} position={[-0.7, 0.3, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
              <meshStandardMaterial color="#F4E4BC" />
            </mesh>
            {/* 手 */}
            <mesh position={[0, -0.5, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="#F4E4BC" />
            </mesh>
          </group>
          
          <group ref={rightHandRef} position={[0.7, 0.3, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
              <meshStandardMaterial color="#F4E4BC" />
            </mesh>
            {/* 手 */}
            <mesh position={[0, -0.5, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="#F4E4BC" />
            </mesh>
          </group>
          
          {/* 腿部 */}
          <mesh position={[-0.3, -1, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.8, 8]} />
            <meshStandardMaterial color="#F4E4BC" />
          </mesh>
          <mesh position={[0.3, -1, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.8, 8]} />
            <meshStandardMaterial color="#F4E4BC" />
          </mesh>
          
          {/* 尾巴 */}
          <mesh position={[0, 0.2, -0.8]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#FF8C42" />
          </mesh>
        </group>
      </group>
    );
  };
  
  return createLuLuBody();
}

// 3D 場景組件
function LuLuScene({ 
  isWaving, 
  isShakingHead, 
  isJumping,
  onAnimationComplete 
}: {
  isWaving: boolean;
  isShakingHead: boolean;
  isJumping: boolean;
  onAnimationComplete?: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* 燈光設置 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* LuLu 角色 */}
      <LuLuModel 
        isWaving={isWaving}
        isShakingHead={isShakingHead}
        isJumping={isJumping}
        onAnimationComplete={onAnimationComplete}
      />
      
      {/* 控制器 */}
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}

// 主要的 LuLu 角色組件
export default function LuLuCharacter() {
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'wave' | 'shake' | 'jump'>('idle');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 動畫控制函數
  const startWave = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentAnimation('wave');
    setTimeout(() => {
      setCurrentAnimation('idle');
      setIsAnimating(false);
    }, 2000);
  };
  
  const startShake = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentAnimation('shake');
    setTimeout(() => {
      setCurrentAnimation('idle');
      setIsAnimating(false);
    }, 1500);
  };
  
  const startJump = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentAnimation('jump');
    setTimeout(() => {
      setCurrentAnimation('idle');
      setIsAnimating(false);
    }, 1000);
  };
  
  // 隨機動畫
  useEffect(() => {
    const randomAnimation = () => {
      if (isAnimating) return;
      
      const animations = ['wave', 'shake', 'jump'] as const;
      const randomAnim = animations[Math.floor(Math.random() * animations.length)];
      
      setIsAnimating(true);
      setCurrentAnimation(randomAnim);
      
      const duration = randomAnim === 'jump' ? 1000 : randomAnim === 'shake' ? 1500 : 2000;
      setTimeout(() => {
        setCurrentAnimation('idle');
        setIsAnimating(false);
      }, duration);
    };
    
    // 每 5-10 秒隨機播放動畫
    const interval = setInterval(randomAnimation, 5000 + Math.random() * 5000);
    
    return () => clearInterval(interval);
  }, [isAnimating]);
  
  return (
    <div className="relative w-full h-full">
      {/* 3D 場景 */}
      <div className="w-full h-full">
        <LuLuScene 
          isWaving={currentAnimation === 'wave'}
          isShakingHead={currentAnimation === 'shake'}
          isJumping={currentAnimation === 'jump'}
        />
      </div>
      
      {/* 動畫控制按鈕 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={startWave}
          disabled={isAnimating}
          className="px-4 py-2 bg-orange-400 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          👋 揮手
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={startShake}
          disabled={isAnimating}
          className="px-4 py-2 bg-blue-400 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🤔 搖頭
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={startJump}
          disabled={isAnimating}
          className="px-4 py-2 bg-green-400 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🦘 跳起
        </motion.button>
      </div>
      
      {/* 動畫狀態指示器 */}
      <div className="absolute top-4 right-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
          <span className="font-medium">LuLu 狀態: </span>
          <span className={`font-bold ${
            currentAnimation === 'idle' ? 'text-gray-600' :
            currentAnimation === 'wave' ? 'text-orange-500' :
            currentAnimation === 'shake' ? 'text-blue-500' :
            'text-green-500'
          }`}>
            {currentAnimation === 'idle' ? '待機中' :
             currentAnimation === 'wave' ? '揮手中' :
             currentAnimation === 'shake' ? '搖頭中' :
             '跳躍中'}
          </span>
        </div>
      </div>
    </div>
  );
}


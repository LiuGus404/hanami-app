'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

interface LuLu3DCharacterOptimizedProps {
  position?: [number, number, number];
  scale?: number;
  onAnimationComplete?: () => void;
}

export function LuLu3DCharacterOptimized({ 
  position = [0, 0, 0], 
  scale = 1,
  onAnimationComplete 
}: LuLu3DCharacterOptimizedProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'wave' | 'shake' | 'jump'>('idle');
  const [animationTime, setAnimationTime] = useState(0);

  // 動畫控制
  useFrame((state) => {
    setAnimationTime(state.clock.elapsedTime);
  });

  // 動畫函數
  const playAnimation = (animationType: 'idle' | 'wave' | 'shake' | 'jump') => {
    setCurrentAnimation(animationType);
    setAnimationTime(0);
    
    // 動畫完成後回調
    setTimeout(() => {
      setCurrentAnimation('idle');
      onAnimationComplete?.();
    }, animationType === 'jump' ? 1500 : 1000);
  };

  return (
    <div ref={divRef} style={{ 
      position: 'absolute', 
      transform: `translate3d(${position[0]}px, ${position[1]}px, ${position[2]}px) scale(${scale})` 
    }}>
      {/* LuLu 3D 角色 - 暫時禁用 3D 渲染 */}
      <div style={{ 
        width: '160px', 
        height: '160px', 
        backgroundColor: '#F4E4BC', 
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#4B4036',
        border: '5px solid #EADBC8',
        boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
        background: 'linear-gradient(135deg, #F4E4BC 0%, #EBC9A4 30%, #FFD59A 70%, #FFB6C1 100%)',
        position: 'relative',
        animation: currentAnimation === 'wave' ? 'wave 1s ease-in-out' : 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '25px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '25px',
          height: '25px',
          backgroundColor: '#000',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '25px',
          right: '35px',
          width: '25px',
          height: '25px',
          backgroundColor: '#000',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '35px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '35px',
          height: '18px',
          backgroundColor: '#FFB6C1',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '30px',
          width: '15px',
          height: '15px',
          backgroundColor: '#F4E4BC',
          borderRadius: '50%',
          transform: 'rotate(-30deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '15px',
          right: '30px',
          width: '15px',
          height: '15px',
          backgroundColor: '#F4E4BC',
          borderRadius: '50%',
          transform: 'rotate(30deg)'
        }}></div>
        LuLu Optimized
      </div>
    </div>
  );
}

// 導出動畫控制函數
export const LuLuOptimizedAnimations = {
  wave: () => {},
  shake: () => {},
  jump: () => {}
};
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

interface LuLuCharacterProps {
  position?: [number, number, number];
  scale?: number;
  onAnimationComplete?: () => void;
}

export function LuLuCharacter({ 
  position = [0, 0, 0], 
  scale = 1,
  onAnimationComplete 
}: LuLuCharacterProps) {
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
        width: '180px', 
        height: '180px', 
        backgroundColor: '#F4E4BC', 
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#4B4036',
        border: '6px solid #EADBC8',
        boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
        background: 'linear-gradient(135deg, #F4E4BC 0%, #EBC9A4 25%, #FFD59A 50%, #FFB6C1 75%, #E0F2E0 100%)',
        position: 'relative',
        animation: currentAnimation === 'wave' ? 'wave 1s ease-in-out' : 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30px',
          height: '30px',
          backgroundColor: '#000',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '30px',
          right: '40px',
          width: '30px',
          height: '30px',
          backgroundColor: '#000',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40px',
          height: '20px',
          backgroundColor: '#FFB6C1',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '35px',
          width: '18px',
          height: '18px',
          backgroundColor: '#F4E4BC',
          borderRadius: '50%',
          transform: 'rotate(-30deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '35px',
          width: '18px',
          height: '18px',
          backgroundColor: '#F4E4BC',
          borderRadius: '50%',
          transform: 'rotate(30deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '20px',
          width: '25px',
          height: '25px',
          backgroundColor: '#F4E4BC',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '20px',
          width: '25px',
          height: '25px',
          backgroundColor: '#F4E4BC',
          borderRadius: '50%'
        }}></div>
        LuLu Character
      </div>
    </div>
  );
}

// 導出動畫控制函數
export const LuLuCharacterAnimations = {
  wave: () => {},
  shake: () => {},
  jump: () => {}
};
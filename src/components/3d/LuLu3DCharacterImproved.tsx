'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

interface LuLu3DCharacterImprovedProps {
  position?: [number, number, number];
  scale?: number;
  onAnimationComplete?: () => void;
}

export function LuLu3DCharacterImproved({ 
  position = [0, 0, 0], 
  scale = 1,
  onAnimationComplete 
}: LuLu3DCharacterImprovedProps) {
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
        width: '140px', 
        height: '140px', 
        backgroundColor: '#F4E4BC', 
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#4B4036',
        border: '4px solid #EADBC8',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        background: 'linear-gradient(135deg, #F4E4BC 0%, #EBC9A4 50%, #FFD59A 100%)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20px',
          height: '20px',
          backgroundColor: '#000',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '30px',
          width: '20px',
          height: '20px',
          backgroundColor: '#000',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30px',
          height: '15px',
          backgroundColor: '#FFB6C1',
          borderRadius: '50%'
        }}></div>
        LuLu Improved
      </div>
    </div>
  );
}

// 導出動畫控制函數
export const LuLuImprovedAnimations = {
  wave: () => {},
  shake: () => {},
  jump: () => {}
};
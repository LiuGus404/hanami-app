'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

interface LuLu3DCharacterHybridProps {
  position?: [number, number, number];
  scale?: number;
  onAnimationComplete?: () => void;
}

export function LuLu3DCharacterHybrid({ 
  position = [0, 0, 0], 
  scale = 1,
  onAnimationComplete 
}: LuLu3DCharacterHybridProps) {
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
        width: '120px', 
        height: '120px', 
        backgroundColor: '#F4E4BC', 
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#4B4036',
        border: '3px solid #EADBC8',
        boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
        background: 'linear-gradient(135deg, #F4E4BC 0%, #EBC9A4 100%)'
      }}>
        LuLu Hybrid
      </div>
    </div>
  );
}

// 導出動畫控制函數
export const LuLuHybridAnimations = {
  wave: () => {},
  shake: () => {},
  jump: () => {}
};
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LuLuCharacterPerfectBlinkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  enableInteractions?: boolean;
}

export default function LuLuCharacterPerfectBlink({ 
  size = 'xxl', 
  className = '',
  enableInteractions = true
}: LuLuCharacterPerfectBlinkProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
    xxl: 'w-80 h-80'
  };

  // 自動眨眼效果
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 200);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: 'transparent'
      }}
    >
      {/* 使用 CSS 背景圖片，完全避免白色閃爍 */}
      <div 
        className="relative w-full h-full"
        style={{
          backgroundImage: isBlinking 
            ? 'url("/3d-character-backgrounds/studio/lulu(close).png")'
            : 'url("/3d-character-backgrounds/studio/lulu(front).png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundColor: 'transparent',
          transition: 'background-image 0.1s ease-in-out, transform 0.1s ease-in-out',
          transform: isBlinking ? 'scale(0.98)' : 'scale(1)'
        }}
      />
      
      {/* 預載入圖片到瀏覽器快取 */}
      <div style={{ 
        position: 'absolute', 
        top: '-9999px', 
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none'
      }}>
        <img 
          src="/3d-character-backgrounds/studio/lulu(front).png" 
          alt="預載入開眼"
          style={{ width: '1px', height: '1px' }}
        />
        <img 
          src="/3d-character-backgrounds/studio/lulu(close).png" 
          alt="預載入閉眼"
          style={{ width: '1px', height: '1px' }}
        />
      </div>
    </motion.div>
  );
}


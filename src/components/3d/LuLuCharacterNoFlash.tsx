'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LuLuCharacterNoFlashProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  enableInteractions?: boolean;
}

export default function LuLuCharacterNoFlash({ 
  size = 'xxl', 
  className = '',
  enableInteractions = true
}: LuLuCharacterNoFlashProps) {
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
        backgroundColor: 'transparent',
        overflow: 'hidden'
      }}
    >
      {/* 使用單一容器，通過 CSS 背景圖片切換 */}
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
          transition: 'background-image 0.1s ease-in-out'
        }}
      >
        {/* 預載入隱藏圖片確保圖片已載入 */}
        <div style={{ position: 'absolute', visibility: 'hidden', width: '1px', height: '1px' }}>
          <Image
            src="/3d-character-backgrounds/studio/lulu(front).png"
            alt="LuLu 開眼"
            width={1}
            height={1}
            priority
          />
          <Image
            src="/3d-character-backgrounds/studio/lulu(close).png"
            alt="LuLu 閉眼"
            width={1}
            height={1}
            priority
          />
        </div>
      </div>
    </motion.div>
  );
}


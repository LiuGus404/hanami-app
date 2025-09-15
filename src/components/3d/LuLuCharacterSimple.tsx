'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LuLuCharacterSimpleProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  enableInteractions?: boolean;
}

export default function LuLuCharacterSimple({ 
  size = 'xxl', 
  className = '',
  enableInteractions = true
}: LuLuCharacterSimpleProps) {
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
    >
      {/* 預載入兩張圖片 */}
      <div className="hidden">
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
      
      {/* 主顯示區域 */}
      <div className="relative w-full h-full">
        <motion.div
          key={isBlinking ? 'closed' : 'open'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.05 }}
          className="absolute inset-0"
        >
          <Image
            src={isBlinking ? "/3d-character-backgrounds/studio/lulu(close).png" : "/3d-character-backgrounds/studio/lulu(front).png"}
            alt={isBlinking ? "LuLu 閉眼" : "LuLu 開眼"}
            fill
            className="object-contain"
            priority
            style={{
              backgroundColor: 'transparent'
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
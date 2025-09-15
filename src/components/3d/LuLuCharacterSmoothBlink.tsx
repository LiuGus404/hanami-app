'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LuLuCharacterSmoothBlinkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  enableInteractions?: boolean;
}

export default function LuLuCharacterSmoothBlink({ 
  size = 'xxl', 
  className = '',
  enableInteractions = true
}: LuLuCharacterSmoothBlinkProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
    xxl: 'w-80 h-80'
  };

  // 預載入圖片
  useEffect(() => {
    const preloadImages = async () => {
      try {
        // 使用 fetch 來預載入圖片
        const [response1, response2] = await Promise.all([
          fetch("/3d-character-backgrounds/studio/lulu(front).png"),
          fetch("/3d-character-backgrounds/studio/lulu(close).png")
        ]);
        
        if (response1.ok && response2.ok) {
          setImagesLoaded(true);
        }
      } catch (error) {
        console.warn('圖片預載入失敗，但會繼續顯示:', error);
        // 即使預載入失敗，也設置為已載入，讓組件正常顯示
        setImagesLoaded(true);
      }
    };
    
    preloadImages();
  }, []);

  // 自動眨眼效果
  useEffect(() => {
    if (!imagesLoaded) return;
    
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 200);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, [imagesLoaded]);

  // 如果圖片還沒載入完成，顯示載入狀態
  if (!imagesLoaded) {
    return (
      <div className={`relative ${sizeClasses[size]} ${className} flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-[#FFD59A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative ${sizeClasses[size]} ${className}`}
    >
      {/* 雙緩衝技術：同時顯示兩張圖片，通過透明度控制 */}
      <div className="relative w-full h-full">
        {/* 開眼圖片 */}
        <motion.div
          className="absolute inset-0"
          animate={{ 
            opacity: isBlinking ? 0 : 1,
            scale: isBlinking ? 0.98 : 1
          }}
          transition={{ 
            duration: 0.1,
            ease: "easeInOut"
          }}
        >
          <Image
            src="/3d-character-backgrounds/studio/lulu(front).png"
            alt="LuLu 開眼"
            fill
            className="object-contain"
            priority
            style={{
              backgroundColor: 'transparent'
            }}
          />
        </motion.div>
        
        {/* 閉眼圖片 */}
        <motion.div
          className="absolute inset-0"
          animate={{ 
            opacity: isBlinking ? 1 : 0,
            scale: isBlinking ? 1 : 0.98
          }}
          transition={{ 
            duration: 0.1,
            ease: "easeInOut"
          }}
        >
          <Image
            src="/3d-character-backgrounds/studio/lulu(close).png"
            alt="LuLu 閉眼"
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

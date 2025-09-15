'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { SpeechBubble } from '@/components/ui/SpeechBubble';

interface LuLuCharacterWithBubbleProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  enableInteractions?: boolean;
}

export default function LuLuCharacterWithBubble({ 
  size = 'xxl', 
  className = '',
  enableInteractions = true
}: LuLuCharacterWithBubbleProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

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

  // 點擊處理
  const handleClick = () => {
    if (!enableInteractions) return;
    
    setIsClicked(true);
    setShowBubble(true);
    
    // 重置點擊狀態
    setTimeout(() => {
      setIsClicked(false);
    }, 300);
  };

  // 關閉氣泡
  const handleCloseBubble = () => {
    setShowBubble(false);
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* 對話氣泡 */}
      <SpeechBubble
        isVisible={showBubble}
        message="你好，有什麼可以幫到你？"
        onClose={handleCloseBubble}
        position="top"
      />
      
      {/* LuLu 角色 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full h-full cursor-pointer"
        onClick={handleClick}
        style={{
          backgroundColor: 'transparent'
        }}
        whileHover={enableInteractions ? { scale: 1.05 } : {}}
        whileTap={enableInteractions ? { scale: 0.95 } : {}}
      >
        {/* 使用 CSS 背景圖片，完全避免白色閃爍 */}
        <motion.div 
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
          animate={{
            scale: isClicked ? [1, 1.1, 1] : 1,
            rotate: isClicked ? [0, 5, -5, 0] : 0
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
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

        {/* 點擊提示動畫 */}
        {enableInteractions && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-[#FFD59A] border-dashed" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}


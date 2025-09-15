'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface LuLuCharacterLightweightProps {
  className?: string;
  onAnimationComplete?: () => void;
}

export function LuLuCharacterLightweight({ 
  className = '',
  onAnimationComplete 
}: LuLuCharacterLightweightProps) {
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'wave' | 'shake' | 'jump'>('idle');
  const [isAnimating, setIsAnimating] = useState(false);

  // 動畫變體
  const animationVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      y: 0,
      transition: { duration: 0.3 }
    },
    wave: {
      scale: [1, 1.1, 1],
      rotate: [0, -10, 10, -5, 0],
      y: [0, -5, 0],
      transition: { 
        duration: 1.5, 
        ease: "easeInOut" as const,
        times: [0, 0.2, 0.4, 0.6, 1]
      }
    },
    shake: {
      x: [-5, 5, -3, 3, -2, 2, 0],
      rotate: [-8, 8, -6, 6, -4, 4, 0],
      transition: { 
        duration: 1, 
        ease: "easeInOut" as const,
        times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1]
      }
    },
    jump: {
      y: [0, -40, 0],
      scale: [1, 1.2, 1],
      rotate: [0, 5, -5, 0],
      transition: { 
        duration: 0.8, 
        ease: "easeOut" as const,
        times: [0, 0.5, 1]
      }
    }
  };

  // 手部揮手動畫
  const handWaveVariants = {
    idle: {
      rotate: 0,
      transition: { duration: 0.3 }
    },
    wave: {
      rotate: [0, 20, -10, 15, 0],
      transition: { 
        duration: 1.5, 
        ease: "easeInOut" as const,
        times: [0, 0.2, 0.4, 0.6, 1]
      }
    }
  };

  // 眼睛眨眼動畫
  const eyeBlinkVariants = {
    idle: {
      scaleY: 1,
      transition: { duration: 0.1 }
    },
    blink: {
      scaleY: [1, 0.1, 1],
      transition: { duration: 0.3, ease: "easeInOut" as const }
    }
  };

  // 開始動畫
  const startAnimation = (animationType: 'wave' | 'shake' | 'jump') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentAnimation(animationType);
    
    // 動畫完成後重置
    setTimeout(() => {
      setCurrentAnimation('idle');
      setIsAnimating(false);
      onAnimationComplete?.();
    }, animationType === 'jump' ? 800 : 1500);
  };

  // 隨機眨眼
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (currentAnimation === 'idle') {
        // 觸發眨眼動畫
        const eyeElements = document.querySelectorAll('.lulu-eye');
        eyeElements.forEach(eye => {
          (eye as HTMLElement).style.transform = 'scaleY(0.1)';
          setTimeout(() => {
            (eye as HTMLElement).style.transform = 'scaleY(1)';
          }, 150);
        });
      }
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [currentAnimation]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      {/* LuLu 角色容器 */}
      <motion.div
        className="relative"
        variants={animationVariants}
        animate={currentAnimation}
        style={{ transformOrigin: 'center center' }}
      >
        {/* LuLu 主體 */}
        <div className="relative">
          {/* 使用 LuLu 圖片作為基礎 */}
          <div className="relative w-64 h-64">
            <Image
              src="/lulu.png"
              alt="LuLu Character"
              fill
              className="object-contain"
              priority
            />
            
            {/* 手部揮手動畫層 */}
            <motion.div
              className="absolute top-1/2 right-4 w-8 h-8"
              variants={handWaveVariants}
              animate={currentAnimation === 'wave' ? 'wave' : 'idle'}
              style={{ transformOrigin: 'bottom center' }}
            >
              {/* 這裡可以添加手部的覆蓋層 */}
            </motion.div>
            
            {/* 眼睛動畫層 */}
            <motion.div
              className="absolute top-1/3 left-1/2 w-4 h-4 -translate-x-1/2 lulu-eye"
              variants={eyeBlinkVariants}
              style={{ transformOrigin: 'center center' }}
            >
              {/* 左眼 */}
            </motion.div>
            <motion.div
              className="absolute top-1/3 left-1/2 w-4 h-4 translate-x-1/2 lulu-eye"
              variants={eyeBlinkVariants}
              style={{ transformOrigin: 'center center' }}
            >
              {/* 右眼 */}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// 導出動畫控制函數
export const LuLuAnimations = {
  wave: 'wave',
  shake: 'shake',
  jump: 'jump'
};


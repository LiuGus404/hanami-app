'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface LuLuCharacterEnhancedProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  enableInteractions?: boolean;
}

export default function LuLuCharacterEnhanced({ 
  size = 'lg', 
  className = '',
  enableInteractions = true 
}: LuLuCharacterEnhancedProps) {
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  const [isBlinking, setIsBlinking] = useState(false);
  const [isSmiling, setIsSmiling] = useState(false);
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  // 隨機眨眼動畫
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 3000 + 2000); // 2-5秒隨機間隔

    return () => clearInterval(blinkInterval);
  }, []);

  // 隨機微笑動畫
  useEffect(() => {
    const smileInterval = setInterval(() => {
      setIsSmiling(true);
      setTimeout(() => setIsSmiling(false), 2000);
    }, Math.random() * 8000 + 5000); // 5-13秒隨機間隔

    return () => clearInterval(smileInterval);
  }, []);

  // 主要動畫變體
  const animationVariants = {
    idle: {
      y: 0,
      rotate: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const
      }
    },
    wave: {
      y: [-5, -10, -5, 0],
      rotate: [0, 5, -5, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.8,
        ease: "easeInOut" as const,
        times: [0, 0.3, 0.7, 1]
      }
    },
    shakeHead: {
      rotate: [0, 15, -15, 10, -10, 0],
      transition: {
        duration: 0.6,
        ease: "easeInOut" as const
      }
    },
    jump: {
      y: [0, -20, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    },
    bounce: {
      y: [0, -8, 0],
      transition: {
        duration: 0.4,
        ease: "easeInOut" as const,
        repeat: 2
      }
    }
  };

  // 眨眼動畫變體
  const blinkVariants = {
    open: {
      scaleY: 1,
      opacity: 0,
      transition: { duration: 0.15, ease: "easeInOut" as const }
    },
    closed: {
      scaleY: 0.1,
      opacity: 0.9,
      transition: { duration: 0.15, ease: "easeInOut" as const }
    }
  };

  // 微笑動畫變體
  const smileVariants = {
    normal: {
      scaleY: 1,
      y: 0,
      transition: { duration: 0.3 }
    },
    smile: {
      scaleY: 1.2,
      y: -2,
      transition: { duration: 0.3 }
    }
  };

  // 處理點擊互動
  const handleClick = () => {
    if (!enableInteractions) return;
    
    const animations = ['wave', 'shakeHead', 'jump', 'bounce'];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    
    setCurrentAnimation(randomAnimation);
    controls.start(randomAnimation);
    
    // 動畫完成後回到待機狀態
    setTimeout(() => {
      setCurrentAnimation('idle');
      controls.start('idle');
    }, 1000);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative ${sizeClasses[size]} ${className} cursor-pointer`}
      onClick={handleClick}
      whileHover={enableInteractions ? { scale: 1.05 } : {}}
      whileTap={enableInteractions ? { scale: 0.95 } : {}}
    >
      {/* 主體容器 */}
      <motion.div
        animate={controls}
        variants={animationVariants}
        className="relative w-full h-full"
      >
        {/* LuLu 主體圖片 */}
        <div className="relative w-full h-full">
          <Image
            src="/lulu.png"
            alt="LuLu 角色"
            fill
            className="object-contain"
            priority
          />
          
          {/* 眨眼效果覆蓋層 - 左眼 */}
          <motion.div
            className="absolute"
            variants={blinkVariants}
            animate={isBlinking ? "closed" : "open"}
            style={{ 
              top: '35%',
              left: '30%',
              width: '15%',
              height: '8%',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              transformOrigin: 'center'
            }}
          />
          
          {/* 眨眼效果覆蓋層 - 右眼 */}
          <motion.div
            className="absolute"
            variants={blinkVariants}
            animate={isBlinking ? "closed" : "open"}
            style={{ 
              top: '35%',
              right: '30%',
              width: '15%',
              height: '8%',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              transformOrigin: 'center'
            }}
          />
          
          {/* 微笑效果覆蓋層 */}
          <motion.div
            className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-gradient-to-r from-pink-200 to-pink-300 rounded-full opacity-0"
            variants={smileVariants}
            animate={isSmiling ? "smile" : "normal"}
            style={{
              clipPath: 'ellipse(50% 30% at 50% 100%)'
            }}
          />
        </div>

        {/* 互動提示 */}
        {enableInteractions && (
          <motion.div
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#FFD59A] text-[#4B4036] px-2 py-1 rounded-full text-xs font-medium shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            🎯 點擊我！
          </motion.div>
        )}

        {/* 狀態指示器 */}
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg">
          <motion.div
            className="w-full h-full bg-green-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* 背景光暈效果 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#FFD59A]/20 to-[#EBC9A4]/20 rounded-full blur-xl -z-10"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}

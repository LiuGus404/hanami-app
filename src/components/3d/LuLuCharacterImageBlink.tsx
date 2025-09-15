'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface LuLuCharacterImageBlinkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  enableInteractions?: boolean;
  showGrid?: boolean;
  showAnimationControls?: boolean;
  eyePosition?: {
    top: number;
    left: number;
    right: number;
    width: number;
    height: number;
  };
  mouthPosition?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export default function LuLuCharacterImageBlink({ 
  size = 'xxl', 
  className = '',
  enableInteractions = true,
  showGrid = true,
  showAnimationControls = false,
  eyePosition = {
    top: 32,
    left: 30,
    right: 32,
    width: 25,
    height: 8
  },
  mouthPosition = {
    top: 75,
    left: 50,
    width: 20,
    height: 8
  }
}: LuLuCharacterImageBlinkProps) {
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
    xl: 'w-40 h-40',
    xxl: 'w-80 h-80'
  };

  // 隨機眨眼動畫
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      console.log('自動眨眼觸發');
      setIsBlinking(true);
      setTimeout(() => {
        console.log('眨眼結束');
        setIsBlinking(false);
      }, 200);
    }, Math.random() * 3000 + 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // 隨機微笑動畫
  useEffect(() => {
    const smileInterval = setInterval(() => {
      setIsSmiling(true);
      setTimeout(() => setIsSmiling(false), 2000);
    }, Math.random() * 8000 + 5000);

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
    
    setTimeout(() => {
      setCurrentAnimation('idle');
      controls.start('idle');
    }, 1000);
  };

  // 手動觸發動畫
  const triggerAnimation = (animationType: string) => {
    setCurrentAnimation(animationType);
    controls.start(animationType);
    
    setTimeout(() => {
      setCurrentAnimation('idle');
      controls.start('idle');
    }, 1000);
  };

  // 手動觸發眨眼
  const triggerBlink = () => {
    console.log('手動觸發眨眼');
    setIsBlinking(true);
    setTimeout(() => {
      console.log('手動眨眼結束');
      setIsBlinking(false);
    }, 200);
  };

  // 手動觸發微笑
  const triggerSmile = () => {
    setIsSmiling(true);
    setTimeout(() => setIsSmiling(false), 2000);
  };

  // 生成網格線
  const generateGridLines = () => {
    if (!showGrid) return null;
    
    const lines = [];
    const gridSize = 10;
    
    // 垂直線
    for (let i = 0; i <= 100; i += gridSize) {
      lines.push(
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px bg-red-500 opacity-30"
          style={{ left: `${i}%` }}
        />
      );
    }
    
    // 水平線
    for (let i = 0; i <= 100; i += gridSize) {
      lines.push(
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px bg-red-500 opacity-30"
          style={{ top: `${i}%` }}
        />
      );
    }
    
    return lines;
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
        {/* LuLu 主體圖片 - 根據眨眼狀態切換 */}
        <div className="relative w-full h-full">
          <motion.div
            key={isBlinking ? 'closed' : 'open'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0"
          >
            <Image
              src={isBlinking ? "/lulu(close).png" : "/lulu(front).png"}
              alt={isBlinking ? "LuLu 閉眼" : "LuLu 開眼"}
              fill
              className="object-contain"
              priority
            />
          </motion.div>
          
          {/* 網格線 */}
          {generateGridLines()}
          
          {/* 坐標標記 */}
          {showGrid && (
            <>
              {/* 眼睛位置標記 */}
              <div
                className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white z-20 shadow-lg"
                style={{ 
                  top: `${eyePosition.top + eyePosition.height/2}%`,
                  left: `${eyePosition.left + eyePosition.width/2}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                title={`左眼中心: ${eyePosition.left + eyePosition.width/2}%, ${eyePosition.top + eyePosition.height/2}%`}
              />
              <div
                className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white z-20 shadow-lg"
                style={{ 
                  top: `${eyePosition.top + eyePosition.height/2}%`,
                  right: `${eyePosition.right + eyePosition.width/2}%`,
                  transform: 'translate(50%, -50%)'
                }}
                title={`右眼中心: ${eyePosition.right + eyePosition.width/2}%, ${eyePosition.top + eyePosition.height/2}%`}
              />
              
              {/* 眼睛範圍框 */}
              <div
                className="absolute border-2 border-blue-400 border-dashed z-15"
                style={{ 
                  top: `${eyePosition.top}%`,
                  left: `${eyePosition.left}%`,
                  width: `${eyePosition.width}%`,
                  height: `${eyePosition.height}%`
                }}
                title="左眼範圍"
              />
              <div
                className="absolute border-2 border-blue-400 border-dashed z-15"
                style={{ 
                  top: `${eyePosition.top}%`,
                  right: `${eyePosition.right}%`,
                  width: `${eyePosition.width}%`,
                  height: `${eyePosition.height}%`
                }}
                title="右眼範圍"
              />
              
              {/* 嘴巴位置標記 */}
              <div
                className="absolute w-3 h-3 bg-green-500 rounded-full border-2 border-white z-20 shadow-lg"
                style={{ 
                  top: `${mouthPosition.top + mouthPosition.height/2}%`,
                  left: `${mouthPosition.left + mouthPosition.width/2}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                title={`嘴巴中心: ${mouthPosition.left + mouthPosition.width/2}%, ${mouthPosition.top + mouthPosition.height/2}%`}
              />
              
              {/* 嘴巴範圍框 */}
              <div
                className="absolute border-2 border-green-400 border-dashed z-15"
                style={{ 
                  top: `${mouthPosition.top}%`,
                  left: `${mouthPosition.left}%`,
                  width: `${mouthPosition.width}%`,
                  height: `${mouthPosition.height}%`
                }}
                title="嘴巴範圍"
              />
            </>
          )}
          
          {/* 微笑效果覆蓋層 */}
          <motion.div
            className="absolute pointer-events-none"
            variants={smileVariants}
            animate={isSmiling ? "smile" : "normal"}
            style={{ 
              top: `${mouthPosition.top}%`,
              left: `${mouthPosition.left}%`,
              width: `${mouthPosition.width}%`,
              height: `${mouthPosition.height}%`,
              background: 'linear-gradient(to right, rgba(255,182,193,0.8), rgba(255,192,203,0.8))',
              borderRadius: '50%',
              transformOrigin: 'center',
              zIndex: 15,
              mixBlendMode: 'multiply'
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

        {/* 動畫控制按鈕 */}
        {showAnimationControls && (
          <motion.div
            className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <button
              onClick={() => triggerAnimation('wave')}
              className="px-3 py-1 bg-[#FFD59A] text-[#4B4036] rounded-full text-xs font-medium shadow-lg hover:bg-[#EBC9A4] transition-colors"
              title="揮手"
            >
              👋 揮手
            </button>
            <button
              onClick={() => triggerAnimation('shakeHead')}
              className="px-3 py-1 bg-[#FFD59A] text-[#4B4036] rounded-full text-xs font-medium shadow-lg hover:bg-[#EBC9A4] transition-colors"
              title="搖頭"
            >
              🤔 搖頭
            </button>
            <button
              onClick={() => triggerAnimation('jump')}
              className="px-3 py-1 bg-[#FFD59A] text-[#4B4036] rounded-full text-xs font-medium shadow-lg hover:bg-[#EBC9A4] transition-colors"
              title="跳躍"
            >
              🦘 跳躍
            </button>
            <button
              onClick={triggerBlink}
              className="px-3 py-1 bg-[#FFD59A] text-[#4B4036] rounded-full text-xs font-medium shadow-lg hover:bg-[#EBC9A4] transition-colors"
              title="眨眼"
            >
              👁️ 眨眼
            </button>
            <button
              onClick={triggerSmile}
              className="px-3 py-1 bg-[#FFD59A] text-[#4B4036] rounded-full text-xs font-medium shadow-lg hover:bg-[#EBC9A4] transition-colors"
              title="微笑"
            >
              😊 微笑
            </button>
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


'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// LuLu 2D 動畫角色組件
export default function LuLuCharacter2D() {
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'wave' | 'shake' | 'jump'>('idle');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationCount, setAnimationCount] = useState(0);
  
  // 動畫變體定義
  const animationVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      x: 0,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const
      }
    },
    wave: {
      x: [0, -10, 10, -5, 0],
      rotate: [0, -15, 15, -10, 0],
      scale: [1, 1.1, 1],
      y: 0,
      transition: {
        duration: 1.5,
        ease: "easeInOut" as const
      }
    },
    shake: {
      x: [-5, 5, -3, 3, -2, 2, 0],
      rotate: [-10, 10, -8, 8, -5, 5, 0],
      scale: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: "easeInOut" as const
      }
    },
    jump: {
      y: [0, -30, 0],
      scale: [1, 1.2, 1],
      rotate: [0, 5, -5, 0],
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const
      }
    }
  };
  
  // 手部揮動動畫
  const handWaveVariants = {
    idle: {
      rotate: 0,
      scale: 1,
      transition: { duration: 0.3 }
    },
    wave: {
      rotate: [0, 20, -10, 15, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        ease: "easeInOut" as const
      }
    }
  };
  
  // 眼睛眨動動畫
  const eyeBlinkVariants = {
    open: {
      scaleY: 1,
      scaleX: 1,
      transition: { duration: 0.1 }
    },
    closed: {
      scaleY: 0.1,
      scaleX: 1,
      transition: { duration: 0.1 }
    }
  };
  
  // 動畫控制函數
  const startAnimation = (animationType: 'wave' | 'shake' | 'jump') => {
    console.log('開始動畫:', animationType, '當前狀態:', isAnimating);
    
    if (isAnimating) {
      console.log('動畫正在進行中，跳過');
      return;
    }
    
    setIsAnimating(true);
    setCurrentAnimation(animationType);
    setAnimationCount(prev => prev + 1);
    
    const duration = animationType === 'jump' ? 800 : animationType === 'shake' ? 1000 : 1500;
    
    console.log('動畫持續時間:', duration);
    
    setTimeout(() => {
      console.log('動畫結束，回到待機狀態');
      setCurrentAnimation('idle');
      setIsAnimating(false);
    }, duration);
  };
  
  // 隨機動畫
  useEffect(() => {
    const randomAnimation = () => {
      if (isAnimating) return;
      
      const animations = ['wave', 'shake', 'jump'] as const;
      const randomAnim = animations[Math.floor(Math.random() * animations.length)];
      startAnimation(randomAnim);
    };
    
    // 每 8-15 秒隨機播放動畫
    const interval = setInterval(randomAnimation, 8000 + Math.random() * 7000);
    
    return () => clearInterval(interval);
  }, [isAnimating]);
  
  // 眼睛眨動效果
  const [isBlinking, setIsBlinking] = useState(false);
  
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    
    // 每 3-6 秒眨一次眼
    const blinkInterval = setInterval(blink, 3000 + Math.random() * 3000);
    
    return () => clearInterval(blinkInterval);
  }, []);
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* LuLu 角色容器 */}
      <motion.div
        className="relative"
        animate={
          currentAnimation === 'wave' ? {
            x: [0, -10, 10, -5, 0],
            rotate: [0, -15, 15, -10, 0],
            scale: [1, 1.1, 1],
            transition: { duration: 1.5, ease: "easeInOut" }
          } : currentAnimation === 'shake' ? {
            x: [-5, 5, -3, 3, -2, 2, 0],
            rotate: [-10, 10, -8, 8, -5, 5, 0],
            transition: { duration: 1, ease: "easeInOut" }
          } : currentAnimation === 'jump' ? {
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
            transition: { duration: 0.8, ease: "easeOut" }
          } : {
            scale: 1,
            rotate: 0,
            x: 0,
            y: 0,
            transition: { duration: 0.3 }
          }
        }
        key={animationCount}
        style={{ transformOrigin: 'center center' }}
      >
        {/* LuLu 主體 */}
        <div className="relative">
          {/* 使用 LuLu 圖片作為基礎 */}
          <div className="relative w-64 h-64">
            <Image
              src="/lulu.png"
              alt="LuLu 狐狸角色"
              fill
              className="object-contain"
              priority
            />
            
            {/* 動畫覆蓋層 - 手部揮動 */}
            {currentAnimation === 'wave' && (
              <motion.div
                className="absolute top-1/4 right-1/4 w-8 h-8 bg-orange-400 rounded-full opacity-80"
                variants={handWaveVariants}
                animate="wave"
                initial="idle"
                style={{
                  background: 'radial-gradient(circle, #FF8C42 0%, #FF6B1A 100%)'
                }}
              />
            )}
            
            {/* 眼睛動畫覆蓋層 */}
            <motion.div
              className="absolute top-1/3 left-1/4 w-3 h-3 bg-black rounded-full"
              variants={eyeBlinkVariants}
              animate={isBlinking ? "closed" : "open"}
              initial="open"
            />
            <motion.div
              className="absolute top-1/3 right-1/4 w-3 h-3 bg-black rounded-full"
              variants={eyeBlinkVariants}
              animate={isBlinking ? "closed" : "open"}
              initial="open"
            />
            
            {/* 跳躍時的陰影效果 */}
            {currentAnimation === 'jump' && (
              <motion.div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black/20 rounded-full"
                animate={{
                  scaleX: [1, 0.8, 1],
                  opacity: [0.2, 0.1, 0.2]
                }}
                transition={{ duration: 0.8 }}
                initial={{ scaleX: 1, opacity: 0.2 }}
              />
            )}
          </div>
        </div>
        
        {/* 對話氣泡 */}
        <AnimatePresence>
          {currentAnimation !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl px-4 py-2 shadow-lg border-2 border-orange-200"
            >
              <div className="text-sm font-medium text-gray-800">
                {currentAnimation === 'wave' && '👋 你好！我是 LuLu！'}
                {currentAnimation === 'shake' && '🤔 讓我想想...'}
                {currentAnimation === 'jump' && '🦘 太棒了！'}
              </div>
              {/* 氣泡尾巴 */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* 動畫控制按鈕 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => startAnimation('wave')}
          disabled={isAnimating}
          className="px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-shadow"
        >
          👋 揮手
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => startAnimation('shake')}
          disabled={isAnimating}
          className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-shadow"
        >
          🤔 搖頭
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => startAnimation('jump')}
          disabled={isAnimating}
          className="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-shadow"
        >
          🦘 跳起
        </motion.button>
      </div>
      
      {/* 動畫狀態指示器 */}
      <div className="absolute top-8 right-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-orange-200"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              currentAnimation === 'idle' ? 'bg-gray-400' :
              currentAnimation === 'wave' ? 'bg-orange-400' :
              currentAnimation === 'shake' ? 'bg-blue-400' :
              'bg-green-400'
            }`}></div>
            <span className="text-sm font-medium text-gray-700">
              LuLu: {
                currentAnimation === 'idle' ? '待機中' :
                currentAnimation === 'wave' ? '揮手中' :
                currentAnimation === 'shake' ? '搖頭中' :
                '跳躍中'
              }
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            動畫狀態: {isAnimating ? '進行中' : '空閒'} | 計數: {animationCount}
          </div>
        </motion.div>
      </div>
      
      {/* 背景裝飾 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 浮動的櫻花花瓣 */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-pink-300 rounded-full opacity-60"
            animate={{
              y: [0, -20, 0],
              x: [0, Math.sin(i) * 10, 0],
              opacity: [0.6, 0.2, 0.6],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

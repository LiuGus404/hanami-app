'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Student3DCharacterProps {
  student: {
    id: string;
    full_name: string;
    nick_name?: string | null;
    gender?: string | null;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  enableAnimation?: boolean;
  enableControls?: boolean;
}

// 動畫狀態類型
type AnimationState = 'idle' | 'walking' | 'jumping' | 'waving' | 'dancing';

// 3D角色組件
export default function Student3DCharacter({ 
  student, 
  className = '', 
  size = 'md',
  enableAnimation = true,
  enableControls = true
}: Student3DCharacterProps) {
  // 狀態管理
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [isPlaying, setIsPlaying] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isWalking, setIsWalking] = useState(false);

  // 尺寸配置
  const sizeConfig = {
    sm: { 
      character: 'w-16 h-20', 
      container: 'w-24 h-32',
      speed: 0.5
    },
    md: { 
      character: 'w-24 h-30', 
      container: 'w-32 h-40',
      speed: 0.8
    },
    lg: { 
      character: 'w-32 h-40', 
      container: 'w-40 h-48',
      speed: 1.2
    }
  };

  // 根據性別選擇角色圖片
  const getCharacterImage = () => {
    const isMale = student.gender?.toLowerCase() === 'male' || student.gender === '男';
    return isMale ? '/boy(front).png' : '/girl(front).png';
  };

  // 動畫變體
  const characterVariants: any = {
    idle: {
      scale: [1, 1.02, 1],
      y: [0, -2, 0],
      rotate: [0, 1, -1, 0],
      transition: { 
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    walking: {
      x: [0, 20, 0, -20, 0],
      y: [0, -3, 0, -3, 0],
      rotate: [0, 2, 0, -2, 0],
      transition: { 
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    jumping: {
      y: [0, -20, 0],
      scale: [1, 1.1, 1],
      rotate: [0, 10, -10, 0],
      transition: { 
        duration: 0.8,
        repeat: 2,
        ease: "easeOut"
      }
    },
    waving: {
      rotate: [0, 15, -15, 0],
      scale: [1, 1.05, 1],
      transition: { 
        duration: 0.6,
        repeat: 3,
        ease: "easeInOut"
      }
    },
    dancing: {
      rotate: [0, 10, -10, 0],
      scale: [1, 1.1, 1],
      y: [0, -5, 0],
      transition: { 
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // 行走動畫控制
  useEffect(() => {
    if (isWalking && isPlaying) {
      const interval = setInterval(() => {
        setPosition(prev => ({
          x: prev.x + (direction === 'right' ? 2 : -2),
          y: prev.y
        }));
      }, 100);

      return () => clearInterval(interval);
    }
    
    return () => {}; // 確保所有代碼路徑都有返回值
  }, [isWalking, isPlaying, direction]);

  // 邊界檢測
  useEffect(() => {
    if (position.x > 100) {
      setDirection('left');
    } else if (position.x < -100) {
      setDirection('right');
    }
  }, [position.x]);

  // 動畫控制函數
  const handleAnimationChange = (newState: AnimationState) => {
    setAnimationState(newState);
    if (newState === 'walking') {
      setIsWalking(true);
    } else {
      setIsWalking(false);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetPosition = () => {
    setPosition({ x: 0, y: 0 });
    setDirection('right');
    setAnimationState('idle');
    setIsWalking(false);
  };

  return (
    <div className={`relative ${sizeConfig[size].container} ${className}`}>
      {/* 3D角色容器 */}
      <div className="relative w-full h-full overflow-hidden">
        {/* 角色本體 */}
        <motion.div
          className={`${sizeConfig[size].character} absolute bottom-0 left-1/2 transform -translate-x-1/2 cursor-pointer`}
          style={{
            x: position.x,
            y: position.y,
            transformOrigin: 'center bottom'
          }}
          variants={characterVariants}
          initial="idle"
          animate={isPlaying ? animationState : "idle"}
          onClick={() => {
            const states: AnimationState[] = ['idle', 'walking', 'jumping', 'waving', 'dancing'];
            const currentIndex = states.indexOf(animationState);
            const nextIndex = (currentIndex + 1) % states.length;
            handleAnimationChange(states[nextIndex]);
          }}
        >
          {/* 角色圖片 */}
          <motion.img
            src={getCharacterImage()}
            alt={`${student.nick_name || student.full_name} 的3D角色`}
            className="w-full h-full object-contain drop-shadow-lg"
            style={{
              transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }}
          />
          
          {/* 行走時的塵土效果 */}
          <AnimatePresence>
            {isWalking && (
              <motion.div
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-gray-400 rounded-full blur-sm" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 互動光環 */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-yellow-300 opacity-0"
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* 地面陰影 */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-black/20 rounded-full blur-sm"
          style={{
            x: position.x * 0.3,
            scale: isWalking ? 1.2 : 1
          }}
          animate={isWalking ? {
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </div>

      {/* 控制面板 */}
      {enableControls && (
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {/* 播放/暫停按鈕 */}
          <motion.button
            onClick={togglePlayPause}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </motion.button>

          {/* 重置按鈕 */}
          <motion.button
            onClick={resetPosition}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <RotateCcw size={16} />
          </motion.button>
        </div>
      )}

      {/* 動畫狀態指示器 */}
      <div className="absolute bottom-2 left-2">
        <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 shadow-lg">
          {animationState === 'idle' && '待機中'}
          {animationState === 'walking' && '行走中'}
          {animationState === 'jumping' && '跳躍中'}
          {animationState === 'waving' && '揮手中'}
          {animationState === 'dancing' && '跳舞中'}
        </div>
      </div>

      {/* 學生姓名標籤 */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
        <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 shadow-lg">
          {student.nick_name || student.full_name}
        </div>
      </div>
    </div>
  );
}


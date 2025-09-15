'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Target, BookOpen, Award, Music, Volume2, VolumeX } from 'lucide-react';
import { useStudentAvatarData, useStudentInteractionLogger } from '@/hooks/useStudentAvatarData';

// 型別定義
interface Student {
  id: string;
  full_name: string;
  nick_name?: string | null;
  gender?: string | null;
  student_age?: number | null;
  course_type?: string | null;
  ongoing_lessons?: number | null;
  upcoming_lessons?: number | null;
}

interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string | null;
  tree_icon?: string | null;
  tree_level?: number | null;
  progress_percentage?: number;
}

interface StudentAbility {
  id: string;
  ability_name: string;
  current_level: number;
  progress_percentage: number;
  last_updated: string;
}

interface LearningActivity {
  id: string;
  activity_name: string;
  activity_type: string;
  difficulty_level?: number;
  completion_status?: 'completed' | 'in_progress' | 'upcoming';
}

interface StudentAvatarWidgetProps {
  student: Student;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  enableSound?: boolean;
  showBackground?: boolean;
  showAge?: boolean;
}

// 角色表情狀態
type EmotionState = 'happy' | 'excited' | 'thinking' | 'surprised' | 'focused';

// 音效控制Hook
const useAudioManager = (enableSound: boolean = true) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const playSound = (soundType: 'click' | 'achievement' | 'welcome') => {
    if (!enableSound || isMuted) return;
    
    // 創建音效（暫時使用Web Audio API生成）
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 根據音效類型設置頻率
    const frequencies = {
      click: 800,
      achievement: 1200,
      welcome: 600
    };
    
    oscillator.frequency.setValueAtTime(frequencies[soundType], audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  return { playSound, isMuted, setIsMuted };
};

export default function StudentAvatarWidget({ 
  student, 
  className = '', 
  size = 'md',
  enableSound = true,
  showBackground = true,
  showAge = true
}: StudentAvatarWidgetProps) {
  // 狀態管理
  const [emotionState, setEmotionState] = useState<EmotionState>('happy');
  const [isInteracting, setIsInteracting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 月齡轉歲數的輔助函數
  const convertMonthsToAge = (months: number | null): string => {
    if (!months) return '未知';
    if (months < 12) return `${months}個月`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years}歲`;
    return `${years}歲${remainingMonths}個月`;
  };

  // 資料和互動管理
  const { 
    data, 
    loading, 
    error, 
    studentStats, 
    refresh 
  } = useStudentAvatarData(student.id, { 
    enableAutoRefresh: true,
    refreshInterval: 60000 // 1分鐘刷新一次
  });
  
  const { recordInteraction } = useStudentInteractionLogger(student.id);

  // 音效管理
  const { playSound, isMuted, setIsMuted } = useAudioManager(enableSound);

  // 尺寸配置 - 響應式設計
  const sizeConfig = {
    sm: { 
      avatar: 'w-16 h-16 sm:w-20 sm:h-20', 
      container: 'w-full max-w-xs sm:max-w-sm', 
      font: 'text-xs sm:text-sm' 
    },
    md: { 
      avatar: 'w-24 h-24 sm:w-32 sm:h-32', 
      container: 'w-full max-w-sm sm:max-w-md', 
      font: 'text-sm sm:text-base' 
    },
    lg: { 
      avatar: 'w-32 h-32 sm:w-40 sm:h-40', 
      container: 'w-full max-w-md sm:max-w-lg', 
      font: 'text-base sm:text-lg' 
    }
  };

  // 角色動畫變體
  const avatarVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      y: 0,
      transition: { 
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: { duration: 0.3 }
    },
    click: {
      scale: 0.95,
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.5 }
    },
    excited: {
      scale: [1, 1.1, 1],
      rotate: [0, -10, 10, 0],
      y: [-5, -15, -5],
      transition: { 
        duration: 0.8,
        repeat: 2
      }
    }
  };

  // 角色點擊互動記錄
  useEffect(() => {
    if (isInteracting) {
      recordInteraction('avatar_click');
    }
  }, [isInteracting, recordInteraction]);

  // 角色點擊處理
  const handleCharacterClick = () => {
    setIsInteracting(true);
    playSound('click');
    
    // 隨機切換表情
    const emotions: EmotionState[] = ['happy', 'excited', 'surprised'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    setEmotionState(randomEmotion);

    // 重置狀態
    setTimeout(() => {
      setIsInteracting(false);
      setEmotionState('happy');
    }, 1000);
  };

  // 根據性別選擇角色圖片
  const getCharacterImage = () => {
    // 如果沒有設定性別，預設為男生
    if (!student.gender) {
      return '/boy(front).png';
    }
    // 統一性別判斷邏輯：female 或 女 為女生，其他為男生
    const isFemale = student.gender?.toLowerCase() === 'female' || student.gender === '女';
    return isFemale ? '/girl(front).png' : '/boy(front).png';
  };

  // 計算總體進度
  const calculateOverallProgress = () => {
    return studentStats?.overallProgress || 0;
  };

  if (loading) {
    return (
      <div className={`${sizeConfig[size].container} ${className}`}>
        <div className="animate-pulse bg-hanami-surface rounded-2xl p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className={`${sizeConfig[size].avatar} bg-hanami-border rounded-full`} />
            <div className="h-4 bg-hanami-border rounded w-24" />
            <div className="h-3 bg-hanami-border rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeConfig[size].container} ${className}`}>
        {/* 主容器 */}
        <div className="bg-gradient-to-br from-hanami-background to-hanami-surface rounded-2xl shadow-lg p-6">
        
        {/* 音效控制 */}
        {enableSound && (
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded-full bg-hanami-primary/20 hover:bg-hanami-primary/30 transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        )}

        {/* 3D 角色區域 */}
        <div className="flex flex-col items-center mb-6 relative">
          {/* 背景裝飾圓圈 - 可選 */}
          {showBackground && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFD59A]/10 to-[#FFB6C1]/10 animate-pulse" 
                   style={{ 
                     maxWidth: `calc(${sizeConfig[size].avatar.split(' ')[0]} + 2rem)`,
                     maxHeight: `calc(${sizeConfig[size].avatar.split(' ')[1]} + 2rem)` 
                   }} 
              />
            </div>
          )}
          <motion.div
            className={`${sizeConfig[size].avatar} relative cursor-pointer overflow-hidden`}
            variants={avatarVariants}
            initial="idle"
            animate={isInteracting ? "click" : "idle"}
            whileHover="hover"
            onClick={handleCharacterClick}
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
              ...(showBackground && {
                borderRadius: '50%',
                border: '4px solid transparent',
                background: 'linear-gradient(145deg, #FFD59A, #EBC9A4) padding-box, linear-gradient(145deg, #FFE4E6, #FFEEF0) border-box',
                boxShadow: '0 8px 32px rgba(255, 213, 154, 0.3), 0 4px 16px rgba(235, 201, 164, 0.2)'
              })
            }}
          >
            {/* 角色背景 - 可選 */}
            {showBackground && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFE4E6] via-[#FFEEF0] to-[#FFF0F1] rounded-full opacity-80" />
            )}
            {/* 角色圖片 */}
            <motion.img
              src={getCharacterImage()}
              alt={`${student.nick_name || student.full_name} 的角色`}
              className="relative z-10 w-full h-full object-contain drop-shadow-lg"
              style={{
                transform: isInteracting ? 'rotateY(10deg) rotateX(5deg)' : 'rotateY(0deg) rotateX(0deg)',
                transition: 'transform 0.3s ease'
              }}
            />
            
            {/* 表情覆蓋層 */}
            <AnimatePresence>
              {emotionState === 'excited' && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  <Star className="text-yellow-400 w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 點擊效果光圈 */}
            <AnimatePresence>
              {isInteracting && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-hanami-accent"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* 學生資訊 */}
          <div className="text-center mt-4">
            <h3 className={`font-bold text-hanami-text ${sizeConfig[size].font}`}>
              {student.nick_name || student.full_name}
            </h3>
            {showAge && (
              <p className="text-hanami-text-secondary text-sm">
                {student.student_age ? convertMonthsToAge(student.student_age) : ''} • {student.course_type || '音樂課程'}
              </p>
            )}
          </div>
        </div>

        {/* 快速統計 - 已隱藏 */}

        {/* 展開詳細資訊按鈕 - 已隱藏 */}

         {/* 詳細資訊面板 - 已隱藏 */}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar, 
  Award,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Star,
  ChevronRight,
  Music
} from 'lucide-react';

// 型別定義
interface LearningProgress {
  id: string;
  subject: string;
  current_lesson: string;
  progress_percentage: number;
  next_target: string;
  recent_activities: Activity[];
  upcoming_lessons: Lesson[];
  achievements: Achievement[];
  last_updated: string;
}

interface Activity {
  id: string;
  name: string;
  type: 'practice' | 'assessment' | 'performance' | 'creative';
  completion_date: string;
  score?: number;
  notes?: string;
  difficulty_level: number;
}

interface Lesson {
  id: string;
  title: string;
  scheduled_date: string;
  duration: number;
  teacher: string;
  type: 'individual' | 'group' | 'masterclass';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earned_date: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LearningProgressCardsProps {
  studentId: string;
  className?: string;
  variant?: 'compact' | 'detailed' | 'dashboard';
  maxItems?: number;
}

// 活動類型配置
const activityTypeConfig = {
  practice: {
    icon: PlayCircle,
    color: 'bg-blue-100 text-blue-600',
    borderColor: 'border-blue-200',
    bgGradient: 'from-blue-50 to-blue-100',
    label: '練習'
  },
  assessment: {
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-600',
    borderColor: 'border-green-200',
    bgGradient: 'from-green-50 to-green-100',
    label: '評估'
  },
  performance: {
    icon: Star,
    color: 'bg-purple-100 text-purple-600',
    borderColor: 'border-purple-200',
    bgGradient: 'from-purple-50 to-purple-100',
    label: '表演'
  },
  creative: {
    icon: Award,
    color: 'bg-orange-100 text-orange-600',
    borderColor: 'border-orange-200',
    bgGradient: 'from-orange-50 to-orange-100',
    label: '創作'
  }
};

// 成就稀有度配置
const achievementRarityConfig = {
  common: { color: 'text-gray-600', bgColor: 'bg-gray-100', glow: '' },
  rare: { color: 'text-blue-600', bgColor: 'bg-blue-100', glow: 'shadow-blue-200' },
  epic: { color: 'text-purple-600', bgColor: 'bg-purple-100', glow: 'shadow-purple-200' },
  legendary: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', glow: 'shadow-yellow-200' }
};

// 進度卡片組件
const ProgressCard: React.FC<{
  title: string;
  progress: number;
  current: string;
  target: string;
  variant: string;
}> = ({ title, progress, current, target, variant }) => {
  return (
    <motion.div
      className={`
        p-4 rounded-xl border border-[#FFE4E6] bg-gradient-to-br from-[#FFFCF0] to-[#FFF5F0]
        ${variant === 'compact' ? 'p-3' : 'p-4'}
      `}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-hanami-text flex items-center">
          <Music className="w-4 h-4 mr-2 text-hanami-primary" />
          {title}
        </h4>
        <div className="text-lg font-bold text-hanami-primary">{progress}%</div>
      </div>
      
      {/* 進度條 */}
      <div className="mb-3">
        <div className="w-full h-2 bg-hanami-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-hanami-primary to-hanami-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>

      {/* 當前和目標 */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center">
          <BookOpen className="w-3 h-3 mr-2 text-hanami-text-secondary" />
          <span className="text-hanami-text-secondary">目前：</span>
          <span className="text-hanami-text ml-1">{current}</span>
        </div>
        <div className="flex items-center">
          <Target className="w-3 h-3 mr-2 text-hanami-text-secondary" />
          <span className="text-hanami-text-secondary">目標：</span>
          <span className="text-hanami-text ml-1">{target}</span>
        </div>
      </div>
    </motion.div>
  );
};

// 活動卡片組件
const ActivityCard: React.FC<{
  activity: Activity;
  variant: string;
}> = ({ activity, variant }) => {
  const config = activityTypeConfig[activity.type];
  const IconComponent = config.icon;

  return (
    <motion.div
      className={`
        p-3 rounded-lg border ${config.borderColor} bg-gradient-to-r ${config.bgGradient}
        ${variant === 'compact' ? 'p-2' : 'p-3'}
      `}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={`p-1 rounded ${config.color} mr-2`}>
            <IconComponent className="w-3 h-3" />
          </div>
          <span className="font-medium text-sm text-hanami-text">{activity.name}</span>
        </div>
        {activity.score && (
          <div className="text-xs font-bold text-hanami-primary">{activity.score}分</div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs text-hanami-text-secondary">
        <span>{config.label}</span>
        <span>{new Date(activity.completion_date).toLocaleDateString('zh-TW')}</span>
      </div>

      {/* 難度星級 */}
      <div className="flex items-center mt-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-2 h-2 ${
              i < activity.difficulty_level 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

// 課程卡片組件
const LessonCard: React.FC<{
  lesson: Lesson;
  variant: string;
}> = ({ lesson, variant }) => {
  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-600',
      confirmed: 'bg-green-100 text-green-600',
      completed: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      individual: PlayCircle,
      group: Music,
      masterclass: Award
    };
    return icons[type as keyof typeof icons] || PlayCircle;
  };

  const TypeIcon = getTypeIcon(lesson.type);

  return (
    <motion.div
      className={`
        p-3 rounded-lg border border-hanami-border bg-hanami-surface
        ${variant === 'compact' ? 'p-2' : 'p-3'}
      `}
      whileHover={{ scale: 1.02, x: 5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <TypeIcon className="w-4 h-4 mr-2 text-hanami-primary" />
          <span className="font-medium text-sm text-hanami-text">{lesson.title}</span>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(lesson.status)}`}>
          {lesson.status}
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-hanami-text-secondary">
        <div className="flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {new Date(lesson.scheduled_date).toLocaleDateString('zh-TW')}
        </div>
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {lesson.duration}分鐘 • {lesson.teacher}
        </div>
      </div>
    </motion.div>
  );
};

// 成就卡片組件
const AchievementCard: React.FC<{
  achievement: Achievement;
  variant: string;
}> = ({ achievement, variant }) => {
  const rarityConfig = achievementRarityConfig[achievement.rarity];
  
  return (
    <motion.div
      className={`
        p-3 rounded-lg border border-hanami-border bg-hanami-surface
        ${rarityConfig.glow ? `shadow-lg ${rarityConfig.glow}` : ''}
        ${variant === 'compact' ? 'p-2' : 'p-3'}
      `}
      whileHover={{ scale: 1.05, rotate: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center mb-2">
        <div className={`p-2 rounded-full ${rarityConfig.bgColor} mr-3`}>
          <Award className={`w-4 h-4 ${rarityConfig.color}`} />
        </div>
        <div>
          <h5 className="font-bold text-sm text-hanami-text">{achievement.title}</h5>
          <p className="text-xs text-hanami-text-secondary">{achievement.description}</p>
        </div>
      </div>
      
      <div className="text-xs text-hanami-text-secondary">
        獲得於 {new Date(achievement.earned_date).toLocaleDateString('zh-TW')}
      </div>
    </motion.div>
  );
};

export default function LearningProgressCards({
  studentId,
  className = '',
  variant = 'detailed',
  maxItems = 5
}: LearningProgressCardsProps) {
  const [progressData, setProgressData] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'progress' | 'activities' | 'lessons' | 'achievements'>('progress');

  // 模擬資料載入
  useEffect(() => {
    const loadProgressData = async () => {
      try {
        setLoading(true);
        
        // 這裡應該從 Supabase 載入真實資料
        // 目前使用模擬資料
        const mockData: LearningProgress = {
          id: studentId,
          subject: '音樂基礎課程',
          current_lesson: '節奏訓練 - 四拍子練習',
          progress_percentage: 75,
          next_target: '八分音符組合練習',
          recent_activities: [
            {
              id: '1',
              name: '基礎節拍練習',
              type: 'practice',
              completion_date: '2024-12-18',
              score: 85,
              difficulty_level: 3
            },
            {
              id: '2',
              name: '音感評估測試',
              type: 'assessment',
              completion_date: '2024-12-17',
              score: 92,
              difficulty_level: 4
            },
            {
              id: '3',
              name: '小小演奏會',
              type: 'performance',
              completion_date: '2024-12-15',
              score: 88,
              difficulty_level: 5
            }
          ],
          upcoming_lessons: [
            {
              id: '1',
              title: '進階節奏訓練',
              scheduled_date: '2024-12-20',
              duration: 45,
              teacher: '李老師',
              type: 'individual',
              status: 'confirmed'
            },
            {
              id: '2',
              title: '合奏練習',
              scheduled_date: '2024-12-22',
              duration: 60,
              teacher: '王老師',
              type: 'group',
              status: 'scheduled'
            }
          ],
          achievements: [
            {
              id: '1',
              title: '節奏大師',
              description: '完成所有基礎節奏練習',
              earned_date: '2024-12-18',
              icon: '🎵',
              rarity: 'rare'
            },
            {
              id: '2',
              title: '完美音感',
              description: '音感測試得到滿分',
              earned_date: '2024-12-17',
              icon: '🎯',
              rarity: 'epic'
            }
          ],
          last_updated: '2024-12-19'
        };

        setProgressData(mockData);
      } catch (error) {
        console.error('載入學習進度失敗：', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, [studentId]);

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-hanami-border rounded-xl" />
        ))}
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 mx-auto text-hanami-text-secondary mb-4" />
        <p className="text-hanami-text-secondary">無法載入學習進度資料</p>
      </div>
    );
  }

  const tabConfig = [
    { key: 'progress', label: '學習進度', icon: TrendingUp },
    { key: 'activities', label: '近期活動', icon: BookOpen },
    { key: 'lessons', label: '即將課程', icon: Calendar },
    { key: 'achievements', label: '成就獎章', icon: Award }
  ] as const;

  return (
    <div className={`bg-gradient-to-br from-[#FFFCF0] to-[#FFF9F5] rounded-2xl p-6 border border-[#FFE4E6] ${className}`}>
      {/* 標籤導航 */}
      {variant !== 'compact' && (
        <div className="mb-6">
          <div className="flex space-x-1 bg-hanami-border/30 rounded-xl p-1 overflow-x-auto scrollbar-hide">
            {tabConfig.map(({ key, label, icon: Icon }) => (
              <motion.button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === key
                    ? 'bg-hanami-primary text-hanami-text shadow-sm'
                    : 'text-hanami-text-secondary hover:text-hanami-text hover:bg-hanami-surface'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 內容區域 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* 學習進度 */}
          {(activeTab === 'progress' || variant === 'compact') && (
            <ProgressCard
              title={progressData.subject}
              progress={progressData.progress_percentage}
              current={progressData.current_lesson}
              target={progressData.next_target}
              variant={variant}
            />
          )}

          {/* 近期活動 */}
          {activeTab === 'activities' && (
            <div className="space-y-3">
              <h4 className="font-bold text-hanami-text mb-4">近期學習活動</h4>
              {progressData.recent_activities.slice(0, maxItems).map((activity) => (
                <ActivityCard key={activity.id} activity={activity} variant={variant} />
              ))}
            </div>
          )}

          {/* 即將課程 */}
          {activeTab === 'lessons' && (
            <div className="space-y-3">
              <h4 className="font-bold text-hanami-text mb-4">即將到來的課程</h4>
              {progressData.upcoming_lessons.slice(0, maxItems).map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} variant={variant} />
              ))}
            </div>
          )}

          {/* 成就獎章 */}
          {activeTab === 'achievements' && (
            <div className="space-y-3">
              <h4 className="font-bold text-hanami-text mb-4">獲得的成就</h4>
              {progressData.achievements.slice(0, maxItems).map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} variant={variant} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 更新時間 */}
      {variant === 'detailed' && (
        <div className="mt-4 pt-4 border-t border-hanami-border">
          <p className="text-xs text-hanami-text-secondary text-center">
            最後更新：{new Date(progressData.last_updated).toLocaleString('zh-TW')}
          </p>
        </div>
      )}
    </div>
  );
}

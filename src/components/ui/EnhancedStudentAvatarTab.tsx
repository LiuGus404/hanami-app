'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  TreePine, 
  TrendingUp, 
  Star, 
  RefreshCw, 
  AlertCircle, 
  Info,
  PlayCircle,
  Volume2,
  VolumeX,
  Calendar,
  Clock,
  Award,
  Music,
  ChevronRight,
  Zap,
  Target,
  BookOpen,
  Sparkles,
  GraduationCap,
  Check,
  Lock
} from 'lucide-react';
import { 
  StudentAvatarWidget, 
  GrowthTreeVisualization, 
  LearningProgressCards 
} from '@/components/ui';
import Student3DCharacter from './Student3DCharacter';
import LearningPathLevels from '@/components/ui/LearningPathLevels';
import StudentAbilityAssessments from '@/components/ui/StudentAbilityAssessments';
import DetailedAbilityProgress from '@/components/ui/DetailedAbilityProgress';
import AbilityTrendModal from '@/components/ui/AbilityTrendModal';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { useStudentAvatarData, useGrowthTreeInteraction } from '@/hooks/useStudentAvatarData';

interface EnhancedStudentAvatarTabProps {
  student: any;
  className?: string;
}

// 動態卡片組件
const DynamicCard: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}> = ({ children, delay = 0, className = '', hover = true, onClick }) => {
  return (
    <motion.div
      className={`bg-gradient-to-br from-white via-[#FEFCFB] to-[#FDF8F6] rounded-2xl border border-[#E8E1DC] shadow-lg backdrop-blur-sm ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={hover ? { 
        y: -8, 
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(232, 225, 220, 0.3), 0 15px 25px rgba(248, 234, 225, 0.2)"
      } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {children}
    </motion.div>
  );
};

// 浮動動畫組件
const FloatingIcon: React.FC<{
  icon: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ icon, className = '', delay = 0 }) => {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1.2, 0],
        y: [0, -20, -40, -60]
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        repeatDelay: 2
      }}
    >
      {icon}
    </motion.div>
  );
};

export default function EnhancedStudentAvatarTab({ student, className = '' }: EnhancedStudentAvatarTabProps) {
  const PREMIUM_AI_ORG_ID = 'f8d269ec-b682-45d1-a796-3b74c2bf3eec';
  const isPremiumOrg = student?.org_id === PREMIUM_AI_ORG_ID;
  const [activeSection, setActiveSection] = useState<'overview' | 'avatar' | 'progress' | 'growth'>('overview');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedActivityStatus, setSelectedActivityStatus] = useState<string>('全部');
  const [studentActivities, setStudentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState<{totalProgress: number, currentLevel: number}>({totalProgress: 0, currentLevel: 1});
  const [chartData, setChartData] = useState<Array<{date: string, progress: number, level: number}>>([]);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null);
  const [abilityProgress, setAbilityProgress] = useState<Array<{
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    progress: number;
    status: 'locked' | 'in_progress' | 'completed';
    color: string;
    description?: string;
    progressMode?: string;
    progressContents?: Array<{
      content: string;
      completed: boolean;
      level: number;
    }>;
    assessmentMode?: string;
  }>>([]);
  const [selectedBackground, setSelectedBackground] = useState<string>('classroom');
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [showTrendModal, setShowTrendModal] = useState<boolean>(false);

  // 使用自定義Hook載入學生資料
  const {
    data,
    loading,
    error,
    studentStats,
    refresh,
    lastUpdated,
    isDataStale
  } = useStudentAvatarData(student?.id, {
    enableAutoRefresh: true,
    refreshInterval: 60000,
    enabled: isPremiumOrg
  });

  // 成長樹互動
  const {
    selectedNode,
    handleNodeClick,
    clearSelection
  } = useGrowthTreeInteraction(student?.id);

  // 載入學生活動
  useEffect(() => {
      const loadStudentActivities = async () => {
      if (!student?.id || !isPremiumOrg) {
        setStudentActivities([]);
        setLoadingActivities(false);
        return;
      }
      
      setLoadingActivities(true);
      try {
        const response = await fetch(`/api/student-activities?studentId=${student.id}&lessonDate=${new Date().toISOString().split('T')[0]}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const { currentLessonActivities, ongoingActivities, completedOngoingActivities, previousLessonActivities } = result.data;
            
            // 合併所有類型的活動，包括已完成的正在學習活動
            const allActivities = [
              ...currentLessonActivities,
              ...ongoingActivities,
              ...(completedOngoingActivities || []),
              ...previousLessonActivities
            ];
            
            // 轉換數據格式以匹配組件期望的格式
            const activities = allActivities.map((activity: any) => ({
              id: activity.id || activity.activityId,
              name: activity.activityName,
              status: activity.progress >= 100 ? '已完成' : 
                     activity.progress > 0 ? '進行中' : '未開始',
              difficulty: activity.difficultyLevel || 1,
              type: activity.activityType,
              progress: activity.progress || 0,
              assignedDate: activity.assignedAt ? 
                new Date(activity.assignedAt).toLocaleDateString('zh-TW').replace(/\//g, '/') : 
                activity.lessonDate ? 
                  new Date(activity.lessonDate).toLocaleDateString('zh-TW').replace(/\//g, '/') : 
                  '未知',
              description: activity.activityDescription || ''
            }));
            
            setStudentActivities(activities);
          }
        }
      } catch (error) {
        console.error('載入學生活動失敗:', error);
        setStudentActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    loadStudentActivities();
  }, [student?.id, isPremiumOrg]);

  // 載入可用的評估日期
  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!student?.id || !isPremiumOrg) {
        const currentDate = new Date().toISOString().split('T')[0];
        setAvailableDates([currentDate]);
        setSelectedDate(currentDate);
        setChartData([]);
        return;
      }
      try {
        // 從 API 載入真實的評估日期
        const response = await fetch(`/api/student-assessment-progress?student_id=${student.id}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const { availableDates, trendData } = result.data;
            
            // 設置可用的評估日期
            if (availableDates && availableDates.length > 0) {
              setAvailableDates(availableDates);
              setSelectedDate(availableDates[0]); // 設置默認選中的日期為最新的記錄
            } else {
              // 如果沒有記錄，顯示當前日期作為默認
              const currentDate = new Date().toISOString().split('T')[0];
              setAvailableDates([currentDate]);
              setSelectedDate(currentDate);
            }
            
            // 設置圖表數據
            if (trendData && trendData.length > 0) {
              setChartData(trendData);
            } else {
              // 如果沒有趨勢資料，設置空陣列
              setChartData([]);
            }
          } else {
            console.error('載入評估日期失敗:', result.error);
            // 設置默認資料
            const currentDate = new Date().toISOString().split('T')[0];
            setAvailableDates([currentDate]);
            setSelectedDate(currentDate);
            setChartData([]);
          }
        } else {
          console.error('API 請求失敗:', response.status);
          // 設置默認資料
          const currentDate = new Date().toISOString().split('T')[0];
          setAvailableDates([currentDate]);
          setSelectedDate(currentDate);
          setChartData([]);
        }
      } catch (error) {
        console.error('載入可用日期失敗:', error);
        // 設置默認資料
        const currentDate = new Date().toISOString().split('T')[0];
        setAvailableDates([currentDate]);
        setSelectedDate(currentDate);
        setChartData([]);
      }
    };
    loadAvailableDates();
  }, [student?.id, isPremiumOrg]);

  // 根據選中日期載入評估數據
  useEffect(() => {
    const loadAssessmentData = async () => {
      if (!student?.id || !isPremiumOrg) {
        setCurrentProgress({ totalProgress: 0, currentLevel: 1 });
        return;
      }
      try {
        console.log(`載入學生 ${student.id} 的評估數據`);
        
        // 從 API 載入真實的評估資料
        const response = await fetch(
          `/api/student-assessment-progress?student_id=${student.id}${selectedDate ? `&assessment_date=${selectedDate}` : ''}`
        );
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setCurrentProgress({
              totalProgress: result.data.totalProgress,
              currentLevel: result.data.currentLevel
            });
            
            // 更新能力評估資料
            if (result.data.abilities) {
              setAbilityProgress(result.data.abilities);
            }
            
            // 更新趨勢資料
            if (result.data.trendData) {
              setChartData(result.data.trendData);
            }
            
            console.log('成功載入評估資料:', result.data);
          } else {
            console.error('載入評估資料失敗:', result.error);
            // 設置默認數據
            setCurrentProgress({
              totalProgress: 0,
              currentLevel: 1
            });
          }
        } else {
          console.error('API 請求失敗:', response.status);
          // 設置默認數據
          setCurrentProgress({
            totalProgress: 0,
            currentLevel: 1
          });
        }
        
      } catch (error) {
        console.error('載入評估數據失敗:', error);
        // 設置默認數據
        setCurrentProgress({
          totalProgress: 0,
          currentLevel: 1
        });
      }
    };
    loadAssessmentData();
  }, [selectedDate, student?.id, isPremiumOrg]);

  // 處理刷新動畫
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // 格式化學生資料
  const formattedStudent = student ? {
    id: student.id,
    full_name: student.full_name,
    nick_name: student.nick_name,
    gender: student.gender,
    student_age: student.student_age,
    course_type: student.course_type,
    ongoing_lessons: student.ongoing_lessons,
    upcoming_lessons: student.upcoming_lessons
  } : null;

  if (!student) {
    return (
      <div className={`p-6 ${className}`}>
        <DynamicCard className="text-center p-8">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">無法載入學生資料</p>
        </DynamicCard>
      </div>
    );
  }

  if (!isPremiumOrg) {
    return (
      <div className={`p-6 ${className}`}>
        <DynamicCard className="text-center p-8">
          <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">功能暫未開放</h3>
          <p className="text-sm text-gray-600">
            若需啟用學生狀態模組，請讓貴單位聯繫{' '}
            <a className="underline text-hanami-accent" href="mailto:BuildThink@lingumiai.com">
              BuildThink@lingumiai.com
            </a>
            ，我們會優先為您開通。
          </p>
        </DynamicCard>
      </div>
    );
  }

  const sections = [
    {
      key: 'overview',
      label: '綜合視圖',
      icon: Star,
      color: 'from-[#F8EAD8] to-[#F5E6D3]',
      iconColor: 'text-orange-500'
    },
    {
      key: 'avatar',
      label: '學生狀態',
      icon: User,
      color: 'from-[#E8F5E8] to-[#E0F2E0]',
      iconColor: 'text-green-500'
    },
    {
      key: 'progress',
      label: '成長樹',
      icon: TreePine,
      color: 'from-[#E8F2FF] to-[#E0EFFF]',
      iconColor: 'text-blue-500'
    },
    {
      key: 'growth',
      label: '學習進度',
      icon: TrendingUp,
      color: 'from-[#F0E8FF] to-[#ECE0FF]',
      iconColor: 'text-purple-500'
    }
  ] as const;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#FEFCFB] via-[#FDF9F7] to-[#FCF6F3] relative overflow-hidden ${className}`}>
      {/* 背景裝飾元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingIcon 
          icon={<Music className="w-6 h-6 text-orange-300" />} 
          className="top-20 left-10"
          delay={0}
        />
        <FloatingIcon 
          icon={<Sparkles className="w-5 h-5 text-purple-300" />} 
          className="top-32 right-20"
          delay={1}
        />
        <FloatingIcon 
          icon={<Star className="w-4 h-4 text-yellow-300" />} 
          className="top-64 left-1/4"
          delay={2}
        />
        <FloatingIcon 
          icon={<Award className="w-5 h-5 text-green-300" />} 
          className="top-40 right-1/3"
          delay={1.5}
        />
      </div>

      <div className="relative z-10 p-3 sm:p-6 max-w-7xl mx-auto">
        {/* 頁面標題區域 */}
        <DynamicCard className="mb-6 sm:mb-8 p-4 sm:p-8" delay={0.1}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <motion.div
                className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#F8EAD8] to-[#F5E6D3] rounded-2xl flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {student.nick_name || student.full_name} 的學生狀態
                </motion.h1>
                <motion.p 
                  className="text-gray-600 flex items-center text-sm sm:text-base"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-purple-500" />
                  3D動態角色與學習進度互動體驗
                </motion.p>
              </div>
            </div>
            
            {/* 控制按鈕區域 */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 sm:p-3 rounded-xl transition-all duration-300 ${
                  soundEnabled 
                    ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-600 shadow-lg' 
                    : 'bg-gray-100 text-gray-400'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </motion.button>

              <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-xl shadow-lg disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </motion.button>
            </div>
          </div>

          {/* 狀態指示器 */}
          {lastUpdated && (
            <motion.div 
              className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Info size={12} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">最後更新：</span>
              <span className="sm:hidden">更新：</span>
              {lastUpdated.toLocaleString('zh-TW')}
              {isDataStale && (
                <motion.span 
                  className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-600 rounded-lg text-xs"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  資料可能已過期
                </motion.span>
              )}
            </motion.div>
          )}
        </DynamicCard>

        {/* 分頁導航 */}
        <DynamicCard className="mb-6 sm:mb-8 p-2" delay={0.2}>
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
            {sections.map(({ key, label, icon: Icon, color, iconColor }, index) => (
              <motion.button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`
                  flex items-center px-3 py-2 sm:px-6 sm:py-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap min-w-0 flex-1
                  ${activeSection === key
                    ? `bg-gradient-to-br ${color} shadow-lg border-2 border-white`
                    : 'hover:bg-gray-50'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <motion.div
                  className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 ${
                    activeSection === key ? 'bg-white shadow-md' : 'bg-gray-100'
                  }`}
                  whileHover={{ rotate: 15 }}
                >
                  <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${activeSection === key ? iconColor : 'text-gray-400'}`} />
                </motion.div>
                <span className={`hidden sm:inline ${activeSection === key ? 'text-gray-800' : 'text-gray-600'}`}>
                  {label}
                </span>
                {activeSection === key && (
                  <motion.div
                    className="ml-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </DynamicCard>

        {/* 載入狀態 */}
        {loading && (
          <DynamicCard className="text-center py-16" delay={0.3}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center"
            >
              <RefreshCw className="w-8 h-8 text-orange-500" />
            </motion.div>
            <p className="text-gray-600 text-lg">載入學生資料中...</p>
          </DynamicCard>
        )}

        {/* 錯誤狀態 */}
        {error && (
          <DynamicCard className="text-center py-16" delay={0.3}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center"
            >
              <AlertCircle className="w-8 h-8 text-red-500" />
            </motion.div>
            <p className="text-red-600 mb-6 text-lg">{error}</p>
            <motion.button
              onClick={handleRefresh}
              className="px-6 py-3 bg-gradient-to-br from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl font-medium shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              重試載入
            </motion.button>
          </DynamicCard>
        )}

        {/* 分頁內容 */}
        <AnimatePresence mode="wait">
          {!loading && !error && (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* 綜合視圖 */}
              {activeSection === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* 主要角色展示 */}
                  <DynamicCard className="lg:col-span-1 p-8 text-center" delay={0.4}>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                    >
                      {formattedStudent && (
                        <StudentAvatarWidget
                          student={formattedStudent}
                          size="lg"
                          enableSound={soundEnabled}
                          className="mx-auto"
                        />
                      )}
                    </motion.div>
                  </DynamicCard>

                  {/* 學習概況 */}
                  <DynamicCard className="lg:col-span-2 p-8" delay={0.5}>
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                      <motion.div
                        className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-3"
                        whileHover={{ rotate: 15 }}
                      >
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                      </motion.div>
                      學習概況
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { 
                          label: '成長樹', 
                          value: studentStats?.activeGrowthTrees || 0, 
                          icon: TreePine, 
                          color: 'from-orange-100 to-orange-200',
                          iconColor: 'text-orange-500'
                        },
                        { 
                          label: '能力評估記錄', 
                          value: studentStats?.totalAbilities || 0, 
                          icon: Award, 
                          color: 'from-purple-100 to-purple-200',
                          iconColor: 'text-purple-500'
                        },
                        { 
                          label: '學習的活動', 
                          value: studentStats?.totalActivities || 0, 
                          icon: BookOpen, 
                          color: 'from-green-100 to-green-200',
                          iconColor: 'text-green-500'
                        }
                      ].map((stat, index) => (
                        <motion.div
                          key={index}
                          className={`p-6 bg-gradient-to-br ${stat.color} rounded-2xl`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                            <motion.div
                              className="text-2xl font-bold text-gray-800"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.9 + index * 0.1, type: "spring" }}
                            >
                              {stat.value}
                            </motion.div>
                          </div>
                          <div className="text-gray-600 font-medium">{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  </DynamicCard>

                  {/* 學習路徑關卡 */}
                  <DynamicCard className="lg:col-span-3 p-8" delay={0.6}>
                    <LearningPathLevels
                      studentId={student.id}
                      maxLevels={4}
                      showProgress={true}
                      student={student}
                    />
                  </DynamicCard>

                  {/* 正在學習的活動 */}
                  <DynamicCard className="lg:col-span-3 p-8" delay={0.7}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                        <motion.div
                          className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg mr-3"
                          whileHover={{ rotate: 15 }}
                        >
                          <BookOpen className="w-6 h-6 text-purple-500" />
                        </motion.div>
                        正在學習的活動
                      </h3>
                      
                      {/* 狀態篩選器 */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">狀態篩選：</span>
                        {['全部', '未開始', '進行中', '已完成'].map((status, index) => (
                          <motion.button
                            key={status}
                            onClick={() => setSelectedActivityStatus(status)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              selectedActivityStatus === status
                                ? 'bg-purple-500 text-white border-purple-500 shadow-md' 
                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 + index * 0.1 }}
                          >
                            {status}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 活動列表 */}
                    <div className="space-y-4">
                      {(() => {
                        // 使用真實的學生活動數據，如果沒有數據則顯示空狀態
                        const activities = studentActivities || [];

                        // 顯示載入狀態
                        if (loadingActivities) {
                          return (
                            <motion.div
                              className="text-center py-12"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                            >
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
                              <p className="text-gray-500 text-lg">載入學生活動中...</p>
                            </motion.div>
                          );
                        }

                        // 篩選活動
                        const filteredActivities = activities.filter(activity => 
                          selectedActivityStatus === '全部' || activity.status === selectedActivityStatus
                        );

                        if (filteredActivities.length === 0) {
                          return (
                            <motion.div
                              className="text-center py-12"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                            >
                              <div className="text-gray-400 mb-4">
                                <BookOpen className="w-16 h-16 mx-auto" />
                              </div>
                              <p className="text-gray-500 text-lg">沒有找到符合「{selectedActivityStatus}」狀態的活動</p>
                              <p className="text-gray-400 text-sm mt-2">請嘗試選擇其他篩選條件</p>
                            </motion.div>
                          );
                        }

                        return filteredActivities.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 hover:bg-white/80 transition-all duration-300"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                            whileHover={{ x: 5, scale: 1.02 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {/* 狀態指示器 */}
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    activity.status === '已完成' ? 'bg-green-400' :
                                    activity.status === '進行中' ? 'bg-blue-400' :
                                    activity.status === '未開始' ? 'bg-gray-400' :
                                    'bg-orange-400'
                                  }`} />
                                  <span className="text-xs text-gray-500 font-medium">
                                    {activity.status}
                                  </span>
                                </div>
                                
                                {/* 活動名稱 */}
                                <div>
                                  <h4 className="font-medium text-gray-800">{activity.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-xs text-gray-500">難度 {activity.difficulty}</span>
                                    <span className="text-xs text-gray-500">{activity.type}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                {/* 進度條 */}
                                <div className="w-24">
                                  <div className="text-xs text-gray-500 mb-1">完成進度</div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full bg-gradient-to-r ${
                                        activity.progress >= 80 ? 'from-green-400 to-green-500' :
                                        activity.progress >= 40 ? 'from-blue-400 to-blue-500' :
                                        'from-orange-400 to-orange-500'
                                      } rounded-full`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${activity.progress}%` }}
                                      transition={{ duration: 1, delay: 1 + index * 0.1 }}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">{activity.progress}%</div>
                                </div>
                                
                                {/* 分配時間 */}
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">分配時間</div>
                                  <div className="text-xs text-gray-700">{activity.assignedDate}</div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ));
                      })()}
                    </div>
                    
                  </DynamicCard>

                  {/* 能力評估記錄 */}
                  <DynamicCard className="lg:col-span-3 p-8" delay={0.8}>
                    <StudentAbilityAssessments
                      studentId={student.id}
                      maxAssessments={3}
                      showDetails={true}
                    />
                  </DynamicCard>
                </div>
              )}

              {/* 學生狀態分頁 */}
              {activeSection === 'avatar' && formattedStudent && (
                <div className="space-y-8">
                  {/* 學生狀態 */}
                  <DynamicCard className="max-w-2xl mx-auto p-8 text-center" delay={0.4}>
                    <StudentAvatarWidget
                      student={formattedStudent}
                      size="lg"
                      enableSound={soundEnabled}
                      className="mx-auto"
                    />
                    
                    <motion.div 
                      className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center justify-center">
                        <Zap className="w-5 h-5 mr-2 text-blue-500" />
                        互動提示
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li>• 點擊角色查看可愛的互動動畫</li>
                        <li>• 角色會根據學生性別自動調整</li>
                        <li>• 展開詳細資訊查看更多內容</li>
                        <li>• 所有互動都會被記錄用於統計</li>
                      </ul>
                    </motion.div>
                  </DynamicCard>

                {/* 3D背景切換元件 */}
                <DynamicCard className="max-w-5xl mx-auto p-8" delay={0.5}>
                  <div className="text-center">
                    
                    {/* 背景選擇器 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
                      {[
                        { 
                          id: 'classroom',
                          name: '教室', 
                          icon: 'Building', 
                          color: 'from-blue-400 to-blue-500',
                          bgColor: 'from-blue-50 to-blue-100',
                          hoverColor: 'from-blue-100 to-blue-200',
                          iconColor: 'text-blue-500'
                        },
                        { 
                          id: 'music-room',
                          name: '音樂室', 
                          icon: 'Music', 
                          color: 'from-purple-400 to-purple-500',
                          bgColor: 'from-purple-50 to-purple-100',
                          hoverColor: 'from-purple-100 to-purple-200',
                          iconColor: 'text-purple-500'
                        },
                        { 
                          id: 'outdoor',
                          name: '戶外', 
                          icon: 'TreePine', 
                          color: 'from-green-400 to-green-500',
                          bgColor: 'from-green-50 to-green-100',
                          hoverColor: 'from-green-100 to-green-200',
                          iconColor: 'text-green-500'
                        },
                        { 
                          id: 'home',
                          name: '家中', 
                          icon: 'Home', 
                          color: 'from-orange-400 to-orange-500',
                          bgColor: 'from-orange-50 to-orange-100',
                          hoverColor: 'from-orange-100 to-orange-200',
                          iconColor: 'text-orange-500'
                        },
                        { 
                          id: 'studio',
                          name: '錄音室', 
                          icon: 'Mic', 
                          color: 'from-pink-400 to-pink-500',
                          bgColor: 'from-pink-50 to-pink-100',
                          hoverColor: 'from-pink-100 to-pink-200',
                          iconColor: 'text-pink-500'
                        },
                        { 
                          id: 'playground',
                          name: '遊樂場', 
                          icon: 'Gamepad2', 
                          color: 'from-yellow-400 to-yellow-500',
                          bgColor: 'from-yellow-50 to-yellow-100',
                          hoverColor: 'from-yellow-100 to-yellow-200',
                          iconColor: 'text-yellow-500'
                        }
                      ].map((background, index) => {
                        const IconComponent = background.icon === 'Building' ? User :
                                            background.icon === 'Music' ? Music :
                                            background.icon === 'TreePine' ? TreePine :
                                            background.icon === 'Home' ? User :
                                            background.icon === 'Mic' ? Volume2 :
                                            background.icon === 'Gamepad2' ? Sparkles : User;
                        
                        const isSelected = selectedBackground === background.id;
                        
                        return (
                          <motion.button
                            key={background.name}
                            onClick={() => setSelectedBackground(background.id)}
                            className={`group relative p-4 rounded-2xl bg-gradient-to-br ${
                              isSelected ? 'from-[#FFD59A] to-[#EBC9A4]' : background.bgColor
                            } border-2 ${
                              isSelected ? 'border-[#FFD59A] shadow-lg' : 'border-transparent hover:border-white/50'
                            } transition-all duration-300 overflow-hidden`}
                            whileHover={{ 
                              scale: 1.05, 
                              y: -5,
                              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 30, rotateX: -15 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ 
                              delay: 0.6 + index * 0.1,
                              type: "spring",
                              stiffness: 100,
                              damping: 15
                            }}
                          >
                            {/* 背景光效 */}
                            <motion.div
                              className={`absolute inset-0 bg-gradient-to-br ${background.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                              initial={{ scale: 0.8 }}
                              whileHover={{ scale: 1.2 }}
                            />
                            
                            {/* 圖標容器 */}
                            <motion.div
                              className={`relative w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${
                                isSelected ? 'from-white to-white/90' : background.color
                              } rounded-xl flex items-center justify-center shadow-lg`}
                              whileHover={{ rotate: 360, scale: 1.1 }}
                              transition={{ duration: 0.6, type: "spring" }}
                            >
                              <IconComponent className={`w-6 h-6 ${
                                isSelected ? 'text-[#2B3A3B]' : 'text-white'
                              }`} />
                            </motion.div>
                            
                            {/* 標題 */}
                            <div className="relative text-center">
                              <h4 className={`font-semibold text-sm ${
                                isSelected ? 'text-[#2B3A3B]' : 'text-gray-800'
                              }`}>{background.name}</h4>
                            </div>
                            
                            {/* 選中指示器 */}
                            {isSelected && (
                              <motion.div
                                className="absolute top-2 right-2 w-3 h-3 bg-[#FFB6C1] rounded-full"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                    
                    {/* 背景預覽區域 */}
                    <motion.div
                      className="w-full max-w-6xl mx-auto h-96"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 1, type: "spring", stiffness: 100 }}
                    >
                      <motion.div 
                        className="relative w-full h-full overflow-hidden rounded-2xl border border-[#EADBC8] shadow-lg"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        {/* 背景圖片 */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                          style={{
                            backgroundImage: selectedBackground === 'classroom' 
                              ? "url('/3d-character-backgrounds/classroom/classroom.png')"
                              : selectedBackground === 'music-room'
                              ? "linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)"
                              : selectedBackground === 'outdoor'
                              ? "linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)"
                              : selectedBackground === 'home'
                              ? "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)"
                              : selectedBackground === 'studio'
                              ? "linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #F9A8D4 100%)"
                              : selectedBackground === 'playground'
                              ? "linear-gradient(135deg, #EAB308 0%, #FACC15 50%, #FDE047 100%)"
                              : "linear-gradient(to bottom right, #FFF9F2, #FFFDF8)"
                          }}
                        />
                        
                        
                        {/* 3D角色顯示 */}
                        <div className="relative z-10 h-full flex items-end justify-center">
                          <div className="text-center">
                            {formattedStudent && (
                              <motion.div
                                className="mb-0"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                              >
                                <Student3DCharacter
                                  student={formattedStudent}
                                  size="lg"
                                  enableAnimation={true}
                                  enableControls={true}
                                  className="mx-auto"
                                />
                              </motion.div>
                            )}
                            
                            {/* 狀態標籤 */}
                            <motion.div
                              className="inline-flex items-center px-6 py-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.5 }}
                            >
                              <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse" />
                              <p className="text-[#4B4036] font-medium">3D角色已顯示</p>
                            </motion.div>
                            
                            <motion.p 
                              className="text-white/90 font-medium text-lg mt-4 drop-shadow-lg"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.7 }}
                            >
                              {selectedBackground === 'classroom' ? '教室背景' :
                               selectedBackground === 'music-room' ? '音樂室背景' :
                               selectedBackground === 'outdoor' ? '戶外背景' :
                               selectedBackground === 'home' ? '家中背景' :
                               selectedBackground === 'studio' ? '錄音室背景' :
                               selectedBackground === 'playground' ? '遊樂場背景' :
                               '選擇背景'}
                            </motion.p>
                          </div>
                        </div>
                        
                        {/* 裝飾元素 */}
                        <motion.div
                          className="absolute top-4 right-4 w-4 h-4 bg-[#FFB6C1]/60 rounded-full"
                          animate={{ 
                            y: [0, -8, 0],
                            opacity: [0.6, 1, 0.6]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity, 
                            delay: 0.5 
                          }}
                        />
                        <motion.div
                          className="absolute bottom-6 left-6 w-3 h-3 bg-[#FFD59A]/60 rounded-full"
                          animate={{ 
                            y: [0, 6, 0],
                            opacity: [0.4, 0.8, 0.4]
                          }}
                          transition={{ 
                            duration: 3.5, 
                            repeat: Infinity, 
                            delay: 1 
                          }}
                        />
                      </motion.div>
                    </motion.div>
                    
                  </div>
                </DynamicCard>
                </div>
              )}

              {/* 學習進度分頁 */}
              {activeSection === 'progress' && (
                <div className="space-y-8">
                  {/* 學習路徑 */}
                  <DynamicCard className="p-8" delay={0.4}>
                    <LearningPathLevels
                      studentId={student.id}
                      maxLevels={4}
                      showProgress={true}
                      student={student}
                    />
                  </DynamicCard>

                  {/* 正在學習的活動 */}
                  <DynamicCard className="p-8" delay={0.5}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                        <motion.div
                          className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg mr-3"
                          whileHover={{ rotate: 15 }}
                        >
                          <BookOpen className="w-6 h-6 text-purple-500" />
                        </motion.div>
                        正在學習的活動
                      </h3>
                      
                      {/* 狀態篩選器 */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">狀態篩選：</span>
                        {['全部', '未開始', '進行中', '已完成'].map((status, index) => (
                          <motion.button
                            key={status}
                            onClick={() => setSelectedActivityStatus(status)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              selectedActivityStatus === status
                                ? 'bg-purple-500 text-white border-purple-500 shadow-md' 
                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                          >
                            {status}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 活動列表 */}
                    <div className="space-y-4">
                      {(() => {
                        // 使用真實的學生活動數據，如果沒有數據則顯示空狀態
                        const activities = studentActivities || [];

                        // 顯示載入狀態
                        if (loadingActivities) {
                          return (
                            <motion.div
                              className="text-center py-12"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                            >
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
                              <p className="text-gray-500 text-lg">載入學生活動中...</p>
                            </motion.div>
                          );
                        }

                        // 篩選活動
                        const filteredActivities = activities.filter(activity => 
                          selectedActivityStatus === '全部' || activity.status === selectedActivityStatus
                        );

                        if (filteredActivities.length === 0) {
                          return (
                            <motion.div
                              className="text-center py-12"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                            >
                              <div className="text-gray-400 mb-4">
                                <BookOpen className="w-16 h-16 mx-auto" />
                              </div>
                              <p className="text-gray-500 text-lg">沒有找到符合「{selectedActivityStatus}」狀態的活動</p>
                              <p className="text-gray-400 text-sm mt-2">請嘗試選擇其他篩選條件</p>
                            </motion.div>
                          );
                        }

                        return filteredActivities.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 hover:bg-white/80 transition-all duration-300"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + index * 0.1 }}
                            whileHover={{ x: 5, scale: 1.02 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {/* 狀態指示器 */}
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    activity.status === '已完成' ? 'bg-green-400' :
                                    activity.status === '進行中' ? 'bg-blue-400' :
                                    activity.status === '未開始' ? 'bg-gray-400' :
                                    'bg-orange-400'
                                  }`} />
                                  <span className="text-xs text-gray-500 font-medium">
                                    {activity.status}
                                  </span>
                                </div>
                                
                                {/* 活動名稱 */}
                                <div>
                                  <h4 className="font-medium text-gray-800">{activity.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-xs text-gray-500">難度 {activity.difficulty}</span>
                                    <span className="text-xs text-gray-500">{activity.type}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                {/* 進度條 */}
                                <div className="w-24">
                                  <div className="text-xs text-gray-500 mb-1">完成進度</div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full bg-gradient-to-r ${
                                        activity.progress >= 80 ? 'from-green-400 to-green-500' :
                                        activity.progress >= 40 ? 'from-blue-400 to-blue-500' :
                                        'from-orange-400 to-orange-500'
                                      } rounded-full`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${activity.progress}%` }}
                                      transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">{activity.progress}%</div>
                                </div>
                                
                                {/* 分配時間 */}
                                <div className="text-right">
                                  <div className="text-xs text-gray-500">分配時間</div>
                                  <div className="text-xs text-gray-700">{activity.assignedDate}</div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ));
                      })()}
                    </div>
                  </DynamicCard>
                </div>
              )}

              {activeSection === 'growth' && (
                <DynamicCard className="p-8" delay={0.4}>
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* 評估標題和圖標 */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-6">
                        {/* 成長樹圖標 */}
                        <motion.div
                          className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center shadow-lg"
                          whileHover={{ scale: 1.05, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <TreePine className="w-10 h-10 text-orange-500" />
                        </motion.div>
                        
                        {/* 評估信息 */}
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            學習目標進度
                          </h3>
                          <p className="text-gray-600 mb-4">學生學習進度追蹤</p>
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="text-sm text-gray-500">總進度</div>
                              <div className="text-2xl font-bold text-orange-500">{currentProgress.totalProgress}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-500">當前等級</div>
                              <div className="text-2xl font-bold text-gray-800">Lv.{currentProgress.currentLevel}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 日期選擇器 */}
                    <div className="mb-6">
                      <div className="bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] rounded-2xl p-6 border-2 border-[#EADBC8] shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-md">
                                <Calendar className="w-5 h-5 text-[#2B3A3B]" />
                              </div>
                              <span className="text-lg font-semibold text-[#4B4036]">選擇記錄日期</span>
                            </div>
                            <div className="w-72">
                              <HanamiSelect
                                options={availableDates.map(date => ({
                                  value: date,
                                  label: new Date(date).toLocaleDateString('zh-TW', {
                                    year: 'numeric',
                                    month: 'numeric',
                                    day: 'numeric'
                                  })
                                }))}
                                value={selectedDate || ''}
                                onChange={(value) => setSelectedDate(value)}
                                placeholder="請選擇日期"
                                icon={<Calendar size={16} />}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full px-4 py-2 shadow-md">
                            <span className="text-sm font-semibold text-[#2B3A3B]">
                              共 {availableDates.length} 筆記錄
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 進度條 */}
                    <div className="mb-8">
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${currentProgress.totalProgress}%` }}
                          transition={{ duration: 2, delay: 0.5 }}
                        />
                      </div>
                    </div>
                    
                    {/* 能力評估點點展示 */}
                    <div className="grid grid-cols-3 gap-8 mb-8">
                      {abilityProgress.length > 0 ? (
                        abilityProgress.map((ability, index) => (
                          <motion.div
                            key={ability.id}
                            className="text-center cursor-pointer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + (index * 0.1) }}
                            onClick={() => {
                              setSelectedAbility(ability.id);
                              setShowTrendModal(true);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="relative">
                              <motion.div
                                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg mx-auto mb-3 ${
                                  ability.status === 'completed' 
                                    ? 'bg-yellow-400' 
                                    : ability.status === 'in_progress' 
                                    ? 'bg-blue-400' 
                                    : 'bg-gray-300'
                                }`}
                                whileHover={{ scale: ability.status !== 'locked' ? 1.1 : 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                style={{ backgroundColor: ability.color }}
                              >
                                {ability.status === 'completed' ? (
                                  <Check className="w-8 h-8 text-white" />
                                ) : ability.status === 'in_progress' ? (
                                  <Target className="w-8 h-8 text-white" />
                                ) : (
                                  <Lock className="w-8 h-8 text-gray-500" />
                                )}
                              </motion.div>
                              {ability.status === 'in_progress' && (
                                <motion.div
                                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.8 + (index * 0.1), type: "spring" }}
                                >
                                  <Target className="w-3 h-3 text-white" />
                                </motion.div>
                              )}
                            </div>
                            <h4 className="font-semibold text-gray-800 mb-1">{ability.name}</h4>
                            <p className="text-sm text-gray-600">等級 {ability.level}/{ability.maxLevel} ({ability.progress}%)</p>
                            <p className="text-xs text-gray-500 mt-1">點擊查看趨勢</p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8">
                          <div className="text-gray-500 mb-2">
                            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">尚未有評估記錄</p>
                            <p className="text-sm">請先進行能力評估以查看學習進度</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 狀態指示器 */}
                    <div className="flex items-center justify-center space-x-8 mb-8">
                      <motion.div
                        className="flex items-center space-x-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4 }}
                      >
                        <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">未解鎖</span>
                      </motion.div>
                      
                      <motion.div
                        className="flex items-center space-x-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6 }}
                      >
                        <div className="w-4 h-4 border-2 border-gray-800 bg-white rounded-full"></div>
                        <span className="text-sm text-gray-800 font-medium">進行中</span>
                      </motion.div>
                      
                      <motion.div
                        className="flex items-center space-x-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.8 }}
                      >
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">已完成</span>
                      </motion.div>
                    </div>

                  </div>
                </DynamicCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 能力趨勢模態框 */}
      <AbilityTrendModal
        isOpen={showTrendModal}
        onClose={() => {
          setShowTrendModal(false);
          setSelectedAbility(null);
        }}
        ability={abilityProgress.find(a => a.id === selectedAbility) || null}
        studentId={student?.id || ''}
      />
    </div>
  );
}

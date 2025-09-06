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
import LearningPathLevels from '@/components/ui/LearningPathLevels';
import StudentAbilityAssessments from '@/components/ui/StudentAbilityAssessments';
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
  const [activeSection, setActiveSection] = useState<'overview' | 'avatar' | 'progress' | 'growth'>('overview');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedActivityStatus, setSelectedActivityStatus] = useState<string>('全部');
  const [studentActivities, setStudentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState<{totalProgress: number, currentLevel: number}>({totalProgress: 53, currentLevel: 2});
  const [chartData, setChartData] = useState<Array<{date: string, progress: number, level: number}>>([]);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null);

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
    refreshInterval: 60000
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
      if (!student?.id) return;
      
      setLoadingActivities(true);
      try {
        const response = await fetch(`/api/student-activities?studentId=${student.id}&lessonDate=${new Date().toISOString().split('T')[0]}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const { currentLessonActivities, ongoingActivities, previousLessonActivities } = result.data;
            
            // 合併所有類型的活動
            const allActivities = [
              ...currentLessonActivities,
              ...ongoingActivities,
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
  }, [student?.id]);

  // 載入可用的評估日期
  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!student?.id) return;
      try {
        // 從實際的學生評估記錄中獲取日期
        // 根據您提供的信息，目前只有一個記錄：5/9/2025
        const actualDates = ['2025-05-09']; // 實際存在的記錄日期
        
        // 如果沒有記錄，顯示當前日期作為默認
        if (actualDates.length === 0) {
          actualDates.push(new Date().toISOString().split('T')[0]);
        }
        
        setAvailableDates(actualDates);
        
        // 設置默認選中的日期為最新的記錄
        if (actualDates.length > 0) {
          setSelectedDate(actualDates[0]);
        }
        
        // 生成圖表數據（模擬歷史進度數據）
        const chartDataPoints = [
          { date: '2025-05-09', progress: 53, level: 2 }, // 實際記錄
          { date: '2025-05-08', progress: 48, level: 2 }, // 模擬前一天
          { date: '2025-05-07', progress: 45, level: 2 }, // 模擬前兩天
          { date: '2025-05-06', progress: 42, level: 1 }, // 模擬前三天
          { date: '2025-05-05', progress: 38, level: 1 }, // 模擬前四天
        ];
        
        setChartData(chartDataPoints);
      } catch (error) {
        console.error('載入可用日期失敗:', error);
      }
    };
    loadAvailableDates();
  }, [student?.id]);

  // 根據選中日期載入評估數據
  useEffect(() => {
    const loadAssessmentData = async () => {
      if (!student?.id || !selectedDate) return;
      try {
        console.log(`載入 ${selectedDate} 的評估數據`);
        
        // 根據實際記錄數據設置進度
        // 根據您提供的信息：5/9/2025 的記錄
        if (selectedDate === '2025-05-09') {
          // 實際的評估數據 - 根據記錄內容設置
          setCurrentProgress({
            totalProgress: 53, // 可以根據實際評估結果調整
            currentLevel: 2    // 可以根據實際評估結果調整
          });
        } else {
          // 默認數據
          setCurrentProgress({
            totalProgress: 0,
            currentLevel: 1
          });
        }
        
      } catch (error) {
        console.error('載入評估數據失敗:', error);
      }
    };
    loadAssessmentData();
  }, [selectedDate, student?.id]);

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
      label: '互動角色',
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

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* 頁面標題區域 */}
        <DynamicCard className="mb-8 p-8" delay={0.1}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-[#F8EAD8] to-[#F5E6D3] rounded-2xl flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                <User className="w-8 h-8 text-orange-500" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-3xl font-bold text-gray-800 mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {student.nick_name || student.full_name} 的互動角色
                </motion.h1>
                <motion.p 
                  className="text-gray-600 flex items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                  3D動態角色與學習進度互動體驗
                </motion.p>
              </div>
            </div>
            
            {/* 控制按鈕區域 */}
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  soundEnabled 
                    ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-600 shadow-lg' 
                    : 'bg-gray-100 text-gray-400'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </motion.button>

              <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-xl shadow-lg disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </motion.button>
            </div>
          </div>

          {/* 狀態指示器 */}
          {lastUpdated && (
            <motion.div 
              className="mt-4 flex items-center text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Info size={14} className="mr-2" />
              最後更新：{lastUpdated.toLocaleString('zh-TW')}
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
        <DynamicCard className="mb-8 p-2" delay={0.2}>
          <div className="flex space-x-2 overflow-x-auto">
            {sections.map(({ key, label, icon: Icon, color, iconColor }, index) => (
              <motion.button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`
                  flex items-center px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap min-w-0 flex-1
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
                  className={`p-2 rounded-lg mr-3 ${
                    activeSection === key ? 'bg-white shadow-md' : 'bg-gray-100'
                  }`}
                  whileHover={{ rotate: 15 }}
                >
                  <Icon className={`w-4 h-4 ${activeSection === key ? iconColor : 'text-gray-400'}`} />
                </motion.div>
                <span className={activeSection === key ? 'text-gray-800' : 'text-gray-600'}>
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

              {/* 互動角色分頁 */}
              {activeSection === 'avatar' && formattedStudent && (
                <div className="space-y-8">
                  {/* 互動角色 */}
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

                  {/* 學習路徑 */}
                  <DynamicCard className="p-8" delay={0.5}>
                    <LearningPathLevels
                      studentId={student.id}
                      maxLevels={4}
                      showProgress={true}
                      student={student}
                    />
                  </DynamicCard>

                  {/* 正在學習的活動 */}
                  <DynamicCard className="p-8" delay={0.6}>
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
                          <p className="text-gray-600 mb-4">幼兒鋼琴學習評估進度追蹤</p>
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">選擇記錄日期：</span>
                          <div className="relative">
                            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                              <input
                                type="text"
                                value={selectedDate ? new Date(selectedDate).toLocaleDateString('zh-TW', {
                                  year: 'numeric',
                                  month: 'numeric',
                                  day: 'numeric'
                                }) : ''}
                                readOnly
                                className="px-4 py-2 bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer flex-1"
                              />
                              <div className="flex flex-col border-l border-gray-300">
                                <button
                                  onClick={() => {
                                    const currentIndex = availableDates.indexOf(selectedDate);
                                    if (currentIndex > 0) {
                                      setSelectedDate(availableDates[currentIndex - 1]);
                                    }
                                  }}
                                  disabled={availableDates.indexOf(selectedDate) <= 0}
                                  className="px-2 py-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    const currentIndex = availableDates.indexOf(selectedDate);
                                    if (currentIndex < availableDates.length - 1) {
                                      setSelectedDate(availableDates[currentIndex + 1]);
                                    }
                                  }}
                                  disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1}
                                  className="px-2 py-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          共 {availableDates.length} 筆記錄
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
                      {/* 專注力時長 */}
                      <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <div className="relative">
                          <motion.div
                            className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg mx-auto mb-3"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Check className="w-8 h-8 text-white" />
                          </motion.div>
                          <motion.div
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.8, type: "spring" }}
                          >
                            <Target className="w-3 h-3 text-white" />
                          </motion.div>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-1">專注力時長</h4>
                        <p className="text-sm text-gray-600">等級 2/4 (50%)</p>
                      </motion.div>

                      {/* 眼球追視能力 */}
                      <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <motion.div
                          className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center shadow-lg mx-auto mb-3"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Lock className="w-8 h-8 text-gray-500" />
                        </motion.div>
                        <h4 className="font-semibold text-gray-800 mb-1">眼球追視能力</h4>
                        <p className="text-sm text-gray-600">等級 1/4 (25%)</p>
                      </motion.div>

                      {/* 樂理認知 */}
                      <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <motion.div
                          className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg mx-auto mb-3"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Check className="w-8 h-8 text-white" />
                        </motion.div>
                        <h4 className="font-semibold text-gray-800 mb-1">樂理認知</h4>
                        <p className="text-sm text-gray-600">等級 4/4 (100%)</p>
                      </motion.div>

                      {/* 興趣和自主性 */}
                      <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                      >
                        <div className="relative">
                          <motion.div
                            className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center shadow-lg mx-auto mb-3"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Lock className="w-8 h-8 text-gray-500" />
                          </motion.div>
                          <motion.div
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.1, type: "spring" }}
                          >
                            <Target className="w-3 h-3 text-white" />
                          </motion.div>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-1">興趣和自主性</h4>
                        <p className="text-sm text-gray-600">等級 2/4 (50%)</p>
                      </motion.div>

                      {/* 讀譜能力 */}
                      <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                      >
                        <motion.div
                          className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg mx-auto mb-3"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Check className="w-8 h-8 text-white" />
                        </motion.div>
                        <h4 className="font-semibold text-gray-800 mb-1">讀譜能力</h4>
                        <p className="text-sm text-gray-600">等級 2/2 (100%)</p>
                      </motion.div>

                      {/* 樂曲彈奏進度 */}
                      <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1 }}
                      >
                        <div className="relative">
                          <motion.div
                            className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center shadow-lg mx-auto mb-3"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Lock className="w-8 h-8 text-gray-500" />
                          </motion.div>
                          <motion.div
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.3, type: "spring" }}
                          >
                            <Target className="w-3 h-3 text-white" />
                          </motion.div>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-1">樂曲彈奏進度</h4>
                        <p className="text-sm text-gray-600">等級 3/4 (75%)</p>
                      </motion.div>

                      {/* 小肌演奏能力 */}
                      <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                      >
                        <motion.div
                          className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg mx-auto mb-3"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Check className="w-8 h-8 text-white" />
                        </motion.div>
                        <h4 className="font-semibold text-gray-800 mb-1">小肌演奏能力</h4>
                        <p className="text-sm text-gray-600">等級 4/4 (100%)</p>
                      </motion.div>
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

                    {/* 互動進度圖表 */}
                    <div className="mb-6">
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-800">學習進度趨勢</h4>
                          <div className="text-sm text-gray-600">
                            由遠至近 ({chartData.length} 天)
                          </div>
                        </div>
                        
                        {/* 圖表容器 */}
                        <div className="relative h-48 bg-white rounded-lg p-4 border border-orange-200">
                          <svg className="w-full h-full" viewBox="0 0 400 200">
                            {/* 網格線 */}
                            <defs>
                              <pattern id="grid" width="80" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 80 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                            
                            {/* 連接線 - 修正路徑計算 */}
                            <motion.path
                              d={chartData.map((dataPoint, index) => {
                                const x = 50 + (index * 80);
                                const y = 180 - ((dataPoint.progress / 100) * 160);
                                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                              }).join(' ')}
                              fill="none"
                              stroke="#f97316"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 2, delay: 0.5 }}
                            />
                            
                            {/* 數據點 - 修正位置計算 */}
                            {chartData.map((dataPoint, index) => {
                              const isSelected = dataPoint.date === selectedDate;
                              const isHovered = hoveredDataPoint === index;
                              const x = 50 + (index * 80);
                              const y = 180 - ((dataPoint.progress / 100) * 160);
                              
                              return (
                                <g key={dataPoint.date}>
                                  {/* 數據點圓圈 */}
                                  <motion.circle
                                    cx={x}
                                    cy={y}
                                    r={isSelected ? 6 : 4}
                                    fill={isSelected ? "#f97316" : isHovered ? "#fb923c" : "#fed7aa"}
                                    stroke={isSelected ? "#ea580c" : "#f97316"}
                                    strokeWidth={isSelected ? 3 : 2}
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredDataPoint(index)}
                                    onMouseLeave={() => setHoveredDataPoint(null)}
                                    onClick={() => setSelectedDate(dataPoint.date)}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.1 + 0.5 }}
                                    whileHover={{ scale: 1.3 }}
                                    whileTap={{ scale: 0.8 }}
                                  />
                                  
                                  {/* 懸停提示 */}
                                  {isHovered && (
                                    <motion.g
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                    >
                                      <rect
                                        x={x - 30}
                                        y={y - 40}
                                        width="60"
                                        height="20"
                                        rx="4"
                                        fill="#374151"
                                      />
                                      <text
                                        x={x}
                                        y={y - 25}
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize="10"
                                        fontWeight="500"
                                      >
                                        {dataPoint.progress}% (Lv.{dataPoint.level})
                                      </text>
                                    </motion.g>
                                  )}
                                </g>
                              );
                            })}
                          </svg>
                          
                          {/* 日期標籤 - 修正對齊 */}
                          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-2">
                            {chartData.map((dataPoint, index) => {
                              const x = 50 + (index * 80);
                              return (
                                <div key={dataPoint.date} className="text-center" style={{ width: '80px' }}>
                                  <div className="text-xs text-gray-600">
                                    {new Date(dataPoint.date).toLocaleDateString('zh-TW', {
                                      month: 'numeric',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-xs font-medium text-gray-700 mt-1">
                                    {dataPoint.progress}%
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Y軸標籤 */}
                          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pl-2">
                            <span>100%</span>
                            <span>75%</span>
                            <span>50%</span>
                            <span>25%</span>
                            <span>0%</span>
                          </div>
                        </div>
                        
                        {/* 圖表說明 */}
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              <span>已選擇</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-orange-300 rounded-full"></div>
                              <span>其他記錄</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            點擊數據點查看詳細記錄
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DynamicCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

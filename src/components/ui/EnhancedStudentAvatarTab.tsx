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
  Sparkles
} from 'lucide-react';
import { 
  StudentAvatarWidget, 
  GrowthTreeVisualization, 
  LearningProgressCards 
} from '@/components/ui';
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
      label: '學習進度',
      icon: TrendingUp,
      color: 'from-[#E8F2FF] to-[#E0EFFF]',
      iconColor: 'text-blue-500'
    },
    {
      key: 'growth',
      label: '成長樹',
      icon: TreePine,
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

                  {/* 學習統計 */}
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
                          label: '總體進度', 
                          value: `${studentStats?.overallProgress || 0}%`, 
                          icon: Target, 
                          color: 'from-green-100 to-green-200',
                          iconColor: 'text-green-500'
                        },
                        { 
                          label: '發展能力', 
                          value: studentStats?.totalAbilities || 0, 
                          icon: Award, 
                          color: 'from-purple-100 to-purple-200',
                          iconColor: 'text-purple-500'
                        },
                        { 
                          label: '成長樹數量', 
                          value: studentStats?.activeGrowthTrees || 0, 
                          icon: TreePine, 
                          color: 'from-orange-100 to-orange-200',
                          iconColor: 'text-orange-500'
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

                  {/* 正在學習的活動 */}
                  <DynamicCard className="lg:col-span-3 p-8" delay={0.6}>
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
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
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
                      {[
                        {
                          id: '1',
                          name: '1102-認識AG音',
                          status: '未開始',
                          difficulty: 1,
                          type: '琴譜',
                          progress: 0,
                          assignedDate: '2025/8/28'
                        },
                        {
                          id: '2',
                          name: '1011.ABC(NEW)',
                          status: '未開始',
                          difficulty: 1,
                          type: '琴譜',
                          progress: 0,
                          assignedDate: '2025/8/28'
                        },
                        {
                          id: '3',
                          name: '1005.Joy on the Piano改',
                          status: '進行中',
                          difficulty: 2,
                          type: '練習',
                          progress: 45,
                          assignedDate: '2025/8/25'
                        },
                        {
                          id: '4',
                          name: '0007-CDEFG五手指齊挑戰',
                          status: '已完成',
                          difficulty: 3,
                          type: '挑戰',
                          progress: 100,
                          assignedDate: '2025/8/20'
                        }
                      ].map((activity, index) => (
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
                                  'bg-gray-400'
                                }`} />
                                <span className="text-xs text-gray-500 font-medium">
                                  {activity.status}
                                </span>
                              </div>
                              
                              {/* 活動名稱 */}
                              <div>
                                <h4 className="font-medium text-gray-800">{activity.name}</h4>
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
                                      'from-gray-400 to-gray-500'
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
                      ))}
                    </div>
                    
                    {/* 選擇活動按鈕 */}
                    <motion.div
                      className="mt-6 flex justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      <motion.button
                        className="px-6 py-3 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-medium shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        選擇活動
                      </motion.button>
                    </motion.div>
                  </DynamicCard>
                </div>
              )}

              {/* 其他分頁內容保持原有邏輯 */}
              {activeSection === 'avatar' && formattedStudent && (
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
              )}

              {activeSection === 'progress' && (
                <DynamicCard className="p-8" delay={0.4}>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                      <motion.div
                        className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-3"
                        whileHover={{ rotate: 15 }}
                      >
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                      </motion.div>
                      學習進度詳細資訊
                    </h3>
                    
                    {/* 狀態篩選器 */}
                    <div className="flex items-center space-x-2 mb-6">
                      <span className="text-sm text-gray-600">篩選：</span>
                      {['全部', '未開始', '進行中', '已完成', '跨多個課堂'].map((status, index) => (
                        <motion.button
                          key={status}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          {status}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 活動列表 */}
                  <div className="space-y-4">
                    {[
                      {
                        id: '1',
                        name: '1102-認識AG音',
                        status: '未開始',
                        difficulty: 1,
                        type: '琴譜',
                        progress: 0,
                        assignedDate: '2025/8/28',
                        description: '學習認識A和G音的基本概念'
                      },
                      {
                        id: '2',
                        name: '1011.ABC(NEW)',
                        status: '未開始',
                        difficulty: 1,
                        type: '琴譜',
                        progress: 0,
                        assignedDate: '2025/8/28',
                        description: 'ABC歌曲的新版本練習'
                      },
                      {
                        id: '3',
                        name: '1005.Joy on the Piano改',
                        status: '進行中',
                        difficulty: 2,
                        type: '練習',
                        progress: 45,
                        assignedDate: '2025/8/25',
                        description: '鋼琴上的快樂改編版本'
                      },
                      {
                        id: '4',
                        name: '0007-CDEFG五手指齊挑戰',
                        status: '已完成',
                        difficulty: 3,
                        type: '挑戰',
                        progress: 100,
                        assignedDate: '2025/8/20',
                        description: 'CDEFG五個手指的協調挑戰'
                      },
                      {
                        id: '5',
                        name: '0006-銅鼓下的白鍵',
                        status: '跨多個課堂',
                        difficulty: 2,
                        type: '練習',
                        progress: 75,
                        assignedDate: '2025/8/15',
                        description: '銅鼓伴奏下的白鍵練習'
                      }
                    ].map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:bg-white transition-all duration-300 shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            {/* 狀態指示器 */}
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded-full ${
                                activity.status === '已完成' ? 'bg-green-400' :
                                activity.status === '進行中' ? 'bg-blue-400' :
                                activity.status === '跨多個課堂' ? 'bg-purple-400' :
                                'bg-gray-400'
                              }`} />
                              <span className="text-sm font-medium text-gray-600">
                                {activity.status}
                              </span>
                            </div>
                            
                            {/* 活動名稱 */}
                            <div>
                              <h4 className="text-lg font-bold text-gray-800">{activity.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            {/* 難度和類型 */}
                            <div className="text-center">
                              <div className="text-xs text-gray-500">難度</div>
                              <div className="text-lg font-bold text-gray-800">{activity.difficulty}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">類型</div>
                              <div className="text-sm font-medium text-gray-700">{activity.type}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {/* 進度條 */}
                          <div className="flex-1 mr-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">完成進度</span>
                              <span className="text-sm font-bold text-gray-800">{activity.progress}%</span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full bg-gradient-to-r ${
                                  activity.progress >= 80 ? 'from-green-400 to-green-500' :
                                  activity.progress >= 40 ? 'from-blue-400 to-blue-500' :
                                  'from-gray-400 to-gray-500'
                                } rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${activity.progress}%` }}
                                transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                              />
                            </div>
                          </div>
                          
                          {/* 分配時間 */}
                          <div className="text-right">
                            <div className="text-xs text-gray-500">分配時間</div>
                            <div className="text-sm font-medium text-gray-700">{activity.assignedDate}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </DynamicCard>
              )}

              {activeSection === 'growth' && data && (
                <DynamicCard className="p-8" delay={0.4}>
                  <GrowthTreeVisualization
                    studentId={student.id}
                    treeData={data.growthTrees}
                    variant="detailed"
                    onNodeClick={handleNodeClick}
                  />
                  
                  {/* 選中節點詳情 */}
                  <AnimatePresence>
                    {selectedNode && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="mt-8 p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-800 flex items-center">
                            <Target className="w-5 h-5 mr-2 text-orange-500" />
                            選中節點詳情
                          </h4>
                          <motion.button
                            onClick={clearSelection}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            ✕
                          </motion.button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><strong>名稱:</strong> {selectedNode.name}</div>
                          <div><strong>等級:</strong> {selectedNode.level + 1}</div>
                          <div><strong>進度:</strong> {selectedNode.progress}/{selectedNode.maxProgress}</div>
                          <div><strong>狀態:</strong> {
                            selectedNode.isCompleted ? '已完成' : 
                            selectedNode.isUnlocked ? '進行中' : '未解鎖'
                          }</div>
                        </div>
                        {selectedNode.description && (
                          <div className="mt-3 text-sm text-gray-600">
                            <strong>描述:</strong> {selectedNode.description}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </DynamicCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

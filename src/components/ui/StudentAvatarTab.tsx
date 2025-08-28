'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  VolumeX
} from 'lucide-react';
import { 
  StudentAvatarWidget, 
  GrowthTreeVisualization, 
  LearningProgressCards 
} from '@/components/ui';
import { useStudentAvatarData, useGrowthTreeInteraction } from '@/hooks/useStudentAvatarData';

interface StudentAvatarTabProps {
  student: any;
  className?: string;
}

export default function StudentAvatarTab({ student, className = '' }: StudentAvatarTabProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'avatar' | 'progress' | 'growth'>('overview');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'vertical'>('grid');

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
    refreshInterval: 60000 // 1分鐘
  });

  // 成長樹互動
  const {
    selectedNode,
    handleNodeClick,
    clearSelection
  } = useGrowthTreeInteraction(student?.id);

  // 處理分頁切換
  const handleSectionChange = (section: typeof activeSection) => {
    setActiveSection(section);
    clearSelection(); // 清除成長樹選擇
  };

  // 格式化學生資料以符合元件需求
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
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-hanami-text-secondary mb-4" />
          <p className="text-hanami-text-secondary">無法載入學生資料</p>
        </div>
      </div>
    );
  }

  const sections = [
    {
      key: 'overview',
      label: '綜合視圖',
      icon: Star,
      description: '學生整體狀況一覽'
    },
    {
      key: 'avatar',
      label: '互動角色',
      icon: User,
      description: '3D角色互動體驗'
    },
    {
      key: 'progress',
      label: '學習進度',
      icon: TrendingUp,
      description: '詳細學習進度追蹤'
    },
    {
      key: 'growth',
      label: '成長樹',
      icon: TreePine,
      description: '能力發展視覺化'
    }
  ] as const;

  return (
    <div className={`bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-2xl p-6 border border-[#EADBC8] ${className}`}>
      {/* 頁面標題和控制 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-hanami-text flex items-center">
              <User className="w-6 h-6 mr-3 text-hanami-primary" />
              {student.nick_name || student.full_name} 的互動角色
            </h2>
            <p className="text-hanami-text-secondary mt-1">
              3D動態角色與學習進度互動體驗
            </p>
          </div>
          
          {/* 控制按鈕 */}
          <div className="flex items-center space-x-3">
            {/* 音效控制 */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`
                p-2 rounded-xl transition-colors
                ${soundEnabled 
                  ? 'bg-hanami-primary text-hanami-text' 
                  : 'bg-hanami-border text-hanami-text-secondary'
                }
              `}
              title={soundEnabled ? '關閉音效' : '開啟音效'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* 佈局切換 */}
            <button
              onClick={() => setLayoutMode(layoutMode === 'grid' ? 'vertical' : 'grid')}
              className="p-2 bg-white hover:bg-[#FFD59A]/20 rounded-xl border border-[#EADBC8] transition-colors"
              title="切換佈局"
            >
              <PlayCircle size={18} className="text-hanami-text" />
            </button>

            {/* 刷新按鈕 */}
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 bg-white hover:bg-[#FFD59A]/20 rounded-xl border border-[#EADBC8] transition-colors disabled:opacity-50"
              title="刷新資料"
            >
              <RefreshCw size={18} className={`text-hanami-text ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 資料狀態指示 */}
        {lastUpdated && (
          <div className="flex items-center text-xs text-hanami-text-secondary">
            <Info size={12} className="mr-1" />
            最後更新：{lastUpdated.toLocaleString('zh-TW')}
            {isDataStale && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded">
                資料可能已過期
              </span>
            )}
          </div>
        )}
      </div>

      {/* 分頁導航 */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-[#EADBC8]/30 rounded-xl p-1 overflow-x-auto">
          {sections.map(({ key, label, icon: Icon, description }) => (
            <motion.button
              key={key}
              onClick={() => handleSectionChange(key)}
              className={`
                flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                ${activeSection === key
                  ? 'bg-[#FFD59A] text-[#2B3A3B] shadow-sm'
                  : 'text-[#2B3A3B]/70 hover:text-[#2B3A3B] hover:bg-white/50'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title={description}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 分頁內容 */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {/* 載入狀態 */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-hanami-primary mb-4" />
            <p className="text-hanami-text-secondary">載入學生資料中...</p>
          </div>
        )}

        {/* 錯誤狀態 */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] rounded-xl text-[#2B3A3B] transition-colors"
            >
              重試載入
            </button>
          </div>
        )}

        {/* 綜合視圖 */}
        {activeSection === 'overview' && !loading && !error && (
          <div className={`
            ${layoutMode === 'grid' 
              ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' 
              : 'space-y-6'
            }
          `}>
            {/* 3D 角色區域 */}
            <div className={layoutMode === 'vertical' ? 'order-1' : ''}>
              <h3 className="text-lg font-bold text-hanami-text mb-4">互動角色</h3>
              {formattedStudent && (
                <StudentAvatarWidget
                  student={formattedStudent}
                  size="md"
                  enableSound={soundEnabled}
                  className="mx-auto"
                />
              )}
            </div>

            {/* 學習統計 */}
            <div className={layoutMode === 'vertical' ? 'order-2' : ''}>
              <h3 className="text-lg font-bold text-hanami-text mb-4">學習統計</h3>
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-xl border border-[#EADBC8]">
                  <div className="flex items-center justify-between">
                    <span className="text-hanami-text-secondary">總體進度</span>
                    <span className="text-xl font-bold text-hanami-primary">
                      {studentStats?.overallProgress || 0}%
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-[#EADBC8]">
                  <div className="flex items-center justify-between">
                    <span className="text-hanami-text-secondary">發展能力</span>
                    <span className="text-xl font-bold text-hanami-text">
                      {studentStats?.totalAbilities || 0}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-[#EADBC8]">
                  <div className="flex items-center justify-between">
                    <span className="text-hanami-text-secondary">成長樹數量</span>
                    <span className="text-xl font-bold text-hanami-accent">
                      {studentStats?.activeGrowthTrees || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 快速進度 */}
            <div className={`${layoutMode === 'grid' ? 'lg:col-span-1' : 'order-3'}`}>
              <h3 className="text-lg font-bold text-hanami-text mb-4">近期活動</h3>
              <LearningProgressCards
                studentId={student.id}
                variant="compact"
                maxItems={3}
              />
            </div>
          </div>
        )}

        {/* 互動角色分頁 */}
        {activeSection === 'avatar' && !loading && !error && formattedStudent && (
          <div className="max-w-md mx-auto">
            <StudentAvatarWidget
              student={formattedStudent}
              size="lg"
              enableSound={soundEnabled}
              className="mx-auto"
            />
            
            {/* 角色說明 */}
            <div className="mt-6 p-4 bg-white rounded-xl border border-[#EADBC8]">
              <h4 className="font-bold text-hanami-text mb-2">💡 互動提示</h4>
              <ul className="text-sm text-hanami-text-secondary space-y-1">
                <li>• 點擊角色查看可愛的互動動畫</li>
                <li>• 角色會根據學生性別自動調整</li>
                <li>• 展開詳細資訊查看更多內容</li>
                <li>• 所有互動都會被記錄用於統計</li>
              </ul>
            </div>
          </div>
        )}

        {/* 學習進度分頁 */}
        {activeSection === 'progress' && !loading && !error && (
          <LearningProgressCards
            studentId={student.id}
            variant="detailed"
            maxItems={10}
          />
        )}

        {/* 成長樹分頁 */}
        {activeSection === 'growth' && !loading && !error && data && (
          <div>
            <GrowthTreeVisualization
              studentId={student.id}
              treeData={data.growthTrees}
              variant="detailed"
              onNodeClick={handleNodeClick}
            />
            
            {/* 選中節點詳情 */}
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-hanami-primary/10 rounded-xl border border-hanami-primary/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-hanami-text">選中節點詳情</h4>
                  <button
                    onClick={clearSelection}
                    className="text-hanami-text-secondary hover:text-hanami-text"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div><strong>名稱:</strong> {selectedNode.name}</div>
                  <div><strong>描述:</strong> {selectedNode.description}</div>
                  <div><strong>等級:</strong> {selectedNode.level + 1}</div>
                  <div><strong>進度:</strong> {selectedNode.progress}/{selectedNode.maxProgress}</div>
                  <div><strong>狀態:</strong> {
                    selectedNode.isCompleted ? '已完成' : 
                    selectedNode.isUnlocked ? '進行中' : '未解鎖'
                  }</div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* 空資料狀態 */}
        {!loading && !error && data && activeSection !== 'avatar' && (
          <>
            {activeSection === 'progress' && (!data.recentActivities.length && !data.upcomingLessons.length) && (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 mx-auto text-hanami-text-secondary mb-4" />
                <p className="text-hanami-text-secondary">尚無學習進度資料</p>
              </div>
            )}
            
            {activeSection === 'growth' && !data.growthTrees.length && (
              <div className="text-center py-12">
                <TreePine className="w-12 h-12 mx-auto text-hanami-text-secondary mb-4" />
                <p className="text-hanami-text-secondary">尚未設置成長樹</p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import StudentAvatarWidget from '@/components/ui/StudentAvatarWidget';
import GrowthTreeVisualization from '@/components/ui/GrowthTreeVisualization';
import LearningProgressCards from '@/components/ui/LearningProgressCards';

// 示例學生資料
const sampleStudents = [
  {
    id: '1',
    full_name: '張小明',
    nick_name: '小明',
    gender: 'male',
    student_age: 6,
    course_type: '兒童音樂基礎',
    ongoing_lessons: 12,
    upcoming_lessons: 4
  },
  {
    id: '2',
    full_name: '李小花',
    nick_name: '小花',
    gender: 'female',
    student_age: 8,
    course_type: '鋼琴入門',
    ongoing_lessons: 8,
    upcoming_lessons: 6
  },
  {
    id: '3',
    full_name: '王小強',
    nick_name: '小強',
    gender: 'male',
    student_age: 7,
    course_type: '音樂創作',
    ongoing_lessons: 15,
    upcoming_lessons: 3
  }
];

// 示例成長樹資料
const sampleGrowthTrees = [
  {
    id: '1',
    tree_name: '音樂基礎能力樹',
    tree_description: '培養基本音樂素養和技能',
    tree_icon: '🎵',
    nodes: [
      {
        id: 'node1',
        name: '節奏感知',
        description: '基礎節拍和節奏認知',
        level: 0,
        progress: 100,
        maxProgress: 100,
        isUnlocked: true,
        isCompleted: true,
        prerequisites: [],
        color: '#FFD59A'
      },
      {
        id: 'node2',
        name: '音高辨識',
        description: '不同音高的辨別能力',
        level: 0,
        progress: 80,
        maxProgress: 100,
        isUnlocked: true,
        isCompleted: false,
        prerequisites: [],
        color: '#EBC9A4'
      },
      {
        id: 'node3',
        name: '旋律模唱',
        description: '簡單旋律的模仿演唱',
        level: 1,
        progress: 60,
        maxProgress: 100,
        isUnlocked: true,
        isCompleted: false,
        prerequisites: ['node1', 'node2'],
        color: '#FFB6C1'
      },
      {
        id: 'node4',
        name: '節奏創作',
        description: '創造簡單的節奏型態',
        level: 1,
        progress: 40,
        maxProgress: 100,
        isUnlocked: true,
        isCompleted: false,
        prerequisites: ['node1'],
        color: '#E0F2E0'
      },
      {
        id: 'node5',
        name: '樂器演奏',
        description: '基礎樂器演奏技巧',
        level: 2,
        progress: 0,
        maxProgress: 100,
        isUnlocked: false,
        isCompleted: false,
        prerequisites: ['node3', 'node4'],
        color: '#FFE0E0'
      }
    ],
    totalProgress: 68,
    currentLevel: 2
  },
  {
    id: '2',
    tree_name: '創意表達能力樹',
    tree_description: '發展音樂創造力和表達能力',
    tree_icon: '🎨',
    nodes: [
      {
        id: 'creative1',
        name: '情感表達',
        description: '透過音樂表達情感',
        level: 0,
        progress: 90,
        maxProgress: 100,
        isUnlocked: true,
        isCompleted: false,
        prerequisites: [],
        color: '#FFD59A'
      },
      {
        id: 'creative2',
        name: '故事音樂',
        description: '為故事配上音樂',
        level: 1,
        progress: 50,
        maxProgress: 100,
        isUnlocked: true,
        isCompleted: false,
        prerequisites: ['creative1'],
        color: '#EBC9A4'
      }
    ],
    totalProgress: 70,
    currentLevel: 1
  }
];

export default function StudentAvatarDemoPage() {
  const [selectedStudent, setSelectedStudent] = useState(sampleStudents[0]);
  const [avatarSize, setAvatarSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [enableSound, setEnableSound] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'vertical' | 'horizontal'>('grid');
  const [showSettings, setShowSettings] = useState(false);

  const handleNodeClick = (node: any) => {
    console.log('點擊節點：', node);
    // 這裡可以添加節點點擊的處理邏輯
  };

  const resetDemo = () => {
    setSelectedStudent(sampleStudents[0]);
    setAvatarSize('md');
    setEnableSound(true);
    setLayoutMode('grid');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background via-hanami-surface to-hanami-primary/10 p-6">
      {/* 頁面標題 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-hanami-text mb-2">
              3D 動態角色元件展示
            </h1>
            <p className="text-hanami-text-secondary">
              展示學生角色互動、成長樹視覺化和學習進度追蹤功能
            </p>
          </div>
          
          {/* 控制按鈕 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-hanami-surface hover:bg-hanami-primary/20 rounded-xl border border-hanami-border transition-colors"
            >
              <Settings className="w-5 h-5 text-hanami-text" />
            </button>
            <button
              onClick={resetDemo}
              className="p-2 bg-hanami-surface hover:bg-hanami-primary/20 rounded-xl border border-hanami-border transition-colors"
            >
              <RotateCcw className="w-5 h-5 text-hanami-text" />
            </button>
          </div>
        </div>
      </div>

      {/* 設置面板 */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 p-4 bg-hanami-surface rounded-xl border border-hanami-border"
        >
          <h3 className="font-bold text-hanami-text mb-4">展示設置</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 學生選擇 */}
            <div>
              <label className="block text-sm font-medium text-hanami-text mb-2">
                選擇學生
              </label>
              <select
                value={selectedStudent.id}
                onChange={(e) => {
                  const student = sampleStudents.find(s => s.id === e.target.value);
                  if (student) setSelectedStudent(student);
                }}
                className="w-full p-2 border border-hanami-border rounded-lg bg-hanami-background"
              >
                {sampleStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.nick_name} ({student.full_name})
                  </option>
                ))}
              </select>
            </div>

            {/* 角色大小 */}
            <div>
              <label className="block text-sm font-medium text-hanami-text mb-2">
                角色大小
              </label>
              <select
                value={avatarSize}
                onChange={(e) => setAvatarSize(e.target.value as 'sm' | 'md' | 'lg')}
                className="w-full p-2 border border-hanami-border rounded-lg bg-hanami-background"
              >
                <option value="sm">小 (Small)</option>
                <option value="md">中 (Medium)</option>
                <option value="lg">大 (Large)</option>
              </select>
            </div>

            {/* 佈局模式 */}
            <div>
              <label className="block text-sm font-medium text-hanami-text mb-2">
                佈局模式
              </label>
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value as 'grid' | 'vertical' | 'horizontal')}
                className="w-full p-2 border border-hanami-border rounded-lg bg-hanami-background"
              >
                <option value="grid">網格佈局</option>
                <option value="vertical">垂直佈局</option>
                <option value="horizontal">水平佈局</option>
              </select>
            </div>

            {/* 音效開關 */}
            <div>
              <label className="block text-sm font-medium text-hanami-text mb-2">
                音效設置
              </label>
              <button
                onClick={() => setEnableSound(!enableSound)}
                className={`
                  w-full p-2 rounded-lg border transition-colors
                  ${enableSound 
                    ? 'bg-hanami-primary border-hanami-primary text-hanami-text' 
                    : 'bg-hanami-border border-hanami-border text-hanami-text-secondary'
                  }
                `}
              >
                {enableSound ? '音效開啟' : '音效關閉'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 主要展示區域 */}
      <div className={`
        ${layoutMode === 'grid' 
          ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' 
          : layoutMode === 'vertical'
            ? 'space-y-6'
            : 'flex flex-wrap gap-6'
        }
      `}>
        {/* 3D 角色區域 */}
        <motion.div
          layout
          className={`${layoutMode === 'horizontal' ? 'flex-shrink-0' : ''}`}
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-hanami-text mb-2 flex items-center">
              <User className="w-5 h-5 mr-2" />
              3D 動態角色
            </h2>
            <p className="text-sm text-hanami-text-secondary">
              點擊角色查看互動效果，根據學生性別顯示不同角色
            </p>
          </div>
          
          <StudentAvatarWidget
            student={selectedStudent}
            size={avatarSize}
            enableSound={enableSound}
            className="mx-auto"
          />
        </motion.div>

        {/* 成長樹區域 */}
        <motion.div
          layout
          className={`${layoutMode === 'grid' ? 'lg:col-span-2' : ''}`}
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-hanami-text mb-2">成長樹視覺化</h2>
            <p className="text-sm text-hanami-text-secondary">
              顯示學生的能力發展進度，支援多樹切換和互動
            </p>
          </div>
          
          <GrowthTreeVisualization
            studentId={selectedStudent.id}
            treeData={sampleGrowthTrees}
            variant="detailed"
            onNodeClick={handleNodeClick}
          />
        </motion.div>

        {/* 學習進度區域 */}
        <motion.div
          layout
          className={`${layoutMode === 'grid' ? 'lg:col-span-3' : ''}`}
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-hanami-text mb-2">學習進度卡片</h2>
            <p className="text-sm text-hanami-text-secondary">
              顯示學生的學習進度、近期活動、即將課程和獲得成就
            </p>
          </div>
          
          <LearningProgressCards
            studentId={selectedStudent.id}
            variant="detailed"
            maxItems={5}
          />
        </motion.div>
      </div>

      {/* 功能說明 */}
      <motion.div
        className="mt-12 p-6 bg-hanami-surface rounded-xl border border-hanami-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-bold text-hanami-text mb-4">元件功能說明</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-bold text-hanami-text mb-2">3D 動態角色</h4>
            <ul className="text-sm text-hanami-text-secondary space-y-1">
              <li>• 根據學生性別顯示不同角色</li>
              <li>• 點擊角色觸發互動動畫</li>
              <li>• 表情變化和音效回饋</li>
              <li>• 顯示基本學習統計</li>
              <li>• 支援三種尺寸（小、中、大）</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-hanami-text mb-2">成長樹視覺化</h4>
            <ul className="text-sm text-hanami-text-secondary space-y-1">
              <li>• 樹狀圖顯示能力發展路徑</li>
              <li>• 節點進度動畫和狀態顯示</li>
              <li>• 支援多樹切換</li>
              <li>• 懸停顯示詳細資訊</li>
              <li>• 響應式佈局設計</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-hanami-text mb-2">學習進度卡片</h4>
            <ul className="text-sm text-hanami-text-secondary space-y-1">
              <li>• 多標籤顯示不同內容</li>
              <li>• 進度條動畫效果</li>
              <li>• 活動類型分類顯示</li>
              <li>• 成就系統和稀有度</li>
              <li>• 即時資料更新</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* 技術資訊 */}
      <motion.div
        className="mt-6 p-4 bg-hanami-primary/10 rounded-xl border border-hanami-primary/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-hanami-text">技術實現</h4>
            <p className="text-sm text-hanami-text-secondary">
              使用 CSS 3D Transform + Framer Motion 實現 3D 效果，確保移動裝置效能優化
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-hanami-text-secondary">當前學生 ID</div>
            <div className="font-mono text-hanami-text">{selectedStudent.id}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

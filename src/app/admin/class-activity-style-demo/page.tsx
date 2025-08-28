'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Zap, Calendar, Users, Music, Award } from 'lucide-react';
import { EnhancedStudentAvatarTab, ClassActivityStyleCard } from '@/components/ui';

// 示例學生資料
const sampleStudents = [
  {
    id: '1',
    full_name: 'Helia',
    nick_name: 'Helia',
    gender: 'female',
    student_age: 20,
    course_type: '音樂專注力',
    ongoing_lessons: 0,
    upcoming_lessons: 0
  },
  {
    id: '2',
    full_name: 'Jack',
    nick_name: 'Jack (弟弟)',
    gender: 'male',
    student_age: 3,
    course_type: '鋼琴',
    ongoing_lessons: 1,
    upcoming_lessons: 2
  },
  {
    id: '3',
    full_name: 'Terence',
    nick_name: 'Terence',
    gender: 'male',
    student_age: 6,
    course_type: '鋼琴',
    ongoing_lessons: 1,
    upcoming_lessons: 3
  },
  {
    id: '4',
    full_name: '林俊佑',
    nick_name: '林俊佑',
    gender: 'male',
    student_age: 3,
    course_type: '鋼琴',
    ongoing_lessons: 3,
    upcoming_lessons: 1
  },
  {
    id: '5',
    full_name: 'Isla',
    nick_name: 'Isla (姐姐)',
    gender: 'female',
    student_age: 3,
    course_type: '鋼琴',
    ongoing_lessons: 1,
    upcoming_lessons: 2
  }
];

// 示例進度資料
const sampleProgressData = {
  overallProgress: 64,
  currentActivity: '0007-CDEFG五手指齊挑戰',
  nextTarget: '基礎和弦練習',
  recentActivities: [
    { name: '1005.Joy on the Piano改', type: 'creative', completion_date: '2025-08-26' },
    { name: '0007-CDEFG五手指齊挑戰', type: 'practice', completion_date: '2025-08-25' },
    { name: '0006-銅鼓 下的白鍵', type: 'assessment', completion_date: '2025-08-24' }
  ]
};

export default function ClassActivityStyleDemoPage() {
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState(sampleStudents[0]);
  const [viewMode, setViewMode] = useState<'cards' | 'enhanced'>('cards');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFCFB] via-[#FDF9F7] to-[#FCF6F3] relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-orange-300/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-200/30 to-purple-300/30 rounded-full blur-2xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-blue-300/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* 頁首 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
          
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-bold text-gray-800 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Calendar className="inline w-10 h-10 mr-3 text-orange-500" />
              課堂活動風格設計
              <Sparkles className="inline w-10 h-10 ml-3 text-purple-500" />
            </motion.h1>
            <motion.p 
              className="text-gray-600 text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              參考課堂活動管理頁面的視覺風格，加入動態動畫和按鍵回饋效果
            </motion.p>
          </div>
        </motion.div>

        {/* 模式切換器 */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200">
            <div className="flex space-x-2">
              {[
                { key: 'cards', label: '課堂活動卡片風格', icon: Calendar },
                { key: 'enhanced', label: '增強互動介面', icon: Zap }
              ].map(({ key, label, icon: Icon }) => (
                <motion.button
                  key={key}
                  onClick={() => setViewMode(key as any)}
                  className={`
                    flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300
                    ${viewMode === key
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 學生選擇器 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">選擇學生</h3>
          <div className="flex justify-center">
            <div className="flex space-x-2 overflow-x-auto pb-2 max-w-4xl">
              {sampleStudents.map((student, index) => (
                <motion.button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
                    ${selectedStudent.id === student.id
                      ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg'
                      : 'bg-white/80 text-gray-600 hover:bg-white border border-gray-200'
                    }
                  `}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${selectedStudent.id === student.id ? 'bg-white text-blue-500' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {student.student_age}歲
                  </div>
                  <span>{student.nick_name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 內容展示區域 */}
        <AnimatePresence mode="wait">
          {viewMode === 'cards' && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* 課堂活動風格卡片展示 */}
              <div className="lg:col-span-2">
                <motion.h3 
                  className="text-2xl font-bold text-gray-800 mb-6 flex items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Calendar className="w-6 h-6 mr-3 text-orange-500" />
                  課堂活動風格卡片
                </motion.h3>
                <ClassActivityStyleCard
                  student={selectedStudent}
                  progressData={sampleProgressData}
                />
              </div>

              {/* 設計特色說明 */}
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                    設計特色
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      溫暖的漸層背景色調
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      類似課堂活動的時間標籤
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      動態進度條和統計顯示
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      微動畫和懸停回饋效果
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      圓潤的現代化設計風格
                    </li>
                  </ul>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                    互動效果
                  </h4>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      懸停時卡片上浮和縮放
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      點擊時的觸覺回饋動畫
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      進度條的平滑填充動畫
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      圖標的旋轉和縮放效果
                    </li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          )}

          {viewMode === 'enhanced' && (
            <motion.div
              key="enhanced"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <motion.h3 
                className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Zap className="w-6 h-6 mr-3 text-yellow-500" />
                增強互動介面展示
              </motion.h3>
              <EnhancedStudentAvatarTab student={selectedStudent} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部色彩參考 */}
        <motion.div
          className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Award className="w-6 h-6 mr-3 text-green-500" />
            🎨 課堂活動風格色彩參考
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: '溫暖橙色', color: '#F8EAD8', desc: '主要背景色' },
              { name: '柔和棕色', color: '#F5E6D3', desc: '漸層中間色' },
              { name: '淺棕色', color: '#F2E0C8', desc: '漸層結束色' },
              { name: '邊框色', color: '#E8D5C4', desc: '卡片邊框' },
              { name: '頂部色', color: '#E8D5C4', desc: '頂部區域' },
              { name: '深棕色', color: '#E0C9B8', desc: '頂部漸層' },
              { name: '背景基色', color: '#FEFCFB', desc: '頁面背景' },
              { name: '中性背景', color: '#FDF9F7', desc: '背景漸層' }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.05 }}
              >
                <div 
                  className="w-full h-16 rounded-lg mb-2 border border-gray-200 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <div className="text-xs font-medium text-gray-800">{item.name}</div>
                <div className="text-xs text-gray-600 font-mono">{item.color}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

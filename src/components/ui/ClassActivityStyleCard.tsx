'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Music, Award, TrendingUp } from 'lucide-react';

interface ClassActivityStyleCardProps {
  student: {
    full_name: string;
    nick_name?: string;
    student_age?: number;
    course_type?: string;
    ongoing_lessons?: number;
  };
  progressData?: {
    overallProgress: number;
    currentActivity?: string;
    nextTarget?: string;
    recentActivities?: Array<{
      name: string;
      type: string;
      completion_date: string;
    }>;
  };
  className?: string;
}

export default function ClassActivityStyleCard({
  student,
  progressData,
  className = ''
}: ClassActivityStyleCardProps) {

  // 年齡徽章顏色
  const getAgeColor = (age?: number) => {
    if (!age) return 'bg-gray-100 text-gray-600';
    if (age <= 5) return 'bg-green-100 text-green-600';
    if (age <= 8) return 'bg-blue-100 text-blue-600';
    if (age <= 12) return 'bg-purple-100 text-purple-600';
    return 'bg-orange-100 text-orange-600';
  };

  // 進度條顏色
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-400 to-green-500';
    if (progress >= 60) return 'from-blue-400 to-blue-500';
    if (progress >= 40) return 'from-yellow-400 to-yellow-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <motion.div
      className={`bg-gradient-to-br from-[#F8EAD8] via-[#F5E6D3] to-[#F2E0C8] rounded-3xl shadow-lg border border-[#E8D5C4] overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* 頂部時間和日期區域 - 類似課堂活動卡片 */}
      <div className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-xs text-gray-500">今日學習</div>
              <div className="text-lg font-bold text-gray-800">
                {new Date().toLocaleDateString('zh-TW', {
                  month: 'numeric',
                  day: 'numeric'
                })}
              </div>
            </motion.div>

            <div>
              <div className="text-sm text-gray-600">學生</div>
              <div className="text-xl font-bold text-gray-800">
                {student.nick_name || student.full_name}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.div
              className={`px-3 py-1 rounded-full text-xs font-medium ${getAgeColor(student.student_age)}`}
              whileHover={{ scale: 1.05 }}
            >
              {student.student_age ? `${student.student_age}歲` : '年齡未知'}
            </motion.div>
            <motion.div
              className="p-2 bg-white/80 rounded-full"
              whileHover={{ rotate: 15 }}
            >
              <Music className="w-5 h-5 text-orange-500" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="p-6">
        {/* 學生資訊行 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 rounded-2xl flex items-center justify-center shadow-sm"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <span className="text-lg">👤</span>
            </motion.div>
            <div>
              <div className="font-bold text-gray-800">{student.full_name}</div>
              <div className="text-sm text-gray-600 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {student.course_type || '音樂課程'}
              </div>
            </div>
          </div>

          <motion.div
            className="text-right"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="text-xs text-gray-500">進行課程</div>
            <div className="text-2xl font-bold text-gray-800">
              {student.ongoing_lessons || 0}
            </div>
          </motion.div>
        </div>

        {/* 進度顯示 */}
        {progressData && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">總體進度</span>
                <span className="text-sm font-bold text-gray-800">
                  {progressData.overallProgress}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${getProgressColor(progressData.overallProgress)} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressData.overallProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* 當前活動 */}
            {progressData.currentActivity && (
              <motion.div
                className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  <span className="text-xs text-gray-500 font-medium">學習中活動</span>
                </div>
                <div className="text-sm font-medium text-gray-800">
                  {progressData.currentActivity}
                </div>
              </motion.div>
            )}

            {/* 近期活動列表 */}
            {progressData.recentActivities && progressData.recentActivities.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  近期活動
                </div>
                <div className="space-y-2">
                  {progressData.recentActivities.slice(0, 3).map((activity, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/40 backdrop-blur-sm rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${activity.type === 'creative' ? 'bg-purple-400' :
                          activity.type === 'practice' ? 'bg-blue-400' :
                            activity.type === 'assessment' ? 'bg-green-400' :
                              'bg-gray-400'
                          }`} />
                        <span className="text-sm text-gray-700">{activity.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.completion_date).toLocaleDateString('zh-TW')}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 底部動作按鈕 */}
        <motion.div
          className="mt-6 pt-4 border-t border-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl font-medium shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            查看詳細資訊
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
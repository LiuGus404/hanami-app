'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen, Users } from 'lucide-react';
import MultiCourseScheduleManagementPanel from '@/components/ui/MultiCourseScheduleManagementPanel';
import BackButton from '@/components/ui/BackButton';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import CourseManagementNavBar from '@/components/ui/CourseManagementNavBar';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';

function TeacherLinkScheduleContent() {
  const { organization, orgId } = useTeacherLinkOrganization();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 返回按鈕 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <BackButton href="/aihome/teacher-link/create" label="返回管理面板" />
        </motion.div>

        {/* 導航欄 */}
        <CourseManagementNavBar orgId={orgId} />

        {/* 標題區域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Calendar className="w-8 h-8 text-[#FFB6C1] mr-3" />
            </motion.div>
            <h1 className="text-4xl font-bold text-[#4B4036]">課程與課堂排期管理</h1>
          </div>
          <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
            整合課程類型、課程代碼與多課程時間表，在單一介面中協調教師、教室與套票優惠
          </p>
        </motion.div>

        {/* 功能卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {[
            {
              title: '課程類型',
              description: '建立可重用的課程架構，定義年齡層與難度',
              icon: BookOpen,
              color: 'from-[#FFB6C1] to-[#FFD59A]',
            },
            {
              title: '課程代碼',
              description: '管理班別、授課老師與教室安排',
              icon: Users,
              color: 'from-[#FFD59A] to-[#EBC9A4]',
            },
            {
              title: '多課程時間表',
              description: '在同一時段安排多個課程與教師，保持運作彈性',
              icon: Clock,
              color: 'from-[#EBC9A4] to-[#FFB6C1]',
            },
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.2 + index * 0.1,
                type: "spring",
                damping: 20,
                stiffness: 300
              }}
              whileHover={{ 
                y: -8, 
                scale: 1.03,
                boxShadow: "0 25px 50px rgba(255, 182, 193, 0.2)"
              }}
              className="relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-[#EADBC8] overflow-hidden group"
            >
              {/* 動態背景裝飾 */}
              <motion.div
                animate={{ 
                  background: [
                    `radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)`,
                    `radial-gradient(circle at 80% 80%, rgba(255, 213, 154, 0.1) 0%, transparent 50%)`,
                    `radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)`
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl"
              />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${card.color} p-1 shadow-lg`}
                  >
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <card.icon className="w-8 h-8 text-[#4B4036]" />
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-bold text-[#4B4036] group-hover:text-[#FFB6C1] transition-colors">
                    {card.title}
                  </h3>
              </div>
                <p className="text-sm text-[#2B3A3B] leading-relaxed">
                  {card.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 主要內容區域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-[#EADBC8] overflow-hidden"
        >
          <MultiCourseScheduleManagementPanel />
        </motion.div>
      </div>
    </div>
  );
}

export default function TeacherLinkCreateScheduleManagementPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/schedule-management">
      <WithPermissionCheck pageKey="schedule-management">
        <TeacherLinkScheduleContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}


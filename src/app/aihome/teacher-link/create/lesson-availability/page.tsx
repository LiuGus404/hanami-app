'use client';

import LessonAvailabilityPage from '@/app/admin/lesson-availability/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import BackButton from '@/components/ui/BackButton';
import CourseManagementNavBar from '@/components/ui/CourseManagementNavBar';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';

function TeacherLinkLessonAvailabilityContent() {
  const { orgId } = useTeacherLinkOrganization();

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
              <Clock className="w-8 h-8 text-[#FFB6C1] mr-3" />
            </motion.div>
            <h1 className="text-4xl font-bold text-[#4B4036]">多課程時間表</h1>
          </div>
          <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
            查看所有課程的時間安排，管理學生報名和課程可用性
          </p>
        </motion.div>

        {/* 主要內容區域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-[#EADBC8] overflow-hidden"
        >
          <LessonAvailabilityPage />
        </motion.div>
      </div>
    </div>
  );
}

export default function TeacherLinkCreateLessonAvailabilityPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/lesson-availability">
      <WithPermissionCheck pageKey="schedule-management">
        <TeacherLinkLessonAvailabilityContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}


'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import LearningPathsPage from '@/app/admin/student-progress/learning-paths/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import BackButton from '@/components/ui/BackButton';
import StudentProgressNavBar from '@/components/ui/StudentProgressNavBar';

function TeacherLinkLearningPathsContent() {
  const { orgId, organization, organizationResolved } = useTeacherLinkOrganization();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 返回按鈕 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <BackButton href="/aihome/teacher-link/create/student-progress" label="返回進度管理" />
        </motion.div>

        {/* 導航欄 */}
        {organizationResolved && <StudentProgressNavBar orgId={orgId} />}

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
              <TrendingUp className="w-8 h-8 text-[#FFB6C1] mr-3" />
            </motion.div>
            <h1 className="text-4xl font-bold text-[#4B4036]">學習路線管理</h1>
          </div>
          <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
            建立和管理學生的學習路線，規劃從成長樹活動到學習目標的完整路徑，引導學生循序漸進地達成學習目標
          </p>
        </motion.div>

        {/* 主要內容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-[#EADBC8] overflow-hidden"
        >
          <LearningPathsPage
            navigationOverrides={{
              dashboard: '/aihome/teacher-link/create/student-progress',
              growthTrees: '/aihome/teacher-link/create/student-progress/growth-trees',
              learningPaths: '/aihome/teacher-link/create/student-progress/learning-paths',
              abilities: '/aihome/teacher-link/create/student-progress/abilities',
              activities: '/aihome/teacher-link/create/student-progress/activities',
              assessments: '/aihome/teacher-link/create/student-progress/ability-assessments',
              media: '/aihome/teacher-link/create/student-progress/student-media',
              studentManagement: '/aihome/teacher-link/create/students',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default function TeacherLinkLearningPathsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress/learning-paths">
      <TeacherLinkLearningPathsContent />
    </TeacherLinkShell>
  );
}



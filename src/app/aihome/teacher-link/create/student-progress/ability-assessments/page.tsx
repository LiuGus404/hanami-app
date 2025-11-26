'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import AbilityAssessmentsPage from '@/app/admin/student-progress/ability-assessments/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import BackButton from '@/components/ui/BackButton';
import StudentProgressNavBar from '@/components/ui/StudentProgressNavBar';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TeacherLinkAbilityAssessmentsContent() {
  const { orgId, organization, organizationResolved } = useTeacherLinkOrganization();

  const resolvedOrgId =
    orgId &&
    UUID_REGEX.test(orgId) &&
    orgId !== 'unassigned-org-placeholder'
      ? orgId
      : organization?.id && UUID_REGEX.test(organization.id)
        ? organization.id
        : null;

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
        {organizationResolved && <StudentProgressNavBar orgId={resolvedOrgId} />}

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
              <Users className="w-8 h-8 text-[#FFB6C1] mr-3" />
            </motion.div>
            <h1 className="text-4xl font-bold text-[#4B4036]">能力評估管理</h1>
          </div>
          <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
            建立和管理學生的能力評估記錄，追蹤各項發展能力的進步情況，為教學調整提供數據支持
          </p>
        </motion.div>

        {/* 主要內容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-[#EADBC8] overflow-hidden"
        >
          <AbilityAssessmentsPage
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
            forcedOrgId={resolvedOrgId}
            forcedOrgName={organization?.name ?? null}
            disableOrgFallback
          />
        </motion.div>
      </div>
    </div>
  );
}

export default function TeacherLinkAbilityAssessmentsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress/ability-assessments">
      <WithPermissionCheck pageKey="progress">
        <TeacherLinkAbilityAssessmentsContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}


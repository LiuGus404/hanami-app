'use client';

import { motion } from 'framer-motion';
import { Video } from 'lucide-react';
import StudentMediaPage from '@/app/admin/student-progress/student-media/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import BackButton from '@/components/ui/BackButton';
import StudentProgressNavBar from '@/components/ui/StudentProgressNavBar';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TeacherLinkStudentMediaContent() {
  const { orgId, organization, organizationResolved } = useTeacherLinkOrganization();

  const resolvedOrgId =
    orgId &&
    UUID_REGEX.test(orgId) &&
    orgId !== 'unassigned-org-placeholder'
      ? orgId
      : organization?.id && UUID_REGEX.test(organization.id)
        ? organization.id
        : null;
  const ALLOWED_ORG_ID = 'f8d269ec-b682-45d1-a796-3b74c2bf3eec';

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
              <Video className="w-8 h-8 text-[#FFB6C1] mr-3" />
            </motion.div>
            <h1 className="text-4xl font-bold text-[#4B4036]">學生媒體管理</h1>
          </div>
          <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
            管理學生的課堂照片和影片，記錄學習過程中的精彩瞬間，為家長和學生提供視覺化的學習成果展示
          </p>
        </motion.div>

        {/* 主要內容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-[#EADBC8] overflow-hidden"
        >
          {resolvedOrgId === ALLOWED_ORG_ID ? (
            <StudentMediaPage
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
              preferServiceApiForStudents
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-lg font-semibold text-[#4B4036] mb-2">
                功能暫未開放
              </p>
              <p className="text-sm text-[#2B3A3B]">
                若有企業需求請聯繫{' '}
                <a
                  className="font-medium text-[#FFB6C1] underline hover:text-[#FFD59A]"
                  href="mailto:buildthink.ai@gmail.com"
                >
                  buildthink.ai@gmail.com
                </a>
                ，我們會將功能開放給貴單位。
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function TeacherLinkStudentMediaPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress/student-media">
      <TeacherLinkStudentMediaContent />
    </TeacherLinkShell>
  );
}


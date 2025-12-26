'use client';

import { motion } from 'framer-motion';
import StudentsPage from '@/app/admin/students/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import BackButton from '@/components/ui/BackButton';
import StudentManagementNavBar from '@/components/ui/StudentManagementNavBar';
import { UserGroupIcon, ExclamationTriangleIcon, ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';
import { useSubscriptionLimit } from '@/hooks/useSubscriptionLimit';
import Link from 'next/link';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TeacherLinkStudentsContent() {
  const { orgId, organization, organizationResolved, orgDataDisabled } = useTeacherLinkOrganization();

  const resolvedOrgId =
    orgId &&
      UUID_REGEX.test(orgId) &&
      orgId !== 'unassigned-org-placeholder'
      ? orgId
      : organization?.id && UUID_REGEX.test(organization.id)
        ? organization.id
        : null;

  // Check subscription limit for add/edit permissions
  const { canAdd, canEdit, currentCount, maxStudents, loading: limitLoading } = useSubscriptionLimit(resolvedOrgId);
  const isSubscriptionReadOnly = !canEdit && !limitLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 返回按鈕 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <BackButton href="/aihome/teacher-link/create" label="返回管理面板" />
        </motion.div>

        {/* 導航欄 */}
        <StudentManagementNavBar orgId={resolvedOrgId} />

        {/* 標題區域 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-xl p-6 sm:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-3xl flex items-center justify-center shadow-lg">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <UserGroupIcon className="w-8 h-8 text-white" />
                </motion.div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#4B4036]">學生資料管理</h1>
                <p className="mt-2 text-sm sm:text-base text-[#2B3A3B]/70 max-w-3xl leading-relaxed">
                  管理學生基本資料、課程資訊和學習進度。新增、編輯和查看所有學生的詳細資訊。
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 訂閱限制警告 */}
        {isSubscriptionReadOnly && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-amber-800 font-semibold text-lg flex items-center gap-2">
                  已超出學生上限
                </h3>
                <p className="text-amber-700 text-sm mt-1">
                  目前學生數量 ({currentCount}) 已超過方案上限 ({maxStudents})，學生資料處於只讀模式。
                </p>
                <Link
                  href="/aihome/teacher-link/create/student-pricing"
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <ArrowUpCircleIcon className="w-5 h-5" />
                  升級方案
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* 主要內容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-xl overflow-x-auto"
        >
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <StudentsPage
              navigationOverrides={{
                dashboard: '/aihome/teacher-link/create/student-progress',
                growthTrees: '/aihome/teacher-link/create/student-progress/growth-trees',
                learningPaths: '/aihome/teacher-link/create/student-progress/learning-paths',
                abilities: '/aihome/teacher-link/create/student-progress/abilities',
                activities: '/aihome/teacher-link/create/student-progress/activities',
                assessments: '/aihome/teacher-link/create/student-progress/ability-assessments',
                media: '/aihome/teacher-link/create/student-progress/student-media',
                studentManagement: '/aihome/teacher-link/create/students',
                newRegularStudent: '/aihome/teacher-link/create/students/new?type=regular',
                newTrialStudent: '/aihome/teacher-link/create/students/new?type=trial',
                editStudent: (studentId: string) => `/aihome/teacher-link/create/students/${studentId}`,
              }}
              isSubscriptionReadOnly={isSubscriptionReadOnly}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function TeacherLinkCreateStudentsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/students">
      <WithPermissionCheck pageKey="students">
        <TeacherLinkStudentsContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}


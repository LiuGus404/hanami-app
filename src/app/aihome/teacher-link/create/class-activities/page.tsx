'use client';

import ClassActivitiesPage from '@/app/admin/class-activities/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import CourseManagementNavBar from '@/components/ui/CourseManagementNavBar';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';
import { useSubscriptionLimit } from '@/hooks/useSubscriptionLimit';
import { ExclamationTriangleIcon, ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { motion } from 'framer-motion';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TeacherLinkClassActivitiesContent() {
  const { orgId, organization } = useTeacherLinkOrganization();

  const resolvedOrgId =
    orgId ??
    (organization?.id && UUID_REGEX.test(organization.id)
      ? organization.id
      : null);

  // Check subscription limit for add/edit permissions
  const { canEdit, currentCount, maxStudents, loading: limitLoading } = useSubscriptionLimit(resolvedOrgId);
  const isSubscriptionReadOnly = !canEdit && !limitLoading;

  return (
    <div className="px-4 py-4">
      <CourseManagementNavBar orgId={resolvedOrgId} />

      {/* 訂閱限制警告 */}
      {isSubscriptionReadOnly && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-md mb-4"
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

      <ClassActivitiesPage
        hideCalendarButton
        forcedOrgId={resolvedOrgId}
        forcedOrgName={organization?.name ?? null}
        disableOrgFallback
      />
    </div>
  );
}

export default function TeacherLinkCreateClassActivitiesPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/class-activities">
      <WithPermissionCheck pageKey="class-activities">
        <TeacherLinkClassActivitiesContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}

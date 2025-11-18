'use client';

import StudentProgressPage from '@/app/admin/student-progress/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import BackButton from '@/components/ui/BackButton';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TeacherLinkStudentProgressContent() {
  const { orgId, organization } = useTeacherLinkOrganization();

  const resolvedOrgId =
    orgId ??
    (organization?.id && UUID_REGEX.test(organization.id)
      ? organization.id
      : null);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <BackButton href="/aihome/teacher-link/create" label="返回老師主頁" />
      </div>
      <StudentProgressPage
        forcedOrgId={resolvedOrgId}
        forcedOrgName={organization?.name ?? null}
        disableOrgFallback
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
    </div>
  );
}

export default function TeacherLinkCreateStudentProgressPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress">
      <TeacherLinkStudentProgressContent />
    </TeacherLinkShell>
  );
}

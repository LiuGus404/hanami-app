'use client';

import StudentsPage from '@/app/admin/students/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import BackButton from '@/components/ui/BackButton';

function TeacherLinkStudentsContent() {
  const { orgDataDisabled } = useTeacherLinkOrganization();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <BackButton href="/aihome/teacher-link/create" label="返回老師主頁" />
      </div>
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
      />
    </div>
  );
}

export default function TeacherLinkCreateStudentsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/students">
      <TeacherLinkStudentsContent />
    </TeacherLinkShell>
  );
}


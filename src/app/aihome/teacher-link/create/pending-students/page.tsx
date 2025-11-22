'use client';

import PendingStudentsPage from '@/app/admin/pending-students/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';

function TeacherLinkPendingStudentsContent() {
  const { orgId } = useTeacherLinkOrganization();

  return <PendingStudentsPage orgId={orgId} />;
}

export default function TeacherLinkCreatePendingStudentsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/pending-students">
      <TeacherLinkPendingStudentsContent />
    </TeacherLinkShell>
  );
}


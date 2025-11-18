'use client';

import PendingStudentsPage from '@/app/admin/pending-students/page';
import { TeacherLinkShell } from '../TeacherLinkShell';

export default function TeacherLinkCreatePendingStudentsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/pending-students">
      <PendingStudentsPage />
    </TeacherLinkShell>
  );
}


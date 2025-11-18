'use client';

import TeachersPage from '@/app/admin/teachers/page';
import { TeacherLinkShell } from '../TeacherLinkShell';

export default function TeacherLinkCreateTeachersPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/teachers">
      <TeachersPage />
    </TeacherLinkShell>
  );
}


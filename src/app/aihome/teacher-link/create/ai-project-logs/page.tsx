'use client';

import AdminPage from '@/app/admin/page';
import { TeacherLinkShell } from '../TeacherLinkShell';

export default function TeacherLinkCreateAiProjectLogsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/ai-project-logs">
      <AdminPage />
    </TeacherLinkShell>
  );
}

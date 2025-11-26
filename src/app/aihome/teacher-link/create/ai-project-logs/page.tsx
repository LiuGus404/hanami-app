'use client';

import AdminPage from '@/app/admin/page';
import { TeacherLinkShell } from '../TeacherLinkShell';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';

export default function TeacherLinkCreateAiProjectLogsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/ai-project-logs">
      <WithPermissionCheck pageKey="ai-project-logs">
        <AdminPage />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}

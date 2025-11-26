'use client';

import AiToolsPage from '@/app/admin/ai-tools/page';
import { TeacherLinkShell } from '../TeacherLinkShell';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';

export default function TeacherLinkCreateAiToolsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/ai-tools">
      <WithPermissionCheck pageKey="ai-tools">
        <AiToolsPage />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}


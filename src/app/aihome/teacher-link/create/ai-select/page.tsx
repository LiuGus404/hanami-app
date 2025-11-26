'use client';

import AiSelectPage from '@/app/admin/ai-select/page';
import { TeacherLinkShell } from '../TeacherLinkShell';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';

export default function TeacherLinkCreateAiSelectPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/ai-select">
      <WithPermissionCheck pageKey="ai-select">
        <AiSelectPage />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}


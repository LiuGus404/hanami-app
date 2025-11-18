'use client';

import AiToolsPage from '@/app/admin/ai-tools/page';
import { TeacherLinkShell } from '../TeacherLinkShell';

export default function TeacherLinkCreateAiToolsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/ai-tools">
      <AiToolsPage />
    </TeacherLinkShell>
  );
}


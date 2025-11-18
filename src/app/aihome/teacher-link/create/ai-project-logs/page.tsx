'use client';

import AiProjectLogsPage from '@/app/admin/ai-project-logs/page';
import { TeacherLinkShell } from '../TeacherLinkShell';

export default function TeacherLinkCreateAiProjectLogsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/ai-project-logs">
      <AiProjectLogsPage />
    </TeacherLinkShell>
  );
}


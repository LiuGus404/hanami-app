'use client';

import AiSelectPage from '@/app/admin/ai-select/page';
import { TeacherLinkShell } from '../TeacherLinkShell';

export default function TeacherLinkCreateAiSelectPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/ai-select">
      <AiSelectPage />
    </TeacherLinkShell>
  );
}


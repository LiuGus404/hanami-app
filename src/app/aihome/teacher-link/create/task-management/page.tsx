'use client';

import TaskManagementPage from '@/app/admin/task-management/page';
import { TeacherLinkShell } from '../TeacherLinkShell';

export default function TeacherLinkCreateTaskManagementPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/task-management">
      <TaskManagementPage />
    </TeacherLinkShell>
  );
}


'use client';

import PermissionManagementPage from '@/app/admin/permission-management/page';
import { TeacherLinkShell } from '../TeacherLinkShell';

export default function TeacherLinkCreatePermissionManagementPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/permission-management">
      <PermissionManagementPage />
    </TeacherLinkShell>
  );
}


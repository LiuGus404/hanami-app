'use client';

import PermissionManagementPage from '@/app/admin/permission-management/page';
import { TeacherLinkShell } from '../TeacherLinkShell';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';

export default function TeacherLinkCreatePermissionManagementPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/permission-management">
      <WithPermissionCheck pageKey="permission-management">
        <PermissionManagementPage />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}


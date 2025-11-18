'use client';

import FinancialManagementPage from '@/app/admin/financial-management/page';
import { TeacherLinkShell } from '../TeacherLinkShell';

export default function TeacherLinkCreateFinancialManagementPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/financial-management">
      <FinancialManagementPage />
    </TeacherLinkShell>
  );
}


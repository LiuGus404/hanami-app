'use client';

import LessonAvailabilityPage from '@/app/admin/lesson-availability/page';
import { TeacherLinkShell } from '../TeacherLinkShell';
import BackButton from '@/components/ui/BackButton';

export default function TeacherLinkCreateLessonAvailabilityPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/lesson-availability">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4">
          <BackButton href="/aihome/teacher-link/create" label="返回老師主頁" />
        </div>
        <LessonAvailabilityPage />
      </div>
    </TeacherLinkShell>
  );
}


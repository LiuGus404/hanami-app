'use client';

import StudentMediaPage from '@/app/admin/student-progress/student-media/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import StudentProgressPageTemplate from '@/components/ui/StudentProgressPageTemplate';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TeacherLinkStudentMediaContent() {
  const { orgId, organization } = useTeacherLinkOrganization();

  const resolvedOrgId =
    orgId &&
    UUID_REGEX.test(orgId) &&
    orgId !== 'unassigned-org-placeholder'
      ? orgId
      : organization?.id && UUID_REGEX.test(organization.id)
        ? organization.id
        : null;

  return (
    <StudentProgressPageTemplate
      title="學生媒體管理"
      subtitle="學生媒體"
      description="管理學生的課堂照片和影片，記錄學習過程中的精彩瞬間，為家長和學生提供視覺化的學習成果展示。"
      badge="媒體管理中心"
      illustration="/camera.png"
      illustrationAlt="媒體圖示"
      features={[
        {
          title: '照片影片管理',
          description: '上傳和管理學生的課堂照片和影片',
          icon: '/icons/music.PNG',
        },
        {
          title: '課程關聯',
          description: '將媒體與特定課程和日期關聯',
          icon: '/icons/book-elephant.PNG',
        },
        {
          title: '分享便捷',
          description: '方便地與家長分享學生的學習成果',
          icon: '/icons/clock.PNG',
        },
      ]}
      steps={[
        {
          step: 1,
          title: '選擇學生',
          description: '從學生列表中選擇要上傳媒體的學生。',
          icon: '/icons/book-elephant.PNG',
        },
        {
          step: 2,
          title: '選擇課程',
          description: '選擇媒體所屬的課程日期和時段。',
          icon: '/icons/music.PNG',
        },
        {
          step: 3,
          title: '上傳媒體',
          description: '點擊「上傳」按鈕，選擇要上傳的照片或影片檔案。',
          icon: '/camera.png',
        },
        {
          step: 4,
          title: '管理媒體',
          description: '在媒體庫中查看、編輯或刪除已上傳的媒體檔案。',
          icon: '/icons/clock.PNG',
        },
      ]}
      backHref="/aihome/teacher-link/create/student-progress"
      backLabel="返回進度管理"
      organizationName={organization?.name}
    >
      <StudentMediaPage
        navigationOverrides={{
          dashboard: '/aihome/teacher-link/create/student-progress',
          growthTrees: '/aihome/teacher-link/create/student-progress/growth-trees',
          learningPaths: '/aihome/teacher-link/create/student-progress/learning-paths',
          abilities: '/aihome/teacher-link/create/student-progress/abilities',
          activities: '/aihome/teacher-link/create/student-progress/activities',
          assessments: '/aihome/teacher-link/create/student-progress/ability-assessments',
          media: '/aihome/teacher-link/create/student-progress/student-media',
          studentManagement: '/aihome/teacher-link/create/students',
        }}
        forcedOrgId={resolvedOrgId}
        forcedOrgName={organization?.name ?? null}
        disableOrgFallback
      />
    </StudentProgressPageTemplate>
  );
}

export default function TeacherLinkStudentMediaPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress/student-media">
      <TeacherLinkStudentMediaContent />
    </TeacherLinkShell>
  );
}


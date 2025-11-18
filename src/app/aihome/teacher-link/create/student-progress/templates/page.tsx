'use client';

import TemplatesPage from '@/app/admin/student-progress/templates/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import StudentProgressPageTemplate from '@/components/ui/StudentProgressPageTemplate';

function TeacherLinkTemplatesContent() {
  const { orgId, organization } = useTeacherLinkOrganization();

  return (
    <StudentProgressPageTemplate
      title="範本管理"
      subtitle="範本"
      description="建立和管理教學活動範本，為您的機構創建標準化的活動範本，提高教學活動建立效率。"
      badge="範本管理中心"
      illustration="/icons/book-elephant.PNG"
      illustrationAlt="範本管理圖示"
      features={[
        {
          title: '範本建立',
          description: '快速建立標準化的教學活動範本',
          icon: '/icons/music.PNG',
        },
        {
          title: '欄位自訂',
          description: '靈活定義範本欄位和結構',
          icon: '/icons/book-elephant.PNG',
        },
        {
          title: '範本複製',
          description: '快速複製現有範本進行修改',
          icon: '/icons/clock.PNG',
        },
      ]}
      steps={[
        {
          step: 1,
          title: '建立範本',
          description: '點擊「新增範本」按鈕，開始建立新的教學活動範本。',
          icon: '/icons/book-elephant.PNG',
        },
        {
          step: 2,
          title: '定義欄位',
          description: '在範本建構器中添加和配置欄位，設定欄位類型、必填性等。',
          icon: '/icons/music.PNG',
        },
        {
          step: 3,
          title: '儲存範本',
          description: '完成範本設定後儲存，範本將可用於建立教學活動。',
          icon: '/icons/clock.PNG',
        },
      ]}
      backHref="/aihome/teacher-link/create/student-progress"
      backLabel="返回進度管理"
      organizationName={organization?.name}
    >
      <TemplatesPage
        navigationOverrides={{
          dashboard: '/aihome/teacher-link/create/student-progress',
          growthTrees: '/aihome/teacher-link/create/student-progress/growth-trees',
          learningPaths: '/aihome/teacher-link/create/student-progress/learning-paths',
          abilities: '/aihome/teacher-link/create/student-progress/abilities',
          activities: '/aihome/teacher-link/create/student-progress/activities',
          assessments: '/aihome/teacher-link/create/student-progress/ability-assessments',
          media: '/aihome/teacher-link/create/student-progress/student-media',
          studentManagement: '/aihome/teacher-link/create/students',
          templates: '/aihome/teacher-link/create/student-progress/templates',
        }}
        forcedOrgId={orgId}
        forcedOrgName={organization?.name ?? null}
        disableOrgFallback
      />
    </StudentProgressPageTemplate>
  );
}

export default function TeacherLinkTemplatesPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress/templates">
      <TeacherLinkTemplatesContent />
    </TeacherLinkShell>
  );
}


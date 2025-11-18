'use client';

import ActivitiesPage from '@/app/admin/student-progress/activities/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import StudentProgressPageTemplate from '@/components/ui/StudentProgressPageTemplate';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TeacherLinkActivitiesContent() {
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
      title="教學活動管理"
      subtitle="教學活動"
      description="建立和管理豐富的教學活動庫，包含遊戲、訓練、繪本等多種類型，為成長樹目標提供活動資源。"
      badge="活動管理中心"
      illustration="/star-icon.png"
      illustrationAlt="活動圖示"
      features={[
        {
          title: '活動類型豐富',
          description: '支援遊戲、訓練、繪本等多種活動',
          icon: '/star-icon.png',
        },
        {
          title: '範本快速建立',
          description: '使用範本快速建立標準化活動',
          icon: '/icons/book-elephant.PNG',
        },
        {
          title: '關聯成長樹',
          description: '將活動與成長樹目標連結',
          icon: '/icons/clock.PNG',
        },
      ]}
      steps={[
        {
          step: 1,
          title: '選擇範本',
          description: '選擇適合的活動範本（教案、繪本、遊戲、訓練等），或使用自訂範本。',
          icon: '/icons/book-elephant.PNG',
        },
        {
          step: 2,
          title: '填寫活動資訊',
          description: '輸入活動名稱、描述、類型、難度等級和所需時間等基本資訊。',
          icon: '/star-icon.png',
        },
        {
          step: 3,
          title: '設定活動內容',
          description: '根據範本填寫活動的詳細內容，包括教學步驟、所需道具、互動環節等。',
          icon: '/icons/clock.PNG',
        },
        {
          step: 4,
          title: '關聯目標',
          description: '在成長樹目標中選擇相關的教學活動，建立完整的學習路徑。',
          icon: '/tree ui.png',
        },
      ]}
      backHref="/aihome/teacher-link/create/student-progress"
      backLabel="返回進度管理"
      organizationName={organization?.name}
    >
      <ActivitiesPage
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
        forcedOrgId={resolvedOrgId}
        forcedOrgName={organization?.name ?? null}
        disableOrgFallback
      />
    </StudentProgressPageTemplate>
  );
}

export default function TeacherLinkActivitiesPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress/activities">
      <TeacherLinkActivitiesContent />
    </TeacherLinkShell>
  );
}


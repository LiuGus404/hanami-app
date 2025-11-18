'use client';

import AbilitiesPage from '@/app/admin/student-progress/abilities/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import StudentProgressPageTemplate from '@/components/ui/StudentProgressPageTemplate';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TeacherLinkAbilitiesContent() {
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
      title="發展能力圖卡"
      subtitle="發展能力"
      description="建立和管理學生的發展能力圖卡，定義各項能力的等級和分類，為成長樹目標提供能力基礎。"
      badge="能力管理中心"
      illustration="/icons/music.PNG"
      illustrationAlt="能力圖示"
      features={[
        {
          title: '能力分類清晰',
          description: '按類別組織各項發展能力',
          icon: '/icons/music.PNG',
        },
        {
          title: '等級靈活設定',
          description: '自訂能力等級和評估標準',
          icon: '/icons/book-elephant.PNG',
        },
        {
          title: '關聯成長樹',
          description: '將能力與成長樹目標連結',
          icon: '/icons/clock.PNG',
        },
      ]}
      steps={[
        {
          step: 1,
          title: '建立能力',
          description: '點擊「新增能力」按鈕，輸入能力名稱、描述、分類和最大等級。',
          icon: '/icons/music.PNG',
        },
        {
          step: 2,
          title: '設定分類',
          description: '使用「管理分類」功能建立或編輯能力分類，讓能力組織更清晰。',
          icon: '/icons/book-elephant.PNG',
        },
        {
          step: 3,
          title: '配置等級',
          description: '使用「管理等級」功能設定能力的等級標準和描述。',
          icon: '/icons/clock.PNG',
        },
        {
          step: 4,
          title: '關聯目標',
          description: '在成長樹目標中選擇所需的能力，建立完整的學習路徑。',
          icon: '/tree ui.png',
        },
      ]}
      backHref="/aihome/teacher-link/create/student-progress"
      backLabel="返回進度管理"
      organizationName={organization?.name}
    >
      <AbilitiesPage
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

export default function TeacherLinkAbilitiesPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress/abilities">
      <TeacherLinkAbilitiesContent />
    </TeacherLinkShell>
  );
}



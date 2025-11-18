'use client';

import AbilityAssessmentsPage from '@/app/admin/student-progress/ability-assessments/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import StudentProgressPageTemplate from '@/components/ui/StudentProgressPageTemplate';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function TeacherLinkAbilityAssessmentsContent() {
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
      title="能力評估管理"
      subtitle="能力評估"
      description="建立和管理學生的能力評估記錄，追蹤各項發展能力的進步情況，為教學調整提供數據支持。"
      badge="評估管理中心"
      illustration="/icons/music.PNG"
      illustrationAlt="評估圖示"
      features={[
        {
          title: '評估記錄完整',
          description: '詳細記錄每次能力評估的結果',
          icon: '/icons/music.PNG',
        },
        {
          title: '進度可視化',
          description: '圖表呈現能力發展趨勢',
          icon: '/icons/book-elephant.PNG',
        },
        {
          title: '歷史追蹤',
          description: '查看學生能力的歷史評估記錄',
          icon: '/icons/clock.PNG',
        },
      ]}
      steps={[
        {
          step: 1,
          title: '選擇學生',
          description: '從學生列表中選擇要進行能力評估的學生。',
          icon: '/icons/book-elephant.PNG',
        },
        {
          step: 2,
          title: '選擇能力',
          description: '選擇要評估的發展能力，可以一次評估多項能力。',
          icon: '/icons/music.PNG',
        },
        {
          step: 3,
          title: '進行評估',
          description: '根據學生的表現，選擇或輸入能力的等級和評估結果。',
          icon: '/icons/clock.PNG',
        },
        {
          step: 4,
          title: '查看記錄',
          description: '在評估記錄中查看學生的能力發展歷史和趨勢。',
          icon: '/tree ui.png',
        },
      ]}
      backHref="/aihome/teacher-link/create/student-progress"
      backLabel="返回進度管理"
      organizationName={organization?.name}
    >
      <AbilityAssessmentsPage
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

export default function TeacherLinkAbilityAssessmentsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress/ability-assessments">
      <TeacherLinkAbilityAssessmentsContent />
    </TeacherLinkShell>
  );
}


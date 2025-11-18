'use client';

import LearningPathsPage from '@/app/admin/student-progress/learning-paths/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import StudentProgressPageTemplate from '@/components/ui/StudentProgressPageTemplate';

function TeacherLinkLearningPathsContent() {
  const { organization } = useTeacherLinkOrganization();

  return (
    <StudentProgressPageTemplate
      title="學習路線管理"
      subtitle="學習路線"
      description="建立和管理學生的學習路線，規劃從成長樹活動到學習目標的完整路徑，引導學生循序漸進地達成學習目標。"
      badge="學習路線管理中心"
      illustration="/icons/book-elephant.PNG"
      illustrationAlt="學習路線圖示"
      features={[
        {
          title: '路線視覺化',
          description: '清晰呈現學習活動的順序和關聯',
          icon: '/icons/music.PNG',
        },
        {
          title: '活動排序',
          description: '靈活調整活動順序和優先級',
          icon: '/icons/book-elephant.PNG',
        },
        {
          title: '進度追蹤',
          description: '即時掌握學生在學習路線上的進度',
          icon: '/icons/clock.PNG',
        },
      ]}
      steps={[
        {
          step: 1,
          title: '選擇成長樹',
          description: '選擇要建立學習路線的成長樹，系統會載入該成長樹的所有活動。',
          icon: '/tree ui.png',
        },
        {
          step: 2,
          title: '建立路線',
          description: '使用「建立學習路線」功能，系統會自動根據活動順序建立路線。',
          icon: '/icons/book-elephant.PNG',
        },
        {
          step: 3,
          title: '調整順序',
          description: '在學習路線建構器中拖拽活動節點，調整學習順序和優先級。',
          icon: '/icons/music.PNG',
        },
        {
          step: 4,
          title: '分配給學生',
          description: '將學習路線分配給學生，開始追蹤他們的學習進度。',
          icon: '/icons/clock.PNG',
        },
      ]}
      backHref="/aihome/teacher-link/create/student-progress"
      backLabel="返回進度管理"
      organizationName={organization?.name}
    >
      <LearningPathsPage
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
      />
    </StudentProgressPageTemplate>
  );
}

export default function TeacherLinkLearningPathsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress/learning-paths">
      <TeacherLinkLearningPathsContent />
    </TeacherLinkShell>
  );
}



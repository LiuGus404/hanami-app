'use client';

import GrowthTreesPage from '@/app/admin/student-progress/growth-trees/page';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import StudentProgressPageTemplate from '@/components/ui/StudentProgressPageTemplate';

function TeacherLinkGrowthTreesContent() {
  const { organization } = useTeacherLinkOrganization();

  return (
    <StudentProgressPageTemplate
      title="成長樹管理"
      subtitle="成長樹"
      description="建立和管理教學成長樹，定義學習目標和發展路徑，為每位學生規劃個性化的學習旅程。"
      badge="成長樹管理中心"
      illustration="/tree ui.png"
      illustrationAlt="成長樹圖示"
      features={[
        {
          title: '成長樹一目了然',
          description: '視覺化呈現學習目標和進度',
          icon: '/icons/music.PNG',
        },
        {
          title: '目標靈活配置',
          description: '自訂學習目標和評估標準',
          icon: '/icons/book-elephant.PNG',
        },
        {
          title: '進度即時追蹤',
          description: '掌握每位學生的學習發展',
          icon: '/icons/clock.PNG',
        },
      ]}
      steps={[
        {
          step: 1,
          title: '建立成長樹',
          description: '點擊「新增成長樹」按鈕，輸入成長樹名稱、描述和基本設定。系統會自動使用預設圖案和主題色彩。',
          icon: '/tree ui.png',
        },
        {
          step: 2,
          title: '設定目標',
          description: '為成長樹添加學習目標，每個目標可以設定名稱、描述、進度條最大值和評估模式。',
          icon: '/apple-icon.svg',
        },
        {
          step: 3,
          title: '配置能力與活動',
          description: '為目標關聯所需的能力和相關教學活動，建立完整的學習路徑。',
          icon: '/icons/music.PNG',
        },
        {
          step: 4,
          title: '分配給學生',
          description: '將成長樹分配給適合的學生，開始追蹤他們的學習進度。',
          icon: '/icons/book-elephant.PNG',
        },
      ]}
      backHref="/aihome/teacher-link/create/student-progress"
      backLabel="返回進度管理"
      organizationName={organization?.name}
    >
      <GrowthTreesPage
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

export default function TeacherLinkGrowthTreesPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/student-progress/growth-trees">
      <TeacherLinkGrowthTreesContent />
    </TeacherLinkShell>
  );
}



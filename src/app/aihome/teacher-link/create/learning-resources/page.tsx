'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreePine, BookOpen, Gamepad2, GraduationCap, FileText } from 'lucide-react';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import BackButton from '@/components/ui/BackButton';
import GrowthTreesPage from '@/app/admin/student-progress/growth-trees/page';
import LearningPathsPage from '@/app/admin/student-progress/learning-paths/page';
import ActivitiesPage from '@/app/admin/student-progress/activities/page';
import AbilitiesPage from '@/app/admin/student-progress/abilities/page';
import TemplatesPage from '@/app/admin/student-progress/templates/page';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type ResourceType = 'growth-trees' | 'learning-paths' | 'activities' | 'abilities' | 'templates';

interface ResourceTab {
  id: ResourceType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const resourceTabs: ResourceTab[] = [
  {
    id: 'growth-trees',
    label: '成長樹管理',
    icon: <TreePine className="w-5 h-5" />,
    description: '建立和管理教學成長樹，定義學習目標和發展路徑',
  },
  {
    id: 'learning-paths',
    label: '學習路線管理',
    icon: <BookOpen className="w-5 h-5" />,
    description: '建立和管理學生的學習路線，規劃完整的學習路徑',
  },
  {
    id: 'activities',
    label: '教學活動管理',
    icon: <Gamepad2 className="w-5 h-5" />,
    description: '建立和管理豐富的教學活動庫，包含遊戲、訓練、繪本等',
  },
  {
    id: 'abilities',
    label: '發展能力圖卡',
    icon: <GraduationCap className="w-5 h-5" />,
    description: '建立和管理學生的發展能力圖卡，定義各項能力的等級',
  },
  {
    id: 'templates',
    label: '範本管理',
    icon: <FileText className="w-5 h-5" />,
    description: '建立和管理教學活動範本，創建標準化的活動範本',
  },
];

function LearningResourcesContent() {
  const { orgId, organization, organizationResolved } = useTeacherLinkOrganization();
  const [activeTab, setActiveTab] = useState<ResourceType>('growth-trees');

  const resolvedOrgId =
    orgId &&
    UUID_REGEX.test(orgId) &&
    orgId !== 'unassigned-org-placeholder'
      ? orgId
      : organization?.id && UUID_REGEX.test(organization.id)
        ? organization.id
        : null;

  const navigationOverrides = {
    dashboard: '/aihome/teacher-link/create/learning-resources',
    growthTrees: '/aihome/teacher-link/create/learning-resources',
    learningPaths: '/aihome/teacher-link/create/learning-resources',
    abilities: '/aihome/teacher-link/create/learning-resources',
    activities: '/aihome/teacher-link/create/learning-resources',
    assessments: '/aihome/teacher-link/create/student-progress/ability-assessments',
    media: '/aihome/teacher-link/create/student-progress/student-media',
    studentManagement: '/aihome/teacher-link/create/students',
    templates: '/aihome/teacher-link/create/learning-resources',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'growth-trees':
        return (
          <GrowthTreesPage
            navigationOverrides={navigationOverrides}
            forcedOrgId={resolvedOrgId}
            forcedOrgName={organization?.name ?? null}
            disableOrgFallback
          />
        );
      case 'learning-paths':
        return (
          <LearningPathsPage
            navigationOverrides={navigationOverrides}
            forcedOrgId={resolvedOrgId}
            forcedOrgName={organization?.name ?? null}
            disableOrgFallback
          />
        );
      case 'activities':
        return (
          <ActivitiesPage
            navigationOverrides={navigationOverrides}
            forcedOrgId={resolvedOrgId}
            forcedOrgName={organization?.name ?? null}
            disableOrgFallback
          />
        );
      case 'abilities':
        return (
          <AbilitiesPage
            navigationOverrides={navigationOverrides}
            forcedOrgId={resolvedOrgId}
            forcedOrgName={organization?.name ?? null}
            disableOrgFallback
          />
        );
      case 'templates':
        return (
          <TemplatesPage
            navigationOverrides={navigationOverrides}
            forcedOrgId={resolvedOrgId}
            forcedOrgName={organization?.name ?? null}
            disableOrgFallback
          />
        );
      default:
        return null;
    }
  };

  const activeTabInfo = resourceTabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 返回按鈕 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <BackButton href="/aihome/teacher-link/create" label="返回管理面板" />
        </motion.div>

        {/* 標題區域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-[#4B4036] mb-2">學習資源管理</h1>
          <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
            統一管理成長樹、學習路線、教學活動、發展能力和範本等教學資源
          </p>
        </motion.div>

        {/* 導航標籤 */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#EADBC8] shadow-lg p-2">
            <nav className="flex flex-wrap gap-2">
              {resourceTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-md'
                          : 'text-[#6E5A4A] hover:bg-[#FFF9F2] hover:text-[#4B4036]'
                      }
                    `}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.id === 'growth-trees' ? '成長樹' :
                       tab.id === 'learning-paths' ? '路線' :
                       tab.id === 'activities' ? '活動' :
                       tab.id === 'abilities' ? '能力' : '範本'}
                    </span>
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 當前標籤描述 */}
        {activeTabInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <p className="text-sm text-[#2B3A3B]">{activeTabInfo.description}</p>
          </motion.div>
        )}

        {/* 主要內容 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-[#EADBC8]"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LearningResourcesPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/learning-resources">
      <WithPermissionCheck pageKey="learning-resources">
        <LearningResourcesContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}


'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TemplateManagement } from '@/components/admin/TemplateManagement';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUser } from '@/hooks/useUser';
import type { OrganizationProfile } from '@/lib/authUtils';
import { ResponsiveNavigationDropdown } from '@/components/ui/ResponsiveNavigationDropdown';
import { BarChart3, TreePine, TrendingUp, Gamepad2, Users, BookOpenIcon } from 'lucide-react';
import StudentProgressPageTemplate from '@/components/ui/StudentProgressPageTemplate';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const PLACEHOLDER_ORG_IDS = new Set([
  'default-org',
  'unassigned-org-placeholder',
]);

type NavigationOverrides = Partial<{
  dashboard: string;
  growthTrees: string;
  learningPaths: string;
  abilities: string;
  activities: string;
  assessments: string;
  media: string;
  studentManagement: string;
  templates: string;
}>;

type TemplatesPageProps = {
  navigationOverrides?: NavigationOverrides;
  forcedOrgId?: string | null;
  forcedOrgName?: string | null;
  disableOrgFallback?: boolean;
};

export default function TemplatesPage({
  navigationOverrides,
  forcedOrgId = null,
  forcedOrgName = null,
  disableOrgFallback = false,
}: TemplatesPageProps = {}) {
  // Hooks 必須在頂層調用，但我們可以安全地處理錯誤
  // 如果 disableOrgFallback 為 true，我們主要依賴 forcedOrgId
  let orgContext: { currentOrganization: OrganizationProfile | null } | null = null;
  try {
    orgContext = useOrganization();
  } catch (error) {
    // 如果沒有 OrganizationProvider，忽略錯誤（在 teacher-link 模式下可能發生）
    if (!disableOrgFallback) {
      console.warn('OrganizationProvider not available:', error);
    }
    orgContext = null;
  }
  
  const { user } = useUser();

  const normalizedForcedOrgId =
    forcedOrgId &&
    UUID_REGEX.test(forcedOrgId) &&
    !PLACEHOLDER_ORG_IDS.has(forcedOrgId)
      ? forcedOrgId
      : null;

  const effectiveOrgId = useMemo(() => {
    const currentOrganization = orgContext?.currentOrganization || null;
    return normalizedForcedOrgId || currentOrganization?.id || user?.organization?.id || null;
  }, [normalizedForcedOrgId, orgContext?.currentOrganization?.id, user?.organization?.id]);

  const validOrgId = useMemo(() => {
    if (!effectiveOrgId) return null;
    return UUID_REGEX.test(effectiveOrgId) && !PLACEHOLDER_ORG_IDS.has(effectiveOrgId)
      ? effectiveOrgId
      : null;
  }, [effectiveOrgId]);

  const orgDataDisabled = disableOrgFallback && !validOrgId;
  const currentOrganization = orgContext?.currentOrganization || null;
  const organizationNameLabel = forcedOrgName || currentOrganization?.name || user?.organization?.name || '您的機構';

  const navigationPaths = useMemo(
    () => ({
      dashboard: '/admin/student-progress',
      growthTrees: '/admin/student-progress/growth-trees',
      learningPaths: '/admin/student-progress/learning-paths',
      abilities: '/admin/student-progress/abilities',
      activities: '/admin/student-progress/activities',
      assessments: '/admin/student-progress/ability-assessments',
      media: '/admin/student-progress/student-media',
      studentManagement: '/admin/students',
      templates: '/admin/student-progress/templates',
      ...(navigationOverrides ?? {}),
    }),
    [navigationOverrides],
  );

  if (orgDataDisabled || !validOrgId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <ResponsiveNavigationDropdown
            items={[
              { icon: BarChart3, label: '進度管理面板', href: navigationPaths.dashboard, variant: 'secondary' },
              { icon: TreePine, label: '成長樹管理', href: navigationPaths.growthTrees, variant: 'secondary' },
              { icon: BookOpenIcon, label: '學習路線管理', href: navigationPaths.learningPaths, variant: 'secondary' },
              { icon: TrendingUp, label: '發展能力圖卡', href: navigationPaths.abilities, variant: 'secondary' },
              { icon: Gamepad2, label: '教學活動管理', href: navigationPaths.activities, variant: 'secondary' },
              { icon: BookOpenIcon, label: '範本管理', href: navigationPaths.templates, variant: 'primary' },
              { icon: Users, label: '返回學生管理', href: navigationPaths.studentManagement, variant: 'accent' },
            ]}
            currentPage={navigationPaths.templates}
          />

          <div className="rounded-3xl border border-[#EADBC8] bg-white px-10 py-16 text-center shadow-sm">
            <div className="mb-6 flex justify-center">
              <BookOpenIcon className="h-24 w-24 text-[#EADBC8]" />
            </div>
            <h2 className="text-xl font-semibold text-[#4B4036]">尚未設定機構資料</h2>
            <p className="mt-3 text-sm text-[#2B3A3B]">
              請先創建屬於您的機構
              {organizationNameLabel ? `（${organizationNameLabel}）` : ''}
              ，才能管理範本。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <ResponsiveNavigationDropdown
          items={[
            { icon: BarChart3, label: '進度管理面板', href: navigationPaths.dashboard, variant: 'secondary' },
            { icon: TreePine, label: '成長樹管理', href: navigationPaths.growthTrees, variant: 'secondary' },
            { icon: BookOpenIcon, label: '學習路線管理', href: navigationPaths.learningPaths, variant: 'secondary' },
            { icon: TrendingUp, label: '發展能力圖卡', href: navigationPaths.abilities, variant: 'secondary' },
            { icon: Gamepad2, label: '教學活動管理', href: navigationPaths.activities, variant: 'secondary' },
            { icon: BookOpenIcon, label: '範本管理', href: navigationPaths.templates, variant: 'primary' },
            { icon: Users, label: '返回學生管理', href: navigationPaths.studentManagement, variant: 'accent' },
          ]}
          currentPage={navigationPaths.templates}
        />

        <div className="rounded-3xl border border-[#EADBC8] bg-white p-8 shadow-sm">
          <TemplateManagement 
            onBack={() => window.history.back()} 
            orgId={validOrgId}
            orgName={organizationNameLabel}
          />
        </div>
      </div>
    </div>
  );
}


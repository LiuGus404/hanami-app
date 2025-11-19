'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { OrganizationSelectorPanel } from '../OrganizationSelectorPanel';
import { OrganizationOnboardingPage } from '../OrganizationOnboardingPage';
import { CreateOrganizationPanel } from '../CreateOrganizationPanel';
import { getUserOrganizations, type UserOrganizationIdentity } from '@/lib/organizationUtils';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { OrganizationProfile } from '@/lib/authUtils';
import { TeacherLinkShell } from '../TeacherLinkShell';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';

function SelectOrganizationContent() {
  const router = useRouter();
  const { user: saasUser, loading: authLoading } = useSaasAuth();
  const { setCurrentOrganization, setCurrentOrganizationId } = useOrganization();
  const [userOrganizations, setUserOrganizations] = useState<UserOrganizationIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePanel, setShowCreatePanel] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!saasUser) {
      router.replace('/aihome/auth/login?redirect=/aihome/teacher-link/create/select-organization');
      return;
    }

    const loadOrganizations = async () => {
      try {
        setLoading(true);
        // 使用 API 端點查詢機構列表，繞過 RLS 問題
        const response = await fetch(
          `/api/organizations/user-organizations?userId=${encodeURIComponent(saasUser.id)}&userEmail=${encodeURIComponent(saasUser.email)}`
        );
        if (response.ok) {
          const result = await response.json();
          setUserOrganizations(result.data || []);
        } else {
          console.error('載入機構列表失敗:', response.status, await response.text());
          // 如果 API 失敗，回退到直接查詢
          const orgs = await getUserOrganizations(supabase, saasUser.id, saasUser.email);
          setUserOrganizations(orgs);
        }
      } catch (error) {
        console.error('載入機構列表失敗:', error);
        // 如果 API 失敗，回退到直接查詢
        try {
          const orgs = await getUserOrganizations(supabase, saasUser.id, saasUser.email);
          setUserOrganizations(orgs);
        } catch (fallbackError) {
          console.error('回退查詢也失敗:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, [authLoading, saasUser, router]);

  const handleOrganizationSelect = (org: OrganizationProfile) => {
    console.log('SelectOrganizationPage: 選擇機構', org);
    setCurrentOrganization(org);
    setCurrentOrganizationId(org.id);
    
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'hanami_current_org',
        JSON.stringify({
          id: org.id,
          name: org.name,
          slug: org.slug,
          status: org.status ?? null,
        }),
      );
      console.log('SelectOrganizationPage: 已保存機構到 localStorage', org);
    }

    // 跳轉回主頁面，並帶上機構 ID 參數
    router.push(`/aihome/teacher-link/create?orgId=${encodeURIComponent(org.id)}`);
  };

  const handleCreateNew = () => {
    setShowCreatePanel(true);
  };

  const handleJoinExisting = () => {
    router.push('/aihome/teacher-link/create/join-organization');
  };

  const handleCreated = (createdOrg: OrganizationProfile) => {
    setShowCreatePanel(false);
    // 重新載入機構列表
    getUserOrganizations(supabase, saasUser?.id, saasUser?.email).then(orgs => {
      setUserOrganizations(orgs);
      // 自動選擇新創建的機構
      handleOrganizationSelect(createdOrg);
    });
  };

  if (authLoading || loading) {
    return <CuteLoadingSpinner message="載入機構列表..." />;
  }

  if (showCreatePanel) {
    return (
      <div className="p-6">
        <CreateOrganizationPanel
          userEmail={saasUser?.email ?? null}
          userId={saasUser?.id ?? null}
          onCreated={handleCreated}
        />
      </div>
    );
  }

  if (userOrganizations.length === 0) {
    return (
      <div className="p-6">
        <OrganizationOnboardingPage
          onCreateOrganization={handleCreateNew}
          onJoinOrganization={handleJoinExisting}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <OrganizationSelectorPanel
        organizations={userOrganizations}
        onSelect={handleOrganizationSelect}
        onCreateNew={handleCreateNew}
        onJoinExisting={handleJoinExisting}
        currentOrgId={null}
      />
    </div>
  );
}

export default function SelectOrganizationPage() {
  return (
    <TeacherLinkShell
      currentPath="/aihome/teacher-link/create/select-organization"
      contentClassName="bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]"
    >
      <SelectOrganizationContent />
    </TeacherLinkShell>
  );
}


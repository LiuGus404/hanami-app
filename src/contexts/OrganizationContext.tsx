'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { useUser } from '@/hooks/useUser';
import {
  OrganizationProfile,
  UserProfile,
  fallbackOrganization,
  getUserSession,
  setUserSession,
} from '@/lib/authUtils';
import { Database } from '@/lib/database.types';

type OrganizationContextValue = {
  organizations: OrganizationProfile[];
  currentOrganization: OrganizationProfile;
  setCurrentOrganizationId: (organizationId: string) => void;
  setCurrentOrganization: (organization: OrganizationProfile) => void;
  refreshOrganizations: () => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

const STORAGE_KEY = 'hanami_current_org_id';

function buildOrganizationList(
  primaryOrg: OrganizationProfile,
  extraOrgs: OrganizationProfile[],
): OrganizationProfile[] {
  const map = new Map<string, OrganizationProfile>();
  map.set(primaryOrg.id, primaryOrg);
  extraOrgs.forEach((org) => {
    if (!map.has(org.id)) {
      map.set(org.id, org);
    }
  });
  return Array.from(map.values());
}

function updateSessionOrganization(nextOrg: OrganizationProfile) {
  const session = getUserSession();
  if (!session) return;

  const updatedSession: UserProfile = {
    ...session,
    organization: nextOrg,
  };

  setUserSession(updatedSession);
}

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);
  const [organizations, setOrganizations] = useState<OrganizationProfile[]>([fallbackOrganization]);
  const [currentOrg, setCurrentOrg] = useState<OrganizationProfile>(fallbackOrganization);

  const applyOrganizationSelection = useCallback(
    (nextOrg: OrganizationProfile) => {
      setCurrentOrg(nextOrg);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, nextOrg.id);
      }
      updateSessionOrganization(nextOrg);
    },
    [],
  );

  const refreshOrganizations = useCallback(async () => {
    if (!user?.email) {
      applyOrganizationSelection(fallbackOrganization);
      setOrganizations([fallbackOrganization]);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('hanami_user_organizations')
        .select('org_id, hanami_organizations ( id, org_name, org_slug, status )')
        .eq('user_email', user.email);

      if (error) {
        console.error('載入機構列表失敗:', error);
        return;
      }

      const orgsFromMembership: OrganizationProfile[] =
        (data || [])
          .map((item: any) => item?.hanami_organizations)
          .filter(Boolean)
          .map((org: any) => ({
            id: org.id,
            name: org.org_name,
            slug: org.org_slug,
            status: org.status,
          })) ?? [];

      const primaryOrg = user.organization || fallbackOrganization;

      const merged = buildOrganizationList(primaryOrg, orgsFromMembership);
      setOrganizations(merged);

      const storedOrgId =
        typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const nextOrg =
        merged.find((org) => org.id === storedOrgId) ||
        merged.find((org) => org.id === primaryOrg.id) ||
        merged[0] ||
        fallbackOrganization;

      applyOrganizationSelection(nextOrg);
    } catch (err) {
      console.error('刷新機構列表時發生錯誤:', err);
    }
  }, [applyOrganizationSelection, supabase, user?.email, user?.organization]);

  useEffect(() => {
    refreshOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setCurrentOrganizationId = useCallback(
    (organizationId: string) => {
      const nextOrg =
        organizations.find((org) => org.id === organizationId) ?? fallbackOrganization;
      applyOrganizationSelection(nextOrg);
    },
    [applyOrganizationSelection, organizations],
  );

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      currentOrganization: currentOrg,
      setCurrentOrganizationId,
      setCurrentOrganization: applyOrganizationSelection,
      refreshOrganizations,
    }),
    [organizations, currentOrg, setCurrentOrganizationId, refreshOrganizations, applyOrganizationSelection],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization 需要在 OrganizationProvider 中使用');
  }
  return context;
}


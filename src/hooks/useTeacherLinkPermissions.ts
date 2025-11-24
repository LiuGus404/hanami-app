/**
 * Teacher Link 權限檢查 Hook
 */

import { useMemo } from 'react';
import { useTeacherLinkOrganization } from '@/app/aihome/teacher-link/create/TeacherLinkShell';
import {
  type OrgRole,
  type PageKey,
  hasPagePermission,
  hasFeaturePermission,
  getAllowedPages,
  getPagePermissionByPath,
  PAGE_PERMISSIONS,
} from '@/lib/permissions';
import { usePathname } from 'next/navigation';

export interface UseTeacherLinkPermissionsReturn {
  role: OrgRole | null;
  hasPermission: (pageKey: PageKey) => boolean;
  hasFeatureAccess: (pageKey: PageKey, feature: string) => boolean;
  allowedPages: ReturnType<typeof getAllowedPages>;
  canAccessCurrentPage: boolean;
  currentPagePermission: ReturnType<typeof getPagePermissionByPath> | null;
}

/**
 * 獲取當前用戶在機構中的權限
 */
export function useTeacherLinkPermissions(): UseTeacherLinkPermissionsReturn {
  const { orgId, userOrganizations } = useTeacherLinkOrganization();
  const pathname = usePathname();

  // 獲取當前機構中的用戶角色
  const role = useMemo<OrgRole | null>(() => {
    if (!orgId || !userOrganizations || userOrganizations.length === 0) {
      return null;
    }
    const currentOrg = userOrganizations.find((org) => org.orgId === orgId);
    const orgRole = currentOrg?.role || null;
    
    // 確保角色類型正確
    if (orgRole && ['owner', 'admin', 'teacher', 'member'].includes(orgRole)) {
      return orgRole as OrgRole;
    }
    
    return null;
  }, [orgId, userOrganizations]);

  // 檢查是否有頁面權限
  const hasPermission = useMemo(
    () => (pageKey: PageKey) => hasPagePermission(role, pageKey),
    [role]
  );

  // 檢查是否有功能權限
  const hasFeatureAccess = useMemo(
    () => (pageKey: PageKey, feature: string) =>
      hasFeaturePermission(role, pageKey, feature),
    [role]
  );

  // 獲取允許訪問的頁面列表
  const allowedPages = useMemo(() => getAllowedPages(role), [role]);

  // 檢查是否可以訪問當前頁面
  const currentPagePermission = useMemo(
    () => getPagePermissionByPath(pathname),
    [pathname]
  );

  const canAccessCurrentPage = useMemo(() => {
    if (!currentPagePermission) return true; // 如果找不到配置，預設允許（可能是其他頁面）
    return hasPagePermission(role, currentPagePermission.key);
  }, [role, currentPagePermission]);

  return {
    role,
    hasPermission,
    hasFeatureAccess,
    allowedPages,
    canAccessCurrentPage,
    currentPagePermission,
  };
}


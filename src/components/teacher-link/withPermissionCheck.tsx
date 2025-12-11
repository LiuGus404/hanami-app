/**
 * 權限檢查高階組件
 */

'use client';

import { useState, useEffect } from 'react';
import { useTeacherLinkPermissions } from '@/hooks/useTeacherLinkPermissions';
import { useTeacherLinkOrganization } from '@/app/aihome/teacher-link/create/TeacherLinkShell';
import PermissionDenied from './PermissionDenied';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';
import type { PageKey } from '@/lib/permissions';

interface WithPermissionCheckProps {
  pageKey: PageKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 權限檢查包裝組件
 */
export function WithPermissionCheck({
  pageKey,
  children,
  fallback,
}: WithPermissionCheckProps) {
  const { organizationResolved, orgId, userOrganizations } = useTeacherLinkOrganization();
  const { hasPermission, canAccessCurrentPage, currentPagePermission, role } =
    useTeacherLinkPermissions();

  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  // 使用 useEffect 來判斷是否還在載入權限資訊
  useEffect(() => {
    // 如果機構信息還在載入中，保持載入狀態
    if (!organizationResolved) {
      setIsCheckingPermission(true);
      return;
    }

    // 機構已解析，給一個短暫的延遲來確保所有相關數據都已載入
    // 這可以避免在數據載入完成前就顯示權限不足
    // 性能優化：將延遲從 300ms 減少到 50ms，提高感知速度
    const timer = setTimeout(() => {
      setIsCheckingPermission(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [organizationResolved, orgId, userOrganizations, role]);

  // 如果還在檢查權限，顯示載入狀態
  if (isCheckingPermission || !organizationResolved) {
    return <CuteLoadingSpinner message="載入權限資訊中..." />;
  }

  // 如果当前页面有权限配置，使用它；否则使用传入的 pageKey
  const effectivePageKey = currentPagePermission?.key || pageKey;

  // 只有在確認權限不足時才顯示權限不足
  if (!hasPermission(effectivePageKey)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <PermissionDenied
        title="權限不足"
        message="您沒有權限訪問此頁面，請聯繫機構管理員獲取相應權限。"
      />
    );
  }

  return <>{children}</>;
}


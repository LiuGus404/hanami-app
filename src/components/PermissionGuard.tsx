'use client';

import React, { useState, useEffect } from 'react';
import { checkPermission, PermissionCheck } from '@/lib/permissionUtils';

interface PermissionGuardProps {
  user_email?: string;
  resource_type: 'page' | 'feature' | 'data';
  operation: 'view' | 'create' | 'edit' | 'delete';
  resource_id?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  onPermissionDenied?: () => void;
}

export function PermissionGuard({
  user_email,
  resource_type,
  operation,
  resource_id,
  fallback = <div className="text-center p-4 text-gray-500">您沒有權限訪問此內容</div>,
  children,
  loadingComponent = <div className="text-center p-4">載入中...</div>,
  onPermissionDenied,
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user_email) {
      setHasPermission(false);
      setLoading(false);
      if (onPermissionDenied) onPermissionDenied();
      return;
    }

    const checkPermissionAsync = async () => {
      try {
        const check: PermissionCheck = {
          user_email,
          resource_type,
          operation,
          resource_id,
        };

        const result = await checkPermission(check);
        setHasPermission(result.has_permission);
        
        if (!result.has_permission && onPermissionDenied) {
          onPermissionDenied();
        }
      } catch (error) {
        console.error('權限檢查錯誤:', error);
        setHasPermission(false);
        if (onPermissionDenied) onPermissionDenied();
      } finally {
        setLoading(false);
      }
    };

    checkPermissionAsync();
  }, [user_email, resource_type, operation, resource_id, onPermissionDenied]);

  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 權限連結組件
interface PermissionLinkProps {
  user_email?: string;
  resource_type: 'page' | 'feature' | 'data';
  operation: 'view' | 'create' | 'edit' | 'delete';
  resource_id?: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}

export function PermissionLink({
  user_email,
  resource_type,
  operation,
  resource_id,
  href,
  className = '',
  children,
}: PermissionLinkProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user_email) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    const checkPermissionAsync = async () => {
      try {
        const { checkPermission } = await import('@/lib/permissionUtils');
        const result = await checkPermission({
          user_email,
          resource_type,
          operation,
          resource_id,
        });
        setHasPermission(result.has_permission);
      } catch (error) {
        console.error('權限檢查錯誤:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissionAsync();
  }, [user_email, resource_type, operation, resource_id]);

  if (loading) {
    return <span className={`${className} opacity-50`}>載入中...</span>;
  }

  if (!hasPermission) {
    return null;
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

// 頁面權限保護組件
interface PagePermissionGuardProps {
  user_email?: string;
  page_path: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function PagePermissionGuard({
  user_email,
  page_path,
  fallback,
  children,
  loadingComponent,
}: PagePermissionGuardProps) {
  return (
    <PermissionGuard
      user_email={user_email}
      resource_type="page"
      operation="view"
      resource_id={page_path}
      fallback={fallback}
      loadingComponent={loadingComponent}
    >
      {children}
    </PermissionGuard>
  );
}

// 功能權限保護組件
interface FeaturePermissionGuardProps {
  user_email?: string;
  feature_name: string;
  operation?: 'view' | 'create' | 'edit' | 'delete';
  fallback?: React.ReactNode;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function FeaturePermissionGuard({
  user_email,
  feature_name,
  operation = 'view',
  fallback,
  children,
  loadingComponent,
}: FeaturePermissionGuardProps) {
  return (
    <PermissionGuard
      user_email={user_email}
      resource_type="feature"
      operation={operation}
      resource_id={feature_name}
      fallback={fallback}
      loadingComponent={loadingComponent}
    >
      {children}
    </PermissionGuard>
  );
}

// 資料權限保護組件
interface DataPermissionGuardProps {
  user_email?: string;
  data_type: string;
  operation?: 'view' | 'create' | 'edit' | 'delete';
  resource_id?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function DataPermissionGuard({
  user_email,
  data_type,
  operation = 'view',
  resource_id,
  fallback,
  children,
  loadingComponent,
}: DataPermissionGuardProps) {
  return (
    <PermissionGuard
      user_email={user_email}
      resource_type="data"
      operation={operation}
      resource_id={resource_id || data_type}
      fallback={fallback}
      loadingComponent={loadingComponent}
    >
      {children}
    </PermissionGuard>
  );
}

// 權限檢查 Hook
export function usePermissionGuard() {
  const [permissionStates, setPermissionStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const checkPermission = async (
    key: string,
    check: PermissionCheck
  ): Promise<boolean> => {
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const result = await checkPermission(check);
      setPermissionStates(prev => ({ ...prev, [key]: result.has_permission }));
      return result.has_permission;
    } catch (error) {
      console.error('權限檢查錯誤:', error);
      setPermissionStates(prev => ({ ...prev, [key]: false }));
      return false;
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const hasPermission = (key: string): boolean => {
    return permissionStates[key] || false;
  };

  const isLoading = (key: string): boolean => {
    return loading[key] || false;
  };

  return {
    checkPermission,
    hasPermission,
    isLoading,
    permissionStates,
  };
}

// 權限按鈕組件
interface PermissionButtonProps {
  user_email?: string;
  resource_type: 'page' | 'feature' | 'data';
  operation: 'view' | 'create' | 'edit' | 'delete';
  resource_id?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function PermissionButton({
  user_email,
  resource_type,
  operation,
  resource_id,
  onClick,
  disabled = false,
  className = '',
  children,
}: PermissionButtonProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user_email) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    const checkPermissionAsync = async () => {
      try {
        const { checkPermission } = await import('@/lib/permissionUtils');
        const result = await checkPermission({
          user_email,
          resource_type,
          operation,
          resource_id,
        });
        setHasPermission(result.has_permission);
      } catch (error) {
        console.error('權限檢查錯誤:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissionAsync();
  }, [user_email, resource_type, operation, resource_id]);

  if (loading) {
    return <button disabled className={`${className} opacity-50`}>載入中...</button>;
  }

  if (!hasPermission) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}

// 權限顯示組件
interface PermissionDisplayProps {
  user_email?: string;
  resource_type: 'page' | 'feature' | 'data';
  operation: 'view' | 'create' | 'edit' | 'delete';
  resource_id?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionDisplay({
  user_email,
  resource_type,
  operation,
  resource_id,
  fallback = null,
  children,
}: PermissionDisplayProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user_email) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    const checkPermissionAsync = async () => {
      try {
        const { checkPermission } = await import('@/lib/permissionUtils');
        const result = await checkPermission({
          user_email,
          resource_type,
          operation,
          resource_id,
        });
        setHasPermission(result.has_permission);
      } catch (error) {
        console.error('權限檢查錯誤:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissionAsync();
  }, [user_email, resource_type, operation, resource_id]);

  if (loading) {
    return <div className="opacity-50">載入中...</div>;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 
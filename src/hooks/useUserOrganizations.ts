import useSWR from 'swr';

export interface UserOrganizationIdentity {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: 'owner' | 'admin' | 'teacher' | 'member' | 'parent' | 'student';
  source: 'created' | 'identity' | 'membership' | 'employee';
  isPrimary: boolean;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  roleConfig?: Record<string, any>;
}

const fetchUserOrganizations = async (
  userId: string | null,
  userEmail: string | null
): Promise<UserOrganizationIdentity[]> => {
  if (!userId && !userEmail) {
    return [];
  }

  try {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (userEmail) params.set('userEmail', userEmail);

    const response = await fetch(`/api/organizations/user-organizations?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user organizations');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
};

export function useUserOrganizations(userId: string | null, userEmail: string | null) {
  const { data, error, isLoading, mutate } = useSWR<UserOrganizationIdentity[]>(
    userId || userEmail ? ['user-organizations', userId, userEmail] : null,
    () => fetchUserOrganizations(userId, userEmail),
    {
      revalidateOnFocus: false, // 不自动重新验证
      revalidateOnReconnect: false, // 不自动重新验证
      dedupingInterval: 60000, // 60秒内去重请求
      refreshInterval: 300000, // 5分钟自动刷新
      keepPreviousData: true, // 保持之前的数据
      // 错误重试配置
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  );

  return {
    organizations: data || [],
    isLoading,
    error,
    mutate,
  };
}


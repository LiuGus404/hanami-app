import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

interface Teacher {
  id: string;
  teacher_nickname: string;
  teacher_fullname?: string;
  teacher_role?: string;
  teacher_status?: string;
  teacher_email?: string;
  teacher_phone?: string;
  org_id?: string;
  [key: string]: any;
}

interface TeachersData {
  teachers: Teacher[];
  roles: string[];
}

const fetchTeachersData = async (orgId: string | null): Promise<TeachersData> => {
  if (!orgId) {
    return { teachers: [], roles: [] };
  }

  // 并行获取教师列表和角色列表
  const [teachersResult, rolesResult] = await Promise.all([
    supabase
      .from('hanami_employee')
      .select('*')
      .eq('org_id', orgId),
    (supabase
      .from('hanami_employee') as any)
      .select('teacher_role')
      .not('teacher_role', 'is', null)
      .eq('org_id', orgId)
  ]);

  const teachers = teachersResult.data || [];
  
  // 处理角色列表
  const roleMap = new Map<string, string>();
  if (rolesResult.data) {
    rolesResult.data.forEach((r: any) => {
      const raw = r.teacher_role;
      const normalized = raw?.trim().toLowerCase();
      if (normalized && !roleMap.has(normalized)) {
        if (raw) {
          roleMap.set(normalized, raw.trim());
        }
      }
    });
  }

  return {
    teachers,
    roles: Array.from(roleMap.values()),
  };
};

export function useTeachersData(orgId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TeachersData>(
    orgId ? ['teachers-data', orgId] : null,
    () => fetchTeachersData(orgId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30秒内去重
      refreshInterval: 300000, // 5分钟自动刷新
      keepPreviousData: true,
    }
  );

  return {
    data: data || { teachers: [], roles: [] },
    isLoading,
    error,
    mutate,
  };
}


import useSWR from 'swr';

interface ClassActivitiesData {
  lessons: any[];
  trialLessons: any[];
  treeActivities: any[];
  assignedActivities: any[];
}

const fetchClassActivities = async (
  orgId: string | null,
  weekStart: string,
  weekEnd: string,
  teacherId?: string | null
): Promise<ClassActivitiesData> => {
  if (!orgId) {
    return {
      lessons: [],
      trialLessons: [],
      treeActivities: [],
      assignedActivities: [],
    };
  }

  const query = new URLSearchParams({
    weekStart,
    weekEnd,
    orgId,
  });

  if (teacherId) {
    query.set('teacherId', teacherId);
  }

  const response = await fetch(`/api/class-activities?${query.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch class activities');
  }

  const result = await response.json();
  return result.data || {
    lessons: [],
    trialLessons: [],
    treeActivities: [],
    assignedActivities: [],
  };
};

export function useClassActivitiesData(
  orgId: string | null,
  weekStart: string | null,
  weekEnd: string | null,
  teacherId?: string | null
) {
  const { data, error, isLoading, mutate } = useSWR<ClassActivitiesData>(
    orgId && weekStart && weekEnd ? ['class-activities', orgId, weekStart, weekEnd, teacherId] : null,
    () => fetchClassActivities(orgId!, weekStart!, weekEnd!, teacherId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30秒内去重
      refreshInterval: 300000, // 5分钟自动刷新
      keepPreviousData: true,
    }
  );

  return {
    data: data || {
      lessons: [],
      trialLessons: [],
      treeActivities: [],
      assignedActivities: [],
    },
    isLoading,
    error,
    mutate,
  };
}


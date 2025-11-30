import useSWR from 'swr';

interface Student {
  id: string;
  full_name: string;
  nick_name?: string;
  student_age?: number;
  student_type?: string;
  course_type?: string;
  [key: string]: any;
}

interface StudentsData {
  students: Student[];
  count: number;
}

const fetchStudentsData = async (
  orgId: string | null,
  userEmail: string,
  studentType: string = 'all'
): Promise<StudentsData> => {
  if (!orgId || !userEmail) {
    return { students: [], count: 0 };
  }

  const params = new URLSearchParams({
    orgId,
    userEmail,
    studentType,
  });

  const response = await fetch(`/api/students/list?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch students');
  }

  const result = await response.json();
  return {
    students: result.data || result.students || [],
    count: result.count || 0,
  };
};

export function useStudentsData(
  orgId: string | null,
  userEmail: string,
  studentType: string = 'all'
) {
  const { data, error, isLoading, mutate } = useSWR<StudentsData>(
    orgId && userEmail ? ['students-data', orgId, userEmail, studentType] : null,
    () => fetchStudentsData(orgId!, userEmail, studentType),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30秒内去重
      refreshInterval: 300000, // 5分钟自动刷新
      keepPreviousData: true,
    }
  );

  return {
    data: data || { students: [], count: 0 },
    isLoading,
    error,
    mutate,
  };
}


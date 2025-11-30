import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { getUserSession } from '@/lib/authUtils';

interface StudentProgressData {
  abilities: any[];
  trees: any[];
  activities: any[];
  recentAssessments: any[];
  studentsWithoutAssessment: any[];
  studentsAssessed: any[];
  studentsNoTree: any[];
  studentsWithoutMedia: any[];
  studentsWithMedia: any[];
}

const fetchStudentProgressData = async (
  orgId: string | null,
  userEmail: string,
  assessmentDate: string,
  mediaDate: string
): Promise<StudentProgressData> => {
  if (!orgId) {
    return {
      abilities: [],
      trees: [],
      activities: [],
      recentAssessments: [],
      studentsWithoutAssessment: [],
      studentsAssessed: [],
      studentsNoTree: [],
      studentsWithoutMedia: [],
      studentsWithMedia: [],
    };
  }

  // 并行获取基础数据
  const [abilitiesResult, treesResult, activitiesResult, assessmentsResult] = await Promise.all([
    supabase
      .from('hanami_abilities')
      .select('*')
      .eq('org_id', orgId)
      .order('ability_name'),
    supabase
      .from('hanami_growth_trees')
      .select('*')
      .eq('org_id', orgId)
      .order('tree_name'),
    supabase
      .from('hanami_teaching_activities')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('activity_name'),
    supabase
      .from('hanami_ability_assessments')
      .select('*')
      .eq('org_id', orgId)
      .gte('assessment_date', assessmentDate)
      .order('assessment_date', { ascending: false })
      .limit(10),
  ]);

  const abilities = abilitiesResult.data || [];
  const trees = treesResult.data || [];
  const activities = activitiesResult.data || [];
  const recentAssessments = assessmentsResult.data || [];

  // 获取学生数据（使用 API 绕过 RLS）
  const studentsResponse = await fetch(
    `/api/students/list?orgId=${encodeURIComponent(orgId)}&userEmail=${encodeURIComponent(userEmail)}`
  );
  const studentsResult = await studentsResponse.json();
  const allStudents = studentsResult.students || studentsResult.data || [];

  // 获取学生评估状态
  const assessmentStudentIds = new Set(
    recentAssessments.map((a: any) => a.student_id).filter(Boolean)
  );
  const studentsWithoutAssessment = allStudents.filter(
    (s: any) => !assessmentStudentIds.has(s.id)
  );
  const studentsAssessed = allStudents.filter((s: any) => assessmentStudentIds.has(s.id));

  // 获取学生成长树状态
  const { data: studentTreesData } = await supabase
    .from('hanami_student_trees')
    .select('student_id')
    .eq('org_id', orgId)
    .eq('status', 'active');

  const treeStudentIds = new Set(
    (studentTreesData || []).map((st: any) => st.student_id).filter(Boolean)
  );
  const studentsNoTree = allStudents.filter((s: any) => !treeStudentIds.has(s.id));

  // 获取学生媒体状态
  const { data: mediaData } = await supabase
    .from('hanami_student_media')
    .select('student_id')
    .eq('org_id', orgId)
    .gte('created_at', mediaDate);

  const mediaStudentIds = new Set(
    (mediaData || []).map((m: any) => m.student_id).filter(Boolean)
  );
  const studentsWithoutMedia = allStudents.filter((s: any) => !mediaStudentIds.has(s.id));
  const studentsWithMedia = allStudents.filter((s: any) => mediaStudentIds.has(s.id));

  return {
    abilities,
    trees,
    activities,
    recentAssessments,
    studentsWithoutAssessment,
    studentsAssessed,
    studentsNoTree,
    studentsWithoutMedia,
    studentsWithMedia,
  };
};

export function useStudentProgressData(
  orgId: string | null,
  userEmail: string,
  assessmentDate: string,
  mediaDate: string
) {
  const { data, error, isLoading, mutate } = useSWR<StudentProgressData>(
    orgId && userEmail && assessmentDate && mediaDate
      ? ['student-progress', orgId, userEmail, assessmentDate, mediaDate]
      : null,
    () => fetchStudentProgressData(orgId!, userEmail, assessmentDate, mediaDate),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 60秒内去重
      refreshInterval: 300000, // 5分钟自动刷新
      keepPreviousData: true,
    }
  );

  return {
    data: data || {
      abilities: [],
      trees: [],
      activities: [],
      recentAssessments: [],
      studentsWithoutAssessment: [],
      studentsAssessed: [],
      studentsNoTree: [],
      studentsWithoutMedia: [],
      studentsWithMedia: [],
    },
    isLoading,
    error,
    mutate,
  };
}


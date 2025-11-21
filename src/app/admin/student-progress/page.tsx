'use client';

import Image from 'next/image';
import {
  AcademicCapIcon,
  LightBulbIcon,
  ClockIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  StarIcon,
  CalendarIcon,
  UserIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { BarChart3, TreePine, TrendingUp, Gamepad2, Users, GraduationCap, Video } from 'lucide-react';
import { ResponsiveNavigationDropdown } from '@/components/ui/ResponsiveNavigationDropdown';
import { HanamiNumberSelector } from '@/components/ui/HanamiNumberSelector';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  HanamiCard,
  HanamiInput,
  SimpleAbilityAssessmentModal,
  StudentTreeAssignmentModal,
} from '@/components/ui';
import Calendarui from '@/components/ui/Calendarui';
import { supabase } from '@/lib/supabase';
import { getHKDateString } from '@/lib/utils';
import {
  DevelopmentAbility,
  GrowthTree,
  TeachingActivity,
} from '@/types/progress';
import {
  getStudentAssessmentStatus,
  getStudentMediaStatus,
  getBaseDashboardData,
  clearCache,
} from '@/lib/optimizedQueries';
import {
  fallbackOrganization,
  getUserSession,
  type OrganizationProfile,
} from '@/lib/authUtils';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

interface AbilityAssessment {
  id: string;
  student_id: string;
  tree_id: string;
  assessment_date: string;
  general_notes?: string;
  next_lesson_focus?: string;
  created_at: string;
  student?: {
    full_name: string;
    nick_name?: string;
  };
  tree?: {
    tree_name: string;
  };
}

interface StudentWithoutAssessment {
  id: string;
  full_name: string;
  nick_name?: string | null;
  course_type?: string | null;
  last_assessment_date?: string | null;
  lesson_time?: string;
}

interface StudentMediaStatus {
  id: string;
  full_name: string;
  nick_name?: string | null;
  course_type?: string | null;
  lesson_time?: string;
  has_media: boolean;
  media_count?: number;
  last_media_upload?: string | null;
}

// 快取介面
interface DashboardCache {
  abilities: DevelopmentAbility[];
  trees: GrowthTree[];
  activities: TeachingActivity[];
  recentAssessments: AbilityAssessment[];
  lastUpdated: number;
  assessmentDate: string;
  mediaDate: string;
}

// 快取過期時間（5分鐘）
const CACHE_EXPIRY = 5 * 60 * 1000;

const allowOrgData =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_ENABLE_ORG_DATA === 'true';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const PLACEHOLDER_ORG_IDS = new Set([
  fallbackOrganization.id,
  'default-org',
  'unassigned-org-placeholder',
]);

const EMPTY_TEACHER_LINK_ORG: OrganizationProfile = {
  id: '',
  name: '未設定機構',
  slug: 'unassigned-org',
  status: null,
};

type StudentProgressPageProps = {
  forcedOrgId?: string | null;
  forcedOrgName?: string | null;
  disableOrgFallback?: boolean;
  navigationOverrides?: Partial<{
    dashboard: string;
    growthTrees: string;
    learningPaths: string;
    abilities: string;
    activities: string;
    assessments: string;
    media: string;
    studentManagement: string;
  }>;
};

export default function StudentProgressDashboard(
  props: StudentProgressPageProps = {},
) {
  const {
    forcedOrgId = null,
    forcedOrgName = null,
    disableOrgFallback = false,
    navigationOverrides,
  } = props;
  const adminNavigationDefaults = useMemo(
    () => ({
      dashboard: '/admin/student-progress',
      growthTrees: '/admin/student-progress/growth-trees',
      learningPaths: '/admin/student-progress/learning-paths',
      abilities: '/admin/student-progress/abilities',
      activities: '/admin/student-progress/activities',
      assessments: '/admin/student-progress/ability-assessments',
      media: '/admin/student-progress/student-media',
      studentManagement: '/admin/students',
    }),
    [],
  );

  const teacherLinkNavigationDefaults = useMemo(
    () => ({
      dashboard: '/aihome/teacher-link/create/student-progress',
      growthTrees: '/aihome/teacher-link/create/student-progress/growth-trees',
      learningPaths: '/aihome/teacher-link/create/student-progress/learning-paths',
      abilities: '/aihome/teacher-link/create/student-progress/abilities',
      activities: '/aihome/teacher-link/create/student-progress/activities',
      assessments: '/aihome/teacher-link/create/student-progress/ability-assessments',
      media: '/aihome/teacher-link/create/student-progress/student-media',
      studentManagement: '/aihome/teacher-link/create/students',
    }),
    [],
  );

  const navigationPaths = useMemo(() => {
    const defaults = disableOrgFallback
      ? teacherLinkNavigationDefaults
      : adminNavigationDefaults;
    return {
      ...defaults,
      ...(navigationOverrides ?? {}),
    };
  }, [adminNavigationDefaults, disableOrgFallback, navigationOverrides, teacherLinkNavigationDefaults]);

  const [abilities, setAbilities] = useState<DevelopmentAbility[]>([]);
  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [activities, setActivities] = useState<TeachingActivity[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<AbilityAssessment[]>([]);
  const [studentsWithoutAssessment, setStudentsWithoutAssessment] = useState<StudentWithoutAssessment[]>([]);
  const [studentsAssessed, setStudentsAssessed] = useState<StudentWithoutAssessment[]>([]);
  const [studentsNoTree, setStudentsNoTree] = useState<StudentWithoutAssessment[]>([]);
  const [studentsWithoutMedia, setStudentsWithoutMedia] = useState<StudentMediaStatus[]>([]);
  const [studentsWithMedia, setStudentsWithMedia] = useState<StudentMediaStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // 獲取用戶 email（優先使用 useSaasAuth，回退到 getUserSession）
  const { user: saasUser } = useSaasAuth();
  const sessionUser = getUserSession();
  const userEmail = saasUser?.email || sessionUser?.email || null;

  const allowOrgDataEffective = useMemo(
    () => (disableOrgFallback ? true : allowOrgData),
    [disableOrgFallback],
  );

  const hasForcedOrg = useMemo(() => {
    if (!forcedOrgId) {
      return false;
    }
    return (
      UUID_REGEX.test(forcedOrgId) && !PLACEHOLDER_ORG_IDS.has(forcedOrgId)
    );
  }, [forcedOrgId]);

  const forcedOrganization = useMemo<OrganizationProfile | null>(() => {
    if (!hasForcedOrg || !forcedOrgId) {
      return null;
    }

    return {
      id: forcedOrgId,
      name: forcedOrgName || fallbackOrganization.name,
      slug: fallbackOrganization.slug,
      status: null,
    };
  }, [hasForcedOrg, forcedOrgId, forcedOrgName]);

  const searchParams = useSearchParams();
  const [organization, setOrganization] = useState<OrganizationProfile>(
    forcedOrganization ??
      (disableOrgFallback ? EMPTY_TEACHER_LINK_ORG : fallbackOrganization),
  );
  const [organizationResolved, setOrganizationResolved] = useState(
    hasForcedOrg ? true : disableOrgFallback ? true : !allowOrgData,
  );

  useEffect(() => {
    if (hasForcedOrg && forcedOrganization) {
      setOrganization(forcedOrganization);
      setOrganizationResolved(true);
    }
  }, [hasForcedOrg, forcedOrganization]);
  
  // 搜尋和篩選狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(getHKDateString());
  const [assessmentLimit, setAssessmentLimit] = useState(5);
  const [selectedAssessmentDate, setSelectedAssessmentDate] = useState(getHKDateString());
  const [selectedMediaDate, setSelectedMediaDate] = useState(getHKDateString());
  
  // 篩選相關狀態
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [filteredAssessments, setFilteredAssessments] = useState<AbilityAssessment[]>([]);

  // 能力評估模態視窗狀態
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedStudentForAssessment, setSelectedStudentForAssessment] = useState<StudentWithoutAssessment | null>(null);

  // 成長樹分配模態視窗狀態
  const [showTreeAssignmentModal, setShowTreeAssignmentModal] = useState(false);
  const [selectedStudentForTreeAssignment, setSelectedStudentForTreeAssignment] = useState<StudentWithoutAssessment | null>(null);

  // 日期選擇器狀態
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMediaDatePicker, setShowMediaDatePicker] = useState(false);

  // 學生資料載入狀態
  const [loadingStudents, setLoadingStudents] = useState(false);

  // 快取狀態
  const [cache, setCache] = useState<DashboardCache | null>(null);

  // 性能監控狀態

  const normalizedOrgId = organizationResolved ? organization?.id ?? null : null;
  const hasValidOrgId = hasForcedOrg
    ? Boolean(forcedOrganization?.id)
    : !allowOrgDataEffective ||
      (!!normalizedOrgId &&
        UUID_REGEX.test(normalizedOrgId) &&
        !PLACEHOLDER_ORG_IDS.has(normalizedOrgId));
  const effectiveOrgId = hasForcedOrg
    ? (forcedOrganization?.id as string | undefined)
    : allowOrgDataEffective && hasValidOrgId
      ? (normalizedOrgId as string)
      : undefined;
  const orgDataDisabled = hasForcedOrg
    ? !forcedOrganization?.id
    : allowOrgDataEffective
      ? !hasValidOrgId
      : false;
  const showOrgEmptyState =
    (allowOrgDataEffective || disableOrgFallback) &&
    (hasForcedOrg ? !forcedOrganization?.id : orgDataDisabled);

  // 檢查快取是否有效
  const isCacheValid = useCallback((cacheData: DashboardCache | null, currentAssessmentDate: string, currentMediaDate: string) => {
    if (!cacheData) return false;
    
    const now = Date.now();
    const isExpired = now - cacheData.lastUpdated > CACHE_EXPIRY;
    const isSameAssessmentDate = cacheData.assessmentDate === currentAssessmentDate;
    const isSameMediaDate = cacheData.mediaDate === currentMediaDate;
    
    return !isExpired && isSameAssessmentDate && isSameMediaDate;
  }, []);

  // 優化的基礎資料載入函數
  const loadBaseData = useCallback(async () => {
    if (orgDataDisabled) {
      return {
        abilities: [],
        trees: [],
        activities: [],
        assessments: [],
      };
    }

    try {
      if ((window as any).performanceMonitor) {
        (window as any).performanceMonitor.startDataLoad();
      }

      // 使用組件級別的 userEmail（從 useSaasAuth 或 getUserSession 獲取）
      const baseData = await getBaseDashboardData(assessmentLimit, {
        organizationId: effectiveOrgId,
        userEmail: userEmail || undefined,
      });

      const abilitiesData = Array.isArray(baseData.abilities)
        ? baseData.abilities
        : [];
      const treesData = Array.isArray(baseData.trees) ? baseData.trees : [];
      const activitiesData = Array.isArray(baseData.activities)
        ? baseData.activities
        : [];
      const assessmentsData = Array.isArray(baseData.assessments)
        ? baseData.assessments
        : [];

      const fixedAbilities = abilitiesData.map((a: any) => ({
        ...a,
        ability_description: a.ability_description ?? undefined,
        ability_icon: a.ability_icon ?? undefined,
        ability_color: a.ability_color ?? undefined,
      }));

      const fixedTrees = treesData.map((t: any) => ({
        ...t,
        course_type: t.course_type_id ?? t.course_type ?? '',
        tree_description: t.tree_description ?? undefined,
      }));

      const fixedActivities = activitiesData.map((a: any) => ({
        ...a,
        estimated_duration: a.estimated_duration ?? a.duration_minutes ?? 0,
        activity_description: a.activity_description ?? undefined,
        materials_needed: a.materials_needed ?? [],
        instructions: a.instructions ?? undefined,
      }));

      const fixedAssessments = assessmentsData.map((a: any) => ({
        ...a,
        assessment_date:
          a.assessment_date ?? a.created_at?.split('T')[0] ?? '',
        general_notes: a.general_notes ?? undefined,
        next_lesson_focus: a.next_lesson_focus ?? undefined,
      }));

      if ((window as any).performanceMonitor) {
        (window as any).performanceMonitor.endDataLoad();
      }

      return {
        abilities: fixedAbilities,
        trees: fixedTrees,
        activities: fixedActivities,
        assessments: fixedAssessments,
      };
    } catch (error) {
      console.error('載入基礎資料時發生錯誤:', error);
      throw error;
    }
  }, [assessmentLimit, effectiveOrgId, organizationResolved, orgDataDisabled, userEmail]);

  // 優化的學生評估狀態載入函數
  const loadStudentsWithoutAssessment = useCallback(async () => {
    if (orgDataDisabled) {
      setStudentsWithoutAssessment([]);
      setStudentsAssessed([]);
      setStudentsNoTree([]);
      setLoadingStudents(false);
      return;
    }

    try {
      setLoadingStudents(true);

      // 使用組件級別的 userEmail（從 useSaasAuth 或 getUserSession 獲取）
      console.log('🔍 loadStudentsWithoutAssessment 調用:', {
        selectedAssessmentDate,
        effectiveOrgId,
        userEmail,
        hasSaasUser: !!saasUser,
        hasSession: !!sessionUser,
      });

      const data = await getStudentAssessmentStatus(selectedAssessmentDate, {
        organizationId: effectiveOrgId,
        userEmail: userEmail || undefined,
      });
      
      const lessonsData = Array.isArray(data.lessons) ? data.lessons : [];
      const assessmentsData = Array.isArray(data.assessments)
        ? data.assessments
        : [];
      const studentsData = Array.isArray(data.students) ? data.students : [];
      const treesData = Array.isArray(data.trees) ? data.trees : [];

      const lessonTimeMap = new Map();
      lessonsData.forEach((lesson: any) => {
        lessonTimeMap.set(lesson.student_id, lesson.actual_timeslot);
      });

      const assessedStudentIds = new Set(
        assessmentsData.map((a: any) => a.student_id),
      );
      const studentTreeMap = new Map();
      treesData.forEach((item: any) => {
        studentTreeMap.set(item.student_id, item.tree_id);
      });

      const studentIds = [
        ...new Set(
          lessonsData
            .map((lesson: any) => lesson.student_id)
            .filter((id: any): id is string => id !== null),
        ),
      ] as string[];

      let lastAssessmentMap = new Map();
      if (studentIds.length > 0) {
        // 使用 API 端點獲取最後一次評估日期（繞過 RLS）
        const isBrowser = typeof window !== 'undefined';
        const shouldUseApi = isBrowser && effectiveOrgId && userEmail;

        if (shouldUseApi) {
          try {
            const params = new URLSearchParams();
            params.append('orgId', effectiveOrgId);
            params.append('studentIds', studentIds.join(','));
            params.append('orderBy', 'assessment_date');
            params.append('ascending', 'false');
            if (userEmail) {
              params.append('userEmail', userEmail);
            }

            const response = await fetch(`/api/ability-assessments/list?${params.toString()}`, {
              credentials: 'include',
            });

            if (response.ok) {
              const result = await response.json();
              const lastAssessmentsData = result.data || [];

              lastAssessmentsData.forEach((assessment: any) => {
                if (!lastAssessmentMap.has(assessment.student_id)) {
                  lastAssessmentMap.set(
                    assessment.student_id,
                    assessment.assessment_date,
                  );
                }
              });
            } else {
              console.warn('⚠️ 無法通過 API 載入最後一次評估日期，回退到直接查詢');
              throw new Error('API call failed');
            }
          } catch (apiError) {
            console.error('⚠️ API 調用異常，嘗試直接查詢最後一次評估日期:', apiError);
            // 回退到直接查詢（可能失敗，但不影響主要功能）
            try {
              let lastAssessmentsQuery = supabase
                .from('hanami_ability_assessments')
                .select('student_id, assessment_date')
                .in('student_id', studentIds)
                .order('assessment_date', { ascending: false });

              if (effectiveOrgId) {
                lastAssessmentsQuery = lastAssessmentsQuery.eq('org_id', effectiveOrgId);
              }

              const { data: lastAssessmentsData } = await lastAssessmentsQuery;

              lastAssessmentsData?.forEach((assessment: any) => {
                if (!lastAssessmentMap.has(assessment.student_id)) {
                  lastAssessmentMap.set(
                    assessment.student_id,
                    assessment.assessment_date,
                  );
                }
              });
            } catch (directQueryError) {
              console.error('直接查詢最後一次評估日期也失敗:', directQueryError);
              // 如果查詢失敗，lastAssessmentMap 保持為空，不影響主要功能
            }
          }
        } else {
          // 服務端或沒有 API 選項時，使用直接查詢
          try {
            let lastAssessmentsQuery = supabase
              .from('hanami_ability_assessments')
              .select('student_id, assessment_date')
              .in('student_id', studentIds)
              .order('assessment_date', { ascending: false });

            if (effectiveOrgId) {
              lastAssessmentsQuery = lastAssessmentsQuery.eq('org_id', effectiveOrgId);
            }

            const { data: lastAssessmentsData } = await lastAssessmentsQuery;

            lastAssessmentsData?.forEach((assessment: any) => {
              if (!lastAssessmentMap.has(assessment.student_id)) {
                lastAssessmentMap.set(
                  assessment.student_id,
                  assessment.assessment_date,
                );
              }
            });
          } catch (directQueryError) {
            console.error('直接查詢最後一次評估日期失敗:', directQueryError);
            // 如果查詢失敗，lastAssessmentMap 保持為空，不影響主要功能
          }
        }
      }

      const categorizedStudents = {
        assessed: [] as StudentWithoutAssessment[],
        unassessed: [] as StudentWithoutAssessment[],
        noTree: [] as StudentWithoutAssessment[],
      };

      studentsData.forEach((student: any) => {
        const hasLesson = lessonTimeMap.has(student.id);
        const isAssessedToday = assessedStudentIds.has(student.id);
        const hasTree = studentTreeMap.has(student.id);
        const lastAssessmentDate = lastAssessmentMap.get(student.id) || null;
        const lessonTime = lessonTimeMap.get(student.id) || '';

        const studentWithData = {
          ...student,
          last_assessment_date: lastAssessmentDate,
          lesson_time: lessonTime,
        };

        if (hasLesson) {
          if (isAssessedToday) {
            categorizedStudents.assessed.push(studentWithData);
          } else if (hasTree) {
            categorizedStudents.unassessed.push(studentWithData);
          } else {
            categorizedStudents.noTree.push(studentWithData);
          }
        }
      });

      const sortByTime = (
        a: StudentWithoutAssessment,
        b: StudentWithoutAssessment,
      ) => {
        const timeA = a.lesson_time || '';
        const timeB = b.lesson_time || '';
        return timeA.localeCompare(timeB);
      };

      categorizedStudents.assessed.sort(sortByTime);
      categorizedStudents.unassessed.sort(sortByTime);
      categorizedStudents.noTree.sort(sortByTime);

      setStudentsWithoutAssessment(categorizedStudents.unassessed);
      setStudentsAssessed(categorizedStudents.assessed);
      setStudentsNoTree(categorizedStudents.noTree);
    } catch (error) {
      console.error('載入需要評估的學生時發生錯誤:', error);
      setStudentsWithoutAssessment([]);
      setStudentsAssessed([]);
      setStudentsNoTree([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [
    selectedAssessmentDate,
    effectiveOrgId,
    organizationResolved,
    orgDataDisabled,
  ]);

  // 優化的學生媒體狀態載入函數
  const loadStudentsMediaStatus = useCallback(async () => {
    if (orgDataDisabled) {
      setStudentsWithoutMedia([]);
      setStudentsWithMedia([]);
      setLoadingStudents(false);
      return;
    }

    try {
      setLoadingStudents(true);

      const data = await getStudentMediaStatus(selectedMediaDate, {
        organizationId: effectiveOrgId,
      });
      
      const lessonsData = Array.isArray(data.lessons) ? data.lessons : [];
      const mediaData = Array.isArray(data.media) ? data.media : [];

      if (lessonsData.length === 0) {
        setStudentsWithoutMedia([]);
        setStudentsWithMedia([]);
        return;
      }

      const mediaStatusMap = new Map();

      lessonsData.forEach((lesson: any) => {
        const studentId = lesson.student_id;
        if (!mediaStatusMap.has(studentId)) {
          mediaStatusMap.set(studentId, {
            id: studentId,
            full_name: lesson.full_name || '未知學生',
            nick_name: null,
            course_type: lesson.course_type,
            lesson_time: lesson.actual_timeslot,
            has_media: false,
            media_count: 0,
            last_media_upload: null,
          });
        }
      });

      mediaData.forEach((media: any) => {
        const studentId = media.student_id;
        if (mediaStatusMap.has(studentId)) {
          const student = mediaStatusMap.get(studentId);
          student.has_media = true;
          student.media_count = (student.media_count || 0) + 1;
          if (!student.last_media_upload || media.created_at > student.last_media_upload) {
            student.last_media_upload = media.created_at;
          }
        }
      });

      const withMedia: StudentMediaStatus[] = [];
      const withoutMedia: StudentMediaStatus[] = [];

      mediaStatusMap.forEach((student: any) => {
        if (student.has_media) {
          withMedia.push(student);
        } else {
          withoutMedia.push(student);
        }
      });

      const sortByTime = (a: StudentMediaStatus, b: StudentMediaStatus) => {
        const timeA = a.lesson_time || '';
        const timeB = b.lesson_time || '';
        return timeA.localeCompare(timeB);
      };

      setStudentsWithMedia(withMedia.sort(sortByTime));
      setStudentsWithoutMedia(withoutMedia.sort(sortByTime));
    } catch (error) {
      console.error('載入學生媒體狀態時發生錯誤:', error);
      setStudentsWithoutMedia([]);
      setStudentsWithMedia([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedMediaDate, effectiveOrgId, organizationResolved, orgDataDisabled]);

  // 主載入函數
  const loadDashboardData = useCallback(async () => {
    if (orgDataDisabled) {
      setAbilities([]);
      setTrees([]);
      setActivities([]);
      setRecentAssessments([]);
      setStudentsWithoutAssessment([]);
      setStudentsAssessed([]);
      setStudentsNoTree([]);
      setStudentsWithoutMedia([]);
      setStudentsWithMedia([]);
      setLoadingStudents(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (isCacheValid(cache, selectedAssessmentDate, selectedMediaDate)) {
        console.log('使用快取資料');
        setAbilities(cache!.abilities);
        setTrees(cache!.trees);
        setActivities(cache!.activities);
        setRecentAssessments(cache!.recentAssessments);

        if ((window as any).performanceMonitor) {
          (window as any).performanceMonitor.updateCacheHitRate(1);
        }
      } else {
        console.log('載入新資料');
        const baseData = await loadBaseData();
        setAbilities(baseData.abilities);
        setTrees(baseData.trees);
        setActivities(baseData.activities);
        setRecentAssessments(baseData.assessments);

        setCache({
          abilities: baseData.abilities,
          trees: baseData.trees,
          activities: baseData.activities,
          recentAssessments: baseData.assessments,
          lastUpdated: Date.now(),
          assessmentDate: selectedAssessmentDate,
          mediaDate: selectedMediaDate,
        });

        if ((window as any).performanceMonitor) {
          (window as any).performanceMonitor.updateCacheHitRate(0);
        }
      }

      await Promise.all([
        loadStudentsWithoutAssessment(),
        loadStudentsMediaStatus(),
      ]);
    } catch (error) {
      console.error('載入管理面板資料時發生錯誤:', error);
    } finally {
      setLoading(false);
    }
  }, [
    cache,
    effectiveOrgId,
    loadBaseData,
    loadStudentsMediaStatus,
    loadStudentsWithoutAssessment,
    orgDataDisabled,
    selectedAssessmentDate,
    selectedMediaDate,
    userEmail,
    saasUser,
    sessionUser,
  ]);

  useEffect(() => {
    if (hasForcedOrg || disableOrgFallback) {
      return;
    }

    let resolvedOrg: OrganizationProfile = fallbackOrganization;

    const queryOrgId = searchParams?.get('orgId');
    const queryOrgName = searchParams?.get('orgName');
    const queryOrgSlug = searchParams?.get('orgSlug');

    if (queryOrgId) {
      resolvedOrg = {
        id: queryOrgId,
        name: queryOrgName || fallbackOrganization.name,
        slug: queryOrgSlug || fallbackOrganization.slug,
        status: null,
      };
    } else if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('hanami_current_org');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.id) {
            resolvedOrg = {
              id: parsed.id,
              name: parsed.name || fallbackOrganization.name,
              slug: parsed.slug || fallbackOrganization.slug,
              status: parsed.status ?? null,
            };
          }
        }
      } catch (error) {
        console.error('student-progress: failed to parse stored organization', error);
      }
    }

    if (
      (!resolvedOrg || !resolvedOrg.id || resolvedOrg.id === fallbackOrganization.id) &&
      typeof window !== 'undefined'
    ) {
      try {
        const session = getUserSession();
        if (session?.organization?.id) {
          resolvedOrg = session.organization;
        }
      } catch (error) {
        console.error('student-progress: failed to read user session organization', error);
      }
    }

    setOrganization(resolvedOrg ?? fallbackOrganization);
    setOrganizationResolved(true);
  }, [disableOrgFallback, hasForcedOrg, searchParams]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 當選擇的評估日期改變時，重新載入需要評估的學生
  useEffect(() => {
    if (!loading) {
      loadStudentsWithoutAssessment();
    }
  }, [selectedAssessmentDate, loadStudentsWithoutAssessment, loading]);

  // 當選擇的媒體日期改變時，重新載入學生媒體狀態
  useEffect(() => {
    if (!loading) {
      loadStudentsMediaStatus();
    }
  }, [selectedMediaDate, loadStudentsMediaStatus, loading]);

  // 處理能力評估提交
  const handleAssessmentSubmit = async (assessment: any) => {
    console.log('=== handleAssessmentSubmit 函數被調用 ===');
    console.log('傳入的 assessment 參數:', assessment);
    
    try {
      console.log('提交能力評估:', assessment);

      // 準備 API 調用的資料格式
      const apiData = {
        student_id: assessment.student_id,
        tree_id: assessment.tree_id,
        assessment_date: assessment.assessment_date,
        lesson_date: assessment.lesson_date,
        teacher_id: assessment.teacher_id,
        ability_assessments: assessment.ability_assessments || {},
        overall_performance_rating: assessment.overall_performance_rating || 3,
        general_notes: assessment.general_notes || '',
        next_lesson_focus: assessment.next_lesson_focus || '',
        goals: assessment.goals || [],
        organization_id: effectiveOrgId || null,
      };

      console.log('準備的 API 資料:', apiData);
      console.log('goals 數量:', apiData.goals.length);
      apiData.goals.forEach((goal: any, index: number) => {
        console.log(`目標 ${index + 1}:`, {
          goal_id: goal.goal_id,
          assessment_mode: goal.assessment_mode,
          progress_level: goal.progress_level,
          selected_levels: goal.selected_levels
        });
      });

      // 調用 API
      console.log('調用 API...');
      const response = await fetch('/api/student-ability-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '提交失敗');
      }

      const result = await response.json();
      console.log('API 回應成功:', result);
      
      alert('能力評估已成功提交！');
      
      // 關閉模態視窗
      setShowAssessmentModal(false);
      setSelectedStudentForAssessment(null);
      
      // 清除相關快取
      clearCache('student_assessment_status');
      
      // 重新載入需要評估的學生列表
      loadStudentsWithoutAssessment();
      
    } catch (error) {
      console.error('提交能力評估失敗:', error);
      alert('提交失敗: ' + (error as Error).message);
    }
  };

  // 篩選能力評估記錄
  useEffect(() => {
    let filtered = [...recentAssessments];
    
    // 搜尋篩選
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(assessment =>
        assessment.student?.full_name?.toLowerCase().includes(query) ||
        assessment.tree?.tree_name?.toLowerCase().includes(query) ||
        assessment.general_notes?.toLowerCase().includes(query)
      );
    }
    
    // 日期篩選
    if (selectedDate) {
      filtered = filtered.filter(assessment =>
        assessment.assessment_date === selectedDate
      );
    }
    
    setFilteredAssessments(filtered);
  }, [recentAssessments, searchQuery, selectedDate]);

  // 處理能力評估記錄點擊
  const handleAssessmentClick = (assessment: AbilityAssessment) => {
    window.location.href = `${navigationPaths.assessments}?student_id=${assessment.student_id}&assessment_id=${assessment.id}`;
  };

  useEffect(() => {
    setCache(null);
  }, [effectiveOrgId]);

  const displayOrgWarning = showOrgEmptyState;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#EADBC8] border-t-[#A64B2A] rounded-full animate-spin"></div>
            </div>
            <p className="text-hanami-text font-medium">載入學生進度管理中...</p>
            <p className="text-hanami-text-secondary text-sm">正在優化載入速度</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-7xl mx-auto">
        {displayOrgWarning && (
          <div className="mb-8 rounded-3xl border border-hanami-border bg-white px-6 py-6 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <Image
                src="/rabbit.png"
                alt="Hanami 機構提示"
                width={56}
                height={56}
                className="h-14 w-14"
              />
            </div>
            <h2 className="text-lg font-semibold text-hanami-text">尚未設定機構資料</h2>
            <p className="mt-2 text-sm text-hanami-text-secondary">
              請先創建屬於您的機構，並建立學生與課程資料後再查看進度統計。
            </p>
          </div>
        )}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-hanami-text mb-2">
                學生進度管理
              </h1>
              <p className="text-hanami-text-secondary">
                管理學生發展能力、成長樹和教學活動
              </p>
            </div>
          </div>
        </div>

        {/* 學生進度管理導航按鈕區域 */}
        <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
          <ResponsiveNavigationDropdown
            items={[
              { icon: BarChart3, label: '進度管理面板', href: navigationPaths.dashboard, variant: 'primary' },
              { icon: TreePine, label: '成長樹管理', href: navigationPaths.growthTrees, variant: 'secondary' },
              { icon: BookOpenIcon, label: '學習路線管理', href: navigationPaths.learningPaths, variant: 'secondary' },
              { icon: TrendingUp, label: '發展能力圖卡', href: navigationPaths.abilities, variant: 'secondary' },
              { icon: Gamepad2, label: '教學活動管理', href: navigationPaths.activities, variant: 'secondary' },
              { icon: GraduationCap, label: '能力評估管理', href: navigationPaths.assessments, variant: 'secondary' },
              { icon: Video, label: '學生媒體管理', href: navigationPaths.media, variant: 'secondary' },
              { icon: Users, label: '返回學生管理', href: navigationPaths.studentManagement, variant: 'accent' },
            ]}
            currentPage={navigationPaths.dashboard}
          />
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <HanamiCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-hanami-primary to-hanami-secondary rounded-full">
                <StarIcon className="h-6 w-6 text-hanami-text" />
                </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-hanami-text-secondary">發展能力</p>
                <p className="text-2xl font-bold text-hanami-text">{abilities.length}</p>
            </div>
            </div>
          </HanamiCard>

          <HanamiCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-hanami-accent to-hanami-primary rounded-full">
                <TreePine className="h-6 w-6 text-hanami-text" />
            </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-hanami-text-secondary">成長樹</p>
                <p className="text-2xl font-bold text-hanami-text">{trees.length}</p>
          </div>
        </div>
          </HanamiCard>

          <HanamiCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-hanami-secondary to-hanami-accent rounded-full">
                <Users className="h-6 w-6 text-hanami-text" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-hanami-text-secondary">教學活動</p>
                <p className="text-2xl font-bold text-hanami-text">{activities.length}</p>
              </div>
            </div>
          </HanamiCard>

          <HanamiCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-hanami-success to-hanami-primary rounded-full">
                <ClockIcon className="h-6 w-6 text-hanami-text" />
            </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-hanami-text-secondary">最近進度</p>
                <p className="text-2xl font-bold text-hanami-text">{recentAssessments.length}</p>
                  </div>
                  </div>
          </HanamiCard>

          <HanamiCard className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full">
                <VideoCameraIcon className="h-6 w-6 text-white" />
            </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-hanami-text-secondary">今日媒體</p>
                <p className="text-2xl font-bold text-hanami-text">{studentsWithMedia.length}</p>
                  </div>
                  </div>
          </HanamiCard>
            </div>

        {/* 主要內容區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 學生評估狀態 - 左邊 */}
          <HanamiCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-hanami-text">
                {selectedAssessmentDate === getHKDateString() ? '今天' : selectedAssessmentDate} 學生評估狀態
              </h3>
              <div className="flex items-center gap-2">
            <button
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDatePicker(true)}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {selectedAssessmentDate}
            </button>
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
          </div>
        </div>

            {/* 載入動畫 */}
            {loadingStudents && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-[#EADBC8] border-t-[#A64B2A] rounded-full animate-spin"></div>
            </div>
                  <p className="text-sm text-hanami-text-secondary">載入學生資料中...</p>
            </div>
            </div>
            )}

            {/* 學生評估內容 */}
            {!loadingStudents && (
              <>
                {/* 未評估學生 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                    <h4 className="font-semibold text-hanami-text">未評估 ({studentsWithoutAssessment.length})</h4>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {studentsWithoutAssessment.length > 0 ? (
                      studentsWithoutAssessment.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:border-amber-300 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">
                                  {student.full_name.charAt(0)}
                </span>
          </div>
                              <div>
                                <p className="font-medium text-hanami-text text-sm">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-hanami-text-secondary">
                                  {student.course_type || '未設定課程'}
                        </p>
                      </div>
                        </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                {student.lesson_time || '時間未定'}
                          </span>
                              <span className="text-gray-500">
                                最後評估: {student.last_assessment_date ? new Date(student.last_assessment_date).toLocaleDateString('zh-TW') : '從未評估'}
                            </span>
                          </div>
                          </div>
                          <div className="text-right">
                        <button
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500 transition-all duration-200 shadow-sm"
                              onClick={() => {
                                setSelectedStudentForAssessment(student);
                                setShowAssessmentModal(true);
                              }}
                            >
                              <AcademicCapIcon className="w-3 h-3" />
                              新增評估
                        </button>
                      </div>
                    </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-hanami-text-secondary text-sm">
                        <StarIcon className="h-8 w-8 mx-auto mb-1 text-green-300" />
                        <p>所有學生都已評估</p>
                      </div>
        )}
      </div>
    </div>

                {/* 已評估學生 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <h4 className="font-semibold text-hanami-text">已評估 ({studentsAssessed.length})</h4>
          </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {studentsAssessed.length > 0 ? (
                      studentsAssessed.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-green-300 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">
                                  {student.full_name.charAt(0)}
                                </span>
        </div>
            <div>
                                <p className="font-medium text-hanami-text text-sm">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-hanami-text-secondary">
                                  {student.course_type || '未設定課程'}
                                </p>
                    </div>
                    </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                {student.lesson_time || '時間未定'}
                              </span>
                              <span className="text-gray-500">
                                已評估 ✓
                              </span>
                    </div>
                  </div>
                          <div className="text-right">
                            <span className="text-green-600 text-xs font-medium">已完成</span>
              </div>
            </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-hanami-text-secondary text-sm">
                        <AcademicCapIcon className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                        <p>沒有已評估的學生</p>
                      </div>
                    )}
                    </div>
                          </div>

                {/* 未分配成長樹學生 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <h4 className="font-semibold text-hanami-text">未分配成長樹 ({studentsNoTree.length})</h4>
                          </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {studentsNoTree.length > 0 ? (
                      studentsNoTree.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-rose-400 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">
                                  {student.full_name.charAt(0)}
                                </span>
                    </div>
                              <div>
                                <p className="font-medium text-hanami-text text-sm">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-hanami-text-secondary">
                                  {student.course_type || '未設定課程'}
                                </p>
                  </div>
              </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                {student.lesson_time || '時間未定'}
                              </span>
                              <span className="text-gray-500">
                                最後評估: {student.last_assessment_date ? new Date(student.last_assessment_date).toLocaleDateString('zh-TW') : '從未評估'}
                              </span>
                </div>
            </div>
                          <div className="text-right">
                <button
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-red-400 to-rose-400 text-white hover:from-red-500 hover:to-rose-500 transition-all duration-200 shadow-sm"
                          onClick={() => {
                                // 設置選中的學生並開啟成長樹分配模態視窗
                                setSelectedStudentForTreeAssignment(student);
                                setShowTreeAssignmentModal(true);
                          }}
                        >
                              <TreePine className="w-3 h-3" />
                              分配成長樹
                        </button>
                    </div>
                  </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-hanami-text-secondary text-sm">
                        <TreePine className="h-8 w-8 mx-auto mb-1 text-gray-300" />
                        <p>所有學生都已分配成長樹</p>
                  </div>
                )}
              </div>
            </div>
              </>
            )}
          </HanamiCard>

          {/* 最近能力評估記錄 - 右邊 */}
          <HanamiCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-hanami-text">
                最近能力評估記錄
              </h3>
              <div className="flex items-center gap-2">
                <HanamiNumberSelector
                  value={assessmentLimit}
                  onChange={setAssessmentLimit}
                  min={1}
                  max={100}
                  step={1}
                  suffix="筆"
                />
              </div>
          </div>
            
            {/* 搜尋區域 */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <HanamiInput
                  className="pl-10"
                  placeholder="搜尋學生姓名或成長樹..."
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(searchQuery ? filteredAssessments : recentAssessments).map((assessment) => (
                <div 
                  key={assessment.id} 
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => handleAssessmentClick(assessment)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-bold">
                          {assessment.student?.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                    <div>
                        <p className="font-medium text-hanami-text text-sm">
                          {assessment.student?.full_name || '未知學生'}
                        </p>
                        <p className="text-xs text-hanami-text-secondary">
                          {assessment.tree?.tree_name || '未知成長樹'}
                        </p>
                      </div>
                      </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {new Date(assessment.assessment_date).toLocaleDateString('zh-TW')}
                      </span>
                      <span className="text-gray-500">
                        評估完成 ✓
                      </span>
                    </div>
                    </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-blue-400 to-indigo-400 text-white hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-sm">
                      <AcademicCapIcon className="w-3 h-3" />
                      查看詳情
                          </div>
                          </div>
                </div>
                      ))}
              {((searchQuery ? filteredAssessments : recentAssessments).length === 0) && (
                <div className="text-center py-8 text-hanami-text-secondary">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>沒有找到符合條件的評估記錄</p>
                  </div>
                )}
                </div>
          </HanamiCard>

          {/* 學生媒體狀態 - 第三個卡片 */}
          <HanamiCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-hanami-text">
                {selectedMediaDate === getHKDateString() ? '今天' : selectedMediaDate} 學生媒體狀態
              </h3>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={() => setShowMediaDatePicker(true)}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {selectedMediaDate}
                </button>
                <VideoCameraIcon className="h-6 w-6 text-blue-500" />
              </div>
            </div>

            {/* 載入動畫 */}
            {loadingStudents && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-[#EADBC8] border-t-[#A64B2A] rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm text-hanami-text-secondary">載入學生媒體狀態中...</p>
                </div>
              </div>
            )}

            {/* 媒體狀態統計 */}
            {!loadingStudents && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">未上傳媒體</p>
                      <p className="text-2xl font-bold text-red-700">{studentsWithoutMedia.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">已上傳媒體</p>
                      <p className="text-2xl font-bold text-green-700">{studentsWithMedia.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 學生列表 */}
            {!loadingStudents && (studentsWithoutMedia.length > 0 || studentsWithMedia.length > 0) && (
              <div className="space-y-4">
                {/* 未上傳媒體學生 */}
                {studentsWithoutMedia.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-hanami-text mb-3 flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      未上傳媒體學生 ({studentsWithoutMedia.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {studentsWithoutMedia.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-rose-400 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">
                                  {student.full_name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-hanami-text text-sm">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-hanami-text-secondary">
                                  {student.course_type || '未設定課程'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                {student.lesson_time || '時間未定'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <button
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-red-400 to-rose-400 text-white hover:from-red-500 hover:to-rose-500 transition-all duration-200 shadow-sm"
                              onClick={() => {
                                window.location.href = `${navigationPaths.media}?student_id=${student.id}`;
                              }}
                            >
                              <VideoCameraIcon className="w-3 h-3" />
                              查看媒體
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 已上傳媒體學生 */}
                {studentsWithMedia.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-hanami-text mb-3 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      已上傳媒體學生 ({studentsWithMedia.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {studentsWithMedia.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-green-300 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">
                                  {student.full_name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-hanami-text text-sm">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-hanami-text-secondary">
                                  {student.course_type || '未設定課程'} • {student.media_count} 個檔案
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                {student.lesson_time || '時間未定'}
                              </span>
                              <span className="text-gray-500">
                                已上傳 ✓
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <button
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-green-400 to-emerald-400 text-white hover:from-green-500 hover:to-emerald-500 transition-all duration-200 shadow-sm"
                              onClick={() => {
                                window.location.href = `${navigationPaths.media}?student_id=${student.id}`;
                              }}
                            >
                              <VideoCameraIcon className="w-3 h-3" />
                              查看媒體
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 沒有學生時顯示 */}
            {!loadingStudents && studentsWithoutMedia.length === 0 && studentsWithMedia.length === 0 && (
              <div className="text-center py-8 text-hanami-text-secondary">
                <VideoCameraIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>該日期沒有學生課程安排</p>
              </div>
            )}
          </HanamiCard>
              </div>
            </div>

      {/* 能力評估模態視窗 */}
      {showAssessmentModal && (
        <SimpleAbilityAssessmentModal
          onClose={() => {
            setShowAssessmentModal(false);
            setSelectedStudentForAssessment(null);
          }}
          onSubmit={handleAssessmentSubmit}
          defaultStudent={selectedStudentForAssessment ? {
            id: selectedStudentForAssessment.id,
            full_name: selectedStudentForAssessment.full_name,
            nick_name: selectedStudentForAssessment.nick_name ?? undefined
          } : undefined}
          defaultAssessmentDate={selectedAssessmentDate}
          lockStudent={!!selectedStudentForAssessment} // 如果是從特定學生點擊進入，則鎖定學生選擇
        />
      )}

      {/* 成長樹分配模態視窗 */}
      {showTreeAssignmentModal && (
        <StudentTreeAssignmentModal
          isOpen={showTreeAssignmentModal}
          onClose={() => {
            setShowTreeAssignmentModal(false);
            setSelectedStudentForTreeAssignment(null);
          }}
          student={selectedStudentForTreeAssignment ? {
            id: selectedStudentForTreeAssignment.id,
            full_name: selectedStudentForTreeAssignment.full_name,
            nick_name: selectedStudentForTreeAssignment.nick_name ?? undefined,
            course_type: selectedStudentForTreeAssignment.course_type ?? undefined
          } : undefined}
          onSuccess={() => {
            // 重新載入需要評估的學生列表
            loadStudentsWithoutAssessment();
          }}
        />
      )}

      {/* 日期選擇器 */}
      {showDatePicker && (
        <Calendarui
          value={selectedAssessmentDate}
          onSelect={(date) => {
            setSelectedAssessmentDate(date);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* 媒體日期選擇器 */}
      {showMediaDatePicker && (
        <Calendarui
          value={selectedMediaDate}
          onSelect={(date) => {
            setSelectedMediaDate(date);
            setShowMediaDatePicker(false);
          }}
          onClose={() => setShowMediaDatePicker(false)}
        />
      )}

    </div>
  );
}
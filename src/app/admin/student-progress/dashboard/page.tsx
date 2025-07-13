'use client';

import { 
  ChartBarIcon, 
  ClockIcon, 
  StarIcon, 
  TrophyIcon, 
  UserGroupIcon, 
} from '@heroicons/react/24/outline';
import { BarChart3, TreePine, TrendingUp, Gamepad2, FileText, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

import { HanamiCard } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { DevelopmentAbility, GrowthTree, TeachingActivity, StudentProgress } from '@/types/progress';

export default function StudentProgressDashboard() {
  const [abilities, setAbilities] = useState<DevelopmentAbility[]>([]);
  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [activities, setActivities] = useState<TeachingActivity[]>([]);
  const [recentProgress, setRecentProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 載入發展能力
      const { data: abilitiesData, error: abilitiesError } = await supabase
        .from('hanami_development_abilities')
        .select('*')
        .order('ability_name');

      if (abilitiesError) throw abilitiesError;
      // 修正 null 欄位為 undefined
      const fixedAbilities = (abilitiesData || []).map((a: any) => ({
        ...a,
        ability_description: a.ability_description ?? undefined,
        ability_icon: a.ability_icon ?? undefined,
        ability_color: a.ability_color ?? undefined,
      }));
      setAbilities(fixedAbilities);

      // 載入成長樹
      const { data: treesData, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('*')
        .eq('is_active', true)
        .order('tree_name');

      if (treesError) throw treesError;
      // 欄位轉換與 null 處理
      const fixedTrees = (treesData || []).map((t: any) => ({
        ...t,
        course_type: t.course_type ?? t.course_type_id ?? '',
        difficulty_level: t.difficulty_level ?? t.tree_level ?? 1,
        tree_description: t.tree_description ?? undefined,
      }));
      setTrees(fixedTrees);

      // 載入教學活動
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('hanami_teaching_activities')
        .select('*')
        .order('activity_name');

      if (activitiesError) throw activitiesError;
      // 欄位轉換與 null 處理
      const fixedActivities = (activitiesData || []).map((a: any) => ({
        ...a,
        estimated_duration: a.estimated_duration ?? a.duration_minutes ?? 0,
        activity_description: a.activity_description ?? undefined,
        materials_needed: a.materials_needed ?? [],
        instructions: a.instructions ?? undefined,
      }));
      setActivities(fixedActivities);

      // 載入最近進度記錄
      const { data: progressData, error: progressError } = await supabase
        .from('hanami_student_progress')
        .select(`
          *,
          student:Hanami_Students(full_name, nick_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (progressError) throw progressError;
      // 欄位轉換與 null 處理
      const fixedProgress = (progressData || []).map((p: any) => ({
        ...p,
        lesson_date: p.lesson_date ?? p.lesson_id ?? '',
        performance_rating: p.performance_rating ?? 0,
        notes: p.notes ?? undefined,
        next_target: p.next_target ?? undefined,
      }));
      setRecentProgress(fixedProgress);

    } catch (error) {
      console.error('載入儀表板資料時發生錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-hanami-text">載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hanami-text mb-2">
            學生進度管理儀表板
          </h1>
          <p className="text-hanami-text-secondary">
            管理學生發展能力、成長樹和教學活動
          </p>
        </div>

        {/* 學生進度管理導航按鈕區域 */}
        <div className="mb-6 p-4 bg-gradient-to-br from-white to-[#FFFCEB] rounded-xl border border-[#EADBC8] shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#A64B2A] text-white hover:bg-[#8B3A1F] transition-colors"
              onClick={() => window.location.href = '/admin/student-progress/dashboard'}
            >
              <BarChart3 className="w-4 h-4" />
              進度儀表板
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/growth-trees'}
            >
              <TreePine className="w-4 h-4" />
              成長樹管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/abilities'}
            >
              <TrendingUp className="w-4 h-4" />
              發展能力圖卡
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress/activities'}
            >
              <Gamepad2 className="w-4 h-4" />
              教學活動管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/student-progress'}
            >
              <FileText className="w-4 h-4" />
              進度記錄管理
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#FFF9F2]"
              onClick={() => window.location.href = '/admin/students'}
            >
              <Users className="w-4 h-4" />
              返回學生管理
            </button>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <TrophyIcon className="h-6 w-6 text-hanami-text" />
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
                <UserGroupIcon className="h-6 w-6 text-hanami-text" />
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
                <p className="text-2xl font-bold text-hanami-text">{recentProgress.length}</p>
              </div>
            </div>
          </HanamiCard>
        </div>

        {/* 最近進度記錄 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HanamiCard className="p-6">
            <h3 className="text-xl font-semibold text-hanami-text mb-4">
              最近進度記錄
            </h3>
            <div className="space-y-3">
              {recentProgress.map((progress) => (
                <div key={progress.id} className="flex items-center justify-between p-3 bg-hanami-surface rounded-lg">
                  <div>
                    <p className="font-medium text-hanami-text">
                      {progress.student?.full_name || '未知學生'}
                    </p>
                    <p className="text-sm text-hanami-text-secondary">
                      {new Date(progress.lesson_date).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-hanami-text">
                        {progress.performance_rating}/5
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </HanamiCard>

          <HanamiCard className="p-6">
            <h3 className="text-xl font-semibold text-hanami-text mb-4">
              快速操作
            </h3>
            <div className="space-y-3">
              <button className="w-full p-3 bg-gradient-to-r from-hanami-primary to-hanami-secondary text-hanami-text font-medium rounded-lg hover:shadow-lg transition-all duration-200">
                新增成長樹
              </button>
              <button className="w-full p-3 bg-gradient-to-r from-hanami-accent to-hanami-primary text-hanami-text font-medium rounded-lg hover:shadow-lg transition-all duration-200">
                安排教學活動
              </button>
              <button className="w-full p-3 bg-gradient-to-r from-hanami-secondary to-hanami-accent text-hanami-text font-medium rounded-lg hover:shadow-lg transition-all duration-200">
                查看學生進度
              </button>
            </div>
          </HanamiCard>
        </div>
      </div>
    </div>
  );
} 
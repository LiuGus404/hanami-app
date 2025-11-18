'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenIcon,
  ClockIcon,
  ChartBarIcon,
  UsersIcon,
  PlusIcon,
  XMarkIcon,
  InformationCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { BarChart3, TreePine, TrendingUp, Gamepad2, Users, GraduationCap, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import { ResponsiveNavigationDropdown } from '@/components/ui/ResponsiveNavigationDropdown';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUser } from '@/hooks/useUser';
import GrowthTreeActivitiesPanel from '@/components/ui/GrowthTreeActivitiesPanel';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const PLACEHOLDER_ORG_IDS = new Set([
  'default-org',
  'unassigned-org-placeholder',
]);

interface HanamiLearningPath {
  id: string;
  name: string;
  originalName?: string;
  description: string;
  tree_id: string | null;
  nodes: any[];
  startNodeId: string | null;
  endNodeId: string | null;
  totalDuration: number;
  difficulty: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
  org_id: string | null;
}

interface GrowthTreeSummary {
  id: string;
  tree_name: string;
}

type NavigationOverrides = Partial<{
  dashboard: string;
  growthTrees: string;
  learningPaths: string;
  abilities: string;
  activities: string;
  assessments: string;
  media: string;
  studentManagement: string;
}>;

type LearningPathsPageProps = {
  navigationOverrides?: NavigationOverrides;
  forcedOrgId?: string | null;
  forcedOrgName?: string | null;
  disableOrgFallback?: boolean;
};

export default function LearningPathsPage({
  navigationOverrides,
  forcedOrgId = null,
  forcedOrgName = null,
  disableOrgFallback = false,
}: LearningPathsPageProps = {}) {
  const { currentOrganization } = useOrganization();
  const { user } = useUser();
  
  const [paths, setPaths] = useState<HanamiLearningPath[]>([]);
  const [trees, setTrees] = useState<GrowthTreeSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTreeForPath, setSelectedTreeForPath] = useState<string | null>(null);
  const [editingPath, setEditingPath] = useState<HanamiLearningPath | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showActivityFlowDirectly, setShowActivityFlowDirectly] = useState<boolean>(false);
  const [editingPathName, setEditingPathName] = useState<string>('');
  const [isEditingPathName, setIsEditingPathName] = useState<boolean>(false);

  const normalizedForcedOrgId =
    forcedOrgId &&
    UUID_REGEX.test(forcedOrgId) &&
    !PLACEHOLDER_ORG_IDS.has(forcedOrgId)
      ? forcedOrgId
      : null;

  const effectiveOrgId = useMemo(() => {
    return normalizedForcedOrgId || currentOrganization?.id || user?.organization?.id || null;
  }, [normalizedForcedOrgId, currentOrganization?.id, user?.organization?.id]);

  const validOrgId = useMemo(() => {
    if (!effectiveOrgId) return null;
    return UUID_REGEX.test(effectiveOrgId) && !PLACEHOLDER_ORG_IDS.has(effectiveOrgId)
      ? effectiveOrgId
      : null;
  }, [effectiveOrgId]);

  const orgDataDisabled = disableOrgFallback && !validOrgId;
  const organizationNameLabel = forcedOrgName || currentOrganization?.name || user?.organization?.name || '您的機構';

  const navigationPaths = useMemo(
    () => ({
      dashboard: '/admin/student-progress',
      growthTrees: '/admin/student-progress/growth-trees',
      learningPaths: '/admin/student-progress/learning-paths',
      abilities: '/admin/student-progress/abilities',
      activities: '/admin/student-progress/activities',
      assessments: '/admin/student-progress/ability-assessments',
      media: '/admin/student-progress/student-media',
      studentManagement: '/admin/students',
      ...(navigationOverrides ?? {}),
    }),
    [navigationOverrides],
  );

  useEffect(() => {
    const loadData = async () => {
      if (orgDataDisabled || !validOrgId) {
        setPaths([]);
        setTrees([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const treesQuery = supabase
          .from('hanami_growth_trees')
          .select('id, tree_name')
          .eq('is_active', true)
          .eq('org_id', validOrgId)
          .order('tree_name', { ascending: true });

        const pathsQuery = supabase
          .from('hanami_learning_paths')
          .select('*')
          .eq('is_active', true)
          .eq('org_id', validOrgId)
          .order('created_at', { ascending: false });

        const [{ data: treesData, error: treesError }, { data: pathsData, error: pathsError }]
          = await Promise.all([treesQuery, pathsQuery]);

        if (treesError) throw treesError;
        if (pathsError) throw pathsError;

        setTrees(treesData ?? []);

        const processedPaths = (pathsData ?? []).map((path) => ({
          id: path.id,
          name: path.name ?? '學習路線',
          originalName: path.name ?? undefined,
          description: path.description ?? '',
          tree_id: path.tree_id ?? null,
          nodes: path.nodes ?? [],
          startNodeId: path.start_node_id ?? null,
          endNodeId: path.end_node_id ?? null,
          totalDuration: path.total_duration ?? 0,
          difficulty: path.difficulty ?? 1,
          tags: path.tags ?? [],
          created_at: path.created_at ?? new Date().toISOString(),
          updated_at: path.updated_at ?? new Date().toISOString(),
          is_active: path.is_active ?? true,
          org_id: path.org_id ?? null,
        }));

        setPaths(processedPaths);
      } catch (error: any) {
        console.error('載入學習路線資料失敗', error);
        setErrorMessage('載入學習路線資料失敗，請稍後再試。');
        setPaths([]);
        setTrees([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [validOrgId, orgDataDisabled]);

  const ensureOrgAvailable = () => {
    if (orgDataDisabled || !validOrgId) {
      toast.error('請先創建屬於您的機構');
      return false;
    }
    return true;
  };

  const filteredPaths = useMemo(() => {
    if (orgDataDisabled || !validOrgId) return [];

    const normalizedQuery = searchQuery.trim().toLowerCase();

    return paths.filter((path) => {
      const treeName = trees.find((tree) => tree.id === path.tree_id)?.tree_name ?? '';

      const matchesSearch =
        !normalizedQuery ||
        path.name.toLowerCase().includes(normalizedQuery) ||
        path.description.toLowerCase().includes(normalizedQuery) ||
        treeName.toLowerCase().includes(normalizedQuery);

      return matchesSearch;
    });
  }, [paths, trees, searchQuery, orgDataDisabled, validOrgId]);

  if (orgDataDisabled || !validOrgId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <ResponsiveNavigationDropdown
            items={[
              { icon: BarChart3, label: '進度管理面板', href: navigationPaths.dashboard, variant: 'secondary' },
              { icon: TreePine, label: '成長樹管理', href: navigationPaths.growthTrees, variant: 'secondary' },
              { icon: BookOpenIcon, label: '學習路線管理', href: navigationPaths.learningPaths, variant: 'primary' },
              { icon: TrendingUp, label: '發展能力圖卡', href: navigationPaths.abilities, variant: 'secondary' },
              { icon: Gamepad2, label: '教學活動管理', href: navigationPaths.activities, variant: 'secondary' },
              { icon: Users, label: '返回學生管理', href: navigationPaths.studentManagement, variant: 'accent' },
            ]}
            currentPage={navigationPaths.learningPaths}
          />

          <div className="rounded-3xl border border-[#EADBC8] bg-white px-10 py-16 text-center shadow-sm">
            <div className="mb-6 flex justify-center">
              <Image alt="機構提示" height={96} width={96} src="/tree ui.png" />
            </div>
            <h2 className="text-xl font-semibold text-[#4B4036]">尚未設定機構資料</h2>
            <p className="mt-3 text-sm text-[#2B3A3B]">
              請先創建屬於您的機構
              {organizationNameLabel ? `（${organizationNameLabel}）` : ''}
              ，才能管理學習路線。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <ResponsiveNavigationDropdown
          items={[
            { icon: BarChart3, label: '進度管理面板', href: navigationPaths.dashboard, variant: 'secondary' },
            { icon: TreePine, label: '成長樹管理', href: navigationPaths.growthTrees, variant: 'secondary' },
            { icon: BookOpenIcon, label: '學習路線管理', href: navigationPaths.learningPaths, variant: 'primary' },
            { icon: TrendingUp, label: '發展能力圖卡', href: navigationPaths.abilities, variant: 'secondary' },
            { icon: Gamepad2, label: '教學活動管理', href: navigationPaths.activities, variant: 'secondary' },
            { icon: Users, label: '返回學生管理', href: navigationPaths.studentManagement, variant: 'accent' },
          ]}
          currentPage={navigationPaths.learningPaths}
        />

        <div className="rounded-3xl border border-[#EADBC8] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#4B4036]">學習路線管理</h1>
              <p className="text-sm text-[#2B3A3B]">
                管理屬於 {organizationNameLabel} 的學習路線，為學生規劃有趣的學習旅程。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <HanamiInput
                className="w-full sm:w-72"
                placeholder="搜尋學習路線或成長樹..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <HanamiButton
                variant="primary"
                onClick={() => {
                  if (ensureOrgAvailable()) {
                    if (trees.length === 0) {
                      toast.error('請先創建成長樹，才能建立學習路線');
                      return;
                    }
                    setShowCreateModal(true);
                  }
                }}
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                新增學習路線
              </HanamiButton>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-[#FFE0E0] bg-[#FFF5F5] p-4 text-[#B45309] shadow-sm">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-[#2B3A3B]">載入中...</div>
        ) : filteredPaths.length === 0 ? (
          <div className="rounded-3xl border border-[#EADBC8] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#FFFDF8]">
              <BookOpenIcon className="h-12 w-12 text-[#2B3A3B]" />
            </div>
            <h3 className="text-lg font-medium text-[#4B4036]">
              {searchQuery ? '沒有找到符合條件的學習路線' : '尚未建立學習路線'}
            </h3>
            <p className="mt-2 text-sm text-[#2B3A3B]">
              {searchQuery
                ? '請嘗試調整搜尋關鍵字或清除條件'
                : '建立第一條路線，協助學生循序漸進完成課程目標'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {filteredPaths.map((path) => {
                const treeName = trees.find((tree) => tree.id === path.tree_id)?.tree_name ?? '未指定成長樹';

                return (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HanamiCard className="flex h-full flex-col justify-between gap-6 p-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] p-2">
                            <BookOpenIcon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[#4B4036]">{treeName}</h3>
                            <p className="text-sm text-[#2B3A3B]">{path.name}</p>
                          </div>
                        </div>

                        <p className="text-sm text-[#2B3A3B] line-clamp-3">{path.description || '尚未填寫描述。'}</p>
                        <div className="space-y-3 text-sm text-[#2B3A3B]">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2">
                              <ClockIcon className="h-4 w-4" /> 總時長
                            </span>
                            <span className="font-medium text-[#4B4036]">{path.totalDuration} 分鐘</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2">
                              <ChartBarIcon className="h-4 w-4" /> 難度
                            </span>
                            <span className="rounded-full bg-[#FFFDF8] px-2 py-0.5 text-xs font-medium text-[#4B4036]">
                              {path.difficulty}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2">
                              <UsersIcon className="h-4 w-4" /> 節點數
                            </span>
                            <span className="font-medium text-[#4B4036]">{path.nodes.length}</span>
                          </div>
                        </div>
                        {path.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {path.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#FFFDF8] px-2 py-1 text-xs text-[#2B3A3B]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <HanamiButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (!ensureOrgAvailable()) return;
                            if (!path.tree_id) {
                              toast.error('此學習路線尚未關聯成長樹，無法編輯');
                              return;
                            }
                            setEditingPath(path);
                            setEditingPathName(path.name);
                            setIsEditingPathName(false);
                            setShowActivityFlowDirectly(false); // 確保不顯示活動流程
                            setShowEditModal(true);
                          }}
                        >
                          編輯
                        </HanamiButton>
                        <HanamiButton
                          variant="cute"
                          size="sm"
                          onClick={() => {
                            if (!ensureOrgAvailable()) return;
                            if (!path.tree_id) {
                              toast.error('此學習路線尚未關聯成長樹，無法查看活動流程');
                              return;
                            }
                            setEditingPath(path);
                            setEditingPathName(path.name);
                            setIsEditingPathName(false);
                            setShowActivityFlowDirectly(true);
                            setShowEditModal(true);
                          }}
                        >
                          預覽
                        </HanamiButton>
                      </div>
                    </HanamiCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* 新增學習路線模態框 */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl border border-[#EADBC8] shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EADBC8] bg-gradient-to-r from-[#FDF6F0] to-[#F5F0EB]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#4B4036]">新增學習路線</h3>
                    <p className="text-sm text-[#2B3A3B] mt-1">選擇成長樹以建立學習路線</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedTreeForPath(null);
                    }}
                    className="p-2 hover:bg-[#EADBC8] rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-3">
                      選擇成長樹
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTreeForPath || ''}
                        onChange={(e) => setSelectedTreeForPath(e.target.value)}
                        className="w-full px-4 py-3 pr-10 border border-[#EADBC8] rounded-lg bg-white text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent appearance-none cursor-pointer transition-all duration-200 hover:border-[#D4C4B0]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23A68A64' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.25em 1.25em',
                        }}
                      >
                        <option value="">請選擇成長樹</option>
                        {trees.map((tree) => (
                          <option key={tree.id} value={tree.id}>
                            {tree.tree_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 提醒按鈕 */}
                  <div className="rounded-xl border border-[#FFD59A] bg-gradient-to-r from-[#FFF9F2] to-[#FFF4ED] p-4">
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="w-5 h-5 text-[#D48347] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#4B4036] mb-2">
                          建立學習路線前，請先新增教學活動
                        </p>
                        <p className="text-xs text-[#6E5A4A] mb-3">
                          學習路線需要從教學活動中選擇活動來建立。如果還沒有活動，請先到教學活動管理新增活動。
                        </p>
                        <HanamiButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            window.location.href = navigationPaths.activities;
                          }}
                          className="w-full sm:w-auto"
                        >
                          <span>前往教學活動管理</span>
                          <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </HanamiButton>
                      </div>
                    </div>
                  </div>
                  
                  {selectedTreeForPath && (
                    <div className="mt-4">
                      <GrowthTreeActivitiesPanel
                        treeId={selectedTreeForPath}
                        treeName={trees.find(t => t.id === selectedTreeForPath)?.tree_name || '成長樹'}
                        onClose={() => {
                          setShowCreateModal(false);
                          setSelectedTreeForPath(null);
                          // 重新載入學習路線列表
                          const loadData = async () => {
                            if (!validOrgId) return;
                            try {
                              const pathsQuery = supabase
                                .from('hanami_learning_paths')
                                .select('*')
                                .eq('is_active', true)
                                .eq('org_id', validOrgId)
                                .order('created_at', { ascending: false });
                              
                              const { data: pathsData, error: pathsError } = await pathsQuery;
                              
                              if (pathsError) throw pathsError;
                              
                              const processedPaths = (pathsData ?? []).map((path) => ({
                                id: path.id,
                                name: path.name ?? '學習路線',
                                originalName: path.name ?? undefined,
                                description: path.description ?? '',
                                tree_id: path.tree_id ?? null,
                                nodes: path.nodes ?? [],
                                startNodeId: path.start_node_id ?? null,
                                endNodeId: path.end_node_id ?? null,
                                totalDuration: path.total_duration ?? 0,
                                difficulty: path.difficulty ?? 1,
                                tags: path.tags ?? [],
                                created_at: path.created_at ?? new Date().toISOString(),
                                updated_at: path.updated_at ?? new Date().toISOString(),
                                is_active: path.is_active ?? true,
                                org_id: path.org_id ?? null,
                              }));
                              
                              setPaths(processedPaths);
                            } catch (error: any) {
                              console.error('載入學習路線資料失敗', error);
                            }
                          };
                          loadData();
                        }}
                      />
                    </div>
                  )}
                  
                  {!selectedTreeForPath && (
                    <div className="flex justify-end gap-3 pt-4">
                      <HanamiButton
                        variant="secondary"
                        onClick={() => {
                          setShowCreateModal(false);
                          setSelectedTreeForPath(null);
                        }}
                      >
                        取消
                      </HanamiButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 編輯學習路線模態框 */}
        {showEditModal && editingPath && editingPath.tree_id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] rounded-3xl border-2 border-[#EADBC8] shadow-2xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden"
            >
              {/* 標題欄 */}
              <div className="px-6 py-5 border-b border-[#EADBC8]/50 bg-white/70 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-xl flex items-center justify-center shadow-lg">
                      <BookOpenIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#4B4036]">
                        {trees.find(t => t.id === editingPath.tree_id)?.tree_name || '成長樹'}
                      </h3>
                      <div className="text-sm text-[#2B3A3B] mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/60 backdrop-blur-sm rounded-full text-xs border border-[#EADBC8]">
                          編輯學習路線
                        </span>
                        <span className="text-[#87704e]">•</span>
                        {isEditingPathName ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingPathName}
                              onChange={(e) => setEditingPathName(e.target.value)}
                              onBlur={async () => {
                                if (editingPathName.trim() && editingPathName !== editingPath?.name) {
                                  try {
                                    const { error } = await supabase
                                      .from('hanami_learning_paths')
                                      .update({ name: editingPathName.trim() })
                                      .eq('id', editingPath?.id);
                                    
                                    if (error) throw error;
                                    
                                    setEditingPath({ ...editingPath!, name: editingPathName.trim() });
                                    toast.success('學習路線名稱已更新');
                                    
                                    // 重新載入學習路線列表
                                    const loadData = async () => {
                                      if (!validOrgId) return;
                                      try {
                                        const pathsQuery = supabase
                                          .from('hanami_learning_paths')
                                          .select('*')
                                          .eq('is_active', true)
                                          .eq('org_id', validOrgId)
                                          .order('created_at', { ascending: false });
                                        
                                        const { data: pathsData, error: pathsError } = await pathsQuery;
                                        
                                        if (pathsError) throw pathsError;
                                        
                                        const processedPaths = (pathsData ?? []).map((path) => ({
                                          id: path.id,
                                          name: path.name ?? '學習路線',
                                          originalName: path.name ?? undefined,
                                          description: path.description ?? '',
                                          tree_id: path.tree_id ?? null,
                                          nodes: path.nodes ?? [],
                                          startNodeId: path.start_node_id ?? null,
                                          endNodeId: path.end_node_id ?? null,
                                          totalDuration: path.total_duration ?? 0,
                                          difficulty: path.difficulty ?? 1,
                                          tags: path.tags ?? [],
                                          created_at: path.created_at ?? new Date().toISOString(),
                                          updated_at: path.updated_at ?? new Date().toISOString(),
                                          is_active: path.is_active ?? true,
                                          org_id: path.org_id ?? null,
                                        }));
                                        
                                        setPaths(processedPaths);
                                      } catch (error: any) {
                                        console.error('載入學習路線資料失敗', error);
                                      }
                                    };
                                    loadData();
                                  } catch (error: any) {
                                    console.error('更新學習路線名稱失敗:', error);
                                    toast.error('更新失敗，請重試');
                                    setEditingPathName(editingPath?.name || '');
                                  }
                                }
                                setIsEditingPathName(false);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                } else if (e.key === 'Escape') {
                                  setEditingPathName(editingPath?.name || '');
                                  setIsEditingPathName(false);
                                }
                              }}
                              className="px-2 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-xs border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent min-w-[120px]"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span 
                            className="cursor-pointer hover:text-[#4B4036] transition-colors"
                            onClick={() => setIsEditingPathName(true)}
                            title="點擊編輯"
                          >
                            {editingPathName || editingPath.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPath(null);
                      setEditingPathName('');
                      setIsEditingPathName(false);
                    }}
                    className="p-2 hover:bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 border border-transparent hover:border-[#EADBC8]"
                  >
                    <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                  </button>
                </div>
              </div>
              
              {/* 內容區域 */}
              <div className="overflow-y-auto bg-gradient-to-br from-white/50 to-white/30 px-6 py-4" style={{ height: 'calc(90vh - 100px)' }}>
                <GrowthTreeActivitiesPanel
                  treeId={editingPath.tree_id}
                  treeName={trees.find(t => t.id === editingPath.tree_id)?.tree_name || '成長樹'}
                  initialShowPathList={showActivityFlowDirectly}
                  onClose={() => {
                    setShowEditModal(false);
                    setEditingPath(null);
                    setEditingPathName('');
                    setIsEditingPathName(false);
                    setShowActivityFlowDirectly(false);
                    // 重新載入學習路線列表
                    const loadData = async () => {
                      if (!validOrgId) return;
                      try {
                        const pathsQuery = supabase
                          .from('hanami_learning_paths')
                          .select('*')
                          .eq('is_active', true)
                          .eq('org_id', validOrgId)
                          .order('created_at', { ascending: false });
                        
                        const { data: pathsData, error: pathsError } = await pathsQuery;
                        
                        if (pathsError) throw pathsError;
                        
                        const processedPaths = (pathsData ?? []).map((path) => ({
                          id: path.id,
                          name: path.name ?? '學習路線',
                          originalName: path.name ?? undefined,
                          description: path.description ?? '',
                          tree_id: path.tree_id ?? null,
                          nodes: path.nodes ?? [],
                          startNodeId: path.start_node_id ?? null,
                          endNodeId: path.end_node_id ?? null,
                          totalDuration: path.total_duration ?? 0,
                          difficulty: path.difficulty ?? 1,
                          tags: path.tags ?? [],
                          created_at: path.created_at ?? new Date().toISOString(),
                          updated_at: path.updated_at ?? new Date().toISOString(),
                          is_active: path.is_active ?? true,
                          org_id: path.org_id ?? null,
                        }));
                        
                        setPaths(processedPaths);
                      } catch (error: any) {
                        console.error('載入學習路線資料失敗', error);
                      }
                    };
                    loadData();
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

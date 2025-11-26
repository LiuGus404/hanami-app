'use client';

import { useState, useEffect } from 'react';
import {
  TreePine,
  History,
  Plus,
  Eye,
  Edit3,
  Trash2,
  ArrowRight,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { HanamiButton, HanamiCard, HanamiBadge } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string;
  created_at: string;
}

interface TreeVersion {
  id: string;
  tree_id: string;
  version: string;
  version_name?: string;
  version_description?: string;
  goals_snapshot: any[];
  changes_summary?: string;
  created_at: string;
  created_by?: string;
}

interface VersionChangeLog {
  id: string;
  tree_id: string;
  change_type: 'add' | 'modify' | 'remove';
  goal_id?: string;
  goal_name?: string;
  change_details: any;
  created_at: string;
}

export default function GrowthTreeVersionsPage() {
  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [selectedTree, setSelectedTree] = useState<GrowthTree | null>(null);
  const [versions, setVersions] = useState<TreeVersion[]>([]);
  const [changeLogs, setChangeLogs] = useState<VersionChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<TreeVersion | null>(null);

  // 創建版本的表單狀態
  const [newVersion, setNewVersion] = useState({
    version: '',
    version_name: '',
    version_description: '',
    changes_summary: ''
  });

  useEffect(() => {
    loadTrees();
  }, []);

  useEffect(() => {
    if (selectedTree) {
      loadTreeVersions(selectedTree.id);
      loadChangeLogs(selectedTree.id);
    }
  }, [selectedTree]);

  const loadTrees = async () => {
    try {
      const { data, error } = await (supabase
        .from('hanami_growth_trees') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrees((data || []).map((tree: any) => ({
        ...tree,
        tree_description: tree.tree_description || undefined,
        tree_icon: tree.tree_icon || undefined,
        course_type_id: tree.course_type_id || undefined,
        tree_level: tree.tree_level || undefined
      })));
    } catch (error) {
      console.error('載入成長樹失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTreeVersions = async (treeId: string) => {
    setLoadingVersions(true);
    try {
      // 暫時使用空資料，因為相關表可能不存在
      setVersions([]);
    } catch (error) {
      console.error('載入版本失敗:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  const loadChangeLogs = async (treeId: string) => {
    try {
      // 暫時使用空資料，因為相關表可能不存在
      setChangeLogs([]);
    } catch (error) {
      console.error('載入變更日誌失敗:', error);
    }
  };

  const createNewVersion = async () => {
    if (!selectedTree || !newVersion.version) return;

    try {
      const response = await fetch('/api/assessment-version-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          treeId: selectedTree.id,
          version: newVersion.version,
          versionName: newVersion.version_name,
          versionDescription: newVersion.version_description,
          changesSummary: newVersion.changes_summary,
          createdBy: null
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 重新載入版本列表
        await loadTreeVersions(selectedTree.id);
        setShowCreateVersion(false);
        setNewVersion({
          version: '',
          version_name: '',
          version_description: '',
          changes_summary: ''
        });
      } else {
        alert('創建版本失敗: ' + result.error);
      }
    } catch (error) {
      console.error('創建版本錯誤:', error);
      alert('創建版本時發生錯誤');
    }
  };

  const compareVersions = async (fromVersion: string, toVersion: string) => {
    if (!selectedTree) return;

    try {
      // 暫時顯示提示訊息，因為相關函數可能不存在
      alert('版本比較功能正在開發中，請稍後再試。');
    } catch (error) {
      console.error('版本比較失敗:', error);
      alert('版本比較失敗: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64] mx-auto" />
            <p className="mt-4 text-[#2B3A3B]">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 font-['Quicksand',_sans-serif]">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2B3A3B] mb-2">成長樹版本管理</h1>
          <p className="text-[#87704e]">管理成長樹的版本歷史和變更記錄</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：成長樹列表 */}
          <div className="lg:col-span-1">
            <HanamiCard className="h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2B3A3B] flex items-center gap-2">
                  <TreePine className="w-5 h-5" />
                  成長樹列表
                </h2>
              </div>

              <div className="space-y-2">
                {trees.map((tree) => (
                  <div
                    key={tree.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTree?.id === tree.id
                      ? 'bg-[#FFD59A] border-[#A68A64]'
                      : 'bg-white border-[#EADBC8] hover:bg-[#FFFDF8]'
                      }`}
                    onClick={() => setSelectedTree(tree)}
                  >
                    <h3 className="font-medium text-[#2B3A3B]">{tree.tree_name}</h3>
                    <p className="text-sm text-[#87704e] mt-1">
                      {tree.tree_description || '無描述'}
                    </p>
                    <p className="text-xs text-[#A68A64] mt-2">
                      創建於 {new Date(tree.created_at).toLocaleDateString('zh-HK')}
                    </p>
                  </div>
                ))}
              </div>
            </HanamiCard>
          </div>

          {/* 右側：版本管理 */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTree ? (
              <>
                {/* 版本列表 */}
                <HanamiCard>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[#2B3A3B] flex items-center gap-2">
                      <History className="w-5 h-5" />
                      {selectedTree.tree_name} - 版本歷史
                    </h2>
                    <HanamiButton
                      onClick={() => setShowCreateVersion(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      創建新版本
                    </HanamiButton>
                  </div>

                  {loadingVersions ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A68A64] mx-auto" />
                      <p className="mt-2 text-[#87704e]">載入版本中...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((version) => (
                        <div
                          key={version.id}
                          className="p-4 bg-white border border-[#EADBC8] rounded-lg hover:bg-[#FFFDF8] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <HanamiBadge variant="default">
                                  v{version.version}
                                </HanamiBadge>
                                {version.version_name && (
                                  <span className="font-medium text-[#2B3A3B]">
                                    {version.version_name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-[#87704e]">
                                <Calendar className="w-4 h-4" />
                                {new Date(version.created_at).toLocaleDateString('zh-HK')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <HanamiButton
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedVersion(version)}
                              >
                                <Eye className="w-4 h-4" />
                                查看
                              </HanamiButton>
                            </div>
                          </div>

                          {version.version_description && (
                            <p className="text-sm text-[#87704e] mt-2">
                              {version.version_description}
                            </p>
                          )}

                          {version.changes_summary && (
                            <div className="mt-2">
                              <HanamiBadge variant="info" className="text-xs">
                                變更摘要: {version.changes_summary}
                              </HanamiBadge>
                            </div>
                          )}

                          <div className="mt-2 text-xs text-[#A68A64]">
                            包含 {version.goals_snapshot?.length || 0} 個學習目標
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </HanamiCard>

                {/* 變更日誌 */}
                <HanamiCard>
                  <h2 className="text-lg font-semibold text-[#2B3A3B] mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    最近變更記錄
                  </h2>

                  <div className="space-y-3">
                    {changeLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 bg-white border border-[#EADBC8] rounded-lg"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {log.change_type === 'add' && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {log.change_type === 'modify' && (
                            <Edit3 className="w-4 h-4 text-blue-600" />
                          )}
                          {log.change_type === 'remove' && (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#2B3A3B]">
                              {log.change_type === 'add' && '新增'}
                              {log.change_type === 'modify' && '修改'}
                              {log.change_type === 'remove' && '刪除'}
                            </span>
                            {log.goal_name && (
                              <span className="text-sm text-[#87704e]">
                                {log.goal_name}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#A68A64] mt-1">
                            {new Date(log.created_at).toLocaleString('zh-HK')}
                          </p>
                        </div>
                      </div>
                    ))}

                    {changeLogs.length === 0 && (
                      <div className="text-center py-8 text-[#87704e]">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        <p>暫無變更記錄</p>
                      </div>
                    )}
                  </div>
                </HanamiCard>
              </>
            ) : (
              <HanamiCard>
                <div className="text-center py-12">
                  <TreePine className="w-12 h-12 text-[#A68A64] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#2B3A3B] mb-2">
                    選擇成長樹
                  </h3>
                  <p className="text-[#87704e]">
                    請從左側選擇一個成長樹來查看其版本歷史
                  </p>
                </div>
              </HanamiCard>
            )}
          </div>
        </div>

        {/* 創建新版本模態框 */}
        {showCreateVersion && selectedTree && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
                <h2 className="text-xl font-bold text-hanami-text">創建新版本</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#A68A64] mb-2">
                    版本號 *
                  </label>
                  <input
                    type="text"
                    value={newVersion.version}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="例如: 2.0"
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#A68A64] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A68A64] mb-2">
                    版本名稱
                  </label>
                  <input
                    type="text"
                    value={newVersion.version_name}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, version_name: e.target.value }))}
                    placeholder="例如: 重大更新版本"
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#A68A64] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A68A64] mb-2">
                    版本描述
                  </label>
                  <textarea
                    value={newVersion.version_description}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, version_description: e.target.value }))}
                    placeholder="描述此版本的內容和改進"
                    rows={3}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#A68A64] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A68A64] mb-2">
                    變更摘要
                  </label>
                  <input
                    type="text"
                    value={newVersion.changes_summary}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, changes_summary: e.target.value }))}
                    placeholder="例如: 新增3個學習目標，修改2個目標描述"
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#A68A64] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-[#EADBC8]">
                <HanamiButton
                  variant="secondary"
                  onClick={() => setShowCreateVersion(false)}
                  className="flex-1"
                >
                  取消
                </HanamiButton>
                <HanamiButton
                  onClick={createNewVersion}
                  disabled={!newVersion.version}
                  className="flex-1"
                >
                  創建版本
                </HanamiButton>
              </div>
            </div>
          </div>
        )}

        {/* 版本詳情模態框 */}
        {selectedVersion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-hanami-text">
                    版本詳情 - v{selectedVersion.version}
                  </h2>
                  <button
                    onClick={() => setSelectedVersion(null)}
                    className="text-hanami-text hover:text-hanami-text-secondary transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3">版本資訊</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#A68A64]">版本號</label>
                      <p className="text-[#2B3A3B]">{selectedVersion.version}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#A68A64]">創建時間</label>
                      <p className="text-[#2B3A3B]">
                        {new Date(selectedVersion.created_at).toLocaleString('zh-HK')}
                      </p>
                    </div>
                    {selectedVersion.version_name && (
                      <div>
                        <label className="block text-sm font-medium text-[#A68A64]">版本名稱</label>
                        <p className="text-[#2B3A3B]">{selectedVersion.version_name}</p>
                      </div>
                    )}
                    {selectedVersion.changes_summary && (
                      <div>
                        <label className="block text-sm font-medium text-[#A68A64]">變更摘要</label>
                        <p className="text-[#2B3A3B]">{selectedVersion.changes_summary}</p>
                      </div>
                    )}
                  </div>

                  {selectedVersion.version_description && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-[#A68A64] mb-2">版本描述</label>
                      <p className="text-[#2B3A3B] bg-[#FFF9F2] p-3 rounded-lg">
                        {selectedVersion.version_description}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3">
                    學習目標快照 ({selectedVersion.goals_snapshot?.length || 0} 個)
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedVersion.goals_snapshot?.map((goal: any, index: number) => (
                      <div key={goal.id || index} className="p-3 bg-[#FFF9F2] border border-[#EADBC8] rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-[#2B3A3B]">{goal.goal_name}</h4>
                          <HanamiBadge variant="info" className="text-xs">
                            {goal.assessment_mode === 'progress' ? '進度模式' : '多選模式'}
                          </HanamiBadge>
                        </div>
                        {goal.goal_description && (
                          <p className="text-sm text-[#87704e] mt-1">{goal.goal_description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

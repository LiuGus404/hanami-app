'use client';

import React, { useState, useEffect } from 'react';
import { HanamiButton, HanamiCard } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { VersionComparison } from '@/components/ui/VersionDisplay';

interface TreeVersion {
  id: string;
  tree_id: string;
  version: string;
  version_name: string;
  version_description: string;
  created_at: string;
  is_active: boolean;
}

interface VersionChange {
  id: string;
  tree_id: string;
  from_version: string;
  to_version: string;
  change_type: string;
  goal_name: string;
  change_details: any;
  created_at: string;
}

export default function VersionManagementPage() {
  const [treeVersions, setTreeVersions] = useState<TreeVersion[]>([]);
  const [versionChanges, setVersionChanges] = useState<VersionChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTree, setSelectedTree] = useState<string>('');
  const [trees, setTrees] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 載入成長樹列表
      const { data: treesData } = await (supabase
        .from('hanami_growth_trees') as any)
        .select('*')
        .order('tree_name');

      if (treesData) {
        setTrees(treesData);
        if (treesData.length > 0) {
          setSelectedTree(treesData[0].id);
        }
      }

      // 載入版本變更記錄
      // 暫時使用空資料，因為相關表可能不存在
      setVersionChanges([]);

    } catch (error) {
      console.error('載入版本資料錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTreeVersions = async (treeId: string) => {
    try {
      // 暫時使用空資料，因為相關表可能不存在
      setTreeVersions([]);
    } catch (error) {
      console.error('載入版本失敗:', error);
    }
  };

  useEffect(() => {
    if (selectedTree) {
      loadTreeVersions(selectedTree);
    }
  }, [selectedTree]);

  const createNewVersion = async () => {
    const versionName = prompt('請輸入版本名稱:');
    const versionDescription = prompt('請輸入版本描述:');
    const changesSummary = prompt('請輸入變更摘要:');

    if (!versionName || !selectedTree) return;

    try {
      const response = await fetch('/api/assessment-version-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          treeId: selectedTree,
          version: `v${treeVersions.length + 1}.0`,
          versionName,
          versionDescription,
          changesSummary,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('版本創建成功！');
        loadTreeVersions(selectedTree);
      } else {
        alert('版本創建失敗: ' + result.error);
      }
    } catch (error) {
      console.error('創建版本錯誤:', error);
      alert('創建版本時發生錯誤');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">載入中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">版本管理</h1>
        <HanamiButton onClick={createNewVersion}>
          創建新版本
        </HanamiButton>
      </div>

      {/* 成長樹選擇 */}
      <HanamiCard className="p-4">
        <h2 className="text-lg font-semibold mb-3">選擇成長樹</h2>
        <select
          value={selectedTree}
          onChange={(e) => setSelectedTree(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          {trees.map((tree) => (
            <option key={tree.id} value={tree.id}>
              {tree.tree_name}
            </option>
          ))}
        </select>
      </HanamiCard>

      {/* 版本歷史 */}
      <HanamiCard className="p-4">
        <h2 className="text-lg font-semibold mb-3">版本歷史</h2>
        <div className="space-y-2">
          {treeVersions.map((version) => (
            <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{version.version_name || version.version}</div>
                <div className="text-sm text-gray-600">{version.version_description}</div>
                <div className="text-xs text-gray-500">
                  創建時間: {new Date(version.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                {version.is_active && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    當前版本
                  </span>
                )}
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {version.version}
                </span>
              </div>
            </div>
          ))}
        </div>
      </HanamiCard>

      {/* 版本變更記錄 */}
      <HanamiCard className="p-4">
        <h2 className="text-lg font-semibold mb-3">版本變更記錄</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {versionChanges.map((change) => (
            <div key={change.id} className="p-3 bg-gray-50 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{change.goal_name || '系統變更'}</div>
                  <div className="text-sm text-gray-600">
                    {change.from_version} → {change.to_version}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(change.created_at).toLocaleString()}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${change.change_type === 'goal_added' ? 'bg-green-100 text-green-700' :
                    change.change_type === 'goal_removed' ? 'bg-red-100 text-red-700' :
                      change.change_type === 'goal_modified' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                  }`}>
                  {change.change_type === 'goal_added' ? '新增' :
                    change.change_type === 'goal_removed' ? '移除' :
                      change.change_type === 'goal_modified' ? '修改' :
                        change.change_type === 'goal_reordered' ? '重新排序' : '變更'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </HanamiCard>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestGrowthTreesDataPage() {
  const [treesData, setTreesData] = useState<any[]>([]);
  const [goalsData, setGoalsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('開始載入測試資料...');
      
      // 載入成長樹資料
      const { data: treesData, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (treesError) throw treesError;
      setTreesData(treesData || []);
      console.log('成長樹資料:', treesData);
      
      // 載入目標資料
      const { data: goalsData, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (goalsError) throw goalsError;
      setGoalsData(goalsData || []);
      console.log('目標資料:', goalsData);
      
    } catch (err: any) {
      console.error('載入資料失敗:', err);
      setError(`載入資料失敗: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const getGoalsForTree = (treeId: string) => {
    const treeGoals = goalsData.filter(goal => goal.tree_id === treeId);
    console.log(`取得成長樹 ${treeId} 的目標:`, treeGoals);
    return treeGoals;
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>錯誤:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hanami-text mb-2">
            成長樹資料測試頁面
          </h1>
          <p className="text-hanami-text-secondary">
            檢查資料庫中的成長樹和目標資料
          </p>
        </div>

        {/* 成長樹資料 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-hanami-text mb-4">
            成長樹資料 ({treesData.length} 個)
          </h2>
          <div className="bg-white rounded-lg border border-[#EADBC8] p-6">
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(treesData, null, 2)}
            </pre>
          </div>
        </div>

        {/* 目標資料 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-hanami-text mb-4">
            目標資料 ({goalsData.length} 個)
          </h2>
          <div className="bg-white rounded-lg border border-[#EADBC8] p-6">
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(goalsData, null, 2)}
            </pre>
          </div>
        </div>

        {/* 成長樹列表 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-hanami-text mb-4">
            成長樹列表
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {treesData.map((tree) => {
              const treeGoals = getGoalsForTree(tree.id);
              const completedGoals = treeGoals.filter(goal => goal.is_completed).length;
              
              return (
                <div key={tree.id} className="bg-white rounded-lg border border-[#EADBC8] p-6">
                  <h3 className="text-lg font-semibold text-hanami-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">{tree.tree_icon || '🌳'}</span>
                    {tree.tree_name}
                  </h3>
                  <p className="text-sm text-hanami-text-secondary mb-3">{tree.tree_description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-hanami-text-secondary gap-2">
                      <span>課程類型 ID: {tree.course_type_id}</span>
                      <span>等級: Lv.{tree.tree_level || 1}</span>
                      <span>狀態: {tree.is_active ? '啟用' : '停用'}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-hanami-text">目標進度</span>
                      <span className="text-sm text-hanami-text-secondary">{completedGoals}/{treeGoals.length}</span>
                    </div>
                    <div className="w-full bg-hanami-surface rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-hanami-primary to-hanami-secondary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${treeGoals.length > 0 ? (completedGoals / treeGoals.length) * 100 : 0}%` }} 
                      />
                    </div>
                  </div>
                  
                  {treeGoals.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-hanami-text mb-2">目標列表:</p>
                      <div className="space-y-1">
                        {treeGoals.slice(0, 3).map((goal) => (
                          <div key={goal.id} className="flex items-center text-sm gap-2">
                            <span className={`w-2 h-2 rounded-full mr-2 ${goal.is_completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={`text-xs ${goal.is_completed ? 'text-green-600' : 'text-hanami-text-secondary'}`}>
                              {goal.goal_icon || '⭐'} {goal.goal_name}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">
                              {goal.is_completed ? '✓' : '○'}
                            </span>
                          </div>
                        ))}
                        {treeGoals.length > 3 && (
                          <p className="text-xs text-hanami-text-secondary">還有 {treeGoals.length - 3} 個目標...</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 重新載入按鈕 */}
        <div className="text-center">
          <button
            onClick={loadData}
            className="bg-gradient-to-r from-hanami-primary to-hanami-secondary text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow"
          >
            重新載入資料
          </button>
        </div>
      </div>
    </div>
  );
} 
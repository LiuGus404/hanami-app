'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugLearningPathsPage() {
  const [learningPaths, setLearningPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetTreeId, setTargetTreeId] = useState('a0bf2e68-1582-4414-a238-ae44a6883134');

  useEffect(() => {
    loadLearningPaths();
  }, []);

  const loadLearningPaths = async () => {
    try {
      setLoading(true);
      setError(null);

      // 載入所有學習路徑
      const { data: allPaths, error: allPathsError } = await supabase
        .from('hanami_learning_paths')
        .select('*')
        .order('created_at', { ascending: false });

      if (allPathsError) {
        throw allPathsError;
      }

      setLearningPaths(allPaths || []);

      // 特別檢查目標成長樹的學習路徑
      const targetPaths = allPaths?.filter(path => path.tree_id === targetTreeId) || [];
      console.log('目標成長樹的學習路徑:', targetPaths);

    } catch (err: any) {
      console.error('載入學習路徑失敗:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createLearningPathForTree = async () => {
    try {
      setLoading(true);
      
      // 為目標成長樹創建一個學習路徑
      const newPath = {
        name: '預設學習路徑',
        description: '自動創建的學習路徑',
        tree_id: targetTreeId,
        nodes: [
          {
            id: 'start',
            type: 'start',
            title: '開始學習',
            description: '學習旅程的起點',
            order: 0,
            duration: 0,
            isCompleted: true,
            isLocked: false,
            position: { x: 100, y: 200 },
            connections: [],
            metadata: {}
          },
          {
            id: 'end',
            type: 'end',
            title: '完成學習',
            description: '恭喜完成學習旅程！',
            order: 999,
            duration: 0,
            isCompleted: false,
            isLocked: false,
            position: { x: 400, y: 200 },
            connections: [],
            metadata: {}
          }
        ],
        start_node_id: 'start',
        end_node_id: 'end',
        total_duration: 0,
        difficulty: 1,
        is_active: true
      };

      const { data, error } = await supabase
        .from('hanami_learning_paths')
        .insert(newPath)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('成功創建學習路徑:', data);
      await loadLearningPaths(); // 重新載入數據

    } catch (err: any) {
      console.error('創建學習路徑失敗:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">調試學習路徑數據</h1>
          <div className="text-center py-8">
            <div className="text-lg">載入中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">調試學習路徑數據</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>錯誤:</strong> {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">目標成長樹: {targetTreeId}</h2>
          <button
            onClick={createLearningPathForTree}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            為此成長樹創建學習路徑
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">所有學習路徑 ({learningPaths.length})</h2>
          
          {learningPaths.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              沒有找到任何學習路徑數據
            </div>
          ) : (
            <div className="space-y-4">
              {learningPaths.map((path, index) => (
                <div
                  key={path.id}
                  className={`border rounded-lg p-4 ${
                    path.tree_id === targetTreeId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{path.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{path.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>ID:</strong> {path.id}
                        </div>
                        <div>
                          <strong>成長樹 ID:</strong> {path.tree_id}
                        </div>
                        <div>
                          <strong>狀態:</strong> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            path.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {path.is_active ? '活躍' : '非活躍'}
                          </span>
                        </div>
                        <div>
                          <strong>節點數量:</strong> {path.nodes?.length || 0}
                        </div>
                        <div>
                          <strong>總時長:</strong> {path.total_duration || 0} 分鐘
                        </div>
                        <div>
                          <strong>難度:</strong> {path.difficulty || 1}
                        </div>
                        <div>
                          <strong>創建時間:</strong> {new Date(path.created_at).toLocaleString()}
                        </div>
                        <div>
                          <strong>更新時間:</strong> {new Date(path.updated_at).toLocaleString()}
                        </div>
                      </div>
                      
                      {path.nodes && path.nodes.length > 0 && (
                        <div className="mt-3">
                          <strong>節點詳情:</strong>
                          <div className="mt-2 space-y-1">
                            {path.nodes.map((node: any, nodeIndex: number) => (
                              <div key={nodeIndex} className="text-xs bg-gray-100 p-2 rounded">
                                <strong>{node.type}:</strong> {node.title} (ID: {node.id}, 順序: {node.order})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

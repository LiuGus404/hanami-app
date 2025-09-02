'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  PlayIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  StarIcon,
  ClockIcon,
  ChartBarIcon,
  UsersIcon,
  BookOpenIcon,
  TrophyIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { HanamiCard, HanamiButton, HanamiInput } from '@/components/ui';
import { LearningPathBuilder } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface LearningPath {
  id: string;
  name: string;
  description: string;
  tree_id: string;
  nodes: any[];
  startNodeId: string;
  endNodeId: string;
  totalDuration: number;
  difficulty: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
  created_by?: string;
}

interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description: string | null;
  tree_icon: string | null;
}

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPath, setPreviewPath] = useState<LearningPath | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 載入成長樹
      const { data: treesData, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('id, tree_name, tree_description, tree_icon')
        .eq('is_active', true)
        .order('tree_name');
      
      if (treesError) throw treesError;
      setTrees(treesData || []);

      // 載入學習路線（這裡需要創建對應的資料表）
      // 暫時使用模擬資料
      const mockPaths: LearningPath[] = [
        {
          id: '1',
          name: '鋼琴基礎入門路線',
          description: '適合初學者的鋼琴學習路線，從基本姿勢到簡單曲目',
          tree_id: treesData?.[0]?.id || '',
          nodes: [],
          startNodeId: 'start',
          endNodeId: 'end',
          totalDuration: 120,
          difficulty: 2,
          tags: ['初學者', '鋼琴', '基礎'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '2',
          name: '進階演奏技巧路線',
          description: '提升演奏技巧和表現力的進階路線',
          tree_id: treesData?.[0]?.id || '',
          nodes: [],
          startNodeId: 'start',
          endNodeId: 'end',
          totalDuration: 180,
          difficulty: 4,
          tags: ['進階', '技巧', '表現力'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        }
      ];
      
      setPaths(mockPaths);
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePath = async (path: any) => {
    try {
      // 這裡應該保存到資料庫
      console.log('保存學習路線:', path);
      
      // 暫時更新本地狀態
      setPaths(prev => {
        const existingIndex = prev.findIndex(p => p.id === path.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = path;
          return updated;
        } else {
          return [...prev, path];
        }
      });
      
      toast.success('學習路線保存成功！');
    } catch (error) {
      console.error('保存學習路線失敗:', error);
      toast.error('保存失敗，請重試');
    }
  };

  const handlePreviewPath = (path: any) => {
    setPreviewPath(path);
    setShowPreview(true);
  };

  const deletePath = async (pathId: string) => {
    if (!confirm('確定要刪除此學習路線嗎？')) return;
    
    try {
      // 這裡應該從資料庫刪除
      setPaths(prev => prev.filter(p => p.id !== pathId));
    } catch (error) {
      console.error('刪除失敗:', error);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || colors[1];
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = {
      1: '簡單',
      2: '基礎',
      3: '中等',
      4: '困難',
      5: '專家'
    };
    return labels[difficulty as keyof typeof labels] || '未知';
  };

  const filteredPaths = paths.filter(path => {
    const matchesSearch = path.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         path.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === null || path.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  if (showBuilder) {
    return (
      <LearningPathBuilder
        treeId={selectedTreeId}
        onSave={handleSavePath}
        onPreview={handlePreviewPath}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hanami-text mb-2">
            學習路線管理
          </h1>
          <p className="text-hanami-text-secondary">
            設計和管理學生的學習旅程，創建有趣的學習路線圖
          </p>
        </div>

        {/* 工具欄 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-hanami-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <HanamiButton
                variant="primary"
                onClick={() => {
                  if (trees.length > 0) {
                    setSelectedTreeId(trees[0].id);
                    setShowBuilder(true);
                  } else {
                    alert('請先創建成長樹');
                  }
                }}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                創建新路線
              </HanamiButton>
              
              <div className="relative">
                <HanamiInput
                  placeholder="搜尋學習路線..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={filterDifficulty || ''}
                onChange={(e) => setFilterDifficulty(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-hanami-border rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
              >
                <option value="">所有難度</option>
                <option value={1}>簡單</option>
                <option value={2}>基礎</option>
                <option value={3}>中等</option>
                <option value={4}>困難</option>
                <option value={5}>專家</option>
              </select>
            </div>
          </div>
        </div>

        {/* 學習路線列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanami-primary mx-auto"></div>
            <p className="mt-4 text-hanami-text-secondary">載入中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredPaths.map((path) => (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <HanamiCard className="p-6 h-full hover:shadow-lg transition-shadow cursor-pointer group">
                    {/* 路線標題和圖標 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-hanami-primary to-hanami-secondary rounded-xl">
                          <BookOpenIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-hanami-text group-hover:text-hanami-primary transition-colors">
                            {path.name}
                          </h3>
                          <p className="text-sm text-hanami-text-secondary">
                            {trees.find(t => t.id === path.tree_id)?.tree_name || '未知成長樹'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          className="p-1 text-gray-400 hover:text-hanami-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewPath(path);
                          }}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-hanami-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPath(path);
                            setSelectedTreeId(path.tree_id);
                            setShowBuilder(true);
                          }}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePath(path.id);
                          }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 路線描述 */}
                    <p className="text-sm text-hanami-text-secondary mb-4 line-clamp-2">
                      {path.description}
                    </p>

                    {/* 路線統計 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-hanami-text-secondary">
                          <ClockIcon className="w-4 h-4" />
                          <span>總時長</span>
                        </div>
                        <span className="font-medium text-hanami-text">
                          {path.totalDuration} 分鐘
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-hanami-text-secondary">
                          <ChartBarIcon className="w-4 h-4" />
                          <span>難度</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(path.difficulty)}`}>
                          {getDifficultyLabel(path.difficulty)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-hanami-text-secondary">
                          <UsersIcon className="w-4 h-4" />
                          <span>節點數</span>
                        </div>
                        <span className="font-medium text-hanami-text">
                          {path.nodes.length} 個
                        </span>
                      </div>
                    </div>

                    {/* 標籤 */}
                    {path.tags.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-hanami-border">
                        <div className="flex flex-wrap gap-1">
                          {path.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-hanami-surface text-hanami-text-secondary text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {path.tags.length > 3 && (
                            <span className="px-2 py-1 bg-hanami-surface text-hanami-text-secondary text-xs rounded-full">
                              +{path.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="mt-4 pt-4 border-t border-hanami-border">
                      <div className="flex gap-2">
                        <HanamiButton
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedPath(path);
                            setSelectedTreeId(path.tree_id);
                            setShowBuilder(true);
                          }}
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          編輯
                        </HanamiButton>
                        <HanamiButton
                          variant="cute"
                          size="sm"
                          onClick={() => handlePreviewPath(path)}
                        >
                          <PlayIcon className="w-4 h-4" />
                        </HanamiButton>
                      </div>
                    </div>
                  </HanamiCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 空狀態 */}
        {!loading && filteredPaths.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-hanami-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpenIcon className="w-12 h-12 text-hanami-text-secondary" />
            </div>
            <h3 className="text-lg font-medium text-hanami-text mb-2">
              {searchQuery || filterDifficulty ? '沒有找到符合條件的學習路線' : '還沒有學習路線'}
            </h3>
            <p className="text-hanami-text-secondary mb-4">
              {searchQuery || filterDifficulty 
                ? '嘗試調整搜尋條件或篩選器'
                : '創建您的第一個學習路線，為學生設計有趣的學習旅程'
              }
            </p>
            {!searchQuery && !filterDifficulty && (
              <HanamiButton
                variant="primary"
                onClick={() => {
                  if (trees.length > 0) {
                    setSelectedTreeId(trees[0].id);
                    setShowBuilder(true);
                  } else {
                    alert('請先創建成長樹');
                  }
                }}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                創建第一個學習路線
              </HanamiButton>
            )}
          </div>
        )}
      </div>

      {/* 預覽模態框 */}
      {showPreview && previewPath && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-hanami-text">學習路線預覽</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-hanami-text mb-2">{previewPath.name}</h3>
                <p className="text-hanami-text-secondary">{previewPath.description}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-hanami-surface rounded-lg">
                  <div className="font-semibold text-hanami-text">{previewPath.totalDuration}</div>
                  <div className="text-hanami-text-secondary">分鐘</div>
                </div>
                <div className="text-center p-3 bg-hanami-surface rounded-lg">
                  <div className="font-semibold text-hanami-text">{getDifficultyLabel(previewPath.difficulty)}</div>
                  <div className="text-hanami-text-secondary">難度</div>
                </div>
                <div className="text-center p-3 bg-hanami-surface rounded-lg">
                  <div className="font-semibold text-hanami-text">{previewPath.nodes.length}</div>
                  <div className="text-hanami-text-secondary">節點</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <HanamiButton
                  variant="primary"
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedPath(previewPath);
                    setSelectedTreeId(previewPath.tree_id);
                    setShowBuilder(true);
                  }}
                >
                  編輯路線
                </HanamiButton>
                <HanamiButton
                  variant="secondary"
                  onClick={() => setShowPreview(false)}
                >
                  關閉
                </HanamiButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

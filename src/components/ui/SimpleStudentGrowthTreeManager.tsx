'use client';

import React, { useState, useEffect } from 'react';
import HanamiButton from './HanamiButton';
import HanamiCard from './HanamiCard';
import { SparklesIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SimpleStudentGrowthTreeManagerProps {
  studentId: string;
  studentName: string;
  onTreeChange?: (trees: any[]) => void;
  className?: string;
}

export default function SimpleStudentGrowthTreeManager({
  studentId,
  studentName,
  onTreeChange,
  className = ''
}: SimpleStudentGrowthTreeManagerProps) {
  const [studentTrees, setStudentTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 載入學生的成長樹
  const loadStudentTrees = async () => {
    try {
      setLoading(true);
      console.log('載入學生成長樹:', studentId);

      const response = await fetch(`/api/student-growth-tree-management?studentId=${studentId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '載入學生成長樹失敗');
      }

      console.log('學生成長樹資料:', result.data);
      setStudentTrees(result.data || []);

      // 通知父組件
      if (onTreeChange) {
        const formattedTrees = (result.data || []).map((item: any) => ({
          id: item.hanami_growth_trees?.id || item.tree_id,
          tree_name: item.hanami_growth_trees?.tree_name || '未知成長樹',
          tree_description: item.hanami_growth_trees?.tree_description,
          start_date: item.start_date || item.enrollment_date,
          status: item.status || item.tree_status
        }));
        onTreeChange(formattedTrees);
      }

    } catch (error) {
      console.error('載入學生成長樹失敗:', error);
      toast.error('載入學生成長樹失敗: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 初始化載入
  useEffect(() => {
    if (studentId) {
      loadStudentTrees();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hanami-primary"></div>
          <span className="text-hanami-text">載入中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 標題 */}
      <div className="flex items-center space-x-2">
        <SparklesIcon className="h-6 w-6 text-hanami-primary" />
        <h3 className="text-lg font-semibold text-hanami-text">
          {studentName} 的成長樹
        </h3>
        <span className="text-sm text-hanami-text-secondary">
          ({studentTrees.length} 個)
        </span>
      </div>

      {/* 成長樹列表 */}
      {studentTrees.length === 0 ? (
        <HanamiCard className="p-6 text-center">
          <SparklesIcon className="h-12 w-12 text-hanami-text-secondary mx-auto mb-3" />
          <p className="text-hanami-text-secondary mb-4">
            此學生尚未分配任何成長樹
          </p>
        </HanamiCard>
      ) : (
        <div className="space-y-3">
          {studentTrees.map((studentTree) => (
            <HanamiCard key={studentTree.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-hanami-text">
                      {studentTree.hanami_growth_trees?.tree_name || '未知成長樹'}
                    </h4>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {studentTree.status || studentTree.tree_status || 'active'}
                    </span>
                  </div>
                  
                  {studentTree.hanami_growth_trees?.tree_description && (
                    <p className="text-sm text-hanami-text-secondary mb-2">
                      {studentTree.hanami_growth_trees.tree_description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-hanami-text-secondary">
                    <span>
                      開始日期: {studentTree.start_date || studentTree.enrollment_date || '未設定'}
                    </span>
                    {studentTree.hanami_growth_trees?.tree_level && (
                      <span>
                        等級: {studentTree.hanami_growth_trees.tree_level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </HanamiCard>
          ))}
        </div>
      )}
    </div>
  );
}

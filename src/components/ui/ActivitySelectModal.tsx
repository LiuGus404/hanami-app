'use client';

import { Search, Filter, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TreeActivity } from '@/types/progress';

export type ActivitySelectModalProps = {
  title: string;
  treeActivities: TreeActivity[];
  selected: string[];
  onChange: (newSelected: string[]) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const ActivitySelectModal: React.FC<ActivitySelectModalProps> = ({
  title,
  treeActivities,
  selected,
  onChange,
  onConfirm,
  onCancel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTreeFilter, setSelectedTreeFilter] = useState<string>('all');

  // 獲取所有成長樹名稱
  const treeNames = useMemo(() => {
    const names = new Set<string>();
    treeActivities.forEach(activity => {
      const treeName = (activity as any).hanami_growth_trees?.tree_name || '未知成長樹';
      names.add(treeName);
    });
    return Array.from(names).sort();
  }, [treeActivities]);

  // 篩選活動
  const filteredActivities = useMemo(() => {
    let filtered = treeActivities;

    // 按成長樹篩選
    if (selectedTreeFilter !== 'all') {
      filtered = filtered.filter(activity => 
        (activity as any).hanami_growth_trees?.tree_name === selectedTreeFilter
      );
    }

    // 按搜尋關鍵字篩選
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => {
        const activityName = (activity as any).activity_source === 'teaching' && (activity as any).hanami_teaching_activities
          ? (activity as any).hanami_teaching_activities.activity_name
          : (activity as any).custom_activity_name || '';
        const treeName = (activity as any).hanami_growth_trees?.tree_name || '';
        const description = (activity as any).activity_description || (activity as any).custom_activity_description || '';
        
        return activityName.toLowerCase().includes(query) ||
               treeName.toLowerCase().includes(query) ||
               description.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [treeActivities, selectedTreeFilter, searchQuery]);

  const isSelected = (activityId: string) => {
    return selected.includes(`tree_${activityId}`);
  };

  const toggleOption = (activityId: string) => {
    const value = `tree_${activityId}`;
    const current = selected;
    
    if (current.includes(value)) {
      // 如果已選中，則移除
      onChange(current.filter(v => v !== value));
    } else {
      // 如果未選中，則添加
      onChange([...current, value]);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#FFFDF8] border border-[#D8CDBF] rounded-[24px] w-96 p-6 shadow-xl text-[#4B4B4B] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-[#F3F0E5] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜尋框 */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4B4036] opacity-60" />
            <input
              type="text"
              placeholder="搜尋活動名稱、成長樹或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-[#EBC9A4]"
            />
          </div>
        </div>

        {/* 成長樹篩選 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-[#D8CDBF]" />
            <span className="text-sm font-medium text-[#4B4B4B]">成長樹篩選</span>
          </div>
          <div className="relative">
            <select
              value={selectedTreeFilter}
              onChange={(e) => setSelectedTreeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-[#EBC9A4]"
            >
              <option value="all">所有成長樹</option>
              {treeNames.map(treeName => (
                <option key={treeName} value={treeName}>{treeName}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 顯示已選擇的項目 */}
        {selected.length > 0 && (
          <div className="mb-4 p-3 bg-[#F3F0E5] rounded-lg">
            <div className="text-sm font-medium mb-2">已選擇：</div>
            <div className="flex flex-wrap gap-2">
              {selected.map((value) => {
                const activityId = value.replace('tree_', '');
                const activity = treeActivities.find(a => a.id === activityId);
                if (!activity) return null;
                
                const activityName = (activity as any).activity_source === 'teaching' && (activity as any).hanami_teaching_activities
                  ? (activity as any).hanami_teaching_activities.activity_name
                  : (activity as any).custom_activity_name || '未命名活動';
                
                return (
                  <span key={value} className="text-xs bg-[#E8E3D5] px-2 py-1 rounded">
                    {activityName}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 活動列表 */}
        <div className="space-y-2 overflow-y-auto flex-1 pr-2">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => {
              const activityName = (activity as any).activity_source === 'teaching' && (activity as any).hanami_teaching_activities
                ? (activity as any).hanami_teaching_activities.activity_name
                : (activity as any).custom_activity_name || '未命名活動';
              const treeName = (activity as any).hanami_growth_trees?.tree_name || '未知成長樹';
              const description = (activity as any).activity_description || (activity as any).custom_activity_description || '';
              const isSelectedActivity = isSelected(activity.id);

              return (
                <div
                  key={activity.id}
                  className={`flex items-start justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    isSelectedActivity 
                      ? 'bg-green-50 border-2 border-green-200 shadow-md scale-[1.02]' 
                      : 'bg-white hover:bg-[#F3F0E5] hover:shadow-sm border-2 border-transparent'
                  }`}
                  onClick={() => toggleOption(activity.id)}
                >
                  <div className="flex-1">
                    <div className={`font-medium transition-colors duration-200 ${
                      isSelectedActivity ? 'text-green-700 font-semibold' : 'text-[#4B4B4B]'
                    }`}>
                      {activityName}
                    </div>
                    <div className="text-xs text-[#2B3A3B] opacity-70 mt-1">
                      {treeName}
                      {description && ` • ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`}
                    </div>
                  </div>
                  {isSelectedActivity && (
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center animate-bounce ml-2">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-[#2B3A3B] opacity-60">
              {searchQuery || selectedTreeFilter !== 'all' ? '沒有找到符合條件的活動' : '暫無活動'}
            </div>
          )}
        </div>

        {/* 按鈕 */}
        <div className="flex justify-around mt-6 pt-4 border-t border-[#D8CDBF]">
          <button
            className="px-4 py-2 border border-[#D8CDBF] rounded-xl hover:bg-[#F3F0E5] transition-all duration-200 hover:scale-105"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="px-6 py-2 bg-[#A68A64] text-white font-semibold rounded-xl hover:bg-[#937654] transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
            onClick={onConfirm}
          >
            確定
          </button>
        </div>
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : (null as any),
  );
}; 
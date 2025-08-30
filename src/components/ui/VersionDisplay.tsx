'use client';

import React from 'react';
import { HanamiBadge, HanamiCard } from '@/components/ui';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface VersionInfo {
  assessment_version: string;
  tree_version: string;
  current_tree_version: string;
  version_compatibility: {
    is_current_version: boolean;
    version_difference: string;
    compatibility_status: string;
  };
  goals_snapshot_data: any[];
}

interface VersionDisplayProps {
  versionInfo: VersionInfo;
  assessmentDate: string;
  className?: string;
}

export function VersionDisplay({ versionInfo, assessmentDate, className = '' }: VersionDisplayProps) {
  const {
    assessment_version,
    tree_version,
    current_tree_version,
    version_compatibility,
    goals_snapshot_data
  } = versionInfo;

  const isCurrentVersion = version_compatibility.is_current_version;
  const needsMigration = version_compatibility.compatibility_status === 'needs_migration';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 版本狀態指示器 */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          {isCurrentVersion ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
          )}
          <span className="text-sm font-medium break-words">
            {isCurrentVersion ? '當前版本' : '歷史版本'}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <HanamiBadge variant={isCurrentVersion ? 'success' : 'info'} className="text-xs break-words">
            評估版本: {assessment_version}
          </HanamiBadge>
          <HanamiBadge variant={isCurrentVersion ? 'success' : 'info'} className="text-xs break-words">
            成長樹版本: {tree_version}
          </HanamiBadge>
          {!isCurrentVersion && (
            <HanamiBadge variant="info" className="text-xs break-words">
              當前版本: {current_tree_version}
            </HanamiBadge>
          )}
        </div>
      </div>

      {/* 版本詳細資訊 */}
      <HanamiCard className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 flex-shrink-0" />
            <span>評估時間: {assessmentDate}</span>
          </div>
          
          {!isCurrentVersion && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">
                    版本差異提醒
                  </p>
                  <p className="text-amber-700">
                    此評估記錄使用的是成長樹版本 {tree_version}，當前版本為 {current_tree_version}。
                    系統已自動處理版本兼容性，確保評估資料正確顯示。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 版本目標快照 */}
          {goals_snapshot_data && goals_snapshot_data.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                版本 {tree_version} 的學習目標 ({goals_snapshot_data.length} 個)
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {goals_snapshot_data.map((goal: any, index: number) => (
                  <div key={goal.id || index} className="text-xs bg-gray-50 p-2 rounded border border-gray-100">
                    <div className="font-medium text-gray-700 mb-1">
                      {goal.goal_name}
                    </div>
                    {goal.goal_description && (
                      <div className="text-gray-500 mb-2">
                        {goal.goal_description}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {goal.assessment_mode === 'progress' ? '進度模式' : '多選模式'}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        順序: {goal.goal_order}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </HanamiCard>
    </div>
  );
}

// 版本比較組件
interface VersionComparisonProps {
  fromVersion: string;
  toVersion: string;
  changes: Array<{
    change_type: string;
    goal_name: string;
    change_details: any;
  }>;
}

export function VersionComparison({ fromVersion, toVersion, changes }: VersionComparisonProps) {
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'goal_added':
        return '➕';
      case 'goal_removed':
        return '➖';
      case 'goal_modified':
        return '✏️';
      case 'goal_reordered':
        return '🔄';
      default:
        return '📝';
    }
  };

  const getChangeText = (changeType: string) => {
    switch (changeType) {
      case 'goal_added':
        return '新增目標';
      case 'goal_removed':
        return '移除目標';
      case 'goal_modified':
        return '修改目標';
      case 'goal_reordered':
        return '重新排序';
      default:
        return '變更';
    }
  };

  return (
    <HanamiCard className="p-4">
      <h3 className="text-lg font-medium mb-3">
        版本比較: {fromVersion} → {toVersion}
      </h3>
      
      <div className="space-y-2">
        {changes.map((change, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span className="text-lg">{getChangeIcon(change.change_type)}</span>
            <div className="flex-1">
              <span className="font-medium">{change.goal_name}</span>
              <span className="text-sm text-gray-600 ml-2">
                {getChangeText(change.change_type)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </HanamiCard>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  EyeIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { HanamiButton, HanamiCard } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface CompatibilityIssue {
  id: string;
  assessment_id: string;
  tree_id: string;
  issue_type: 'deleted_goal' | 'level_count_changed' | 'max_level_changed' | 'assessment_mode_changed';
  goal_id?: string;
  goal_name?: string;
  original_data: any;
  current_data?: any;
  processed_at: string;
  resolved: boolean;
  resolution_notes?: string;
  assessment?: {
    student?: {
      full_name: string;
    };
    tree?: {
      tree_name: string;
    };
    assessment_date: string;
  };
}

interface CompatibilitySummary {
  tree_name: string;
  affected_assessments: number;
  total_issues: number;
  deleted_goals: number;
  level_count_changes: number;
  max_level_changes: number;
  mode_changes: number;
  resolved_issues: number;
  last_processed: string;
}

export default function AssessmentCompatibilityPage() {
  const [issues, setIssues] = useState<CompatibilityIssue[]>([]);
  const [summary, setSummary] = useState<CompatibilitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<CompatibilityIssue | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState({
    resolved: 'all' as 'all' | 'resolved' | 'unresolved',
    issueType: 'all' as 'all' | 'deleted_goal' | 'level_count_changed' | 'max_level_changed' | 'assessment_mode_changed'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 暫時使用空資料，因為相關表可能不存在
      setIssues([]);
      setSummary([]);

    } catch (error) {
      console.error('載入兼容性資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectIssues = async () => {
    try {
      setProcessing(true);
      
      // 暫時顯示提示訊息
      alert('兼容性檢測功能正在開發中，請稍後再試。');
      
    } catch (error) {
      console.error('檢測兼容性問題失敗:', error);
      alert('檢測失敗: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const autoFixIssues = async () => {
    if (!confirm('確定要自動修復所有兼容性問題嗎？此操作將修改評估記錄資料。')) {
      return;
    }

    try {
      setProcessing(true);
      
      // 暫時顯示提示訊息
      alert('自動修復功能正在開發中，請稍後再試。');
      
    } catch (error) {
      console.error('自動修復失敗:', error);
      alert('自動修復失敗: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const markAsResolved = async (issueId: string, notes?: string) => {
    try {
      // 暫時顯示提示訊息
      alert('標記功能正在開發中，請稍後再試。');
      
    } catch (error) {
      console.error('標記為已解決失敗:', error);
      alert('操作失敗: ' + (error as Error).message);
    }
  };

  const getIssueTypeLabel = (type: string) => {
    const labels = {
      deleted_goal: '目標已刪除',
      level_count_changed: '等級數量變更',
      max_level_changed: '最大等級調整',
      assessment_mode_changed: '評估模式變更'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getIssueTypeColor = (type: string) => {
    const colors = {
      deleted_goal: 'text-red-600 bg-red-50 border-red-200',
      level_count_changed: 'text-orange-600 bg-orange-50 border-orange-200',
      max_level_changed: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      assessment_mode_changed: 'text-blue-600 bg-blue-50 border-blue-200'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const filteredIssues = issues.filter(issue => {
    if (filter.resolved !== 'all') {
      if (filter.resolved === 'resolved' && !issue.resolved) return false;
      if (filter.resolved === 'unresolved' && issue.resolved) return false;
    }
    if (filter.issueType !== 'all' && issue.issue_type !== filter.issueType) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">
          <ArrowPathIcon className="h-8 w-8 text-[#A68A64] mx-auto mb-4 animate-spin" />
          <p className="text-[#87704e]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* 標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2B3A3B] mb-2">評估記錄版本兼容性管理</h1>
        <p className="text-[#87704e]">
          管理成長樹結構變更後的評估記錄兼容性問題
        </p>
      </div>

      {/* 摘要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <HanamiCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <InformationCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[#87704e]">受影響成長樹</p>
              <p className="text-2xl font-bold text-[#2B3A3B]">{summary.length}</p>
            </div>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-[#87704e]">總問題數</p>
              <p className="text-2xl font-bold text-[#2B3A3B]">
                {summary.reduce((sum, s) => sum + s.total_issues, 0)}
              </p>
            </div>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#87704e]">已解決</p>
              <p className="text-2xl font-bold text-[#2B3A3B]">
                {summary.reduce((sum, s) => sum + s.resolved_issues, 0)}
              </p>
            </div>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-[#87704e]">待處理</p>
              <p className="text-2xl font-bold text-[#2B3A3B]">
                {summary.reduce((sum, s) => sum + (s.total_issues - s.resolved_issues), 0)}
              </p>
            </div>
          </div>
        </HanamiCard>
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-4 mb-6">
        <HanamiButton
          onClick={detectIssues}
          disabled={processing}
          className="flex items-center gap-2"
        >
          <ArrowPathIcon className="h-4 w-4" />
          檢測問題
        </HanamiButton>

        <HanamiButton
          onClick={autoFixIssues}
          disabled={processing}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <WrenchScrewdriverIcon className="h-4 w-4" />
          自動修復
        </HanamiButton>
      </div>

      {/* 篩選器 */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter.resolved}
          onChange={(e) => setFilter(prev => ({ ...prev, resolved: e.target.value as any }))}
          className="px-3 py-2 border border-[#EADBC8] rounded-lg text-sm"
        >
          <option value="all">所有狀態</option>
          <option value="unresolved">未解決</option>
          <option value="resolved">已解決</option>
        </select>

        <select
          value={filter.issueType}
          onChange={(e) => setFilter(prev => ({ ...prev, issueType: e.target.value as any }))}
          className="px-3 py-2 border border-[#EADBC8] rounded-lg text-sm"
        >
          <option value="all">所有類型</option>
          <option value="deleted_goal">目標已刪除</option>
          <option value="level_count_changed">等級數量變更</option>
          <option value="max_level_changed">最大等級調整</option>
          <option value="assessment_mode_changed">評估模式變更</option>
        </select>
      </div>

      {/* 問題列表 */}
      <div className="space-y-4">
        {filteredIssues.map((issue) => (
          <HanamiCard key={issue.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getIssueTypeColor(issue.issue_type)}`}>
                    {getIssueTypeLabel(issue.issue_type)}
                  </span>
                  {issue.resolved && (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
                      已解決
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-[#87704e]">學生</p>
                    <p className="font-medium">{issue.assessment?.student?.full_name || '未知'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#87704e]">成長樹</p>
                    <p className="font-medium">{issue.assessment?.tree?.tree_name || '未知'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#87704e]">評估日期</p>
                    <p className="font-medium">
                      {issue.assessment?.assessment_date 
                        ? new Date(issue.assessment.assessment_date).toLocaleDateString('zh-HK')
                        : '未知'
                      }
                    </p>
                  </div>
                </div>

                <p className="text-sm text-[#2B3A3B] mb-3">
                  目標: {issue.goal_name || '未知目標'}
                </p>

                {issue.resolution_notes && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-3">
                    <p className="text-sm text-green-800">
                      <strong>解決備註:</strong> {issue.resolution_notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedIssue(issue);
                    setShowDetails(true);
                  }}
                  className="p-2 text-[#A64B2A] hover:text-[#8B3A1F] transition-colors"
                  title="查看詳細資訊"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>

                {!issue.resolved && (
                  <button
                    onClick={() => markAsResolved(issue.id, '手動標記為已解決')}
                    className="p-2 text-green-600 hover:text-green-800 transition-colors"
                    title="標記為已解決"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </HanamiCard>
        ))}
      </div>

      {/* 詳細資訊模態框 */}
      {showDetails && selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-hanami-text">兼容性問題詳細資訊</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-hanami-text hover:text-hanami-text-secondary transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-[#2B3A3B] mb-2">問題類型</h3>
                    <p className="text-sm text-[#87704e]">
                      {getIssueTypeLabel(selectedIssue.issue_type)}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2B3A3B] mb-2">處理時間</h3>
                    <p className="text-sm text-[#87704e]">
                      {new Date(selectedIssue.processed_at).toLocaleString('zh-HK')}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-[#2B3A3B] mb-2">原始資料</h3>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedIssue.original_data, null, 2)}
                  </pre>
                </div>

                {selectedIssue.current_data && (
                  <div>
                    <h3 className="font-semibold text-[#2B3A3B] mb-2">當前資料</h3>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedIssue.current_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

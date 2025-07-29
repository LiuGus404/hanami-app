'use client';

import { useState, useEffect } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiBadge from '@/components/ui/HanamiBadge';

interface RLSStatus {
  table_name: string;
  rls_enabled: boolean;
  policies: any[];
  can_query: boolean;
  query_error: string | null;
  exists: boolean;
  category: string;
}

interface Summary {
  total_tables: number;
  existing_tables: number;
  enabled_tables: number;
  disabled_tables: number;
  queryable_tables: number;
  tables_with_policies: number;
  tables_without_policies: number;
  categories: Record<string, any>;
}

interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  message: string;
  action: string;
}

export default function RLSCheckerPage() {
  const [rlsData, setRlsData] = useState<RLSStatus[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'all' | 'category' | 'issues'>('all');

  const fetchRLSStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rls-check');
      const data = await response.json();
      
      if (data.success) {
        setRlsData(data.data);
        setSummary(data.summary);
        setRecommendations(data.recommendations || []);
      } else {
        alert('獲取RLS狀態失敗: ' + data.error);
      }
    } catch (error) {
      console.error('獲取RLS狀態錯誤:', error);
      alert('獲取RLS狀態時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleRLSOperation = async (action: string, tableName?: string, category?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/rls-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          table_name: tableName,
          category
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        await fetchRLSStatus(); // 重新獲取狀態
      } else {
        alert('操作失敗: ' + data.message);
        if (data.suggestion) {
          console.log('建議:', data.suggestion);
        }
      }
    } catch (error) {
      console.error('RLS操作錯誤:', error);
      alert('執行RLS操作時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getCategoryColor = (category: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    const colors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'CORE_BUSINESS': 'default',
      'STUDENT_PROGRESS': 'success',
      'RESOURCE_LIBRARY': 'warning',
      'SYSTEM_ADMIN': 'danger',
      'AI_FEATURES': 'info',
      'COMMUNICATION': 'default',
      'TEACHING_MATERIALS': 'success',
      'SYSTEM_UTILITIES': 'default'
    };
    return colors[category] || 'default';
  };

  const getCategoryDisplayName = (category: string) => {
    const names: Record<string, string> = {
      'CORE_BUSINESS': '核心業務',
      'STUDENT_PROGRESS': '學生進度',
      'RESOURCE_LIBRARY': '資源庫',
      'SYSTEM_ADMIN': '系統管理',
      'AI_FEATURES': 'AI功能',
      'COMMUNICATION': '通訊系統',
      'TEACHING_MATERIALS': '教學材料',
      'SYSTEM_UTILITIES': '系統工具'
    };
    return names[category] || category;
  };

  const filteredData = rlsData.filter(item => {
    if (viewMode === 'issues') {
      return !item.rls_enabled || item.policies.length === 0;
    }
    if (selectedCategory !== 'ALL') {
      return item.category === selectedCategory;
    }
    return true;
  });

  const categories = ['ALL', ...Array.from(new Set(rlsData.map(item => item.category)))];

  useEffect(() => {
    fetchRLSStatus();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#4B4036]">🔒 RLS 權限檢查</h1>
        <HanamiButton
          onClick={fetchRLSStatus}
          disabled={loading}
          variant="primary"
        >
          {loading ? '檢查中...' : '重新檢查'}
        </HanamiButton>
      </div>

      {/* 統計摘要 */}
      {summary && (
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">📊 統計摘要</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#FFD59A]">{summary.total_tables}</div>
              <div className="text-sm text-[#2B3A3B]">總表數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.enabled_tables}</div>
              <div className="text-sm text-[#2B3A3B]">已啟用RLS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.disabled_tables}</div>
              <div className="text-sm text-[#2B3A3B]">未啟用RLS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.tables_with_policies}</div>
              <div className="text-sm text-[#2B3A3B]">有政策</div>
            </div>
          </div>
        </HanamiCard>
      )}

      {/* 建議 */}
      {recommendations.length > 0 && (
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">💡 建議</h2>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#FFF9F2] rounded-lg">
                <div className="flex items-center space-x-3">
                  <HanamiBadge variant={getPriorityColor(rec.priority)}>
                    {rec.priority}
                  </HanamiBadge>
                  <span className="text-[#4B4036]">{rec.message}</span>
                </div>
                <HanamiButton
                  onClick={() => handleRLSOperation(rec.action)}
                  variant="secondary"
                  size="sm"
                >
                  執行
                </HanamiButton>
              </div>
            ))}
          </div>
        </HanamiCard>
      )}

      {/* 分類統計 */}
      {summary && (
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">📋 分類統計</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(summary.categories).map(([category, stats]) => (
              <div key={category} className="p-4 bg-[#FFF9F2] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[#4B4036]">
                    {getCategoryDisplayName(category)}
                  </span>
                  <HanamiBadge variant={getCategoryColor(category)}>
                    {stats.total}
                  </HanamiBadge>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>已啟用:</span>
                    <span className="text-green-600">{stats.enabled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>未啟用:</span>
                    <span className="text-red-600">{stats.disabled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>有政策:</span>
                    <span className="text-blue-600">{stats.with_policies}</span>
                  </div>
                </div>
                {stats.disabled > 0 && (
                  <HanamiButton
                    onClick={() => handleRLSOperation('enable_rls_category', undefined, category)}
                    variant="primary"
                    size="sm"
                    className="w-full mt-2"
                  >
                    啟用此分類RLS
                  </HanamiButton>
                )}
              </div>
            ))}
          </div>
        </HanamiCard>
      )}

      {/* 控制面板 */}
      <HanamiCard className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">🎛️ 控制面板</h2>
        
        {/* 視圖模式選擇 */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-[#4B4036]">視圖模式:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-3 py-1 border border-[#EADBC8] rounded-lg bg-white"
            >
              <option value="all">全部表</option>
              <option value="category">按分類</option>
              <option value="issues">問題表</option>
            </select>
          </div>
          
          {viewMode === 'category' && (
            <div className="flex items-center space-x-2">
              <span className="text-[#4B4036]">分類:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-[#EADBC8] rounded-lg bg-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'ALL' ? '全部' : getCategoryDisplayName(cat)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 批量操作 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <HanamiButton
            onClick={() => handleRLSOperation('test_permissions')}
            variant="secondary"
            size="sm"
          >
            測試權限檢查
          </HanamiButton>
        </div>
      </HanamiCard>

      {/* 表列表 */}
      <HanamiCard className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">
          📋 表列表 ({filteredData.length})
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EADBC8]">
                <th className="text-left p-2 text-[#4B4036]">表名</th>
                <th className="text-left p-2 text-[#4B4036]">分類</th>
                <th className="text-left p-2 text-[#4B4036]">RLS狀態</th>
                <th className="text-left p-2 text-[#4B4036]">政策數量</th>
                <th className="text-left p-2 text-[#4B4036]">可查詢</th>
                <th className="text-left p-2 text-[#4B4036]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index} className="border-b border-[#EADBC8] hover:bg-[#FFF9F2]">
                  <td className="p-2 font-mono text-sm text-[#4B4036]">
                    {item.table_name}
                  </td>
                  <td className="p-2">
                    <HanamiBadge variant={getCategoryColor(item.category)}>
                      {getCategoryDisplayName(item.category)}
                    </HanamiBadge>
                  </td>
                  <td className="p-2">
                    <HanamiBadge variant={item.rls_enabled ? 'success' : 'danger'}>
                      {item.rls_enabled ? '已啟用' : '未啟用'}
                    </HanamiBadge>
                  </td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      item.policies.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.policies.length}
                    </span>
                  </td>
                  <td className="p-2">
                    <HanamiBadge variant={item.can_query ? 'success' : 'danger'}>
                      {item.can_query ? '是' : '否'}
                    </HanamiBadge>
                  </td>
                  <td className="p-2">
                    <div className="flex space-x-1">
                      {!item.rls_enabled && (
                        <HanamiButton
                          onClick={() => handleRLSOperation('enable_rls', item.table_name)}
                          variant="primary"
                          size="sm"
                        >
                          啟用RLS
                        </HanamiButton>
                      )}
                      {item.rls_enabled && item.policies.length === 0 && (
                        <HanamiButton
                          onClick={() => handleRLSOperation('create_basic_policy', item.table_name)}
                          variant="secondary"
                          size="sm"
                        >
                          創建政策
                        </HanamiButton>
                      )}
                      {item.rls_enabled && (
                        <HanamiButton
                          onClick={() => handleRLSOperation('disable_rls', item.table_name)}
                          variant="danger"
                          size="sm"
                        >
                          停用RLS
                        </HanamiButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-[#2B3A3B]">
            沒有找到符合條件的表
          </div>
        )}
      </HanamiCard>

      {/* 錯誤詳情 */}
      {rlsData.some(item => item.query_error) && (
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">⚠️ 錯誤詳情</h2>
          <div className="space-y-2">
            {rlsData.filter(item => item.query_error).map((item, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-mono text-sm text-red-800">{item.table_name}</div>
                <div className="text-sm text-red-600">{item.query_error}</div>
              </div>
            ))}
          </div>
        </HanamiCard>
      )}
    </div>
  );
} 
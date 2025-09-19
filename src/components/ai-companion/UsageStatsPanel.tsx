// ========================================
// AI 用量統計面板組件
// ========================================
// 版本: 1.0
// 建立日期: 2025-01-17

'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CpuChipIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useUsageStats } from '../../hooks/useAICompanion';
import { HanamiCard, HanamiSelect, HanamiButton } from '../ui';
import type { UsageStats } from '../../types/ai-companion';

interface UsageStatsPanelProps {
  roomId?: string;
  className?: string;
}

export function UsageStatsPanel({ roomId, className = '' }: UsageStatsPanelProps) {
  const [timeRange, setTimeRange] = useState<number>(7);
  const { stats, isLoading, error, reload } = useUsageStats(roomId, timeRange);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-hanami-primary border-t-transparent rounded-full"
        />
        <span className="ml-3 text-hanami-text-secondary">載入統計資料中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-4">{error}</div>
        <HanamiButton onClick={reload} variant="soft">
          重新載入
        </HanamiButton>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ChartBarIcon className="w-16 h-16 text-hanami-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-hanami-text mb-2">暫無統計資料</h3>
        <p className="text-hanami-text-secondary">開始使用 AI 功能後，這裡將顯示詳細的用量統計</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 標題與時間範圍選擇 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-hanami-text flex items-center">
            <ChartBarIcon className="w-8 h-8 mr-3 text-hanami-primary" />
            用量統計
          </h2>
          <p className="text-hanami-text-secondary">
            {roomId ? '房間' : '個人'}AI 使用情況分析
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <HanamiSelect
            value={timeRange.toString()}
            onChange={(value) => setTimeRange(parseInt(value))}
            options={[
              { value: '1', label: '最近 1 天' },
              { value: '7', label: '最近 7 天' },
              { value: '30', label: '最近 30 天' },
              { value: '90', label: '最近 90 天' },
            ]}
          />
          <HanamiButton size="sm" variant="soft" onClick={reload}>
            刷新
          </HanamiButton>
        </div>
      </div>

      {/* 概覽卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="總請求數"
          value={stats.total_requests.toLocaleString()}
          icon={<CpuChipIcon className="w-6 h-6" />}
          color="blue"
        />
        
        <StatsCard
          title="總 Token 數"
          value={stats.total_tokens.toLocaleString()}
          icon={<ChartBarIcon className="w-6 h-6" />}
          color="green"
        />
        
        <StatsCard
          title="總成本"
          value={`$${stats.total_cost.toFixed(4)}`}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          color="yellow"
        />
        
        <StatsCard
          title="平均延遲"
          value={`${Math.round(stats.avg_latency)}ms`}
          icon={<ClockIcon className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* 按模型統計 */}
      {Object.keys(stats.by_model).length > 0 && (
        <HanamiCard className="p-6">
          <h3 className="text-lg font-semibold text-hanami-text mb-4 flex items-center">
            <CpuChipIcon className="w-5 h-5 mr-2" />
            按模型統計
          </h3>
          
          <div className="space-y-4">
            {Object.entries(stats.by_model)
              .sort(([,a], [,b]) => b.cost - a.cost)
              .map(([model, data]) => (
                <ModelStatsRow key={model} model={model} data={data} />
              ))}
          </div>
        </HanamiCard>
      )}

      {/* 按日期統計 */}
      {Object.keys(stats.by_date).length > 0 && (
        <HanamiCard className="p-6">
          <h3 className="text-lg font-semibold text-hanami-text mb-4 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            按日期統計
          </h3>
          
          <div className="space-y-4">
            {Object.entries(stats.by_date)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, data]) => (
                <DateStatsRow key={date} date={date} data={data} />
              ))}
          </div>
        </HanamiCard>
      )}

      {/* 成本分析 */}
      <CostAnalysisPanel stats={stats} />

      {/* 使用提示 */}
      <HanamiCard className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">統計說明</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Token 數包含輸入和輸出的總和</li>
              <li>• 成本根據各模型的實時定價計算</li>
              <li>• 延遲時間為 AI 回應的處理時間</li>
              <li>• 統計資料每小時更新一次</li>
            </ul>
          </div>
        </div>
      </HanamiCard>
    </div>
  );
}

// ========================================
// 統計卡片組件
// ========================================

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  trend?: 'up' | 'down';
  trendValue?: string;
}

function StatsCard({ title, value, icon, color, trend, trendValue }: StatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-100',
    green: 'text-green-500 bg-green-100',
    yellow: 'text-yellow-500 bg-yellow-100',
    purple: 'text-purple-500 bg-purple-100',
  };

  return (
    <HanamiCard className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-hanami-text-secondary mb-1">{title}</p>
          <p className="text-2xl font-bold text-hanami-text">{value}</p>
          
          {trend && trendValue && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </HanamiCard>
  );
}

// ========================================
// 模型統計行組件
// ========================================

interface ModelStatsRowProps {
  model: string;
  data: {
    requests: number;
    tokens: number;
    cost: number;
  };
}

function ModelStatsRow({ model, data }: ModelStatsRowProps) {
  const costPercentage = useMemo(() => {
    // 這裡可以計算相對於總成本的百分比
    return Math.min((data.cost / 10) * 100, 100); // 假設最大成本為 $10
  }, [data.cost]);

  return (
    <div className="flex items-center justify-between p-4 bg-hanami-surface rounded-lg">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-hanami-text">{model}</h4>
          <span className="text-sm text-hanami-text-secondary">
            {data.requests} 次請求
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-hanami-text-secondary">
          <span>{data.tokens.toLocaleString()} tokens</span>
          <span>${data.cost.toFixed(4)}</span>
        </div>
        
        {/* 成本比例條 */}
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-hanami-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${costPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ========================================
// 日期統計行組件
// ========================================

interface DateStatsRowProps {
  date: string;
  data: {
    requests: number;
    tokens: number;
    cost: number;
  };
}

function DateStatsRow({ date, data }: DateStatsRowProps) {
  const formattedDate = new Date(date).toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <div className="flex items-center justify-between p-4 bg-hanami-surface rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="text-center">
          <div className="text-lg font-bold text-hanami-text">{formattedDate}</div>
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-hanami-text-secondary">請求數</span>
            <span className="font-medium text-hanami-text">{data.requests}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-hanami-text-secondary">Token 數</span>
            <span className="font-medium text-hanami-text">{data.tokens.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-hanami-text-secondary">成本</span>
            <span className="font-medium text-hanami-primary">${data.cost.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// 成本分析面板組件
// ========================================

interface CostAnalysisPanelProps {
  stats: UsageStats;
}

function CostAnalysisPanel({ stats }: CostAnalysisPanelProps) {
  const analysis = useMemo(() => {
    const totalRequests = stats.total_requests;
    const totalCost = stats.total_cost;
    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    const avgTokensPerRequest = totalRequests > 0 ? stats.total_tokens / totalRequests : 0;
    
    // 找出最昂貴的模型
    const mostExpensiveModel = Object.entries(stats.by_model)
      .sort(([,a], [,b]) => b.cost - a.cost)[0];
    
    // 找出最常用的模型
    const mostUsedModel = Object.entries(stats.by_model)
      .sort(([,a], [,b]) => b.requests - a.requests)[0];

    return {
      avgCostPerRequest,
      avgTokensPerRequest,
      mostExpensiveModel: mostExpensiveModel ? {
        name: mostExpensiveModel[0],
        cost: mostExpensiveModel[1].cost,
        percentage: (mostExpensiveModel[1].cost / totalCost) * 100,
      } : null,
      mostUsedModel: mostUsedModel ? {
        name: mostUsedModel[0],
        requests: mostUsedModel[1].requests,
        percentage: (mostUsedModel[1].requests / totalRequests) * 100,
      } : null,
    };
  }, [stats]);

  return (
    <HanamiCard className="p-6">
      <h3 className="text-lg font-semibold text-hanami-text mb-4 flex items-center">
        <CurrencyDollarIcon className="w-5 h-5 mr-2" />
        成本分析
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-hanami-surface rounded-lg">
          <div className="text-sm text-hanami-text-secondary mb-1">平均每次請求成本</div>
          <div className="text-xl font-bold text-hanami-primary">
            ${analysis.avgCostPerRequest.toFixed(6)}
          </div>
        </div>
        
        <div className="text-center p-4 bg-hanami-surface rounded-lg">
          <div className="text-sm text-hanami-text-secondary mb-1">平均每次請求 Token</div>
          <div className="text-xl font-bold text-hanami-primary">
            {Math.round(analysis.avgTokensPerRequest)}
          </div>
        </div>
        
        {analysis.mostExpensiveModel && (
          <div className="text-center p-4 bg-hanami-surface rounded-lg">
            <div className="text-sm text-hanami-text-secondary mb-1">最昂貴模型</div>
            <div className="text-sm font-bold text-hanami-text">
              {analysis.mostExpensiveModel.name}
            </div>
            <div className="text-xs text-hanami-text-secondary">
              {analysis.mostExpensiveModel.percentage.toFixed(1)}% 成本占比
            </div>
          </div>
        )}
        
        {analysis.mostUsedModel && (
          <div className="text-center p-4 bg-hanami-surface rounded-lg">
            <div className="text-sm text-hanami-text-secondary mb-1">最常用模型</div>
            <div className="text-sm font-bold text-hanami-text">
              {analysis.mostUsedModel.name}
            </div>
            <div className="text-xs text-hanami-text-secondary">
              {analysis.mostUsedModel.percentage.toFixed(1)}% 使用占比
            </div>
          </div>
        )}
      </div>

      {/* 成本優化建議 */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">💡 成本優化建議</h4>
        <ul className="text-sm text-green-800 space-y-1">
          {analysis.avgCostPerRequest > 0.01 && (
            <li>• 考慮使用更經濟的模型處理簡單任務</li>
          )}
          {analysis.avgTokensPerRequest > 2000 && (
            <li>• 優化 prompt 長度以減少 token 消耗</li>
          )}
          {analysis.mostExpensiveModel && analysis.mostExpensiveModel.percentage > 50 && (
            <li>• {analysis.mostExpensiveModel.name} 佔用較高成本，考慮合理使用</li>
          )}
          <li>• 定期檢查用量統計，及時調整使用策略</li>
        </ul>
      </div>
    </HanamiCard>
  );
}

export default UsageStatsPanel;

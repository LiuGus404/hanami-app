'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  PhotoIcon,
  SpeakerWaveIcon,
  ArrowPathIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { getSaasSupabaseClient } from '@/lib/supabase';

interface UsageStats {
  id: string;
  room_id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  image_count: number;
  audio_seconds: number;
  cost_usd: number;
  latency_ms: number;
  created_at: string;
  request_data: any;
  response_data: any;
}

interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalImages: number;
  avgLatency: number;
  topModel: string;
  recentActivity: string;
}

interface UsageStatsDisplayProps {
  userId?: string;
  roomId?: string;
  className?: string;
}

export default function UsageStatsDisplay({ userId, roomId, className = '' }: UsageStatsDisplayProps) {
  const [usageData, setUsageData] = useState<UsageStats[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [showDetails, setShowDetails] = useState(false);

  // 載入使用統計資料
  const loadUsageStats = async () => {
    setIsLoading(true);
    try {
      const saasSupabase = getSaasSupabaseClient();
      let query = saasSupabase
        .from('ai_usage')
        .select('*')
        .order('created_at', { ascending: false });

      // 根據篩選條件調整查詢
      if (userId) query = query.eq('user_id', userId);
      if (roomId) query = query.eq('room_id', roomId);

      // 根據時間期間篩選
      const now = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0); // 全部時間
      }

      if (selectedPeriod !== 'all') {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('❌ 載入使用統計失敗:', error);
        return;
      }

      setUsageData(data || []);
      
      // 計算摘要統計
      if (data && data.length > 0) {
        const totalRequests = data.length;
        const totalTokens = data.reduce((sum, item: any) => sum + (item.total_tokens || 0), 0);
        const totalImages = data.reduce((sum, item: any) => sum + (item.image_count || 0), 0);
        const avgLatency = data.reduce((sum, item: any) => sum + (item.latency_ms || 0), 0) / totalRequests;
        
        // 找出最常用的模型
        const modelCounts: Record<string, number> = {};
        data.forEach((item: any) => {
          modelCounts[item.model] = (modelCounts[item.model] || 0) + 1;
        });
        const topModel = Object.entries(modelCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
        
        const recentActivity = (data as any[])[0]?.created_at || '';

        setSummary({
          totalRequests,
          totalTokens,
          totalImages,
          avgLatency,
          topModel,
          recentActivity
        });
      } else {
        setSummary({
          totalRequests: 0,
          totalTokens: 0,
          totalImages: 0,
          avgLatency: 0,
          topModel: 'N/A',
          recentActivity: ''
        });
      }

    } catch (error) {
      console.error('❌ 載入使用統計錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsageStats();
  }, [userId, roomId, selectedPeriod]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-TW').format(num);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    return `${diffDays} 天前`;
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-[#EADBC8] ${className}`}>
      {/* 標題和控制 */}
      <div className="p-6 border-b border-[#EADBC8]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#4B4036]">AI 使用統計</h3>
              <p className="text-sm text-[#2B3A3B]">
                {roomId ? '本聊天室' : userId ? '個人' : '全系統'} 的 AI 使用情況
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 時間期間選擇器 */}
            <div className="flex bg-[#F8F5EC] rounded-xl p-1">
              {[
                { key: 'today', label: '今日' },
                { key: 'week', label: '本週' },
                { key: 'month', label: '本月' },
                { key: 'all', label: '全部' }
              ].map((period) => (
                <motion.button
                  key={period.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPeriod(period.key as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    selectedPeriod === period.key
                      ? 'bg-[#FFD59A] text-[#4B4036] shadow-sm'
                      : 'text-[#2B3A3B] hover:bg-[#FFD59A]/20'
                  }`}
                >
                  {period.label}
                </motion.button>
              ))}
            </div>
            
            {/* 刷新按鈕 */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={loadUsageStats}
              disabled={isLoading}
              className="p-2 bg-[#FFD59A]/20 hover:bg-[#FFD59A]/30 rounded-lg transition-all"
              title="刷新統計"
            >
              <ArrowPathIcon className={`w-4 h-4 text-[#4B4036] ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* 統計摘要卡片 */}
      {summary && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* 總請求數 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200"
            >
              <div className="flex items-center justify-between mb-2">
                <CpuChipIcon className="w-6 h-6 text-blue-600" />
                <span className="text-xs text-blue-500 font-medium">請求</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {formatNumber(summary.totalRequests)}
              </div>
              <div className="text-xs text-blue-600">總請求數</div>
            </motion.div>

            {/* 總 Token 數 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200"
            >
              <div className="flex items-center justify-between mb-2">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
                <span className="text-xs text-green-500 font-medium">Token</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {formatNumber(summary.totalTokens)}
              </div>
              <div className="text-xs text-green-600">總 Token 數</div>
            </motion.div>

            {/* 圖片數量 */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200"
            >
              <div className="flex items-center justify-between mb-2">
                <PhotoIcon className="w-6 h-6 text-purple-600" />
                <span className="text-xs text-purple-500 font-medium">圖片</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">
                {formatNumber(summary.totalImages)}
              </div>
              <div className="text-xs text-purple-600">生成圖片</div>
            </motion.div>
          </div>

          {/* 詳細資訊卡片 */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* 模型使用情況 */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-br from-[#FFF9F2] to-[#F8F5EC] rounded-xl p-4 border border-[#EADBC8]"
            >
              <div className="flex items-center space-x-2 mb-3">
                <CpuChipIcon className="w-5 h-5 text-[#FFB6C1]" />
                <span className="font-semibold text-[#4B4036]">模型資訊</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">主要模型:</span>
                  <span className="font-medium text-[#4B4036]">{summary.topModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">平均延遲:</span>
                  <span className="font-medium text-[#4B4036]">
                    {summary.avgLatency > 0 ? `${Math.round(summary.avgLatency)}ms` : 'N/A'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* 最近活動 */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-br from-[#FFF9F2] to-[#F8F5EC] rounded-xl p-4 border border-[#EADBC8]"
            >
              <div className="flex items-center space-x-2 mb-3">
                <CalendarIcon className="w-5 h-5 text-[#FFB6C1]" />
                <span className="font-semibold text-[#4B4036]">活動資訊</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">最近活動:</span>
                  <span className="font-medium text-[#4B4036]">
                    {summary.recentActivity ? getRelativeTime(summary.recentActivity) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B3A3B]">統計期間:</span>
                  <span className="font-medium text-[#4B4036]">
                    {selectedPeriod === 'today' ? '今日' :
                     selectedPeriod === 'week' ? '過去 7 天' :
                     selectedPeriod === 'month' ? '本月' : '全部時間'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 詳細記錄切換 */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-xl font-medium transition-all shadow-sm"
            >
              <ChartBarIcon className="w-4 h-4" />
              <span>{showDetails ? '隱藏詳細記錄' : '查看詳細記錄'}</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* 詳細使用記錄 */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-[#EADBC8]"
          >
            <div className="p-6">
              <h4 className="font-semibold text-[#4B4036] mb-4 flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-[#FFB6C1]" />
                <span>詳細使用記錄</span>
              </h4>
              
              {usageData.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {usageData.map((usage, index) => (
                    <motion.div
                      key={usage.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gradient-to-r from-white/70 to-white/50 rounded-lg p-4 border border-[#EADBC8] hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                            <CpuChipIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-[#4B4036]">
                              {usage.provider} - {usage.model}
                            </div>
                            <div className="text-xs text-[#2B3A3B]">
                              {getRelativeTime(usage.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-[#4B4036]">
                            {formatNumber(usage.total_tokens)} tokens
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <div className="font-medium text-blue-700">
                            {formatNumber(usage.input_tokens)}
                          </div>
                          <div className="text-blue-500">輸入</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <div className="font-medium text-green-700">
                            {formatNumber(usage.output_tokens)}
                          </div>
                          <div className="text-green-500">輸出</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <div className="font-medium text-purple-700">
                            {formatNumber(usage.image_count)}
                          </div>
                          <div className="text-purple-500">圖片</div>
                        </div>
                      </div>
                      
                      {usage.latency_ms && (
                        <div className="mt-2 text-xs text-[#2B3A3B] flex items-center space-x-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>回應時間: {usage.latency_ms}ms</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#2B3A3B]">
                  <CpuChipIcon className="w-12 h-12 mx-auto mb-3 text-[#2B3A3B]/50" />
                  <p>此期間內沒有使用記錄</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 載入狀態 */}
      {isLoading && (
        <div className="p-6">
          <div className="flex items-center justify-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-[#FFB6C1] border-t-transparent rounded-full"
            />
            <span className="text-[#2B3A3B]">載入使用統計中...</span>
          </div>
        </div>
      )}
    </div>
  );
}

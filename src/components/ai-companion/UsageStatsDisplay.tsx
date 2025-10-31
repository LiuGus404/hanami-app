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
  CalendarIcon,
  AcademicCapIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
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

interface RoleUsage {
  roleId: string;
  roleName: string;
  imagePath: string;
  icon: any;
  color: string;
  totalFood: number;
  requests: number;
  avgTokens: number;
}

interface UsageStatsDisplayProps {
  userId?: string;
  roomId?: string;
  className?: string;
}

export default function UsageStatsDisplay({ userId, roomId, className = '' }: UsageStatsDisplayProps) {
  const [usageData, setUsageData] = useState<UsageStats[]>([]);
  const [roleUsage, setRoleUsage] = useState<RoleUsage[]>([]);
  const [totalFood, setTotalFood] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [showDetails, setShowDetails] = useState(false);

  // 將成本轉換為食物
  const costToFood = (costUsd: number): number => {
    // 1 USD ≈ 3 HKD ≈ 300 食物點數
    return Math.ceil(costUsd * 300);
  };

  // 從訊息中提取角色資訊
  const extractRoleFromMessage = async (messageId: string): Promise<string | null> => {
    try {
      const saasSupabase = getSaasSupabaseClient();
      const { data, error } = await saasSupabase
        .from('chat_messages')
        .select('content_json')
        .eq('id', messageId)
        .single();
      
      if (error || !data) return null;
      
      // 從 content_json 中提取 role_hint
      const contentJson = (data as any).content_json;
      if (contentJson && contentJson.role_hint) {
        const roleHint = contentJson.role_hint;
        if (roleHint === 'mori' || roleHint.includes('mori')) return 'mori-researcher';
        if (roleHint === 'pico' || roleHint.includes('pico')) return 'pico-artist';
        if (roleHint === 'hibi' || roleHint.includes('hibi')) return 'hibi-manager';
      }
      
      return 'hibi-manager'; // 默認
    } catch (error) {
      return null;
    }
  };

  // 載入使用統計資料
  const loadUsageStats = async () => {
    setIsLoading(true);
    try {
      const saasSupabase = getSaasSupabaseClient();
      
      // 首先獲取房間中的活躍角色
      const rolesMap = new Map<string, { name: string; imagePath: string; icon: any; color: string }>();
      
      // 從 chat_threads 查詢 thread_id (room_id)
      let threadId = roomId;
      if (roomId) {
        // 嘗試將 roomId 作為 thread_id 使用，因為它們應該是同一個 ID
        const { data: thread } = await saasSupabase
          .from('chat_threads')
          .select('id')
          .eq('id', roomId)
          .single();
        
        if (thread) {
          threadId = thread.id;
        }

        // 查詢房間角色
        const { data: roomRoles } = await saasSupabase
          .from('room_roles')
          .select(`
            role_instances!inner(
              ai_role_id,
              ai_roles!inner(name, slug)
            )
          `)
          .eq('room_id', roomId)
          .eq('is_active', true);

        if (roomRoles) {
          for (const roomRole of roomRoles) {
            const roleInstance = (roomRole as any).role_instances;
            const aiRole = roleInstance?.ai_roles;
            if (aiRole) {
              // 根據角色設置對應的圖標和顏色
              let icon = CpuChipIcon;
              let color = 'from-orange-400 to-red-500';
              let imagePath = '/3d-character-backgrounds/studio/Hibi/lulu(front).png';
              
              if (aiRole.slug?.includes('mori')) {
                icon = AcademicCapIcon;
                color = 'from-amber-400 to-orange-500';
                imagePath = '/3d-character-backgrounds/studio/Mori/Mori.png';
              } else if (aiRole.slug?.includes('pico')) {
                icon = PaintBrushIcon;
                color = 'from-blue-400 to-cyan-500';
                imagePath = '/3d-character-backgrounds/studio/Pico/Pico.png';
              }
              
              rolesMap.set(aiRole.slug, {
                name: aiRole.name,
                imagePath,
                icon,
                color
              });
            }
          }
        }
      }

      // 從 message_costs 查詢使用記錄（包含準確的 food_amount）
      let costQuery = saasSupabase
        .from('message_costs')
        .select('*')
        .order('created_at', { ascending: false });

      if (threadId) costQuery = costQuery.eq('thread_id', threadId);

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
          startDate = new Date(0);
      }

      if (selectedPeriod !== 'all') {
        costQuery = costQuery.gte('created_at', startDate.toISOString());
      }

      const { data: costRecords, error: costError } = await costQuery.limit(100);

      if (costError) {
        console.error('❌ 載入成本記錄失敗:', costError);
        return;
      }

      console.log('📊 載入到的成本記錄:', costRecords?.length || 0, '條');

      // 如果有成本記錄，獲取對應的訊息資料
      let messageRecords: any[] = [];
      if (costRecords && costRecords.length > 0) {
        const messageIds = costRecords.map(record => record.message_id).filter(Boolean);
        if (messageIds.length > 0) {
          const { data: messages, error: messageError } = await saasSupabase
            .from('chat_messages')
            .select('id, thread_id, content, content_json, created_at')
            .in('id', messageIds);

          if (messageError) {
            console.error('❌ 載入訊息記錄失敗:', messageError);
          } else {
            messageRecords = messages || [];
          }
        }
      }

      // 創建訊息 ID 到訊息資料的映射
      const messageMap = new Map();
      messageRecords.forEach(msg => {
        messageMap.set(msg.id, msg);
      });
      
      // 轉換 message_costs 為 usage 格式
      const convertedUsage = (costRecords || []).map((record: any) => {
        const message = messageMap.get(record.message_id);
        return {
          id: record.id,
          thread_id: record.thread_id,
          provider: record.model_provider || 'OpenRouter',
          model: record.model_name || 'unknown',
          input_tokens: record.input_tokens || 0,
          output_tokens: record.output_tokens || 0,
          total_tokens: record.total_tokens || 0,
          image_count: 0,
          audio_seconds: 0,
          cost_usd: record.total_cost_usd || 0,
          latency_ms: 0,
          created_at: record.created_at,
          request_data: record.request_data,
          response_data: record.response_data,
          food_cost: record.food_amount || 0, // 使用 food_amount 欄位
          role_hint: message?.content_json?.role_hint || null,
          message_content: message?.content || '',
          message_json: message?.content_json || {}
        };
      });

      setUsageData(convertedUsage);
      
      // 統計每個角色的食用情況
      const roleStats = new Map<string, RoleUsage>();
      let totalFoodConsumed = 0;

      if (costRecords && costRecords.length > 0) {
        for (const record of costRecords) {
          // 直接使用 food_amount 欄位（已經從 message_costs 表獲取）
          const food = record.food_amount || 0;
          totalFoodConsumed += food;

          // 從關聯的 chat_messages 提取角色資訊
          const msg = record.chat_messages;
          let roleSlug = 'hibi-manager'; // 默認為 Hibi
          
          // 嘗試從 role_hint 提取
          if (msg && msg.content_json && msg.content_json.role_hint) {
            const roleHint = msg.content_json.role_hint;
            if (roleHint === 'mori' || roleHint.includes('mori')) {
              roleSlug = 'mori-researcher';
            } else if (roleHint === 'pico' || roleHint.includes('pico')) {
              roleSlug = 'pico-artist';
            } else if (roleHint === 'hibi' || roleHint.includes('hibi')) {
              roleSlug = 'hibi-manager';
            }
          }

          // 查找角色資訊
          let roleInfo = rolesMap.get(roleSlug);
          if (!roleInfo) {
            // 如果找不到，使用預設值
            roleInfo = {
              name: roleSlug.includes('mori') ? '墨墨' : roleSlug.includes('pico') ? '皮可' : 'Hibi',
              imagePath: roleSlug.includes('mori') 
                ? '/3d-character-backgrounds/studio/Mori/Mori.png'
                : roleSlug.includes('pico')
                  ? '/3d-character-backgrounds/studio/Pico/Pico.png'
                  : '/3d-character-backgrounds/studio/Hibi/lulu(front).png',
              icon: roleSlug.includes('mori') ? AcademicCapIcon : roleSlug.includes('pico') ? PaintBrushIcon : CpuChipIcon,
              color: roleSlug.includes('mori') 
                ? 'from-amber-400 to-orange-500'
                : roleSlug.includes('pico')
                  ? 'from-blue-400 to-cyan-500'
                  : 'from-orange-400 to-red-500'
            };
          }

          const totalTokens = record.total_tokens || 0;

          const existing = roleStats.get(roleSlug);
          if (existing) {
            existing.totalFood += food;
            existing.requests += 1;
            existing.avgTokens = Math.round((existing.avgTokens * (existing.requests - 1) + totalTokens) / existing.requests);
          } else {
            roleStats.set(roleSlug, {
              roleId: roleSlug,
              roleName: roleInfo.name,
              imagePath: roleInfo.imagePath,
              icon: roleInfo.icon,
              color: roleInfo.color,
              totalFood: food,
              requests: 1,
              avgTokens: totalTokens
            });
          }
        }
      }

      console.log('🍔 統計結果:', { totalFood: totalFoodConsumed, roleCount: roleStats.size });
      
      setRoleUsage(Array.from(roleStats.values()).sort((a, b) => b.totalFood - a.totalFood));
      setTotalFood(totalFoodConsumed);

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

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-[#EADBC8] ${className}`}>
      {/* 標題和控制 */}
      <div className="p-6 border-b border-[#EADBC8]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
              <img src="/3d-character-backgrounds/studio/food/food.png" alt="食物" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#4B4036]">AI 食用統計</h3>
              <p className="text-sm text-[#2B3A3B]">
                {roomId ? '本聊天室' : userId ? '個人' : '全系統'} 的 AI 食用情況
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

        {/* 總食用量 */}
        <div className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/3d-character-backgrounds/studio/food/food.png" alt="總食物" className="w-12 h-12" />
              <div>
                <div className="text-sm text-white/90">總共食用</div>
                <div className="text-3xl font-bold text-white">{formatNumber(totalFood)}</div>
                <div className="text-xs text-white/80">食物點數</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/90">請求次數</div>
              <div className="text-2xl font-bold text-white">{formatNumber(usageData.length)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 各角色食用情況 */}
      {!isLoading && (
        <div className="p-6">
          {roleUsage.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-[#4B4036] mb-4 flex items-center space-x-2">
                <ChartBarIcon className="w-5 h-5 text-[#FFB6C1]" />
                <span>各角色食用情況</span>
              </h4>
              
              {roleUsage.map((role, index) => {
                const RoleIcon = role.icon;
                const percentage = totalFood > 0 ? (role.totalFood / totalFood) * 100 : 0;
                
                return (
                  <motion.div
                    key={role.roleId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-white/70 to-white/50 rounded-xl p-4 border border-[#EADBC8] hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${role.color} p-0.5 shadow-md`}>
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            <Image
                              src={role.imagePath}
                              alt={role.roleName}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-[#4B4036] flex items-center space-x-2">
                            <RoleIcon className="w-4 h-4" />
                            <span>{role.roleName}</span>
                          </div>
                          <div className="text-xs text-[#2B3A3B]">
                            {role.requests} 次請求 · 平均 {formatNumber(role.avgTokens)} tokens
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <img src="/3d-character-backgrounds/studio/food/food.png" alt="食物" className="w-8 h-8" />
                          <div>
                            <div className="text-xl font-bold text-[#4B4036]">
                              {formatNumber(role.totalFood)}
                            </div>
                            <div className="text-xs text-[#2B3A3B]">食物點數</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 進度條 */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className={`h-full bg-gradient-to-r ${role.color} shadow-sm`}
                      />
                    </div>
                    <div className="text-xs text-[#2B3A3B] mt-1 flex justify-between">
                      <span>佔總食用量的 {percentage.toFixed(1)}%</span>
                      <span>{formatNumber(role.totalFood)} / {formatNumber(totalFood)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <img src="/3d-character-backgrounds/studio/food/food.png" alt="空盤" className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <p className="text-[#2B3A3B]">此期間內沒有食用記錄</p>
              <p className="text-xs text-[#2B3A3B]/60 mt-2">開始使用 AI 後，食用記錄將顯示在這裡</p>
            </div>
          )}

          {/* 詳細記錄切換 */}
          {usageData.length > 0 && (
            <div className="flex justify-center mt-6">
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
          )}
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
                  {usageData.map((usage, index) => {
                    // 使用 food_cost 而不是轉換 cost_usd
                    const food = (usage as any).food_cost || costToFood(usage.cost_usd || 0);
                    return (
                      <motion.div
                        key={usage.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="bg-gradient-to-r from-white/70 to-white/50 rounded-lg p-4 border border-[#EADBC8] hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                              <img src="/3d-character-backgrounds/studio/food/food.png" alt="食物" className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-[#4B4036]">
                                {usage.provider} - {usage.model}
                              </div>
                              <div className="text-xs text-[#2B3A3B]">
                                {new Date(usage.created_at).toLocaleString('zh-TW')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <img src="/3d-character-backgrounds/studio/food/food.png" alt="食物" className="w-5 h-5" />
                              <div className="font-medium text-[#4B4036]">{formatNumber(food)}</div>
                            </div>
                            <div className="text-xs text-[#2B3A3B]">食物點數</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <div className="font-medium text-blue-700">
                              {formatNumber(usage.input_tokens)}
                            </div>
                            <div className="text-blue-500">輸入 tokens</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <div className="font-medium text-green-700">
                              {formatNumber(usage.output_tokens)}
                            </div>
                            <div className="text-green-500">輸出 tokens</div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-2 text-center">
                            <div className="font-medium text-purple-700">
                              {formatNumber(usage.image_count)}
                            </div>
                            <div className="text-purple-500">圖片</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : null}
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

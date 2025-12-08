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
  thread_id?: string;
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
  roleSlug?: string;
  food_cost?: number;
  role_hint?: string | null;
  message_content?: string;
  message_json?: any;
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

interface MessageCostRecord {
  id?: string;
  thread_id?: string | null;
  message_id?: string | null;
  model_provider?: string | null;
  model_name?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  total_cost_usd?: number | null;
  food_amount?: number | null;
  created_at?: string | null;
  request_data?: any;
  response_data?: any;
  assigned_role_id?: string | null;
  agent_id?: string | null;
  ai_role_slug?: string | null;
  ai_role_id?: string | null;
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
  const [roleMetadata, setRoleMetadata] = useState<Record<string, RoleUsage>>({});

  // 將成本轉換為食物
  const costToFood = (costUsd: number): number => {
    // 1 USD ≈ 3 HKD ≈ 300 食物點數
    return Math.ceil(costUsd * 300);
  };

  const extractFoodCost = (data: unknown): number => {
    if (!data) return 0;

    if (typeof data === 'string') {
      try {
        return extractFoodCost(JSON.parse(data));
      } catch (error) {
        return 0;
      }
    }

    if (Array.isArray(data)) {
      return data.reduce((sum, item) => sum + extractFoodCost(item), 0);
    }

    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      let total = 0;

      const food = obj.food as any;
      if (food && typeof food.total_food_cost === 'number') {
        total += food.total_food_cost;
      }

      if (typeof obj.total_food_cost === 'number') {
        total += obj.total_food_cost as number;
      }

      for (const value of Object.values(obj)) {
        if (value && value !== food && typeof value === 'object') {
          total += extractFoodCost(value);
        }
      }

      return total;
    }

    return 0;
  };

  const detectRoleClue = (value: unknown): string | null => {
    if (!value) return null;
    const str = String(value).toLowerCase();
    if (!str) return null;
    if (str.includes('pico-artist') || str.includes('pico-processor')) return 'pico-artist';
    if (str.includes('image_generation') || str.includes('image-generation') || str.includes(' image')) return 'pico-artist';
    if (str.includes('mori') || str.includes('research')) return 'mori-researcher';
    if (str.includes('hibi') || str.includes('manager')) return 'hibi-manager';
    return null;
  };

  const detectRoleFromAny = (value: unknown): string | null => {
    if (!value) return null;
    const clue = detectRoleClue(value);
    if (clue) return clue;

    if (typeof value === 'object') {
      try {
        const entries = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
        for (const entry of entries) {
          const detected = detectRoleFromAny(entry);
          if (detected) return detected;
        }
      } catch (error) {
        return null;
      }
    }

    return null;
  };

  const detectRoleSlugFromMessage = (message: any): string | null => {
    if (!message) return null;

    let contentJson = message.content_json;
    if (typeof contentJson === 'string') {
      try {
        contentJson = JSON.parse(contentJson);
      } catch (error) {
        contentJson = null;
      }
    }

    const clues = [
      contentJson?.role_hint,
      contentJson?.assigned_role_slug,
      message.assigned_role_id,
      message.processing_worker_id,
      message.agent_id,
    ];

    for (const clue of clues) {
      const detected = detectRoleClue(clue);
      if (detected) return detected;
    }

    if (contentJson && typeof contentJson === 'object') {
      if ((contentJson as any).image || (contentJson as any).image_url) {
        return 'pico-artist';
      }
    }

    const nestedDetected = detectRoleFromAny(contentJson);
    if (nestedDetected) return nestedDetected;

    const contentStr = typeof message.content === 'string' ? message.content : '';
    if (contentStr.includes('![image]') || contentStr.includes('![Image]') || contentStr.includes('![圖片]')) return 'pico-artist';
    if (contentStr.includes('皮可')) return 'pico-artist';
    if (contentStr.includes('墨墨')) return 'mori-researcher';
    if (contentStr.includes('hibi') || contentStr.includes('Hibi')) return 'hibi-manager';

    return null;
  };

  const resolveRoleSlug = (record: any, message: any): string => {
    const messageDetected = detectRoleSlugFromMessage(message);
    if (messageDetected) return messageDetected;

    const directClues = [
      record.assigned_role_id,
      (record as any)?.chat_messages?.assigned_role_id,
      record.model_name,
      record.model_provider,
      record.processing_worker_id,
      message?.processing_worker_id,
      message?.role,
    ];

    for (const clue of directClues) {
      const detected = detectRoleClue(clue);
      if (detected) return detected;
    }

    if (message?.message_type === 'final' && typeof message?.content === 'string' && message.content.includes('![image]')) {
      return 'pico-artist';
    }

    if (message?.content_json && (message.content_json.image || message.content_json.image_url)) {
      return 'pico-artist';
    }

    const requestClue = detectRoleFromAny(record.request_data);
    if (requestClue) return requestClue;

    const responseClue = detectRoleFromAny(record.response_data);
    if (responseClue) return responseClue;

    return 'hibi-manager';
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

      const baseRoles = [
        {
          slug: 'hibi-manager',
          name: '希希',
          imagePath: '/3d-character-backgrounds/studio/lulu(front).png',
          icon: CpuChipIcon,
          color: 'from-orange-400 to-red-500',
        },
        {
          slug: 'mori-researcher',
          name: '墨墨',
          imagePath: '/3d-character-backgrounds/studio/Mori/Mori.png',
          icon: AcademicCapIcon,
          color: 'from-amber-400 to-orange-500',
        },
        {
          slug: 'pico-artist',
          name: '皮可',
          imagePath: '/3d-character-backgrounds/studio/Pico/Pico.png',
          icon: PaintBrushIcon,
          color: 'from-blue-400 to-cyan-500',
        },
      ];

      // 首先獲取房間中的活躍角色
      const rolesMap = new Map<string, { name: string; imagePath: string; icon: any; color: string }>();
      baseRoles.forEach((role) => {
        rolesMap.set(role.slug, {
          name: role.name,
          imagePath: role.imagePath,
          icon: role.icon,
          color: role.color,
        });
      });

      const usageRecords: UsageStats[] = [];

      const threadIds = new Set<string>();

      if (roomId) {
        const { data: thread } = await saasSupabase
          .from('chat_threads')
          .select('id')
          .eq('id', roomId)
          .maybeSingle();
        const threadData = thread as { id?: string } | null;
        if (threadData?.id) {
          threadIds.add(threadData.id);
        } else {
          threadIds.add(roomId);
        }

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
              let icon = CpuChipIcon;
              let color = 'from-orange-400 to-red-500';
              let imagePath = '/3d-character-backgrounds/studio/lulu(front).png';

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
                color,
              });
            }
          }
        }
      }

      if (!roomId && userId) {
        const { data: userThreads } = await saasSupabase
          .from('chat_threads')
          .select('id')
          .eq('user_id', userId);
        if (userThreads) {
          userThreads.forEach((thread: any) => {
            if (thread?.id) threadIds.add(thread.id);
          });
        }
      }

      const resolvedThreadIds = Array.from(threadIds);

      // 從 message_costs 查詢使用記錄（包含準確的 food_amount）
      let costQuery = saasSupabase
        .from('message_costs')
        .select('*')
        .order('created_at', { ascending: false });

      if (roomId) {
        costQuery = costQuery.eq('thread_id', roomId);
      } else if (userId) {
        costQuery = costQuery.eq('user_id', userId);
      } else if (resolvedThreadIds.length > 0) {
        costQuery = costQuery.in('thread_id', resolvedThreadIds);
      }

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

      const { data: costRecordsRaw, error: costError } = await costQuery.limit(100);
      const costRecords = (costRecordsRaw ?? []) as MessageCostRecord[];

      if (costError) {
        console.error('❌ 載入成本記錄失敗:', costError);
        return;
      }

      console.log('📊 載入到的成本記錄:', costRecords.length, '條');

      // 如果有成本記錄，獲取對應的訊息資料
      let messageRecords: any[] = [];
      if (costRecords.length > 0) {
        const messageIds = costRecords.map((record) => record.message_id).filter(Boolean) as string[];
        if (messageIds.length > 0) {
          const { data: messages, error: messageError } = await saasSupabase
            .from('chat_messages')
            .select('id, thread_id, content, content_json, created_at, assigned_role_id, processing_worker_id, agent_id, status')
            .in('id', messageIds);

          if (messageError) {
            console.error('❌ 載入訊息記錄失敗:', messageError);
          } else {
            messageRecords = (messages || []).map((msg: any) => {
              let parsedJson = msg.content_json;
              if (typeof parsedJson === 'string') {
                try {
                  parsedJson = JSON.parse(parsedJson);
                } catch (error) {
                  parsedJson = null;
                }
              }
              return {
                ...msg,
                content_json: parsedJson,
              };
            });
          }
        }
      }

      const messageMap = new Map<string, any>();
      messageRecords.forEach((msg) => {
        if (msg?.id) {
          messageMap.set(msg.id, msg);
        }
      });

      // 轉換 message_costs 為 usage 格式
      const convertedUsage = costRecords.map((record) => {
        const messageId = record.message_id ?? undefined;
        const message = messageId ? messageMap.get(messageId) : undefined;
        return {
          id: record.id ?? '',
          room_id: roomId || '',
          thread_id: record.thread_id ?? roomId ?? '',
          provider: record.model_provider || 'OpenRouter',
          model: record.model_name || 'unknown',
          input_tokens: record.input_tokens || 0,
          output_tokens: record.output_tokens || 0,
          total_tokens: record.total_tokens || 0,
          image_count: 0,
          audio_seconds: 0,
          cost_usd: record.total_cost_usd || 0,
          latency_ms: 0,
          created_at: record.created_at ?? new Date().toISOString(),
          request_data: record.request_data,
          response_data: record.response_data,
          food_cost: record.food_amount || 0, // 使用 food_amount 欄位
          role_hint: message?.content_json?.role_hint || null,
          message_content: message?.content || '',
          message_json: message?.content_json || {},
          roleSlug: resolveRoleSlug(record, message),
        };
      });
      usageRecords.push(...convertedUsage);

      setUsageData(usageRecords);

      // 統計每個角色的食用情況
      const roleStats = new Map<string, RoleUsage>();

      const ensureRoleEntry = (slug: string) => {
        if (!roleStats.has(slug)) {
          const info = rolesMap.get(slug) || rolesMap.get('hibi-manager')!;
          roleStats.set(slug, {
            roleId: slug,
            roleName: info.name,
            imagePath: info.imagePath,
            icon: info.icon,
            color: info.color,
            totalFood: 0,
            requests: 0,
            avgTokens: 0,
          });
        }
        const entry = roleStats.get(slug)!;
        return entry;
      };

      baseRoles.forEach((role) => ensureRoleEntry(role.slug));

      let totalFoodConsumed = 0;
      const countedMessageIds = new Set<string>();
      const countedRequestIds = new Set<string>();

      if (costRecords.length > 0) {
        for (const record of costRecords) {
          // 直接使用 food_amount 欄位（已經從 message_costs 表獲取）
          const food = record.food_amount || 0;

          const messageKey = record.message_id ?? undefined;
          const message = messageKey ? messageMap.get(messageKey) : undefined;
          const roleSlug = resolveRoleSlug(record, message);
          if (record.message_id) {
            countedMessageIds.add(record.message_id);
          }

          const entry = ensureRoleEntry(roleSlug);

          entry.requests += 1;
          const totalTokens = record.total_tokens || 0;
          entry.avgTokens = Math.round((entry.avgTokens * (entry.requests - 1) + totalTokens) / entry.requests);

          if (food > 0) {
            entry.totalFood += food;
            totalFoodConsumed += food;
          }
        }
      }

      if (messageRecords.length > 0) {
        for (const message of messageRecords) {
          if (!message?.id || countedMessageIds.has(message.id)) continue;

          const roleSlug = detectRoleSlugFromMessage(message) || 'hibi-manager';
          const entry = ensureRoleEntry(roleSlug);

          const foodFromMessage = extractFoodCost(message.content_json);
          if (foodFromMessage > 0) {
            entry.totalFood += foodFromMessage;
            totalFoodConsumed += foodFromMessage;
          }

          entry.requests += 1;

          countedMessageIds.add(message.id);
        }
      }

      try {
        let foodQuery = saasSupabase
          .from('food_transactions')
          .select(`
            id, user_id, transaction_type, amount, balance_after, message_id, thread_id, description, created_at,
            ai_messages (
              sender_role_instance_id,
              role_instances (
                role_id
              )
            )
          `)
          .in('transaction_type', ['spend', 'usage'])
          .order('created_at', { ascending: false })
          .limit(500);

        if (roomId) {
          foodQuery = foodQuery.eq('thread_id', roomId);
        } else if (userId) {
          foodQuery = foodQuery.eq('user_id', userId);
        } else if (resolvedThreadIds.length > 0) {
          foodQuery = foodQuery.in('thread_id', resolvedThreadIds);
        }

        if (selectedPeriod !== 'all') {
          foodQuery = foodQuery.gte('created_at', startDate.toISOString());
        }

        const { data: foodRows, error: foodError } = await foodQuery;
        if (foodError) {
          console.error('⚠️ 載入 food_transactions 失敗:', foodError);
        } else if (foodRows && foodRows.length > 0) {
          const missingMessageIds = new Set<string>();

          foodRows.forEach((tx: any) => {
            if (tx.message_id && !messageMap.has(tx.message_id)) {
              missingMessageIds.add(tx.message_id);
            }
          });

          if (missingMessageIds.size > 0) {
            const { data: txMessages, error: txMessageError } = await saasSupabase
              .from('chat_messages')
              .select('id, thread_id, content, content_json, created_at, assigned_role_id, processing_worker_id, agent_id, status')
              .in('id', Array.from(missingMessageIds));

            if (txMessageError) {
              console.error('⚠️ 交易訊息載入失敗:', txMessageError);
            } else if (txMessages) {
              txMessages.forEach((raw: any) => {
                let parsedJson = raw.content_json;
                if (typeof parsedJson === 'string') {
                  try {
                    parsedJson = JSON.parse(parsedJson);
                  } catch (error) {
                    parsedJson = null;
                  }
                }
                const message = {
                  ...raw,
                  content_json: parsedJson,
                };
                messageRecords.push(message);
                messageMap.set(message.id, message);
              });
            }
          }

          foodRows.forEach((tx: any) => {
            const food = Math.abs(Number(tx.amount) || 0);
            const message = tx.message_id ? messageMap.get(tx.message_id) : null;

            const pseudoRecord = {
              assigned_role_id: message?.assigned_role_id,
              model_name: message?.message_type,
              model_provider: message?.agent_id,
              request_data: message?.content_json,
              response_data: null,
              processing_worker_id: message?.processing_worker_id,
            };

            let roleSlug = resolveRoleSlug(pseudoRecord, message);

            // 優先使用從 ai_messages join 出來的角色資料
            const aiMessage = (tx as any).ai_messages;
            const roleId = aiMessage?.role_instances?.role_id;
            if (roleId) {
              const map: Record<string, string> = {
                'hibi': 'hibi-manager',
                'mori': 'mori-researcher',
                'pico': 'pico-artist'
              };
              roleSlug = map[roleId] || roleId;
            }

            if (!roleSlug && tx.description) {
              const descClue = detectRoleClue(tx.description);
              if (descClue) roleSlug = descClue;
            }

            const entry = ensureRoleEntry(roleSlug);

            if (food > 0) {
              entry.totalFood += food;
              totalFoodConsumed += food;
            }

            entry.requests += 1;

            usageRecords.push({
              id: tx.id,
              room_id: tx.thread_id || '',
              thread_id: tx.thread_id,
              provider: 'food_transactions',
              model: tx.transaction_type,
              input_tokens: 0,
              output_tokens: 0,
              total_tokens: 0,
              image_count: 0,
              audio_seconds: 0,
              cost_usd: 0,
              latency_ms: 0,
              created_at: tx.created_at,
              request_data: tx.description,
              response_data: null,
              food_cost: food,
              role_hint: message?.content_json?.role_hint || null,
              message_content: message?.content || '',
              message_json: message?.content_json || {},
              roleSlug,
            });
          });
        }
      } catch (txError) {
        console.error('⚠️ 食量交易載入失敗:', txError);
      }

      const shouldLoadUsageFallback = totalFoodConsumed === 0;

      if (shouldLoadUsageFallback) {
        try {
          let usageQuery = saasSupabase
            .from('ai_usage')
            .select('id, room_id, user_id, role_instance_id, total_tokens, cost_usd, created_at')
            .order('created_at', { ascending: false })
            .limit(500);

          if (roomId) {
            usageQuery = usageQuery.eq('room_id', roomId);
          } else if (userId) {
            usageQuery = usageQuery.eq('user_id', userId);
          } else if (resolvedThreadIds.length > 0) {
            usageQuery = usageQuery.in('room_id', resolvedThreadIds);
          }

          if (selectedPeriod !== 'all') {
            usageQuery = usageQuery.gte('created_at', startDate.toISOString());
          }

          const { data: usageRows, error: usageError } = await usageQuery;
          if (usageError) {
            console.error('⚠️ 載入 ai_usage 失敗:', usageError);
          } else if (usageRows && usageRows.length > 0) {
            const roleInstanceIds = usageRows
              .map((row: any) => row.role_instance_id)
              .filter((id: string | null | undefined) => !!id);

            const roleInstanceMap = new Map<string, string>();

            if (roleInstanceIds.length > 0) {
              const { data: roleInstanceRows, error: roleInstanceError } = await saasSupabase
                .from('role_instances')
                .select('id, ai_roles(name, slug)')
                .in('id', roleInstanceIds);

              if (roleInstanceError) {
                console.error('⚠️ 載入 role_instances 失敗:', roleInstanceError);
              } else if (roleInstanceRows) {
                roleInstanceRows.forEach((row: any) => {
                  const slug = row?.ai_roles?.slug;
                  if (row?.id && slug) {
                    roleInstanceMap.set(row.id, slug);
                  }
                });
              }
            }

            usageRows.forEach((usage: any) => {
              const roleSlug = roleInstanceMap.get(usage.role_instance_id) || 'hibi-manager';
              const entry = ensureRoleEntry(roleSlug);

              const food = usage.cost_usd ? costToFood(Number(usage.cost_usd)) : 0;
              if (food > 0) {
                entry.totalFood += food;
                totalFoodConsumed += food;
              }

              entry.requests += 1;
              const tokens = Number(usage.total_tokens) || 0;
              entry.avgTokens = Math.round((entry.avgTokens * (entry.requests - 1) + tokens) / entry.requests);

              usageRecords.push({
                id: usage.id,
                room_id: usage.room_id || '',
                thread_id: usage.room_id,
                provider: 'ai_usage',
                model: 'usage-backfill',
                input_tokens: 0,
                output_tokens: 0,
                total_tokens: usage.total_tokens || 0,
                image_count: 0,
                audio_seconds: 0,
                cost_usd: usage.cost_usd || 0,
                latency_ms: 0,
                created_at: usage.created_at,
                request_data: null,
                response_data: null,
                food_cost: food,
                role_hint: null,
                message_content: '',
                message_json: {},
                roleSlug,
              });
            });
          }
        } catch (fallbackError) {
          console.error('⚠️ ai_usage 後備載入失敗:', fallbackError);
        }
      }

      baseRoles.forEach((role) => ensureRoleEntry(role.slug));

      console.log('🍔 統計結果:', { totalFood: totalFoodConsumed, roleCount: roleStats.size });

      const sortedRoles = Array.from(roleStats.values())
        .sort((a, b) => b.totalFood - a.totalFood || a.roleName.localeCompare(b.roleName, 'zh-Hant'));
      setRoleUsage(sortedRoles);
      const metadata: Record<string, RoleUsage> = {};
      sortedRoles.forEach((role) => {
        metadata[role.roleId] = role;
      });
      setRoleMetadata(metadata);
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
              <img src="/apple-icon.svg" alt="食量" className="w-5 h-5" />
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
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedPeriod === period.key
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
              <img src="/apple-icon.svg" alt="總食量" className="w-12 h-12" />
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
                          <img src="/apple-icon.svg" alt="食量" className="w-8 h-8" />
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
              <img src="/apple-icon.svg" alt="沒有食量" className="w-20 h-20 mx-auto mb-4 opacity-50" />
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
                    const food = (() => {
                      if (usage.food_cost && usage.food_cost > 0) return usage.food_cost;
                      const fromMessage = extractFoodCost(usage.message_json);
                      if (fromMessage > 0) return fromMessage;
                      return costToFood(usage.cost_usd || 0);
                    })();
                    const inputTokens = usage.input_tokens || usage.total_tokens || 0;
                    const outputTokens = usage.output_tokens || 0;
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
                              <img src="/apple-icon.svg" alt="食量" className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-[#4B4036] flex items-center space-x-2">
                                <span>{usage.provider} - {usage.model}</span>
                                {usage.roleSlug && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-[#FFF4E0] text-[#4B4036]">
                                    {roleMetadata[usage.roleSlug]?.roleName || usage.roleSlug}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#2B3A3B]">
                                {new Date(usage.created_at).toLocaleString('zh-TW')}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <img src="/apple-icon.svg" alt="食量" className="w-5 h-5" />
                              <div className="font-medium text-[#4B4036]">{formatNumber(food)}</div>
                            </div>
                            <div className="text-xs text-[#2B3A3B]">食物點數</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <div className="font-medium text-blue-700">
                              {formatNumber(inputTokens)}
                            </div>
                            <div className="text-blue-500">輸入 tokens</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <div className="font-medium text-green-700">
                              {formatNumber(outputTokens)}
                            </div>
                            <div className="text-green-500">輸出 tokens</div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-2 text-center">
                            <div className="font-medium text-purple-700">
                              {formatNumber(usage.image_count || (usage.message_json?.image ? 1 : 0))}
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

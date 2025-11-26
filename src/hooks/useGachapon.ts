import { useState, useEffect } from 'react';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { useSaasAuth } from './saas/useSaasAuthSimple';

const supabase = getSaasSupabaseClient();

export interface GachaMachine {
  id: string;
  machine_name: string;
  machine_slug: string;
  description?: string;
  image_url?: string;
  background_url?: string;
  theme_config?: any;
  single_draw_cost: number;
  ten_draw_cost: number;
  ten_draw_bonus: number;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

export interface GachaReward {
  id: string;
  reward_name: string;
  reward_description?: string;
  reward_type: 'discount_coupon' | 'free_trial' | 'course_voucher' | 'vip_upgrade' | 'subscription_extend' | 'physical_gift' | 'points_bonus' | 'custom';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon_emoji?: string;
  icon_url?: string;
  reward_value: any;
  usage_limit?: number;
  valid_days?: number;
  delivery_type: 'auto' | 'manual' | 'physical';
  stock_total?: number;
  stock_remaining?: number;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface MachineReward {
  id: string;
  machine_id: string;
  reward_id: string;
  probability: number;
  weight: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  reward: GachaReward;
}

export interface DrawResult {
  reward: GachaReward;
  draw_type: 'single' | 'ten';
  points_spent: number;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  draw_history_id?: string;
  reward_code?: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  usage_count: number;
  usage_limit?: number;
  obtained_at: string;
  expires_at?: string;
  used_at?: string;
  delivery_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address?: any;
  tracking_number?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  reward: GachaReward;
}

export function useGachapon() {
  const { user } = useSaasAuth();
  const [machines, setMachines] = useState<GachaMachine[]>([]);
  const [rewards, setRewards] = useState<GachaReward[]>([]);
  const [machineRewards, setMachineRewards] = useState<MachineReward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 獲取啟用的扭蛋機
  const fetchMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_gacha_machines' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('獲取扭蛋機錯誤:', error);
        // 如果是表格不存在的錯誤，不設置錯誤狀態，而是返回空數組
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('扭蛋機表格尚未創建，請先執行資料庫遷移腳本');
          setMachines([]);
          return;
        }
        throw error;
      }
      setMachines((data as unknown as GachaMachine[]) || []);
    } catch (err) {
      console.error('獲取扭蛋機失敗:', err);
      setError(err instanceof Error ? err.message : '獲取扭蛋機失敗');
    }
  };

  // 獲取啟用的獎勵
  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_gacha_rewards' as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('獲取獎勵錯誤:', error);
        // 如果是表格不存在的錯誤，不設置錯誤狀態，而是返回空數組
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('獎勵表格尚未創建，請先執行資料庫遷移腳本');
          setRewards([]);
          return;
        }
        throw error;
      }
      setRewards((data as unknown as GachaReward[]) || []);
    } catch (err) {
      console.error('獲取獎勵失敗:', err);
      setError(err instanceof Error ? err.message : '獲取獎勵失敗');
    }
  };

  // 獲取扭蛋機獎勵關聯
  const fetchMachineRewards = async (machineId: string) => {
    try {
      const { data, error } = await supabase
        .from('saas_gacha_machine_rewards' as any)
        .select(`
          *,
          reward:saas_gacha_rewards(*)
        `)
        .eq('machine_id', machineId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMachineRewards((data as unknown as MachineReward[]) || []);
    } catch (err) {
      console.error('獲取扭蛋機獎勵失敗:', err);
      setError(err instanceof Error ? err.message : '獲取扭蛋機獎勵失敗');
    }
  };

  // 獲取用戶獎勵
  const fetchUserRewards = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('saas_user_rewards' as any)
        .select(`
          *,
          reward:saas_gacha_rewards(*)
        `)
        .eq('user_id', user.id)
        .order('obtained_at', { ascending: false });

      if (error) {
        console.error('獲取用戶獎勵錯誤:', error);
        // 如果是表格不存在的錯誤，不設置錯誤狀態，而是返回空數組
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('用戶獎勵表格尚未創建，請先執行資料庫遷移腳本');
          setUserRewards([]);
          return;
        }
        throw error;
      }
      setUserRewards((data as unknown as UserReward[]) || []);
    } catch (err) {
      console.error('獲取用戶獎勵失敗:', err);
      setError(err instanceof Error ? err.message : '獲取用戶獎勵失敗');
    }
  };

  // 執行抽獎
  const performDraw = async (machineId: string, drawType: 'single' | 'ten'): Promise<DrawResult[]> => {
    if (!user?.id) throw new Error('用戶未登入');

    try {
      // 獲取扭蛋機信息
      const { data: machine, error: machineError } = await supabase
        .from('saas_gacha_machine_rewards' as any)
        .select(`
          *,
          reward:saas_gacha_rewards(*)
        `)
        .eq('machine_id', machineId)
        .eq('is_active', true);

      if (machineError) throw machineError;

      if (!machine || machine.length === 0) {
        throw new Error('扭蛋機沒有可用獎勵');
      }

      // 計算抽獎次數
      const drawCount = drawType === 'single' ? 1 : 10;
      const results: DrawResult[] = [];

      // 執行抽獎邏輯
      for (let i = 0; i < drawCount; i++) {
        const random = Math.random() * 100;
        let cumulativeProbability = 0;

        for (const machineReward of (machine as unknown as MachineReward[])) {
          cumulativeProbability += machineReward.probability;
          if (random <= cumulativeProbability) {
            results.push({
              reward: machineReward.reward,
              draw_type: drawType,
              points_spent: drawType === 'single' ? 10 : 100 // 這裡應該從機器配置獲取
            });
            break;
          }
        }
      }

      // 記錄抽獎歷史
      const { data: drawHistory, error: historyError } = await supabase
        .from('saas_gacha_draw_history' as any)
        .insert({
          user_id: user.id,
          machine_id: machineId,
          draw_type: drawType,
          points_spent: drawType === 'single' ? 10 : 100,
          rewards_won: results.map(r => ({
            reward_id: r.reward.id,
            reward_name: r.reward.reward_name,
            reward_type: r.reward.reward_type,
            rarity: r.reward.rarity
          })),
          draw_count: drawCount
        } as any)
        .select()
        .single();

      if (historyError) throw historyError;

      // 創建用戶獎勵記錄
      const userRewardInserts = results.map(result => ({
        user_id: user.id,
        reward_id: result.reward.id,
        draw_history_id: (drawHistory as any)?.id,
        reward_code: `REW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'active' as const,
        usage_count: 0,
        usage_limit: result.reward.usage_limit,
        obtained_at: new Date().toISOString(),
        expires_at: result.reward.valid_days ? 
          new Date(Date.now() + result.reward.valid_days * 24 * 60 * 60 * 1000).toISOString() : 
          undefined,
        metadata: {
          draw_type: drawType,
          machine_id: machineId,
          draw_history_id: (drawHistory as any)?.id
        }
      }));

      const { error: rewardError } = await supabase
        .from('saas_user_rewards' as any)
        .insert(userRewardInserts as any);

      if (rewardError) throw rewardError;

      // 更新用戶獎勵列表
      await fetchUserRewards();

      return results;
    } catch (err) {
      console.error('抽獎失敗:', err);
      throw err;
    }
  };

  // 使用獎勵
  const useReward = async (userRewardId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await (supabase as any)
        .from('saas_user_rewards')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userRewardId)
        .eq('user_id', user.id);

      if (error) throw error;

      // 更新本地狀態
      setUserRewards(prev => 
        prev.map(reward => 
          reward.id === userRewardId 
            ? { ...reward, status: 'used', used_at: new Date().toISOString() }
            : reward
        )
      );

      return true;
    } catch (err) {
      console.error('使用獎勵失敗:', err);
      setError(err instanceof Error ? err.message : '使用獎勵失敗');
      return false;
    }
  };

  // 初始化
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMachines(),
          fetchRewards()
        ]);
        
        if (user?.id) {
          await fetchUserRewards();
        }
      } catch (err) {
        console.error('初始化扭蛋機數據失敗:', err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [user?.id]);

  return {
    machines,
    rewards,
    machineRewards,
    userRewards,
    loading,
    error,
    performDraw,
    useReward,
    fetchMachineRewards,
    fetchUserRewards,
    refetch: () => {
      fetchMachines();
      fetchRewards();
      if (user?.id) {
        fetchUserRewards();
      }
    }
  };
}

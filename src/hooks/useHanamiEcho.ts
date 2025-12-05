'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 用戶食量餘額介面
interface UserFoodBalance {
  id: string;
  user_id: string;
  current_balance: number;
  total_earned: number;
  total_spent: number;
  monthly_allowance: number;
  last_monthly_reset: string;
  daily_usage: number;
  weekly_usage: number;
  monthly_usage: number;
  created_at: string;
  updated_at: string;
}

// 食量交易記錄介面
interface FoodTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  message_id?: string;
  thread_id?: string;
  description?: string;
  created_at: string;
}

// 訊息成本記錄介面
interface MessageCost {
  id: string;
  message_id: string;
  thread_id: string;
  user_id: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  model_provider: string;
  model_name: string;
  input_cost_usd: number;
  output_cost_usd: number;
  total_cost_usd: number;
  food_cost_usd: number;
  food_amount: number;
  created_at: string;
}

// HanamiEcho Hook
export function useHanamiEcho(userId: string) {
  const [foodBalance, setFoodBalance] = useState<UserFoodBalance | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<FoodTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化用戶食量餘額
  const initializeFoodBalance = async () => {
    try {
      // 1. 建立初始餘額記錄
      const { data: newBalance, error: balanceError } = await supabase
        .from('user_food_balance')
        .insert({
          user_id: userId,
          current_balance: 1000, // 初始贈送 1000
          monthly_allowance: 1000,
          total_earned: 1000,
          total_spent: 0,
          daily_usage: 0,
          weekly_usage: 0,
          monthly_usage: 0
        })
        .select()
        .single();

      if (balanceError) throw balanceError;

      // 2. 建立初始交易記錄
      const { error: txError } = await supabase
        .from('food_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'initial_grant',
          amount: 1000,
          balance_after: 1000,
          description: '新用戶初始食量'
        });

      if (txError) {
        console.error('建立初始交易記錄失敗:', txError);
        // 不阻擋流程，因為餘額已經建立
      }

      setFoodBalance(newBalance);
      return newBalance;
    } catch (err) {
      console.error('初始化食量餘額失敗:', err);
      throw err;
    }
  };

  // 載入用戶食量餘額
  const loadFoodBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('user_food_balance')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 找不到記錄，進行初始化
          console.log('用戶無食量記錄，進行初始化...');
          await initializeFoodBalance();
          return;
        }
        throw error;
      }

      setFoodBalance(data);
    } catch (err) {
      console.error('載入食量餘額錯誤:', err);
      setError(err instanceof Error ? err.message : '載入食量餘額失敗');
    }
  };

  // 載入最近的食量交易記錄
  const loadRecentTransactions = async (limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('food_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setRecentTransactions(data || []);
    } catch (err) {
      console.error('載入交易記錄錯誤:', err);
      setError(err instanceof Error ? err.message : '載入交易記錄失敗');
    }
  };

  // 發送訊息（兼容現有 aihome 系統）
  const sendMessage = async (
    roomId: string,
    message: string,
    options: {
      roleHint?: string;
      messageType?: string;
    } = {}
  ) => {
    try {
      const response = await fetch('/api/ai-companions/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          message,
          userId,
          roleHint: options.roleHint || 'auto',
          messageType: options.messageType || 'user_request'
        })
      });

      const result = await response.json();

      if (result.success) {
        // 重新載入食量餘額
        await loadFoodBalance();
        await loadRecentTransactions();
        return result;
      } else {
        throw new Error(result.error || '發送失敗');
      }
    } catch (err) {
      console.error('發送訊息錯誤:', err);
      throw err;
    }
  };

  // 購買食量
  const purchaseFood = async (amount: number, description?: string) => {
    try {
      const response = await fetch('/api/ai-companions/purchase-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount,
          description: description || `購買 ${amount} 食量`
        })
      });

      const result = await response.json();

      if (result.success) {
        // 重新載入食量餘額
        await loadFoodBalance();
        await loadRecentTransactions();
        return result;
      } else {
        throw new Error(result.error || '購買失敗');
      }
    } catch (err) {
      console.error('購買食量錯誤:', err);
      throw err;
    }
  };

  // 獲取訊息成本統計
  const getMessageCostStats = async (threadId?: string, days: number = 30) => {
    try {
      let query = supabase
        .from('message_costs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      if (threadId) {
        query = query.eq('thread_id', threadId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // 計算統計數據
      const totalCost = data?.reduce((sum, cost) => sum + cost.food_amount, 0) || 0;
      const totalMessages = data?.length || 0;
      const averageCost = totalMessages > 0 ? totalCost / totalMessages : 0;

      return {
        totalCost,
        totalMessages,
        averageCost,
        costs: data || []
      };
    } catch (err) {
      console.error('獲取成本統計錯誤:', err);
      throw err;
    }
  };

  // 初始化載入
  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      setError(null);

      Promise.all([
        loadFoodBalance(),
        loadRecentTransactions()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [userId]);

  // 訂閱實時更新
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`hanami_echo:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_food_balance',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('食量餘額更新:', payload);
          setFoodBalance(payload.new as UserFoodBalance);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('新交易記錄:', payload);
          loadRecentTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    // 狀態
    foodBalance,
    recentTransactions,
    isLoading,
    error,

    // 方法
    sendMessage,
    purchaseFood,
    getMessageCostStats,
    loadFoodBalance,
    loadRecentTransactions,

    // 計算屬性
    hasEnoughBalance: (cost: number) => (foodBalance?.current_balance || 0) >= cost,
    balancePercentage: foodBalance ? (foodBalance.current_balance / foodBalance.monthly_allowance) * 100 : 0
  };
}

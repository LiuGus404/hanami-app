import { useState, useEffect, useCallback } from 'react';
import { getSaasSupabaseClient } from '@/lib/supabase';

export function useFoodDisplay(userId?: string) {
  const [foodBalance, setFoodBalance] = useState<number>(0);
  const [foodHistory, setFoodHistory] = useState<any[]>([]);
  const [showFoodHistory, setShowFoodHistory] = useState(false);
  const saasSupabaseClient = getSaasSupabaseClient();

  // 獲取食量資訊
  const fetchFoodInfo = useCallback(async () => {
    if (!userId) return;
    try {
      // 1. 獲取餘額
      const { data: userData, error: userError } = await saasSupabaseClient
        .from('user_food_balance')
        .select('current_balance')
        .eq('user_id', userId)
        .single();

      if (!userError && userData) {
        setFoodBalance((userData as any).current_balance || 0);
      }

      // 2. 獲取最近 5 筆交易記錄
      const { data: historyData, error: historyError } = await saasSupabaseClient
        .from('food_transactions')
        .select(`
          *,
          ai_messages!fk_food_transactions_ai_message (
            role_id,
            role_instances!ai_messages_sender_role_instance_id_fkey (role_id)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!historyError && historyData) {
        setFoodHistory(historyData);
      }
    } catch (error) {
      console.error('❌ 獲取食量資訊失敗:', error);
    }
  }, [userId, saasSupabaseClient]);

  // 監聽食量變更
  useEffect(() => {
    if (userId) {
      fetchFoodInfo();

      // 訂閱變更
      const channel = saasSupabaseClient
        .channel('food-balance-changes-' + userId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_food_balance',
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchFoodInfo();
          }
        )
        .subscribe();

      return () => {
        saasSupabaseClient.removeChannel(channel);
      };
    }
    return undefined;
  }, [userId, saasSupabaseClient, fetchFoodInfo]);

  const toggleFoodHistory = () => {
    setShowFoodHistory((prev) => {
      if (!prev) {
        fetchFoodInfo();
      }
      return !prev;
    });
  };

  return {
    foodBalance,
    foodHistory,
    showFoodHistory,
    toggleFoodHistory,
    fetchFoodInfo
  };
}


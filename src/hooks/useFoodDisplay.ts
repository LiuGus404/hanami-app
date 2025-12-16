import { useState, useEffect, useCallback } from 'react';
import { createSaasClient } from '@/lib/supabase-saas';

export function useFoodDisplay(userId?: string) {
  const [foodBalance, setFoodBalance] = useState<number>(0);
  const [foodHistory, setFoodHistory] = useState<any[]>([]);
  const [showFoodHistory, setShowFoodHistory] = useState(false);
  // Use the same authenticated client from supabase-saas (singleton with auth)
  const [saasSupabaseClient] = useState(() => createSaasClient());

  // 獲取食量資訊 - Use API to ensure balance record exists
  const fetchFoodInfo = useCallback(async () => {
    if (!userId) return;
    try {
      console.log('🍎 [Food] 獲取食量資訊 for user:', userId);

      // 1. 使用 API 獲取餘額（API 會自動創建記錄如果不存在）
      try {
        const response = await fetch(`/api/food/balance?userId=${userId}`);
        const result = await response.json();

        if (result.success && result.data) {
          const balance = result.data.current_balance || 0;
          console.log('🍎 [Food] 當前餘額 (via API):', balance, result.isNew ? '(新建)' : '');
          setFoodBalance(balance);
        } else {
          console.warn('⚠️ [Food] API 回應異常:', result.error);
          setFoodBalance(0);
        }
      } catch (apiError) {
        console.warn('⚠️ [Food] API 呼叫失敗，嘗試直接查詢:', apiError);

        // Fallback: Direct query
        const { data: userData, error: userError } = await saasSupabaseClient
          .from('user_food_balance')
          .select('current_balance')
          .eq('user_id', userId)
          .single();

        if (!userError && userData) {
          const balance = (userData as any).current_balance || 0;
          console.log('🍎 [Food] 當前餘額 (fallback):', balance);
          setFoodBalance(balance);
        } else {
          console.log('🍎 [Food] 用戶尚無餘額記錄');
          setFoodBalance(0);
        }
      }

      // 2. 獲取最近 5 筆交易記錄 (switch to API to avoid RLS/Client Session issues)
      try {
        const historyResponse = await fetch(`/api/food/history?userId=${userId}&limit=5`);
        const historyResult = await historyResponse.json();

        console.log('🍎 [Food] History API Result:', historyResult);

        if (!historyResult.success) {
          console.warn('⚠️ [Food] 獲取交易記錄失敗 (API):', historyResult.error);
        } else if (historyResult.data) {
          console.log('🍎 [Food] 獲取到交易記錄:', historyResult.data.length, '筆');
          setFoodHistory(historyResult.data);
        } else {
          setFoodHistory([]);
        }
      } catch (historyReqError) {
        console.warn('⚠️ [Food] History API Request Failed:', historyReqError);
        setFoodHistory([]);
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


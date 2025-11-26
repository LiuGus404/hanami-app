import { useState, useEffect } from 'react';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { useSaasAuth } from './saas/useSaasAuthSimple';

const supabase = getSaasSupabaseClient();

export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  available_points: number;
  used_points: number;
  expired_points: number;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  transaction_type: 'earn_login' | 'earn_task' | 'earn_referral' | 'earn_purchase' | 'earn_event' | 'earn_admin' | 'spend_gacha' | 'spend_redeem' | 'expire' | 'refund';
  points_change: number;
  balance_after: number;
  source_type?: string;
  source_id?: string;
  description?: string;
  expires_at?: string;
  metadata?: any;
  created_at: string;
}

export function useUserPoints() {
  const { user } = useSaasAuth();
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 獲取用戶積分
  const fetchUserPoints = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('saas_user_points' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 用戶沒有積分記錄，創建一個
          await createUserPoints();
          return;
        }
        throw error;
      }

      setPoints(data as unknown as UserPoints | null);
    } catch (err) {
      console.error('獲取用戶積分失敗:', err);
      setError(err instanceof Error ? err.message : '獲取積分失敗');
    } finally {
      setLoading(false);
    }
  };

  // 創建用戶積分記錄
  const createUserPoints = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('saas_user_points' as any)
        .insert({
          user_id: user.id,
          total_points: 100, // 初始積分
          available_points: 100,
          used_points: 0,
          expired_points: 0
        } as any)
        .select()
        .single();

      if (error) throw error;

      setPoints(data as unknown as UserPoints | null);

      // 創建初始積分交易記錄
      await supabase
        .from('saas_point_transactions' as any)
        .insert({
          user_id: user.id,
          transaction_type: 'earn_admin',
          points_change: 100,
          balance_after: 100,
          description: '初始積分獎勵',
          metadata: { source: 'system_init' }
        } as any);
    } catch (err) {
      console.error('創建用戶積分失敗:', err);
      setError(err instanceof Error ? err.message : '創建積分失敗');
    }
  };

  // 獲取用戶交易記錄
  const fetchTransactions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('saas_point_transactions' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions((data as unknown as PointTransaction[]) || []);
    } catch (err) {
      console.error('獲取交易記錄失敗:', err);
    }
  };

  // 消費積分（用於扭蛋）
  const spendPoints = async (amount: number, sourceType: string, sourceId?: string, description?: string) => {
    if (!user?.id || !points) return false;

    if (points.available_points < amount) {
      setError('積分不足');
      return false;
    }

    try {
      const newBalance = points.available_points - amount;
      const newUsed = points.used_points + amount;

      // 更新積分餘額
      const { error: updateError } = await (supabase as any)
        .from('saas_user_points')
        .update({
          available_points: newBalance,
          used_points: newUsed,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 創建交易記錄
      const { error: transactionError } = await supabase
        .from('saas_point_transactions' as any)
        .insert({
          user_id: user.id,
          transaction_type: 'spend_gacha',
          points_change: -amount,
          balance_after: newBalance,
          source_type: sourceType,
          source_id: sourceId,
          description: description || `消費 ${amount} 積分`,
          metadata: { 
            source: 'gachapon',
            amount: amount,
            timestamp: new Date().toISOString()
          }
        } as any);

      if (transactionError) throw transactionError;

      // 更新本地狀態
      setPoints(prev => prev ? {
        ...prev,
        available_points: newBalance,
        used_points: newUsed,
        updated_at: new Date().toISOString()
      } : null);

      return true;
    } catch (err) {
      console.error('消費積分失敗:', err);
      setError(err instanceof Error ? err.message : '消費積分失敗');
      return false;
    }
  };

  // 獲得積分
  const earnPoints = async (amount: number, transactionType: PointTransaction['transaction_type'], description?: string, metadata?: any) => {
    if (!user?.id || !points) return false;

    try {
      const newBalance = points.available_points + amount;
      const newTotal = points.total_points + amount;

      // 更新積分餘額
      const { error: updateError } = await (supabase as any)
        .from('saas_user_points')
        .update({
          total_points: newTotal,
          available_points: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 創建交易記錄
      const { error: transactionError } = await supabase
        .from('saas_point_transactions' as any)
        .insert({
          user_id: user.id,
          transaction_type: transactionType,
          points_change: amount,
          balance_after: newBalance,
          description: description || `獲得 ${amount} 積分`,
          metadata: metadata || {}
        } as any);

      if (transactionError) throw transactionError;

      // 更新本地狀態
      setPoints(prev => prev ? {
        ...prev,
        total_points: newTotal,
        available_points: newBalance,
        updated_at: new Date().toISOString()
      } : null);

      return true;
    } catch (err) {
      console.error('獲得積分失敗:', err);
      setError(err instanceof Error ? err.message : '獲得積分失敗');
      return false;
    }
  };

  // 初始化
  useEffect(() => {
    if (user?.id) {
      fetchUserPoints();
      fetchTransactions();
    }
  }, [user?.id]);

  return {
    points,
    transactions,
    loading,
    error,
    spendPoints,
    earnPoints,
    refetch: fetchUserPoints,
    refetchTransactions: fetchTransactions
  };
}

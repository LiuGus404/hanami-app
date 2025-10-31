'use client';

import React, { useState, useEffect } from 'react';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface FoodBalanceDisplayProps {
  userId: string;
  className?: string;
}

export function FoodBalanceDisplay({ userId, className = '' }: FoodBalanceDisplayProps) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = async () => {
    try {
      const supabase = getSaasSupabaseClient();
      const { data, error } = await (supabase as any)
        .from('user_food_balance')
        .select('current_balance')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setBalance((data as any)?.current_balance || 0);
      setError(null);
    } catch (err) {
      console.error('載入食量餘額錯誤:', err);
      setError('無法載入餘額');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    loadBalance();

    // Realtime 監聽餘額變化
    const supabase = getSaasSupabaseClient();
    const channel = supabase
      .channel(`food-balance-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_food_balance',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('📊 食量餘額更新:', payload.new.current_balance);
        setBalance(payload.new.current_balance);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center space-x-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 ${className}`}
      >
        <span className="text-xl">⚠️</span>
        <div className="text-xs text-red-600 font-medium">{error}</div>
      </motion.div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-center space-x-2 bg-white rounded-2xl px-3 py-2 shadow-sm hover:shadow-md transition-all border border-gray-100 ${className}`}
      title="食量餘額"
    >
      {/* 蘋果圖標 */}
      <div className="w-5 h-5 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
          {/* 葉子 */}
          <ellipse cx="55" cy="15" rx="12" ry="8" fill="#8BC34A" transform="rotate(-20 55 15)"/>
          <path d="M 55 15 Q 50 20, 50 28" stroke="#6D4C41" strokeWidth="2" fill="none"/>
          
          {/* 蘋果主體 - 漸層 */}
          <defs>
            <radialGradient id="appleGradientHorizontal" cx="40%" cy="40%">
              <stop offset="0%" style={{ stopColor: '#FF7043', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#EF5350', stopOpacity: 1 }} />
            </radialGradient>
          </defs>
          
          <circle cx="50" cy="55" r="32" fill="url(#appleGradientHorizontal)"/>
          
          {/* 高光 */}
          <ellipse cx="38" cy="42" rx="12" ry="16" fill="white" opacity="0.4"/>
          <ellipse cx="35" cy="45" rx="6" ry="8" fill="white" opacity="0.6"/>
          
          {/* 小星星裝飾 */}
          <circle cx="65" cy="48" r="1.5" fill="white" opacity="0.8"/>
          <circle cx="70" cy="60" r="1.5" fill="white" opacity="0.8"/>
          <circle cx="58" cy="72" r="1.5" fill="white" opacity="0.8"/>
        </svg>
      </div>
      
      {/* 餘額數字 */}
      <div className="text-sm font-semibold text-gray-700">
        {loading ? (
          <span className="animate-pulse">...</span>
        ) : (
          <motion.span
            key={balance}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {balance > 999 ? `${(balance / 1000).toFixed(1)}k` : balance}
          </motion.span>
        )}
      </div>
    </motion.button>
  );
}

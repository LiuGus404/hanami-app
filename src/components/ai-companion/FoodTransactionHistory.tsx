'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { ClockIcon, PlusIcon, MinusIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  transaction_type: 'earn' | 'spend' | 'monthly_allowance' | 'purchase';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface FoodTransactionHistoryProps {
  userId: string;
  limit?: number;
  className?: string;
}

export function FoodTransactionHistory({ 
  userId, 
  limit = 10,
  className = '' 
}: FoodTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all');
  
  const loadTransactions = async () => {
    setLoading(true);
    
    try {
      const supabase = getSaasSupabaseClient();
      let query = supabase
        .from('food_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // 根據篩選器調整查詢
      if (filter === 'earn') {
        query = query.in('transaction_type', ['earn', 'monthly_allowance', 'purchase']);
      } else if (filter === 'spend') {
        query = query.eq('transaction_type', 'spend');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error('載入交易記錄錯誤:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (userId) {
      loadTransactions();
    }
  }, [userId, filter, limit]);
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'spend':
        return <MinusIcon className="w-5 h-5 text-red-500" />;
      case 'earn':
      case 'monthly_allowance':
      case 'purchase':
        return <PlusIcon className="w-5 h-5 text-green-500" />;
      default:
        return <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const getTransactionLabel = (type: string) => {
    const labels = {
      'earn': '獲得',
      'spend': '消耗',
      'monthly_allowance': '月度配額',
      'purchase': '購買'
    };
    return labels[type as keyof typeof labels] || type;
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* 標題和篩選器 */}
      <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] p-4">
        <h3 className="text-lg font-bold text-[#4B4036] mb-3">📊 交易記錄</h3>
        
        <div className="flex space-x-2">
          {[
            { value: 'all', label: '全部' },
            { value: 'earn', label: '收入' },
            { value: 'spend', label: '支出' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value as any)}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-white text-[#4B4036] shadow-md'
                  : 'bg-white/50 text-[#4B4036]/70 hover:bg-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 交易列表 */}
      <div className="divide-y divide-gray-100">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暫無交易記錄</p>
          </div>
        ) : (
          transactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* 圖標 */}
                  <div className={`p-2 rounded-lg ${
                    tx.transaction_type === 'spend' 
                      ? 'bg-red-50' 
                      : 'bg-green-50'
                  }`}>
                    {getTransactionIcon(tx.transaction_type)}
                  </div>
                  
                  {/* 資訊 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {getTransactionLabel(tx.transaction_type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(tx.created_at)}
                      </span>
                    </div>
                    
                    {tx.description && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {tx.description}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-1">
                      餘額: {tx.balance_after.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* 金額 */}
                <div className={`text-right ${
                  tx.transaction_type === 'spend' 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  <div className="text-lg font-bold">
                    {tx.transaction_type === 'spend' ? '-' : '+'}{tx.amount.toLocaleString()}
                  </div>
                  <div className="text-xs opacity-70">食量</div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* 底部提示 */}
      {transactions.length > 0 && transactions.length >= limit && (
        <div className="p-3 bg-gray-50 text-center">
          <button
            onClick={loadTransactions}
            className="text-sm text-[#FFB88C] hover:underline"
          >
            查看更多記錄
          </button>
        </div>
      )}
    </div>
  );
}


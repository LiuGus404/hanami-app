'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CurrencyDollarIcon,
  PlusIcon,
  MinusIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useHanamiEcho } from '@/hooks/useHanamiEcho';
import { HanamiButton } from '@/components/ui/HanamiButton';

interface FoodBalanceDisplayProps {
  userId: string;
  compact?: boolean;
  showPurchaseButton?: boolean;
  onPurchaseClick?: () => void;
}

export function FoodBalanceDisplay({ 
  userId, 
  compact = false, 
  showPurchaseButton = true,
  onPurchaseClick 
}: FoodBalanceDisplayProps) {
  const { 
    foodBalance, 
    recentTransactions, 
    isLoading, 
    error,
    balancePercentage 
  } = useHanamiEcho(userId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-[#EADBC8]">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <p className="text-red-600 text-sm">載入食量餘額失敗: {error}</p>
      </div>
    );
  }

  if (!foodBalance) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <p className="text-yellow-600 text-sm">尚未初始化食量餘額</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <span className="text-lg">🍎</span>
          <span className="font-semibold text-[#4B4036]">
            {foodBalance.current_balance}
          </span>
        </div>
        {balancePercentage < 20 && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-4 shadow-sm border border-[#EADBC8]"
    >
      {/* 標題 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🍎</span>
          <h3 className="text-lg font-semibold text-[#4B4036]">食量餘額</h3>
        </div>
        {showPurchaseButton && (
          <HanamiButton
            variant="cute"
            size="sm"
            onClick={onPurchaseClick}
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            購買
          </HanamiButton>
        )}
      </div>

      {/* 餘額顯示 */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2 mb-2">
          <span className="text-3xl font-bold text-[#FFD59A]">
            {foodBalance.current_balance}
          </span>
          <span className="text-sm text-[#2B3A3B]">食量</span>
        </div>

        {/* 進度條 */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <motion.div
            className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(balancePercentage, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex justify-between text-xs text-[#2B3A3B]">
          <span>已使用: {foodBalance.total_spent}</span>
          <span>配額: {foodBalance.monthly_allowance}</span>
        </div>
      </div>

      {/* 統計信息 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <ChartBarIcon className="w-4 h-4 text-[#4B4036]" />
            <span className="text-sm font-medium text-[#4B4036]">今日使用</span>
          </div>
          <span className="text-lg font-semibold text-[#FFD59A]">
            {foodBalance.daily_usage}
          </span>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <ClockIcon className="w-4 h-4 text-[#4B4036]" />
            <span className="text-sm font-medium text-[#4B4036]">本月使用</span>
          </div>
          <span className="text-lg font-semibold text-[#FFD59A]">
            {foodBalance.monthly_usage}
          </span>
        </div>
      </div>

      {/* 最近交易 */}
      {recentTransactions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#4B4036] mb-2">最近交易</h4>
          <div className="space-y-2">
            {recentTransactions.slice(0, 3).map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center space-x-2">
                  {transaction.transaction_type === 'spend' ? (
                    <MinusIcon className="w-4 h-4 text-red-500" />
                  ) : (
                    <PlusIcon className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-[#2B3A3B]">
                    {transaction.description || transaction.transaction_type}
                  </span>
                </div>
                <span className={`font-medium ${
                  transaction.transaction_type === 'spend' 
                    ? 'text-red-500' 
                    : 'text-green-500'
                }`}>
                  {transaction.transaction_type === 'spend' ? '-' : '+'}
                  {Math.abs(transaction.amount)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 低餘額警告 */}
      {balancePercentage < 20 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-yellow-700">
              食量餘額不足，建議購買更多食量
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

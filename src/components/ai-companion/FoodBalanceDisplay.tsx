'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { motion } from 'framer-motion';
import { Popover, Transition } from '@headlessui/react';
import { useHanamiEcho } from '@/hooks/useHanamiEcho';

interface FoodBalanceDisplayProps {
  userId: string;
  className?: string;
}

export function FoodBalanceDisplay({ userId, className = '' }: FoodBalanceDisplayProps) {
  const { foodBalance, recentTransactions, isLoading, error } = useHanamiEcho(userId);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (foodBalance) {
      setBalance(foodBalance.current_balance);
    }
  }, [foodBalance]);

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
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            as={motion.button}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`relative flex items-center space-x-2 bg-white rounded-2xl px-3 py-2 shadow-sm hover:shadow-md transition-all border border-gray-100 outline-none focus:ring-2 focus:ring-[#8BC34A] focus:ring-opacity-50 ${className}`}
            title="查看食量記錄"
          >
            {/* 蘋果圖標 */}
            <div className="w-5 h-5 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
                {/* 葉子 */}
                <ellipse cx="55" cy="15" rx="12" ry="8" fill="#8BC34A" transform="rotate(-20 55 15)" />
                <path d="M 55 15 Q 50 20, 50 28" stroke="#6D4C41" strokeWidth="2" fill="none" />

                {/* 蘋果主體 - 漸層 */}
                <defs>
                  <radialGradient id="appleGradientHorizontal" cx="40%" cy="40%">
                    <stop offset="0%" style={{ stopColor: '#FF7043', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#EF5350', stopOpacity: 1 }} />
                  </radialGradient>
                </defs>

                <circle cx="50" cy="55" r="32" fill="url(#appleGradientHorizontal)" />

                {/* 高光 */}
                <ellipse cx="38" cy="42" rx="12" ry="16" fill="white" opacity="0.4" />
                <ellipse cx="35" cy="45" rx="6" ry="8" fill="white" opacity="0.6" />

                {/* 小星星裝飾 */}
                <circle cx="65" cy="48" r="1.5" fill="white" opacity="0.8" />
                <circle cx="70" cy="60" r="1.5" fill="white" opacity="0.8" />
                <circle cx="58" cy="72" r="1.5" fill="white" opacity="0.8" />
              </svg>
            </div>

            {/* 餘額數字 */}
            <div className="text-sm font-semibold text-gray-700">
              {isLoading ? (
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
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-xl bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-sm font-medium text-gray-500">當前食量</span>
                  <span className="text-lg font-bold text-[#FF7043]">{balance}</span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">最近記錄</div>
                  {recentTransactions && recentTransactions.length > 0 ? (
                    <div className="flex flex-col space-y-2">
                      {recentTransactions.slice(0, 5).map((tx) => {
                        const isExpense = tx.amount < 0 || (tx.description && tx.description.toLowerCase().includes('spend')) || (tx.transaction_type === 'usage');
                        const displayAmount = isExpense ? -Math.abs(tx.amount) : Math.abs(tx.amount);

                        // Format description
                        let displayDesc = tx.description || '交易';
                        if (displayDesc.includes('mori-researcher')) displayDesc = 'Mori 思考消耗';
                        else if (displayDesc.includes('hibi-manager')) displayDesc = 'Hibi 思考消耗';
                        else if (displayDesc.includes('pico-artist')) displayDesc = 'Pico 思考消耗';
                        else if (displayDesc.includes('initial_grant')) displayDesc = '初始贈送';
                        else if (displayDesc.includes('purchase')) displayDesc = '購買食量';
                        else if (displayDesc.includes('LLM spend')) displayDesc = 'AI 思考消耗';

                        return (
                          <div key={tx.id} className="flex justify-between items-start text-xs group hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                            <div className="flex flex-col space-y-0.5">
                              <span className="text-gray-700 font-medium truncate max-w-[140px]" title={tx.description || '交易'}>
                                {displayDesc}
                              </span>
                              <span className="text-gray-400 text-[10px]">
                                {new Date(tx.created_at).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className={`font-mono font-medium ${displayAmount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {displayAmount > 0 ? '+' : ''}{displayAmount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-gray-400 bg-gray-50 rounded-lg">
                      尚無交易記錄
                    </div>
                  )}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}

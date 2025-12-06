'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { motion } from 'framer-motion';
import { Popover, Transition } from '@headlessui/react';
import { useHanamiEcho } from '@/hooks/useHanamiEcho';
import {
  SparklesIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

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
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`relative flex items-center space-x-2 bg-white/60 backdrop-blur-md rounded-2xl px-3 py-2 shadow-sm hover:shadow-md transition-all border border-stone-200/50 outline-none focus:ring-2 focus:ring-[#8BC34A] focus:ring-opacity-50 group ${className}`}
            title="查看食量記錄"
          >
            {/* 蘋果圖標 */}
            <div className="w-5 h-5 flex-shrink-0 drop-shadow-sm group-hover:drop-shadow-md transition-all">
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
            <div className="text-sm font-semibold text-stone-600 group-hover:text-stone-800 transition-colors">
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
            enterFrom="opacity-0 translate-y-2 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-2 scale-95"
          >
            <Popover.Panel className="absolute right-0 z-50 mt-3 w-80 origin-top-right rounded-2xl bg-white/90 backdrop-blur-xl p-5 shadow-xl ring-1 ring-black/5 focus:outline-none border border-white/50">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <span className="text-sm font-medium text-stone-500">當前食量</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-[#FF7043] bg-clip-text text-transparent bg-gradient-to-br from-[#FF7043] to-[#EF5350]">{balance}</span>
                    <span className="text-xs text-stone-400">pts</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">最近記錄</div>
                    <button
                      onClick={() => { useHanamiEcho(userId).loadRecentTransactions() }}
                      className="text-[10px] text-stone-400 hover:text-[#8BC34A] transition-colors flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.433l-.31-.31a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.312h-2.433a.75.75 0 000 1.5h4.242z" clipRule="evenodd" />
                      </svg>
                      刷新
                    </button>
                  </div>

                  {recentTransactions && recentTransactions.length > 0 ? (
                    <div className="flex flex-col space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
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


                        // Decide Icon
                        let Icon = SparklesIcon;
                        let iconColor = 'text-stone-400';
                        let bgColor = 'bg-stone-50';
                        let borderColor = 'border-stone-100';

                        if (displayDesc.includes('Mori')) {
                          Icon = AcademicCapIcon;
                          iconColor = 'text-amber-500';
                          bgColor = 'bg-amber-50';
                          borderColor = 'border-amber-100';
                        } else if (displayDesc.includes('Hibi')) {
                          Icon = CpuChipIcon;
                          iconColor = 'text-orange-500';
                          bgColor = 'bg-orange-50';
                          borderColor = 'border-orange-100';
                        } else if (displayDesc.includes('Pico')) {
                          Icon = PaintBrushIcon;
                          iconColor = 'text-blue-500';
                          bgColor = 'bg-blue-50';
                          borderColor = 'border-blue-100';
                        } else if (displayDesc.includes('購買')) {
                          Icon = ShoppingBagIcon;
                          iconColor = 'text-green-500';
                          bgColor = 'bg-green-50';
                          borderColor = 'border-green-100';
                        }

                        return (
                          <div key={tx.id} className="flex justify-between items-center text-xs group hover:bg-stone-50 p-2 rounded-xl transition-all border border-transparent hover:border-stone-100">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${bgColor} ${borderColor} border flex items-center justify-center shadow-sm`}>
                                <Icon className={`w-4 h-4 ${iconColor}`} />
                              </div>
                              <div className="flex flex-col space-y-0.5">
                                <span className="text-stone-700 font-medium truncate max-w-[120px]" title={tx.description || '交易'}>
                                  {displayDesc}
                                </span>
                                <span className="text-stone-400 text-[10px]">
                                  {new Date(tx.created_at).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <span className={`font-mono font-medium ${displayAmount > 0 ? 'text-green-600 bg-green-50 px-2 py-0.5 rounded-md' : 'text-red-500 bg-red-50 px-2 py-0.5 rounded-md'}`}>
                              {displayAmount > 0 ? '+' : ''}{displayAmount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-stone-400 bg-stone-50/50 rounded-xl border border-stone-100 border-dashed">
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

'use client';

import React from 'react';
import { HanamiCard, HanamiButton, HanamiInput } from './index';
import AccountIcon from './AccountIcon';
import Link from 'next/link';

interface HanamiLoginFormProps {
  userType: 'admin' | 'teacher' | 'parent';
  onSubmit: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  title?: string;
  subtitle?: string;
  onBackToHome?: () => void;
}

export default function HanamiLoginForm({
  userType,
  onSubmit,
  loading = false,
  error = '',
  title,
  subtitle,
  onBackToHome
}: HanamiLoginFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  const getDefaultTitle = () => {
    switch (userType) {
      case 'admin':
        return 'Hanami 管理登入';
      case 'teacher':
        return '老師登入';
      case 'parent':
        return '家長登入';
      default:
        return '登入';
    }
  };

  const getDefaultSubtitle = () => {
    switch (userType) {
      case 'admin':
        return '管理系統';
      case 'teacher':
        return '歡迎回到 Hanami 音樂';
      case 'parent':
        return '查看孩子的學習進度';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <HanamiCard className="text-center">
          {/* Logo 和標題 */}
          <div className="mb-6">
            <AccountIcon 
              type={userType} 
              size="lg" 
              className="mx-auto mb-4" 
            />
            <h1 className="text-xl font-bold text-brown-700 mb-2">
              {title || getDefaultTitle()}
            </h1>
            <p className="text-sm text-brown-500">
              {subtitle || getDefaultSubtitle()}
            </p>
          </div>

          {/* 登入表單 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#FFE0E0] border border-[#FF6B6B] text-[#A64B2A] px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-brown-700 text-left">
                {userType === 'admin' ? '管理員帳號' : '電子郵件地址'}
              </label>
              <input
                type="email"
                placeholder={userType === 'admin' ? '請輸入管理員帳號' : '請輸入您的電子郵件'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-brown-700 placeholder-brown-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-brown-700 text-left">
                密碼
              </label>
              <input
                type="password"
                placeholder="請輸入您的密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-brown-700 placeholder-brown-400"
              />
            </div>

            <HanamiButton
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? '登入中...' : '登入'}
            </HanamiButton>
          </form>

          {/* 註冊按鈕 */}
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <p className="text-sm text-brown-600 mb-3">
                還沒有帳號？{' '}
                <Link href="/register" className="font-medium text-brown-700 hover:text-brown-800 underline">
                  立即註冊
                </Link>
              </p>
            </div>
          </div>

          {/* 返回首頁 */}
          {onBackToHome && (
            <div className="mt-4">
              <button
                onClick={onBackToHome}
                className="text-brown-600 hover:text-brown-700 text-sm transition-colors"
              >
                ← 返回首頁
              </button>
            </div>
          )}

          {/* 幫助信息 */}
          <div className="mt-6 p-4 bg-[#F9F2EF] rounded-xl">
            <h3 className="text-sm font-semibold text-brown-700 mb-2">需要幫助？</h3>
            <p className="text-xs text-brown-500">
              如果您忘記密碼或遇到登入問題，請聯繫管理員協助處理。
            </p>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 
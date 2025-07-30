'use client';

import Link from 'next/link';
import React from 'react';

import AccountIcon from './AccountIcon';

import { HanamiCard, HanamiButton, HanamiInput } from './index';

interface HanamiLoginFormProps {
  onSubmit: (email: string, password: string, captchaAnswer?: string) => void;
  loading?: boolean;
  error?: string;
  onBackToHome?: () => void;
  captchaImage?: string;
  captchaAnswer?: string;
  onCaptchaAnswerChange?: (value: string) => void;
  onRegenerateCaptcha?: () => void;
}

export default function HanamiLoginForm({
  onSubmit,
  loading = false,
  error,
  onBackToHome,
  captchaImage,
  captchaAnswer,
  onCaptchaAnswerChange,
  onRegenerateCaptcha
}: HanamiLoginFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password, captchaAnswer);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-quicksand flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <HanamiCard className="text-center">
          {/* Logo 和標題 */}
          <div className="mb-6">
            <AccountIcon 
              className="mx-auto mb-4" 
              size="lg" 
              type="admin" 
            />
            <h1 className="text-xl font-bold text-brown-700 mb-2">
              登入
            </h1>
            <p className="text-sm text-brown-500">
              歡迎回到 Hanami 音樂教育系統
            </p>
          </div>

          {/* 登入表單 */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-[#FFE0E0] border border-[#FF6B6B] text-[#A64B2A] px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-brown-700 text-left">
                帳號
              </label>
              <input
                required
                className="w-full px-4 py-3 border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-brown-700 placeholder-brown-400"
                placeholder="請輸入帳號"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-brown-700 text-left">
                密碼
              </label>
              <input
                required
                className="w-full px-4 py-3 border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] bg-white text-brown-700 placeholder-brown-400"
                placeholder="請輸入您的密碼"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* 人機驗證 */}
            {captchaImage && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-brown-700">
                  🔒 人機驗證（防止機器人提交）
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="relative overflow-hidden rounded-lg border-2 border-[#EADBC8] bg-gradient-to-br from-[#FFF9F2] to-[#FFE0E0] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#EBC9A4]">
                      <img 
                        alt="驗證碼" 
                        className="block w-[200px] h-[60px] object-cover transition-transform duration-300 group-hover:scale-105" 
                        src={captchaImage}
                      />
                      {/* 動畫裝飾元素 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                    </div>
                    {onRegenerateCaptcha && (
                      <button
                        className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#FFB84C] to-[#FFA726] text-white rounded-full text-sm flex items-center justify-center hover:from-[#FFA726] hover:to-[#FF9800] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95"
                        title="重新生成驗證碼"
                        type="button"
                        onClick={onRegenerateCaptcha}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      className="w-full border-2 border-[#EADBC8] rounded-lg px-4 py-3 bg-white text-brown-700 uppercase font-medium tracking-wider transition-all duration-300 focus:border-[#EBC9A4] focus:ring-2 focus:ring-[#EBC9A4]/20 focus:outline-none placeholder-brown-400"
                      maxLength={4}
                      placeholder="請輸入驗證碼"
                      type="text"
                      value={captchaAnswer}
                      onChange={(e) => onCaptchaAnswerChange?.(e.target.value)}
                    />
                    {/* 輸入框裝飾 */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-brown-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#EBC9A4] rounded-full animate-pulse"></div>
                    <span>請輸入上方圖片中的驗證碼（不區分大小寫）</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#FFB6C1] rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <span>以證明您是真人</span>
                  </div>
                </div>
              </div>
            )}

            <HanamiButton
              className="w-full"
              disabled={loading}
              type="submit"
              variant="primary"
            >
              {loading ? '登入中...' : '登入'}
            </HanamiButton>
          </form>

          {/* 返回首頁按鈕 */}
          <div className="mt-6">
            {onBackToHome ? (
              <HanamiButton onClick={onBackToHome} className="w-full" variant="secondary">
                返回首頁
              </HanamiButton>
            ) : (
              <Link href="/">
                <button
                  type="button"
                  className="w-full py-2 px-4 rounded-xl bg-[#FFD59A] text-brown-700 font-semibold hover:bg-[#FFB6C1] transition-colors"
                >
                  返回首頁
                </button>
              </Link>
            )}
          </div>

          {/* 註冊按鈕 */}
          <div className="mt-6 space-y-3">
            <div className="text-center">
              <p className="text-sm text-brown-600 mb-3">
                還沒有帳號？{' '}
                <Link className="font-medium text-brown-700 hover:text-brown-800 underline" href="/register">
                  立即註冊
                </Link>
              </p>
            </div>
          </div>

          {/* 返回首頁 */}
          {onBackToHome && (
            <div className="mt-4">
              <button
                className="text-brown-600 hover:text-brown-700 text-sm transition-colors"
                onClick={onBackToHome}
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
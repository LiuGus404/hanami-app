'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HomeIcon } from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import TurnstileWidget from '@/components/ui/TurnstileWidget';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, user, loading } = useSaasAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  // 檢查是否為開發環境
  const isDevelopment = process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  // 監聽用戶登入狀態，自動重定向
  useEffect(() => {
    // 檢查是否正在登出過程中（通過檢查 localStorage 中是否還有會話數據）
    const hasSessionData = localStorage.getItem('saas_user_session');

    if (!loading && user && hasSessionData) {
      const redirectTo = searchParams.get('redirect') || '/aihome/dashboard';
      const currentPath = window.location.pathname;

      // 如果當前已經在目標頁面，不要重定向
      if (currentPath === redirectTo) {
        return;
      }

      // 延遲重定向，確保登出過程完成
      setTimeout(() => {
        router.push(redirectTo);
      }, 200);
    }
  }, [user, loading, searchParams, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Turnstile 驗證處理
  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setTurnstileError(null);
    console.log('Turnstile 驗證成功:', token.substring(0, 20) + '...');
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setTurnstileError('驗證失敗，請重試');
    toast.error('驗證失敗，請重新驗證');
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
    setTurnstileError('驗證已過期，請重新驗證');
    toast.error('驗證已過期，請重新驗證');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本驗證
    if (!formData.email || !formData.password) {
      toast.error('請填寫所有必要欄位');
      return;
    }

    // Turnstile 驗證檢查 (開發環境跳過)
    if (!isDevelopment && !turnstileToken) {
      setTurnstileError('請完成安全驗證');
      toast.error('請完成安全驗證後再登入');
      return;
    }

    setIsLoading(true);

    try {
      // 可選：後端驗證 Turnstile token
      if (process.env.NODE_ENV === 'production') {
        try {
          const verifyResponse = await fetch('/api/verify-turnstile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: turnstileToken }),
          });

          const verifyResult = await verifyResponse.json();

          if (!verifyResult.success) {
            toast.error('安全驗證失敗，請重試');
            setTurnstileToken(null);
            return;
          }

          console.log('Turnstile 後端驗證成功');
        } catch (verifyError) {
          console.error('Turnstile 後端驗證錯誤:', verifyError);
          // 在開發環境中，如果後端驗證失敗，仍然允許登入
          if (process.env.NODE_ENV === 'production') {
            toast.error('安全驗證失敗，請重試');
            setTurnstileToken(null);
            return;
          }
        }
      }

      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success('登入成功！');
        // 清除 Turnstile token
        setTurnstileToken(null);

        const redirectTo = searchParams.get('redirect') || '/aihome/dashboard';
        console.log('登入成功，準備跳轉到:', redirectTo);

        // 使用 router.push 進行跳轉
        console.log('執行跳轉到:', redirectTo);
        router.push(redirectTo);
      } else {
        toast.error(result.error || '登入失敗');
        // 登入失敗時清除 Turnstile token，讓用戶重新驗證
        setTurnstileToken(null);
      }

    } catch (error) {
      console.error('登入錯誤:', error);
      toast.error('登入過程中發生錯誤');
      // 發生錯誤時清除 Turnstile token
      setTurnstileToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 顯示載入狀態
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">{loading ? '檢查認證狀態...' : '登入中...'}</p>
        </div>
      </div>
    );
  }

  // 如果已經登入，不顯示登入頁面
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">已登入，正在跳轉...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <HanamiCard className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <img
                src="/@hanami.png"
                alt="HanamiEcho Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-[#4B4036] mb-2">
              歡迎回來
            </h1>
            <p className="text-[#2B3A3B]">
              登入您的 HanamiEcho 帳戶
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={() => loginWithGoogle()}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#EADBC8] rounded-xl hover:bg-[#FFF9F2] transition-colors duration-200 bg-white"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-[#4B4036] font-medium">使用 Google 帳號登入</span>
            </button>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#EADBC8]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#4B4036]">或者</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#4B4036] mb-2">
                電子郵件
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="請輸入您的電子郵件"
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 bg-white/50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#4B4036] mb-2">
                密碼
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="請輸入您的密碼"
                  className="w-full px-4 py-3 pr-12 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 bg-white/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/aihome/auth/forgot-password')}
                className="text-sm text-[#4B4036] hover:text-[#2B3A3B] font-medium transition-colors"
              >
                忘記密碼？
              </button>
            </div>

            {/* Turnstile 安全驗證 (開發環境隱藏) */}
            {!isDevelopment && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4B4036]">
                  安全驗證
                </label>
                <TurnstileWidget
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                  className="flex justify-center"
                />
                {turnstileError && (
                  <p className="text-sm text-red-500 text-center">{turnstileError}</p>
                )}
              </div>
            )}

            {/* 開發環境提示 */}
            {isDevelopment && (
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-blue-600">
                    🚀 開發模式：已跳過 Turnstile 驗證
                  </p>
                </div>
              </div>
            )}

            <HanamiButton
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || (!isDevelopment && !turnstileToken)}
            >
              {isLoading ? '登入中...' : '登入'}
            </HanamiButton>
          </form>


          <div className="mt-6 text-center space-y-4">
            <p className="text-[#2B3A3B]">
              還沒有帳戶？{' '}
              <button
                onClick={() => router.push('/aihome/auth/register')}
                className="text-[#4B4036] hover:text-[#2B3A3B] font-medium transition-colors"
              >
                立即註冊
              </button>
            </p>

            <motion.button
              onClick={() => router.push('/aihome')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200 mx-auto"
            >
              <HomeIcon className="w-4 h-4" />
              <span>返回主頁</span>
            </motion.button>
          </div>
        </HanamiCard>
      </motion.div>
    </div>
  );
}
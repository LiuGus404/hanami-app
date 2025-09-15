'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HomeIcon } from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading } = useSaasAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 暫時完全禁用重定向邏輯，用於調試
  // useEffect(() => {
  //   if (!loading && user) {
  //     const redirectTo = searchParams.get('redirect') || '/aihome/dashboard';
  //     const currentPath = window.location.pathname;
      
  //     console.log('用戶已登入，當前路徑:', currentPath, '重定向到:', redirectTo);
      
  //     // 如果當前已經在目標頁面，不要重定向
  //     if (currentPath === redirectTo) {
  //       console.log('已經在目標頁面，跳過重定向');
  //       return;
  //     }
      
  //     // 使用 router.push 而不是 window.location.href 來避免頁面重新載入
  //     const timer = setTimeout(() => {
  //       console.log('執行重定向到:', redirectTo);
  //       router.push(redirectTo);
  //     }, 500); // 減少延遲時間
      
  //     return () => clearTimeout(timer);
  //   }
  // }, [user, loading, searchParams, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('請填寫所有必要欄位');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('登入成功！');
        
        const redirectTo = searchParams.get('redirect') || '/aihome/dashboard';
        console.log('登入成功，準備跳轉到:', redirectTo);
        
        // 使用 window.location.href 強制跳轉，避免中間件阻止
        setTimeout(() => {
          console.log('執行跳轉到:', redirectTo);
          window.location.href = redirectTo;
        }, 100);
      } else {
        toast.error(result.error || '登入失敗');
      }
      
    } catch (error) {
      console.error('登入錯誤:', error);
      toast.error('登入過程中發生錯誤');
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

            <HanamiButton
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
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
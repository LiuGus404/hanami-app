'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import HanamiEchoLogo from '@/components/ui/HanamiEchoLogo';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { CountrySelector } from '@/components/ui/CountrySelector';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, loginWithGoogle, loginWithApple } = useSaasAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    phone: '',
    countryCode: '+852',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 限制電話號碼只能輸入數字，最多8位
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
  };

  // 處理國家代碼變化
  const handleCountryChange = (dialCode: string) => {
    setFormData(prev => ({
      ...prev,
      countryCode: dialCode
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('密碼確認不匹配');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('密碼至少需要 8 個字符');
      return;
    }

    if (formData.phone.length !== 8) {
      toast.error('請輸入完整的 8 位電話號碼');
      return;
    }

    setIsLoading(true);

    try {
      // 使用完整的電話號碼（包含國家代碼）
      const fullPhone = `${formData.countryCode}${formData.phone}`;

      const result = await register(
        formData.email,
        formData.password,
        formData.nickname,
        fullPhone
      );

      if (result.success) {
        toast.success('註冊成功！請檢查您的郵箱並點擊驗證連結');
        router.push('/aihome/auth/email-sent');
      } else {
        toast.error(result.error || '註冊失敗');
      }
    } catch (error) {
      toast.error('註冊過程中發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* 返回首頁按鈕 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={() => router.push('/')}
          className="group flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white/50 hover:bg-white/80 border border-[#EADBC8] hover:border-[#FFD59A] transition-all duration-200 text-[#4B4036] hover:text-[#FFD59A]"
        >
          <HomeIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-medium">返回首頁</span>
        </motion.button>

        <HanamiCard className="p-8">
          <div className="text-center mb-8">
            <HanamiEchoLogo size="lg" className="mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-[#4B4036] mb-2">
              創建帳戶
            </h1>
            <p className="text-[#2B3A3B]">
              開始建立您的 HanamiEcho 帳戶
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
              <span className="text-[#4B4036] font-medium">使用 Google 帳號註冊</span>
            </button>

            <button
              onClick={() => loginWithApple()}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#EADBC8] rounded-xl hover:bg-[#FFF9F2] transition-colors duration-200 bg-white mt-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.37-1.62 1.71.12 3.03.84 3.84 2.04-3.18 1.97-2.65 6.19.64 7.61-.54 1.54-1.25 3.06-2.43 4.2zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-2.04 4.15-3.74 4.25z" />
              </svg>
              <span className="text-[#4B4036] font-medium">使用 Apple 帳號註冊</span>
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
              <label htmlFor="nickname" className="block text-sm font-medium text-[#4B4036] mb-2">
                暱稱
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                required
                placeholder="請輸入您的暱稱"
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 bg-white/50"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#4B4036] mb-2">
                電子郵箱
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="請輸入您的郵箱"
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 bg-white/50"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#4B4036] mb-2">
                電話號碼
              </label>
              <div className="flex gap-2">
                <CountrySelector
                  value={formData.countryCode}
                  onChange={handleCountryChange}
                  className="w-32"
                />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
                  placeholder="請輸入8位數字"
                  maxLength={8}
                  className="flex-1 px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 bg-white/50"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                請輸入8位數字電話號碼
              </p>
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
                  placeholder="請輸入密碼"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#4B4036] mb-2">
                確認密碼
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="請再次輸入密碼"
                  className="w-full px-4 py-3 pr-12 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 bg-white/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                >
                  {showConfirmPassword ? (
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
              {isLoading ? '註冊中...' : '創建帳戶'}
            </HanamiButton>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-[#4B4036]">
              已有帳戶？{' '}
              <button
                onClick={() => router.push('/aihome/auth/login')}
                className="text-[#FFD59A] hover:text-[#EBC9A4] font-medium transition-colors"
              >
                立即登入
              </button>
            </p>
            <p className="text-xs text-gray-500">
              註冊後將自動發送驗證郵件
            </p>
          </div>
        </HanamiCard>
      </motion.div>
    </div>
  );
}

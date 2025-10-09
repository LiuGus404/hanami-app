'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import HanamiEchoLogo from '@/components/ui/HanamiEchoLogo';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { CountrySelector } from '@/components/ui/CountrySelector';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useSaasAuth();
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

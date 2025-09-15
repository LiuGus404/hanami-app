'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiEchoLogo } from '@/components/ui/HanamiEchoLogo';
import toast from 'react-hot-toast';

export default function SimpleLoginPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await fetch('/aihome/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await response.json();
      console.log('登入響應:', data);

      if (data.success) {
        toast.success('登入成功！');
        router.push('/aihome/dashboard');
      } else {
        toast.error(data.error || '登入失敗');
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      toast.error('登入過程中發生錯誤');
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

          <div className="mt-6 text-center space-y-2">
            <p className="text-[#4B4036]">
              還沒有帳戶？{' '}
              <button
                onClick={() => router.push('/aihome/auth/register')}
                className="text-[#FFD59A] hover:text-[#EBC9A4] font-medium transition-colors"
              >
                立即註冊
              </button>
            </p>
            <p className="text-xs text-gray-500">
              測試版本 - 無需認證保護
            </p>
          </div>
        </HanamiCard>
      </motion.div>
    </div>
  );
}


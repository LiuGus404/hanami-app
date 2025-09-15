'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import HanamiEchoLogo from '@/components/ui/HanamiEchoLogo';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useSaasAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const sendEmailCode = async () => {
    if (!formData.email) {
      toast.error('請先輸入電子郵箱');
      return;
    }
    
    try {
      const response = await fetch('/aihome/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          type: 'email'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setEmailCodeSent(true);
      } else {
        toast.error(result.error || '發送驗證碼失敗');
      }
    } catch (error) {
      toast.error('發送驗證碼失敗');
    }
  };

  const sendPhoneCode = async () => {
    if (!formData.phone) {
      toast.error('請先輸入電話號碼');
      return;
    }
    
    try {
      const response = await fetch('/aihome/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          type: 'phone'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setPhoneCodeSent(true);
      } else {
        toast.error(result.error || '發送驗證碼失敗');
      }
    } catch (error) {
      toast.error('發送驗證碼失敗');
    }
  };

  const verifyEmailCode = async () => {
    if (!emailCode) {
      toast.error('請輸入驗證碼');
      return;
    }
    
    try {
      const response = await fetch('/aihome/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: emailCode,
          type: 'email'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setEmailVerified(true);
      } else {
        toast.error(result.error || '驗證碼錯誤');
      }
    } catch (error) {
      toast.error('驗證失敗');
    }
  };

  const verifyPhoneCode = async () => {
    if (!phoneCode) {
      toast.error('請輸入驗證碼');
      return;
    }
    
    try {
      const response = await fetch('/aihome/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          code: phoneCode,
          type: 'phone'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setPhoneVerified(true);
      } else {
        toast.error(result.error || '驗證碼錯誤');
      }
    } catch (error) {
      toast.error('驗證失敗');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailVerified) {
      toast.error('請先驗證您的電子郵箱');
      return;
    }

    if (!phoneVerified) {
      toast.error('請先驗證您的電話號碼');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('密碼確認不匹配');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('密碼至少需要 6 個字符');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await register(formData.email, formData.password, formData.nickname);
      
      if (result.success) {
        toast.success('註冊成功！歡迎加入 HanamiEcho');
        router.push('/aihome/dashboard');
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
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <HanamiEchoLogo size="lg" />
        </div>

        <HanamiCard className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#4B4036] mb-2">
              創建 HanamiEcho 帳戶
            </h1>
            <p className="text-[#2B3A3B]">
              開始建立您的智能伙伴
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-colors"
                placeholder="請輸入您的暱稱"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#4B4036] mb-2">
                電子郵箱
                {emailVerified && <CheckCircleIcon className="w-4 h-4 inline ml-2 text-green-500" />}
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={emailVerified}
                  className="flex-1 px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-colors disabled:bg-gray-100"
                  placeholder="請輸入您的郵箱"
                />
                {!emailVerified && (
                  <HanamiButton
                    type="button"
                    onClick={sendEmailCode}
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {emailCodeSent ? '重新發送' : '發送驗證碼'}
                  </HanamiButton>
                )}
              </div>
              {emailCodeSent && !emailVerified && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    className="flex-1 px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-colors"
                    placeholder="請輸入驗證碼"
                    maxLength={6}
                  />
                  <HanamiButton
                    type="button"
                    onClick={verifyEmailCode}
                    variant="primary"
                    size="sm"
                  >
                    驗證
                  </HanamiButton>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#4B4036] mb-2">
                電話號碼
                {phoneVerified && <CheckCircleIcon className="w-4 h-4 inline ml-2 text-green-500" />}
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  disabled={phoneVerified}
                  className="flex-1 px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-colors disabled:bg-gray-100"
                  placeholder="請輸入您的電話號碼"
                />
                {!phoneVerified && (
                  <HanamiButton
                    type="button"
                    onClick={sendPhoneCode}
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {phoneCodeSent ? '重新發送' : '發送驗證碼'}
                  </HanamiButton>
                )}
              </div>
              {phoneCodeSent && !phoneVerified && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="flex-1 px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-colors"
                    placeholder="請輸入驗證碼"
                    maxLength={6}
                  />
                  <HanamiButton
                    type="button"
                    onClick={verifyPhoneCode}
                    variant="primary"
                    size="sm"
                  >
                    驗證
                  </HanamiButton>
                </div>
              )}
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
                  className="w-full px-4 py-3 pr-12 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-colors"
                  placeholder="請輸入密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4B4036] hover:text-[#2B3A3B]"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
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
                  className="w-full px-4 py-3 pr-12 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-colors"
                  placeholder="請再次輸入密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4B4036] hover:text-[#2B3A3B]"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <HanamiButton
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !emailVerified || !phoneVerified}
            >
              {isLoading ? '註冊中...' : 
               !emailVerified ? '請先驗證郵箱' :
               !phoneVerified ? '請先驗證電話' : '創建帳戶'}
            </HanamiButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#4B4036]">
              已有帳戶？{' '}
              <button
                onClick={() => router.push('/aihome/auth/login')}
                className="text-[#FFD59A] hover:text-[#EBC9A4] font-medium transition-colors"
              >
                立即登入
              </button>
            </p>
          </div>
        </HanamiCard>
      </motion.div>
    </div>
  );
}

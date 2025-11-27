'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function EmailSentPage() {
  const router = useRouter();
  const { resendVerificationEmail } = useSaasAuth();
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');

  // 嘗試從 URL 參數獲取 email (如果有傳遞的話)
  // 這裡假設註冊成功後可能會將 email 傳遞過來，或者讓用戶自己輸入
  // 為了簡化，這裡添加一個輸入框讓用戶輸入 email 如果需要重發

  const handleResend = async () => {
    if (!email) {
      toast.error('請輸入您的電子郵件以重發驗證信');
      return;
    }

    setIsResending(true);
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        toast.success('驗證郵件已重新發送');
      } else {
        toast.error(result.error || '發送失敗');
      }
    } catch (error) {
      toast.error('發送失敗，請稍後再試');
    } finally {
      setIsResending(false);
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
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <img
              src="/@hanami.png"
              alt="HanamiEcho Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <HanamiCard className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center"
          >
            <EnvelopeIcon className="w-10 h-10 text-[#4B4036]" />
          </motion.div>

          <h1 className="text-2xl font-bold text-[#4B4036] mb-4">
            驗證郵件已發送
          </h1>

          <p className="text-[#2B3A3B] mb-6">
            我們已向您的郵箱發送了一封驗證郵件。請檢查您的收件箱（包括垃圾郵件文件夾），並點擊郵件中的驗證連結來完成註冊。
          </p>

          <div className="bg-[#FFF9F2] border border-[#EADBC8] rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-[#4B4036] mb-2">
              📧 下一步：
            </h3>
            <ol className="text-sm text-[#2B3A3B] text-left space-y-1">
              <li>1. 檢查您的郵箱</li>
              <li>2. 點擊驗證連結</li>
              <li>3. 開始使用 HanamiEcho</li>
            </ol>
          </div>

          <div className="space-y-3">
            <HanamiButton
              onClick={() => router.push('/aihome/auth/login')}
              className="w-full"
              size="lg"
            >
              返回登入
            </HanamiButton>

            <button
              onClick={() => router.push('/aihome')}
              className="w-full flex items-center justify-center text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              返回首頁
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            沒有收到郵件？請檢查垃圾郵件文件夾。
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-[#4B4036] mb-2">需要重新發送驗證信？</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="輸入您的電子郵件"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              />
              <button
                onClick={handleResend}
                disabled={isResending || !email}
                className="px-4 py-2 text-sm bg-white border border-[#EADBC8] text-[#4B4036] rounded-lg hover:bg-[#FFF9F2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? '發送中...' : '重發'}
              </button>
            </div>
          </div>
        </HanamiCard>
      </motion.div>
    </div>
  );
}


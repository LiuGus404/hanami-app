'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import toast from 'react-hot-toast';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationLink, setVerificationLink] = useState('');

  const handleSendVerification = async () => {
    if (!email) {
      toast.error('請輸入郵箱地址');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/aihome/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('郵件發送響應:', data);

      if (data.success) {
        if (data.verificationLink) {
          setVerificationLink(data.verificationLink);
          toast.success('驗證鏈接已生成，請查看下方鏈接');
        } else {
          toast.success('驗證郵件已發送，請檢查您的郵箱');
        }
      } else {
        toast.error(data.error || '發送失敗');
      }
    } catch (error) {
      console.error('發送郵件錯誤:', error);
      toast.error('發送過程中發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (verificationLink) {
      navigator.clipboard.writeText(verificationLink);
      toast.success('鏈接已複製到剪貼板');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center p-4">
      <HanamiCard className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-2">
            測試郵件發送
          </h1>
          <p className="text-[#2B3A3B]">
            測試 Supabase 郵件發送功能
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#4B4036] mb-2">
              郵箱地址
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="請輸入您的郵箱地址"
              className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 bg-white/50"
            />
          </div>

          <HanamiButton
            onClick={handleSendVerification}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? '發送中...' : '發送驗證郵件'}
          </HanamiButton>

          {verificationLink && (
            <div className="mt-4 p-4 bg-white/50 rounded-xl border border-[#EADBC8]">
              <h3 className="text-sm font-medium text-[#4B4036] mb-2">
                驗證鏈接：
              </h3>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={verificationLink}
                  readOnly
                  className="flex-1 px-3 py-2 text-xs bg-white border border-[#EADBC8] rounded-lg"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors text-sm"
                >
                  複製
                </button>
              </div>
              <p className="text-xs text-[#2B3A3B] mt-2">
                如果郵件沒有發送，請點擊上方鏈接進行驗證
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/aihome/dashboard'}
            className="text-[#4B4036] hover:text-[#2B3A3B] font-medium transition-colors"
          >
            返回儀表板
          </button>
        </div>
      </HanamiCard>
    </div>
  );
}


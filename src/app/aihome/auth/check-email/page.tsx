'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import {
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

export default function CheckEmailPage() {
  const router = useRouter();
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    setResending(true);
    // 這裡可以添加重新發送郵件的邏輯
    setTimeout(() => {
      setResending(false);
      alert('確認郵件已重新發送！');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <HanamiCard className="p-8 text-center">
          <div className="space-y-6">
            {/* 郵箱圖標 */}
            <div className="flex justify-center">
              <div className="relative">
                <EnvelopeIcon className="h-20 w-20 text-blue-500" />
                <ClockIcon className="h-8 w-8 text-orange-400 absolute -top-2 -right-2" />
              </div>
            </div>

            {/* 標題 */}
            <div>
              <h1 className="text-3xl font-bold text-[#4B4036] mb-2">
                請檢查您的郵箱
              </h1>
              <p className="text-lg text-[#2B3A3B]">
                我們已發送確認郵件到您的郵箱
              </p>
            </div>

            {/* 說明信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">下一步</span>
              </div>
              <ol className="text-blue-700 text-sm space-y-1 text-left">
                <li>1. 檢查您的郵箱收件箱</li>
                <li>2. 點擊郵件中的確認鏈接</li>
                <li>3. 完成郵箱驗證</li>
                <li>4. 開始使用 HanamiEcho</li>
              </ol>
            </div>

            {/* 注意事項 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">注意事項</h3>
              <ul className="text-yellow-700 text-sm space-y-1 text-left">
                <li>• 確認郵件可能需要幾分鐘才能到達</li>
                <li>• 請檢查垃圾郵件文件夾</li>
                <li>• 確認鏈接有效期為 24 小時</li>
                <li>• 如果沒有收到郵件，可以重新發送</li>
              </ul>
            </div>

            {/* 操作按鈕 */}
            <div className="space-y-3">
              <HanamiButton
                onClick={handleResendEmail}
                loading={resending}
                size="lg"
                variant="secondary"
                className="w-full"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                {resending ? '重新發送中...' : '重新發送確認郵件'}
              </HanamiButton>

              <HanamiButton
                onClick={() => router.push('/aihome/auth/login')}
                size="lg"
                className="w-full"
              >
                返回登入頁面
              </HanamiButton>
            </div>

            {/* 幫助信息 */}
            <div className="text-center space-y-4">
              <p className="text-sm text-[#2B3A3B]">
                遇到問題？{' '}
                <button
                  onClick={() => router.push('/aihome/email-setup-guide')}
                  className="text-[#FFD59A] hover:text-[#EBC9A4] font-semibold"
                >
                  查看幫助指南
                </button>
              </p>

              <button
                onClick={() => router.push('/')}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200 mx-auto"
              >
                <HomeIcon className="w-4 h-4" />
                <span>返回主頁</span>
              </button>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
}


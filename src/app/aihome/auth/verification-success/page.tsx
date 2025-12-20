'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import {
  CheckCircleIcon,
  EnvelopeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function VerificationSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 使用 setTimeout 來避免在渲染過程中調用 router.push
          setTimeout(() => {
            router.push('/aihome/dashboard');
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <HanamiCard className="p-8 text-center">
          <div className="space-y-6">
            {/* 成功圖標 */}
            <div className="flex justify-center">
              <div className="relative">
                <CheckCircleIcon className="h-20 w-20 text-green-500" />
                <SparklesIcon className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>

            {/* 成功標題 */}
            <div>
              <h1 className="text-3xl font-bold text-[#4B4036] mb-2">
                郵箱驗證成功！
              </h1>
              <p className="text-lg text-[#2B3A3B]">
                歡迎加入 HanamiEcho 大家庭
              </p>
            </div>

            {/* 成功信息 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <EnvelopeIcon className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">驗證完成</span>
              </div>
              <p className="text-green-700 text-sm">
                您的郵箱已成功驗證，現在可以享受 HanamiEcho 的所有功能了！
              </p>
            </div>

            {/* 功能介紹 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-[#4B4036]">您現在可以：</h3>
              <ul className="text-sm text-[#2B3A3B] space-y-1">
                <li>• 與 AI 角色互動學習</li>
                <li>• 享受個性化學習體驗</li>
                <li>• 探索豐富的教育內容</li>
                <li>• 使用家庭協作功能</li>
              </ul>
            </div>

            {/* 自動跳轉提示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                {countdown > 0 ? (
                  <>
                    將在 <span className="font-bold text-blue-800">{countdown}</span> 秒後自動跳轉到儀表板
                  </>
                ) : (
                  '正在跳轉...'
                )}
              </p>
            </div>

            {/* 手動跳轉按鈕 */}
            <div className="space-y-3">
              <HanamiButton
                onClick={() => router.push('/aihome/dashboard')}
                size="lg"
                className="w-full"
              >
                立即進入儀表板
              </HanamiButton>

              <HanamiButton
                onClick={() => router.push('/')}
                size="lg"
                variant="secondary"
                className="w-full"
              >
                返回首頁
              </HanamiButton>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
}
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserSession } from '@/lib/authUtils';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function UnauthorizedPage() {
  const router = useRouter();
  const userSession = getUserSession();

  useEffect(() => {
    // 如果沒有會話，重定向到首頁
    if (!userSession) {
      router.push('/');
      return;
    }
  }, [userSession, router]);

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    if (userSession) {
      switch (userSession.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'teacher':
          router.push('/teacher/dashboard');
          break;
        case 'parent':
          router.push('/parent/dashboard');
          break;
        default:
          router.push('/');
      }
    } else {
      router.push('/');
    }
  };

  const handleContactAdmin = () => {
    // 可以重定向到聯繫管理員頁面或發送郵件
    window.open('mailto:admin@hanami.com?subject=權限申請', '_blank');
  };

  if (!userSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFB6C1] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <HanamiCard className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-[#FFE0E0] rounded-full flex items-center justify-center">
            <svg 
              className="w-10 h-10 text-[#FF6B6B]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#4B4036] mb-2">
            權限不足
          </h1>
          <p className="text-[#2B3A3B] mb-4">
            抱歉，您沒有權限訪問此頁面。
          </p>
          <div className="bg-[#E0F2E0] border border-[#4CAF50] rounded-lg p-3 mb-6">
            <p className="text-sm text-[#2B3A3B]">
              <strong>當前用戶：</strong>{userSession.name}<br />
              <strong>角色：</strong>{userSession.role === 'admin' ? '管理員' : userSession.role === 'teacher' ? '教師' : '家長'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <HanamiButton
            onClick={handleGoBack}
            variant="primary"
            className="w-full"
          >
            返回上一頁
          </HanamiButton>

          <HanamiButton
            onClick={handleGoHome}
            variant="secondary"
            className="w-full"
          >
            回到首頁
          </HanamiButton>

          <HanamiButton
            onClick={handleContactAdmin}
            variant="soft"
            className="w-full"
          >
            聯繫管理員申請權限
          </HanamiButton>
        </div>

        <div className="mt-6 pt-4 border-t border-[#EADBC8]">
          <p className="text-xs text-[#2B3A3B] opacity-75">
            如果您認為這是一個錯誤，請聯繫系統管理員。
          </p>
        </div>
      </HanamiCard>
    </div>
  );
} 
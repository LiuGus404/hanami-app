'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserSession } from '@/lib/authUtils';

interface AutoRedirectProps {
  onLoading?: (loading: boolean) => void;
  onError?: (error: string | null) => void;
}

export default function AutoRedirect({ onLoading, onError }: AutoRedirectProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        onLoading?.(true);
        setIsChecking(true);

        // 檢查用戶會話
        const userSession = getUserSession();
        
        if (userSession && userSession.role && userSession.id) {
          console.log('🎯 發現已登入用戶:', userSession.role);
          
          // 根據角色跳轉到對應的儀表板
          switch (userSession.role) {
            case 'admin':
              console.log('🔄 跳轉到管理員儀表板');
              router.push('/admin');
              break;
            case 'teacher':
              console.log('🔄 跳轉到教師儀表板');
              router.push('/teacher/dashboard');
              break;
            case 'parent':
              console.log('🔄 跳轉到家長儀表板');
              router.push('/parent/dashboard');
              break;
            case 'student':
              console.log('🔄 跳轉到學生儀表板');
              router.push('/parent/dashboard'); // 學生通常使用家長儀表板
              break;
            default:
              console.log('❌ 未知角色:', userSession.role);
              onError?.('未知的用戶角色');
              router.push('/login');
          }
        } else {
          console.log('❌ 未找到有效會話，跳轉到登入頁面');
          router.push('/login');
        }
      } catch (error) {
        console.error('❌ 自動跳轉檢查錯誤:', error);
        onError?.('檢查登入狀態時發生錯誤');
        router.push('/login');
      } finally {
        setIsChecking(false);
        onLoading?.(false);
      }
    };

    checkAndRedirect();
  }, [router, onLoading, onError]);

  // 這個組件不渲染任何內容，只負責檢查和跳轉
  return null;
}

// Hook 版本，用於在組件中使用
export function useAutoRedirect() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const checkAndRedirect = async () => {
    try {
      setIsChecking(true);

      // 檢查用戶會話
      const userSession = getUserSession();
      
      if (userSession && userSession.role && userSession.id) {
        console.log('🎯 發現已登入用戶:', userSession.role);
        
        // 根據角色跳轉到對應的儀表板
        switch (userSession.role) {
          case 'admin':
            console.log('🔄 跳轉到管理員儀表板');
            router.push('/admin');
            break;
          case 'teacher':
            console.log('🔄 跳轉到教師儀表板');
            router.push('/teacher/dashboard');
            break;
          case 'parent':
            console.log('🔄 跳轉到家長儀表板');
            router.push('/parent/dashboard');
            break;
          case 'student':
            console.log('🔄 跳轉到學生儀表板');
            router.push('/parent/dashboard'); // 學生通常使用家長儀表板
            break;
          default:
            console.log('❌ 未知角色:', userSession.role);
            router.push('/login');
        }
        return true; // 表示已跳轉
      } else {
        console.log('❌ 未找到有效會話，跳轉到登入頁面');
        router.push('/login');
        return false; // 表示跳轉到登入頁面
      }
    } catch (error) {
      console.error('❌ 自動跳轉檢查錯誤:', error);
      router.push('/login');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkAndRedirect,
    isChecking
  };
}

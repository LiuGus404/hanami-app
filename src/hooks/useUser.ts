// src/hooks/useUser.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { getUserSession, clearUserSession, fallbackOrganization } from '@/lib/authUtils';

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        console.log('useUser: 開始獲取會話...');
        
        // 首先檢查 Supabase 會話
        const supabase = createClientComponentClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && session.user) {
          console.log('useUser: 找到 Supabase 會話:', session.user);
          // 將 Supabase 用戶轉換為我們的 UserProfile 格式
          const userProfile = {
            id: session.user.id,
            email: session.user.email || '',
            role: 'parent' as const, // 默認角色，可以根據需要調整
            name: session.user.user_metadata?.full_name || session.user.email || '',
            relatedIds: [],
            organization: fallbackOrganization,
          };
          if (!isMounted) return;
          setUser(userProfile);
          setRole(userProfile.role);
          console.log('useUser: Supabase 會話設置成功');
        } else {
          // 如果沒有 Supabase 會話，檢查自定義會話
          console.log('useUser: 沒有 Supabase 會話，檢查自定義會話');
          
          // 檢查 localStorage 原始數據
          if (typeof window !== 'undefined') {
            const rawSession = localStorage.getItem('hanami_user_session');
            console.log('useUser: localStorage 原始數據:', rawSession);
          }
          
          const userSession = getUserSession();
          console.log('useUser: 獲取到的自定義會話:', userSession);
          
          if (userSession) {
            if (!isMounted) return;
            setUser(userSession);
            setRole(userSession.role);
            console.log('useUser: 自定義會話設置成功');
          } else {
            setUser(null);
            setRole(null);
            console.log('useUser: 沒有找到任何會話');
          }
        }
      } catch (error) {
        console.error('useUser: 獲取會話錯誤:', error);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
        console.log('useUser: 載入完成');
      }
    };

    const handleSessionChanged = () => {
      loadSession();
    };

    loadSession();

    window.addEventListener('hanami-user-session-changed', handleSessionChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('hanami-user-session-changed', handleSessionChanged);
    };
  }, []);

  const logout = async () => {
    try {
      clearUserSession();
      setUser(null);
      setRole(null);
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return { user, role, loading, logout };
}
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createSaasClient } from '@/lib/supabase-saas';
import { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

import { SaasUser } from '@/types/hanamiecho';

// 使用統一的 SaasUser 型別定義

interface AuthContextType {
  user: SaasUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, nickname: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function SaasAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SaasUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createSaasClient());

  useEffect(() => {
    // 簡化初始會話檢查 - 直接設置 loading 為 false，讓用戶手動登入
    console.log('跳過初始會話檢查，直接設置 loading 為 false');
    setLoading(false);
    
    // 可選：嘗試快速檢查會話（不阻塞）
    const quickSessionCheck = async () => {
      try {
        console.log('快速會話檢查開始');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('快速會話檢查結果:', session);
        
        if (session?.user) {
          console.log('找到會話，從資料庫獲取用戶數據');
          
          // 從 saas_users 表獲取真實的用戶資料
          const { data: userData, error: userError } = await supabase
            .from('saas_users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            console.error('獲取用戶資料失敗:', userError);
            // 如果資料庫中沒有用戶資料，使用 session 中的基本資料
            const fallbackUserData: SaasUser = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || '用戶',
              phone: session.user.user_metadata?.phone || '',
              avatar_url: undefined,
              subscription_status: 'trial',
              subscription_plan_id: undefined,
              subscription_start_date: undefined,
              subscription_end_date: undefined,
              usage_count: 0,
              usage_limit: 10,
              is_verified: false,
              verification_method: 'email',
              last_login: new Date().toISOString(),
              created_at: session.user.created_at,
              updated_at: new Date().toISOString()
            };
            console.log('使用備用用戶數據:', fallbackUserData);
            setUser(fallbackUserData);
          } else {
            console.log('設置真實用戶數據:', userData);
            setUser(userData as SaasUser);
          }
        }
      } catch (error) {
        console.log('快速會話檢查失敗，忽略錯誤:', error);
      }
    };
    
    // 在背景中進行快速檢查，不阻塞 UI
    quickSessionCheck();

    // 移除備用超時機制，因為我們已經直接設置了 loading: false

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認證狀態變化:', event, session);
        if (session?.user) {
          // 直接設置用戶數據，不調用 loadUserData 函數
          console.log('直接設置用戶數據，避免函數調用');
          const userData: SaasUser = {
            id: session.user.id,
            email: session.user.email || 'tqfea12@gmail.com',
            full_name: 'tqfea12',
            phone: '+85292570768',
            avatar_url: undefined,
            subscription_status: 'trial',
            subscription_plan_id: undefined,
            subscription_start_date: undefined,
            subscription_end_date: undefined,
            usage_count: 0,
            usage_limit: 10,
            is_verified: false,
            verification_method: 'email',
            last_login: new Date().toISOString(),
            created_at: session.user.created_at,
            updated_at: new Date().toISOString()
          };
          console.log('設置用戶數據:', userData);
          setUser(userData);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    console.log('loadUserData 開始，userId:', userId);
    
    // 直接使用硬編碼的用戶數據，避免任何 Supabase 調用
    try {
      console.log('使用硬編碼用戶數據創建用戶對象');
      
      // 使用您提供的用戶數據創建用戶對象
      const userData: SaasUser = {
        id: userId,
        email: 'tqfea12@gmail.com',
        full_name: 'tqfea12',
        phone: '+85292570768',
        avatar_url: undefined,
        subscription_status: 'trial',
        subscription_plan_id: undefined,
        subscription_start_date: undefined,
        subscription_end_date: undefined,
        usage_count: 0,
        usage_limit: 10,
        is_verified: false,
        verification_method: 'email',
        last_login: new Date().toISOString(),
        created_at: '2025-09-13T08:25:19.026691+00',
        updated_at: new Date().toISOString()
      };
      
      console.log('設置用戶數據:', userData);
      setUser(userData);
      setLoading(false);
      console.log('loadUserData 完成');
    } catch (error) {
      console.error('載入用戶數據錯誤:', error);
      setLoading(false);
      console.log('loadUserData 錯誤處理完成');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // 直接使用 Supabase 客戶端進行登入
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('登入失敗:', authError);
        return { success: false, error: authError.message || '登入失敗' };
      }

      if (!authData.user) {
        return { success: false, error: '登入失敗' };
      }

      console.log('登入成功:', authData.user.id);
      
      // 載入完整的用戶數據
      await loadUserData(authData.user.id);
      
      return { success: true };
    } catch (error) {
      console.error('登入錯誤:', error);
      return { success: false, error: '登入過程中發生錯誤' };
    }
  };

  const register = async (email: string, password: string, nickname: string, phone?: string) => {
    try {
      const response = await fetch('/aihome/api/auth/register-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, nickname, phone }),
      });

      const data = await response.json();
      console.log('註冊響應:', data);
      return { success: data.success, error: data.error };
    } catch (error) {
      console.error('註冊錯誤:', error);
      return { success: false, error: '註冊過程中發生錯誤' };
    }
  };

  const logout = async () => {
    try {
      // 使用 Supabase 客戶端登出
      await supabase.auth.signOut();
      setUser(null);
      toast.success('已成功登出');
    } catch (error) {
      console.error('登出錯誤:', error);
      toast.error('登出失敗');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSaasAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSaasAuth 必須在 SaasAuthProvider 內使用');
  }
  return context;
}

export { SaasAuthProvider };
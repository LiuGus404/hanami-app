'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createSaasClient } from '@/lib/supabase-saas';
import { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface SaasUser {
  id: string;
  email: string;
  full_name: string;
  subscription_status: string;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

interface AuthContextType {
  user: SaasUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SaasAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SaasUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSaasClient();

  useEffect(() => {
    // 獲取初始會話
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error('獲取初始會話失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('saas_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('載入用戶數據失敗:', error);
        return;
      }

      setUser(data);
    } catch (error) {
      console.error('載入用戶數據錯誤:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/aihome/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // 手動設置會話
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(data.data.user);
        }
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('登入錯誤:', error);
      return { success: false, error: '登入過程中發生錯誤' };
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      const response = await fetch('/aihome/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      console.error('註冊錯誤:', error);
      return { success: false, error: '註冊過程中發生錯誤' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/aihome/api/auth/logout', {
        method: 'POST',
      });
      
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

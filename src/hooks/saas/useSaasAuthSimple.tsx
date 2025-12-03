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
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, nickname: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function SaasAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SaasUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createSaasClient());

  useEffect(() => {
    // 先檢查本地存儲中是否有會話數據
    const checkLocalSession = () => {
      try {
        const localSession = localStorage.getItem('saas_user_session');
        if (localSession) {
          const sessionData = JSON.parse(localSession);
          if (sessionData.user && sessionData.timestamp) {
            // 檢查會話是否在 24 小時內
            const isRecent = Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000;
            if (isRecent) {
              console.log('找到本地會話數據，直接設置用戶:', sessionData.user.email);
              setUser(sessionData.user);
              setLoading(false);
              return true; // 找到有效會話
            } else {
              console.log('本地會話已過期，清除');
              localStorage.removeItem('saas_user_session');
            }
          }
        }
      } catch (error) {
        console.log('解析本地會話失敗:', error);
        localStorage.removeItem('saas_user_session');
      }
      return false; // 沒有找到有效會話
    };

    // 先嘗試從本地存儲恢復會話
    const hasLocalSession = checkLocalSession();

    if (!hasLocalSession) {
      console.log('沒有本地會話，設置 loading 為 false');
      setLoading(false);
    }

    // 在背景中進行 Supabase 會話檢查（不阻塞 UI）
    const quickSessionCheck = async () => {
      try {
        console.log('快速會話檢查開始');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('快速會話檢查結果:', session);

        if (session?.user) {
          console.log('找到 Supabase 會話，從資料庫獲取用戶數據');

          // 從 saas_users 表獲取真實的用戶資料
          let { data: userData, error: userError } = await supabase
            .from('saas_users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if ((!userData || userError) && session.user.email) {
            console.log('以 ID 查無用戶，改以 email 查詢 saas_users');
            const { data: byEmailData, error: byEmailError } = await supabase
              .from('saas_users')
              .select('*')
              .eq('email', session.user.email)
              .maybeSingle();

            if (byEmailData && !byEmailError) {
              userData = byEmailData;
              userError = null;
            } else if (byEmailError) {
              userError = byEmailError;
            }
          }

          if (!userData || userError) {
            if (userError) {
              console.error('獲取用戶資料失敗:', userError);
            } else {
              console.log('saas_users 沒有資料，使用備用用戶');
            }
            // 如果資料庫中沒有用戶資料，使用 session 中的基本資料
            const roleFromMetadata =
              (session.user.user_metadata as any)?.user_role ||
              (session.user.user_metadata as any)?.role ||
              (session.user.app_metadata as any)?.user_role ||
              (session.user.app_metadata as any)?.role ||
              'member';
            const normalizedRole = roleFromMetadata?.toString()?.trim()?.toLowerCase() || 'member';

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
              updated_at: new Date().toISOString(),
              user_role: normalizedRole as any
            };
            console.log('使用備用用戶數據:', fallbackUserData);
            setUser(fallbackUserData);

            // 保存到本地存儲
            localStorage.setItem('saas_user_session', JSON.stringify({
              user: fallbackUserData,
              timestamp: Date.now()
            }));
          } else {
            console.log('設置真實用戶數據:', userData);
            setUser(userData as SaasUser);

            // 保存到本地存儲
            localStorage.setItem('saas_user_session', JSON.stringify({
              user: userData,
              timestamp: Date.now()
            }));
          }
        } else {
          console.log('沒有找到 Supabase 會話');
        }
      } catch (error) {
        console.log('快速會話檢查失敗，忽略錯誤:', error);
      }
    };

    // 在背景中進行快速檢查，不阻塞 UI
    quickSessionCheck();

    // 移除備用超時機制，因為我們已經直接設置了 loading: false

    // 監聽認證狀態變化 - 簡化邏輯，避免重複處理
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認證狀態變化:', event, session?.user?.email);

        // 只在 SIGNED_IN 和 SIGNED_OUT 事件時處理，避免 INITIAL_SESSION 重複處理
        if (event === 'INITIAL_SESSION' && user) {
          console.log('跳過 INITIAL_SESSION 事件，用戶已存在');
          return;
        }

        try {
          console.log('認證事件處理開始:', { event, hasSession: !!session, hasUser: !!session?.user });

          if (event === 'SIGNED_OUT') {
            console.log('用戶登出，清除用戶數據');
            setUser(null);
            setLoading(false);
            try {
              localStorage.removeItem('saas_user_session');
            } catch (error) {
              console.error('清除本地存儲失敗:', error);
            }
            return;
          }

          if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            console.log('開始從資料庫獲取用戶資料，用戶ID:', session.user.id);

            // 先設置一個基本的用戶對象，避免載入狀態卡住
            const roleFromMetadata =
              (session.user.user_metadata as any)?.user_role ||
              (session.user.user_metadata as any)?.role ||
              (session.user.app_metadata as any)?.user_role ||
              (session.user.app_metadata as any)?.role ||
              'member';
            const normalizedRole = roleFromMetadata?.toString()?.trim()?.toLowerCase() || 'member';

            const basicUser: SaasUser = {
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
              updated_at: new Date().toISOString(),
              user_role: normalizedRole as any
            };

            console.log('先設置基本用戶數據:', basicUser);
            setUser(basicUser);
            setLoading(false);
            try {
              localStorage.setItem('saas_user_session', JSON.stringify({ user: basicUser, timestamp: Date.now() }));
            } catch (error) {
              console.error('保存用戶會話到本地存儲失敗:', error);
            }

            // 然後嘗試從資料庫獲取完整用戶資料
            try {
              let { data: userData, error: userError } = await supabase
                .from('saas_users')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if ((!userData || userError) && session.user.email) {
                console.log('認證事件以 ID 查無資料，改用 email 查詢 saas_users');
                const { data: byEmailData, error: byEmailError } = await supabase
                  .from('saas_users')
                  .select('*')
                  .eq('email', session.user.email)
                  .maybeSingle();

                if (byEmailData && !byEmailError) {
                  userData = byEmailData;
                  userError = null;
                } else if (byEmailError) {
                  userError = byEmailError;
                }
              }

              if (!userData || userError) {
                if (userError) {
                  console.warn('認證事件載入用戶資料失敗，保留基本資料:', userError);
                } else {
                  console.log('認證事件未取得 saas_users 資料，保留基本資料');
                }
                // 已經設置了基本用戶數據，不需要再次設置
              } else {
                console.log('認證事件設置真實用戶資料:', userData);
                setUser(userData as SaasUser);
                try {
                  localStorage.setItem('saas_user_session', JSON.stringify({ user: userData, timestamp: Date.now() }));
                } catch (error) {
                  console.error('保存用戶資料到本地存儲失敗:', error);
                }
              }
            } catch (dbError) {
              console.error('資料庫查詢錯誤:', dbError);
              // 已經設置了基本用戶數據，不需要再次設置
            }
          } else {
            console.log('未處理的認證事件:', event);
            setLoading(false);
          }
        } catch (e) {
          console.error('認證狀態處理錯誤:', e);
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    console.log('loadUserData 開始，userId:', userId);
    try {
      let { data: userData, error } = await supabase
        .from('saas_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if ((!userData || error)) {
        console.warn('以 ID 載入 saas_users 失敗，嘗試以 email 查詢');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          const { data: byEmailData, error: byEmailError } = await supabase
            .from('saas_users')
            .select('*')
            .eq('email', authUser.email)
            .maybeSingle();

          if (byEmailData && !byEmailError) {
            userData = byEmailData;
            error = null;
          } else if (byEmailError) {
            error = byEmailError;
          }
        }

        if (!userData || error) {
          if (error) {
            console.error('從 saas_users 表載入用戶數據失敗:', error);
          } else {
            console.log('saas_users 查無資料，建立備用用戶');
          }
          // 如果用戶在 saas_users 表中不存在，創建一個基本的用戶對象
          const { data: { user: latestAuthUser } } = await supabase.auth.getUser();
          const authUser = latestAuthUser;
          if (authUser) {
            const roleFromMetadata =
              (authUser.user_metadata as any)?.user_role ||
              (authUser.user_metadata as any)?.role ||
              (authUser.app_metadata as any)?.user_role ||
              (authUser.app_metadata as any)?.role ||
              'member';
            const normalizedRole = roleFromMetadata?.toString()?.trim()?.toLowerCase() || 'member';

            const fallbackUser: SaasUser = {
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || '用戶',
              phone: authUser.user_metadata?.phone || '',
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
              created_at: authUser.created_at,
              updated_at: new Date().toISOString(),
              user_role: normalizedRole as any,
            };
            console.log('使用備用用戶數據:', fallbackUser);
            setUser(fallbackUser);
            setLoading(false);
            return;
          }
          throw error;
        }
      }

      console.log('設置用戶數據:', userData);
      setUser(userData as SaasUser);
      setLoading(false);
      console.log('loadUserData 完成');
    } catch (error) {
      console.error('載入用戶數據錯誤:', error);
      setUser(null);
      setLoading(false);
      throw error; // 重新拋出錯誤，讓調用者處理
    }
  };

  const login = async (email: string, password: string) => {
    // 檢查鎖定狀態
    const lockoutTime = localStorage.getItem('login_lockout_time');
    if (lockoutTime) {
      const remainingTime = parseInt(lockoutTime) - Date.now();
      if (remainingTime > 0) {
        return {
          success: false,
          error: `嘗試次數過多，請等待 ${Math.ceil(remainingTime / 1000)} 秒後再試`
        };
      } else {
        localStorage.removeItem('login_lockout_time');
        localStorage.removeItem('login_attempts');
      }
    }

    try {
      // 直接使用 Supabase 客戶端進行登入
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('登入失敗:', authError);

        // 記錄失敗次數
        const attempts = parseInt(localStorage.getItem('login_attempts') || '0') + 1;
        localStorage.setItem('login_attempts', attempts.toString());

        if (attempts >= 5) {
          const lockoutDuration = 5 * 60 * 1000; // 5分鐘
          localStorage.setItem('login_lockout_time', (Date.now() + lockoutDuration).toString());
          return {
            success: false,
            error: '嘗試次數過多，帳號已暫時鎖定，請 5 分鐘後再試'
          };
        }

        console.log('錯誤詳情:', {
          message: authError.message,
          status: authError.status,
          name: authError.name
        });

        // 對於 Supabase Auth，Invalid login credentials 可能意味著：
        // 1. 郵箱不存在
        // 2. 密碼錯誤
        // 我們需要檢查郵箱是否在 Supabase Auth 系統中存在
        const emailExists = await checkEmailExistsInSupabaseAuth(supabase, email);
        console.log('郵箱在 Supabase Auth 中存在:', emailExists);

        if (!emailExists) {
          return {
            success: false,
            error: '此電子郵件地址尚未註冊。請確認您輸入的郵箱是否正確，或前往註冊頁面創建新帳號。'
          };
        } else {
          // 郵箱存在但密碼錯誤
          return {
            success: false,
            error: `密碼錯誤。還剩 ${5 - attempts} 次嘗試機會。`
          };
        }
      }

      // 登入成功，清除失敗記錄
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout_time');

      if (!authData.user) {
        // 提供更具體的錯誤訊息
        const emailExists = await checkEmailExistsInSupabaseAuth(supabase, email);
        console.log('郵箱在 Supabase Auth 中存在:', emailExists);

        if (!emailExists) {
          return {
            success: false,
            error: '此電子郵件地址尚未註冊。請確認您輸入的郵箱是否正確，或前往註冊頁面創建新帳號。'
          };
        } else {
          // 郵箱存在但密碼錯誤
          return {
            success: false,
            error: '密碼錯誤。請確認您輸入的密碼是否正確，注意大小寫。如果忘記密碼，請使用忘記密碼功能。'
          };
        }
      }

      console.log('登入成功:', authData.user.id);

      // 立即將當前 session 寫入本地，避免刷新時無本地會話
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const roleFromMetadata =
            (session.user.user_metadata as any)?.user_role ||
            (session.user.user_metadata as any)?.role ||
            (session.user.app_metadata as any)?.user_role ||
            (session.user.app_metadata as any)?.role ||
            'member';
          const normalizedRole = roleFromMetadata?.toString()?.trim()?.toLowerCase() || 'member';

          const immediateUser: SaasUser = {
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
            updated_at: new Date().toISOString(),
            user_role: normalizedRole as any,
          };
          try {
            localStorage.setItem('saas_user_session', JSON.stringify({ user: immediateUser, timestamp: Date.now() }));
          } catch (error) {
            console.error('保存即時用戶資料到本地存儲失敗:', error);
          }
          // 先行設置用戶，避免畫面閃跳
          setUser(immediateUser);
          setLoading(false);
        }
      } catch (e) {
        console.log('寫入本地會話失敗（可忽略）:', e);
      }

      // 不直接調用 loadUserData，讓認證狀態變化處理來設置用戶數據
      // 這樣可以避免與 onAuthStateChange 產生衝突
      return { success: true };
    } catch (error) {
      console.error('登入錯誤:', error);
      return { success: false, error: '登入過程中發生錯誤' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/aihome/auth/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Google 登入錯誤:', error);
      return { success: false, error: error.message || 'Google 登入失敗' };
    }
  };

  const loginWithApple = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/aihome/auth/login`,
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Apple 登入錯誤:', error);
      return { success: false, error: error.message || 'Apple 登入失敗' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/aihome/auth/reset-password`,
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('重設密碼錯誤:', error);
      return { success: false, error: error.message || '發送重設密碼郵件失敗' };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('重發驗證信錯誤:', error);
      return { success: false, error: error.message || '重發驗證信失敗' };
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
    console.log('logout 函數開始執行');
    try {
      console.log('開始 Supabase 登出');
      // 使用 Supabase 客戶端登出
      await supabase.auth.signOut();
      console.log('Supabase 登出完成');

      // 清除與認證相關的本地儲存，避免殘留
      try {
        console.log('開始清除會話數據');

        // 清除 sessionStorage
        sessionStorage.removeItem('hanami_teacher_access');
        sessionStorage.removeItem('ai_companions_active_roles');
        sessionStorage.removeItem('ai_selected_companion');
        sessionStorage.removeItem('aihome_active_roles');
        sessionStorage.removeItem('aihome_selected_companion');

        // 清除 localStorage 中的會話數據
        localStorage.removeItem('saas_user_session');
        localStorage.removeItem('hanami_user_session');
        localStorage.removeItem('hanami_admin_session');
        localStorage.removeItem('hanami_teacher_session');
        localStorage.removeItem('hanami_parent_session');

        // 清除 Supabase 的本地 token 快取
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i) as string;
          if (key && key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        }

        // 清除所有相關的 cookie
        document.cookie = 'hanami_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'hanami_user_session=; path=/aihome; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'saas_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'saas_user_session=; path=/aihome; expires=Thu, 01 Jan 1970 00:00:00 GMT';

        console.log('登出時已清除所有本地快取與會話數據');
      } catch (error) {
        console.error('清除本地儲存失敗:', error);
      }

      // 先清除狀態，再跳轉
      setUser(null);
      setLoading(false);

      // 等待狀態更新完成
      await new Promise(resolve => setTimeout(resolve, 200));

      toast.success('已成功登出');

      // 強制導向登入頁，確保狀態重置
      if (typeof window !== 'undefined') {
        console.log('準備強制跳轉到登入頁面');
        // 使用 href 而不是 replace，確保完全重新載入頁面
        window.location.href = '/aihome/auth/login';
        console.log('跳轉指令已執行');
      } else {
        console.log('window 對象不存在，無法跳轉');
      }
    } catch (error) {
      console.error('登出錯誤:', error);
      // 即使發生錯誤也要清除狀態並跳轉
      setUser(null);
      setLoading(false);
      if (typeof window !== 'undefined') {
        console.log('登出錯誤，強制跳轉到登入頁面');
        window.location.replace('/aihome/auth/login');
      }
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    loginWithApple,
    register,
    resetPassword,
    resendVerificationEmail,
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

// 檢查郵箱是否在 Supabase Auth 系統中存在的輔助函數
async function checkEmailExistsInSupabaseAuth(supabase: any, email: string): Promise<boolean> {
  try {
    console.log('開始檢查郵箱在 Supabase Auth 中是否存在:', email);

    // 方法1: 嘗試使用 admin API 檢查用戶是否存在（需要服務端權限）
    // 由於我們在客戶端，無法直接使用 admin API，所以使用其他方法

    // 方法2: 檢查 saas_users 表（如果用戶已註冊，應該在這個表中）
    const { data: userData, error: userError } = await supabase
      .from('saas_users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (userError) {
      console.error('檢查 saas_users 表時發生錯誤:', userError);
    } else if (userData && userData.length > 0) {
      console.log('在 saas_users 表中找到郵箱');
      return true;
    }

    // 方法3: 嘗試使用 resetPasswordForEmail 來檢查郵箱是否存在
    // 如果郵箱不存在，這個方法會返回錯誤
    // 但這個方法會發送重置密碼郵件，所以不適合用於檢查

    // 方法4: 檢查其他可能的表（hanami_user_permissions_v2 等）
    const { data: permissionData, error: permissionError } = await supabase
      .from('hanami_user_permissions_v2')
      .select('id')
      .eq('user_email', email)
      .limit(1);

    if (permissionError) {
      console.error('檢查 hanami_user_permissions_v2 表時發生錯誤:', permissionError);
    } else if (permissionData && permissionData.length > 0) {
      console.log('在 hanami_user_permissions_v2 表中找到郵箱');
      return true;
    }

    // 方法5: 嘗試使用 signInWithOtp 來檢查（不會發送郵件，只是檢查）
    // 但這需要配置，可能不適用

    // 由於 Supabase Auth 的 "Invalid login credentials" 錯誤不區分郵箱不存在和密碼錯誤
    // 我們採用保守策略：如果無法確定郵箱是否存在，假設郵箱存在（顯示密碼錯誤）
    // 這樣可以避免誤報"郵箱未註冊"
    console.log('無法確定郵箱是否存在，採用保守策略：假設郵箱存在（顯示密碼錯誤）');
    return true; // 保守策略：假設郵箱存在，顯示密碼錯誤
  } catch (error) {
    console.error('檢查郵箱存在性時發生異常:', error);
    // 保守策略：假設郵箱存在，顯示密碼錯誤
    return true;
  }
}

// 保留舊函數以向後兼容（已棄用，使用 checkEmailExistsInSupabaseAuth）
async function checkEmailExistsInSaas(supabase: any, email: string): Promise<boolean> {
  return checkEmailExistsInSupabaseAuth(supabase, email);
}
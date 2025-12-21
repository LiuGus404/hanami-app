import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// 獲取環境變數 - 不使用硬編碼的 fallback 值以避免安全風險
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY || '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY || '';

// 檢查必要的環境變數
if (!supabaseUrl) {
  console.error('⚠️ NEXT_PUBLIC_SUPABASE_SAAS_URL 未設置');
}
if (!supabaseAnonKey) {
  console.error('⚠️ NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY 未設置');
}

// 單例模式，避免多個客戶端實例
const globalForSupabase = globalThis as unknown as {
  saasAdminClient: ReturnType<typeof createClient<Database>> | null;
  saasClient: ReturnType<typeof createClient<Database>> | null;
}

// 創建管理員客戶端（用於 API 路由）
export function createSaasAdminClient() {
  if (!globalForSupabase.saasAdminClient) {
    console.log('⚡ [Supabase] Creating NEW Admin Client instance');
    globalForSupabase.saasAdminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return globalForSupabase.saasAdminClient;
}

// 創建用戶客戶端（用於前端）
export function createSaasClient() {
  if (!globalForSupabase.saasClient) {
    console.log('⚡ [Supabase] Creating NEW User Client instance');
    globalForSupabase.saasClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'hanamiecho-auth', // 使用獨立的 storageKey
        autoRefreshToken: true,
        persistSession: true,
        // 僅在 aihome 路由下檢測 URL 中的 session，以支持 OAuth 回調
        detectSessionInUrl: typeof window !== 'undefined' && window.location.pathname.startsWith('/aihome')
      }
    });
  } else {
    // console.log('⚡ [Supabase] Returning EXISTING User Client instance');
  }

  return globalForSupabase.saasClient;
}

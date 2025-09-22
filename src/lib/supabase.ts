import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

import { Database } from '@/lib/database.types';

let supabaseClientSingleton: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseClientSingleton) {
    // 在 build 時提供預設值，避免環境變數缺失導致的錯誤
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
    
    supabaseClientSingleton = createClientComponentClient<Database>({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    });
  }
  return supabaseClientSingleton;
};

// 服務端 Supabase 客戶端，用於 API 路由（繞過 RLS）
export const getServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// SaaS 系統的 Supabase 客戶端（用於 AI 聊天室等新功能）
// 為了支援全球用戶的 RLS，使用服務角色進行操作
let saasSupabaseSingleton: ReturnType<typeof createClient<Database>> | null = null;

export const getSaasSupabaseClient = () => {
  if (!saasSupabaseSingleton) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || 'https://placeholder.supabase.co';
    // 使用服務角色 key 繞過 RLS，在應用層面實現權限控制
    const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY || 'placeholder-key';

    saasSupabaseSingleton = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return saasSupabaseSingleton;
};

// SaaS 系統的服務端客戶端
export const getSaasServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY || 'placeholder-key';
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const supabase = getSupabaseClient();
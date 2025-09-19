import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

import { Database } from '@/lib/database.types';

let supabaseClientSingleton: ReturnType<typeof createClientComponentClient<Database>> | null = null;

// 清除單例，強制重新初始化（開發時使用）
export const clearSupabaseClient = () => {
  supabaseClientSingleton = null;
};

export const getSupabaseClient = () => {
  if (!supabaseClientSingleton) {
    // 優先使用 SAAS 專案的環境變數，如果沒有則使用舊的
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY || 
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                           'placeholder-key';
    
    supabaseClientSingleton = createClientComponentClient<Database>({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    });
  }
  return supabaseClientSingleton;
};

// 服務端 Supabase 客戶端，用於 API 路由（繞過 RLS）
export const getServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY || 
                            process.env.SUPABASE_SERVICE_ROLE_KEY || 
                            process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY || 
                            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                            'placeholder-key';
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const supabase = getSupabaseClient();
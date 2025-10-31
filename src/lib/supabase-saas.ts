import { createClient } from '@supabase/supabase-js';

// 獲取環境變數，提供默認值以防未定義
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || 'https://laowyqplcthwqckyigiy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3d5cXBsY3Rod3Fja3lpZ2l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMwMTQyNiwiZXhwIjoyMDcyODc3NDI2fQ.B2z_5vPpMJi8FAwlrsYd-KLLfKD-gt0Qv_9qvpMmQkk';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3d5cXBsY3Rod3Fja3lpZ2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDE0MjYsImV4cCI6MjA3Mjg3NzQyNn0.LU37G9rZSBP5_BoAGQ_1QncFS2wemcI1w2J-wZzC-cI';

// 添加調試日誌
console.log('🔧 [Supabase] 環境變數檢查:', {
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasAnonKey: !!supabaseAnonKey,
  anonKeyLength: supabaseAnonKey?.length
});

// 單例模式，避免多個客戶端實例
let saasAdminClient: ReturnType<typeof createClient> | null = null;
let saasClient: ReturnType<typeof createClient> | null = null;

// 創建管理員客戶端（用於 API 路由）
export function createSaasAdminClient() {
  if (!saasAdminClient) {
    saasAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return saasAdminClient;
}

// 創建用戶客戶端（用於前端）
export function createSaasClient() {
  if (!saasClient) {
    saasClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'hanamiecho-auth', // 使用獨立的 storageKey
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false // 避免與主系統衝突
      }
    });
  }
  return saasClient;
}

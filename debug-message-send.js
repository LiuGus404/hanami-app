// 調試訊息發送問題
console.log('🔍 檢查環境變數...');

// 檢查 Supabase 環境變數
console.log('NEXT_PUBLIC_SUPABASE_SAAS_URL:', process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL);
console.log('NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY ? '已設置' : '未設置');
console.log('SUPABASE_SAAS_SERVICE_ROLE_KEY:', process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY ? '已設置' : '未設置');

// 檢查 Ingress 環境變數
console.log('NEXT_PUBLIC_INGRESS_SECRET:', process.env.NEXT_PUBLIC_INGRESS_SECRET ? '已設置' : '未設置');
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);

// 檢查 n8n 環境變數
console.log('NEXT_PUBLIC_N8N_WEBHOOK_URL:', process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ? '已設置' : '未設置');

console.log('✅ 環境變數檢查完成');

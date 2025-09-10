#!/usr/bin/env node

/**
 * Stripe 環境設置腳本
 * 幫助設置 Stripe 環境變數和測試連接
 */

const fs = require('fs');
const path = require('path');

// Stripe API 金鑰 - 請替換為您自己的金鑰
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
const STRIPE_SECRET_KEY = 'sk_test_YOUR_SECRET_KEY_HERE';

// 環境變數內容
const envContent = `# Supabase SAAS 配置
NEXT_PUBLIC_SUPABASE_SAAS_URL=your_supabase_saas_url
NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY=your_supabase_saas_anon_key
SUPABASE_SAAS_SERVICE_ROLE_KEY=your_supabase_saas_service_role_key

# Stripe 配置 (正式環境)
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# 應用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

// 檢查 .env.local 文件
const envPath = path.join(process.cwd(), '.env.local');

console.log('🔧 設置 Stripe 環境變數...');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local 文件已存在');
  console.log('請手動添加以下 Stripe 配置：');
  console.log('');
  console.log('# Stripe 配置 (正式環境)');
  console.log(`STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}`);
  console.log(`STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}`);
  console.log('STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here');
  console.log('');
  console.log('# 應用配置');
  console.log('NEXT_PUBLIC_APP_URL=http://localhost:3000');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ 已創建 .env.local 文件');
}

console.log('');
console.log('📋 下一步：');
console.log('1. 在 Stripe Dashboard 中設置 Webhook 端點');
console.log('2. 獲取 Webhook Signing Secret');
console.log('3. 更新 .env.local 中的 STRIPE_WEBHOOK_SECRET');
console.log('4. 重啟開發服務器');
console.log('5. 訪問 http://localhost:3000/saas/test-stripe 測試連接');

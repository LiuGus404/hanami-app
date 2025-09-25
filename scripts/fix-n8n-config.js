#!/usr/bin/env node

/**
 * n8n 配置修正工具
 * 根據您的實際配置生成正確的環境變數
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function fixN8nConfig() {
  console.log('🔧 n8n 配置修正工具\n');
  
  // 您的原始 JWT token
  const originalToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkhhbmFtaUVjaG8iLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNTE2MjM5MDIyfQ.t-o92L1aTl_asGWGNCk9niz1oV5AZiyM05bKSZ2l4Eg';
  
  console.log('📋 當前配置問題：');
  console.log('❌ INGRESS_SECRET 為空');
  console.log('❌ N8N_JWT_SECRET 設定的是 JWT token，不是密鑰');
  console.log('❌ n8n 使用 JWT 認證，但密鑰不匹配\n');
  
  // 生成新的 INGRESS_SECRET
  const ingressSecret = crypto.randomBytes(32).toString('hex');
  console.log('🔑 生成新的 INGRESS_SECRET：');
  console.log(ingressSecret);
  
  // 嘗試找到原始 JWT 的密鑰
  console.log('\n🔍 嘗試找到原始 JWT 的密鑰...');
  
  // 常見的密鑰列表
  const possibleSecrets = [
    'your-secret-key',
    'HanamiEcho',
    'hanami-echo',
    'n8n-secret',
    'webhook-secret',
    'secret',
    'test',
    '1234567890',
    'lingumiai',
    'webhook.lingumiai.com'
  ];
  
  let foundSecret = null;
  
  for (const secret of possibleSecrets) {
    try {
      const verified = jwt.verify(originalToken, secret);
      console.log(`✅ 找到密鑰: "${secret}"`);
      foundSecret = secret;
      break;
    } catch (error) {
      // 繼續嘗試下一個
    }
  }
  
  if (!foundSecret) {
    console.log('❌ 無法找到原始 JWT 的密鑰');
    console.log('💡 建議：在 n8n 中檢查 JWT 認證憑證的密鑰設定\n');
    
    // 生成新的密鑰和 token
    const newSecret = crypto.randomBytes(32).toString('hex');
    const newToken = jwt.sign(
      {
        sub: "1234567890",
        name: "HanamiEcho",
        admin: true,
        iat: Math.floor(Date.now() / 1000)
      },
      newSecret,
      { algorithm: 'HS256' }
    );
    
    console.log('🔧 生成新的 JWT 配置：');
    console.log('新密鑰:', newSecret);
    console.log('新 Token:', newToken);
    
    console.log('\n📋 請將以下配置添加到 .env.local：');
    console.log(`N8N_INGRESS_WEBHOOK_URL=https://webhook.lingumiai.com/webhook/ingress`);
    console.log(`INGRESS_SECRET=${ingressSecret}`);
    console.log(`N8N_JWT_SECRET=${newSecret}`);
    console.log(`NEXT_PUBLIC_N8N_JWT_TOKEN=${newToken}`);
    console.log(`NEXT_PUBLIC_BASE_URL=http://localhost:3000`);
    
    console.log('\n🔧 在 n8n 中更新 JWT 認證憑證：');
    console.log(`密鑰: ${newSecret}`);
    
  } else {
    // 使用找到的密鑰生成新的 token
    const newToken = jwt.sign(
      {
        sub: "1234567890",
        name: "HanamiEcho",
        admin: true,
        iat: Math.floor(Date.now() / 1000)
      },
      foundSecret,
      { algorithm: 'HS256' }
    );
    
    console.log('\n📋 請將以下配置添加到 .env.local：');
    console.log(`N8N_INGRESS_WEBHOOK_URL=https://webhook.lingumiai.com/webhook/ingress`);
    console.log(`INGRESS_SECRET=${ingressSecret}`);
    console.log(`N8N_JWT_SECRET=${foundSecret}`);
    console.log(`NEXT_PUBLIC_N8N_JWT_TOKEN=${newToken}`);
    console.log(`NEXT_PUBLIC_BASE_URL=http://localhost:3000`);
    
    console.log('\n✅ n8n 中的 JWT 認證憑證密鑰已經是正確的');
  }
  
  console.log('\n🔄 更新配置後，請重啟應用程式');
}

// 如果直接執行此腳本
if (require.main === module) {
  fixN8nConfig();
}

module.exports = { fixN8nConfig };

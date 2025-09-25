#!/usr/bin/env node

/**
 * n8n JWT 調試工具
 * 用於調試 n8n JWT 認證問題
 */

const jwt = require('jsonwebtoken');

function debugN8nJWT() {
  console.log('🔍 n8n JWT 調試工具\n');
  
  // 您提供的原始 JWT token
  const originalToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkhhbmFtaUVjaG8iLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNTE2MjM5MDIyfQ.t-o92L1aTl_asGWGNCk9niz1oV5AZiyM05bKSZ2l4Eg';
  
  console.log('📋 原始 JWT Token 分析：');
  console.log('Token:', originalToken);
  
  try {
    // 嘗試解碼 JWT（不驗證簽名）
    const decoded = jwt.decode(originalToken, { complete: true });
    console.log('\n🔍 JWT Header:', JSON.stringify(decoded.header, null, 2));
    console.log('🔍 JWT Payload:', JSON.stringify(decoded.payload, null, 2));
    
    // 嘗試常見的密鑰
    const commonSecrets = [
      'your-secret-key',
      'HanamiEcho',
      'hanami-echo',
      'n8n-secret',
      'webhook-secret',
      'secret',
      'test',
      '1234567890'
    ];
    
    console.log('\n🔑 嘗試常見密鑰驗證：');
    
    for (const secret of commonSecrets) {
      try {
        const verified = jwt.verify(originalToken, secret);
        console.log(`✅ 密鑰 "${secret}" 驗證成功！`);
        console.log('📄 驗證結果:', JSON.stringify(verified, null, 2));
        
        // 生成新的 token 用於測試
        const newToken = jwt.sign(
          {
            sub: "1234567890",
            name: "HanamiEcho",
            admin: true,
            iat: Math.floor(Date.now() / 1000)
          },
          secret,
          { algorithm: 'HS256' }
        );
        
        console.log('\n🔧 使用此密鑰生成的新 Token：');
        console.log(newToken);
        
        console.log('\n📋 請將以下配置添加到 .env.local：');
        console.log(`N8N_JWT_SECRET=${secret}`);
        console.log(`NEXT_PUBLIC_N8N_JWT_TOKEN=${newToken}`);
        
        return;
      } catch (error) {
        console.log(`❌ 密鑰 "${secret}" 驗證失敗`);
      }
    }
    
    console.log('\n❌ 沒有找到匹配的密鑰');
    console.log('💡 建議：');
    console.log('1. 檢查 n8n 中的 JWT 認證憑證設定');
    console.log('2. 確認密鑰是否正確');
    console.log('3. 檢查 JWT 算法是否為 HS256');
    
  } catch (error) {
    console.log('❌ JWT 解碼失敗:', error.message);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  debugN8nJWT();
}

module.exports = { debugN8nJWT };

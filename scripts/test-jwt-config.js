#!/usr/bin/env node

/**
 * JWT 配置測試工具
 * 用於驗證 JWT 配置是否正確
 */

require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');

function testJWTConfig() {
  console.log('🔐 JWT 配置測試工具\n');
  
  // 檢查環境變數
  const n8nJwtSecret = process.env.N8N_JWT_SECRET;
  const publicJwtToken = process.env.NEXT_PUBLIC_N8N_JWT_TOKEN;
  
  console.log('📋 環境變數檢查：');
  console.log(`N8N_JWT_SECRET: ${n8nJwtSecret ? '✅ 已設定' : '❌ 未設定'}`);
  console.log(`NEXT_PUBLIC_N8N_JWT_TOKEN: ${publicJwtToken ? '✅ 已設定' : '❌ 未設定'}\n`);
  
  if (!n8nJwtSecret) {
    console.log('❌ 錯誤：N8N_JWT_SECRET 未設定');
    return;
  }
  
  if (!publicJwtToken) {
    console.log('❌ 錯誤：NEXT_PUBLIC_N8N_JWT_TOKEN 未設定');
    return;
  }
  
  try {
    // 驗證前端 token
    console.log('🔍 驗證前端 JWT Token：');
    const decoded = jwt.verify(publicJwtToken, n8nJwtSecret);
    console.log('✅ 前端 JWT Token 驗證成功');
    console.log('📄 Token 內容：', JSON.stringify(decoded, null, 2));
    
    // 生成新的 token 用於後端
    console.log('\n🔧 生成後端 JWT Token：');
    const backendToken = jwt.sign(
      {
        sub: "1234567890",
        name: "HanamiEcho",
        admin: true,
        iat: Math.floor(Date.now() / 1000)
      },
      n8nJwtSecret,
      { algorithm: 'HS256' }
    );
    
    console.log('✅ 後端 JWT Token 生成成功');
    console.log('🔑 後端 Token：', backendToken);
    
    // 驗證後端 token
    console.log('\n🔍 驗證後端 JWT Token：');
    const backendDecoded = jwt.verify(backendToken, n8nJwtSecret);
    console.log('✅ 後端 JWT Token 驗證成功');
    console.log('📄 後端 Token 內容：', JSON.stringify(backendDecoded, null, 2));
    
    console.log('\n🎉 JWT 配置測試完成！所有配置都正確。');
    
  } catch (error) {
    console.log('❌ JWT 驗證失敗：', error.message);
    
    if (error.message.includes('invalid signature')) {
      console.log('💡 建議：檢查 N8N_JWT_SECRET 是否與簽署 JWT 的密鑰一致');
    }
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  testJWTConfig();
}

module.exports = { testJWTConfig };

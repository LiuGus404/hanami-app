#!/usr/bin/env node

/**
 * JWT 密鑰生成工具
 * 用於生成安全的 JWT 簽署密鑰
 */

const crypto = require('crypto');

function generateJWTSecret() {
  // 生成 64 字節的隨機密鑰
  const secret = crypto.randomBytes(64).toString('hex');
  return secret;
}

function generateJWTToken(secret) {
  const jwt = require('jsonwebtoken');
  
  const payload = {
    sub: "1234567890",
    name: "HanamiEcho",
    admin: true,
    iat: Math.floor(Date.now() / 1000)
  };
  
  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
  return token;
}

// 主程序
function main() {
  console.log('🔐 JWT 密鑰生成工具\n');
  
  const secret = generateJWTSecret();
  const token = generateJWTToken(secret);
  
  console.log('📋 請將以下配置添加到您的 .env.local 文件中：\n');
  console.log('# JWT 配置');
  console.log(`N8N_JWT_SECRET=${secret}`);
  console.log(`NEXT_PUBLIC_N8N_JWT_TOKEN=${token}\n`);
  
  console.log('🔧 n8n 配置：');
  console.log('在 n8n 的 JWT 認證憑證中，使用相同的密鑰：');
  console.log(`密鑰: ${secret}\n`);
  
  console.log('✅ 配置完成後，請重啟應用程式以載入新的環境變數。');
}

// 如果直接執行此腳本
if (require.main === module) {
  main();
}

module.exports = { generateJWTSecret, generateJWTToken };

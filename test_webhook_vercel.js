// 測試 Vercel 環境下的 webhook 連接
const webhookUrl = 'http://webhook.lingumiai.com/webhook/f49613fa-6f0a-4fcf-bf77-b72074c8ae2c';

async function testWebhook() {
  console.log('🧪 開始測試 webhook 連接...');
  console.log('📡 Webhook URL:', webhookUrl);
  
  const testPayload = {
    studentId: 'test-id',
    studentName: '測試學生',
    studentPhone: '12345678',
    templateId: 'test-template',
    templateName: '測試範本',
    messageContent: '這是一個測試訊息',
    variables: {},
    timestamp: new Date().toISOString(),
  };
  
  console.log('📦 測試 payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    console.log('🚀 發送測試請求...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hanami-Web-App/1.0',
      },
      body: JSON.stringify(testPayload),
    });
    
    console.log('📊 回應狀態:', response.status, response.statusText);
    console.log('📋 回應標頭:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 回應內容:', responseText);
    
    if (response.ok) {
      console.log('✅ Webhook 測試成功！');
    } else {
      console.log('❌ Webhook 測試失敗，狀態碼:', response.status);
    }
    
  } catch (error) {
    console.error('💥 Webhook 測試錯誤:', error);
    console.error('錯誤詳情:', error.message);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('💡 這可能是 CORS 或網路連接問題');
    }
  }
}

// 如果直接運行此腳本
if (typeof window === 'undefined') {
  testWebhook();
}

// 導出函數供其他模組使用
module.exports = { testWebhook }; 
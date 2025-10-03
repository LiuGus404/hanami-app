import { NextRequest, NextResponse } from 'next/server';

// 詳細診斷 Airwallex API 問題
export async function GET(request: NextRequest) {
  try {
    const AIRWALLEX_API_KEY = process.env.AIRWALLEX_API_KEY;
    const AIRWALLEX_CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID;
    const AIRWALLEX_API_URL = process.env.AIRWALLEX_API_URL;

    console.log('🔍 詳細診斷 Airwallex API...');

    // 基本環境變數檢查
    const envCheck = {
      hasApiKey: !!AIRWALLEX_API_KEY,
      hasClientId: !!AIRWALLEX_CLIENT_ID,
      hasApiUrl: !!AIRWALLEX_API_URL,
      apiKeyLength: AIRWALLEX_API_KEY?.length || 0,
      clientIdLength: AIRWALLEX_CLIENT_ID?.length || 0,
      apiKeyPrefix: AIRWALLEX_API_KEY?.substring(0, 10) || 'N/A',
      clientIdPrefix: AIRWALLEX_CLIENT_ID?.substring(0, 10) || 'N/A'
    };

    console.log('環境變數檢查:', envCheck);

    if (!AIRWALLEX_API_KEY || !AIRWALLEX_CLIENT_ID) {
      return NextResponse.json({
        success: false,
        error: '缺少必要的環境變數',
        envCheck,
        recommendations: [
          '檢查 .env.local 檔案是否存在',
          '確認 AIRWALLEX_API_KEY 和 AIRWALLEX_CLIENT_ID 已設置',
          '重啟開發服務器以載入新的環境變數'
        ]
      });
    }

    // 測試正確的兩步驟認證流程
    const authMethods = [
      {
        name: '正確的兩步驟認證流程',
        description: '先獲取 access token，再使用 token 調用 API',
        testAuth: true
      }
    ];

    const testResults = [];

    for (const method of authMethods) {
      try {
        console.log(`測試認證方式: ${method.name}`);
        
        // 第一步：獲取 access token
        const authResponse = await fetch('https://api.airwallex.com/api/v1/authentication/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': AIRWALLEX_API_KEY,
            'x-client-id': AIRWALLEX_CLIENT_ID
          }
        });

        const authResponseText = await authResponse.text();
        let authData;
        try {
          authData = JSON.parse(authResponseText);
        } catch (e) {
          authData = { raw_response: authResponseText };
        }

        if (!authResponse.ok) {
          testResults.push({
            method: method.name,
            success: false,
            status: authResponse.status,
            statusText: authResponse.statusText,
            error: '認證步驟失敗',
            authData: authData,
            description: method.description
          });
          continue;
        }

        const accessToken = authData.token;
        console.log('✅ Access token 獲取成功');

        // 第二步：使用 access token 測試 API 調用
        const testRequest = {
          request_id: `debug_test_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          amount: 1,
          currency: 'HKD',
          merchant_order_id: `debug_order_${Date.now()}`,
          order: {
            products: [
              {
                name: 'Debug Test Product',
                desc: 'Debug Test Product Description',
                unit_price: 1,
                quantity: 1,
                product_sku: 'debug_test_sku'
              }
            ]
          },
          payment_method: {
            type: 'card'
          },
          return_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel'
        };

        const apiResponse = await fetch('https://api.airwallex.com/api/v1/pa/payment_intents/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'x-api-version': '2020-06-30',
            'Accept': 'application/json'
          },
          body: JSON.stringify(testRequest)
        });

        const apiResponseText = await apiResponse.text();
        let apiData;
        try {
          apiData = JSON.parse(apiResponseText);
        } catch (e) {
          apiData = { raw_response: apiResponseText };
        }

        const result = {
          method: method.name,
          success: apiResponse.ok,
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: Object.fromEntries(apiResponse.headers.entries()),
          data: apiData,
          authData: authData,
          description: method.description,
          requestHeaders: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
            'x-api-version': '2020-06-30'
          }
        };

        testResults.push(result);
        console.log(`${method.name} 結果:`, result);

      } catch (error) {
        testResults.push({
          method: method.name,
          success: false,
          error: error instanceof Error ? error.message : '未知錯誤',
          details: error,
          description: method.description
        });
        console.error(`${method.name} 錯誤:`, error);
      }
    }

    // 檢查 API 密鑰格式
    const apiKeyAnalysis = {
      length: AIRWALLEX_API_KEY.length,
      startsWithBearer: AIRWALLEX_API_KEY.startsWith('Bearer '),
      containsSpaces: AIRWALLEX_API_KEY.includes(' '),
      isBase64Like: /^[A-Za-z0-9+/=]+$/.test(AIRWALLEX_API_KEY),
      hasSpecialChars: /[^A-Za-z0-9+/=]/.test(AIRWALLEX_API_KEY)
    };

    // 生成建議
    const recommendations = [];
    
    if (apiKeyAnalysis.startsWithBearer) {
      recommendations.push('⚠️ API 密鑰不應包含 "Bearer " 前綴，只使用密鑰本身');
    }
    
    if (apiKeyAnalysis.containsSpaces) {
      recommendations.push('⚠️ API 密鑰包含空格，請檢查是否有額外的空格或換行符');
    }
    
    if (apiKeyAnalysis.length < 50) {
      recommendations.push('⚠️ API 密鑰長度較短，請確認是否完整');
    }

    const successfulMethod = testResults.find(r => r.success);
    if (successfulMethod) {
      recommendations.push(`✅ 建議使用 "${successfulMethod.method}" 認證方式`);
    } else {
      recommendations.push('❌ 所有認證方式都失敗，請檢查 API 密鑰是否正確');
      recommendations.push('🔗 請聯繫 Airwallex 技術支援確認 API 密鑰狀態');
    }

    return NextResponse.json({
      success: !!successfulMethod,
      envCheck,
      apiKeyAnalysis,
      testResults,
      recommendations,
      timestamp: new Date().toISOString(),
      hongKongTime: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Hong_Kong' })
    });

  } catch (error) {
    console.error('Airwallex 診斷錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '診斷過程失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

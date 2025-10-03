import { NextRequest, NextResponse } from 'next/server';

// 測試 Airwallex API 連接
export async function GET(request: NextRequest) {
  try {
    const AIRWALLEX_API_KEY = process.env.AIRWALLEX_API_KEY;
    const AIRWALLEX_CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID;
    const AIRWALLEX_API_URL = process.env.AIRWALLEX_API_URL;

    console.log('🔍 測試 Airwallex 連接...');
    console.log('API Key 長度:', AIRWALLEX_API_KEY?.length || 0);
    console.log('Client ID:', AIRWALLEX_CLIENT_ID);
    console.log('API URL:', AIRWALLEX_API_URL);

    if (!AIRWALLEX_API_KEY || !AIRWALLEX_CLIENT_ID) {
      return NextResponse.json({
        success: false,
        error: '缺少 Airwallex 環境變數',
        details: {
          hasApiKey: !!AIRWALLEX_API_KEY,
          hasClientId: !!AIRWALLEX_CLIENT_ID,
          apiKeyLength: AIRWALLEX_API_KEY?.length || 0
        }
      });
    }

    // 測試簡單的 API 調用
    const testRequest = {
      request_id: `test_${Date.now()}`,
      amount: 1,
      currency: 'HKD',
      merchant_order_id: `test_order_${Date.now()}`,
      order: {
        products: [
          {
            name: 'Test Product',
            desc: 'Test Product Description',
            unit_price: 1,
            quantity: 1,
            product_sku: 'test_sku'
          }
        ]
      },
      payment_method: {
        type: 'card'
      },
      return_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel'
    };

    console.log('發送測試請求:', JSON.stringify(testRequest, null, 2));

    const response = await fetch(AIRWALLEX_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIRWALLEX_API_KEY}`,
        'x-client-id': AIRWALLEX_CLIENT_ID,
        'x-api-version': '2020-06-30',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    const responseText = await response.text();
    console.log('響應狀態:', response.status);
    console.log('響應頭:', Object.fromEntries(response.headers.entries()));
    console.log('響應內容:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw_response: responseText };
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      request: {
        url: AIRWALLEX_API_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AIRWALLEX_API_KEY.substring(0, 10)}...`,
          'x-client-id': AIRWALLEX_CLIENT_ID,
          'x-api-version': '2020-06-30'
        }
      }
    });

  } catch (error) {
    console.error('Airwallex 測試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

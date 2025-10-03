import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

// 模擬 Airwallex 支付 API (用於測試)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, description, return_url, cancel_url } = body;

    // 驗證輸入
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: '無效的付款金額' },
        { status: 400 }
      );
    }

    // 生成模擬的支付意圖 ID
    const mockIntentId = `mock_intent_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const mockRequestId = `mock_request_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // 模擬 Airwallex 回應
    const mockResponse = {
      id: mockIntentId,
      request_id: mockRequestId,
      amount: amount,
      currency: currency.toUpperCase(),
      status: 'requires_payment_method',
      merchant_order_id: `hanami_order_${Date.now()}`,
      order: {
        products: [
          {
            name: description,
            desc: description,
            unit_price: amount,
            quantity: 1,
            product_sku: 'hanami_test_product'
          }
        ]
      },
      payment_method: {
        type: 'card'
      },
      next_action: {
        type: 'redirect_to_url',
        redirect_to_url: {
          url: `${return_url}?payment_intent_id=${mockIntentId}&status=succeeded&amount=${amount}&currency=${currency}`,
          return_url: return_url,
          cancel_url: cancel_url
        }
      },
      metadata: {
        source: 'hanami_mock_payment',
        description: description,
        mock: true
      },
      created_at: new Date().toISOString()
    };

    console.log('模擬 Airwallex 回應:', JSON.stringify(mockResponse, null, 2));

    // 記錄付款到資料庫
    const supabase = getSaasSupabaseClient();
    const { error: dbError } = await (supabase as any)
      .from('payment_records')
      .insert({
        payment_method: 'airwallex',
        amount: amount,
        currency: currency,
        description: description,
        airwallex_intent_id: mockIntentId,
        airwallex_request_id: mockRequestId,
        status: 'pending',
        checkout_url: mockResponse.next_action.redirect_to_url.url,
        return_url: return_url,
        cancel_url: cancel_url,
        created_at: new Date().toISOString(),
        metadata: {
          mock: true,
          original_description: description
        }
      });

    if (dbError) {
      console.error('資料庫記錄錯誤:', dbError);
      // 不中斷流程，繼續返回模擬回應
    }

    // 返回成功回應
    return NextResponse.json({
      success: true,
      payment_intent_id: mockIntentId,
      checkout_url: mockResponse.next_action.redirect_to_url.url,
      status: mockResponse.status,
      amount: mockResponse.amount,
      currency: mockResponse.currency,
      mock: true,
      message: '這是模擬支付，不會產生實際的付款'
    });

  } catch (error) {
    console.error('模擬支付處理錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '模擬支付處理失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}

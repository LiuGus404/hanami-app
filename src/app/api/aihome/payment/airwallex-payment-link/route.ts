import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

// Airwallex Payment Link API 配置
const AIRWALLEX_BASE_URL = 'https://api.airwallex.com/api/v1';
const AIRWALLEX_AUTH_URL = `${AIRWALLEX_BASE_URL}/authentication/login`;
const AIRWALLEX_PAYMENT_LINK_URL = `${AIRWALLEX_BASE_URL}/pa/payment_links/create`;
const AIRWALLEX_API_KEY = process.env.AIRWALLEX_API_KEY;
const AIRWALLEX_CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID;

interface PaymentLinkRequest {
  amount: number;
  currency: string;
  description: string;
  return_url: string;
  cancel_url: string;
}

export async function POST(request: NextRequest) {
  try {
    // 檢查環境變數
    if (!AIRWALLEX_API_KEY || !AIRWALLEX_CLIENT_ID) {
      console.error('Airwallex 環境變數未設置');
      return NextResponse.json(
        { success: false, error: 'Airwallex 配置錯誤' },
        { status: 500 }
      );
    }

    const body: PaymentLinkRequest = await request.json();
    const { amount, currency, description, return_url, cancel_url } = body;

    // 驗證輸入
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: '無效的付款金額' },
        { status: 400 }
      );
    }

    // 第一步：獲取 access token
    console.log('🔐 獲取 Airwallex access token...');
    const authResponse = await fetch(AIRWALLEX_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AIRWALLEX_API_KEY,
        'x-client-id': AIRWALLEX_CLIENT_ID
      }
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.error('認證失敗:', authError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Airwallex 認證失敗',
          details: authError
        },
        { status: authResponse.status }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.token;
    console.log('✅ Access token 獲取成功');

    // 第二步：創建 Payment Link
    const requestId = `hanami_link_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // 構建 Airwallex Payment Link 請求
    const airwallexRequest = {
      request_id: requestId,
      amount: amount,
      currency: currency.toUpperCase(),
      merchant_order_id: `hanami_order_${Date.now()}`,
      title: description, // 必填欄位
      reusable: false, // 必填欄位，設為一次性使用
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
      // Payment Link 特定配置
      pricing_options: {
        type: 'FIXED' // 固定價格
      },
      return_url: return_url,
      cancel_url: cancel_url,
      metadata: {
        source: 'hanami_test_payment',
        description: description
      }
    };

    console.log('發送 Airwallex Payment Link 請求:', JSON.stringify(airwallexRequest, null, 2));

    // 調用 Airwallex Payment Link API
    const airwallexResponse = await fetch(AIRWALLEX_PAYMENT_LINK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-api-version': '2020-06-30',
        'Accept': 'application/json'
      },
      body: JSON.stringify(airwallexRequest)
    });

    const airwallexData = await airwallexResponse.json();
    
    console.log('Airwallex Payment Link 回應:', JSON.stringify(airwallexData, null, 2));

    if (!airwallexResponse.ok) {
      console.error('Airwallex Payment Link API 錯誤:', airwallexData);
      return NextResponse.json(
        { 
          success: false, 
          error: airwallexData.message || 'Airwallex Payment Link 創建失敗',
          details: airwallexData
        },
        { status: airwallexResponse.status }
      );
    }

    // 記錄付款到資料庫
    const supabase = getSaasSupabaseClient();
    const { error: dbError } = await supabase
      .from('payment_records')
      .insert({
        payment_method: 'airwallex',
        amount: amount,
        currency: currency,
        description: description,
        airwallex_intent_id: airwallexData.id,
        airwallex_request_id: requestId,
        status: 'pending',
        checkout_url: airwallexData.url, // Payment Link 使用 url 而不是 next_action
        return_url: return_url,
        cancel_url: cancel_url,
        created_at: new Date().toISOString()
      } as any);

    if (dbError) {
      console.error('資料庫記錄錯誤:', dbError);
      // 不中斷流程，繼續返回 Airwallex 回應
    }

    // 返回成功回應
    return NextResponse.json({
      success: true,
      payment_link_id: airwallexData.id,
      checkout_url: airwallexData.url,
      status: airwallexData.status,
      amount: airwallexData.amount,
      currency: airwallexData.currency
    });

  } catch (error) {
    console.error('Airwallex Payment Link 處理錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '支付處理失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    );
  }
}

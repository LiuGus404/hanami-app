import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

// 簡化的 Airwallex API 配置
// 根據環境選擇正確的 API URL
// 注意：您的憑證是生產環境的，所以我們使用生產 API
const AIRWALLEX_BASE_URL = 'https://api.airwallex.com/api/v1';  // Production API
const AIRWALLEX_AUTH_URL = `${AIRWALLEX_BASE_URL}/authentication/login`;

interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  return_url: string;
  cancel_url: string;
  // 用戶預填信息
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 在函數內部讀取環境變數
    const AIRWALLEX_API_KEY = process.env.AIRWALLEX_API_KEY;
    const AIRWALLEX_CLIENT_ID = process.env.AIRWALLEX_CLIENT_ID;
    
    // 定義公網可訪問的 URL
    const publicReturnUrl = 'https://www.hanamiecho.com/aihome/payment-success';
    const publicCancelUrl = 'https://www.hanamiecho.com/aihome/payment-cancel';
    
    // 調試環境變數
    console.log('🔍 檢查環境變數:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('使用 API URL:', AIRWALLEX_BASE_URL);
    console.log('AIRWALLEX_API_KEY 存在:', !!AIRWALLEX_API_KEY);
    console.log('AIRWALLEX_CLIENT_ID 存在:', !!AIRWALLEX_CLIENT_ID);
    console.log('AIRWALLEX_API_KEY 長度:', AIRWALLEX_API_KEY?.length || 0);
    console.log('AIRWALLEX_CLIENT_ID 長度:', AIRWALLEX_CLIENT_ID?.length || 0);
    
    // 檢查環境變數
    if (!AIRWALLEX_API_KEY || !AIRWALLEX_CLIENT_ID) {
      console.error('❌ 環境變數缺失:');
      console.error('AIRWALLEX_API_KEY:', AIRWALLEX_API_KEY ? '已設置' : '未設置');
      console.error('AIRWALLEX_CLIENT_ID:', AIRWALLEX_CLIENT_ID ? '已設置' : '未設置');
      return NextResponse.json(
        { success: false, error: 'Airwallex 配置錯誤 - 環境變數缺失' },
        { status: 500 }
      );
    }

    let body: PaymentRequest;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON 解析錯誤:', jsonError);
      return NextResponse.json(
        { success: false, error: '無效的 JSON 格式' },
        { status: 400 }
      );
    }
    
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
      console.error('使用的 API URL:', AIRWALLEX_AUTH_URL);
      console.error('API Key 前8位:', AIRWALLEX_API_KEY?.substring(0, 8) + '...');
      console.error('Client ID:', AIRWALLEX_CLIENT_ID);
      
      // 暫時禁用回退模式，顯示真實錯誤以便調試
      return NextResponse.json(
        { 
          success: false, 
          error: 'Airwallex 認證失敗 - 請檢查 API Key 和 Client ID',
          details: authError,
          debug_info: {
            api_url: AIRWALLEX_AUTH_URL,
            api_key_prefix: AIRWALLEX_API_KEY?.substring(0, 8) + '...',
            client_id: AIRWALLEX_CLIENT_ID,
            environment: process.env.NODE_ENV,
            message: '請確認您有有效的 Airwallex 測試憑證。您可以在 Airwallex 開發者門戶獲取新的憑證。'
          }
        },
        { status: authResponse.status }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.token;
    console.log('✅ Access token 獲取成功');

    // 第二步：測試 API 連接
    console.log('🔍 測試 API 連接...');
    const testResponse = await fetch(`${AIRWALLEX_BASE_URL}/balances/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ API 連接測試成功:', testData);
    } else {
      const testError = await testResponse.text();
      console.error('❌ API 連接測試失敗:', testError);
    }

    // 第三步：創建 Payment Intent（根據 Airwallex Postman 集合）
    const requestId = `hanami_intent_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    try {
      // 根據 Airwallex Postman 集合創建 Payment Intent
      // 使用公網可訪問的 URL 作為 return_url
      
      const paymentIntentRequest = {
        request_id: requestId,
        amount: amount,
        currency: currency.toUpperCase(),
        merchant_order_id: `hanami_order_${Date.now()}`,
        metadata: {
          source: 'hanami_payment_system',
          description: description,
          request_id: requestId,
          local_test: true // 標記為本地測試
        },
        order: {
          products: [
            {
              name: description,
              desc: description,
              unit_price: amount,
              quantity: 1,
              sku: 'hanami_test_product'
            }
          ],
          type: 'Hanami Music Lesson Payment'
        },
        return_url: publicReturnUrl,
        cancel_url: publicCancelUrl,
        // 添加用戶預填信息
        ...(body.customer_name || body.customer_email ? {
          customer: {
            ...(body.customer_name && { first_name: body.customer_name.split(' ')[0] || body.customer_name }),
            ...(body.customer_name && body.customer_name.split(' ').length > 1 && { last_name: body.customer_name.split(' ').slice(1).join(' ') }),
            ...(body.customer_email && { email: body.customer_email }),
            ...(body.customer_phone && { phone_number: body.customer_phone })
          }
        } : {})
      };

      console.log('嘗試創建 Payment Intent (根據 Postman 集合):', JSON.stringify(paymentIntentRequest, null, 2));

      const paymentIntentResponse = await fetch(`${AIRWALLEX_BASE_URL}/pa/payment_intents/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-api-version': '2020-06-30',
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentIntentRequest)
      });

      const paymentIntentData = await paymentIntentResponse.json();
      console.log('Payment Intent 回應:', JSON.stringify(paymentIntentData, null, 2));

      if (paymentIntentResponse.ok) {
        // Payment Intent 創建成功，不需要 confirm，讓用戶在結帳頁面選擇支付方式
        console.log('✅ Payment Intent 創建成功，狀態:', paymentIntentData.status);
        // 成功創建 Payment Intent
        const supabase = getSaasSupabaseClient();
        
        // 根據 Airwallex 文檔，構建正確的結帳 URL
        // 檢查是否有 next_action 中的 redirect_to_url
        let finalCheckoutUrl;
        
        if (paymentIntentData.next_action?.redirect_to_url?.url) {
          finalCheckoutUrl = paymentIntentData.next_action.redirect_to_url.url;
          console.log('✅ 使用 next_action 中的 redirect_to_url:', finalCheckoutUrl);
        } else {
          // 根據 Airwallex 文檔，使用正確的結帳 URL 格式
          // 注意：Airwallex 結帳頁面可能需要特定的 URL 格式
          // 嘗試不同的 URL 格式
          if (paymentIntentData.client_secret) {
            // 格式 1: 使用 client_secret 參數
            finalCheckoutUrl = `https://checkout.airwallex.com/pay/${paymentIntentData.id}?client_secret=${paymentIntentData.client_secret}`;
          } else {
            // 格式 2: 僅使用 Payment Intent ID
            finalCheckoutUrl = `https://checkout.airwallex.com/pay/${paymentIntentData.id}`;
          }
          console.log('✅ 使用標準結帳 URL 格式:', finalCheckoutUrl);
        }
        
        console.log('✅ Payment Intent 創建成功，最終結帳 URL:', finalCheckoutUrl);
        
        // 額外檢查：如果結帳 URL 仍然有問題，我們可以嘗試使用 Payment Links API
        console.log('🔍 Payment Intent 詳細信息:', {
          id: paymentIntentData.id,
          status: paymentIntentData.status,
          client_secret: paymentIntentData.client_secret ? '已提供' : '未提供',
          next_action: paymentIntentData.next_action,
          available_payment_method_types: paymentIntentData.available_payment_method_types
        });
        
        // 嘗試確認 Payment Intent 以獲取正確的結帳 URL
        try {
          console.log('🔄 嘗試確認 Payment Intent...');
          const confirmResponse = await fetch(`${AIRWALLEX_BASE_URL}/pa/payment_intents/${paymentIntentData.id}/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'x-api-version': '2020-06-30',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              request_id: `hanami_confirm_${Date.now()}_${Math.random().toString(36).substring(2)}`
            })
          });
          
          const confirmData = await confirmResponse.json();
          console.log('Payment Intent 確認回應:', JSON.stringify(confirmData, null, 2));
          
          if (confirmResponse.ok && confirmData.next_action?.redirect_to_url?.url) {
            finalCheckoutUrl = confirmData.next_action.redirect_to_url.url;
            console.log('✅ 使用確認後的 redirect_to_url:', finalCheckoutUrl);
          }
        } catch (confirmError) {
          console.log('❌ Payment Intent 確認失敗:', confirmError);
        }
        
        // 嘗試創建 Payment Link 作為備用方案
        let paymentLinkUrl = null;
        try {
          console.log('🔄 嘗試創建 Payment Link 作為備用方案...');
          
          const paymentLinkRequest = {
            request_id: `hanami_link_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            amount: amount,
            currency: currency.toUpperCase(),
            title: description,
            description: description,
            reusable: false, // 添加缺少的 reusable 參數
            metadata: {
              source: 'hanami_payment_system',
              description: description,
              payment_intent_id: paymentIntentData.id
            },
            return_url: publicReturnUrl,
            cancel_url: publicCancelUrl,
            // 添加用戶預填信息到 Payment Link
            ...(body.customer_name || body.customer_email ? {
              customer: {
                ...(body.customer_name && { first_name: body.customer_name.split(' ')[0] || body.customer_name }),
                ...(body.customer_name && body.customer_name.split(' ').length > 1 && { last_name: body.customer_name.split(' ').slice(1).join(' ') }),
                ...(body.customer_email && { email: body.customer_email }),
                ...(body.customer_phone && { phone_number: body.customer_phone })
              }
            } : {})
          };
          
          const paymentLinkResponse = await fetch(`${AIRWALLEX_BASE_URL}/pa/payment_links/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'x-api-version': '2020-06-30',
              'Accept': 'application/json'
            },
            body: JSON.stringify(paymentLinkRequest)
          });
          
          const paymentLinkData = await paymentLinkResponse.json();
          console.log('Payment Link 回應:', JSON.stringify(paymentLinkData, null, 2));
          
          if (paymentLinkResponse.ok && paymentLinkData.url) {
            paymentLinkUrl = paymentLinkData.url;
            console.log('✅ Payment Link 創建成功:', paymentLinkUrl);
          } else {
            console.log('❌ Payment Link 創建失敗:', paymentLinkData);
          }
        } catch (linkError) {
          console.log('❌ Payment Link 創建錯誤:', linkError);
        }

        const { error: dbError } = await supabase
          .from('payment_records')
          .insert({
            payment_method: 'airwallex',
            amount: amount,
            currency: currency,
            description: description,
            airwallex_intent_id: paymentIntentData.id,
            airwallex_request_id: requestId,
            status: 'pending',
            checkout_url: finalCheckoutUrl,
            return_url: publicReturnUrl,
            cancel_url: publicCancelUrl,
            created_at: new Date().toISOString(),
            metadata: {
              source: 'hanami_payment_intent',
              description: description,
              payment_intent_created: true,
              payment_intent_id: paymentIntentData.id,
              payment_intent_status: paymentIntentData.status,
              client_secret: paymentIntentData.client_secret ? '已提供' : '未提供',
              local_test: true
            }
          } as any);

        if (dbError) {
          console.error('資料庫記錄錯誤:', dbError);
        }

        // 使用真實的 Airwallex 結帳頁面
        let checkoutUrl = paymentLinkUrl || finalCheckoutUrl;
        console.log('🚀 使用真實 Airwallex 結帳頁面:', checkoutUrl);
        console.log('URL 類型:', paymentLinkUrl ? 'Payment Link' : 'Payment Intent');
        
        return NextResponse.json({
          success: true,
          payment_intent_id: paymentIntentData.id, // Payment Intent ID
          checkout_url: checkoutUrl,
          status: paymentIntentData.status,
          amount: paymentIntentData.amount,
          currency: paymentIntentData.currency,
          message: '真實 Payment Intent 創建成功！',
          is_test_mode: false, // 現在使用真實的 Airwallex API
          debug_info: {
            payment_intent_created: paymentIntentResponse.ok,
            payment_intent_id: paymentIntentData.id,
            payment_intent_status: paymentIntentData.status,
            client_secret: paymentIntentData.client_secret ? '已提供' : '未提供',
            final_checkout_url: finalCheckoutUrl,
            payment_link_created: !!paymentLinkUrl,
            payment_link_url: paymentLinkUrl,
            checkout_url_type: paymentLinkUrl ? 'payment_link' : 'payment_intent',
            environment: process.env.NODE_ENV,
            real_airwallex: true,
            local_testing: false
          }
        });
      } else {
        // Payment Intent 創建失敗，使用模擬方式
        console.log('Payment Intent 創建失敗，使用模擬方式');
        console.log('Payment Intent 錯誤回應:', paymentIntentData);
        throw new Error('Payment Intent 創建失敗');
      }
    } catch (paymentError) {
      console.log('Payment Intent 創建失敗，使用模擬方式:', paymentError);
      
      // 記錄付款到資料庫
      const supabase = getSaasSupabaseClient();
      const { error: dbError } = await supabase
        .from('payment_records')
        .insert({
          payment_method: 'airwallex',
          amount: amount,
          currency: currency,
          description: description,
          airwallex_intent_id: requestId,
          airwallex_request_id: requestId,
          status: 'pending',
          checkout_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/aihome/test-payment/success?payment_intent_id=${requestId}&amount=${amount}&currency=${currency}`,
          return_url: publicReturnUrl,
          cancel_url: publicCancelUrl,
          created_at: new Date().toISOString(),
          metadata: {
            source: 'hanami_simple_payment',
            description: description,
            api_test_successful: testResponse.ok,
            payment_intent_failed: true
          }
        } as any);

      if (dbError) {
        console.error('資料庫記錄錯誤:', dbError);
      }

      // 返回成功回應 - 使用測試模式
      return NextResponse.json({
        success: true,
        payment_intent_id: requestId,
        checkout_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/aihome/test-payment/success?payment_intent_id=${requestId}&amount=${amount}&currency=${currency}`,
        status: 'requires_payment_method',
        amount: amount,
        currency: currency,
        message: 'Airwallex 測試模式 - 請在真實環境中配置完整參數',
        api_test_result: testResponse.ok ? 'success' : 'failed',
        is_test_mode: true
      });
    }

  } catch (error) {
    console.error('Airwallex 處理錯誤:', error);
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

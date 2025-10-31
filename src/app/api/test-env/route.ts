import { NextRequest, NextResponse } from 'next/server';

// 測試環境變數 API 路由
export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      // 客戶端可讀取的環境變數
      NEXT_PUBLIC_SUPABASE_SAAS_URL: process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL ? '已設置' : '未設置',
      NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY ? '已設置' : '未設置',
      NEXT_PUBLIC_INGRESS_SECRET: process.env.NEXT_PUBLIC_INGRESS_SECRET ? '已設置' : '未設置',
      NEXT_PUBLIC_N8N_JWT_TOKEN: process.env.NEXT_PUBLIC_N8N_JWT_TOKEN ? '已設置' : '未設置',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '未設置',
      
      // 服務端專用環境變數
      SUPABASE_SAAS_SERVICE_ROLE_KEY: process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY ? '已設置' : '未設置',
      INGRESS_SECRET: process.env.INGRESS_SECRET ? '已設置' : '未設置',
      N8N_JWT_SECRET: process.env.N8N_JWT_SECRET ? '已設置' : '未設置',
      N8N_INGRESS_WEBHOOK_URL: process.env.N8N_INGRESS_WEBHOOK_URL ? '已設置' : '未設置',
    };

    console.log('🔍 [API] 環境變數檢查:', envCheck);

    return NextResponse.json({
      success: true,
      message: '環境變數檢查完成',
      envCheck
    });

  } catch (error) {
    console.error('❌ [API] 環境變數檢查失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    );
  }
}
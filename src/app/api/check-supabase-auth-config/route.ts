import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    console.log('檢查 Supabase Auth 配置...');

    // 1. 檢查環境變數
    const envCheck = {
      supabaseUrl: {
        exists: !!supabaseUrl,
        value: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : '未設置'
      },
      supabaseServiceKey: {
        exists: !!supabaseServiceKey,
        value: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : '未設置'
      }
    };

    // 2. 檢查 Supabase 連接
    let connectionTest: { success: boolean; error: string | null } = { success: false, error: null };
    try {
      const { data, error } = await supabase.from('registration_requests').select('count').limit(1);
      connectionTest = { success: !error, error: error?.message || null };
    } catch (error) {
      connectionTest = { success: false, error: error instanceof Error ? error.message : '未知錯誤' };
    }

    // 3. 檢查 Auth 設置
    let authSettings: { success: boolean; data: number | null; error: string | null } = { success: false, data: null, error: null };
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      authSettings = { success: !error, data: data?.users?.length ?? null, error: error?.message || null };
    } catch (error) {
      authSettings = { success: false, data: null, error: error instanceof Error ? error.message : '未知錯誤' };
    }

    // 4. 檢查 SMTP 設置（如果可用）
    let smtpCheck: { available: boolean; error: string | null } = { available: false, error: null };
    try {
      // 嘗試獲取 SMTP 設置（這可能需要特定的 API）
      smtpCheck = { available: false, error: 'SMTP 設置檢查需要額外配置' };
    } catch (error) {
      smtpCheck = { available: false, error: error instanceof Error ? error.message : '未知錯誤' };
    }

    // 5. 檢查 Auth 配置
    let authConfig: { success: boolean; data: object | null; error: string | null } = { success: false, data: null, error: null };
    try {
      authConfig = { 
        success: true, 
        data: {
          emailConfirmations: '需要檢查 Supabase Dashboard',
          emailTemplates: '需要檢查 Supabase Dashboard',
          smtpSettings: '需要檢查 Supabase Dashboard'
        },
        error: null
      };
    } catch (error) {
      authConfig = { success: false, data: null, error: error instanceof Error ? error.message : '未知錯誤' };
    }

    const result = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      connection: connectionTest,
      auth: authSettings,
      smtp: smtpCheck,
      config: authConfig,
      recommendations: [
        '1. 檢查 Supabase Dashboard > Authentication > Settings',
        '2. 確認 Email Auth 已啟用',
        '3. 檢查 SMTP 設置是否正確',
        '4. 確認 Email Templates 已配置',
        '5. 檢查 Site URL 設置',
        '6. 確認 Redirect URLs 包含你的域名'
      ]
    };

    console.log('Supabase Auth 配置檢查結果:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('檢查 Supabase Auth 配置錯誤:', error);
    return NextResponse.json({
      error: error.message || '檢查 Supabase Auth 配置時發生錯誤'
    }, { status: 500 });
  }
} 
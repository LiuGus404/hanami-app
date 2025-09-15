import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();

    // 檢查 saas_users 表是否存在
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'saas_users');

    if (tablesError) {
      console.error('檢查表結構失敗:', tablesError);
      return NextResponse.json({
        success: false,
        error: '無法檢查表結構',
        details: tablesError.message
      }, { status: 500 });
    }

    const tableExists = tables && tables.length > 0;

    if (!tableExists) {
      // 創建 saas_users 表
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.saas_users (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT NOT NULL,
          full_name TEXT,
          nickname TEXT,
          phone TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'user',
          subscription_status TEXT DEFAULT 'free',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: createTableSQL
      });

      if (createError) {
        console.error('創建表失敗:', createError);
        return NextResponse.json({
          success: false,
          error: '無法創建 saas_users 表',
          details: createError.message
        }, { status: 500 });
      }

      // 設置 RLS 策略
      const rlsSQL = `
        ALTER TABLE public.saas_users ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own profile" ON public.saas_users
          FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON public.saas_users
          FOR UPDATE USING (auth.uid() = id);
        
        CREATE POLICY "Users can insert own profile" ON public.saas_users
          FOR INSERT WITH CHECK (auth.uid() = id);
      `;

      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: rlsSQL
      });

      if (rlsError) {
        console.error('設置 RLS 失敗:', rlsError);
        return NextResponse.json({
          success: false,
          error: '無法設置 RLS 策略',
          details: rlsError.message
        }, { status: 500 });
      }
    }

    // 檢查表結構
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'saas_users');

    if (columnsError) {
      console.error('檢查列結構失敗:', columnsError);
      return NextResponse.json({
        success: false,
        error: '無法檢查列結構',
        details: columnsError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tableExists: tableExists,
      columns: columns || [],
      message: tableExists ? '表已存在' : '表已創建'
    });

  } catch (error: any) {
    console.error('檢查表 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

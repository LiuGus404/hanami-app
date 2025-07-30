import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const email = searchParams.get('email');

    if (!table || !email) {
      return NextResponse.json({
        error: '缺少必要參數: table, email'
      }, { status: 400 });
    }

    let query;
    let emailField;

    switch (table) {
      case 'hanami_admin':
        emailField = 'admin_email';
        break;
      case 'hanami_employee':
        emailField = 'teacher_email';
        break;
      case 'Hanami_Students':
        // 學生表可能有多個郵箱欄位
        query = supabase
          .from(table)
          .select('*')
          .or(`student_email.eq.${email},parent_email.eq.${email}`);
        break;
      default:
        return NextResponse.json({
          error: '不支援的表名'
        }, { status: 400 });
    }

    if (!query) {
      if (emailField) {
        query = supabase
          .from(table)
          .select('*')
          .eq(emailField, email);
      } else {
        query = supabase
          .from(table)
          .select('*');
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error(`查詢 ${table} 表錯誤:`, error);
      return NextResponse.json({
        error: `查詢失敗: ${error.message}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('測試API錯誤:', error);
    return NextResponse.json({
      error: error.message || '查詢時發生錯誤'
    }, { status: 500 });
  }
} 
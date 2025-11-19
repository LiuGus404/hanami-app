import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/check-rls-policies
 * 檢查指定表的 RLS 政策，找出可能導致無限遞迴的問題
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table') || 'Hanami_Students';

    console.log(`檢查表 ${tableName} 的 RLS 政策...`);

    // 使用 REST API 直接查詢 pg_policies（如果可用）
    // 否則使用 SQL 查詢
    let policies: any[] = [];
    let policiesError: any = null;

    try {
      // 嘗試使用 REST API 查詢
      const policiesUrl = `${supabaseUrl}/rest/v1/pg_policies?tablename=eq.${tableName}&select=*`;
      const policiesResponse = await fetch(policiesUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });

      if (policiesResponse.ok) {
        policies = await policiesResponse.json();
      } else {
        throw new Error(`REST API 查詢失敗: ${policiesResponse.status}`);
      }
    } catch (restError: any) {
      console.log('REST API 查詢失敗，嘗試使用 SQL 查詢...', restError);
      
      // 使用 SQL 查詢
      const sqlQuery = `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE tablename = '${tableName}'
        ORDER BY policyname;
      `;

      try {
        const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
          sql: sqlQuery
        });

        if (sqlError) throw sqlError;
        policies = sqlData || [];
      } catch (sqlError: any) {
        policiesError = sqlError;
        console.error('SQL 查詢也失敗:', sqlError);
      }
    }

    if (policiesError && policies.length === 0) {
      console.error('查詢 RLS 政策失敗:', policiesError);
      
      return NextResponse.json({
        success: false,
        error: '無法查詢 RLS 政策',
        details: policiesError.message,
        hint: '請在 Supabase Dashboard 的 SQL Editor 中手動執行 migrations/2025-01-23_check_rls_policies.sql 來檢查 RLS 政策',
        manualQuery: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies
          WHERE tablename = '${tableName}'
          ORDER BY policyname;
        `
      }, { status: 500 });
    }

    // 檢查 RLS 是否啟用
    let rlsStatus: any = null;
    let rlsError: any = null;
    try {
      const result = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            relname,
            relforcerowsecurity as rls_enabled
          FROM pg_class
          WHERE relname = '${tableName}'
          AND relnamespace = 'public'::regnamespace;
        `
      });
      rlsStatus = result.data;
      rlsError = result.error;
    } catch (err) {
      // 備用查詢
      rlsError = { message: '無法查詢 RLS 狀態' };
    }

    // 分析政策中可能導致遞迴的關鍵字
    const policiesArray = Array.isArray(policies) ? policies : [];
    const potentialIssues: string[] = [];
    
    policiesArray.forEach((policy: any) => {
      const qual = policy.qual || '';
      const withCheck = policy.with_check || '';
      const combined = qual + ' ' + withCheck;
      
      // 檢查是否調用了可能導致遞迴的函數
      if (combined.includes('check_user_permission')) {
        potentialIssues.push(`政策 "${policy.policyname}" 使用了 check_user_permission 函數，可能導致遞迴`);
      }
      
      if (combined.includes('Hanami_Students')) {
        potentialIssues.push(`政策 "${policy.policyname}" 在條件中引用了 Hanami_Students 表，可能導致遞迴`);
      }
      
      if (combined.includes('hanami_org_identities')) {
        potentialIssues.push(`政策 "${policy.policyname}" 使用了 hanami_org_identities 表，可能導致遞迴`);
      }
    });

    return NextResponse.json({
      success: true,
      table: tableName,
      rlsEnabled: rlsStatus?.[0]?.rls_enabled ?? true,
      policiesCount: policiesArray.length,
      policies: policiesArray.map((p: any) => ({
        name: p.policyname,
        command: p.cmd,
        roles: p.roles,
        qual: p.qual,
        with_check: p.with_check,
        permissive: p.permissive
      })),
      potentialIssues,
      recommendations: potentialIssues.length > 0 ? [
        '發現可能導致無限遞迴的 RLS 政策',
        '建議：',
        '1. 檢查 check_user_permission 函數是否在內部查詢 Hanami_Students 表',
        '2. 考慮使用 SECURITY DEFINER 函數來更新學生資料，完全繞過 RLS',
        '3. 或者修改 RLS 政策，避免在政策中查詢同一張表'
      ] : [
        '未發現明顯的遞迴問題',
        '如果仍然遇到無限遞迴錯誤，可能是 RLS 政策中的函數內部有問題'
      ]
    });

  } catch (error: any) {
    console.error('檢查 RLS 政策失敗:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || '檢查 RLS 政策時發生錯誤',
      hint: '請在 Supabase Dashboard 的 SQL Editor 中手動執行以下查詢：',
      manualQuery: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE tablename = 'Hanami_Students'
        ORDER BY policyname;
      `
    }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('開始測試資料庫連接...');
    
    // 1. 測試基本連接
    const { data: connectionTest, error: connectionError } = await supabase
      .from('hanami_media_quota_levels')
      .select('count(*)')
      .limit(1);
    
    if (connectionError) {
      console.error('資料庫連接測試失敗:', connectionError);
      return NextResponse.json({
        success: false,
        error: '資料庫連接失敗',
        details: connectionError
      }, { status: 500 });
    }
    
    console.log('資料庫連接成功');
    
    // 2. 檢查表結構 (簡化檢查)
    let columnsError = null;
    try {
      const { data: testData, error: testError } = await supabase
        .from('hanami_media_quota_levels')
        .select('*')
        .limit(1);
      
      if (testError) {
        columnsError = testError;
      }
    } catch (error) {
      columnsError = { message: '無法獲取表結構' };
    }
    
    // 3. 獲取記錄數量
    const { count, error: countError } = await supabase
      .from('hanami_media_quota_levels')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('獲取記錄數量失敗:', countError);
    }
    
    // 4. 獲取前幾條記錄
    const { data: records, error: recordsError } = await supabase
      .from('hanami_media_quota_levels')
      .select('*')
      .limit(5);
    
    if (recordsError) {
      console.error('獲取記錄失敗:', recordsError);
    }
    
    // 5. 檢查 RLS 狀態 (簡化檢查)
    let rlsError = null;
    let rlsStatus = null;
    try {
      // 嘗試插入一條測試記錄來檢查 RLS
      const { error: insertError } = await supabase
        .from('hanami_media_quota_levels')
        .insert({
          level_name: 'test_rls_check',
          video_limit: 1,
          photo_limit: 1,
          storage_limit_mb: 1,
          video_size_limit_mb: 1,
          photo_size_limit_mb: 1,
          description: 'RLS 測試記錄',
          is_active: false
        });
      
      if (insertError) {
        rlsError = insertError;
        rlsStatus = 'RLS 可能已啟用';
      } else {
        rlsStatus = 'RLS 未啟用或允許插入';
        // 刪除測試記錄
        await supabase
          .from('hanami_media_quota_levels')
          .delete()
          .eq('level_name', 'test_rls_check');
      }
    } catch (error) {
      rlsError = { message: '無法檢查 RLS 狀態' };
    }
    
    return NextResponse.json({
      success: true,
      connection: '成功',
      tableExists: true,
      recordCount: count || 0,
      sampleRecords: records || [],
      rlsStatus: rlsStatus,
      errors: {
        columns: columnsError,
        count: countError,
        records: recordsError,
        rls: rlsError
      }
    });
    
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// 創建輔助函數來檢查表結構
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'create_table') {
      // 創建表的 SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.hanami_media_quota_levels (
          id UUID NOT NULL DEFAULT gen_random_uuid(),
          level_name TEXT NOT NULL UNIQUE,
          video_limit INTEGER NOT NULL DEFAULT 5,
          photo_limit INTEGER NOT NULL DEFAULT 10,
          storage_limit_mb INTEGER NOT NULL DEFAULT 250,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          video_size_limit_mb INTEGER NOT NULL DEFAULT 50,
          photo_size_limit_mb INTEGER NOT NULL DEFAULT 10,
          CONSTRAINT hanami_media_quota_levels_pkey PRIMARY KEY (id)
        );
      `;
      
      // 注意：這裡需要直接執行 SQL，但 Supabase 客戶端不支援 DDL
      // 建議在 Supabase SQL Editor 中執行
      
      return NextResponse.json({
        success: true,
        message: '請在 Supabase SQL Editor 中執行以下 SQL:',
        sql: createTableSQL
      });
    }
    
    if (action === 'insert_sample_data') {
      const { data, error } = await supabase
        .from('hanami_media_quota_levels')
        .insert([
          {
            level_name: '測試等級',
            video_limit: 10,
            photo_limit: 20,
            storage_limit_mb: 500,
            video_size_limit_mb: 50,
            photo_size_limit_mb: 10,
            description: '測試用配額等級',
            is_active: true
          }
        ])
        .select();
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: '插入測試資料失敗',
          details: error
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: '測試資料插入成功',
        data
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '未知操作'
    }, { status: 400 });
    
  } catch (error) {
    console.error('POST 請求處理錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '操作失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
} 